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

// Create a new feedback
app.post('/feedbacks', async (req, res) => {
  const { feedback } = req.body;

  try {
    await pool.query(
      'INSERT INTO feedbacks (feedback) VALUES ($1)',
      [feedback]
    );
    res.status(201).json({ message: 'Feedback created successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create a new feedback
app.get('/feedbacks/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const feedback = await pool.query('SELECT * FROM feedbacks WHERE id = $1', [id]);

    if (feedback.rows.length === 0) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    res.json(feedback.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});



app.get('/feedbacks', async (req, res) => {
  try {
    const feedbacks = await pool.query('SELECT * FROM feedbacks');
    res.json(feedbacks.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


app.get('/feedbacks/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const feedback = await pool.query('SELECT * FROM feedbacks WHERE id = $1', [id]);

    if (feedback.rows.length === 0) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    res.json(feedback.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


app.put('/feedbacks/:id', async (req, res) => {
  const { id } = req.params;
  const { feedback } = req.body;

  try {
    await pool.query(
      'UPDATE feedbacks SET feedback = $1 WHERE id = $2',
      [feedback, id]
    );

    res.json({ message: 'Feedback updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


app.delete('/feedbacks/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deleteFeedback = await pool.query('DELETE FROM feedbacks WHERE id = $1 RETURNING *', [id]);
    
    if (deleteFeedback.rows.length === 0) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    res.json({ message: 'Feedback deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});



// AI Question Generation
// AI Question Generation
const generateQuestions = async (topicDescription, topicId, username) => {
  try {
    // Use the OpenAI API to generate the question
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `
            You are a teacher conducting an oral assessment. Your task is to generate open-ended and thought-provoking questions
            that ask for the student's opinion or perspective on a specific topic. The questions should encourage the student
            to think critically and provide detailed responses. Ensure each question ends with "Why or why not?" as part of the structure.
            
            Example questions:
            - Does making a living as a street artist appeal to you? Why or why not?
            - Do you think social media benefits us? Why or why not?
            - Are the cultures of yesteryear being lost in today's fast-paced society? Why or why not?
            
            Generate a question related to the following topic: ${description}.
          `
        }
      ],
      model: "gpt-4o-mini",
      temperature: 0.3, // Lower temperature for more focused responses
    });
    
    // Get the generated question from the AI's response
    let generatedQuestion = chatCompletion.choices[0].message.content.trim();

    // Ensure the question ends with "Why or why not?" by appending it if necessary
    if (!generatedQuestion.endsWith('Why or why not?')) {
      generatedQuestion += ' Why or why not?';
    }

    // Insert the generated question into the database
    await pool.query(
      'INSERT INTO questions (topic_id, question, username) VALUES ($1, $2, $3)',
      [topicId, generatedQuestion, username]
    );

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

// Import any required modules and configurations, such as OpenAI API setup

// Route to handle the AI response (chat)
app.post('/ai_response', async (req, res) => {
  const { userResponse, topicId } = req.body; // Get the user response and topicId from the request body

  try {
    // Fetch the topic description based on the topicId
    const topic = await pool.query('SELECT description FROM topic WHERE id = $1', [topicId]);
    const topicDescription = topic.rows[0].description;

    if (!topicDescription) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    // Create the prompt for the AI based on the user response and topic
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `
            You are a teacher conducting an oral assessment. Your role is to ask the student open-ended and thought-provoking questions on a variety of topics. 
            The assessment objectives are for the students to present ideas and opinions fluently and effectively to engage the 
            listener. They should also engage in a discussion and communicate ideas and opinions clearly. 
            Use the following example questions as a guide for the type and style of questions you should ask:
            - What are the advantages or disadvantages of social media?
            - Learning a foreign language can benefit us. Why or why not?
            - What are some effects that global warming has on us?
            Ask a similar question related to the following topic: ${topicDescription}.
             If the student responds with a short or basic answer, prompt them to elaborate by asking follow-up questions like:
            - "How so?"
            - "Can you give examples?"
            - "Could you explain more?"
            Use these types of prompts to encourage the student to think more deeply and provide a fuller answer.
          `
        },
        { 
          role: "user", 
          content: `The user has responded with: "${userResponse}". Please provide a response related to the topic: ${topicDescription} You need not respond to the students'response. You can just acknowledge by saying 'Ok' for example. `
        }
      ],
      model: "gpt-4o-mini",
      temperature: 0.7, // Control the creativity of the AI's responses
    });

    // Extract the AI's generated response from the API
    const aiReply = chatCompletion.choices[0].message.content.trim();

    // Return the AI's response back to the frontend
    res.status(200).json({ response: aiReply });

  } catch (err) {
    console.error('Error generating AI response:', err.message);
    res.status(500).json({ message: 'Error generating AI response' });
  }
});
