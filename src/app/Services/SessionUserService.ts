import { PrismaClient, SessionUser } from '@prisma/client';

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
}

export default SessionUserService;