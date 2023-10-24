import { PrismaClient } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import SessionUserService from '../Services/SessionUserService';
import SessionService from '../Services/SessionService';

const prisma = new PrismaClient();

class SocketController {
    private io : Server;

    private errorEvent : string = 'error';

    private sessionUsersEvent : string = 'users';

    private sessionUsersRoom(restaurantId : number, tableId : number) : string {
        return `restaurant_${restaurantId}_table_${tableId}_users`;
    }

    constructor(io : Server) {
        this.io = io;

        this.init();
    }

    private init() {
        this.io.on('connection', async (socket) => {
            try {
                console.log(`user of id ${socket.id} connected`);
        
                socket.on('disconnect', () => {
                    console.log(`user of id ${socket.id} disconnected`);
                });
            
                socket.on('message', (msg) => {
                    console.log(`message from user ${socket.id}: ${msg}`);
                    socket.broadcast.emit('message', `message from user ${socket.id}: ${msg}`);
                });
            
                const tableCode = socket.handshake.headers.table_code;
            
                if (tableCode == null) {
                    console.log(`user of id ${socket.id} has no table code`);

                    throw new Error('a table code is necessary to connect');
                }

                const table = await this.getTableDataByCode(tableCode as string);

                socket.join(this.sessionUsersRoom(table.restaurant.id, table.id));

                const activeSession = await SessionService.getActiveSession(table.id);

                if (activeSession != null) {
                    this.updateSessionUsers(activeSession.id);
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

    onError(socket : Socket, msg : string, disconnect : boolean) {
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

        if (table == null) {
            throw new Error('Mesa não encontrada');
        }

        return table;
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

        if (session == null) {
            throw new Error(`sessão de id ${sessionId} não encontrada`);
        }

        this.io.to(this.sessionUsersRoom(session.table.restaurant_id, session.table.id))
            .emit(this.sessionUsersEvent, await SessionUserService.getBySession(sessionId));
    }
}

export default SocketController;