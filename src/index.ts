import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import apiRouter from './routes/api';

const httpPort = 8080;
const wsPort = 3000;

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);



app.use(express.json());
app.use('/api', apiRouter);

io.on('connection', (socket) => {
    console.log(`user of id ${socket.id} connected`);

    socket.on('disconnect', () => {
        console.log(`user of id ${socket.id} disconnected`);
    });

    socket.on('message', (msg) => {
        console.log(`message from user ${socket.id}: ${msg}`);
        socket.broadcast.emit('message', `message from user ${socket.id}: ${msg}`);
    });
});

app.listen(httpPort, () =>
    console.log(`🚀 HTTP Server ready at: http://localhost:${httpPort}`),
);

io.listen(wsPort);