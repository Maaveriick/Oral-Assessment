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
  password: process.env.DB_PASSWORD,
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

// Endpoint to get all student usernames
app.get('/students', async (req, res) => {
  try {
    const students = await pool.query('SELECT id, username FROM users WHERE role = $1', ['Student']);
    res.status(200).json(students.rows); // Send student data as JSON
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

app.get('/students/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const student = await pool.query('SELECT id, username FROM users WHERE id = $1', [id]);
    if (student.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.status(200).json(student.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


// CRUD for Topics
// CRUD for Topics
app.post('/topics', upload.single('video'), async (req, res) => {
  const { topicname, difficulty, description, questions } = req.body;
  const videoUrl = req.file ? req.file.path : null;
  const currentDate = new Date().toISOString();

  try {
    // Prepare the questions as an array
    const questionsArray = questions ? (Array.isArray(questions) ? questions : [questions]) : null;

    const topicResult = await pool.query(
      'INSERT INTO topic (topicname, difficulty, description, video_url, datecreated, questions) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [topicname, difficulty, description, videoUrl, currentDate, questionsArray]
    );

    res.status(201).json({ message: 'Topic created successfully with questions' });
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
  const { topicname, difficulty, description, questions } = req.body; // Include questions here
  const videoUrl = req.file ? req.file.path : null;
  const currentDate = new Date().toISOString();

  try {
    // Prepare the questions as an array
    const questionsArray = questions ? (Array.isArray(questions) ? questions : [questions]) : null;

    await pool.query(
      'UPDATE topic SET topicname = $1, difficulty = $2, description = $3, video_url = COALESCE($4, video_url), datecreated = $5, questions = $6 WHERE id = $7',
      [topicname, difficulty, description, videoUrl, currentDate, questionsArray, id]
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
    await pool.query('DELETE FROM topic WHERE id = $1', [id]);
    res.json({ message: 'Topic deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// CRUD for Feedback
app.post('/feedbacks', async (req, res) => {
  const { username, teacher_username, topicId, attempt_count, feedback } = req.body; // Get both student and teacher usernames

  // Check if all required fields are provided
  if (!teacher_username || !username || !feedback) {
    return res.status(400).send('Teacher username, student username, and feedback are required');
  }

  try {
    // Insert feedback into the database with both teacher and student usernames
    await pool.query(
      'INSERT INTO feedback (username, teacher_username, topic_id, attempt_count, feedback_text) VALUES ($1, $2, $3, $4, $5)',
      [username, teacher_username, topicId, attempt_count, feedback] // Use teacher_username here
    );
    res.status(200).send('Feedback created successfully');
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).send('Server error');
  }
});

app.get('/feedbacks', async (req, res) => {
  try {
    const feedbacks = await pool.query('SELECT * FROM feedback');
    res.json(feedbacks.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

app.post('/feedbacks/details', async (req, res) => {
  const { username, topicId, attempt_count } = req.body;

  if (!username || !topicId || !attempt_count) {
    return res.status(400).send('Username, topic ID, and attempt count are required');
  }

  try {
    const feedback = await pool.query(
      `SELECT * FROM feedback 
       WHERE username = $1 AND topic_id = $2 AND attempt_count = $3`,
      [username, topicId, attempt_count]
    );

    if (feedback.rows.length === 0) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    res.json(feedback.rows[0]);
  } catch (err) {
    console.error('Error fetching feedback:', err.message);
    res.status(500).send('Server error');
  }
});


app.put('/feedbacks/update', async (req, res) => {
  const { username, topicId, attempt_count, feedback_text } = req.body;

  if (!username || !topicId || !attempt_count || !feedback_text) {
    return res.status(400).send('All fields are required');
  }

  try {
    await pool.query(
      `UPDATE feedback 
       SET feedback_text = $1 
       WHERE username = $2 AND topic_id = $3 AND attempt_count = $4`,
      [feedback_text, username, topicId, attempt_count]
    );
    res.status(200).send('Feedback updated successfully');
  } catch (err) {
    console.error('Error updating feedback:', err.message);
    res.status(500).send('Server error');
  }
});



app.delete('/feedbacks/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM feedback WHERE id = $1', [id]);
    res.json({ message: 'Feedback deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

app.post('/generate-questions', async (req, res) => {
  const { topicname, description } = req.body;

  try {
    // Constructing the prompt for question generation
    const prompt = `Generate a unique question for the topic "${topicname}" with the following description: "${description}". Please ensure it's not a repeat question.`;

    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini", // Use your desired model
    });

    // Extracting the generated question
    const question = chatCompletion.choices[0].message.content;

    // Send the question back in the correct format
    res.status(200).json({ question });
  } catch (error) {
    console.error('Error generating questions:', error.message);
    res.status(500).json({ error: 'Failed to generate questions. Please try again later.' });
  }
});



// Route to handle the AI response (chat)
app.post('/ai_response', async (req, res) => {
  const { userResponse, topicId, generatedQuestion } = req.body;

  try {
    // Fetch the topic description based on the topicId
    const topic = await pool.query('SELECT description FROM topic WHERE id = $1', [topicId]);
    const topicDescription = topic.rows[0].description;

    if (!topicDescription) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `
            You are a teacher conducting an oral assessment. Your goal is to ask the student open-ended, thought-provoking questions based on their understanding of the topic.
            The topic is "${topicDescription}", and the specific question to start with is "${generatedQuestion}".

            - Start by asking follow-up questions to encourage elaboration or clarification on the student's response. These might include:
              - "Can you tell me more about that?"
              - "What’s an example of that?"
              - "Could you explain that a bit further?"

            - If the student seems uncertain or gives a brief answer, provide simpler or more engaging follow-ups, but be mindful not to push too hard if the student is reluctant to elaborate.
            
            **Ending the Assessment:**
            - If the student provides a response that is brief or seems like they are not willing to provide further elaboration, politely end the assessment. 
            - Here are some polite closure statements you can use:
              - "Thank you for your thoughts! We’ve covered the main points for today, and this concludes our assessment."
              - "That’s a great answer! I appreciate your input. This brings us to the end of the assessment."
              - "Thank you for your response. We’ve covered everything we need, so this will conclude our session."
            - You do not need to wait for the student to fully cover every aspect of the topic to end the assessment. Instead, assess whether the student's response shows enough effort or interest in the topic. If the response is too brief or the student seems unwilling to continue, feel free to wrap up politely.
            - Your goal is to ensure the student feels respected and encouraged, regardless of how comprehensive their answer is.
          `
        },
        {
          role: "user",
          content: `The user has responded with: "${userResponse}". Based on this response and the question "${generatedQuestion}", please generate a relevant follow-up question if the student seems willing to continue, or conclude the assessment politely if the response is brief or indicates a desire to finish.`
        }
      ],
      model: "gpt-4o-mini",
      temperature: 0.7, // Adjust creativity level
    });

    const aiReply = chatCompletion.choices[0].message.content.trim();
    res.status(200).json({ response: aiReply });

  } catch (err) {
    console.error('Error generating AI response:', err.message);
    res.status(500).json({ message: 'Error generating AI response' });
  }
});


// Chat Logs
app.post('/end_session', async (req, res) => {
  const { username, topicId, generatedQuestion, responses, datetime } = req.body;

  try {
    const client = await pool.connect();

    // Fetch the current attempt count for this user and topic
    const result = await client.query(
      `SELECT MAX(attempt_count) AS max_attempts 
       FROM assessment_sessions 
       WHERE username = $1 AND topic_id = $2`,
      [username, topicId]
    );
    const currentAttempts = result.rows[0]?.max_attempts || 0;

    // Insert the session with incremented attempt count
    await client.query(
      `INSERT INTO assessment_sessions (username, topic_id, question, responses, datetime, attempt_count)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [username, topicId, generatedQuestion, JSON.stringify(responses), datetime, currentAttempts + 1]
    );

    client.release();
    res.status(200).send({ message: 'Session data saved successfully.' });
  } catch (error) {
    console.error('Error saving session data:', error);
    res.status(500).send({ error: 'Failed to save session data.' });
  }
});

app.post('/attempts', async (req, res) => {
  const { username, topicId } = req.body;

  try {
    const client = await pool.connect();

    // Fetch only attempt count and datetime
    const result = await client.query(
      `SELECT attempt_count, datetime 
       FROM assessment_sessions 
       WHERE username = $1 AND topic_id = $2 
       ORDER BY attempt_count ASC`,
      [username, topicId]
    );

    client.release();
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching attempts:', error);
    res.status(500).send({ error: 'Failed to fetch attempts.' });
  }
});

app.post('/get_attempt_details', async (req, res) => {
  const { username, topicId, attempt_count } = req.body;

  try {
    const client = await pool.connect();

    // Fetch details for a specific attempt
    const result = await client.query(
      `SELECT question, responses, datetime 
       FROM assessment_sessions 
       WHERE username = $1 AND topic_id = $2 AND attempt_count = $3`,
      [username, topicId, attempt_count]
    );

    client.release();

    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]); // Send the specific attempt details
    } else {
      res.status(404).json({ error: 'Attempt not found.' });
    }
  } catch (error) {
    console.error('Error fetching attempt details:', error);
    res.status(500).send({ error: 'Failed to fetch attempt details.' });
  }
});




// Listening on port 5000
app.listen(5000, () => {
  console.log('Server is running on port 5000');
});

