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

    public static async make(sessionUserId : number, productId : number, quantity : number) : Promise<SessionOrder> {
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

        return sessionOrder;
    }
}

export default SessionOrdersService;