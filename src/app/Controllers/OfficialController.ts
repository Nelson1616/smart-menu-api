import { Request, Response } from 'express';
import { sendResponse, sendError } from '../../utils/responses';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class OfficialController {
    public static async login(req: Request, res : Response) {
        try {
            const email : string = req.body.email;
            const password : string = req.body.password;

            if (!email || !password) {
                throw new Error('parametros inválidos');
            }

            const official = await prisma.official.findFirst({
                where: {
                    email: email,
                    password: password
                },
                include: {
                    restaurant: {
                        include: {
                            tables: true
                        }
                    }
                }
            });

            if (!official) {
                throw new Error('Usuário não encontrado');
            }

            res.send(sendResponse(official));
        }
        catch(e) {
            res.send(sendError(null, (e as Error).message));
        }
    }
}

export default OfficialController;