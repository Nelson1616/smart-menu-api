import { PrismaClient, SessionOrder } from '@prisma/client';
import SessionUserService from './SessionUserService';

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
            },
            orderBy:  {
                id: 'desc'
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

        if (sessionUser.status_id == 0) {
            throw new Error('usuário inválido');
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

        await SessionUserService.updateUsersAmountToPayBySession(sessionUser.session_id);

        return sessionOrder;
    }

    public static async help(sessionUserId : number, sessionOrderId : number) : Promise<SessionOrder> {
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

        if (sessionUser.status_id == 0) {
            throw new Error('usuário inválido');
        }

        const sessionOrder = await prisma.sessionOrder.findFirst({
            where : {
                id: sessionOrderId,
                session_id: sessionUser.session_id
            }
        });

        if (!sessionOrder) {
            throw new Error('Pedido não encontrado');
        }

        let sessionOrderUser = await prisma.sessionOrderUser.findFirst({
            where: {
                session_order_id: sessionOrder.id,
                session_user_id: sessionUser.id
            }
        });

        if (sessionOrderUser) {
            throw new Error('Usuário já faz parte deste pedido');
        }

        sessionOrderUser = await prisma.sessionOrderUser.create({
            data: {
                session_order_id: sessionOrder.id,
                session_user_id: sessionUser.id
            }
        });

        if (!sessionOrderUser) {
            throw new Error('Erro ao vincular usuário ao pedido');
        }

        await SessionUserService.updateUsersAmountToPayBySession(sessionUser.session_id);

        return sessionOrder;
    }

    public static async notHelp(sessionUserId : number, sessionOrderId : number) : Promise<SessionOrder> {
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

        if (sessionUser.status_id == 0) {
            throw new Error('usuário inválido');
        }

        const sessionOrder = await prisma.sessionOrder.findFirst({
            where : {
                id: sessionOrderId,
            }
        });

        if (!sessionOrder) {
            throw new Error('Pedido não encontrado');
        }

        const sessionId = sessionOrder.session_id;

        await prisma.sessionOrderUser.deleteMany({
            where: {
                session_order_id: sessionOrderId,
                session_user_id: sessionUserId
            },
        });

        await SessionUserService.updateUsersAmountToPayBySession(sessionId);

        return sessionOrder;
    }

    public static async update(sessionOrderId : number) : Promise<SessionOrder> {
        let sessionOrder = await prisma.sessionOrder.findFirst({
            where : {
                id: sessionOrderId
            }
        });

        if (!sessionOrder) {
            throw new Error('Pedido não encontrado');
        }

        if (sessionOrder.status_id == 0) {
            throw new Error('Pedido já foi pago');
        }

        if (sessionOrder.status_id > 2) {
            throw new Error('Pedido com status inválido');
        }

        await prisma.sessionOrder.update({
            where: {
                id: sessionOrderId
            },
            data: {
                status_id: sessionOrder.status_id + 1
            }
        });

        sessionOrder = await prisma.sessionOrder.findFirst({
            where : {
                id: sessionOrderId
            }
        });

        return sessionOrder!;
    }

    public static async downgrade(sessionOrderId : number) : Promise<SessionOrder> {
        let sessionOrder = await prisma.sessionOrder.findFirst({
            where : {
                id: sessionOrderId
            }
        });

        if (!sessionOrder) {
            throw new Error('Pedido não encontrado');
        }

        if (sessionOrder.status_id == 0) {
            throw new Error('Pedido já foi pago');
        }

        await prisma.sessionOrder.update({
            where: {
                id: sessionOrderId
            },
            data: {
                status_id: sessionOrder.status_id - 1
            }
        });

        sessionOrder = await prisma.sessionOrder.findFirst({
            where : {
                id: sessionOrderId
            }
        });

        return sessionOrder!;
    }

    public static async cancel(sessionOrderId : number) : Promise<SessionOrder> {
        let sessionOrder = await prisma.sessionOrder.findFirst({
            where : {
                id: sessionOrderId
            }
        });

        if (!sessionOrder) {
            throw new Error('Pedido não encontrado');
        }

        if (sessionOrder.status_id == 0) {
            throw new Error('Pedido já foi pago');
        }

        await prisma.sessionOrder.update({
            where: {
                id: sessionOrderId
            },
            data: {
                status_id: 4
            }
        });

        sessionOrder = await prisma.sessionOrder.findFirst({
            where : {
                id: sessionOrderId
            }
        });

        return sessionOrder!;
    }

    public static async tryUpdateToPaid(sessionOrderId : number) {
        const query = await prisma.$queryRaw`
            SELECT
            sou.*
            FROM session_orders so 
            JOIN session_order_users sou ON sou.session_order_id = so.id
            WHERE 
            so.id = ${sessionOrderId}
            AND sou.status_id > 0
        `;

        if (!query || !Array.isArray(query) || !query.length) {
            await prisma.sessionOrder.update({
                where: {
                    id: sessionOrderId,
                },
                data: {
                    status_id: 0
                }
            });
        }
    }
}

export default SessionOrdersService;