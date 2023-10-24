import { Request, Response } from 'express';
import { sendResponse, sendError } from '../../utils/responses';
import { PrismaClient } from '@prisma/client';
import SessionService from '../Services/SessionService';
import SessionUserService from '../Services/SessionUserService';

const prisma = new PrismaClient();

class TableController {
    public static async index(req: Request, res : Response) {
        try {
            const tableCode = req.params.code;

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

            res.send(sendResponse(table));
        }
        catch(e) {
            res.send(sendError([], (e as Error).message));
        }
    }

    public static async enter(req: Request, res : Response) {
        try {
            const tableCode = req.params.code;

            const userName = req.body.userName;

            const userImageId = req.body.userImageId;

            if (!tableCode || !userName || !userImageId) {
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

            if (table == null) {
                throw new Error('Mesa não encontrada');
            }

            const activeSession = await SessionService.getActiveSession(table);

            const sessionUser = await SessionUserService.insertUser(activeSession, userName, userImageId);

            res.send(sendResponse({
                sessionUser: sessionUser,
                table: table
            }));
        }
        catch(e) {
            res.send(sendError([], (e as Error).message));
        }
    }
}

export default TableController;