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

            try {
                const tableCode = socket.handshake.headers.table_code;
            
                if (!tableCode) {
                    console.log(`user of id ${socket.id} has no table code`);

                    throw new Error('a table code is necessary to connect');
                }

                this.insertInSessionUsersRoom(socket, tableCode as string);
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

        socket.join(this.sessionUsersRoom(table.restaurant.id, table.id));

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

        socket.join(this.sessionOrdersRoom(sessionUser.session.table.restaurant.id, sessionUser.session.table.id));

        await this.updateSessionOrders(sessionUser.session_id);
    }

    async makeOrder(sessionUserId : number, productId : number, quantity : number) {
        const sessionUser = await prisma.sessionUser.findFirst({
            where: {
                id : sessionUserId
            },
            include: {
                session: {
                    include: {
                        table: true
                    }
                }
            }
        });

        if (!sessionUser) {
            throw new Error('usuário não encontrado');
        }

        const product = await prisma.product.findFirst({
            where: {
                id: productId,
                restaurant_id: sessionUser.session.table.restaurant_id
            }
        });

        if (!product) {
            throw new Error('produto inválido');
        }

        if (quantity < 0) {
            throw new Error('quantidade inválida');
        }

        const sessionOrder = await prisma.sessionOrder.create({
            data: {
                product_id: product.id,
                session_id: sessionUser.session_id,
                quantity: quantity,
                amount: product.price * quantity,
                amount_left: product.price * quantity,
            }
        });

        if (!sessionOrder) {
            throw new Error('Erro ao fazer pedido');
        }

        const sessionOrderUser = await prisma.sessionOrderUser.create({
            data: {
                session_order_id: sessionOrder.id,
                session_user_id: sessionUser.id
            }
        });

        if (!sessionOrderUser) {
            throw new Error('Erro ao vincular usuário ao pedido');
        }

        this.updateSessionOrders(sessionUser.session_id);
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
            .emit(this.sessionUsersEvent, await SessionUserService.getBySession(sessionId));
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
            .emit(this.sessionOrdersEvent, await SessionOrdersService.getBySession(sessionId));
    }
}

export default SocketController;