import { PrismaClient, Session } from '@prisma/client';

const prisma = new PrismaClient();

class SessionService {
    public static async getActiveSession(tableId : number) : Promise<Session> {
        let activeSession = await prisma.session.findFirst({
            where:{
                table_id : tableId,
                status_id: 1
            }
        });

        if (activeSession == null) {
            activeSession = await prisma.session.create({
                data: {
                    table_id : tableId
                }
            });
        }

        return activeSession;
    }
}

export default SessionService;