import express from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const app = express();

app.use(express.json());

app.get('/', async (req, res) => {
  res.json("wellcome to api");
});

app.get('/prisma', async (req, res) => {
  const result : any[] = await prisma.$queryRaw`SELECT * FROM restaurants`;

  const data : string[] = [];

  result.forEach(element => {
    data.push(element.name);
  });

  res.json(data);
});

const server = app.listen(3000, () =>
  console.log(`🚀 Server ready at: http://localhost:3000`),
);