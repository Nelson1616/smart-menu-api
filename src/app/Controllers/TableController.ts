import { Request, Response } from 'express';
import { sendResponse, sendError } from '../../utils/responses';
import { PrismaClient } from '@prisma/client';
import SessionService from '../Services/SessionService';
import SessionUserService from '../Services/SessionUserService';
import SocketController from './SocketController';

const prisma = new PrismaClient();

class TableController {
    public static async showByCode(req: Request, res : Response) {
        try {
            const tableCode = req.params.code;

            const table = await prisma.table.findFirst({
                where: {
                    enter_code: tableCode
                },
                include: {
                    restaurant: {
                        include: {
                            products: true
                        }
                    }
                }
            });

            if (!table) {
                throw new Error('Mesa não encontrada');
            }

            res.send(sendResponse(table));
        }
        catch(e) {
            res.send(sendError(null, (e as Error).message));
        }
    }

    public static async enter(req: Request, res : Response) {
        try {
            const tableCode : string = req.params.code;

            const userName : string = req.body.userName;

            const userImageId : number = req.body.userImageId;

            if (!tableCode || !userName || !userImageId || !userName.match(/[a-zA-Z]/g) || userName.length < 2) {
                throw new Error('Parametros inválidos');
            }

            const table = await prisma.table.findFirst({
                where: {
                    enter_code: tableCode
                },
                include: {
                    restaurant: {
                        include: {
                            products : true,
                        },
                    },
                }
            });

            if (!table) {
                throw new Error('Mesa não encontrada');
            }

            const activeSession = await SessionService.getActiveSession(table.id);

            const sessionUserInsert = await SessionUserService.insertUser(activeSession.id, userName, userImageId);

            const sessionUser = await prisma.sessionUser.findFirst({
                where: {
                    id: sessionUserInsert.id
                },
                include: {
                    user: true
                }
            });

            const socketController : SocketController = req.app.get('SocketController');
            socketController.updateSessionUsers(activeSession.id);

            res.send(sendResponse({
                sessionUser: sessionUser,
                table: table
            }));
        }
        catch(e) {
            res.send(sendError(null, (e as Error).message));
        }
    }
}

export default TableController;