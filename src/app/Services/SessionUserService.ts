import { PrismaClient, Session, SessionUser } from '@prisma/client';

const prisma = new PrismaClient();

class SessionUserService {
    public static async insertUser(session : Session,  name : string, imageId : number) : Promise<SessionUser> {
        const verifyUserExists = await prisma.sessionUser.findFirst({
            where:{
                session_id: session.id,
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
                session_id: session.id,
                user_id: user.id,
            }
        });

        return sessionUser;
    }
}

export default SessionUserService;