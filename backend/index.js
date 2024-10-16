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
  database: 'maverick',
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
        { role: "system", content: "You are an oral assessment teacher. Generate an open-ended, thought-provoking question related to the specified topic." },
        { role: "user", content: `Generate an oral assessment question for the topic: ${description}.` },
      ],
      model: "gpt-4o-mini",
      temperature: 0.3, // Lowering temperature can yield more specific responses
    });

    // Get the generated content
    const generatedContent = chatCompletion.choices[0].message.content.trim();
    
    // Split by new lines and periods, ensuring questions with multiple sentences stay together
    const questions = generatedContent.split(/\r?\n/).reduce((acc, curr) => {
      // If the current string is part of a previous question, append it
      if (acc.length > 0 && !/[.?!]$/.test(acc[acc.length - 1])) {
        acc[acc.length - 1] += ` ${curr.trim()}`;
      } else {
        acc.push(curr.trim());
      }
      return acc;
    }, []);

    // Insert each combined question into the database
    for (const question of questions) {
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
  const { description, topicId, username } = req.body; 

  try {
    // Remove the check for existing questions
    // Generate new questions regardless of whether previous ones exist
    await generateQuestions(description, topicId, username);

    // Fetch the newly generated questions
    const newQuestions = await pool.query('SELECT * FROM questions WHERE topic_id = $1 AND username = $2', [topicId, username]);

    res.status(200).json({ message: 'New questions generated successfully', questions: newQuestions.rows });
  } catch (err) {
    console.error('Error generating questions:', err.message);
    res.status(500).send('Server error');
  }
});



// Update an existing question for a specific topic and user
app.put('/questions/:id', async (req, res) => {
  const { id } = req.params; // Question ID
  const { topicId, username, newQuestion } = req.body; // New question content, topic ID, and username

  try {
    // Check if the question exists for the given topic, user, and question ID
    const existingQuestion = await pool.query(
      'SELECT * FROM questions WHERE id = $1 AND topic_id = $2 AND username = $3',
      [id, topicId, username]
    );

    if (existingQuestion.rows.length === 0) {
      return res.status(404).json({ message: 'Question not found for the specified topic and user' });
    }

    // Update the question in the database
    await pool.query(
      'UPDATE questions SET question = $1 WHERE id = $2 AND topic_id = $3 AND username = $4',
      [newQuestion, id, topicId, username]
    );

    res.json({ message: 'Question updated successfully' });
  } catch (err) {
    console.error('Error updating question:', err.message);
    res.status(500).send('Server error');
  }
});

// Get existing questions for a specific topic and user
app.get('/questions', async (req, res) => {
  const { topicId, username } = req.query; // Extract topicId and username from query parameters

  try {
    const questions = await pool.query(
      'SELECT * FROM questions WHERE topic_id = $1 AND username = $2',
      [topicId, username]
    );

    res.json(questions.rows);
  } catch (err) {
    console.error('Error fetching questions:', err.message);
    res.status(500).send('Server error');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
