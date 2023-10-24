import { PrismaClient, SessionOrder } from '@prisma/client';

const prisma = new PrismaClient();

class SessionOrdersService {
    public static async getBySession(sessionId : number) : Promise<SessionOrder[]> {
        const sessionOrders = await prisma.sessionOrder.findMany({
            where:{
                session_id: sessionId,
            },
            include: {
                session: {
                    include: {
                        table: true
                    }
                },
                product: true,
                sessionOrderUser: {
                    include: {
                        sessionUser: {
                            include: {
                                user: true
                            }
                        }
                    }
                }
            }
        });

        return sessionOrders;
    }
}

export default SessionOrdersService;