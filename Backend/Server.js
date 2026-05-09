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
import cron from 'node-cron';
import { Key } from 'lucide-react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
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
    from: `"SubmitEase System" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: sub,
    html: msg
  }, function (error, info) {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent successfully:', info.response);
    }
  });
}

const sendAutomatedEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `"SubmitEase System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    });
    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
  } catch (error) {
    console.error(`[EMAIL FAILED] To: ${to} | Error:`, error.message);
  }
};

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
async function uploadPdfToSupabase(fileBuffer, Filename, folderPath = '', editpdf = false) {
  const fileName = `${Filename}`;
  const bucketName = 'SubmitEase';
  const filePath = `${folderPath}/${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, fileBuffer, {
      contentType: 'application/pdf',
      upsert: editpdf,
    });

  if (uploadError) {
    throw new Error(`Supabase upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  if (!data || !data.publicUrl) {
    throw new Error('Could not retrieve public URL after upload.');
  }

  return data.publicUrl;
}

// --- HELPER FUNCTIONS FOR ROLES ---

// Helper to safely get roles as an array
const getRolesArray = (userRole) => {
  if (Array.isArray(userRole)) return userRole;
  if (typeof userRole === 'string') return [userRole];
  return [];
};

// Helper to Add a Role (No Duplicates)
const addRoleToUsers = async (userIds, roleName) => {
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } }
  });

  const updates = users.map(user => {
    const currentRoles = getRolesArray(user.role);
    if (!currentRoles.includes(roleName)) {
      return prisma.user.update({
        where: { id: user.id },
        data: { role: [...currentRoles, roleName] }
      });
    }
    return Promise.resolve();
  });

  await Promise.all(updates);
};

// Helper to Remove a Role
const removeRoleFromUser = async (userId, roleName) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const currentRoles = getRolesArray(user.role);
  const newRoles = currentRoles.filter(r => r !== roleName);

  // Optional: Ensure they at least have 'Author' if array becomes empty
  if (newRoles.length === 0) newRoles.push("Author");

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRoles }
  });
};


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
    const idsToUpdate = userIds.map(id => parseInt(id, 10));

    // 1. Update Conference Relations
    const updatedConference = await prisma.conference.update({
      where: { id: parseInt(conferenceId, 10) },
      data: {
        PublicationChairs: {
          connect: prismaUserConnect,
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

    // 2. Update Roles (Append "Publication Chair")
    await addRoleToUsers(idsToUpdate, "Publication Chair");

    res.status(200).json({ conference: updatedConference });
  } catch (error) {
    console.error("Error assigning publication chairs:", error);
    res.status(500).json({ message: 'Failed to assign publication chairs', details: error.message });
  }
});

// Remove Publication Chair
app.post('/conference/remove-publication-chair', async (req, res) => {
  try {
    const { conferenceId, userId } = req.body;

    // 1. Disconnect from Conference
    const updatedConference = await prisma.conference.update({
      where: { id: parseInt(conferenceId) },
      data: {
        PublicationChairs: {
          disconnect: { id: parseInt(userId) }
        }
      },
      include: {
        PublicationChairs: { select: { id: true, firstname: true, lastname: true, email: true, organisation: true } }
      }
    });

    // 2. Remove Role (Only "Publication Chair")
    await removeRoleFromUser(parseInt(userId), "Publication Chair");

    res.status(200).json({ conference: updatedConference });
  } catch (error) {
    console.error("Error removing publication chair:", error);
    res.status(500).json({ message: 'Failed to remove chair', details: error.message });
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
    const idsToUpdate = userIds.map(id => parseInt(id, 10));

    // 1. Update Conference Relations
    const updatedConference = await prisma.conference.update({
      where: { id: parseInt(conferenceId, 10) },
      data: {
        RegistrationChairs: {
          connect: prismaUserConnect,
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

    // 2. Update Roles (Append "Registration Chair")
    await addRoleToUsers(idsToUpdate, "Registration Chair");

    res.status(200).json({ conference: updatedConference });
  } catch (error) {
    console.error("Error assigning registration chairs:", error);
    res.status(500).json({ message: 'Failed to assign registration chairs', details: error.message });
  }
});

// Remove Registration Chair
app.post('/conference/remove-registration-chair', async (req, res) => {
  try {
    const { conferenceId, userId } = req.body;

    // 1. Disconnect from Conference
    const updatedConference = await prisma.conference.update({
      where: { id: parseInt(conferenceId) },
      data: {
        RegistrationChairs: {
          disconnect: { id: parseInt(userId) }
        }
      },
      include: {
        RegistrationChairs: { select: { id: true, firstname: true, lastname: true, email: true, organisation: true } }
      }
    });

    // 2. Remove Role (Only "Registration Chair")
    await removeRoleFromUser(parseInt(userId), "Registration Chair");

    res.status(200).json({ conference: updatedConference });
  } catch (error) {
    console.error("Error removing registration chair:", error);
    res.status(500).json({ message: 'Failed to remove chair', details: error.message });
  }
});

app.post('/send-verification', async (req, res) => {
  const { email, firstname } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    // 1. Check if user already exists before sending code
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    // 2. Generate a random 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Hash the code so we can send it to the frontend safely
    const salt = await bcrypt.genSalt(10);
    const hashedCode = await bcrypt.hash(verificationCode, salt);

    // 4. Send the email
    const mailOptions = {
      from: '"SubmitEase Security" <your-email@gmail.com>',
      to: email,
      subject: 'Your Verification Code',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Hello ${firstname},</h2>
          <p>Please use the code below to verify your email address:</p>
          <h1 style="color: #059669; letter-spacing: 5px;">${verificationCode}</h1>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    // 5. Return the hash to the frontend
    res.status(200).json({
      message: "Verification code sent.",
      hash: hashedCode
    });

  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ message: "Failed to send verification email." });
  }
});

// POST /users: Create a new user (Sign-Up) with a hashed password
app.post('/users', async (req, res) => {
  try {
    // Extract OTP and Hash alongside user data
    const {
      otp,
      hash,
      email,
      password,
      firstname,
      lastname,
      role,
      expertise,
      organisation,
      country,
      sub,
      msg
    } = req.body;

    // --- NEW: 2FA Verification Logic ---
    if (!otp || !hash) {
      return res.status(400).json({ message: "Verification code missing." });
    }

    // Compare the user-entered OTP with the hash sent from /send-verification
    const isMatch = await bcrypt.compare(otp, hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid verification code." });
    }
    // -----------------------------------

    // Proceed with your original logic
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const roleData = Array.isArray(role) ? role : [role || "Author"];

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstname,
        lastname,
        role: roleData,
        expertise,
        organisation,
        country
      },
      cacheStrategy: { ttl: 60 },
    });

    const { password: _, ...userWithoutPassword } = newUser;

    // Send your welcome email (optional, since you just verified them)
    if (typeof sendMail === 'function') {
      sendMail(email, sub, msg);
    }

    res.status(201).json(userWithoutPassword);

  } catch (error) {
    // Error handling (User already exists check is handled in /send-verification too, but good to keep here as fallback)
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
        isAdmin: true,
        // Fetch the user's assigned journals directly during login
        JournalAssignments: {
          select: {
            role: true,
            JournalId: true,
            Journal: {
              select: { name: true, status: true }
            }
          }
        },
        /* Note: If you have a similar table for conferences, 
           you can add ConferenceAssignments: { select: { ... } } here too! */
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

    // Format the journals to make them clean and easy to use on the frontend
    const activeJournals = user.JournalAssignments?.map(a => ({
      journalId: a.JournalId,
      journalName: a.Journal?.name,
      roles: a.role
    })) || [];

    // Destructure to remove the password and the raw JournalAssignments array
    const { password: _, JournalAssignments: __, ...userWithoutPassword } = user;

    // Attach the clean activeJournals array to the final object
    const finalUser = {
      ...userWithoutPassword,
      activeJournals
    };

    res.status(200).json({ user: finalUser });

  } catch (error) {
    res.status(500).json({ message: 'An internal server error occurred.', details: error.message });
  }
});

// --- Endpoint 1: Send Reset Code ---
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // 1. Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Security best practice: Don't reveal if email exists or not to prevent scraping
      // But for UI feedback we will return success regardless, or specific error if you prefer
      return res.status(200).json({ message: "If an account exists, a code has been sent." });
    }

    // 2. Generate Code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Hash Code
    const salt = await bcrypt.genSalt(10);
    const hashedCode = await bcrypt.hash(verificationCode, salt);

    // 4. Send Email
    const mailOptions = {
      from: '"SubmitEase Security" <your-email@gmail.com>',
      to: email,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>Use the code below to reset your password:</p>
          <h1 style="color: #059669; letter-spacing: 5px;">${verificationCode}</h1>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    // 5. Return Hash (Frontend will send this back for verification)
    res.status(200).json({ message: "Verification code sent.", hash: hashedCode });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to send email." });
  }
});

// --- Endpoint 2: Reset Password ---
app.post('/reset-password', async (req, res) => {
  const { email, otp, hash, newPassword } = req.body;

  try {
    // 1. Verify OTP
    const isMatch = await bcrypt.compare(otp, hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid verification code." });
    }

    // 2. Hash New Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 3. Update User in DB
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Password updated successfully. Please sign in." });

  } catch (error) {
    console.error("Reset error:", error);
    res.status(500).json({ message: "Failed to reset password." });
  }
});

// PUT: Update Profile Details (Organisation & Expertise)
app.put('/user/profile/:id', async (req, res) => {
  const { id } = req.params;
  const { organisation, expertise } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id, 10) },
      data: { organisation, expertise }
    });
    res.status(200).json({ user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Request OTP for Email Update (Stateless using bcrypt)
app.post('/user/request-email-update', async (req, res) => {
  const { newEmail, firstname } = req.body;

  if (!newEmail) return res.status(400).send("Email is required.");

  try {
    // 1. Check if email is already in use
    const existingUser = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existingUser) return res.status(400).send("An account with this email already exists.");

    // 2. Generate OTP and Hash
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedCode = await bcrypt.hash(otp, salt);

    // 3. Send Email (using your existing transporter logic)
    const mailOptions = {
      from: `"SubmitEase System" <${process.env.EMAIL_USER}>`,
      to: newEmail,
      subject: 'Verify Your New Email Address',
      html: `
              <div style="font-family: sans-serif; padding: 20px;">
                <h2>Hello ${firstname || 'User'},</h2>
                <p>You requested to update your email address on SubmitEase. Please use the code below to verify this inbox:</p>
                <h1 style="color: #059669; letter-spacing: 5px;">${otp}</h1>
                <p>If you didn't request this, please ignore this email and your account will remain unchanged.</p>
              </div>
            `
    };
    await transporter.sendMail(mailOptions);

    // 4. Return hash to frontend
    res.status(200).json({ hash: hashedCode });
  } catch (error) {
    console.error("Email update OTP error:", error);
    res.status(500).send("Failed to send OTP.");
  }
});

// POST: Verify OTP Hash and Update Email
app.post('/user/verify-email-update', async (req, res) => {
  const { userId, newEmail, otp, hash } = req.body;
  try {
    // Compare the raw OTP the user typed with the hashed OTP we sent earlier
    const isValid = await bcrypt.compare(otp, hash);
    if (!isValid) return res.status(400).send("Invalid verification code.");

    // Update the user in the database
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId, 10) },
      data: { email: newEmail }
    });

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    console.error("Email update verification error:", error);
    res.status(500).send("Failed to update email.");
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

// Replace your existing /get-conference-by-id endpoint with this:
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
        host: {
          select: { firstname: true, lastname: true, email: true, organisation: true }
        },
        PublicationChairs: {
          select: { id: true, firstname: true, lastname: true, email: true, organisation: true, expertise: true }
        },
        RegistrationChairs: {
          select: { id: true, firstname: true, lastname: true, email: true, organisation: true, expertise: true }
        },
        Tracks: {
          select: {
            id: true,
            Name: true,
            Chairs: {
              select: { id: true, firstname: true, lastname: true, email: true, organisation: true }
            }
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
        isFinal: true,
        TrackId: true,
        Tracks: {
          select: {
            id: true,
            Name: true,
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
        isFinal: true,
        Tracks: {
          select: {
            id: true,
            Name: true,
          },
        },
        Conference: {
          select: {
            id: true,
            name: true,
            Tracks: {
              select: {
                id: true,
                Name: true,
              }
            }
          },
        },
        Authors: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            organisation: true,
            expertise: true,
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
            scoreOriginality: true,
            scoreClarity: true,
            scoreSoundness: true,
            scoreSignificance: true,
            scoreRelevance: true,
            avgScore: true,
            isBlind: true,
            assignedAt: true,
            User: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                organisation: true,
                expertise: true,
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
  const { title, confId: cid, abstract } = req.body;
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
    const randomSuffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const fileName = `${newPaperID}_${randomSuffix}`;
    let url;
    const safeName = conf.name.replace(/[^a-zA-Z0-9]/g, '_');
    const confName = `${safeName}_${confId}/InReview`;
    try {
      url = await uploadPdfToSupabase(req.file.buffer, fileName + '.pdf', confName);
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
        AuthorOrder: authorIdsInt,
        URL: url,
        Status: 'Pending Submission',
        submittedAt: new Date(),
        Tracks: {
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
    const { paperId, title, confId: cid, abstract, trackId } = req.body;
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
          AuthorOrder: authorIdsInt,
          Authors: {
            set: authorConnects,
          },
        },
        cacheStrategy: { ttl: 60 },
      });
      res.status(200).json({ paper: updatePaper });
    }
    else {
      let url;
      try {
        const conf = await prisma.conference.findUnique({
          where: { id: confId },
          select: { name: true },
        });
        const randomSuffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        const fileName = `${paperId}_${randomSuffix}`;
        const safeName = conf.name.replace(/[^a-zA-Z0-9]/g, '_');
        const confName = `${safeName}_${confId}/InReview`;
        url = await uploadPdfToSupabase(req.file.buffer, fileName + '.pdf', confName);
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
          AuthorOrder: authorIdsInt,
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
    }
  } catch (error) {
    console.error('Failed to Submit Paper:', error);
    if (error.code === 'P2025') {
      return res.status(400).json({ message: 'One or more author IDs do not correspond to an existing user.' });
    }
    res.status(500).json({ message: 'Could not Submit Paper', details: error.message });
  }
});

app.post('/editpaper', upload.single('pdfFile'), async (req, res) => {
  try {
    const { paperId, title, confId: cid, abstract } = req.body;
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
          AuthorOrder: authorIdsInt,
          TrackId: trackId,
          Authors: {
            set: authorConnects,
          },
        },
      });
      res.status(200).json({ paper: updatePaper });
    }
    else {
      let url;
      try {
        const conf = await prisma.conference.findUnique({ where: { id: confId }, select: { name: true } });
        const safeName = conf.name.replace(/[^a-zA-Z0-9]/g, '_');
        const confName = `${safeName}_${confId}/InReview`;
        url = await uploadPdfToSupabase(req.file.buffer, paperId + '.pdf', confName);
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
          AuthorOrder: authorIdsInt,
          URL: url,
          submittedAt: new Date(),
          TrackId: trackId,
          Authors: {
            set: authorConnects,
          },
        },
      });
      res.status(200).json({ paper: updatePaper });
    }
  } catch (error) {
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
        role: true, // Include role to debug
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
    const { confId } = req.body;
    const reviewers = await prisma.conference.findUnique({
      where: { id: confId },
      select: {
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
      },
      cacheStrategy: { ttl: 60 },
    });
    if (!reviewers || reviewers.length === 0) {
      return res.status(404).json({ message: 'No reviewers found.' });
    }
    res.status(200).json({ reviewers: reviewers.Reviewers });

  } catch (error) {
    console.error('Error fetching reviewers:', error);
    res.status(500).json({ message: 'An internal server error occurred.', details: error.message });
  }
});

