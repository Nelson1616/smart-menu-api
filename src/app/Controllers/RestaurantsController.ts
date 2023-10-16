import { Response } from 'express';
import { sendResponse } from '../../utils/responses';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class RestauratsController {
    static async index(req : unknown, res : Response) {
        const restaurants = await prisma.restaurant.findMany();
        res.send(sendResponse(restaurants));
    }
}

export default RestauratsController;