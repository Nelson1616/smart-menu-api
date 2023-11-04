import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import apiRouter from './routes/api';
import SocketController from './app/Controllers/SocketController';

const httpPort = 8080;
const wsPort = 3000;

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    path: '/smart-menu-api-ws/',
    cors: {
        methods: ['GET', 'PATCH', 'POST', 'PUT'],
        origin: true,
    }
});

const socketController = new SocketController(io);

app.use(cors());
app.use(express.json());
app.set('SocketController', socketController);
app.use('/api', apiRouter);

app.listen(httpPort, () =>
    console.log(`🚀 HTTP Server ready at: http://localhost:${httpPort}`),
);

socketController.listen(wsPort);