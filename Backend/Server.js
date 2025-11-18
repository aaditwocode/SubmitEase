import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import multer from "multer";
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import 'dotenv/config';
import { parse } from 'path';

const prisma = new PrismaClient().$extends(withAccelerate());

const app = express();
const port = 3001;

app.use(cors({
  origin: "http://localhost:5173",
}));
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//sendmail
const transporter = nodemailer.createTransport({
    secure: true,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

function sendMail(to, sub, msg) {
    transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: to,
        subject: sub,
        html: msg
    }, function(error, info) {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('Email sent successfully:', info.response);
        }
    });
}

// --- Initialize Supabase Client ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided in the .env file.");
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Uploads a file to a Supabase Storage bucket and returns the public URL.
 */
async function uploadPdfToSupabase(fileBuffer, Filename, editpdf = false) {
  const fileName = `${Filename}`;
  const bucketName = 'SubmitEase';

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(fileName, fileBuffer, {
      contentType: 'application/pdf',
      upsert: editpdf,
    });

  if (uploadError) {
    throw new Error(`Supabase upload failed: ${uploadError.message}`);
  }

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

    const publicUrl = await uploadPdfToSupabase(req.file.buffer, req.file.originalname);

    console.log(`File successfully uploaded. URL: ${publicUrl}`);

    res.status(200).json({
      message: 'File uploaded successfully!',
      url: publicUrl
    });

  } catch (error) {
    console.error('An error occurred during upload:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- NEW ENDPOINTS FOR PUBLICATION & REGISTRATION MANAGEMENT ---

// Assign Publication Chairs
app.post('/conference/assign-publication-chairs', async (req, res) => {
  try {
    const { conferenceId, userIds } = req.body;

    if (!conferenceId || !Array.isArray(userIds)) {
      return res.status(400).json({ message: 'conferenceId and userIds array are required.' });
    }

    const prismaUserConnect = userIds.map(id => ({ id: parseInt(id, 10) }));

    const updatedConference = await prisma.conference.update({
      where: { id: parseInt(conferenceId, 10) },
      data: {
        PublicationChairs: {
          set: prismaUserConnect,
        },
      },
      include: {
        PublicationChairs: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            organisation: true,
            expertise: true,
          }
        },
        RegistrationChairs: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            organisation: true,
            expertise: true,
          }
        }
      }
    });

    res.status(200).json({ conference: updatedConference });
  } catch (error) {
    console.error("Error assigning publication chairs:", error);
    res.status(500).json({ message: 'Failed to assign publication chairs', details: error.message });
  }
});

// Assign Registration Chairs
app.post('/conference/assign-registration-chairs', async (req, res) => {
  try {
    const { conferenceId, userIds } = req.body;

    if (!conferenceId || !Array.isArray(userIds)) {
      return res.status(400).json({ message: 'conferenceId and userIds array are required.' });
    }

    const prismaUserConnect = userIds.map(id => ({ id: parseInt(id, 10) }));

    const updatedConference = await prisma.conference.update({
      where: { id: parseInt(conferenceId, 10) },
      data: {
        RegistrationChairs: {
          set: prismaUserConnect,
        },
      },
      include: {
        PublicationChairs: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            organisation: true,
            expertise: true,
          }
        },
        RegistrationChairs: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            organisation: true,
            expertise: true,
          }
        }
      }
    });

    res.status(200).json({ conference: updatedConference });
  } catch (error) {
    console.error("Error assigning registration chairs:", error);
    res.status(500).json({ message: 'Failed to assign registration chairs', details: error.message });
  }
});

// Get Publication Statistics
app.post('/conference/publication-stats', async (req, res) => {
  try {
    const { conferenceId } = req.body;

    if (!conferenceId) {
      return res.status(400).json({ message: 'conferenceId is required.' });
    }

    const papers = await prisma.paper.findMany({
      where: {
        ConferenceId: parseInt(conferenceId, 10),
        Status: {
          not: "Pending Submission"
        }
      },
      select: {
        id: true,
        Status: true,
        isFinal: true
      }
    });

    const totalPapers = papers.length;
    const acceptedPapers = papers.filter(p => p.Status === 'Accepted').length;
    const publishedPapers = papers.filter(p => p.isFinal === true).length;
    const pendingPublication = acceptedPapers - publishedPapers;

    const stats = {
      totalPapers,
      acceptedPapers,
      publishedPapers,
      pendingPublication: pendingPublication > 0 ? pendingPublication : 0
    };

    res.status(200).json({ stats });
  } catch (error) {
    console.error("Error fetching publication stats:", error);
    res.status(500).json({ message: 'Failed to fetch publication statistics', details: error.message });
  }
});

