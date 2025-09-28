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
    const { email, password, firstname, lastname, role, expertise, organisation, country } = req.body;

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
      cacheStrategy: { ttl: 60 },
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
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        role: true,
        expertise: true,
        organisation: true,
        country: true,
        password: true,
      },
      cacheStrategy: { ttl: 60 },
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

app.get('/conferences', async (req, res) => {
  try {
    const conferences = await prisma.conference.findMany({
      where: {
        status: "Open"
      },
      select: {
        id: true,
        name: true,
        location: true,
        startsAt: true,
        endAt: true,
        deadline: true,
        link: true,
        status: true,
      },
      cacheStrategy: { ttl: 60 },
    });
    if (!conferences || conferences.length === 0) {
      return res.status(404).json({ message: 'No Available Conferences.' });
    }

    res.status(200).json({ conference: conferences });

  } catch (error) {
    res.status(500).json({ message: 'An internal server error occurred.', details: error.message });
  }
});

app.get('/papers', async (req, res) => {
  const { authorId } = req.query;
  if (!authorId) {
    return res.status(400).json({ message: 'The authorId query parameter is required.' });
  }
  const parsedAuthorId = parseInt(authorId, 10);
  if (isNaN(parsedAuthorId)) {
    return res.status(400).json({ message: 'The authorId must be a valid integer.' });
  }

  try {
    const papers = await prisma.paper.findMany({
      where: {
        Authors: {
          some: {
            id: parsedAuthorId,
          },
        },
      },
      select: {
        id: true,
        Title: true,
        Status: true,
        Keywords: true,
        Abstract: true,
        URL: true,
        submittedAt: true,
        Conference: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      cacheStrategy: { ttl: 60 },
    });

    if (!papers || papers.length === 0) {
      return res.status(404).json({ message: 'No papers found for this author.' });
    }

    // 4. Use a conventional plural key for the array in the response
    res.status(200).json({ papers: papers });

  } catch (error) {
    console.error(error); // It's good practice to log the error on the server
    res.status(500).json({ message: 'An internal server error occurred.', details: error.message });
  }
});

function createAbbreviation(fullName) {
  const stopWords = ['on', 'of', 'the', 'in', 'and', 'for', 'a', 'an'];
  const acronym = fullName.split(' ').filter(word => !stopWords.includes(word.toLowerCase())).map(word => word.charAt(0)).join('');
  return acronym.toUpperCase().slice(0, 5);
}
app.post('/savepaper', async (req, res) => {
  try {
    const { title, confId,conf, abstract, keywords, authorIds, url } = req.body;
    const authorConnects = authorIds.map(id => ({ id: parseInt(id, 10) }));
    const lastpaperID = await prisma.paper.findFirst({
      where: { ConferenceId: confId },
      orderBy: { id: 'desc' },
      select: { id: true },
      cacheStrategy: { ttl: 60 },
    });
    let nextNumber = 1;
    if (lastpaperID && lastpaperID.id) {
      const lastNumberStr = lastpaperID.id.split('_P')[1];
      nextNumber = parseInt(lastNumberStr, 10) + 1;
    }
    const start = createAbbreviation(conf.name);
    const year=new Date(conf.startsAt).getFullYear().toString().slice(-2);
    const formattedNumber = String(nextNumber).padStart(4, '0');
    const newPaperID = `${start}_${year}_P${formattedNumber}`;
    const newPaper = await prisma.paper.create({
      data: {
        id: newPaperID,
        Title: title,
        Abstract: abstract,
        Keywords: keywords,
        URL: url,
        Status: 'Pending Submission',
        submittedAt: new Date(),
        Conference: {
          connect: { id: confId},
        },
        Authors: {
          connect: authorConnects,
        },
      },
      cacheStrategy: { ttl: 60 },
    });

    res.status(201).json({ paper: newPaper });
  } catch (error) {
    console.error('Failed to create paper:', error);
    if (error.code === 'P2025') {
      return res.status(400).json({ message: 'One or more author IDs do not correspond to an existing user.' });
    }
    res.status(500).json({ message: 'Could not create paper', details: error.message });
  }
});

app.post('/submitpaper', async (req, res) => {
  try {
    const { paper } = req.body;
    const updatePaper = await prisma.paper.update({
      where: { id: paper.id },
      data: {
        Status: 'Under Review',
        submittedAt: new Date(),
      },
      cacheStrategy: { ttl: 60 },
    });
    res.status(200).json({ paper: updatePaper });
  } catch (error) {
    console.error('Failed to create paper:', error);
    if (error.code === 'P2025') {
      return res.status(400).json({ message: 'One or more author IDs do not correspond to an existing user.' });
    }
    res.status(500).json({ message: 'Could not create paper', details: error.message });
  }
});

app.get('/users/emails', async (req, res) => {
  try {
    const emails = await prisma.user.findMany({
      where: {},
      select: {
        id: true,
        email: true,
      },
      cacheStrategy: { ttl: 60 },
    });
    if (!emails || emails.length === 0) {
      return res.status(404).json({ message: 'No emails found.' });
    }
    res.status(200).json({ users: emails});

  } catch (error) {
    res.status(500).json({ message: 'An internal server error occurred.', details: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('🚀 API is running and connected to Prisma Postgres!');
});

app.listen(port, () => {
  console.log(`🚀 Server connected to Prisma Postgres, running at http://localhost:${port}`);
});