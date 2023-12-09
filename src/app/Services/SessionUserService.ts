import { PrismaClient, SessionUser } from '@prisma/client';
import SessionOrdersService from './SessionOrdersService';
import SessionService from './SessionService';

const prisma = new PrismaClient();

class SessionUserService {
    public static async insertUser(sessionId : number,  name : string, imageId : number) : Promise<SessionUser> {
        const verifyUserExists = await prisma.sessionUser.findFirst({
            where:{
                session_id: sessionId,
                user : {
                    name : name
                }
            }
        });

        if (verifyUserExists) {
            throw new Error('Usuário já existe na sessão');
        }

        const user = await prisma.user.create({
            data : {
                name: name,
                image_id: imageId,
            }
        });

        const sessionUser = await prisma.sessionUser.create({
            data : {
                session_id: sessionId,
                user_id: user.id,
            }
        });

        return sessionUser;
    }

    public static async getBySession(sessionId : number) : Promise<SessionUser[]> {
        const sessionUsers = await prisma.sessionUser.findMany({
            where:{
                session_id: sessionId,
            },
            include: {
                user : true,
                session: {
                    include: {
                        table: true
                    }
                }
            }
        });

        return sessionUsers;
    }

    public static async getOrdersToPay(sessionUserId : number) {
        const orders = await prisma.$queryRaw`
            SELECT 
            u.id as user_id,
            u.name as user_name,
            su.id as session_user_id,
            so.id as session_order_id,
            sou.id as session_user_order_id,
            p.name as product_name,
            so.amount,
            so.amount_left,
            (
                SELECT
                COUNT(so2.id)
                FROM session_orders so2
                JOIN session_order_users sou2 ON sou2.session_order_id = so2.id 
                where so2.id = so.id
                AND sou2.status_id != 0
                AND so2.status_id != 4
                AND so2.status_id != 0
            ) as users_to_div,
            (so.amount_left / (
                SELECT
                COUNT(so2.id)
                FROM session_orders so2
                JOIN session_order_users sou2 ON sou2.session_order_id = so2.id 
                where so2.id = so.id
                AND sou2.status_id != 0
                AND so2.status_id != 4
                AND so2.status_id != 0
                )
            ) as price_to_pay
            FROM session_users su
            JOIN users u ON su.user_id = u.id 
            JOIN session_order_users sou on sou.session_user_id = su.id 
            JOIN session_orders so on sou.session_order_id = so.id 
            JOIN products p on p.id = so.product_id 
            where 
            u.id = ${sessionUserId}
            AND sou.status_id != 0
            AND so.status_id != 0
            AND so.status_id != 4
        `;

        return orders;
    }

    public static async updateUsersAmountToPayBySession(sessionId : number) {
        const sessionUsers = await prisma.sessionUser.findMany({
            where : {
                session_id: sessionId
            },
        });

        for (let i = 0; i < sessionUsers.length; i++) {
            const ordersToPay = await this.getOrdersToPay(sessionUsers[i].id);

            let amountToPay : number = 0;

            if (ordersToPay && Array.isArray(ordersToPay)) {
                ordersToPay.forEach(order => {
                    amountToPay += parseInt(order.price_to_pay);
                });
            }

            await prisma.sessionUser.update({
                where: {
                    id: sessionUsers[i].id,
                },
                data: {
                    amount_to_pay: amountToPay
                }
            });
        }

            
    }

    public static async pay(sessionUserId : number) : Promise<SessionUser> {
        let sessionUser = await prisma.sessionUser.findFirst({
            where: {
                id: sessionUserId,
            }
        });

        if (!sessionUser) {
            throw new Error('Usuário não encontrado');
        }

        const ordersToPay = await this.getOrdersToPay(sessionUserId);

        if (ordersToPay && Array.isArray(ordersToPay)) {
            await ordersToPay.forEach(async order => {
                await prisma.sessionOrderUser.update({
                    where: {
                        id: order.session_user_order_id
                    },
                    data: {
                        status_id: 0
                    }
                });

                await prisma.sessionOrder.update({
                    where: {
                        id: order.session_order_id
                    },
                    data: {
                        amount_left: order.amount_left - order.price_to_pay
                    }
                });

                await SessionOrdersService.tryUpdateToPaid(order.session_order_id);
            });
        }

        await prisma.sessionUser.update({
            where: {
                id: sessionUserId,
            },
            data: {
                status_id: 0
            }
        });

        await SessionService.tryUpdateToPaid(sessionUser.session_id);

        sessionUser = await prisma.sessionUser.findFirst({
            where: {
                id: sessionUserId,
            }
        });

        return sessionUser!;
    }
}

export default SessionUserService;