// Get Registration Statistics
app.post('/conference/registration-stats', async (req, res) => {
  try {
    const { conferenceId } = req.body;

    if (!conferenceId) {
      return res.status(400).json({ message: 'conferenceId is required.' });
    }

    // Get all papers for the conference
    const papers = await prisma.paper.findMany({
      where: {
        ConferenceId: parseInt(conferenceId, 10),
        Status: {
          not: "Pending Submission"
        }
      },
      select: {
        id: true,
        Status: true,
        Authors: {
          select: {
            id: true
          }
        }
      }
    });

    // Calculate unique authors (registrations)
    const authorSet = new Set();
    papers.forEach(paper => {
      paper.Authors.forEach(author => {
        authorSet.add(author.id);
      });
    });

    const totalSubmissions = papers.length;
    const completedRegistrations = authorSet.size;
    
    // For demo purposes, using some mock calculations
    const pendingRegistrations = Math.max(0, totalSubmissions - completedRegistrations);
    const confirmedAttendees = Math.floor(completedRegistrations * 0.8);

    const stats = {
      totalSubmissions,
      completedRegistrations,
      pendingRegistrations,
      confirmedAttendees
    };

    res.status(200).json({ stats });
  } catch (error) {
    console.error("Error fetching registration stats:", error);
    res.status(500).json({ message: 'Failed to fetch registration statistics', details: error.message });
  }
});

// Get conferences for Publication Chairs
app.post('/conference/publication-chair-conferences', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required.' });
    }

    const conferences = await prisma.conference.findMany({
      where: {
        PublicationChairs: {
          some: {
            id: parseInt(userId, 10)
          }
        }
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
        Partners: true,
        PublicationChairs: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true
          }
        }
      }
    });

    res.status(200).json({ conferences });
  } catch (error) {
    console.error("Error fetching publication chair conferences:", error);
    res.status(500).json({ message: 'Failed to fetch conferences', details: error.message });
  }
});

// Get conferences for Registration Chairs
app.post('/conference/registration-chair-conferences', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required.' });
    }

    const conferences = await prisma.conference.findMany({
      where: {
        RegistrationChairs: {
          some: {
            id: parseInt(userId, 10)
          }
        }
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
        Partners: true,
        RegistrationChairs: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true
          }
        }
      }
    });

    res.status(200).json({ conferences });
  } catch (error) {
    console.error("Error fetching registration chair conferences:", error);
    res.status(500).json({ message: 'Failed to fetch conferences', details: error.message });
  }
});

// --- EXISTING ENDPOINTS (keep all your original endpoints) ---

// POST /users: Create a new user (Sign-Up) with a hashed password
app.post('/users', async (req, res) => {
  try {
    const { email, password, firstname, lastname, role, expertise, organisation, country, sub, msg } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstname,
        lastname,
        role,
        expertise,
        organisation,
        country
      },
      cacheStrategy: { ttl: 60 },
    });
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
    sendMail(email, sub, msg);

  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }
    res.status(500).json({ message: 'Could not create user', details: error.message });
  }
});

// POST /login: Authenticate a user (Sign-In)
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

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

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials. Please check your email and password.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials. Please check your email and password.' });
    }

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
        Tracks:{
          select:{
            id:true,
            Name:true,
          }
        }
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

// Get single conference by id
app.post('/get-conference-by-id', async (req, res) => {
  try {
    const { conferenceId } = req.body;
    const conference = await prisma.conference.findUnique({
      where: { id: parseInt(conferenceId, 10) },
      select: {
        id: true,
        name: true,
        location: true,
        startsAt: true,
        endAt: true,
        deadline: true,
        link: true,
        status: true,
        Partners: true,
        hostID: true,
        PublicationChairs: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            organisation: true,
            expertise: true,
          }
        },
        RegistrationChairs: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            organisation: true,
            expertise: true,
          }
        },
        Tracks:{
          select:{
            id:true,
            Name:true,
          }
        }
      },
      cacheStrategy: { ttl: 60 },
    });

    if (!conference) return res.status(404).json({ message: 'Conference not found' });

    res.status(200).json({ conference });
  } catch (error) {
    console.error('Failed to fetch conference:', error);
    res.status(500).json({ message: 'Could not fetch conference', details: error.message });
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
        AuthorOrder: true,
        submittedAt: true,
        isFinal:true,
        TrackId: true,
        Tracks: {
          select:{
            id:true,
            Name:true,
          },
        },
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

    res.status(200).json({ papers: papers });

  } catch (error) {
    console.error(error);
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
        AuthorOrder: true,
        submittedAt: true,
        TrackId: true,
        isFinal:true,
        Tracks: {
          select:{
            id:true,
            Name:true,
          },
        },
        Conference: {
          select: {
            id: true,
            name: true,
            Tracks:{
              select:{
                id:true,
                Name:true,
              }
            }
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
        },
        Reviews:{
          select:{
            id:true,
            ReviewerId:true,
            Comment:true,
            Recommendation:true,
            submittedAt:true,
            Status:true,
            scoreOriginality:true,
            scoreClarity:true,
            scoreSoundness:true,
            scoreSignificance:true,
            scoreRelevance:true,
            avgScore:true,
            isBlind:true,
            assignedAt:true,
            User:{
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
        }
      },
    });

    if (!papers) {
      return res.status(404).json({ message: 'No papers found for this author.' });
    }

    res.status(200).json({ paper: papers });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An internal server error occurred.', details: error.message });
  }
});

