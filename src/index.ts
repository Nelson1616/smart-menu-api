import express from 'express';
import http from 'http';
import { Server } from "socket.io";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const app = express();

const httpServer = http.createServer(app);
const io = new Server(httpServer);

app.use(express.json());

app.get('/', async (req, res) => {
  res.json("wellcome to api");
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('message', (msg) => {
    console.log('message: ' + msg);
    socket.broadcast.emit("message", 'message from client: ' + msg);
  });
});

app.get('/prisma', async (req, res) => {
  const result: any[] = await prisma.$queryRaw`SELECT * FROM restaurants`;

  const data: string[] = [];

  result.forEach(element => {
    data.push(element.name);
  });

  res.json(data);
});

app.listen(8080, () =>
  console.log(`🚀 HTTP Server ready at: http://localhost:8080`),
);

io.listen(3000);