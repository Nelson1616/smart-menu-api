import { PrismaClient } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import SessionUserService from '../Services/SessionUserService';
import SessionService from '../Services/SessionService';
import SessionOrdersService from '../Services/SessionOrdersService';

const prisma = new PrismaClient();

class SocketController {
    private io : Server;

    private joinClientEvent = 'join';

    private makeOrderClientEvent = 'make_order';

    private helpWithOrderClientEvent = 'help_with_order';

    private notHelpWithOrderClientEvent = 'not_help_with_order';

    private callWaiterClientEvent = 'call_waiter';

    private errorEvent : string = 'error';

    private sessionUsersEvent : string = 'users';

    private sessionOrdersEvent : string = 'orders';

    private sessionUsersRoom(restaurantId : number, tableId : number) : string {
        return `restaurant_${restaurantId}_table_${tableId}_users`;
    }

    private sessionOrdersRoom(restaurantId : number, tableId : number) : string {
        return `restaurant_${restaurantId}_table_${tableId}_orders`;
    }

    constructor(io : Server) {
        this.io = io;

        this.init();
    }

    private init() {
        this.io.on('connection', async (socket) => {
            console.log(`user of id ${socket.id} connected`);
    
            socket.on('disconnect', () => {
                console.log(`user of id ${socket.id} disconnected`);
            });
        
            socket.on('message', (msg) => {
                console.log(`message from user ${socket.id}: ${msg}`);
                socket.broadcast.emit('message', `message from user ${socket.id}: ${msg}`);
            });

            socket.on(this.joinClientEvent, async data => {
                try {
                    console.log(`user trying to join ${socket.id}: ${JSON.stringify(data)}`);

                    const sessionUserId = data.session_user_id;

                    if (!sessionUserId) {
                        throw new Error('parametros inválidos');
                    }

                    await this.insertInSessionOrdersRoom(socket, sessionUserId);
                }
                catch (e) {
                    this.onError(socket, (e as Error).message);
                }
            });

            socket.on(this.makeOrderClientEvent, async data => {
                try {
                    console.log(`user trying to make order ${socket.id}: ${JSON.stringify(data)}`);

                    const sessionUserId = data.session_user_id;

                    const productId = data.product_id;

                    const quantity = data.quantity;

                    if (!sessionUserId || !productId || !quantity) {
                        throw new Error('parametros inválidos');
                    }

                    await this.makeOrder(sessionUserId, productId, quantity);
                }
                catch (e) {
                    this.onError(socket, (e as Error).message);
                }
            });

            socket.on(this.helpWithOrderClientEvent, async data => {
                try {
                    console.log(`user trying to help with order ${socket.id}: ${JSON.stringify(data)}`);

                    const sessionUserId = data.session_user_id;

                    const sessionOrderId = data.session_order_id;

                    if (!sessionUserId || !sessionOrderId) {
                        throw new Error('parametros inválidos');
                    }

                    await this.helpWithOrder(sessionUserId, sessionOrderId);
                }
                catch (e) {
                    this.onError(socket, (e as Error).message);
                }
            });

            socket.on(this.notHelpWithOrderClientEvent, async data => {
                try {
                    console.log(`user trying to not help with order ${socket.id}: ${JSON.stringify(data)}`);

                    const sessionUserId = data.session_user_id;

                    const sessionOrderId = data.session_order_id;

                    if (!sessionUserId || !sessionOrderId) {
                        throw new Error('parametros inválidos');
                    }

                    await this.notHelpWithOrder(sessionUserId, sessionOrderId);
                }
                catch (e) {
                    this.onError(socket, (e as Error).message);
                }
            });

            socket.on(this.callWaiterClientEvent, async data => {
                try {
                    console.log(`user trying to call waiter ${socket.id}: ${JSON.stringify(data)}`);

                    const sessionUserId = data.session_user_id;

                    if (!sessionUserId) {
                        throw new Error('parametros inválidos');
                    }

                    await this.callWaiter(sessionUserId);
                }
                catch (e) {
                    this.onError(socket, (e as Error).message);
                }
            });

            try {
                const tableCode = socket.handshake.query.table_code;

                const officialId = socket.handshake.query.official_id;
            
                if (!tableCode && !officialId) {
                    console.log(`user of id ${socket.id} has no table code`);

                    throw new Error('a table code is necessary to connect');
                }
                else if (tableCode) {
                    this.insertInSessionUsersRoom(socket, tableCode as string);
                }
                else {
                    this.insertOfficialInRooms(socket, Number(officialId));
                }
            }
            catch (e) {
                this.onError(socket, (e as Error).message, true);
            }
        });
    }

