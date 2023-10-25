import { Request, Response } from 'express';
import { sendResponse, sendError } from '../../utils/responses';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class RestaurantController {
    public static async index(req: Request, res : Response) {
        try {
            const restaurants = await prisma.restaurant.findMany();
            res.send(sendResponse(restaurants));
        }
        catch(e) {
            res.send(sendError(null, (e as Error).message));
        }
    }
}

export default RestaurantController;