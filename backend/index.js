const OpenAI = require ('openai');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path'); // Import path module for file serving
require('dotenv').config(); // Load .env file

const app = express();
app.use(express.json());
app.use(cors());

// Database connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'maverick',
  password: '12345678',
  port: 5432,
});

// OpenAI API setup using the key from .env
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // API key loaded from .env
});


// Middleware to serve uploaded files (videos) statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Upload folder for videos
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Unique file name with timestamp
  },
});

const upload = multer({ storage });

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: '', // Email
    pass: '', // App password
  },
});

// Registration endpoint
app.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)', [username, email, hashedPassword, role]);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (user.rows[0].role !== role) {
      return res.status(400).json({ error: 'Invalid role for the provided credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const username = user.rows[0].username;
    const userRole = user.rows[0].role;
    return res.json({ username, role: userRole });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Forgot password endpoint
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpire = Date.now() + 3600000; // 1-hour expiration

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
      [resetToken, resetTokenExpire, email]
    );

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    const mailOptions = {
      from: 'yeemaverick68@gmail.com', // Your email as sender
      to: email, // User's email from the request
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the following link to reset your password: ${resetUrl}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Error sending email' });
      } else {
        return res.status(200).json({ message: 'Password reset link sent to your email' });
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Reset password endpoint
app.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await pool.query('SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > $2', [token, Date.now()]);

    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE reset_token = $2', [hashedPassword, token]);

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// CRUD Operations for Topics

// Fetch all topics
app.get('/topics', async (req, res) => {
  try {
    const topics = await pool.query('SELECT * FROM topic'); // Query to get all topics
    res.json(topics.rows); // Return the array of topics
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get a specific topic by ID (Read)
app.get('/topics/:id', async (req, res) => {
  const { id } = req.params; // Extract ID from request parameters

  try {
    const topic = await pool.query('SELECT * FROM topic WHERE id = $1', [id]);

    if (topic.rows.length === 0) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    res.json(topic.rows[0]); // Return the found topic
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update a topic (Update) with optional video upload
app.put('/topics/:id', upload.single('video'), async (req, res) => {
  const { id } = req.params;
  const { topicname, difficulty, description } = req.body; // Include description here
  const videoUrl = req.file ? req.file.path : null; // Get the uploaded video path if exists
  const currentDate = new Date().toISOString(); // Get the current date and time

  try {
    const updateQuery = `
      UPDATE topic 
      SET topicname = $1, difficulty = $2, description = $3, video_url = COALESCE($4, video_url), datecreated = $5
      WHERE id = $6
    `;
    await pool.query(updateQuery, [topicname, difficulty, description, videoUrl, currentDate, id]); // Include description in the query

    res.json({ message: 'Topic updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

const generateQuestions = async (description, topicId) => {
  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are an oral assessment teacher. Generate one thought-provoking oral assessment question for the following topic." 
        },
        { 
          role: "user", 
          content: `Generate an oral assessment question based on the following description: ${description}` 
        }
      ],
      model: "gpt-4o-mini", // Ensure the model name is correct
    });

    const generatedQuestions = chatCompletion.choices[0].message.content.trim().split('\n'); // Process generated questions

    // Insert the generated questions into the 'questions' table
    for (const question of generatedQuestions) {
      await pool.query(
        'INSERT INTO questions (topic_id, question) VALUES ($1, $2)',
        [topicId, question]
      );
    }
  } catch (err) {
    console.error("Error generating questions:", err.message);
    throw err; // Rethrow error to handle it in the calling function
  }
};

app.post('/generate-questions', async (req, res) => {
  const { description, topicId } = req.body;

  if (!description || !topicId) {
    return res.status(400).json({ error: 'Description and topicId are required' });
  }

  try {
    await generateQuestions(description, topicId); // Call the function to generate questions
    res.status(200).json({ message: 'Questions generated successfully' });
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
});



// Create a new topic (Create) with video upload (no question generation)
app.post('/topics', upload.single('video'), async (req, res) => {
  try {
    const { topicname, difficulty, description } = req.body; // Destructure description
    const videoUrl = req.file ? req.file.path : null; // Get the uploaded video path

    // Insert the topic into the database
    const newTopic = await pool.query(
      'INSERT INTO topic (topicname, difficulty, video_url, description) VALUES ($1, $2, $3, $4) RETURNING id',
      [topicname, difficulty, videoUrl, description]
    );

    const topicId = newTopic.rows[0].id; // Get the newly created topic's ID

  

    res.status(201).json({ message: 'Topic created successfully' }); // Update success message
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});



// Delete a topic and its associated questions (Delete)
app.delete('/topics/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // First, delete all questions associated with this topic
    await pool.query('DELETE FROM questions WHERE topic_id = $1', [id]);

    // Then delete the topic
    const deleteTopic = await pool.query('DELETE FROM topic WHERE id = $1 RETURNING *', [id]);

    if (deleteTopic.rows.length === 0) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    res.json({ message: 'Topic and associated questions deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Start the server
app.listen(5000, () => console.log('Server running on http://localhost:5000'));