function createAbbreviation(fullName) {
  const stopWords = ['on', 'of', 'the', 'in', 'and', 'for', 'a', 'an'];
  const acronym = fullName.split(' ').filter(word => !stopWords.includes(word.toLowerCase())).map(word => word.charAt(0)).join('');
  return acronym.toUpperCase().slice(0, 5);
}

app.post('/savepaper', upload.single('pdfFile'), async (req, res) => {
  const { title, confId:cid, abstract } = req.body;
  const confId = parseInt(cid, 10);
  const conf = JSON.parse(req.body.conf);
  const keywords = JSON.parse(req.body.keywords);
  const authorIds = JSON.parse(req.body.authorIds);
  const authorIdsInt = authorIds.map(id => parseInt(id, 10));
  const trackId = req.body.trackId ? parseInt(req.body.trackId, 10) : null;
  
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
        AuthorOrder:authorIdsInt,
        URL: url,
        Status: 'Pending Submission',
        submittedAt: new Date(),
        Tracks:{
          connect: { id: trackId },
        },
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

app.post('/submitpaper', upload.single('pdfFile'), async (req, res) => {
  try {
    const { paperId, title, confId:cid, abstract,trackId } = req.body;
  const confId = parseInt(cid, 10);
  const keywords = JSON.parse(req.body.keywords);
  const authorIds = JSON.parse(req.body.authorIds);
  const authorConnects = authorIds.map(id => ({ id: parseInt(id, 10) }));
  const authorIdsInt = authorIds.map(id => parseInt(id, 10));
  if (!req.file) {
    const updatePaper = await prisma.paper.update({
      where: { id: paperId },
      data: {
        Title: title,
        Abstract: abstract,
        Keywords: keywords,
        Status: 'Under Review',
        submittedAt: new Date(),
        TrackId: trackId ? parseInt(trackId, 10) : null,
        AuthorOrder:authorIdsInt,
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
        Status: 'Under Review',
        AuthorOrder:authorIdsInt,
        TrackId: trackId ? parseInt(trackId, 10) : null,
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
    console.error('Failed to Submit Paper:', error);
    if (error.code === 'P2025') {
      return res.status(400).json({ message: 'One or more author IDs do not correspond to an existing user.' });
    }
    res.status(500).json({ message: 'Could not Submit Paper', details: error.message });
  }
});

app.post('/editpaper',upload.single('pdfFile'), async (req, res) => {
  try {
    const { paperId, title, confId:cid, abstract } = req.body;
  const confId = parseInt(cid, 10);
  const keywords = JSON.parse(req.body.keywords);
  const authorIds = JSON.parse(req.body.authorIds);
  const authorConnects = authorIds.map(id => ({ id: parseInt(id, 10) }));
  const authorIdsInt = authorIds.map(id => parseInt(id, 10));
  const trackId = req.body.trackId ? parseInt(req.body.trackId, 10) : null;
  if (!req.file) {
    const updatePaper = await prisma.paper.update({
      where: { id: paperId },
      data: {
        Title: title,
        Abstract: abstract,
        Keywords: keywords,
        Status: 'Pending Submission',
        submittedAt: new Date(),
        AuthorOrder:authorIdsInt,
        TrackId: trackId,
        Authors: {
          set: authorConnects,
        },
      },
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
        AuthorOrder:authorIdsInt,
        URL: url,
        submittedAt: new Date(),
        TrackId: trackId,
        Authors: {
          set: authorConnects,
        },
      },
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
        firstname: true,
        lastname: true,
        organisation: true,
        expertise: true,
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

app.post('/conference/reviewers', async (req, res) => {
  try {
    const {confId} = req.body;
    const reviewers = await prisma.conference.findUnique({
      where: {id:confId},
      select: {
        Reviewers:{
          select:{
            id:true,
            firstname:true,
            lastname:true,
            organisation:true,
            expertise:true,
            email:true,
            country:true,
          }
        }
      },
      cacheStrategy: { ttl: 60 },
    });
    if (!reviewers || reviewers.length === 0) {
      return res.status(404).json({ message: 'No reviewers found.' });
    }
    res.status(200).json({ reviewers: reviewers.Reviewers});

  } catch (error) {
    console.error('Error fetching reviewers:', error);
    res.status(500).json({ message: 'An internal server error occurred.', details: error.message });
  }
});

app.post('/assign-reviewers', async (req, res) => {
  try {
    const { paperId, reviewerIds,isBlind } = req.body;

    if (!paperId || !reviewerIds) {
      return res.status(400).json({ message: 'Missing paperId, reviewerIds' });
    }

    const reviewData = reviewerIds.map((id) => ({
      PaperId: paperId,
      ReviewerId: parseInt(id, 10),
      Comment: "",
      Recommendation: "",
      submittedAt:null,  
      Status: "Pending Invitation",
      isBlind: isBlind,
      assignedAt: new Date(),
    }));

    await prisma.reviews.createMany({
      data: reviewData,
      skipDuplicates: true
    });

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
        AuthorOrder: true,
        submittedAt: true,
        isFinal:true,
        TrackId: true,
        Tracks: {
          select:{
            id:true,
            Name:true,
          },
        },
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
        },
        Reviews:{
          select:{
            id:true,
            ReviewerId:true,
            Comment:true,
            Recommendation:true,
            submittedAt:true,
            Status:true,
            isBlind:true,
            scoreOriginality:true,
            scoreClarity:true,
            scoreSoundness:true,
            scoreSignificance:true,
            scoreRelevance:true,
            avgScore:true,
            assignedAt:true,
            User:{
              select:{
                id:true,
                firstname:true,
                lastname:true,
                email:true,
                expertise:true,
                organisation:true,
              }
            }
          }
        }
      },
    });

    res.status(200).json({ paper: papers });

  } catch (error) {
    console.error('Failed to assign reviewers:', error);
    res.status(500).json({ message: 'Could not assign reviewers', details: error.message });
  }
});

app.post('/submit-review', async (req, res) => {
  const { paperId, reviewerId, Recommendation, Comment, scoreOriginality,scoreClarity,scoreSoundness,scoreSignificance,scoreRelevance} = req.body;
  const avgScore = (scoreOriginality + scoreClarity + scoreSoundness + scoreSignificance + scoreRelevance) / 5.0;
  try {
    const newReview = await prisma.reviews.update({
      where:{
        PaperId_ReviewerId: {
        PaperId: paperId,
        ReviewerId: parseInt(reviewerId, 10),
        }
      },
      data: {
        Recommendation: Recommendation,
        Comment: Comment,
        submittedAt: new Date(),
        Status:"Submitted",
        scoreOriginality: scoreOriginality,
        scoreClarity: scoreClarity,
        scoreSoundness: scoreSoundness,
        scoreSignificance: scoreSignificance,
        scoreRelevance: scoreRelevance,
        avgScore: avgScore,
      }
    });
    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ message: "Failed to submit review." });
  }
});

app.post('/save-review', async (req, res) => {
  const { paperId, reviewerId, Recommendation, Comment, scoreOriginality,scoreClarity,scoreSoundness,scoreSignificance,scoreRelevance} = req.body;

  try {
    const newReview = await prisma.reviews.update({
       where:{
        PaperId_ReviewerId: {
        PaperId: paperId,
        ReviewerId: parseInt(reviewerId, 10),
        }
      },
      data: {
        Recommendation: Recommendation,
        Comment: Comment, 
        scoreOriginality: scoreOriginality,
        scoreClarity: scoreClarity,
        scoreSoundness: scoreSoundness,
        scoreSignificance: scoreSignificance,
        scoreRelevance: scoreRelevance,
      }
    });
    res.status(201).json(newReview);
  } catch (error) {
    console.error('Failed to Save Review:', error);
    res.status(500).json({ message: "Failed to save review." });
  }
});

app.post('/get-review', async (req, res) => {
  const { paperId, reviewerId} = req.body;
  try {
    const review = await prisma.reviews.findUnique({
      where:{
      PaperId_ReviewerId: {
        PaperId: paperId,
        ReviewerId: parseInt(reviewerId, 10), 
      },
    }
    });
    if (!review) {
      return res.status(404).json({ message: 'No Available Review.' });
    }
    res.status(201).json(review);
  } catch (error) {
    console.error('Failed to Fetch Review:', error);
    res.status(500).json({ message: "Failed to Fetch Review." });
  }
});

app.post('/get-conference-invites', async (req, res) => {
  const { userId } = req.body;
  console.log("Fetching conference invites for user ID:", userId);
  try {
    const invites = await prisma.user.findUnique({
      where: {
        id: parseInt(userId, 10)
      },
      select: {
        ConfReviewInvitation: {
          select: {
            id: true,
            name: true,
            location: true,
            startsAt: true,
            endAt: true,
            deadline: true,
            status: true,
            Partners: true
          }
        }
      },
      cacheStrategy: { ttl: 60 },
    });

    if (!invites || !invites.ConfReviewInvitation) {
      return res.status(404).json({ message: 'No conference invitations found.' });
    }

    res.status(200).json({ conferences: invites.ConfReviewInvitation });
  } catch (error) {
    console.error('Failed to fetch conference invites:', error);
    res.status(500).json({ message: 'Could not fetch conference invitations', details: error.message });
  }
});

app.post('/get-your-reviews', async (req, res) => {
  const { reviewerId} = req.body;
  try {
    const review = await prisma.reviews.findMany({
      where:{
        ReviewerId: parseInt(reviewerId, 10), 
      },
      select:{
        id:true,
        Comment:true,
        Recommendation:true,
        submittedAt:true,
        Status:true,
        isBlind:true,
        scoreOriginality:true,
        scoreClarity:true,
        scoreSoundness:true,
        scoreSignificance:true,
        scoreRelevance:true,
        avgScore:true,
        assignedAt:true,
        Paper:{
          select:{
            id:true,
            Title:true,
            Conference:{
              select:{
                id:true,
                name:true,
              }
            },
            Abstract:true,
            Authors:{
              select:{
                id:true,
                firstname:true,
                lastname:true,
                organisation:true,
                expertise:true,
              }
            },
            submittedAt:true,
            URL:true,
            TrackId:true,
            Tracks:{
              select:{
                id:true,
                Name:true,
              }
            },
          }
        }
      }
    }); 
    if (!review) {
      return res.status(404).json({ message: 'No Available Review.' });
    }
    res.status(201).json({reviews:review});
  } catch (error) {
    console.error('Failed to Fetch Reviews:', error);
    res.status(500).json({ message: "Failed to Fetch Review." });
  }
});

app.post('/reviewInvitationResponse', async (req, res) => {
  const { reviewId, response} = req.body;
  
  try {
    const updatedReview = await prisma.reviews.update({
      where:{
        id:reviewId
      },
      data: {
        Status: response,
        assignedAt: new Date(),
      }
    });
    res.status(201).json(updatedReview);
  } catch (error) {
    console.error('Failed to update review invitation response:', error);
    res.status(500).json({ message: "Failed to update review invitation response." });
  }
});

app.post('/paper-decision', async (req, res) => {
  try {
    const { paperId, status, total } = req.body;

    const updatePaper = await prisma.paper.update({
      where: { id: paperId },
      data: {
        Status: status,
      },
      cacheStrategy: { ttl: 60 },
    });

    res.status(200).json({ paper: updatePaper });

     for (const author of total) {
      try {
         sendMail(
          author.email,
          `Paper Decision for ${updatePaper.Title}`,
          `Dear ${author.firstname} ${author.lastname},<br><br>Your paper titled "<strong>${updatePaper.Title}</strong>" has been <strong>${status}</strong>.<br><br>Thank you for your submission.<br><br>Best regards,<br>Conference Committee`
        );
        console.log(`✅ Decision mail sent to: ${author.email}`);
      } catch (mailError) {
        console.error(`❌ Failed to send mail to ${author.email}:`, mailError.message);
      }
    }

  } catch (error) {
    console.error("❌ Paper decision error:", error);
    res.status(500).json({ message: 'Could not update paper status', details: error.message });
  }
});

app.post('/conference/registeration', async (req, res) => {
  try {
    const { name, location, startsAt, endAt, deadline, link, status, Partners, hostID, tracks } = req.body;
    
    if (!name || !location || !startsAt || !endAt || !deadline || !hostID) {
      return res.status(400).json({ message: 'Missing required conference fields' });
    }

    const tracksToCreate = tracks ? tracks.map(trackName => ({ Name: trackName })) : [];

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
        hostID,
        Tracks: {
          create: tracksToCreate
        }
      },
      cacheStrategy: { ttl: 60 },
    });
    
    res.status(201).json({ conference: newConference });

  } catch (error) {
    console.error('Conference registration failed:', error);
    res.status(500).json({ message: 'Could not create conference', details: error.message });
  }
});

app.post('/conference/registered', async (req, res) => {
  try {
    const { userId } = req.body;
    const conferences = await prisma.conference.findMany({
      where: {
        OR:[
        {hostID: parseInt(userId)},
        {Tracks: {
          some: {
            Chairs: {
              some: {
                id: parseInt(userId),
              }
            }
          }
        }
      }
      ]
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
        Partners: true,
        hostID: true,
        Tracks: {
          select: {
            id: true,
            Name: true,
          }
        }
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
        ConferenceId: parseInt(conferenceId),
        Status:{
          not:"Pending Submission"
        }
      },
      select: {
        id: true,
        Title: true,
        Status: true,
        Keywords: true,
        Abstract: true,
        AuthorOrder: true,
        URL: true,
        submittedAt: true,
        isFinal:true,
        TrackId: true,
        Tracks: {
          select:{
            id:true,
            Name:true,
          },
        },
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

app.post('/conference/trackpapers', async (req, res) => {
  try {
    const { conferenceId, userId } = req.body;

    const parsedConferenceId = parseInt(conferenceId);
    const parsedUserId = parseInt(userId);

    if (isNaN(parsedConferenceId) || isNaN(parsedUserId)) {
      return res.status(400).json({ message: 'Invalid conferenceId or userId.' });
    }

    const conferencepapers = await prisma.paper.findMany({
      where: {
        ConferenceId: parsedConferenceId,
        Status: {
          not: "Pending Submission"
        },
        Tracks: {
          Chairs: {
            some: {
              id: parsedUserId
            }
          }
        }
      },
      select: {
        id: true,
        Title: true,
        Status: true,
        Keywords: true,
        Abstract: true,
        AuthorOrder: true,
        URL: true,
        submittedAt: true,
        TrackId: true,
        Tracks: {
          select:{
            id:true,
            Name:true,
          },
        },
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

    res.status(200).json({ paper: conferencepapers });

  } catch (error) {
    console.error("Error fetching conference papers:", error);
    res.status(500).json({ message: 'An internal server error occurred.', details: error.message });
  }
});

app.post('/conference/tracks/assign-chairs', async (req, res) => {
  const { trackId, userIds, conferenceId } = req.body;

  if (!trackId || !Array.isArray(userIds) || !conferenceId) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    const prismaUserConnect = userIds.map(id => ({ id: id }));

    await prisma.tracks.update({
      where: { id: trackId },
      data: {
        Chairs: {
          set: prismaUserConnect,
        },
      },
    });

    const updatedTracks = await prisma.tracks.findMany({
      where: { ConferenceId: parseInt(conferenceId, 10) },
      include: {
        Chairs: true,
        Paper: true,
      },
    });

    res.status(200).json({ tracks: updatedTracks });

  } catch (error) {
    console.error("Error assigning track chairs:", error);
    res.status(500).json({ message: 'Failed to assign track chairs', details: error.message });
  }
});

app.post('/conference/new-track', async (req, res) => {
  const { name, conferenceId } = req.body;

  if (!name || !conferenceId) {
    return res.status(400).json({ message: 'Name and conferenceId are required.' });
  }

  try {
    await prisma.tracks.create({
      data: {
        Name: name,
        Conference: {
          connect: { id: parseInt(conferenceId, 10)}
        }
      }
    });

    const updatedTracks = await prisma.tracks.findMany({
      where: { ConferenceId: parseInt(conferenceId, 10) },
      include: {
        Chairs: true,
        Paper: true,
      },
    });

    res.status(201).json({ tracks: updatedTracks });

  } catch (error) {
    console.error("Error creating new track:", error);
    res.status(500).json({ message: 'Failed to create track', details: error.message });
  }
});

app.post('/conference/update-details', async (req, res) => {
  const { id,name, location, startsAt, endAt, link, Partners, status } = req.body;

  try {
    const updatedConference = await prisma.conference.update({
      where: { id: parseInt(id, 10) },
      data: {
        name,
        location,
        startsAt: new Date(startsAt),
        endAt: new Date(endAt),
        link,
        Partners,
        status
      },
      include: {
        Tracks: {
          include: {
            Chairs: true,
            Paper: true,
          }
        }
      }
    });
    res.status(200).json(updatedConference);
  } catch (error) {
    console.error("Error updating core conference details:", error);
    res.status(500).json({ message: 'Failed to update conference', details: error.message });
  }
});

app.post('/conference/update-deadline', async (req, res) => {
  const { id,deadline } = req.body;

  if (!deadline) {
    return res.status(400).json({ message: 'Deadline is required.' });
  }

  try {
    const updatedConference = await prisma.conference.update({
      where: { id: parseInt(id, 10) },
      data: {
        deadline: new Date(deadline),
      },
      include: {
        Tracks: {
          include: {
            Chairs: true,
            Paper: true,
          }
        }
      }
    });
    res.status(200).json(updatedConference);
  } catch (error) {
    console.error("Error updating conference deadline:", error);
    res.status(500).json({ message: 'Failed to update deadline', details: error.message });
  }
});

app.post('/conference/tracks', async (req, res) => {
  try {
    const {conferenceId} = req.body;
    const tracks = await prisma.tracks.findMany({
      where: {ConferenceId:parseInt(conferenceId,10)},
      include: {
        Chairs: true,
        Paper: true,
      },
      cacheStrategy: { ttl: 60 },
    });
    if (!tracks || tracks.length === 0) {
      return res.status(404).json({ message: 'No Available Tracks.' });
    }
    res.status(200).json({ tracks: tracks });
    
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ message: 'An internal server error occurred.', details: error.message });
  }
});

app.post('/final-paper-decision', async (req, res) => {
  const {paperId, decision } = req.body;

  if (!decision) {
    return res.status(400).json({ message: 'Decision is required.' });
  }

  try {
    await prisma.paper.update({
      where: { id: paperId },
      data: {
        Status: decision,
        isFinal: true
      }
    });
    res.status(200).json({ message: 'Decision updated successfully.' });
  } catch (error) {
    console.error("Error updating paper decision:", error);
    res.status(500).json({ message: 'Failed to update decision', details: error.message });
  }
});

app.post('/conference/invite-reviewer', async (req, res) => {
  try {
    const { confId, reviewerIds } = req.body;

    if (!confId || !reviewerIds) return res.status(400).json({ message: 'confId and reviewerIds are required' });

    const parsedConfId = parseInt(confId, 10);

    let ids = [];
    if (Array.isArray(reviewerIds)) {
      ids = reviewerIds.map(id => parseInt(id, 10));
    } else {
      ids = [parseInt(reviewerIds, 10)];
    }

    const reviewerIdsToConnect = Array.from(new Set(ids.filter(id => !isNaN(id))));
    if (reviewerIdsToConnect.length === 0) return res.status(400).json({ message: 'No valid reviewerIds provided' });

    const connectArray = reviewerIdsToConnect.map(id => ({ id }));

    const updated = await prisma.conference.update({
      where: { id: parsedConfId },
      data: {
        InvitedReviewers: {
          connect: connectArray,
        }
      },
      select: {
        id: true,
        Reviewers: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            organisation: true,
            expertise: true,
            email: true,
            country: true,
          }
        }
      }
    });

    res.status(200).json({ reviewers: updated.Reviewers });
  } catch (error) {
    console.error('Failed to add reviewer to conference:', error);
    res.status(500).json({ message: 'Could not add reviewer to conference', details: error.message });
  }
});

app.post('/remind-reviewers', async (req, res) => {
  try {
    const { paperId, reviewerIds } = req.body;
    if (!paperId || !reviewerIds || !Array.isArray(reviewerIds) || reviewerIds.length === 0) {
      return res.status(400).json({ message: 'paperId and reviewerIds (non-empty array) are required' });
    }

    const paper = await prisma.paper.findUnique({ where: { id: paperId }, select: { Title: true } });

    for (const id of reviewerIds) {
      try {
        const reviewer = await prisma.user.findUnique({ where: { id: parseInt(id, 10) }, select: { email: true, firstname: true, lastname: true } });
        if (!reviewer) continue;
        const subject = `Reminder: Review pending for paper ${paper ? paper.Title : paperId}`;
        const msg = `Dear ${reviewer.firstname || ''} ${reviewer.lastname || ''},<br><br>This is a friendly reminder to submit your review for the paper titled <strong>${paper ? paper.Title : paperId}</strong>.<br><br>Please submit your review at your earliest convenience.<br><br>Thanks,<br>Conference Committee`;
        sendMail(reviewer.email, subject, msg);
        console.log(`Reminder sent to reviewer id=${id} (${reviewer.email})`);
      } catch (innerErr) {
        console.error(`Failed to send reminder to reviewer ${id}:`, innerErr.message);
      }
    }

    res.status(200).json({ success: true, message: 'Reminders sent (attempted).' });
  } catch (error) {
    console.error('Failed to send reminders:', error);
    res.status(500).json({ message: 'Could not send reminders', details: error.message });
  }
});

app.post('/remind-invited-reviewers', async (req, res) => {
  try {
    const { paperId, reviewerIds } = req.body;
    if (!paperId || !reviewerIds || !Array.isArray(reviewerIds) || reviewerIds.length === 0) {
      return res.status(400).json({ message: 'paperId and reviewerIds (non-empty array) are required' });
    }

    const paper = await prisma.paper.findUnique({ where: { id: paperId }, select: { Title: true } });

    for (const id of reviewerIds) {
      try {
        const reviewer = await prisma.user.findUnique({ where: { id: parseInt(id, 10) }, select: { email: true, firstname: true, lastname: true } });
        if (!reviewer) continue;
        const subject = `Reminder: Invitaion pending for paper review ${paper ? paper.Title : paperId}`;
        const msg = `Dear ${reviewer.firstname || ''} ${reviewer.lastname || ''},<br><br>This is a friendly reminder to respond to the invitation to review for the paper titled <strong>${paper ? paper.Title : paperId}</strong>.<br><br>Please update your response at your earliest convenience.<br><br>Thanks,<br>Conference Committee`;
        sendMail(reviewer.email, subject, msg);
        console.log(`Reminder sent to reviewer id=${id} (${reviewer.email})`);
      } catch (innerErr) {
        console.error(`Failed to send reminder to reviewer ${id}:`, innerErr.message);
      }
    }

    res.status(200).json({ success: true, message: 'Reminders sent (attempted).' });
  } catch (error) {
    console.error('Failed to send reminders:', error);
    res.status(500).json({ message: 'Could not send reminders', details: error.message });
  }
});

app.post('/accept-conference-invite', async (req, res) => {
  try {
    const { conferenceId, userId } = req.body;
    if (!conferenceId || !userId) {
      return res.status(400).json({ message: 'conferenceId and userId are required' });
    }

    await prisma.conference.update({
      where: { id: parseInt(conferenceId, 10) },
      data: {
        InvitedReviewers: {
          disconnect: { id: parseInt(userId, 10) }
        }
      }
    });

    const updatedConf = await prisma.conference.update({
      where: { id: parseInt(conferenceId, 10) },
      data: {
        Reviewers: {
          connect: { id: parseInt(userId, 10) }
        }
      }
    });

    res.status(200).json({ conference: updatedConf });
  } catch (error) {
    console.error('Failed to accept conference invite:', error);
    res.status(500).json({ message: 'Could not accept conference invite', details: error.message });
  }
});

app.post('/decline-conference-invite', async (req, res) => {
  try {
    const { conferenceId, userId } = req.body;
    if (!conferenceId || !userId) {
      return res.status(400).json({ message: 'conferenceId and userId are required' });
    }

    const updatedConf = await prisma.conference.update({
      where: { id: parseInt(conferenceId, 10) },
      data: {
        InvitedReviewers: {
          disconnect: { id: parseInt(userId, 10) }
        }
      }
    });

    res.status(200).json({ conference: updatedConf });
  } catch (error) {
    console.error('Failed to decline conference invite:', error);
    res.status(500).json({ message: 'Could not decline conference invite', details: error.message });
  }
});

app.post('/remove-reviewers', async (req, res) => {
  try {
    const { paperId, reviewerIds } = req.body;
    if (!paperId || !reviewerIds || !Array.isArray(reviewerIds) || reviewerIds.length === 0) {
      return res.status(400).json({ message: 'paperId and reviewerIds (non-empty array) are required' });
    }

    const parsedIds = reviewerIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    if (parsedIds.length === 0) return res.status(400).json({ message: 'No valid reviewerIds provided' });

    await prisma.reviews.deleteMany({
      where: {
        PaperId: paperId,
        ReviewerId: { in: parsedIds }
      }
    });

    const updated = await prisma.paper.findUnique({
      where: { id: paperId },
      select: {
        id: true,
        Title: true,
        Status: true,
        Keywords: true,
        Abstract: true,
        URL: true,
        AuthorOrder: true,
        submittedAt: true,
        TrackId: true,
        isFinal:true,
        Tracks: {
          select:{
            id:true,
            Name:true,
          },
        },
        Conference: {
          select: {
            id: true,
            name: true,
            Tracks:{
              select:{
                id:true,
                Name:true,
              }
            }
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
        },
        Reviews: {
          select: {
            id: true,
            ReviewerId: true,
            Comment: true,
            Recommendation: true,
            submittedAt: true,
            Status: true,
            isBlind: true,
            scoreClarity: true,
            scoreOriginality: true,
            scoreRelevance: true,
            scoreSignificance: true,
            scoreSoundness: true,
            avgScore: true,
            assignedAt: true,
            User: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
              }
            }
          }
        }
      }
    });

    res.status(200).json({ paper: updated });
  } catch (error) {
    console.error('Failed to remove reviewers from paper:', error);
    res.status(500).json({ message: 'Could not remove reviewers', details: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('🚀 API is running and connected to Prisma Postgres!');
});

app.listen(port, () => {
  console.log(`🚀 Server connected to Prisma Postgres, running at http://localhost:${port}`);
});