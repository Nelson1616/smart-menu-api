import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const httpPort = 8080;
const wsPort = 3000;

const prisma = new PrismaClient();

const app = express();

const httpServer = http.createServer(app);

const io = new Server(httpServer);

app.use(express.json());

app.get('/', async (req, res) => {
    res.json('wellcome to api');
});

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('message', (msg) => {
        console.log('message: ' + msg);
        socket.broadcast.emit('message', 'message from client: ' + msg);
    });
});

app.get('/prisma', async (req, res) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any[] = await prisma.$queryRaw`SELECT * FROM restaurants`;

    const data: string[] = [];

    result.forEach(element => {
        data.push(element.name);
    });

    res.json(data);
});

app.listen(httpPort, () =>
    console.log(`🚀 HTTP Server ready at: http://localhost:${httpPort}`),
);

io.listen(wsPort);