    listen(port : number) {
        this.io.listen(port);
    }

    onError(socket : Socket, msg : string, disconnect : boolean = false) {
        this.io.to(socket.id).emit(this.errorEvent, msg);

        if (disconnect) {
            socket.disconnect();
        }
    }

    async getTableDataByCode(tableCode : string) {
        const table = await prisma.table.findFirst({
            where: {
                enter_code: tableCode
            },
            include: {
                restaurant: true
            }
        });

        if (!table) {
            throw new Error('Mesa não encontrada');
        }

        return table;
    }

    async insertInSessionUsersRoom(socket : Socket, tableCode : string) {
        const table = await this.getTableDataByCode(tableCode as string);

        await socket.join(this.sessionUsersRoom(table.restaurant.id, table.id));

        const activeSession = await SessionService.getActiveSession(table.id);

        if (activeSession != null) {
            this.updateSessionUsers(activeSession.id);
        }
    }

    async insertInSessionOrdersRoom(socket : Socket, sessionUserId : number) {
        const sessionUser = await prisma.sessionUser.findFirst({
            where: {
                id : sessionUserId
            },
            include: {
                session: {
                    include: {
                        table: {
                            include: {
                                restaurant: true
                            }
                        }
                    }
                }
            }
        });

        if (!sessionUser) {
            throw new Error('usuário não encontrado');
        }

        await socket.join(this.sessionOrdersRoom(sessionUser.session.table.restaurant.id, sessionUser.session.table.id));

        await this.updateSessionOrders(sessionUser.session_id);
    }

    async insertOfficialInRooms(socket: Socket, officialId : number) {
        const official = await prisma.official.findFirst({
            where: {
                id: officialId
            },
            include: {
                restaurant: {
                    include: {
                        tables: {
                            include: {
                                sessions: {
                                    where: {
                                        status_id : 1
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!official) {
            throw new Error('Funcionário não encontrado');
        }

        for (let i = 0; i < official.restaurant.tables.length; i++) {
            const table = official.restaurant.tables[i];

            await socket.join(this.sessionUsersRoom(table.restaurant_id, table.id));

            await socket.join(this.sessionOrdersRoom(table.restaurant_id, table.id));

            if (table.sessions.length) {
                await this.updateSessionUsers(table.sessions[0].id);

                await this.updateSessionOrders(table.sessions[0].id);
            }
        }
    }

    async makeOrder(sessionUserId : number, productId : number, quantity : number) {
        const sessionOrder = await SessionOrdersService.make(sessionUserId, productId, quantity);

        await this.updateSessionOrders(sessionOrder.session_id);

        await this.updateSessionUsers(sessionOrder.session_id);
    }

    async helpWithOrder(sessionUserId : number, sessionOrderId : number) {
        const sessionOrder = await SessionOrdersService.help(sessionUserId, sessionOrderId);

        await this.updateSessionOrders(sessionOrder.session_id);

        await this.updateSessionUsers(sessionOrder.session_id);
    }

    async notHelpWithOrder(sessionUserId : number, sessionOrderId : number) {
        const sessionOrder = await SessionOrdersService.notHelp(sessionUserId, sessionOrderId);

        await this.updateSessionOrders(sessionOrder.session_id);

        await this.updateSessionUsers(sessionOrder.session_id);
    }

    async updateSessionUsers(sessionId : number) {
        const session = await prisma.session.findFirst({
            where: {
                id: sessionId
            },

            include: {
                table : true
            }
        });

        if (!session) {
            throw new Error(`sessão de id ${sessionId} não encontrada`);
        }

        this.io.to(this.sessionUsersRoom(session.table.restaurant_id, session.table.id))
            .emit(this.sessionUsersEvent, {
                'session' : session,
                'sessionUsers' : await SessionUserService.getBySession(sessionId)
            });
    }

    async updateSessionOrders(sessionId : number) {
        const session = await prisma.session.findFirst({
            where: {
                id: sessionId
            },

            include: {
                table : true
            }
        });

        if (!session) {
            throw new Error(`sessão de id ${sessionId} não encontrada`);
        }

        this.io.to(this.sessionOrdersRoom(session.table.restaurant_id, session.table.id))
            .emit(this.sessionOrdersEvent, {
                'session' : session,
                'sessionOrders' : await SessionOrdersService.getBySession(sessionId)
            });
    }

    async callWaiter(sessionUserId : number) {
        await prisma.sessionWaiterCall.create({
            data: {
                session_user_id: sessionUserId
            }
        });
    }
}

export default SocketController;