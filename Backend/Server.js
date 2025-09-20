import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import express from 'express';
const prisma = new PrismaClient()
  .$extends(withAccelerate());

const app = express();
const port = 3000;

app.use(express.json());

// POST /users: Create a new user
app.post('/users', async (req, res) => {
  try {
    const newUser = await prisma.user.create({
      data: req.body,
    });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Could not create user', details: error.message });
  }
});

// GET /users: Get all users
app.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Could not retrieve users', details: error.message });
  }
});

app.get('/posts', async (req, res) => {
  try {
    const postsByUser = await prisma.post.findMany();
    res.json(postsByUser);
  } catch (error) {
    res.status(500).json({ error: 'Could not retrieve users', details: error.message });
  }
});

// ✅ ADD THIS NEW ROOT ROUTE
app.get('/', (req, res) => {
  res.send('🚀 API is running and connected to Prisma Postgres!');
});


app.listen(port, () => {
  console.log(`🚀 Server connected to Prisma Postgres, running at http://localhost:${port}`);
});