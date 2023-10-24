import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import apiRouter from './routes/api';
import SocketController from './app/Controllers/SocketController';

const httpPort = 8080;
const wsPort = 3000;

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

const socketController = new SocketController(io);

app.use(express.json());
app.set('SocketController', socketController);
app.use('/api', apiRouter);

app.listen(httpPort, () =>
    console.log(`🚀 HTTP Server ready at: http://localhost:${httpPort}`),
);

socketController.listen(wsPort);