import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt'; // --- ADD THIS ---

const prisma = new PrismaClient().$extends(withAccelerate());

const app = express();
const port = 3001;

app.use(cors({
  origin: "http://localhost:5173",
}));
app.use(express.json());

// --- MODIFY THIS ENDPOINT ---
// POST /users: Create a new user (Sign-Up) with a hashed password
app.post('/users', async (req, res) => {
  try {
    const { email, password, firstname, lastname, role, expertise, organisation,country } = req.body;

    // Hash the password before storing it
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword, // Store the hashed password
        firstname,
        lastname,
        role,
        expertise,
        organisation,
        country
      },
    });

    // Don't send the password back, even the hash
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
    
  } catch (error) {
    // Handle specific error for unique email constraint
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }
    res.status(500).json({ message: 'Could not create user', details: error.message });
  }
});

// --- ADD THIS NEW ENDPOINT ---
// POST /login: Authenticate a user (Sign-In)
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find the user by their unique email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 2. If no user is found, the credentials are invalid
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials. Please check your email and password.' });
    }

    // 3. Compare the provided password with the stored hash
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials. Please check your email and password.' });
    }
    
    // 4. Login successful. Send back user data (without the password)
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ user: userWithoutPassword });

  } catch (error) {
    res.status(500).json({ message: 'An internal server error occurred.', details: error.message });
  }
});


// GET /users: Get all users (Note: In a real app, this should be a protected route)
app.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      // Exclude password field from the result
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        role: true,
        organisation: true,
        expertise: true,
      }
    });
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

app.get('/', (req, res) => {
  res.send('🚀 API is running and connected to Prisma Postgres!');
});

app.listen(port, () => {
  console.log(`🚀 Server connected to Prisma Postgres, running at http://localhost:${port}`);
});