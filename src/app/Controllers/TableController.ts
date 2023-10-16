import { Request, Response } from 'express';
import { sendResponse, sendError } from '../../utils/responses';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class TableController {
    static async index(req: Request, res : Response) {
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
}

export default TableController;