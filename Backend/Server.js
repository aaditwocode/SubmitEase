import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt'; // --- ADD THIS ---
import multer from "multer";
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config'; // Load environment variables from .env file


const prisma = new PrismaClient().$extends(withAccelerate());

const app = express();
const port = 3001;

app.use(cors({
  origin: "http://localhost:5173",
}));
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Initialize Supabase Client ---
// It's safe to use process.env here because of the 'dotenv/config' import
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided in the .env file.");
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Uploads a file to a Supabase Storage bucket and returns the public URL.
 * @param {Buffer} fileBuffer - The file content as a buffer.
 * @param {string} Filename - The name of the file.
 * @returns {Promise<string>} The public URL of the uploaded file.
 */
async function uploadPdfToSupabase(fileBuffer, Filename,editpdf=false) {
  const fileName = `${Filename}`;
  const bucketName = 'SubmitEase'; // Make sure this bucket exists and is public in your Supabase project

  // 1. Upload the file
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(fileName, fileBuffer, {
      contentType: 'application/pdf',
      upsert: editpdf,
    });

  if (uploadError) {
    throw new Error(`Supabase upload failed: ${uploadError.message}`);
  }

  // 2. Get the public URL for the uploaded file
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  if (!data || !data.publicUrl) {
    throw new Error('Could not retrieve public URL after upload.');
  }

  return data.publicUrl;
}

// --- Define the Upload Route ---
app.post('/upload', upload.single('pdfFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file was uploaded.' });
  }

  try {
    console.log(`Received file: ${req.file.originalname}, size: ${req.file.size} bytes`);

    // Call our upload function with the file's buffer and original name
    const publicUrl = await uploadPdfToSupabase(req.file.buffer, req.file.originalname);

    console.log(`File successfully uploaded. URL: ${publicUrl}`);

    // Here you would save the 'publicUrl' to your own database
    // e.g., await prisma.document.create({ data: { url: publicUrl } });

    res.status(200).json({
      message: 'File uploaded successfully!',
      url: publicUrl
    });

  } catch (error) {
    console.error('An error occurred during upload:', error);
    res.status(500).json({ error: error.message });
  }
});


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

app.get('/getpaperbyid/:paperId', async (req, res) => {
  const { paperId } = req.params;
  try {
    const papers = await prisma.paper.findUnique({
      where: {
        id: paperId,
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
        Authors:{
          select:{
            id:true,
            firstname:true,
            lastname:true,
            email:true,
            organisation:true,
            expertise:true,
          }
        }
      },
      cacheStrategy: { ttl: 60 },
    });

    if (!papers) {
      return res.status(404).json({ message: 'No papers found for this author.' });
    }

    res.status(200).json({ paper: papers });

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
app.post('/savepaper', upload.single('pdfFile'), async (req, res) => {
  // 1. The file is now in req.file, not req.body
  // The other fields are in req.body
  const { title, confId:cid, abstract } = req.body;
  const confId = parseInt(cid, 10);
  // 2. Parse the stringified fields back into objects/arrays
  const conf = JSON.parse(req.body.conf);
  const keywords = JSON.parse(req.body.keywords);
  const authorIds = JSON.parse(req.body.authorIds);

  // 3. Check for the file from multer
  if (!req.file) {
    return res.status(400).json({ error: 'No file was uploaded.' });
  }

  
  try {
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
    const year = new Date(conf.startsAt).getFullYear().toString().slice(-2);
    const formattedNumber = String(nextNumber).padStart(4, '0');
    const newPaperID = `${start}_${year}_P${formattedNumber}`;
    let url;
    try {
      url = await uploadPdfToSupabase(req.file.buffer, newPaperID + '.pdf');

    } catch (error) {
      console.error('An error occurred during upload:', error);
      return res.status(500).json({ error: error.message });
    }
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
          connect: { id: confId },
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
    const { paperId } = req.body;
    const updatePaper = await prisma.paper.update({
      where: { id: paperId },
      data: {
        Status: 'Under Review',
        submittedAt: new Date(),
      },
      cacheStrategy: { ttl: 60 },
    });
    res.status(200).json({ paper: updatePaper });
  } catch (error) {
    console.error('Failed to submot paper:', error);
    if (error.code === 'P2025') {
      return res.status(400).json({ message: 'One or more author IDs do not correspond to an existing user.' });
    }
    res.status(500).json({ message: 'Could not submit paper', details: error.message });
  }
});

app.post('/editpaper',upload.single('pdfFile'), async (req, res) => {
  try {
    const { paperId, title, confId:cid, abstract } = req.body;
  const confId = parseInt(cid, 10);
  const keywords = JSON.parse(req.body.keywords);
  const authorIds = JSON.parse(req.body.authorIds);
  const authorConnects = authorIds.map(id => ({ id: parseInt(id, 10) }));
  if (!req.file) {
    const updatePaper = await prisma.paper.update({
      where: { id: paperId },
      data: {
        Title: title,
        Abstract: abstract,
        Keywords: keywords,
        Status: 'Pending Submission',
        submittedAt: new Date(),
        Authors: {
          set: authorConnects,
        },
      },
      cacheStrategy: { ttl: 60 },
    });
    res.status(200).json({ paper: updatePaper });
  }
  else{
    let url;
    try {
      url = await uploadPdfToSupabase(req.file.buffer, paperId + '.pdf',true);
    } catch (error) {
      console.error('An error occurred during upload:', error);
      return res.status(500).json({ error: error.message });
    }
    const updatePaper = await prisma.paper.update({
      where: { id: paperId },
      data: {
        Title: title,
        Abstract: abstract,
        Keywords: keywords,
        Status: 'Pending Submission',
        URL: url,
        submittedAt: new Date(),
        Authors: {
          set: authorConnects,
        },
      },
      cacheStrategy: { ttl: 60 },
    });
    res.status(200).json({ paper: updatePaper });
  } }catch (error) {
    console.error('Failed to update paper:', error);
    if (error.code === 'P2025') {
      return res.status(400).json({ message: 'One or more author IDs do not correspond to an existing user.' });
    }
    res.status(500).json({ message: 'Could not update paper', details: error.message });
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
    res.status(200).json({ users: emails });

  } catch (error) {
    res.status(500).json({ message: 'An internal server error occurred.', details: error.message });
  }
});

app.post('/conference/registeration', async (req, res) => {
  try {
    const { name, location, startsAt, endAt, deadline, link, status, Partners, hostID } = req.body;
    const newConference = await prisma.conference.create({
      data: {
        name,
        location,
        startsAt: new Date(startsAt),
        endAt: new Date(endAt),
        deadline: new Date(deadline),
        link,
        status,
        Partners,
        hostID
      },
      cacheStrategy: { ttl: 60 },
    });
    res.status(201).json({ conference: newConference });

  } catch (error) {
    res.status(500).json({ message: 'Could not create conference', details: error.message });
  }
});

app.post('/conference/registered', async (req, res) => {
  try {
    const { userId } = req.body;
    const conferences = await prisma.conference.findMany({
      where: {
        hostID: parseInt(userId)
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

app.post('/conference/papers', async (req, res) => {
  try {
    const { conferenceId } = req.body;

    const conferencepapers = await prisma.paper.findMany({
      where: {
        ConferenceId: parseInt(conferenceId)
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
        Authors: {
          select: {
            firstname: true,
            lastname: true,
            email: true
          }
        }
      },
    });
    if (!conferencepapers || conferencepapers.length === 0) {
      return res.status(404).json({ message: 'No Available Papers.' });
    }

    res.status(200).json({ paper: conferencepapers });

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