app.post('/assign-reviewers', async (req, res) => {
  try {
    const { paperId, reviewerIds, isBlind } = req.body;

    if (!paperId || !reviewerIds) {
      return res.status(400).json({ message: 'Missing paperId, reviewerIds' });
    }

    const reviewData = reviewerIds.map((id) => ({
      PaperId: paperId,
      ReviewerId: parseInt(id, 10),
      Comment: "",
      Recommendation: "",
      submittedAt: null,
      Status: "Pending Invitation",
      isBlind: isBlind,
      assignedAt: new Date(),
    }));

    // 1. Create Reviews
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
        isFinal: true,
        TrackId: true,
        Tracks: {
          select: {
            id: true,
            Name: true,
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
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            organisation: true,
            expertise: true,
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
            scoreOriginality: true,
            scoreClarity: true,
            scoreSoundness: true,
            scoreSignificance: true,
            scoreRelevance: true,
            avgScore: true,
            assignedAt: true,
            User: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                expertise: true,
                organisation: true,
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
  const { paperId, reviewerId, Recommendation, Comment, scoreOriginality, scoreClarity, scoreSoundness, scoreSignificance, scoreRelevance } = req.body;
  const avgScore = (scoreOriginality + scoreClarity + scoreSoundness + scoreSignificance + scoreRelevance) / 5.0;
  try {
    const newReview = await prisma.reviews.update({
      where: {
        PaperId_ReviewerId: {
          PaperId: paperId,
          ReviewerId: parseInt(reviewerId, 10),
        }
      },
      data: {
        Recommendation: Recommendation,
        Comment: Comment,
        submittedAt: new Date(),
        Status: "Submitted",
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
  const { paperId, reviewerId, Recommendation, Comment, scoreOriginality, scoreClarity, scoreSoundness, scoreSignificance, scoreRelevance } = req.body;

  try {
    const newReview = await prisma.reviews.update({
      where: {
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
  const { paperId, reviewerId } = req.body;
  try {
    const review = await prisma.reviews.findUnique({
      where: {
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
  const { reviewerId } = req.body;
  try {
    const review = await prisma.reviews.findMany({
      where: {
        ReviewerId: parseInt(reviewerId, 10),
      },
      select: {
        id: true,
        Comment: true,
        Recommendation: true,
        submittedAt: true,
        Status: true,
        isBlind: true,
        scoreOriginality: true,
        scoreClarity: true,
        scoreSoundness: true,
        scoreSignificance: true,
        scoreRelevance: true,
        avgScore: true,
        assignedAt: true,
        Paper: {
          select: {
            id: true,
            Title: true,
            Conference: {
              select: {
                id: true,
                name: true,
              }
            },
            Abstract: true,
            Authors: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                organisation: true,
                expertise: true,
              }
            },
            submittedAt: true,
            URL: true,
            TrackId: true,
            Tracks: {
              select: {
                id: true,
                Name: true,
              }
            },
          }
        }
      }
    });
    if (!review) {
      return res.status(404).json({ message: 'No Available Review.' });
    }
    res.status(201).json({ reviews: review });
  } catch (error) {
    console.error('Failed to Fetch Reviews:', error);
    res.status(500).json({ message: "Failed to Fetch Review." });
  }
});

app.post('/reviewInvitationResponse', async (req, res) => {
  const { reviewId, response } = req.body;

  try {
    const updatedReview = await prisma.reviews.update({
      where: {
        id: reviewId
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

    // Update Host Role
    if (hostID) {
      await addRoleToUsers([parseInt(hostID)], "Conference Host");
    }

    res.status(201).json({ conference: newConference });

  } catch (error) {
    console.error('Conference registration failed:', error);
    res.status(500).json({ message: 'Could not create conference', details: error.message });
  }
});

app.post('/conference/registered/chiefchair', async (req, res) => {
  try {
    const { userId } = req.body;
    const parsedUserId = parseInt(userId);

    const conferences = await prisma.conference.findMany({
      where: {
        hostID: parsedUserId,
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
        // Return IDs of chairs to verify on frontend
        PublicationChairs: {
          select: { id: true }
        },
        RegistrationChairs: {
          select: { id: true }
        },
        Tracks: {
          select: {
            id: true,
            Name: true,
            Chairs: {
              select: { id: true }
            }
          }
        }
      },
      // cacheStrategy: { ttl: 60 }, // Commented out for testing immediate role changes
    });

    if (!conferences || conferences.length === 0) {
      return res.status(404).json({ message: 'No Available Conferences.' });
    }

    res.status(200).json({ conference: conferences });

  } catch (error) {
    console.error("Error fetching registered conferences:", error);
    res.status(500).json({ message: 'An internal server error occurred.', details: error.message });
  }
});

app.post('/conference/registered/trackchair', async (req, res) => {
  try {
    const { userId } = req.body;
    const parsedUserId = parseInt(userId);

    const conferences = await prisma.conference.findMany({
      where: {
        // Check if user is a Chair of ANY track in this conference
        Tracks: { some: { Chairs: { some: { id: parsedUserId } } } },

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
        // Return IDs of chairs to verify on frontend
        PublicationChairs: {
          select: { id: true }
        },
        RegistrationChairs: {
          select: { id: true }
        },
        Tracks: {
          select: {
            id: true,
            Name: true,
            Chairs: {
              select: { id: true }
            }
          }
        }
      },
      // cacheStrategy: { ttl: 60 }, // Commented out for testing immediate role changes
    });

    if (!conferences || conferences.length === 0) {
      return res.status(404).json({ message: 'No Available Conferences.' });
    }

    res.status(200).json({ conference: conferences });

  } catch (error) {
    console.error("Error fetching registered conferences:", error);
    res.status(500).json({ message: 'An internal server error occurred.', details: error.message });
  }
});
app.post('/conference/registered/publicationchair', async (req, res) => {
  try {
    const { userId } = req.body;
    const parsedUserId = parseInt(userId);

    const conferences = await prisma.conference.findMany({
      where: {
        // Check if user is a Publication Chair
        PublicationChairs: { some: { id: parsedUserId } },
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
        // Return IDs of chairs to verify on frontend
        PublicationChairs: {
          select: { id: true }
        },
        RegistrationChairs: {
          select: { id: true }
        },
        Tracks: {
          select: {
            id: true,
            Name: true,
            Chairs: {
              select: { id: true }
            }
          }
        }
      },
      // cacheStrategy: { ttl: 60 }, // Commented out for testing immediate role changes
    });

    if (!conferences || conferences.length === 0) {
      return res.status(404).json({ message: 'No Available Conferences.' });
    }

    res.status(200).json({ conference: conferences });

  } catch (error) {
    console.error("Error fetching registered conferences:", error);
    res.status(500).json({ message: 'An internal server error occurred.', details: error.message });
  }
});
app.post('/conference/registered/registrationchair', async (req, res) => {
  try {
    const { userId } = req.body;
    const parsedUserId = parseInt(userId);

    const conferences = await prisma.conference.findMany({
      where: {
        // Check if user is a Registration Chair
        RegistrationChairs: { some: { id: parsedUserId } }
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
        // Return IDs of chairs to verify on frontend
        PublicationChairs: {
          select: { id: true }
        },
        RegistrationChairs: {
          select: { id: true }
        },
        Tracks: {
          select: {
            id: true,
            Name: true,
            Chairs: {
              select: { id: true }
            }
          }
        }
      },
      // cacheStrategy: { ttl: 60 }, // Commented out for testing immediate role changes
    });

    if (!conferences || conferences.length === 0) {
      return res.status(404).json({ message: 'No Available Conferences.' });
    }

    res.status(200).json({ conference: conferences });

  } catch (error) {
    console.error("Error fetching registered conferences:", error);
    res.status(500).json({ message: 'An internal server error occurred.', details: error.message });
  }
});

app.post('/conference/papers', async (req, res) => {
  try {
    const { conferenceId } = req.body;

    const conferencepapers = await prisma.paper.findMany({
      where: {
        ConferenceId: parseInt(conferenceId),
        Status: {
          not: "Pending Submission"
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
        isFinal: true,
        TrackId: true,
        Tracks: {
          select: {
            id: true,
            Name: true,
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
        },
        Reviews: {
          select: {
            id: true,
            ReviewerId: true,
            Comment: true,
            Recommendation: true,
            submittedAt: true,
            Status: true,
            scoreOriginality: true,
            scoreClarity: true,
            scoreSoundness: true,
            scoreSignificance: true,
            scoreRelevance: true,
            avgScore: true,
            isBlind: true,
            assignedAt: true,
          },
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
          select: {
            id: true,
            Name: true,
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

app.post('/conference/finalpapers', async (req, res) => {
  try {
    const { conferenceId } = req.body;

    const parsedConferenceId = parseInt(conferenceId);

    if (isNaN(parsedConferenceId)) {
      return res.status(400).json({ message: 'Invalid conferenceId.' });
    }

    const conferencepapers = await prisma.paper.findMany({
      where: {
        ConferenceId: parsedConferenceId,
        Status: "Accepted",
        isFinal: true,
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
        FinalPaperURL: true,
        CopyrightURL: true,
        RegistrationURL: true,
        Completed: true,
        isFinal: true,
        CompletedPublication: true,
        CompletedRegistration: true,

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
    const idsToUpdate = userIds.map(id => parseInt(id, 10));

    // 1. Update Track Relations
    await prisma.tracks.update({
      where: { id: trackId },
      data: {
        Chairs: {
          connect: prismaUserConnect,
        },
      },
    });

    // 2. Update Roles (Append "Track Chair")
    await addRoleToUsers(idsToUpdate, "Track Chair");

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

// Remove Track Chair
app.post('/conference/tracks/remove-chair', async (req, res) => {
  const { trackId, userId, conferenceId } = req.body;

  if (!trackId || !userId || !conferenceId) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    // 1. Disconnect from Track
    await prisma.tracks.update({
      where: { id: trackId },
      data: {
        Chairs: {
          disconnect: { id: parseInt(userId) }
        },
      },
    });

    // 2. Remove Role (Only "Track Chair")
    await removeRoleFromUser(parseInt(userId), "Track Chair");

    const updatedTracks = await prisma.tracks.findMany({
      where: { ConferenceId: parseInt(conferenceId, 10) },
      include: {
        Chairs: true,
        Paper: true,
      },
    });

    res.status(200).json({ tracks: updatedTracks });

  } catch (error) {
    console.error("Error removing track chair:", error);
    res.status(500).json({ message: 'Failed to remove track chair', details: error.message });
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
          connect: { id: parseInt(conferenceId, 10) }
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
  const { id, name, location, startsAt, endAt, link, Partners, status } = req.body;

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
  const { id, deadline } = req.body;

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
    const { conferenceId } = req.body;
    const tracks = await prisma.tracks.findMany({
      where: { ConferenceId: parseInt(conferenceId, 10) },
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
  const { paperId, decision } = req.body;

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
    await addRoleToUsers(reviewerIdsToConnect, "Reviewer");
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
        isFinal: true,
        Tracks: {
          select: {
            id: true,
            Name: true,
          },
        },
        Conference: {
          select: {
            id: true,
            name: true,
            Tracks: {
              select: {
                id: true,
                Name: true,
              }
            }
          },
        },
        Authors: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            organisation: true,
            expertise: true,
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

// Get Proceedings (Approved by both chairs)
app.post('/conference/proceedings', async (req, res) => {
  try {
    const { conferenceId } = req.body;
    const parsedConferenceId = parseInt(conferenceId);

    if (isNaN(parsedConferenceId)) {
      return res.status(400).json({ message: 'Invalid conferenceId.' });
    }

    const proceedings = await prisma.paper.findMany({
      where: {
        ConferenceId: parsedConferenceId,
        Status: "Accepted",
        isFinal: true,
        CompletedPublication: true,
        CompletedRegistration: true,
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
        FinalPaperURL: true,
        CopyrightURL: true,
        RegistrationURL: true,
        Completed: true,
        Authors: {
          select: {
            firstname: true,
            lastname: true,
            email: true
          }
        },
        Tracks: {
          select: {
            id: true,
            Name: true,
          }
        }
      },
    });
    res.status(200).json({ paper: proceedings });

  } catch (error) {
    console.error("Error fetching proceedings:", error);
    res.status(500).json({ message: 'An internal server error occurred.', details: error.message });
  }
});

// Bulk Approve Publication
app.post('/paper/bulk-approve-publication', async (req, res) => {
  try {
    const { paperIds } = req.body;
    if (!Array.isArray(paperIds)) {
      return res.status(400).json({ message: 'paperIds must be an array.' });
    }

    await prisma.paper.updateMany({
      where: { id: { in: paperIds } },
      data: { CompletedPublication: true }
    });

    res.status(200).json({ message: 'Papers approved for publication.' });
  } catch (error) {
    console.error("Error bulk approving publication:", error);
    res.status(500).json({ message: 'Failed to approve papers.', details: error.message });
  }
});

// Bulk Approve Registration
app.post('/paper/bulk-approve-registration', async (req, res) => {
  try {
    const { paperIds } = req.body;
    if (!Array.isArray(paperIds)) {
      return res.status(400).json({ message: 'paperIds must be an array.' });
    }

    await prisma.paper.updateMany({
      where: { id: { in: paperIds } },
      data: {
        CompletedRegistration: true,
        Completed: true
      }
    });

    res.status(200).json({ message: 'Papers approved for registration.' });
  } catch (error) {
    console.error("Error bulk approving registration:", error);
    res.status(500).json({ message: 'Failed to approve papers.', details: error.message });
  }
});


// Middleware to handle multiple specific file fields
const cpUpload = upload.fields([
  { name: 'copyrightFile', maxCount: 1 },
  { name: 'finalPaperFile', maxCount: 1 },
  { name: 'paySlipFile', maxCount: 1 }
]);

app.post('/submitfinalfiles', cpUpload, async (req, res) => {
  const { paperId } = req.body;

  if (!paperId) {
    return res.status(400).json({ message: 'Paper ID is required.' });
  }

  // Check if any files were uploaded
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ message: 'No files were uploaded.' });
  }

  try {
    // 1. Fetch the paper to get Conference details (needed for folder naming)
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      include: { Conference: true }
    });

    if (!paper) {
      return res.status(404).json({ message: 'Paper not found.' });
    }

    // 2. Prepare Folder Path: "ConferenceName_ID/Final"
    const safeConfName = paper.Conference.name.replace(/[^a-zA-Z0-9]/g, '_');
    const folderPath = `${safeConfName}_${paper.ConferenceId}/Final/${paperId}`;

    // Object to hold fields to update in Prisma
    const updateData = {};

    // Helper to generate unique filename to avoid caching issues
    const getFileName = (suffix) => `${paperId}_${suffix}.pdf`;

    // 3. Process Final Paper
    if (req.files['finalPaperFile']) {
      const file = req.files['finalPaperFile'][0];
      try {
        const url = await uploadPdfToSupabase(file.buffer, getFileName('FinalPaper'), folderPath, true);
        updateData.FinalPaperURL = url;
      } catch (err) {
        throw new Error(`Failed to upload Final Paper: ${err.message}`);
      }
    }

    // 4. Process Copyright File
    if (req.files['copyrightFile']) {
      const file = req.files['copyrightFile'][0];
      try {
        const url = await uploadPdfToSupabase(file.buffer, getFileName('Copyright'), folderPath, true);
        updateData.CopyrightURL = url;
      } catch (err) {
        throw new Error(`Failed to upload Copyright: ${err.message}`);
      }
    }

    // 5. Process Pay Slip (Registration)
    if (req.files['paySlipFile']) {
      const file = req.files['paySlipFile'][0];
      try {
        const url = await uploadPdfToSupabase(file.buffer, getFileName('Registration'), folderPath, true);
        updateData.RegistrationURL = url;
      } catch (err) {
        throw new Error(`Failed to upload Pay Slip: ${err.message}`);
      }
    }

    // 6. Logic to determine "CompletedPublication" status
    // If we are updating FinalPaper OR Copyright, check if both exist now
    const hasFinal = updateData.FinalPaperURL || paper.FinalPaperURL;
    const hasCopyright = updateData.CopyrightURL || paper.CopyrightURL;
    const hasRegistration = updateData.RegistrationURL || paper.RegistrationURL;
    if (hasFinal && hasCopyright && hasRegistration) {
      updateData.Completed = true;
    }
    // 8. Update Database
    const updatedPaper = await prisma.paper.update({
      where: { id: paperId },
      data: updateData,
    });

    res.status(200).json({
      message: 'Files uploaded successfully',
      paper: updatedPaper
    });

  } catch (error) {
    console.error('Final upload error:', error);
    res.status(500).json({ message: error.message || 'Internal server error during file upload.' });
  }
});

// --- The Logic to Close Conferences ---
const closeExpiredConferences = async () => {
  try {
    const currentTime = new Date();

    // updateMany allows us to update multiple records in one database query
    const result = await prisma.conference.updateMany({
      where: {
        deadline: {
          lt: currentTime, // 'lt' means Less Than (deadline is in the past)
        },
        status: {
          not: 'Closed', // Only update if it's not already Closed 
        },
      },
      data: {
        status: 'Closed',
      },
    });

    if (result.count > 0) {
      console.log(`[Auto-Scheduler] Successfully closed ${result.count} expired conferences at ${currentTime.toISOString()}`);
    }
  } catch (error) {
    console.error('[Auto-Scheduler] Error closing conferences:', error);
  }
};

const getBeautifulEmailTemplate = (title, bodyHtml, isDanger = false) => {
  const themeColor = isDanger ? '#dc2626' : '#059669';
  const icon = isDanger ? '!' : 'S';

  return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; padding: 40px 20px; text-align: center;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                  <tr>
                      <td align="center">
                          <div style="width: 50px; height: 50px; background-color: ${themeColor}; border-radius: 12px; display: inline-block;">
                              <p style="color: white; font-size: 26px; font-weight: bold; margin: 0; line-height: 50px;">${icon}</p>
                          </div>
                      </td>
                  </tr>
              </table>
              <h1 style="color: #1f2937; font-size: 24px; margin-top: 0; margin-bottom: 20px;">${title}</h1>
              <div style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: left; margin-bottom: 20px;">
                  ${bodyHtml}
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0 20px 0;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} SubmitEase. All rights reserved.</p>
          </div>
      </div>
    `;
};



// ============================================================================
// JOURNAL DATA & PAPER MANAGEMENT
// ============================================================================

app.get('/journal/users', async (req, res) => {
  const { journalId } = req.query;
  if (!journalId) return res.status(400).json({ message: 'journalId is required' });

  try {
    const emails = await prisma.user.findMany({
      where: { JournalAssignments: { some: { JournalId: parseInt(journalId, 10) } } },
      select: { id: true, firstname: true, lastname: true, organisation: true, expertise: true, email: true, role: true },
      cacheStrategy: { ttl: 60 },
    });
    if (!emails || emails.length === 0) return res.status(404).json({ message: 'No users found for this journal.' });

    res.status(200).json({ users: emails });
  } catch (error) {
    res.status(500).json({ message: 'An internal server error occurred.', details: error.message });
  }
});

app.get('/journal/papers', async (req, res) => {
  const { authorId, journalId } = req.query;
  if (!authorId || !journalId) return res.status(400).json({ message: 'Valid authorId and journalId are required.' });

  try {
    const rawPapers = await prisma.journalPapers.findMany({
      where: {
        JournalId: parseInt(journalId, 10),
        Authors: { some: { id: parseInt(authorId, 10) } },
        OriginalPaperId: null
      },
      select: {
        id: true, Title: true, Status: true, Keywords: true, Abstract: true, URL: true, AuthorOrder: true, submittedAt: true,
        Revisions: { take: 1, orderBy: { submittedAt: 'desc' }, select: { Status: true, submittedAt: true } },
        Editors: { select: { Status: true } },
        Reviews: { select: { Status: true } }
      },
      orderBy: { submittedAt: 'desc' }
    });
    const formattedPapers = rawPapers.map(p => {
      const hasEditor = p.Editors && p.Editors.length > 0;
      const editorDecisionMade = p.Editors && p.Editors.some(e => e.Status === 'Completed');
      const reviewersInvited = p.Reviews ? p.Reviews.length : 0;
      const reviewersSubmitted = p.Reviews ? p.Reviews.filter(r => ['Submitted', 'Completed'].includes(r.Status)).length : 0;

      return {
        ...p,
        hasEditor,
        editorDecisionMade,
        reviewersInvited,
        reviewersSubmitted
      };
    });

    res.status(200).json({ papers: formattedPapers });
  } catch (error) {
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});
app.get('/journal/getpaperbyid/:id', async (req, res) => {
  const { id } = req.params;
  // We no longer capture journalId from req.query

  try {
    // Change back to findUnique since 'id' is guaranteed unique
    const paper = await prisma.journalPapers.findUnique({
      where: { id: id }, // Only search by the unique paper ID
      include: {
        Authors: true,
        Reviews: {
          select: { id: true, Status: true, Recommendation: true, Comment: true, isVisibleToAuthor: true }
        },
        OriginalPaper: true,
        Revisions: {
          orderBy: { submittedAt: 'desc' },
          include: {
            Authors: true,
            Reviews: {
              select: { id: true, Status: true, Recommendation: true, Comment: true }
            }
          }
        }
      }
    });

    if (!paper) return res.status(404).json({ error: "Paper not found." });
    res.status(200).json({ paper });
  } catch (error) {
    console.error("Fetch Author Paper Error:", error);
    res.status(500).json({ error: error.message });
  }
});

const drawWrappedText = (page, text, x, y, maxWidth, font, fontSize) => {
  if (!text) return y;
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth > maxWidth && i > 0) {
      page.drawText(line, { x, y: currentY, size: fontSize, font, color: rgb(0, 0, 0) });
      line = words[i] + ' ';
      currentY -= (fontSize + 4);
    } else {
      line = testLine;
    }
  }
  page.drawText(line, { x, y: currentY, size: fontSize, font, color: rgb(0, 0, 0) });
  return currentY - (fontSize + 10);
};

app.post('/journal/savepaper', upload.fields([
  { name: 'pdfFile', maxCount: 1 },
  { name: 'responseSheet', maxCount: 1 },
  { name: 'additionalFiles' }
]), async (req, res) => {
  const { id, title, abstract, originalPaperId, journalId } = req.body;
  if (!journalId) return res.status(400).json({ error: 'Journal ID is required.' });

  const keywords = JSON.parse(req.body.keywords || '[]');
  const authorIdsInt = JSON.parse(req.body.authorIds || '[]').map(a => parseInt(a, 10));

  // Files are now OPTIONAL for saving a draft
  const pdfFile = req.files && req.files['pdfFile'] ? req.files['pdfFile'][0] : null;
  const responseSheetFile = req.files && req.files['responseSheet'] ? req.files['responseSheet'][0] : null;
  const additionalFiles = req.files && req.files['additionalFiles'] ? req.files['additionalFiles'] : [];

  try {
    let finalId = id;
    let journalNameStr = "SubmitEase Journal";
    const isRevision = !!originalPaperId;

    // 1. ALWAYS FETCH JOURNAL NAME
    const journal = await prisma.journal.findUnique({
      where: { id: parseInt(journalId, 10) },
      select: { name: true }
    });

    if (!journal) return res.status(404).json({ error: 'Journal not found.' });
    journalNameStr = journal.name;

    // 2. ID GENERATION (For Brand New Papers Only)
    if (!finalId) {
      const initials = journalNameStr.split(/\s+/).filter(word => word.length > 0).map(word => word[0].toUpperCase()).join('');
      const lastPaper = await prisma.journalPapers.findFirst({
        where: { JournalId: parseInt(journalId, 10) },
        orderBy: { id: 'desc' }
      });

      let nextNum = 1;
      if (lastPaper && lastPaper.id && lastPaper.id.includes('_P')) {
        const parts = lastPaper.id.split('_P');
        if (parts.length === 2) {
          const sequenceNum = parseInt(parts[1], 10);
          if (!isNaN(sequenceNum)) nextNum = sequenceNum + 1;
        }
      }
      finalId = `${initials}_${journalId}_P${String(nextNum).padStart(4, '0')}`;
    }

    const safeJournalName = journalNameStr.replace(/[^a-zA-Z0-9]/g, '_');
    const rootId = originalPaperId || finalId;
    const folder = `Journals/${safeJournalName}_${journalId}/${rootId}`;

    let standardUrl = null;
    let revisionUrl = null;

    // --- PDF GENERATION (ONLY IF PDF WAS UPLOADED) ---
    if (pdfFile) {
      const authorsData = await prisma.user.findMany({
        where: { id: { in: authorIdsInt } },
        select: { id: true, firstname: true, lastname: true, email: true, organisation: true }
      });

      const authorNamesString = authorIdsInt.map(aId => {
        const author = authorsData.find(a => a.id === aId);
        return author ? `${author.firstname} ${author.lastname} (${author.organisation || 'Independent'})` : `Author ${aId}`;
      }).join('\n');

      const createCoverPage = async (doc) => {
        const page = doc.addPage();
        const { width, height } = page.getSize();
        const font = await doc.embedFont(StandardFonts.Helvetica);
        const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

        let currentY = height - 60;
        const margin = 50;
        const maxWidth = width - (margin * 2);

        page.drawText(journalNameStr, { x: margin, y: currentY, size: 24, font: boldFont, color: rgb(0.02, 0.59, 0.41) });
        currentY -= 20;
        page.drawLine({ start: { x: margin, y: currentY }, end: { x: width - margin, y: currentY }, thickness: 2, color: rgb(0.8, 0.8, 0.8) });
        currentY -= 30;

        page.drawText('Official Manuscript Submission', { x: margin, y: currentY, size: 16, font: boldFont });
        currentY -= 30;

        currentY = drawWrappedText(page, `Title: ${title}`, margin, currentY, maxWidth, boldFont, 14);
        currentY -= 10;
        currentY = drawWrappedText(page, `Paper ID: ${finalId}`, margin, currentY, maxWidth, font, 12);

        currentY -= 10;
        page.drawText('Authors:', { x: margin, y: currentY, size: 12, font: boldFont });
        currentY -= 15;
        currentY = drawWrappedText(page, authorNamesString, margin, currentY, maxWidth, font, 11);

        currentY -= 10;
        currentY = drawWrappedText(page, `Keywords: ${keywords.join(', ')}`, margin, currentY, maxWidth, font, 12);

        currentY -= 20;
        page.drawText('Abstract:', { x: margin, y: currentY, size: 12, font: boldFont });
        currentY -= 15;
        drawWrappedText(page, abstract, margin, currentY, maxWidth, font, 10);

        page.drawLine({ start: { x: margin, y: 50 }, end: { x: width - margin, y: 50 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
        page.drawText(`Generated by SubmitEase on ${new Date().toLocaleDateString()}`, { x: margin, y: 35, size: 9, font: font, color: rgb(0.5, 0.5, 0.5) });
      };

      const standardPdf = await PDFDocument.create();
      await createCoverPage(standardPdf);
      const mainPdfDoc = await PDFDocument.load(pdfFile.buffer);
      const mainPages = await standardPdf.copyPages(mainPdfDoc, mainPdfDoc.getPageIndices());
      mainPages.forEach((page) => standardPdf.addPage(page));

      for (const addFile of additionalFiles) {
        try {
          const extraPdfDoc = await PDFDocument.load(addFile.buffer);
          const extraPages = await standardPdf.copyPages(extraPdfDoc, extraPdfDoc.getPageIndices());
          extraPages.forEach((page) => standardPdf.addPage(page));
        } catch (e) { }
      }

      const standardPdfBytes = await standardPdf.save();
      const randomSuffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      standardUrl = await uploadPdfToSupabase(Buffer.from(standardPdfBytes), `${finalId}_${randomSuffix}.pdf`, folder);

      if (isRevision && responseSheetFile) {
        const revPdf = await PDFDocument.create();
        await createCoverPage(revPdf);

        try {
          const respDoc = await PDFDocument.load(responseSheetFile.buffer);
          const respPages = await revPdf.copyPages(respDoc, respDoc.getPageIndices());
          respPages.forEach((page) => revPdf.addPage(page));
        } catch (e) { }

        const mainRevPages = await revPdf.copyPages(mainPdfDoc, mainPdfDoc.getPageIndices());
        mainRevPages.forEach((page) => revPdf.addPage(page));

        for (const addFile of additionalFiles) {
          try {
            const extraPdfDoc = await PDFDocument.load(addFile.buffer);
            const extraPages = await revPdf.copyPages(extraPdfDoc, extraPdfDoc.getPageIndices());
            extraPages.forEach((page) => revPdf.addPage(page));
          } catch (e) { }
        }

        const revPdfBytes = await revPdf.save();
        revisionUrl = await uploadPdfToSupabase(Buffer.from(revPdfBytes), `${finalId}_REV_${randomSuffix}.pdf`, folder);
      }
    }

    // --- DATABASE INSERT ---
    const newPaper = await prisma.journalPapers.create({
      data: {
        id: finalId,
        JournalId: parseInt(journalId, 10),
        Title: title,
        Abstract: abstract,
        Keywords: keywords,
        Status: "Pending Submission",
        submittedAt: new Date(),
        URL: standardUrl, // Will be null if no PDF was uploaded
        RevisionPaperURL: isRevision ? revisionUrl : null,
        AuthorOrder: authorIdsInt,
        OriginalPaperId: originalPaperId || null,
        Authors: { connect: authorIdsInt.map(id => ({ id })) }
      }
    });

    res.status(201).json({ message: 'Success', paper: newPaper });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'Paper ID already exists.' });
    res.status(500).json({ message: 'Database error', details: error.message });
  }
});


app.post('/journal/editpaper', upload.fields([
  { name: 'pdfFile', maxCount: 1 },
  { name: 'responseSheet', maxCount: 1 },
  { name: 'additionalFiles' }
]), async (req, res) => {
  const { paperId, title, abstract, journalId } = req.body;
  if (!paperId || !journalId) return res.status(400).json({ error: 'Paper ID and Journal ID required.' });

  const keywords = JSON.parse(req.body.keywords || '[]');
  const authorIdsInt = JSON.parse(req.body.authorIds || '[]').map(a => parseInt(a, 10));

  // Files optional for edit
  const pdfFile = req.files && req.files['pdfFile'] ? req.files['pdfFile'][0] : null;
  const responseSheetFile = req.files && req.files['responseSheet'] ? req.files['responseSheet'][0] : null;
  const additionalFiles = req.files && req.files['additionalFiles'] ? req.files['additionalFiles'] : [];

  try {
    const existingPaper = await prisma.journalPapers.findUnique({ where: { id: paperId } });
    if (!existingPaper || existingPaper.JournalId !== parseInt(journalId, 10)) {
      return res.status(403).json({ message: "Unauthorized or paper not found." });
    }

    const isRevision = !!existingPaper.OriginalPaperId;

    let updatedUrl = undefined;
    let updatedRevisionUrl = undefined;

    // --- PDF GENERATION (ONLY IF NEW PDF UPLOADED) ---
    if (pdfFile) {
      const journal = await prisma.journal.findUnique({ where: { id: parseInt(journalId, 10) }, select: { name: true } });
      const journalNameStr = journal ? journal.name : "SubmitEase Journal";

      const authorsData = await prisma.user.findMany({ where: { id: { in: authorIdsInt } }, select: { id: true, firstname: true, lastname: true, organisation: true } });
      const authorNamesString = authorIdsInt.map(aId => {
        const author = authorsData.find(a => a.id === aId);
        return author ? `${author.firstname} ${author.lastname} (${author.organisation || 'Independent'})` : `Author ${aId}`;
      }).join('\n');

      const createCoverPage = async (doc) => {
        const page = doc.addPage();
        const { width, height } = page.getSize();
        const font = await doc.embedFont(StandardFonts.Helvetica);
        const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

        let currentY = height - 60;
        const margin = 50;
        const maxWidth = width - (margin * 2);

        page.drawText(journalNameStr, { x: margin, y: currentY, size: 24, font: boldFont, color: rgb(0.02, 0.59, 0.41) });
        currentY -= 20;
        page.drawLine({ start: { x: margin, y: currentY }, end: { x: width - margin, y: currentY }, thickness: 2, color: rgb(0.8, 0.8, 0.8) });
        currentY -= 30;

        page.drawText('Official Manuscript Submission', { x: margin, y: currentY, size: 16, font: boldFont });
        currentY -= 30;

        currentY = drawWrappedText(page, `Title: ${title}`, margin, currentY, maxWidth, boldFont, 14);
        currentY -= 10;
        currentY = drawWrappedText(page, `Paper ID: ${paperId}`, margin, currentY, maxWidth, font, 12);

        currentY -= 10;
        page.drawText('Authors:', { x: margin, y: currentY, size: 12, font: boldFont });
        currentY -= 15;
        currentY = drawWrappedText(page, authorNamesString, margin, currentY, maxWidth, font, 11);

        currentY -= 10;
        currentY = drawWrappedText(page, `Keywords: ${keywords.join(', ')}`, margin, currentY, maxWidth, font, 12);

        currentY -= 20;
        page.drawText('Abstract:', { x: margin, y: currentY, size: 12, font: boldFont });
        currentY -= 15;
        drawWrappedText(page, abstract, margin, currentY, maxWidth, font, 10);

        page.drawLine({ start: { x: margin, y: 50 }, end: { x: width - margin, y: 50 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
        page.drawText(`Generated by SubmitEase on ${new Date().toLocaleDateString()}`, { x: margin, y: 35, size: 9, font: font, color: rgb(0.5, 0.5, 0.5) });
      };

      const standardPdf = await PDFDocument.create();
      await createCoverPage(standardPdf);
      const mainPdfDoc = await PDFDocument.load(pdfFile.buffer);
      const mainPages = await standardPdf.copyPages(mainPdfDoc, mainPdfDoc.getPageIndices());
      mainPages.forEach((page) => standardPdf.addPage(page));

      for (const addFile of additionalFiles) {
        try {
          const extraPdfDoc = await PDFDocument.load(addFile.buffer);
          const extraPages = await standardPdf.copyPages(extraPdfDoc, extraPdfDoc.getPageIndices());
          extraPages.forEach((page) => standardPdf.addPage(page));
        } catch (fileErr) { }
      }

      const standardPdfBytes = await standardPdf.save();
      const randomSuffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      const safeJournalName = journalNameStr.replace(/[^a-zA-Z0-9]/g, '_');
      const rootId = existingPaper.OriginalPaperId || paperId;
      const folder = `Journals/${safeJournalName}_${journalId}/${rootId}`;

      updatedUrl = await uploadPdfToSupabase(Buffer.from(standardPdfBytes), `${paperId}_${randomSuffix}.pdf`, folder);

      if (isRevision && responseSheetFile) {
        const revPdf = await PDFDocument.create();
        await createCoverPage(revPdf);

        try {
          const respDoc = await PDFDocument.load(responseSheetFile.buffer);
          const respPages = await revPdf.copyPages(respDoc, respDoc.getPageIndices());
          respPages.forEach((page) => revPdf.addPage(page));
        } catch (e) { }

        const mainRevPages = await revPdf.copyPages(mainPdfDoc, mainPdfDoc.getPageIndices());
        mainRevPages.forEach((page) => revPdf.addPage(page));

        for (const addFile of additionalFiles) {
          try {
            const extraPdfDoc = await PDFDocument.load(addFile.buffer);
            const extraPages = await revPdf.copyPages(extraPdfDoc, extraPdfDoc.getPageIndices());
            extraPages.forEach((page) => revPdf.addPage(page));
          } catch (e) { }
        }

        const revPdfBytes = await revPdf.save();
        updatedRevisionUrl = await uploadPdfToSupabase(Buffer.from(revPdfBytes), `${paperId}_REV_${randomSuffix}.pdf`, folder);
      }
    }

    const updateData = {
      Title: title, Abstract: abstract, Keywords: keywords, AuthorOrder: authorIdsInt,
      Authors: { set: authorIdsInt.map(id => ({ id })) }
    };

    if (updatedUrl) updateData.URL = updatedUrl;

    if (!isRevision) {
      updateData.RevisionPaperURL = null;
    } else if (updatedRevisionUrl) {
      updateData.RevisionPaperURL = updatedRevisionUrl;
    }

    const updatedPaper = await prisma.journalPapers.update({
      where: { id: paperId, JournalId: parseInt(journalId, 10) },
      data: updateData,
      include: { Authors: true }
    });

    res.status(200).json({ message: 'Paper updated successfully', paper: updatedPaper });
  } catch (error) {
    res.status(500).json({ message: 'Database error', details: error.message });
  }
});


app.post('/journal/submitpaper', upload.fields([
  { name: 'pdfFile', maxCount: 1 },
  { name: 'responseSheet', maxCount: 1 },
  { name: 'additionalFiles' }
]), async (req, res) => {
  const { paperId, title, abstract, journalId } = req.body;
  if (!paperId || !journalId) return res.status(400).json({ error: 'Paper ID and Journal ID required.' });

  const keywords = JSON.parse(req.body.keywords || '[]');
  const authorIdsInt = JSON.parse(req.body.authorIds || '[]').map(a => parseInt(a, 10));
  const pdfFile = req.files && req.files['pdfFile'] ? req.files['pdfFile'][0] : null;
  const responseSheetFile = req.files && req.files['responseSheet'] ? req.files['responseSheet'][0] : null;
  const additionalFiles = req.files && req.files['additionalFiles'] ? req.files['additionalFiles'] : [];

  try {
    const existingPaper = await prisma.journalPapers.findUnique({ where: { id: paperId } });
    if (!existingPaper || existingPaper.JournalId !== parseInt(journalId, 10)) {
      return res.status(403).json({ message: "Unauthorized or paper not found." });
    }

    const isRevision = !!existingPaper.OriginalPaperId;

    // --- STRICT SUBMISSION VALIDATION ---
    // 1. Must have a main PDF (either just uploaded or already saved in DB)
    if (!pdfFile && !existingPaper.URL) {
      return res.status(400).json({ error: "A main manuscript PDF is required for submission." });
    }

    // 2. If it is a revision, it MUST have a response sheet (either uploaded or already saved in DB)
    // Note: We check if RevisionPaperURL exists to see if they previously saved a draft with the response sheet
    if (isRevision && !responseSheetFile && !existingPaper.RevisionPaperURL) {
      return res.status(400).json({ error: "A Response to Reviewers document is required for revision submissions." });
    }

    // 3. (Optional but good practice) Check for marked up paper in additionalFiles if required by your journal rules
    const hasPreviousPaper = additionalFiles.length > 0 || (existingPaper.URL !== null);
    if (isRevision && !hasPreviousPaper) {
      // You can uncomment this if marked-up paper is STRICTLY mandatory
      // return res.status(400).json({ error: "A Marked-up manuscript is required for revision submissions." });
    }

    let updatedUrl = undefined;
    let updatedRevisionUrl = undefined;

    // Only regenerate PDF if new files were uploaded during this final submission click
    if (pdfFile) {
      const journal = await prisma.journal.findUnique({ where: { id: parseInt(journalId, 10) }, select: { name: true } });
      const journalNameStr = journal ? journal.name : "SubmitEase Journal";

      const authorsData = await prisma.user.findMany({ where: { id: { in: authorIdsInt } }, select: { id: true, firstname: true, lastname: true, organisation: true } });
      const authorNamesString = authorIdsInt.map(aId => {
        const author = authorsData.find(a => a.id === aId);
        return author ? `${author.firstname} ${author.lastname} (${author.organisation || 'Independent'})` : `Author ${aId}`;
      }).join('\n');

      const createCoverPage = async (doc) => {
        const page = doc.addPage();
        const { width, height } = page.getSize();
        const font = await doc.embedFont(StandardFonts.Helvetica);
        const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

        let currentY = height - 60;
        const margin = 50;
        const maxWidth = width - (margin * 2);

        page.drawText(journalNameStr, { x: margin, y: currentY, size: 24, font: boldFont, color: rgb(0.02, 0.59, 0.41) });
        currentY -= 20;
        page.drawLine({ start: { x: margin, y: currentY }, end: { x: width - margin, y: currentY }, thickness: 2, color: rgb(0.8, 0.8, 0.8) });
        currentY -= 30;

        page.drawText('Official Manuscript Submission', { x: margin, y: currentY, size: 16, font: boldFont });
        currentY -= 30;

        currentY = drawWrappedText(page, `Title: ${title}`, margin, currentY, maxWidth, boldFont, 14);
        currentY -= 10;
        currentY = drawWrappedText(page, `Paper ID: ${paperId}`, margin, currentY, maxWidth, font, 12);

        currentY -= 10;
        page.drawText('Authors:', { x: margin, y: currentY, size: 12, font: boldFont });
        currentY -= 15;
        currentY = drawWrappedText(page, authorNamesString, margin, currentY, maxWidth, font, 11);

        currentY -= 10;
        currentY = drawWrappedText(page, `Keywords: ${keywords.join(', ')}`, margin, currentY, maxWidth, font, 12);

        currentY -= 20;
        page.drawText('Abstract:', { x: margin, y: currentY, size: 12, font: boldFont });
        currentY -= 15;
        drawWrappedText(page, abstract, margin, currentY, maxWidth, font, 10);

        page.drawLine({ start: { x: margin, y: 50 }, end: { x: width - margin, y: 50 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
        page.drawText(`Generated by SubmitEase on ${new Date().toLocaleDateString()}`, { x: margin, y: 35, size: 9, font: font, color: rgb(0.5, 0.5, 0.5) });
      };

      const standardPdf = await PDFDocument.create();
      await createCoverPage(standardPdf);

      const mainPdfDoc = await PDFDocument.load(pdfFile.buffer);
      const mainPages = await standardPdf.copyPages(mainPdfDoc, mainPdfDoc.getPageIndices());
      mainPages.forEach((page) => standardPdf.addPage(page));

      for (const addFile of additionalFiles) {
        try {
          const extraPdfDoc = await PDFDocument.load(addFile.buffer);
          const extraPages = await standardPdf.copyPages(extraPdfDoc, extraPdfDoc.getPageIndices());
          extraPages.forEach((page) => standardPdf.addPage(page));
        } catch (e) { }
      }

      const standardPdfBytes = await standardPdf.save();
      const randomSuffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      const safeJournalName = journalNameStr.replace(/[^a-zA-Z0-9]/g, '_');
      const rootId = existingPaper.OriginalPaperId || paperId;
      const folder = `Journals/${safeJournalName}_${journalId}/${rootId}`;

      updatedUrl = await uploadPdfToSupabase(Buffer.from(standardPdfBytes), `${paperId}_${randomSuffix}.pdf`, folder);

      if (isRevision && responseSheetFile) {
        const revPdf = await PDFDocument.create();
        await createCoverPage(revPdf);

        try {
          const respDoc = await PDFDocument.load(responseSheetFile.buffer);
          const respPages = await revPdf.copyPages(respDoc, respDoc.getPageIndices());
          respPages.forEach((page) => revPdf.addPage(page));
        } catch (e) { }

        const mainRevPages = await revPdf.copyPages(mainPdfDoc, mainPdfDoc.getPageIndices());
        mainRevPages.forEach((page) => revPdf.addPage(page));

        for (const addFile of additionalFiles) {
          try {
            const extraPdfDoc = await PDFDocument.load(addFile.buffer);
            const extraPages = await revPdf.copyPages(extraPdfDoc, extraPdfDoc.getPageIndices());
            extraPages.forEach((page) => revPdf.addPage(page));
          } catch (e) { }
        }

        const revPdfBytes = await revPdf.save();
        updatedRevisionUrl = await uploadPdfToSupabase(Buffer.from(revPdfBytes), `${paperId}_REV_${randomSuffix}.pdf`, folder);
      }
    }

    const updateData = {
      Title: title, Abstract: abstract, Keywords: keywords, AuthorOrder: authorIdsInt,
      Authors: { set: authorIdsInt.map(id => ({ id })) },
      Status: "Under Review" // MIGRATING STATE TO ACTIVE REVIEW
    };

    if (updatedUrl) updateData.URL = updatedUrl;

    if (!isRevision) {
      updateData.RevisionPaperURL = null;
    } else if (updatedRevisionUrl) {
      updateData.RevisionPaperURL = updatedRevisionUrl;
    }

    const updatedPaper = await prisma.journalPapers.update({
      where: { id: paperId, JournalId: parseInt(journalId, 10) },
      data: updateData,
      include: { Authors: true }
    });

    res.status(200).json({ message: 'Paper submitted for review', paper: updatedPaper });
  } catch (error) {
    res.status(500).json({ message: 'Database error', details: error.message });
  }
});

// ============================================================================
// REVIEWER ENDPOINTS
// ============================================================================

app.post('/journal/get-your-reviews', async (req, res) => {
  const { reviewerId, journalId } = req.body;
  try {
    if (!reviewerId || !journalId) return res.status(400).json({ message: 'reviewerId and journalId required.' });

    const journalReviews = await prisma.journalReviews.findMany({
      where: {
        ReviewerId: parseInt(reviewerId, 10),
        Paper: { JournalId: parseInt(journalId, 10) }
      },
      select: {
        id: true, Comment: true, Recommendation: true, submittedAt: true, Status: true,
        scoreOriginality: true, scoreClarity: true, scoreSoundness: true, scoreSignificance: true, scoreRelevance: true, avgScore: true, assignedAt: true,
        Paper: {
          select: { id: true, Title: true, Abstract: true, URL: true, submittedAt: true, Authors: { select: { id: true, firstname: true, lastname: true } } }
        }
      },
      orderBy: { assignedAt: 'desc' }
    });

    const reviewsWithJournal = journalReviews.map(r => ({ ...r, Paper: { ...r.Paper, Journal: { id: parseInt(journalId, 10), name: 'Journal' } } }));
    res.status(200).json({ reviews: reviewsWithJournal });
  } catch (error) {
    console.error("Get Your Reviews Error:", error);
    res.status(500).json({ message: "Failed to fetch journal reviews." });
  }
});

app.post('/journal/get-review', async (req, res) => {
  const { paperId, reviewerId, journalId } = req.body;
  
  if (!journalId) return res.status(400).json({ message: "Journal ID required." });

  try {
    const review = await prisma.journalReviews.findFirst({
      where: {
        PaperId: paperId, 
        ReviewerId: parseInt(reviewerId, 10),
        Paper: { 
            JournalId: parseInt(journalId, 10)
        }
      },
      include: {
        Paper: {
          include: {
            Authors: true 
          }
        } 
      }
    });

    if (!review) return res.status(404).json({ message: 'No journal review found.' });
    
    res.status(200).json(review);
  } catch (error) {
    console.error("Get Review Error:", error);
    res.status(500).json({ message: "Failed to fetch journal review." });
  }
});

app.post('/journal/save-review', async (req, res) => {
  const { paperId, reviewerId, Recommendation, Comment, scoreOriginality, scoreClarity, scoreSoundness, scoreSignificance, scoreRelevance, journalId } = req.body;
  if (!journalId) return res.status(400).json({ message: "Journal ID required." });

  try {
    const paper = await prisma.journalPapers.findUnique({ where: { id: paperId } });
    if (!paper || paper.JournalId !== parseInt(journalId, 10)) return res.status(403).json({ message: "Unauthorized access." });

    // Safe average calculation for drafts (ignores nulls)
    let avgScore = null;
    const scores = [scoreOriginality, scoreClarity, scoreSoundness, scoreSignificance, scoreRelevance].filter(s => s != null);
    if (scores.length > 0) {
      avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    const updatedReview = await prisma.journalReviews.update({
      where: { PaperId_ReviewerId: { PaperId: paperId, ReviewerId: parseInt(reviewerId, 10) } },
      data: { Recommendation, Comment, scoreOriginality, scoreClarity, scoreSoundness, scoreSignificance, scoreRelevance, avgScore }
    });
    return res.status(200).json(updatedReview);
  } catch (err) {
    console.error("Save Review Error:", err);
    return res.status(500).json({ message: "Failed to save journal review." });
  }
});

app.post('/journal/submit-review', async (req, res) => {
  const { paperId, reviewerId, Recommendation, Comment, scoreOriginality, scoreClarity, scoreSoundness, scoreSignificance, scoreRelevance, journalId } = req.body;
  if (!journalId) return res.status(400).json({ message: "Journal ID required." });

  try {
    const paper = await prisma.journalPapers.findUnique({ where: { id: paperId } });
    if (!paper || paper.JournalId !== parseInt(journalId, 10)) return res.status(403).json({ message: "Unauthorized access." });

    // Strict average calculation (assumes all 5 are present on final submit)
    const avgScore = (scoreOriginality + scoreClarity + scoreSoundness + scoreSignificance + scoreRelevance) / 5.0;

    const updatedReview = await prisma.journalReviews.update({
      where: { PaperId_ReviewerId: { PaperId: paperId, ReviewerId: parseInt(reviewerId, 10) } },
      data: {
        Recommendation, Comment, submittedAt: new Date(), Status: "Submitted",
        scoreOriginality, scoreClarity, scoreSoundness, scoreSignificance, scoreRelevance, avgScore
      }
    });
    return res.status(200).json(updatedReview);
  } catch (err) {
    console.error("Submit Review Error:", err);
    return res.status(500).json({ message: "Failed to submit journal review." });
  }
});

app.post('/journal/reviewInvitationResponse', async (req, res) => {
  const { reviewId, response, journalId } = req.body;
  if (!journalId) return res.status(400).json({ message: "Journal ID required." });

  try {
    const review = await prisma.journalReviews.findUnique({ where: { id: reviewId }, include: { Paper: true } });
    if (!review || review.Paper.JournalId !== parseInt(journalId, 10)) return res.status(403).json({ message: "Unauthorized." });

    const updatedReview = await prisma.journalReviews.update({
      where: { id: reviewId },
      data: {
        Status: response,
        // Only update assignedAt if they are accepting the review
        ...(response === 'Under Review' ? { assignedAt: new Date() } : {})
      }
    });
    return res.status(200).json(updatedReview);
  } catch (err) {
    console.error("Review Invitation Response Error:", err);
    return res.status(500).json({ message: "Failed to update response." });
  }
});


// ============================================================================
// GLOBAL ADMIN ENDPOINTS
// ============================================================================

app.get('/admin/global-stats', async (req, res) => {
    try {
        const totalConferences = await prisma.conference.count();
        const activeConferences = await prisma.conference.count({ where: { status: 'Open' } });
        const pendingConferences = await prisma.conference.count({ where: { status: 'Pending Approval' } });
        const closedConferences = await prisma.conference.count({ where: { status: 'Closed' } });

        // NEW: Fetch Journal Stats
        const totalJournals = await prisma.journal.count();
        const pendingJournals = await prisma.journal.count({ where: { status: { in: ['Pending', 'Pending Approval'] } } });

        const totalUsers = await prisma.user.count();
        const totalAuthors = await prisma.user.count({ where: { role: { has: 'Author' } } });
        const totalReviewers = await prisma.user.count({ where: { role: { has: 'Reviewer' } } });

        const totalJournalPapers = await prisma.journalPapers.count({ where: { Status: { not: 'Pending Submission' }, OriginalPaperId: null } });
        const acceptedJournalPapers = await prisma.journalPapers.count({ where: { Status: 'Accepted', OriginalPaperId: null } });
        
        const totalConferencePapers = await prisma.paper.count({ where: { Status: { not: 'Pending Submission' } } });
        // NEW: Fetch Accepted Conference Papers
        const acceptedConferencePapers = await prisma.paper.count({ where: { Status: 'Accepted' } });

        const recentConferences = await prisma.conference.findMany({ take: 5, orderBy: { id: 'desc' }, select: { id: true, name: true, status: true, startsAt: true } });
        const recentJournals = await prisma.journal.findMany({ take: 5, orderBy: { id: 'desc' }, select: { id: true, name: true, status: true, Publication: true } });

        res.status(200).json({
            conferences: { total: totalConferences, active: activeConferences, pending: pendingConferences, closed: closedConferences },
            journals: { total: totalJournals, pending: pendingJournals }, // Added to payload
            users: { total: totalUsers, authors: totalAuthors, reviewers: totalReviewers },
            papers: { 
                journalTotal: totalJournalPapers, 
                journalAccepted: acceptedJournalPapers, 
                conferenceTotal: totalConferencePapers,
                conferenceAccepted: acceptedConferencePapers // Added to payload
            },
            recentActivity: { conferences: recentConferences, journals: recentJournals }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/admin/journals/pending', async (req, res) => {
  try {
    const pendingJournals = await prisma.journal.findMany({
      where: { status: { in: ['Pending', 'Pending Approval'] } },
      include: { host: { select: { firstname: true, lastname: true, email: true, organisation: true, expertise: true } } },
      orderBy: { id: 'desc' }
    });
    res.status(200).json({ newPending: pendingJournals });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pending journals" });
  }
});

app.get('/admin/journals/stats', async (req, res) => {
  try {
    const stats = await prisma.journal.findMany({
      include: { _count: { select: { Papers: true } } },
      orderBy: { id: 'desc' }
    });
    res.status(200).json({ stats });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch journal stats" });
  }
});

app.post('/get-journal-by-id', async (req, res) => {
    const { journalId } = req.body;
    try {
        const journal = await prisma.journal.findUnique({
            where: { id: parseInt(journalId) },
            include: {
                host: { select: { firstname: true, lastname: true, email: true, organisation: true } },
                // NEW: Explicitly include the EIC details via the relation
                EIC: { select: { firstname: true, lastname: true, email: true, organisation: true } },
                Assignments: { include: { User: { select: { id: true, firstname: true, lastname: true, email: true, organisation: true } } } }
            }
        });
        if (!journal) return res.status(404).json({ error: "Journal not found" });
        res.status(200).json({ journal });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch journal details" });
    }
});

app.post('/admin/journals/approve', async (req, res) => {
  const { journalId } = req.body;
  try {
    const approvedJournal = await prisma.journal.update({
      where: { id: parseInt(journalId) }, data: { status: 'Open' }, include: { host: true }
    });

    await prisma.journalAssignment.upsert({
      where: { JournalId_UserId: { JournalId: approvedJournal.id, UserId: approvedJournal.hostID } },
      update: { role: { push: "Journal Host" } },
      create: { JournalId: approvedJournal.id, UserId: approvedJournal.hostID, role: ["Journal Host", "Author"] }
    });

    if (approvedJournal.host && approvedJournal.host.email) {
      const bodyHtml = `
                <p>Hello <strong>${approvedJournal.host.firstname}</strong>,</p>
                <p>Great news! The platform administrators have reviewed and approved your journal:</p>
                <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h2 style="color: #065f46; margin: 0 0 10px 0;">${approvedJournal.name}</h2>
                    <span style="background-color: #d1fae5; color: #065f46; padding: 6px 16px; border-radius: 9999px; font-size: 14px; font-weight: bold;">Status: Open & Active</span>
                </div>
                <p>Your journal is now live. You have been granted <strong>Journal Host</strong> privileges to configure your editorial board.</p>
            `;
      const emailHtml = getBeautifulEmailTemplate("Journal Approved!", bodyHtml);
      try {
        await sendMail(approvedJournal.host.email, 'Your Journal Has Been Approved!', emailHtml);
      } catch (mailErr) {
        console.error("Failed to send journal approval email:", mailErr);
      }
    }
    res.status(200).json({ message: "Journal approved successfully", journal: approvedJournal });
  } catch (error) {
    res.status(500).json({ error: "Failed to approve journal" });
  }
});

app.post('/admin/journals/reject', async (req, res) => {
  const { journalId } = req.body;
  try {
    const rejectedJournal = await prisma.journal.update({
      where: { id: parseInt(journalId) }, data: { status: 'Rejected' }, include: { host: true }
    });

    if (rejectedJournal.host && rejectedJournal.host.email) {
      const bodyHtml = `
                <p>Hello <strong>${rejectedJournal.host.firstname}</strong>,</p>
                <p>Thank you for your interest in hosting a journal. Our administration team has reviewed your application for:</p>
                <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h2 style="color: #991b1b; margin: 0 0 10px 0;">${rejectedJournal.name}</h2>
                    <span style="background-color: #fee2e2; color: #991b1b; padding: 6px 16px; border-radius: 9999px; font-size: 14px; font-weight: bold;">Status: Application Declined</span>
                </div>
                <p>Unfortunately, we are unable to approve this request at this time.</p>
            `;
      const emailHtml = getBeautifulEmailTemplate("Journal Registration Update", bodyHtml, true);
      try {
        await sendMail(rejectedJournal.host.email, 'Update on Your Journal Registration', emailHtml);
      } catch (mailErr) {
        console.error("Failed to send journal rejection email:", mailErr);
      }
    }
    res.status(200).json({ message: "Journal rejected successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to reject journal" });
  }
});

app.get('/admin/conferences/pending', async (req, res) => {
  try {
    const newPending = await prisma.conference.findMany({ where: { status: 'Pending Approval' }, include: { host: { select: { firstname: true, lastname: true, email: true } } } });
    const updatePending = await prisma.conference.findMany({ where: { status: 'Pending Update' }, include: { host: { select: { firstname: true, lastname: true, email: true } } } });
    res.status(200).json({ newPending, updatePending });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/admin/conferences/approve', async (req, res) => {
  const { conferenceId } = req.body;
  try {
    const updatedConference = await prisma.conference.update({
      where: { id: parseInt(conferenceId, 10) }, data: { status: 'Open' }, include: { host: { select: { firstname: true, lastname: true, email: true } } }
    });

    if (updatedConference.host && updatedConference.host.email) {
      const bodyHtml = `
            <p>Dear <strong>${updatedConference.host.firstname} ${updatedConference.host.lastname}</strong>,</p>
            <p>We are pleased to inform you that your requested conference, <strong>${updatedConference.name}</strong>, has been officially reviewed and approved.</p>
            <p>Your conference status is now marked as <strong>Open</strong>. You may now access the Conference Portal.</p>
        `;
      const emailHtml = getBeautifulEmailTemplate("Conference Approved", bodyHtml);
      try {
        await sendMail(updatedConference.host.email, `Your Conference "${updatedConference.name}" has been Approved!`, emailHtml);
      } catch (mailErr) {
        console.error("Failed to send conference approval email:", mailErr);
      }
    }
    res.status(200).json({ message: "Conference approved", conference: updatedConference });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/admin/conferences/stats', async (req, res) => {
  try {
    const stats = await prisma.conference.findMany({
      select: { id: true, name: true, status: true, _count: { select: { Paper: true, Tracks: true, Reviewers: true } } }
    });
    res.status(200).json({ stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/admin/conferences/reject', async (req, res) => {
  const { conferenceId } = req.body;
  try {
    const rejectedConference = await prisma.conference.update({
      where: { id: parseInt(conferenceId) }, data: { status: 'Rejected' }, include: { host: true }
    });

    if (rejectedConference.host && rejectedConference.host.email) {
      const bodyHtml = `
                <p>Hello <strong>${rejectedConference.host.firstname}</strong>,</p>
                <p>Unfortunately, your application for the conference <strong>${rejectedConference.name}</strong> has been declined at this time.</p>
            `;
      const emailHtml = getBeautifulEmailTemplate("Conference Registration Update", bodyHtml, true);
      try {
        await sendMail(rejectedConference.host.email, 'Update on Your Conference Registration', emailHtml);
      } catch (mailErr) {
        console.error("Failed to send conference rejection email:", mailErr);
      }
    }
    res.status(200).json({ message: "Conference rejected successfully", conference: rejectedConference });
  } catch (error) {
    res.status(500).json({ error: "Failed to reject conference" });
  }
});

// ============================================================================
// JOURNAL HOST ENDPOINTS
// ============================================================================

app.get('/journal/getjournalbyid/:id', async (req, res) => {
  try {
    const journal = await prisma.journal.findUnique({
      where: { id: parseInt(req.params.id, 10) }
    });
    if (!journal) return res.status(404).json({ message: "Journal not found." });
    res.status(200).json({ journal });
  } catch (error) {
    console.error("Fetch Journal Meta Error:", error);
    res.status(500).json({ message: "Failed to fetch journal metadata." });
  }
});

app.get('/journal/host/stats', async (req, res) => {
  const { journalId } = req.query;
  if (!journalId) return res.status(400).json({ message: "Journal ID required" });

  try {
    const jId = parseInt(journalId, 10);
    const totalPapers = await prisma.journalPapers.count({ where: { JournalId: jId, Status: { not: 'Pending Submission' }, OriginalPaperId: null } });
    const acceptedPapers = await prisma.journalPapers.count({ where: { JournalId: jId, Status: 'Accepted', OriginalPaperId: null } });
    const underReview = await prisma.journalPapers.count({ where: { JournalId: jId, Status: 'Under Review', OriginalPaperId: null } });
    const rejectedPapers = await prisma.journalPapers.count({ where: { JournalId: jId, Status: 'Rejected', OriginalPaperId: null } });
    const revisions = await prisma.journalPapers.count({ where: { JournalId: jId, Status: { contains: 'Revision' }, OriginalPaperId: null } });

    const totalReviews = await prisma.journalReviews.count({ where: { Paper: { JournalId: jId } } });

    res.status(200).json({
      papers: { total: totalPapers, accepted: acceptedPapers, underReview, revisions, rejected: rejectedPapers },
      reviews: { total: totalReviews }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// JOURNAL HOST ENDPOINTS
// ============================================================================

app.get('/journal/host/stats', async (req, res) => {
  const { journalId } = req.query;
  if (!journalId) return res.status(400).json({ message: "Journal ID required" });

  try {
    const jId = parseInt(journalId, 10);
    const totalPapers = await prisma.journalPapers.count({ where: { JournalId: jId, Status: { not: 'Pending Submission' }, OriginalPaperId: null } });
    const acceptedPapers = await prisma.journalPapers.count({ where: { JournalId: jId, Status: 'Accepted', OriginalPaperId: null } });
    const underReview = await prisma.journalPapers.count({ where: { JournalId: jId, Status: 'Under Review', OriginalPaperId: null } });
    const rejectedPapers = await prisma.journalPapers.count({ where: { JournalId: jId, Status: 'Rejected', OriginalPaperId: null } });
    const revisions = await prisma.journalPapers.count({ where: { JournalId: jId, Status: { contains: 'Revision' }, OriginalPaperId: null } });

    const totalReviews = await prisma.journalReviews.count({ where: { Paper: { JournalId: jId } } });

    res.status(200).json({
      papers: { total: totalPapers, accepted: acceptedPapers, underReview, revisions, rejected: rejectedPapers },
      reviews: { total: totalReviews }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/journal/host/eic', async (req, res) => {
  const { journalId } = req.query;
  if (!journalId) return res.status(400).json({ message: "Journal ID required" });

  try {
    const assignment = await prisma.journalAssignment.findFirst({
      where: { JournalId: parseInt(journalId, 10), role: { has: 'Editor-in-Chief' } },
      include: { User: { select: { id: true, firstname: true, lastname: true, email: true, organisation: true } } }
    });
    res.status(200).json({ eic: assignment ? assignment.User : null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/journal/host/accepted-papers', async (req, res) => {
  const { journalId } = req.query;
  if (!journalId) return res.status(400).json({ message: "Journal ID required." });

  try {
    const papers = await prisma.journalPapers.findMany({
      where: { JournalId: parseInt(journalId, 10), Status: 'Accepted' },
      select: { id: true, Title: true, submittedAt: true, URL: true, Authors: { select: { firstname: true, lastname: true } } }
    });
    res.status(200).json({ papers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/journal/host/change-eic', async (req, res) => {
  const { newEicId, newUser, journalId } = req.body;
  if (!journalId) return res.status(400).json({ message: "Journal ID required." });

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
    return password;
  };

  try {
    const parsedJournalId = parseInt(journalId, 10);
    const currentAssignment = await prisma.journalAssignment.findFirst({
      where: { JournalId: parsedJournalId, role: { has: 'Editor-in-Chief' } },
      include: { User: true }
    });
    const currentEic = currentAssignment ? currentAssignment.User : null;
    const journal = await prisma.journal.findUnique({ where: { id: parseInt(journalId, 10) } });
    const journalName = journal ? journal.name : "our journal";
    // 1. Revoke from Current EiC
    if (currentEic) {
      if (newEicId && currentEic.id === parseInt(newEicId, 10)) return res.status(400).json({ message: "This user is already EiC." });
      if (newUser && currentEic.email === newUser.email) return res.status(400).json({ message: "Email belongs to current EiC." });

      await prisma.journalAssignment.update({
        where: { JournalId_UserId: { JournalId: parsedJournalId, UserId: currentEic.id } },
        data: { role: currentAssignment.role.filter(role => role !== 'Editor-in-Chief') }
      });

      try {
        const oldEicBody = `
                    <p>Dear <strong>${currentEic.firstname} ${currentEic.lastname}</strong>,</p>
                    <p>This is an automated notification to inform you that your role as <strong>Editor-in-Chief</strong> for Journal ${journalName} has been formally reassigned to another user by the Journal Host.</p>
                    <p>We thank you for your service and contributions to the editorial board.</p>
                `;
        const oldEicHtml = getBeautifulEmailTemplate(`Update regarding your Editor-in-Chief Role`, oldEicBody, true);
        await sendMail(currentEic.email, "Update regarding your Editor-in-Chief Role", oldEicHtml);
      } catch (mailErr) {
        console.error("Failed to send revocation email to old EiC", mailErr);
      }
    }

    let finalNewEic;
    let isBrandNewAccount = false;
    const generatedPassword = generateRandomPassword();

    // 2. Assign New EiC
    if (newEicId) {
      finalNewEic = await prisma.user.findUnique({ where: { id: parseInt(newEicId, 10) } });
      if (!finalNewEic) return res.status(404).json({ message: "User not found." });

      const existingAssignment = await prisma.journalAssignment.findUnique({
        where: { JournalId_UserId: { JournalId: parsedJournalId, UserId: finalNewEic.id } }
      });

      if (existingAssignment) {
        // FIXED: Using JournalId_UserId instead of id
        await prisma.journalAssignment.update({
          where: { JournalId_UserId: { JournalId: parsedJournalId, UserId: finalNewEic.id } },
          data: { role: Array.from(new Set([...existingAssignment.role, 'Editor-in-Chief'])) }
        });
      } else {
        await prisma.journalAssignment.create({
          data: { JournalId: parsedJournalId, UserId: finalNewEic.id, role: ['Editor-in-Chief', 'Author'] }
        });
      }

    } else if (newUser) {
      const existingUser = await prisma.user.findUnique({ where: { email: newUser.email } });

      if (existingUser) {
        finalNewEic = existingUser;
        const existingAssignment = await prisma.journalAssignment.findUnique({
          where: { JournalId_UserId: { JournalId: parsedJournalId, UserId: existingUser.id } }
        });

        if (existingAssignment) {
          // FIXED: Using JournalId_UserId instead of id
          await prisma.journalAssignment.update({
            where: { JournalId_UserId: { JournalId: parsedJournalId, UserId: existingUser.id } },
            data: { role: Array.from(new Set([...existingAssignment.role, 'Editor-in-Chief'])) }
          });
        } else {
          await prisma.journalAssignment.create({
            data: { JournalId: parsedJournalId, UserId: existingUser.id, role: ['Editor-in-Chief', 'Author'] }
          });
        }
      } else {
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);
        finalNewEic = await prisma.user.create({
          data: {
            firstname: newUser.firstname, lastname: newUser.lastname, email: newUser.email, password: hashedPassword,
            organisation: newUser.organisation || "Independent", country: "Not Specified",
            role: ["Author"]
          }
        });
        await prisma.journalAssignment.create({
          data: { JournalId: parsedJournalId, UserId: finalNewEic.id, role: ['Editor-in-Chief', 'Author'] }
        });
        isBrandNewAccount = true;
      }
    }
    try {
      const credentialsBlock = isBrandNewAccount ? `
                <div style="background-color: #f0fdf4; padding: 15px; border-left: 4px solid #059669; margin: 20px 0; border-radius: 4px;">
                    <h4 style="margin-top: 0; color: #065f46;">Your Login Credentials</h4>
                    <p style="margin-bottom: 5px;">An account has been automatically created for you.</p>
                    <strong>Email:</strong> ${finalNewEic.email}<br/>
                    <strong>Temporary Password:</strong> <span style="font-family: monospace; background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${generatedPassword}</span><br/>
                </div>
            ` : '';

      const newEicBody = `
                <p>Dear <strong>${finalNewEic.firstname} ${finalNewEic.lastname}</strong>,</p>
                <p>You have been officially appointed as the <strong>Editor-in-Chief</strong> of <strong>Journal ${journalName}</strong>.</p>
                <p>You now have full access to the EIC portal to oversee submissions, manage associate editors, and render final publication verdicts.</p>
                ${credentialsBlock}
            `;
      const newEicHtml = getBeautifulEmailTemplate(`Welcome to the Editorial Board`, newEicBody);
      await sendMail(finalNewEic.email, "You have been appointed as Editor-in-Chief", newEicHtml);
    } catch (mailErr) {
      console.error("Failed to send welcome email to new EiC", mailErr);
    }

    res.status(200).json({ message: "Editor-in-Chief updated successfully." });
  } catch (error) {
    console.error("Change EIC Error:", error);
    res.status(500).json({ message: "Failed to update EiC.", details: error.message });
  }
});


// ============================================================================
// NEW USER REGISTRATION ENDPOINT (With Email)
// ============================================================================

app.post('/journal/new-users', async (req, res) => {
  const { email, password, firstname, lastname, role, journalId, organisation, country } = req.body;

  try {
    const newUser = await prisma.user.create({
      data: {
        email,
        password, // Ensure this is hashed in production!
        firstname,
        lastname,
        organisation: organisation || "",
        country: country || "",
        role: ["Author"] // GLOBAL role is permanently Author by default
      }
    });

    let assignedRolesHtml = "Author";
    let journalName = "SubmitEase";

    if (journalId) {
      const requestedRoles = role || [];
      const finalJournalRoles = Array.from(new Set(["Author", ...requestedRoles]));
      assignedRolesHtml = finalJournalRoles.join(", ");

      // Assign the user to the journal
      await prisma.journalAssignment.create({
        data: {
          JournalId: parseInt(journalId, 10),
          UserId: newUser.id,
          role: finalJournalRoles
        }
      });

      // Safely fetch the journal name
      const journal = await prisma.journal.findUnique({
        where: { id: parseInt(journalId, 10) }
      });
      if (journal) {
        journalName = journal.name;
      }
    }

    // --- EMAIL NOTIFICATION: New User Created ---
    const bodyHtml = `
            <p>Dear <strong>${firstname} ${lastname}</strong>,</p>
            <p>An account has been created for you on the <strong>SubmitEase Platform</strong>${journalId ? ` and you have been invited to join the Journal <strong>${journalName}</strong>` : ''}.</p>
            <div style="background-color: #f3f4f6; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Your Login Email:</strong> ${email}</p>
                <p style="margin: 5px 0 0 0;"><strong>Temporary Password:</strong> <span style="font-family: monospace; background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${password}</span></p>
                <p style="margin: 5px 0 0 0;"><strong>Assigned Roles:</strong> ${assignedRolesHtml}</p>
            </div>
            <p>Please log in to the portal and change your password immediately for security purposes.</p>
        `;

    const emailHtml = getBeautifulEmailTemplate(`Welcome to SubmitEase`, bodyHtml);
    try {
      await sendMail(email, `Welcome to SubmitEase - Account Created`, emailHtml);
    } catch (mailErr) {
      console.error("Failed to send welcome email:", mailErr);
    }

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Create User Error:", error);
    res.status(500).json({ error: "Failed to create user." });
  }
});


// ============================================================================
// EIC PORTAL ENDPOINTS
// ============================================================================

app.get('/journal/eic/dashboard-data', async (req, res) => {
  const { journalId } = req.query;
  if (!journalId) return res.status(400).json({ message: "Journal ID required" });

  try {
    const papers = await prisma.journalPapers.findMany({
      where: { JournalId: parseInt(journalId, 10), Status: { not: 'Pending Submission' } },
      include: {
        Authors: { select: { id: true, firstname: true, lastname: true } },
        Editors: { include: { Editor: { select: { id: true, firstname: true, lastname: true } } } }
      },
      orderBy: { submittedAt: 'desc' }
    });

    const formattedPapers = papers.map(p => {
      const daysSinceSubmission = (new Date() - new Date(p.submittedAt)) / (1000 * 60 * 60 * 24);
      return {
        ...p,
        Author: p.Authors?.length > 0 ? p.Authors[0] : { firstname: "Unknown", lastname: "Author" },
        isOverdue: p.Status === 'Under Review' && daysSinceSubmission > 30,
        isRevision: !!p.OriginalPaperId
      };
    });

    res.status(200).json({ papers: formattedPapers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/journal/eic/assign-editor', async (req, res) => {
  const { paperId, editorId, upgradeRole, journalId } = req.body;
  if (!journalId) return res.status(400).json({ message: "Journal ID required." });

  try {
    const assignment = await prisma.journalEditors.create({
      data: { PaperId: paperId, EditorId: parseInt(editorId, 10), Status: 'Assigned' }
    });

    const user = await prisma.user.findUnique({ where: { id: parseInt(editorId, 10) } });
    const paper = await prisma.journalPapers.findUnique({ where: { id: paperId } });

    let roleUpgraded = false;
    if (upgradeRole) {
      const existingAssignment = await prisma.journalAssignment.findUnique({
        where: { JournalId_UserId: { JournalId: parseInt(journalId, 10), UserId: user.id } }
      });

      if (existingAssignment) {
        await prisma.journalAssignment.update({
          where: { JournalId_UserId: { JournalId: parseInt(journalId, 10), UserId: user.id } },
          data: { role: Array.from(new Set([...existingAssignment.role, "Author", "Journal Editor"])) }
        });
      } else {
        await prisma.journalAssignment.create({
          data: { JournalId: parseInt(journalId, 10), UserId: user.id, role: ["Author", "Journal Editor"] }
        });
      }
      roleUpgraded = true;
    }
    const journal = await prisma.journal.findUnique({ where: { id: parseInt(journalId, 10) } });
    const journalName = journal ? journal.name : "SubmitEase Journal";
    const body = `
            <p>Dear <strong>${user.firstname} ${user.lastname}</strong>,</p>
            <p>You have been assigned as the Editor in the Journal ${journalName} for the manuscript titled:</p>
            <div style="background-color: #f3f4f6; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-style: italic;">"${paper.Title}"</p>
            </div>
            ${roleUpgraded ? `<p style="color: #059669; font-weight: bold;">Note: You have also been granted the 'Journal Editor' role for this journal.</p>` : ''}
            <p>Please log in to the SubmitEase Editor Portal to assign reviewers and manage the peer-review process.</p>
        `;
    const emailHtml = getBeautifulEmailTemplate(`New Assignment: Paper #${paperId}`, body);
    sendMail(user.email, `New Assignment: Editor for Paper #${paperId}`, emailHtml);

    res.status(200).json({ message: "Editor assigned successfully", assignment });
  } catch (error) {
    console.error("Assign Editor Error:", error);
    res.status(500).json({ message: "Failed to assign editor" });
  }
});


app.post('/journal/eic/change-editor', async (req, res) => {
  const { paperId, oldEditorId, newEditorId, journalId, upgradeRole } = req.body;
  if (!journalId) return res.status(400).json({ message: "Journal ID required" });

  try {
    const paper = await prisma.journalPapers.findUnique({ where: { id: paperId } });
    if (!paper) return res.status(404).json({ message: "Paper not found." });

    await prisma.journalEditors.deleteMany({ where: { PaperId: paperId, EditorId: parseInt(oldEditorId, 10) } });

    const newAssignment = await prisma.journalEditors.create({
      data: { PaperId: paperId, EditorId: parseInt(newEditorId, 10), Status: 'Assigned' }
    });

    const newEditor = await prisma.user.findUnique({ where: { id: parseInt(newEditorId, 10) } });

    if (upgradeRole) {
      const existingAssignment = await prisma.journalAssignment.findUnique({
        where: { JournalId_UserId: { JournalId: parseInt(journalId, 10), UserId: newEditor.id } }
      });
      if (existingAssignment) {
        await prisma.journalAssignment.update({
          where: { JournalId_UserId: { JournalId: parseInt(journalId, 10), UserId: newEditor.id } },
          data: { role: Array.from(new Set([...existingAssignment.role, "Author", "Journal Editor"])) }
        });
      } else {
        await prisma.journalAssignment.create({
          data: { JournalId: parseInt(journalId, 10), UserId: newEditor.id, role: ["Author", "Journal Editor"] }
        });
      }
    }
    const journal = await prisma.journal.findUnique({ where: { id: parseInt(journalId, 10) } });
    const journalName = journal ? journal.name : "SubmitEase Journal";
    const bodyHtml = `
            <p>Dear <strong>${newEditor.firstname} ${newEditor.lastname}</strong>,</p>
            <p>You have been newly assigned to take over as the Editor in Journal ${journalName} for the manuscript:</p>
            <div style="background-color: #f3f4f6; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-style: italic;">"${paper.Title}"</p>
            </div>
            <p>Please log in to the SubmitEase Editor Portal to manage this paper.</p>
        `;
    const emailHtml = getBeautifulEmailTemplate(`New Assignment: Editor`, bodyHtml);
    sendMail(newEditor.email, `New Assignment: Editor for Paper #${paperId}`, emailHtml);

    res.status(200).json({ message: "Editor changed successfully" });
  } catch (error) {
    console.error("Change Editor Error:", error);
    res.status(500).json({ message: "Failed to change editor" });
  }
});

app.post('/journal/eic/desk-reject', async (req, res) => {
  const { paperId, message, journalId } = req.body;
  if (!journalId) return res.status(400).json({ message: "Journal ID required." });

  try {
    const updatedPaper = await prisma.journalPapers.update({
      where: { id: paperId, JournalId: parseInt(journalId, 10) },
      data: { Status: 'Rejected' },
      include: { Authors: true }
    });
    const journal = await prisma.journal.findUnique({ where: { id: parseInt(journalId, 10) } });
    const journalName = journal ? journal.name : "SubmitEase Journal";
    if (updatedPaper.Authors && updatedPaper.Authors.length > 0) {
      const primaryAuthor = updatedPaper.Authors[0];
      const body = `
                <p>Dear <strong>${primaryAuthor.firstname} ${primaryAuthor.lastname}</strong>,</p>
                <p>Thank you for submitting your manuscript <strong>"${updatedPaper.Title}"</strong> to Journal ${journalName}.</p>
                <p>After an initial editorial review, we regret to inform you that your paper has been Desk Rejected and will not be sent for peer review.</p>
                <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #991b1b; margin-top: 0; font-size: 16px;">Message from the Editor-in-Chief:</h3>
                    <p style="color: #7f1d1d; font-style: italic; margin-bottom: 0;">"${message}"</p>
                </div>
                <p>We wish you the best in your future publications.</p>
            `;
      const emailHtml = getBeautifulEmailTemplate(`Submission Update: Paper #${paperId}`, body, true);
      sendMail(primaryAuthor.email, `Update on your submission: Paper #${paperId}`, emailHtml);
    }
    res.status(200).json({ message: "Paper desk rejected and author notified." });
  } catch (error) {
    res.status(500).json({ message: "Failed to desk reject" });
  }
});

app.post('/journal/eic/remind-editor', async (req, res) => {
  const { paperId, editorId, journalId } = req.body;
  if (!journalId) return res.status(400).json({ message: "Journal ID required" });

  try {
    const paper = await prisma.journalPapers.findUnique({ where: { id: paperId } });
    const user = await prisma.user.findUnique({ where: { id: parseInt(editorId, 10) } });
    if (!paper || paper.JournalId !== parseInt(journalId, 10)) return res.status(403).json({ message: "Unauthorized" });
    const journal = await prisma.journal.findUnique({ where: { id: parseInt(journalId, 10) } });
    const journalName = journal ? journal.name : "SubmitEase Journal";
    const bodyHtml = `
            <p>Dear <strong>${user.firstname} ${user.lastname}</strong>,</p>
            <p>This is a friendly reminder regarding the manuscript titled: <strong>"${paper.Title}"</strong> submitted to Journal ${journalName}.</p>
            <p>Please log in to the SubmitEase Editor Portal to review the current status and take any necessary actions.</p>
        `;
    const emailHtml = getBeautifulEmailTemplate(`Reminder: Pending Action Required`, bodyHtml);
    sendMail(user.email, `Reminder: Pending Action Required for Paper #${paperId}`, emailHtml);

    res.status(200).json({ message: "Reminder sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send reminder" });
  }
});

// --- UPDATED FINAL DECISION ENDPOINT ---
app.post('/journal/eic/final-decision', async (req, res) => {
  const { paperId, status, commentsForAuthor, journalId } = req.body;
  if (!journalId) return res.status(400).json({ message: "Journal ID required." });

  try {
    const updatedPaper = await prisma.journalPapers.update({
      where: { id: paperId, JournalId: parseInt(journalId, 10) },
      data: { Status: status }, include: { Authors: true }
    });

    let compiledFeedback = "No additional feedback was provided.";

    if (commentsForAuthor && commentsForAuthor.length > 0) {
      // Flip the flag to true in the database so the Author can see it
      await prisma.journalReviews.updateMany({
        where: { id: { in: commentsForAuthor } },
        data: { isVisibleToAuthor: true }
      });

      const selectedReviews = await prisma.journalReviews.findMany({
        where: { id: { in: commentsForAuthor } }
      });
      compiledFeedback = selectedReviews.map((r, i) => `<strong>Reviewer ${i + 1}:</strong><br/>"${r.Comment}"`).join('<br/><br/>');
    }
    const journal = await prisma.journal.findUnique({ where: { id: parseInt(journalId, 10) } });
    const journalName = journal ? journal.name : "SubmitEase Journal";
    if (updatedPaper.Authors && updatedPaper.Authors.length > 0) {
      const primaryAuthor = updatedPaper.Authors[0];
      const isRejection = status.toLowerCase().includes('reject');
      const body = `
                <p>Dear <strong>${primaryAuthor.firstname} ${primaryAuthor.lastname}</strong>,</p>
                <p>The peer-review process for your manuscript <strong>"${updatedPaper.Title}"</strong> in Journal ${journalName} is complete.</p>
                <div style="background-color: ${isRejection ? '#fef2f2' : '#ecfdf5'}; border: 1px solid ${isRejection ? '#fecaca' : '#a7f3d0'}; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h2 style="color: ${isRejection ? '#991b1b' : '#065f46'}; margin: 0 0 10px 0;">Decision: ${status}</h2>
                    <h3 style="color: #374151; font-size: 14px;">Editorial Feedback:</h3>
                    <p style="color: #4b5563; font-size: 14px;">${compiledFeedback}</p>
                </div>
                <p>Please log in to the SubmitEase Author Portal for next steps.</p>
            `;
      const emailHtml = getBeautifulEmailTemplate(`Decision Reached: ${status}`, body, isRejection);
      sendMail(primaryAuthor.email, `Decision Reached: ${status} - Paper #${paperId}`, emailHtml);
    }
    res.status(200).json({ message: "Final decision logged and Author notified." });
  } catch (error) {
    res.status(500).json({ message: "Failed to log final decision" });
  }
});

// ============================================================================
// EDITOR PORTAL ENDPOINTS
// ============================================================================

app.post('/journal/editor/papers', async (req, res) => {
  const { editorId, journalId } = req.body;

  if (!editorId) return res.status(400).json({ error: "editorId is required" });

  try {
    // Find all papers where this user is EITHER the primary editor OR the transferred editor
    const papers = await prisma.journalPapers.findMany({
      where: {
        JournalId: journalId ? parseInt(journalId, 10) : undefined,
        Editors: {
          some: {
            OR: [
              { EditorId: parseInt(editorId, 10) },
              { TransferredEditorId: parseInt(editorId, 10) }
            ]
          }
        }
      },
      include: {
        Authors: { select: { id: true, firstname: true, lastname: true, email: true } },
        Journal: { select: { id: true, name: true } },
        Reviews: { select: { id: true, Status: true } },
        Editors: {
          // CRITICAL FIX: Only include the editor record that applies to THIS specific user!
          where: {
            OR: [
              { EditorId: parseInt(editorId, 10) },
              { TransferredEditorId: parseInt(editorId, 10) }
            ]
          },
          include: {
            Editor: { select: { id: true, firstname: true, lastname: true, email: true } },
            TransferredEditor: { select: { id: true, firstname: true, lastname: true, email: true } }
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    // Map over the papers to inject calculated fields specifically tailored for THIS editor
    const mappedPapers = papers.map(paper => {
      const editorRecord = paper.Editors[0];

      const isIncomingTransfer = editorRecord?.TransferredEditorId === parseInt(editorId, 10) && editorRecord?.TransferStatus === "Pending";
      const isOutgoingTransfer = editorRecord?.EditorId === parseInt(editorId, 10) && editorRecord?.TransferredEditorId !== null && editorRecord?.TransferStatus === "Pending";

      let effectiveStatus = paper.Status;
      if (isIncomingTransfer) {
        effectiveStatus = "Pending Transfer Acceptance";
      }

      return {
        ...paper,
        Status: effectiveStatus,
        reviewersInvited: paper.Reviews ? paper.Reviews.length : 0,
        reviewersSubmitted: paper.Reviews ? paper.Reviews.filter(r => r.Status === 'Submitted').length : 0,
        reviewersAccepted: paper.Reviews ? paper.Reviews.filter(r => r.Status === 'Accepted' || r.Status === 'Completed' || r.Status === 'Submitted' || r.Status === 'Under Review').length : 0,
        editorRecommendation: editorRecord?.Recommendation || null,
        isbeingtransferred: isIncomingTransfer || isOutgoingTransfer,
        transferType: isIncomingTransfer ? 'incoming' : (isOutgoingTransfer ? 'outgoing' : null)
      };
    });

    res.status(200).json({ papers: mappedPapers });
  } catch (error) {
    console.error("Error fetching editor papers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const sanitizeReviews = (reviews) => {
  if (!reviews) return [];
  
  return reviews.map(review => {
    if (review.status === 'submitted') {
      return review; // Safe to show
    }
    // Mask sensitive data if 'pending' or 'draft'
    return {
      ...review,
      Recommendation: null,
      comment: null,
      scoreOriginality: null,
      scoreSignificance: null,
      scoreClarity: null,
      scoreSoundness: null,
      scoreRelevance: null,
      avgScore: null
    };
  });
};

app.get('/journal/editor/paper/:id', async (req, res) => {
  const { id } = req.params;
  const { journalId } = req.query;

  try {
    const paper = await prisma.journalPapers.findFirst({
      where: {
        id: id,
        ...(journalId && { JournalId: parseInt(journalId, 10) })
      },
      include: {
        Authors: true,
        Editors: {
          include: {
            Editor: { select: { id: true, firstname: true, lastname: true, email: true, expertise: true } },
            TransferredEditor: { select: { id: true, firstname: true, lastname: true, email: true } }
          }
        },
        Reviews: {
          include: {
            User: { select: { id: true, firstname: true, lastname: true, email: true } }
          }
        },
        OriginalPaper: true,
        Revisions: {
          orderBy: { submittedAt: 'desc' },
          include: {
            Authors: true,
            Reviews: {
              include: {
                User: { select: { id: true, firstname: true, lastname: true, email: true } }
              }
            },
            Editors: {
              include: {
                Editor: { select: { id: true, firstname: true, lastname: true, email: true, expertise: true } },
                TransferredEditor: { select: { id: true, firstname: true, lastname: true, email: true } }
              }
            }
          }
        }
      }
    });

    if (!paper) return res.status(404).json({ error: "Paper not found." });
    paper.Reviews = sanitizeReviews(paper.Reviews);

    if (paper.Revisions && paper.Revisions.length > 0) {
      paper.Revisions = paper.Revisions.map(revision => ({
        ...revision,
        Reviews: sanitizeReviews(revision.Reviews)
      }));
    }
    res.status(200).json({ paper });
  } catch (error) {
    console.error("Fetch Editor Paper Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/journal/editor/recommendation', async (req, res) => {
  const { paperId, editorId, recommendation, journalId } = req.body;
  if (!journalId) return res.status(400).json({ message: "Journal ID required" });

  try {
    const paper = await prisma.journalPapers.findUnique({ where: { id: paperId } });
    if (!paper || paper.JournalId !== parseInt(journalId, 10)) return res.status(403).json({ message: "Unauthorized" });

    await prisma.journalEditors.update({
      where: { PaperId_EditorId: { PaperId: paperId, EditorId: parseInt(editorId, 10) } },
      data: { Recommendation: recommendation, Status: 'Completed' }
    });

    await prisma.journalPapers.update({
      where: { id: paperId }, data: { Status: 'Awaiting Final Decision' }
    });

    res.status(200).json({ message: "Recommendation submitted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit recommendation" });
  }
});

app.post('/journal/editor/send-back-to-author', async (req, res) => {
  const { paperId, message, journalId } = req.body;
  
  if (!journalId) return res.status(400).json({ message: "Journal ID required." });

  try {
    const updatedPaper = await prisma.journalPapers.update({
      where: { 
          id: paperId, 
          JournalId: parseInt(journalId, 10) 
      },
      data: { 
          Status: 'Sent Back to Author', 
          Editors: {
              deleteMany: {} 
          }
      },
      include: { 
          Authors: true 
      }
    });

    const journal = await prisma.journal.findUnique({ where: { id: parseInt(journalId, 10) } });
    const journalName = journal ? journal.name : "SubmitEase Journal";

    if (updatedPaper.Authors && updatedPaper.Authors.length > 0) {
      const primaryAuthor = updatedPaper.Authors[0];
      
      // Updated Email Template: Changed wording and switched colors from Red to Amber/Orange
      const body = `
                <p>Dear <strong>${primaryAuthor.firstname} ${primaryAuthor.lastname}</strong>,</p>
                <p>Thank you for submitting your manuscript <strong>"${updatedPaper.Title}"</strong> to Journal ${journalName}.</p>
                <p>After an initial editorial review, we are sending your manuscript back to you. Some modifications or formatting corrections are required before we can proceed with the formal peer-review process.</p>
                
                <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">Required Corrections from the Editor:</h3>
                    <p style="color: #b45309; font-style: italic; margin-bottom: 0;">"${message}"</p>
                </div>
                
                <p>Please review the feedback above, update your manuscript, and resubmit it through your author dashboard.</p>
            `;
            
      const emailHtml = getBeautifulEmailTemplate(`Action Required: Paper #${paperId}`, body, true);
      sendMail(primaryAuthor.email, `Action Required for your submission: Paper #${paperId}`, emailHtml);
    }

    res.status(200).json({ message: "Paper sent back to author and editor assignment cleared." });
    
  } catch (error) {
    console.error("Send Back Error:", error);
    res.status(500).json({ message: "Failed to send paper back to author" });
  }
});

// ============================================================================
// EDITOR TRANSFER ENDPOINTS (With Emails)
// ============================================================================

app.post('/journal/editor/transfer/initiate', async (req, res) => {
  const { paperId, journalId, editorId, newEditorId, upgradeRole } = req.body;
  if (!journalId) return res.status(400).json({ message: "Journal ID required." });

  try {
    await prisma.journalEditors.update({
      where: { PaperId_EditorId: { PaperId: paperId, EditorId: parseInt(editorId, 10) } },
      data: { TransferredEditorId: parseInt(newEditorId, 10), TransferStatus: 'Pending' }
    });

    const newEditor = await prisma.user.findUnique({ where: { id: parseInt(newEditorId, 10) } });
    const paper = await prisma.journalPapers.findUnique({ where: { id: paperId } });

    if (upgradeRole) {
      const existingAssignment = await prisma.journalAssignment.findUnique({
        where: { JournalId_UserId: { JournalId: parseInt(journalId, 10), UserId: newEditor.id } }
      });
      if (existingAssignment) {
        await prisma.journalAssignment.update({
          where: { JournalId_UserId: { JournalId: parseInt(journalId, 10), UserId: newEditor.id } },
          data: { role: Array.from(new Set([...existingAssignment.role, "Author", "Journal Editor"])) }
        });
      } else {
        await prisma.journalAssignment.create({
          data: { JournalId: parseInt(journalId, 10), UserId: newEditor.id, role: ["Author", "Journal Editor"] }
        });
      }
    }
    const journal = await prisma.journal.findUnique({ where: { id: parseInt(journalId, 10) } });
    const journalName = journal ? journal.name : "SubmitEase Journal";
    const bodyHtml = `
            <p>Dear <strong>${newEditor.firstname} ${newEditor.lastname}</strong>,</p>
            <p>You have been requested to take over the editorial duties of Journal ${journalName} for the manuscript:</p>
            <div style="background-color: #f3f4f6; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-style: italic;">"${paper.Title}"</p>
            </div>
            <p>Please log in to the SubmitEase Editor Portal and navigate to your <strong>Transfers Tab</strong> to accept or decline this request.</p>
        `;
    const emailHtml = getBeautifulEmailTemplate(`Editor Transfer Request`, bodyHtml);
    sendMail(newEditor.email, `Editor Transfer Request: Paper #${paperId}`, emailHtml);

    res.status(200).json({ message: "Transfer initiated successfully." });
  } catch (error) {
    console.error("Initiate Transfer Error:", error);
    res.status(500).json({ message: "Failed to initiate transfer." });
  }
});


app.post('/journal/editor/transfer/respond', async (req, res) => {
  const { paperId, editorId, action, journalId } = req.body;

  try {
    const editorAssignment = await prisma.journalEditors.findFirst({
      where: { PaperId: paperId, TransferredEditorId: parseInt(editorId, 10), TransferStatus: "Pending" },
      include: { Editor: true, Paper: true }
    });

    if (!editorAssignment) return res.status(404).json({ error: "Transfer request not found." });

    if (action === "accept") {
      await prisma.journalEditors.update({
        where: { id: editorAssignment.id },
        data: { EditorId: parseInt(editorId, 10), TransferredEditorId: null, TransferStatus: null }
      });

      const existingAssignment = await prisma.journalAssignment.findUnique({
        where: { JournalId_UserId: { JournalId: parseInt(journalId, 10), UserId: parseInt(editorId, 10) } }
      });

      if (existingAssignment) {
        await prisma.journalAssignment.update({
          where: { JournalId_UserId: { JournalId: parseInt(journalId, 10), UserId: parseInt(editorId, 10) } },
          data: { role: Array.from(new Set([...existingAssignment.role, "Author", "Journal Editor"])) }
        });
      } else {
        await prisma.journalAssignment.create({
          data: { JournalId: parseInt(journalId, 10), UserId: parseInt(editorId, 10), role: ["Author", "Journal Editor"] }
        });
      }
    } else if (action === "reject") {
      await prisma.journalEditors.update({
        where: { id: editorAssignment.id },
        data: { TransferredEditorId: null, TransferStatus: "Rejected" }
      });
    }

    const originalEditor = editorAssignment.Editor;
    const paper = editorAssignment.Paper;
    const journal = await prisma.journal.findUnique({ where: { id: parseInt(journalId, 10) } });
    const journalName = journal ? journal.name : "SubmitEase Journal";
    const bodyHtml = `
            <p>Dear <strong>${originalEditor.firstname} ${originalEditor.lastname}</strong>,</p>
            <p>Your request to transfer editorial duties of Journal ${journalName} for the manuscript <strong>"${paper.Title}"</strong> has been <strong>${action}ed</strong>.</p>
            ${action === 'reject' ? `<p style="color: #991b1b;">The paper has been returned to your Editor Dashboard.</p>` : `<p style="color: #065f46;">The new editor has successfully taken over the paper.</p>`}
        `;
    const emailHtml = getBeautifulEmailTemplate(`Transfer ${action.toUpperCase()}`, bodyHtml, action === 'reject');
    sendMail(originalEditor.email, `Transfer ${action.toUpperCase()}: Paper #${paperId}`, emailHtml);

    res.status(200).json({ message: `Transfer ${action}ed successfully.` });
  } catch (error) {
    console.error("Transfer Respond Error:", error);
    res.status(500).json({ error: "Failed to update transfer." });
  }
});

app.post('/journal/editor/transfer/revoke', async (req, res) => {
  const { paperId, editorId, journalId } = req.body;

  try {
    // 1. Verify the paper belongs to this journal (Defensive security check)
    const paper = await prisma.journalPapers.findUnique({ where: { id: paperId } });
    if (!paper || (journalId && paper.JournalId !== parseInt(journalId, 10))) {
      return res.status(403).json({ message: "Unauthorized access to this paper." });
    }

    // 2. Clear the transfer fields back to null
    await prisma.journalEditors.update({
      where: {
        PaperId_EditorId: {
          PaperId: paperId,
          EditorId: parseInt(editorId, 10)
        }
      },
      data: {
        TransferredEditorId: null,
        TransferStatus: null
      }
    });

    res.status(200).json({ message: "Transfer revoked successfully." });
  } catch (error) {
    console.error("Revoke Transfer Error:", error);
    res.status(500).json({ error: "Failed to revoke transfer." });
  }
});

// ============================================================================
// REVIEWER MANAGEMENT ENDPOINTS (With Emails)
// ============================================================================

app.post('/journal/assign-reviewers', async (req, res) => {
  const { paperId, reviewerIds, upgradeRole, journalId } = req.body;
  if (!journalId) return res.status(400).json({ message: "Journal ID required." });

  try {
    const paper = await prisma.journalPapers.findUnique({ where: { id: paperId } });
    const journal = await prisma.journal.findUnique({ where: { id: parseInt(journalId, 10) } });
    const journalName = journal ? journal.name : "SubmitEase Journal";

    for (const rId of reviewerIds) {
      const reviewerIntId = parseInt(rId, 10);

      // 1. Assign the Reviewer to the Paper
      const existing = await prisma.journalReviews.findUnique({
        where: { PaperId_ReviewerId: { PaperId: paperId, ReviewerId: reviewerIntId } }
      });

      if (!existing) {
        await prisma.journalReviews.create({
          data: { PaperId: paperId, ReviewerId: reviewerIntId, Status: 'Pending Invitation' }
        });
      }

      const user = await prisma.user.findUnique({ where: { id: reviewerIntId } });
      if (!user) continue; // Safety skip if user is missing

      // 2. Upgrade the Role Safely
      let roleUpgraded = false;
      if (upgradeRole) {
        const parsedJournalId = parseInt(journalId, 10);
        const existingAssignment = await prisma.journalAssignment.findUnique({
          where: { JournalId_UserId: { JournalId: parsedJournalId, UserId: user.id } }
        });

        // DEFENSIVE FIX: Ensure roles is always treated as an array, even if null in the DB
        const currentRoles = Array.isArray(existingAssignment?.role) ? existingAssignment.role : [];
        const updatedRoles = Array.from(new Set([...currentRoles, "Author", "Journal Reviewer"]));

        if (existingAssignment) {
          await prisma.journalAssignment.update({
            where: { JournalId_UserId: { JournalId: parsedJournalId, UserId: user.id } },
            data: { role: updatedRoles }
          });
        } else {
          await prisma.journalAssignment.create({
            data: { JournalId: parsedJournalId, UserId: user.id, role: updatedRoles }
          });
        }
        roleUpgraded = true;
      }

      // 3. Send the Email Safely
      if (!existing) {
        try {
          // DEFENSIVE FIX: Provide a fallback in case the paper title is missing
          const safeTitle = paper?.Title || "the assigned manuscript";
          const body = `
                        <p>Dear <strong>${user.firstname} ${user.lastname}</strong>,</p>
                        <p>You have been invited to review the following manuscript:</p>
                        <div style="background-color: #f3f4f6; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; font-style: italic;">"${safeTitle}"</p>
                        </div>
                        ${roleUpgraded ? `<p style="color: #059669; font-weight: bold;">Note: You have been granted the 'Journal Reviewer' role of Journal ${journalName} to access this paper.</p>` : ''}
                        <p>Please log in to the SubmitEase Reviewer Portal to formally <strong>Accept</strong> or <strong>Decline</strong> this invitation.</p>
                    `;
          const emailHtml = getBeautifulEmailTemplate(`Review Invitation: Paper #${paperId}`, body);

          // Await the mail function so we know it fires, but catch errors so it doesn't crash the loop
          await sendMail(user.email, `Reviewer Invitation: Paper #${paperId}`, emailHtml);
        } catch (mailError) {
          console.error(`Failed to send email to: ${user.email}`, mailError);
        }
      }
    }

    res.status(200).json({ message: "Reviewers assigned and notified successfully" });
  } catch (error) {
    console.error("Assign Reviewers Overall Error:", error);
    res.status(500).json({ message: "Failed to assign reviewers", error: error.message });
  }
});

app.post('/journal/remove-reviewers', async (req, res) => {
  const { paperId, reviewerIds, journalId } = req.body;
  if (!journalId) return res.status(400).json({ message: "Journal ID required." });

  try {
    const paper = await prisma.journalPapers.findUnique({ where: { id: paperId } });
    if (!paper || paper.JournalId !== parseInt(journalId, 10)) return res.status(403).json({ message: "Unauthorized" });

    const parsedIds = reviewerIds.map(id => parseInt(id, 10));
    await prisma.journalReviews.deleteMany({
      where: { PaperId: paperId, ReviewerId: { in: parsedIds } }
    });
    res.status(200).json({ message: "Reviewers removed successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove reviewers" });
  }
});

app.post('/journal/remind-reviewers', async (req, res) => {
  const { paperId, reviewerIds, journalId } = req.body;

  if (!journalId) return res.status(400).json({ message: "Journal ID required." });

  try {
    // Verify paper belongs to this journal
    const paper = await prisma.journalPapers.findUnique({
      where: { id: paperId },
      select: { Title: true, JournalId: true }
    });

    if (!paper || paper.JournalId !== parseInt(journalId, 10)) {
      return res.status(403).json({ message: "Unauthorized journal access." });
    }

    const reviewers = await prisma.user.findMany({
      where: { id: { in: reviewerIds.map(id => parseInt(id, 10)) } }
    });
    const journal = await prisma.journal.findUnique({ where: { id: parseInt(journalId, 10) } });
    const journalName = journal ? journal.name : "SubmitEase Journal";
    // Send styled reminder email to each selected reviewer
    for (const reviewer of reviewers) {
      const bodyHtml = `
                <p>Dear <strong>${reviewer.firstname} ${reviewer.lastname}</strong>,</p>
                <p>This is a friendly reminder regarding the peer-review invitation for the manuscript:</p>
                <div style="background-color: #f3f4f6; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-style: italic;">"${paper.Title}"</p>
                </div>
                <p>The editorial team is looking forward to your expertise. Please log in to the Reviewer Portal of Journal ${journalName} to submit your feedback or update your status.</p>
            `;
      const emailHtml = getBeautifulEmailTemplate("Review Reminder", bodyHtml);
      sendMail(reviewer.email, `Reminder: Review for Paper #${paperId}`, emailHtml);
    }

    res.status(200).json({ message: "Reminders sent successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to send reminders." });
  }
});


// ============================================================================
// USER DASHBOARD ENDPOINTS
// ============================================================================

app.get('/user/dashboard-stats/:userId', async (req, res) => {
  const { userId } = req.params;
  const id = parseInt(userId);

  try {
    const journalAccepted = await prisma.journalPapers.count({
      where: { Authors: { some: { id: id } }, Status: 'Accepted' }
    });
    const confAccepted = await prisma.paper.count({
      where: { Authors: { some: { id: id } }, Status: 'Accepted' }
    });

    const userPapers = await prisma.paper.findMany({
      where: { Authors: { some: { id: id } } },
      select: { ConferenceId: true }
    });
    const uniqueConferenceCount = new Set(userPapers.map(p => p.ConferenceId)).size;

    const journalCount = await prisma.journalAssignment.count({
      where: { UserId: id }
    });

    const totalJournal = await prisma.journalPapers.count({
      where: { Authors: { some: { id: id } } }
    });
    const totalConf = await prisma.paper.count({
      where: { Authors: { some: { id: id } } }
    });

    const journalActivity = await prisma.journalPapers.findMany({
      where: { Authors: { some: { id: id } } },
      take: 3,
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true, Title: true, Status: true, submittedAt: true,
        Journal: { select: { name: true } }
      }
    });

    const recentActivity = journalActivity.map(item => ({
      id: item.id,
      title: item.Title,
      status: item.Status,
      journalName: item.Journal?.name || 'Unknown Journal',
      time: new Date(item.submittedAt).toLocaleDateString()
    }));

    if (recentActivity.length === 0) {
      recentActivity.push({
        isDefault: true, title: "Dashboard Accessed", description: "You logged into SubmitEase.",
        time: new Date().toLocaleDateString()
      });
    }

    res.status(200).json({
      publishedCount: journalAccepted + confAccepted,
      conferenceCount: uniqueConferenceCount,
      journalCount: journalCount,
      totalSubmissions: totalJournal + totalConf,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get('/user/:id/registered-journals', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const assignments = await prisma.journalAssignment.findMany({
      where: { UserId: userId },
      include: { Journal: { select: { id: true, name: true, Publication: true, status: true } } }
    });

    const journalMap = new Map();
    assignments.forEach(a => {
      if (a.Journal && a.Journal.status !== 'Closed') {
        journalMap.set(a.Journal.id, { ...a.Journal, roles: a.role });
      }
    });

    res.status(200).json(Array.from(journalMap.values()));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch registered journals" });
  }
});

app.post('/journals/discover', async (req, res) => {
  try {
    const { expertise } = req.body;
    const allOpenJournals = await prisma.journal.findMany({
      where: { status: { in: ['Open', 'Active'] } },
      select: { id: true, name: true, Publication: true, Keywords: true, link: true }
    });

    let recommended = [];
    let available = [];

    if (expertise && expertise.length > 0) {
      const lowerExpertise = expertise.map(e => e.toLowerCase().trim());
      allOpenJournals.forEach(journal => {
        const journalKeywords = journal.Keywords || [];
        const hasMatch = journalKeywords.some(k => lowerExpertise.includes(k.toLowerCase().trim()));

        if (hasMatch) recommended.push(journal);
        else available.push(journal);
      });
    } else {
      available = allOpenJournals;
    }

    res.status(200).json({ recommended, available });
  } catch (error) {
    res.status(500).json({ error: "Failed to discover journals" });
  }
});

app.post('/journals/register-user', async (req, res) => {
  try {
    const { userId, journalId } = req.body;

    await prisma.journalAssignment.upsert({
      where: { JournalId_UserId: { JournalId: journalId, UserId: userId } },
      update: {},
      create: { JournalId: journalId, UserId: userId, role: ["Author"] }
    });
    res.status(200).json({ message: "Registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to register for journal" });
  }
});

// ============================================================================
// PUBLIC / LANDING PAGE ENDPOINTS
// ============================================================================

app.get('/public/platform-stats', async (req, res) => {
  try {
    const usersCount = await prisma.user.count();
    const conferencesCount = await prisma.conference.count();
    const journalPapersCount = await prisma.journalPapers.count();
    const confPapersCount = await prisma.paper.count();
    const journalCount = await prisma.journal.count();

    res.status(200).json({
      users: usersCount,
      conferences: conferencesCount,
      journals: journalCount,
      papers: journalPapersCount + confPapersCount
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/check-email', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    res.status(200).json({ exists: !!user });
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post('/journals/register', async (req, res) => {
  const { email, password, journalName, journalLink, publication,keywords } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User account not found." });

    if (password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ error: "Incorrect password." });
    }

    const newJournal = await prisma.journal.create({
      data: {
        name: journalName, link: journalLink || "",
        Publication: publication, status: "Pending", hostID: user.id,
        Keywords: keywords || [],
        submittedAt: new Date()
      }
    });

    const bodyHtml = `
            <p>Hello <strong>${user.firstname}</strong>,</p>
            <p>We have successfully received your application to host the following journal on SubmitEase:</p>
            <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #065f46; margin: 0 0 10px 0;">${journalName}</h2>
                <span style="background-color: #d1fae5; color: #065f46; padding: 6px 16px; border-radius: 9999px; font-size: 14px; font-weight: bold;">Status: Pending Approval</span>
            </div>
            <p>Our administration team is reviewing your request. You will receive an update at this email address once a decision has been made.</p>
        `;
    const emailHtml = getBeautifulEmailTemplate("Journal Request Received", bodyHtml);
    try {
      await sendMail(email, 'Journal Registration Request Received', emailHtml);
    } catch (mailErr) {
      console.error("Failed to send journal registration confirmation email:", mailErr);
    }

    res.status(201).json({ message: "Journal registered successfully!", journal: newJournal });
  } catch (error) {
    res.status(500).json({ error: "Failed to register journal" });
  }
});

app.post('/conference/registeration', async (req, res) => {
  const { name, location, startsAt, endAt, deadline, link, status, Partners, tracks, hostID, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: hostID } });
    if (!user) return res.status(404).json({ error: "Host user not found." });

    if (password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ error: "Incorrect password." });
    }

    const newConference = await prisma.conference.create({
      data: { name, location, startsAt: new Date(startsAt), endAt: new Date(endAt), deadline: new Date(deadline), link, status, Partners, hostID }
    });

    if (tracks && tracks.length > 0) {
      const trackPromises = tracks.map(trackName => prisma.tracks.create({ data: { Name: trackName, ConferenceId: newConference.id } }));
      await Promise.all(trackPromises);
    }

    const bodyHtml = `
            <p>Hello <strong>${user.firstname}</strong>,</p>
            <p>We have successfully received your application to host the following conference on SubmitEase:</p>
            <div style="background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #3730a3; margin: 0 0 10px 0;">${name}</h2>
                <span style="background-color: #e0e7ff; color: #3730a3; padding: 6px 16px; border-radius: 9999px; font-size: 14px; font-weight: bold;">Status: Pending Approval</span>
            </div>
            <p>Our administration team is reviewing your request. You will receive an update at this email address once your conference has been officially approved.</p>
        `;
    // Intentionally using standard theme color for conferences
    const emailHtml = getBeautifulEmailTemplate("Conference Request Received", bodyHtml);
    try {
      await sendMail(user.email, 'Conference Registration Request Received', emailHtml);
    } catch (mailErr) {
      console.error("Failed to send conference registration confirmation email:", mailErr);
    }

    res.status(201).json({ message: "Conference registered successfully!", conference: newConference });
  } catch (error) {
    res.status(500).json({ error: "Failed to register conference" });
  }
});

// --- Schedule the Job ---
cron.schedule('0 0 * * *', () => {
  console.log('Running scheduled check for expired conferences...');
  closeExpiredConferences();
});


app.post('/force-close-expired', async (req, res) => {
  try {
    await closeExpiredConferences();
    res.status(200).json({ message: "Expired conference check completed." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('🚀 API is running and connected to Prisma Postgres!');
});

app.listen(port, () => {
  console.log(`🚀 Server connected to Prisma Postgres, running at http://localhost:${port}`);
});

export default app;