const OpenAI = require('openai');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path'); 
require('dotenv').config(); 

const app = express();
app.use(express.json());
app.use(cors());

// Database connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'WRITE YOUR DATABASE NAME',
  password: process.env.DB_PASSWORD,  // Using env variable for DB password
  port: 5432,
});

// OpenAI API setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware to serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// Email configuration using environment variables
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Registration endpoint
app.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)', 
      [username, email, hashedPassword, role]
    );
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

    if (user.rows.length === 0 || user.rows[0].role !== role) {
      return res.status(400).json({ error: 'Invalid credentials' });
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
    const resetTokenExpire = Date.now() + 3600000; 

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
      [resetToken, resetTokenExpire, email]
    );

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the following link to reset your password: ${resetUrl}`,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Error sending email' });
      }
      return res.status(200).json({ message: 'Password reset link sent to your email' });
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

// CRUD for Topics

// Create a new topic
app.post('/topics', upload.single('video'), async (req, res) => {
  const { topicname, difficulty, description } = req.body;
  const videoUrl = req.file ? req.file.path : null; // Check if a file was uploaded
  const currentDate = new Date().toISOString();

  try {
    await pool.query(
      'INSERT INTO topic (topicname, difficulty, description, video_url, datecreated) VALUES ($1, $2, $3, $4, $5)',
      [topicname, difficulty, description, videoUrl, currentDate]
    );
    
    res.status(201).json({ message: 'Topic created successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


app.get('/topics', async (req, res) => {
  try {
    const topics = await pool.query('SELECT * FROM topic');
    res.json(topics.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

app.get('/topics/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const topic = await pool.query('SELECT * FROM topic WHERE id = $1', [id]);

    if (topic.rows.length === 0) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    res.json(topic.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

app.put('/topics/:id', upload.single('video'), async (req, res) => {
  const { id } = req.params;
  const { topicname, difficulty, description } = req.body;
  const videoUrl = req.file ? req.file.path : null;
  const currentDate = new Date().toISOString();

  try {
    await pool.query(
      'UPDATE topic SET topicname = $1, difficulty = $2, description = $3, video_url = COALESCE($4, video_url), datecreated = $5 WHERE id = $6',
      [topicname, difficulty, description, videoUrl, currentDate, id]
    );

    res.json({ message: 'Topic updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

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



// AI Question Generation
const generateQuestions = async (description, topicId, username) => {
  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are an oral assessment teacher. Generate a thought-provoking question." },
        { role: "user", content: `Generate an oral assessment question for the topic: ${description}` },
      ],
      model: "gpt-4o-mini", // Valid model name
    });

    const generatedQuestions = chatCompletion.choices[0].message.content.trim().split('. ');

    for (const question of generatedQuestions) {
      await pool.query(
        'INSERT INTO questions (topic_id, question, username) VALUES ($1, $2, $3)', 
        [topicId, question.trim(), username]
      );
    }
  } catch (err) {
    console.error("Error generating questions:", err.message);
    throw err;
  }
};


app.post('/generate_questions', async (req, res) => {
  const { description, topicId, username } = req.body; // Include username

  try {
    await generateQuestions(description, topicId, username); // Pass username to the function
    
    // Fetch the newly generated questions from the database
    const questions = await pool.query('SELECT * FROM questions WHERE topic_id = $1', [topicId]);
    
    res.status(200).json({ message: 'Questions generated successfully', questions: questions.rows });
  } catch (err) {
    res.status(500).send('Server error');
  }
});




app.get('/generate_questions', async (req, res) => {
  try {
    const generate_questions = await pool.query('SELECT * FROM questions');
    res.json(generate_questions.rows); // Change 'row' to 'rows'
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
