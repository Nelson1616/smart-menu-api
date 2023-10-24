import { PrismaClient, Session, Table } from '@prisma/client';

const prisma = new PrismaClient();

class SessionService {
    public static async getActiveSession(table : Table) : Promise<Session> {
        let activeSession = await prisma.session.findFirst({
            where:{
                table_id : table.id,
                status_id: 1
            }
        });

        if (activeSession == null) {
            activeSession = await prisma.session.create({
                data: {
                    table_id : table.id
                }
            });
        }

        return activeSession;
    }
}

export default SessionService;