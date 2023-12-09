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

        if (!activeSession) {
            activeSession = await prisma.session.create({
                data: {
                    table_id : tableId
                }
            });
        }

        return activeSession;
    }

    public static async tryUpdateToPaid(sessionId : number) {
        const query = await prisma.$queryRaw`
            SELECT 
            su.*
            FROM sessions s
            JOIN session_users su ON su.session_id = s.id
            WHERE 
            s.id = ${sessionId}
            AND su.status_id > 0
        `;

        if (!query) {
            await prisma.session.update({
                where: {
                    id: sessionId,
                },
                data: {
                    status_id: 0
                }
            });
        }
    }
}

export default SessionService;