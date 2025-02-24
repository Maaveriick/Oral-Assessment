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
app.use(express.urlencoded({ extended: true }));
// Database connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: '',
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
    const students = await pool.query('SELECT id, username, email FROM users WHERE role = $1', ['Student']);
    res.status(200).json(students.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


app.get('/students/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const student = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [id]);
    if (student.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.status(200).json(student.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Endpoint to get all teacher information
app.get('/teachers', async (req, res) => {
  try {
    const teachers = await pool.query('SELECT id, username, email FROM users WHERE role = $1', ['Teacher']);
    res.status(200).json(teachers.rows);  // Send the teacher data as a response
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete a teacher by ID
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    // Start transaction
    await client.query('BEGIN');

    // Fetch teacher details
    const userResult = await client.query('SELECT username, email FROM users WHERE id = $1 AND role = $2', [id, 'Teacher']);
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const { username, email } = userResult.rows[0];

    // Delete associated records
    await client.query('DELETE FROM classes WHERE teacher_username = $1', [username]);
    await client.query('DELETE FROM feedback WHERE teacher_username = $1', [username]);
    await client.query('DELETE FROM topic WHERE teacher_username = $1', [username]);
    await client.query('DELETE FROM assessment_sessions WHERE username = $1', [username]);

    // Delete teacher from users table
    await client.query('DELETE FROM users WHERE id = $1', [id]);

    // Commit transaction
    await client.query('COMMIT');

    res.status(200).json({ message: 'Teacher and associated data deleted successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'An error occurred while deleting the teacher.' });
  } finally {
    client.release();
  }
});

app.delete('/students/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    // Start transaction
    await client.query('BEGIN');

    // Fetch student details
    const userResult = await client.query(
      'SELECT id, username, email FROM users WHERE id = $1 AND role = $2',
      [id, 'Student']
    );
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Student not found' });
    }

    // Extract username and email
    const { username, email } = userResult.rows[0];

    // Delete associated records from assessment_sessions
    await client.query('DELETE FROM assessment_sessions WHERE user_id = $1', [id]);

    // Delete associated records from feedback
    await client.query('DELETE FROM feedback WHERE user_id = $1', [id]);

    // Delete student from users table
    await client.query('DELETE FROM users WHERE id = $1', [id]);
    // Remove student from all classes
    await client.query(`
      UPDATE classes
      SET students = (
        SELECT jsonb_agg(student) 
        FROM jsonb_array_elements(students) AS student
        WHERE student->>'username' != $1::TEXT AND student->>'email' != $2::TEXT
      )
      WHERE students @> jsonb_build_array(jsonb_build_object('username', $1::TEXT, 'email', $2::TEXT))
    `, [username, email]);  // Pass username and email as parameters to the query

    // Commit transaction
    await client.query('COMMIT');

    res.status(200).json({ message: 'Student and associated data deleted successfully.' });
  } catch (err) {
    // Log the error to the console
    console.error('Error during delete operation:', err);

    // Rollback the transaction
    await client.query('ROLLBACK');

    // Respond with a more specific error message
    res.status(500).json({ error: 'An error occurred while deleting the student. ' + err.message });
  } finally {
    client.release();
  }
});


// CRUD for Topics
app.post('/topics', upload.single('video'), async (req, res) => {
  const { topicname, difficulty, description, teacher_username, questions, classes, timer } = req.body;
  const videoUrl = req.file ? req.file.path : null;
  const currentDate = new Date().toISOString();
 
  try {
    const classesArray = classes ? (Array.isArray(classes) ? classes : [classes]) : [];
    const questionsArray = questions ? (Array.isArray(questions) ? questions : [questions]) : null;
 
    // Insert the topic along with the timer value
    const topicResult = await pool.query(
      'INSERT INTO topic (topicname, difficulty, description, teacher_username, video_url, datecreated, questions, classes, timer) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [topicname, difficulty, description, teacher_username, videoUrl, currentDate, questionsArray, classesArray, timer]
    );
 
    res.status(201).json({ message: 'Topic created successfully with timer, questions, and classes' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});
 
 
 
 
 
app.get('/topics', async (req, res) => {
  const loggedInUser = req.headers['username']; // Assuming the username is sent in the request header
 
  try {
    const topics = await pool.query('SELECT * FROM topic WHERE teacher_username = $1', [loggedInUser]);
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
  const { topicname, difficulty, description, teacher_username, questions, selectedClasses, timer } = req.body;
  const videoUrl = req.file ? req.file.path : req.body.videoUrl || null;
  const currentDate = new Date().toISOString();
  const topicId = req.params.id;
 
  try {
    const classesArray = Array.isArray(selectedClasses) ? selectedClasses : [];
    const questionsArray = questions ? (Array.isArray(questions) ? questions : [questions]) : null;
 
    // Update the topic along with the timer value
    const topicResult = await pool.query(
      'UPDATE topic SET topicname = $1, difficulty = $2, description = $3, teacher_username = $4, video_url = $5, datecreated = $6, questions = $7, classes = $8, timer = $9 WHERE id = $10',
      [topicname, difficulty, description, teacher_username, videoUrl, currentDate, questionsArray, classesArray, timer, topicId]
    );
 
    res.status(200).json({ message: 'Topic updated successfully with timer, questions, and classes' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

app.get('/topics/student/:username/:email', async (req, res) => {
  const { username, email } = req.params; // Here email comes from the URL

  try {
    // Step 1: Get the student's class based on their username and email
    const classResult = await pool.query(
      'SELECT class_name FROM classes WHERE students @> $1::jsonb',
      [JSON.stringify([{ username, email }])]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found in any class.' });
    }

    const className = classResult.rows[0].class_name;

    // Step 2: Fetch topics assigned to this class
    const topicResult = await pool.query(
      'SELECT * FROM topic WHERE $1 = ANY(classes)',
      [className]
    );

    if (topicResult.rows.length > 0) {
      res.status(200).json(topicResult.rows);
    } else {
      res.status(404).json({ message: 'No topics assigned to this class.' });
    }
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: 'Internal server error' });
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
/*
// CRUD for Feedback
app.post('/feedbacks', async (req, res) => {
  const { username, teacher_username, topicId, attempt_count, feedback, grade, user_id,} = req.body;
 
  console.log('Request Body:', req.body); // Log the entire request body
 
  if (!username || !teacher_username || !topicId || !attempt_count || !feedback || !grade) {
    return res.status(400).send('All fields are required');
  }
 
  try {
    await pool.query(
      `INSERT INTO feedback (username, teacher_username, topic_id, attempt_count, feedback_text, grade, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [username, teacher_username, topicId, attempt_count, feedback, grade, user_id]
    );
    res.status(201).send('Feedback and grade saved successfully');
  } catch (err) {
    console.error('Error saving feedback:', err.message);
    res.status(500).send('Server error');
  }
});
*/
app.post('/feedbacks', async (req, res) => {
  const { username, teacher_username, topicId, attempt_count, feedback, grade, user_id, classId } = req.body;
 
  console.log('Request Body:', req.body); // Log the entire request body
  console.log('classId:', classId);       // Log the specific classId field
 
  if (!username || !teacher_username || !topicId || !attempt_count || !feedback || !grade || !classId) {
    return res.status(400).send('All fields are required, including classId.');
  }
 
  try {
    await pool.query(
      `INSERT INTO feedback (username, teacher_username, topic_id, attempt_count, feedback_text, grade, user_id, class_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [username, teacher_username, topicId, attempt_count, feedback, grade, user_id, classId]
    );
    res.status(201).send('Feedback and grade saved successfully');
  } catch (err) {
    console.error('Error saving feedback:', err.message);
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

    res.json(feedback.rows[0]); // Includes grade in the response
  } catch (err) {
    console.error('Error fetching feedback:', err.message);
    res.status(500).send('Server error');
  }
});



app.put('/feedbacks/update', async (req, res) => {
  const { username, teacher_username, topicId, attempt_count, feedback_text, grade } = req.body;

  if (!username || !teacher_username || !topicId || !attempt_count || !feedback_text || !grade) {
    return res.status(400).send('All fields are required');
  }

  try {
    await pool.query(
      `UPDATE feedback 
       SET feedback_text = $1, grade = $2, teacher_username = $3
       WHERE username = $4 AND topic_id = $5 AND attempt_count = $6`,
      [feedback_text, grade, teacher_username, username, topicId, attempt_count]
    );
    res.status(200).send('Feedback updated successfully');
  } catch (err) {
    console.error('Error updating feedback:', err.message);
    res.status(500).send('Server error');
  }
});

app.delete('/feedbacks', async (req, res) => {
  const { username, topicId, attempt_count } = req.body;

  if (!username || !topicId || !attempt_count) {
    return res.status(400).send('Username, topic ID, and attempt count are required');
  }

  try {
    // Delete both feedback and grade from the feedback table
    await pool.query(
      `DELETE FROM feedback 
       WHERE username = $1 AND topic_id = $2 AND attempt_count = $3`,
      [username, topicId, attempt_count]
    );
    res.status(200).json({ message: 'Feedback and grade deleted successfully' });
  } catch (err) {
    console.error('Error deleting feedback and grade:', err.message);
    res.status(500).send('Server error');
  }
});

//Generate Question
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


app.post('/end_session', async (req, res) => {
  const { email, topicId, generatedQuestion, responses, datetime, timeElapsed } = req.body; // Add timeElapsed

  try {
    const client = await pool.connect();

    // Fetch user details based on email (including user_id and username)
    const userResult = await client.query(
      `SELECT id, username FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).send({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;
    const username = userResult.rows[0].username;

    // Fetch the current attempt count for this user and topic
    const result = await client.query(
      `SELECT MAX(attempt_count) AS max_attempts 
       FROM assessment_sessions 
       WHERE user_id = $1 AND topic_id = $2`,
      [userId, topicId]
    );
    const currentAttempts = result.rows[0]?.max_attempts || 0;

    // Insert the session with incremented attempt count, user_id, username, and time_elapsed
    await client.query(
      `INSERT INTO assessment_sessions (user_id, username, topic_id, question, responses, datetime, attempt_count, time_elapsed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, username, topicId, generatedQuestion, JSON.stringify(responses), datetime, currentAttempts + 1, timeElapsed] 
    );

    client.release();
    res.status(200).send({ message: 'Session data saved successfully.' });
  } catch (error) {
    console.error('Error saving session data:', error);
    res.status(500).send({ error: 'Failed to save session data.' });
  }
});
/*
app.post('/end_session', async (req, res) => {
  const { email, topicId, generatedQuestion, responses, datetime, timeElapsed } = req.body; // Add timeElapsed

  try {
    const client = await pool.connect();

    // Fetch user details based on email (including user_id and username)
    const userResult = await client.query(
      `SELECT id, username FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).send({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;
    const username = userResult.rows[0].username;

    // Fetch the current attempt count for this user and topic
    const result = await client.query(
      `SELECT MAX(attempt_count) AS max_attempts 
       FROM assessment_sessions 
       WHERE user_id = $1 AND topic_id = $2`,
      [userId, topicId]
    );
    const currentAttempts = result.rows[0]?.max_attempts || 0;

    // Insert the session with incremented attempt count, user_id, username, and time_elapsed
    await client.query(
      `INSERT INTO assessment_sessions (user_id, username, topic_id, question, responses, datetime, attempt_count, time_elapsed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, username, topicId, generatedQuestion, JSON.stringify(responses), datetime, currentAttempts + 1, timeElapsed] // Include timeElapsed
    );

    client.release();
    res.status(200).send({ message: 'Session data saved successfully.' });
  } catch (error) {
    console.error('Error saving session data:', error);
    res.status(500).send({ error: 'Failed to save session data.' });
  }
});
*/

app.post('/attempts', async (req, res) => {
  const { username, topicId } = req.body;

  try {
    const client = await pool.connect();

    // Fetch attempts including user_id from the assessment_sessions table
    const attemptsResult = await client.query(
      `SELECT user_id, attempt_count, datetime
       FROM assessment_sessions 
       WHERE username = $1 AND topic_id = $2 
       ORDER BY attempt_count ASC`,
      [username, topicId]  // Use username and topicId directly
    );

    // Check if attempts are found
    if (attemptsResult.rows.length === 0) {
      return res.status(404).send({ error: 'No attempts found for this user and topic' });
    }

    console.log('Fetched attempts:', attemptsResult.rows); // Log the fetched attempts

    client.release();
    res.status(200).json(attemptsResult.rows); // Return the attempts data including user_id
  } catch (error) {
    console.error('Error fetching attempts:', error);
    res.status(500).send({ error: 'Failed to fetch attempts.' });
  }
});

app.post('/get_attempt_details', async (req, res) => {
  const { username, topicId, attempt_count } = req.body;

  try {
    const client = await pool.connect();

    // Fetch details for a specific attempt, including user_id
    const result = await client.query(
      `SELECT username, user_id, question, responses, datetime 
       FROM assessment_sessions 
       WHERE username = $1 AND topic_id = $2 AND attempt_count = $3`,
      [username, topicId, attempt_count]
    );

    client.release();

    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]); // Send the specific attempt details, including user_id
    } else {
      res.status(404).json({ error: 'Attempt not found.' });
    }
  } catch (error) {
    console.error('Error fetching attempt details:', error);
    res.status(500).send({ error: 'Failed to fetch attempt details.' });
  }
});


//CRUD Classess

// Get all classes
app.get('/classes', async (req, res) => {
  try {
    const classes = await pool.query('SELECT * FROM classes');
    res.status(200).json(classes.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create a new class// Endpoint to create a class
app.post('/classes', async (req, res) => {
  const { className, teacherUsername, students } = req.body;

  if (!className || !teacherUsername || !students) {
    return res.status(400).json({ error: 'Class name, teacher username, and students are required' });
  }

  try {
    // Insert into 'classes' table, only storing teacher's username
    const result = await pool.query(
      'INSERT INTO classes (class_name, teacher_username, students) VALUES ($1, $2, $3) RETURNING *',
      [className, teacherUsername, JSON.stringify(students)]
    );

    res.status(201).json({
      message: 'Class created successfully',
      class: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// Update an existing class// Update class information (className, teacherUsername, etc.)
app.put('/classes/:classId', async (req, res) => {
  const { classId } = req.params;
  const { class_name, teacher_username, students } = req.body;

  try {
    // Ensure that classId is provided
    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required to update' });
    }

    // Ensure the students field is an array, and then serialize it as a JSON string
    let studentsJson = [];
    if (students) {
      studentsJson = JSON.stringify(students); // Serialize array to JSON string
    }

    // Update the class in the PostgreSQL database
    const result = await pool.query(
      'UPDATE classes SET class_name = $1, teacher_username = $2, students = $3 WHERE id = $4 RETURNING *',
      [class_name, teacher_username, studentsJson, classId]
    );

    // If the update was successful and a class was found
    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Class updated successfully', class: result.rows[0] });
    } else {
      // If no class was found with the given ID
      res.status(404).json({ message: 'Class not found' });
    }
  } catch (error) {
    // If an error occurred while updating the class
    console.error('Error updating class:', error);
    res.status(500).json({ error: 'Failed to update class' });
  }
});




app.get('/classes/:classId', async (req, res) => {
  let { classId } = req.params;
  
  classId = parseInt(classId, 10);
  
  if (isNaN(classId)) {
    return res.status(400).json({ message: 'Invalid classId' });
  }

  try {
    const classResult = await pool.query('SELECT class_name, teacher_username, students FROM classes WHERE id = $1', [classId]);

    if (classResult.rows.length > 0) {
      let students = classResult.rows[0].students;

      if (typeof students === 'string') {
        students = JSON.parse(students);
      }

      // Fetch teacher info using teacher_username
      const teacherResult = await pool.query('SELECT id, username, email FROM users WHERE username = $1 AND role = $2', [classResult.rows[0].teacher_username, 'Teacher']);

      if (teacherResult.rows.length > 0) {
        res.json({
          class_name: classResult.rows[0].class_name,
          teacher: teacherResult.rows[0],
          students
        });
      } else {
        res.status(404).json({ message: 'Teacher not found' });
      }

    } else {
      res.status(404).json({ message: 'Class not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Delete a class
app.delete('/classes/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM classes WHERE id = $1', [id]);
    res.status(200).send('Class deleted successfully');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Endpoint to get classes assigned to a specific teacher
app.get('/classes/teacher/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const result = await pool.query(
      'SELECT id, class_name, teacher_username, students, ai_enabled FROM classes WHERE teacher_username = $1',
      [username]
    );

    if (result.rows.length > 0) {
      res.status(200).json(result.rows);
    } else {
      res.status(404).json({ message: 'No classes found for this teacher.' });
    }
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

app.put('/classes/teacher/:username/:classId/ai-toggle', async (req, res) => {
  const { username, classId } = req.params;
  console.log('Request Params:', req.params); // Log parameters for debugging
  const { aiEnabled } = req.body;

  try {
    const classCheck = await pool.query(
      'SELECT teacher_username FROM classes WHERE id = $1',
      [classId]
    );

    if (classCheck.rows.length > 0 && classCheck.rows[0].teacher_username === username) {
      const updateQuery = `
        UPDATE classes
        SET ai_enabled = $1
        WHERE id = $2
      `;
      await pool.query(updateQuery, [aiEnabled, classId]);

      res.status(200).json({ message: 'AI feature status updated successfully.' });
    } else {
      res.status(403).json({ message: 'You are not authorized to modify this class.' });
    }
  } catch (error) {
    console.error('Error updating AI feature:', error);
    res.status(500).json({ error: 'Failed to update AI feature status.' });
  }
});

// Endpoint to get AI status for the student's class
app.get('/assessment/student/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const result = await pool.query(
      'SELECT c.ai_enabled ' +
      'FROM classes c ' +
      'WHERE EXISTS (' +
        'SELECT 1 ' +
        'FROM jsonb_array_elements(c.students) AS student ' +
        "WHERE student->>'username' = $1" +  // Corrected syntax, properly escaping single quotes
      ')',
      [username]
    );

    if (result.rows.length > 0) {
      const aiEnabled = result.rows[0].ai_enabled;
      res.status(200).json({ aiEnabled });  // Send the AI status
    } else {
      res.status(404).json({ message: 'Student not found in class.' });
    }
  } catch (error) {
    console.error('Error fetching AI status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


app.get('/api/student/attempts/:username', async (req, res) => {
  const { username } = req.params;
  console.log(`Fetching attempts for username: ${username}`); // Log username
  try {
      const attempts = await pool.query(
          `SELECT topic_id, attempt_count, feedback_text, teacher_username 
           FROM feedback WHERE username = $1`,  // Change 'student_username' to 'username'
          [username]
      );
      console.log(attempts.rows); // Log query result
      res.json(attempts.rows);
  } catch (err) {
      console.error('Error fetching data from database:', err.message); // Log detailed error
      res.status(500).json({ error: 'Failed to fetch data from the database.' });
  }
});



app.post('/announcements', async (req, res) => {
  const { title, content, class_id, username } = req.body;

  if (!title || !content || !username) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO announcements (title, content, class_id, username) VALUES ($1, $2, $3, $4) RETURNING id, title, content, class_id, username, date_posted',
      [title, content, class_id, username]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating announcement:', err.stack);

    if (err.code === '23502') { // NOT NULL violation
      res.status(400).json({ message: 'Missing required fields' });
    } else {
      res.status(500).json({ message: 'Error creating announcement' });
    }
  }
});


app.get('/announcements/class/:classId', async (req, res) => {
  const { classId } = req.params;
  try {
    // Fetch announcements for the class
    const announcements = await pool.query(
      'SELECT * FROM announcements WHERE class_id = $1',
      [classId]
    );

    // Fetch the class name
    const classResult = await pool.query(
      'SELECT class_name FROM classes WHERE id = $1',
      [classId]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json({
      className: classResult.rows[0].class_name,
      announcements: announcements.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.put('/announcements/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, class_id } = req.body;

  try {
    let query = '';
    let values = [];

    // Check if class_id is provided in the request
    if (class_id !== undefined) {
      query = `
        UPDATE announcements 
        SET title = $1, content = $2, class_id = $3 
        WHERE id = $4 
        RETURNING *`;
      values = [title, content, class_id, id];
    } else {
      query = `
        UPDATE announcements 
        SET title = $1, content = $2 
        WHERE id = $3 
        RETURNING *`;
      values = [title, content, id];
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating announcement:', err);
    res.status(500).json({ message: 'Error updating announcement' });
  }
});


// DELETE Announcement
app.delete('/announcements/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM announcements WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json({ message: 'Announcement deleted successfully' });
  } catch (err) {
    console.error('Error deleting announcement:', err);
    res.status(500).json({ message: 'Error deleting announcement' });
  }
});


app.get('/announcements/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, title, content, class_id, username, date_posted FROM announcements WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching announcement:', err);
    res.status(500).json({ message: 'Error fetching announcement' });
  }
});



app.get('/api/student/announcements/:username', async (req, res) => {
  const username = req.params.username;

  try {
    // Step 1: Get the class ID of the student using the `classes` table
    const classQuery = `
      SELECT c.id AS class_id
      FROM classes c
      WHERE EXISTS (
        SELECT 1
        FROM jsonb_array_elements(c.students) AS student
        WHERE student->>'username' = $1
      )
    `;
    const classResult = await pool.query(classQuery, [username]);

    if (classResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student or class not found' });
    }

    const studentClassId = classResult.rows[0].class_id;

    // Step 2: Fetch announcements for the class
    const announcementsQuery = `
      SELECT a.id, a.title, a.content, a.date_posted, a.username AS teacher_username
      FROM announcements a
      WHERE a.class_id = $1
      ORDER BY a.date_posted DESC
    `;
    const announcementsResult = await pool.query(announcementsQuery, [studentClassId]);

    if (announcementsResult.rows.length === 0) {
      return res.status(404).json({ message: 'No announcements found for this class' });
    }

    res.json(announcementsResult.rows);
  } catch (error) {
    console.error('Error fetching announcements:', error); // Log the error to the console
    res.status(500).json({ message: 'Internal server error' });
  }
});


// GET /api/teacher/announcements/:username - READ Announcements for a Teacher's Classes
app.get('/api/teacher/announcements/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM announcements WHERE teacher_username = $1 ORDER BY date_posted DESC',
      [username]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching announcements:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
/*
app.get('/grades', async (req, res) => {
  const { classId, teacherUsername } = req.query; // Extract from query parameters

  // If classId or teacherUsername is not provided, return an error
  if (!classId || !teacherUsername) {
    return res.status(400).json({ error: 'Missing classId or teacherUsername' });
  }

  try {
    // Fetch grades for the specific classId
    const query = `
      SELECT username, grade, COALESCE(attempt_count, 0) as attempt_count
      FROM feedback
      WHERE class_id = $1
    `;
    const result = await pool.query(query, [classId]);  // Use classId from the request

    const grades = result.rows;

    // Calculate Class Average
    const totalGrades = grades.reduce((acc, student) => acc + Number(student.grade), 0);
    const classAverage = grades.length > 0 ? totalGrades / grades.length : 0;

    // Calculate Grade Distribution
    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    grades.forEach((student) => {
      const grade = Number(student.grade); // Ensure grade is a number
      if (grade >= 36) gradeDistribution.A++;
      else if (grade >= 31) gradeDistribution.B++;
      else if (grade >= 26) gradeDistribution.C++;
      else if (grade >= 21) gradeDistribution.D++;
      else gradeDistribution.F++;
    });

    res.json({
      grades,
      classAverage,
      gradeDistribution,
    });
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ error: 'Error fetching grades.' });
  }
});
*/

app.get('/grades', async (req, res) => {
  const { classId, teacherUsername } = req.query; // Extract from query parameters

  // If classId or teacherUsername is not provided, return an error
  if (!classId || !teacherUsername) {
    return res.status(400).json({ error: 'Missing classId or teacherUsername' });
  }

  try {
    // Fetch grades for the specific classId
    const query = 
      `SELECT username, grade, COALESCE(attempt_count, 0) as attempt_count
       FROM feedback
       WHERE class_id = $1`;
    const result = await pool.query(query, [classId]);  // Use classId from the request

    const grades = result.rows;

    // Validate and clean up grade data
    const cleanedGrades = grades.map(student => {
      // Clean the grade (remove % and ensure it's a valid number)
      let grade = student.grade.replace('%', '').trim(); // Remove the '%' and any extra spaces
      grade = parseFloat(grade); // Convert to float

      // If grade is not a valid number, set it to 0
      if (isNaN(grade)) {
        grade = 0;
      }

      return { ...student, grade }; // Re-attach cleaned grade
    });

    // Calculate Class Average
    const totalGrades = cleanedGrades.reduce((acc, student) => acc + student.grade, 0);
    const classAverage = cleanedGrades.length > 0 ? totalGrades / cleanedGrades.length : 0;

    // Calculate Grade Distribution
    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, E:0, F: 0 };
    cleanedGrades.forEach((student) => {
      const grade = student.grade;
      if (grade >= 70) gradeDistribution.A++;
      else if (grade >= 60) gradeDistribution.B++;
      else if (grade >= 55) gradeDistribution.C++;
      else if (grade >= 50) gradeDistribution.D++;
      else if (grade >= 40) gradeDistribution.E++;
      else gradeDistribution.F++;
    });

    res.json({
      grades: cleanedGrades,
      classAverage,
      gradeDistribution,
    });
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ error: 'Error fetching grades.' });
  }
});


app.get('/individual-analysis', async (req, res) => {
  const { classId, userId, username } = req.query;

  if (!userId && !username) {
    return res.status(400).json({ error: 'Missing userId or username' });
  }

  try {
    let query = `SELECT username, grade, attempt_count FROM feedback WHERE class_id = $1`;
    const queryParams = [classId];

    if (userId) {
      query += ` AND user_id = $2`;
      queryParams.push(userId);
    } else if (username) {
      query += ` AND username = $2`;
      queryParams.push(username);
    }

    const result = await pool.query(query, queryParams);
    const individualGrades = result.rows;

    // Calculate Total Points, Total Attempts, and Grade Distribution
    let totalPoints = 0;
    let gradeDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };

    // Instead of summing attempt counts, count the number of records for totalAttempts
    const totalAttempts = individualGrades.length; // Count the number of grades, not sum attempts

    individualGrades.forEach((gradeData) => {
      const grade = parseInt(gradeData.grade.replace('%', ''), 10); // Clean the percentage

      // Add the grade to totalPoints (no multiplication with attempt_count)
      totalPoints += grade;

      // Calculate grade distribution once for each grade
      if (grade >= 70) gradeDistribution.A++;
      else if (grade >= 60) gradeDistribution.B++;
      else if (grade >= 55) gradeDistribution.C++;
      else if (grade >= 50) gradeDistribution.D++;
      else if (grade >= 40) gradeDistribution.E++;
      else gradeDistribution.F++;
    });

    // Calculate average grade (numeric)
    const averageGrade = totalPoints / totalAttempts;

    // Determine the average grade's category
    const averageGradeDistribution = getGradeDistribution(averageGrade);

    res.json({
      individualGrades,
      averageGrade, // Return the average grade as a number
      gradeDistribution,
      averageGradeDistribution, // Added average grade distribution
      totalAttempts, // This will now be the count of grades, not the sum of attempts
    });
  } catch (error) {
    console.error('Error fetching individual grades:', error);
    res.status(500).json({ error: 'Error fetching individual grades.' });
  }
});

// Helper function to determine grade distribution (A, B, C, D, F)
function getGradeDistribution(grade) {
  if (grade >= 70) return 'A';
  if (grade >= 60) return 'B';
  if (grade >= 55) return 'C';
  if (grade >= 50) return 'D';
  if (grade >= 40) return 'E';
  return 'F';
}

//Create Rubric
app.post('/api/rubric', async (req, res) => {
  const { rubricTitle, rubric, columns } = req.body;

  // Validate input
  if (!rubricTitle || !Array.isArray(rubric) || !Array.isArray(columns)) {
    return res.status(400).json({ error: 'Invalid data provided' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Start a transaction

    // Step 1: Create the column_order array to store column names in the desired order
    const columnOrder = columns.map(column => column.name);  // Do not stringify it, just keep it as an array.

    // Step 2: Insert the rubric into the rubric table, including column_order
    const gradingColumns = columns.reduce((acc, column) => {
      acc[column.name] = '';  // Keep column name as is (no conversion)
      return acc;
    }, {});

    const rubricResult = await client.query(
      'INSERT INTO rubric (rubric_title, grading_columns, column_order) VALUES ($1, $2, $3) RETURNING id',
      [rubricTitle, JSON.stringify(gradingColumns), columnOrder]  // Pass columnOrder as a proper array (no stringify)
    );

    const rubricId = rubricResult.rows[0].id;  // Fix: Get rubricId from the result

    // Step 3: Insert rows into the rubric_rows table
    for (const row of rubric) {
      const rowGradingValues = {};

      // Populate rowGradingValues based on user input and columns in order
      columns.forEach((column) => {
        const columnName = column.name;  // Keep column name as is (no .toLowerCase())
        rowGradingValues[columnName] = row[columnName] || '';  // Don't convert to lowercase
      });

      // Normalize weightage
      let weightage = row.weightage;
      if (typeof weightage === 'string' && weightage.includes('%')) {
        weightage = parseFloat(weightage.replace('%', '')) / 100;
      } else {
        weightage = parseFloat(weightage);
      }

      // Ensure criteria is a string
      let criteria = row.criteria;
      if (!criteria) {
        criteria = "Default Criteria";
      } else if (typeof criteria === 'object') {
        criteria = JSON.stringify(criteria);  
      }

      await client.query(
        'INSERT INTO rubric_rows (rubric_id, grading_values, weightage, criteria) VALUES ($1, $2, $3, $4)',
        [rubricId, JSON.stringify(rowGradingValues), weightage, criteria]  // Use rubricId here
      );
    }

    await client.query('COMMIT');  // Commit transaction

    res.status(200).json({ message: 'Rubric saved successfully' });
  } catch (error) {
    await client.query('ROLLBACK');  // Rollback on error
    console.error(error);
    res.status(500).json({ error: 'Failed to save rubric' });
  } finally {
    client.release();
  }
});


// Route to get all rubrics
app.get('/api/rubrics', async (req, res) => {
  try {
    const result = await pool.query('SELECT id AS rubric_id, rubric_title, date_created FROM rubric');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching rubrics:', error);
    res.status(500).json({ error: 'Failed to fetch rubrics' });
  }
});


app.get('/api/rubric/:rubricId', async (req, res) => {
  const { rubricId } = req.params;
  const client = await pool.connect();

  try {
    console.log(`Fetching rubric with ID: ${rubricId}`);

    // Fetch rubric details
    const rubricResult = await client.query('SELECT * FROM rubric WHERE id = $1', [rubricId]);

    if (rubricResult.rowCount === 0) {
      return res.status(404).json({ error: 'Rubric not found' });
    }

    const rubric = rubricResult.rows[0];

    // Safely parse grading_columns if it's a valid JSON string, else default to empty object
    let gradingColumns = {};
    try {
      gradingColumns = rubric.grading_columns && typeof rubric.grading_columns === 'string'
        ? JSON.parse(rubric.grading_columns)
        : {};
    } catch (err) {
      console.error('Error parsing grading_columns:', err);
      gradingColumns = {}; // fallback to empty object if parsing fails
    }

    // Fetch associated rubric rows and their weights
    const rowsResult = await client.query('SELECT * FROM rubric_rows WHERE rubric_id = $1', [rubricId]);

    const rows = rowsResult.rows.map(row => {
      let grading_values = {};
      try {
        // Safely parse grading_values if it's a valid JSON string
        grading_values = typeof row.grading_values === 'string' 
          ? JSON.parse(row.grading_values) 
          : row.grading_values || {}; // fallback to empty object if parsing fails
      } catch (err) {
        console.error('Error parsing grading_values:', err);
        grading_values = {}; // fallback to empty object
      }

      // Ensure each row has a valid weightage
      const weightage = parseFloat(row.weightage); // Ensure weightage is treated as a decimal
      if (isNaN(weightage)) {
        console.error(`Invalid weightage value for row with ID ${row.id}: ${row.weightage}`);
        return null;  // Skip rows with invalid weightage
      }

      return {
        ...row,
        grading_values,
        weightage, // Include weightage as a decimal value
      };
    }).filter(row => row !== null); // Filter out any rows with invalid weightage

    console.log('Rows fetched:', rows); // Debugging the fetched rows

    const columnOrder = rubric.column_order || []; // Retrieve column_order to preserve the correct order

    res.json({
      rubricTitle: rubric.rubric_title,
      gradingColumns,
      rows,
      columnOrder,  // Include column order in the response
    });

  } catch (error) {
    console.error('Error fetching rubric:', error);
    res.status(500).json({ error: 'Failed to fetch rubric' });
  } finally {
    client.release();
  }
});


//Update Rubric by ID
app.put('/api/rubric/:rubricId', async (req, res) => {
  const { rubricId } = req.params;
  const { rubricTitle, rubric, columns } = req.body;

  // Validate input
  if (!rubricTitle || !Array.isArray(rubric) || !Array.isArray(columns)) {
    return res.status(400).json({ error: 'Invalid data provided' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Start a transaction

    // Step 1: Update the column_order array
    const columnOrder = columns.map(column => column.name);

    // Step 2: Update the rubric table
    const gradingColumns = columns.reduce((acc, column) => {
      acc[column.name] = ''; 
      return acc;
    }, {});

    await client.query(
      'UPDATE rubric SET rubric_title = $1, grading_columns = $2, column_order = $3 WHERE id = $4',
      [rubricTitle, JSON.stringify(gradingColumns), columnOrder, rubricId]
    );

    // Step 3: Update rows in the rubric_rows table
    for (const row of rubric) {
      const rowGradingValues = {};

      columns.forEach(column => {
        const columnName = column.name;
        rowGradingValues[columnName] = row[columnName] || '';  
      });

      let weightage = row.weightage;
      if (typeof weightage === 'string' && weightage.includes('%')) {
        weightage = parseFloat(weightage.replace('%', '')) / 100;
      } else {
        weightage = parseFloat(weightage);
        if (isNaN(weightage)) {
          weightage = 0;  // Fallback if parsing fails
        }
      }

      let criteria = row.criteria;
      if (!criteria) {
        criteria = "Default Criteria";
      } else if (typeof criteria === 'object') {
        criteria = JSON.stringify(criteria);  
      }

      // Update or insert row if it doesn't already exist
      if (row.id) {
        // Update existing row
        await client.query(
          'UPDATE rubric_rows SET grading_values = $1, weightage = $2, criteria = $3 WHERE rubric_id = $4 AND id = $5',
          [JSON.stringify(rowGradingValues), weightage, criteria, rubricId, row.id]
        );
      } else {
        // Insert new row
        const result = await client.query(
          'INSERT INTO rubric_rows (rubric_id, grading_values, weightage, criteria) VALUES ($1, $2, $3, $4) RETURNING id',
          [rubricId, JSON.stringify(rowGradingValues), weightage, criteria]
        );
        row.id = result.rows[0].id; // Set the newly created row ID
      }
    }

    // Step 4: Remove deleted rows
    const existingRowIds = rubric.map(row => row.id);
    // Use string interpolation to safely join the row IDs in the DELETE query
    await client.query(
      `DELETE FROM rubric_rows WHERE rubric_id = $1 AND id NOT IN (${existingRowIds.join(',')})`,
      [rubricId]
    );

    await client.query('COMMIT');  // Commit transaction

    res.status(200).json({ message: 'Rubric updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');  // Rollback on error
    console.error(error);
    res.status(500).json({ error: 'Failed to update rubric' });
  } finally {
    client.release();
  }
});

//Delete Rubric
app.delete('/api/rubric/:id', async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');  // Start a transaction

    // Step 1: Delete rubric rows associated with the rubricId
    await client.query(
      'DELETE FROM rubric_rows WHERE rubric_id = $1',
      [id]
    );

    // Step 2: Delete the rubric itself
    await client.query(
      'DELETE FROM rubric WHERE id = $1',
      [id]
    );

    await client.query('COMMIT');  // Commit transaction

    res.status(200).json({ message: 'Rubric deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');  // Rollback on error
    console.error(error);
    res.status(500).json({ error: 'Failed to delete rubric' });
  } finally {
    client.release();
  }
});

const generateFeedback = async (question, responses, selectedRubric) => {
  try {
    // Prepare the responses text to be included in the prompt
    const responsesText = responses.map(response => {
      if (response.sender && response.text) {
        return `${response.sender}: ${response.text}`;
      } else {
        console.error('Invalid response format:', response);
        return '';  // Skip invalid responses
      }
    }).join('\n');

    // Format the rubric into a readable text string (if it's an object or array)
    let formattedRubric;
    
    // If it's an object, stringify it; if it's already an array, we can process differently
    if (Array.isArray(selectedRubric)) {
      formattedRubric = selectedRubric.map(item => {
        return `${item.name}: Max Score = ${item.maxScore}, Weight = ${item.weight}`;
      }).join('\n');
    } else {
      formattedRubric = JSON.stringify(selectedRubric, null, 2); // Convert to formatted string for readability
    }

    const prompt = `
    You are a grading assistant. Evaluate the following student responses based on the provided rubric:
    Instead of saying the student say "You" or "You are" to describe the student.

    **Question:**
    "${question}"

    **Student Responses:**
    ${responsesText}

    **Grading Rubric:**
    ${formattedRubric}

    **Important Instructions for Feedback:**
    1. **General Feedback Guidelines:**
        - Your feedback should focus on the overall quality of the student’s responses.
        - Avoid including any grade-related or score-based information in the feedback.
        - Provide constructive, supportive, and encouraging feedback to help the student understand how they can improve.
        - Focus on the strengths of the response and highlight areas where the student can enhance their answer.
        - Address the overall completeness and relevance of the response in relation to the rubric criteria.
        - Use "You" or "You are" to directly address the student.

    2. **Relating to the Rubric:**
        - Evaluate the student's responses based on the criteria provided in the rubric (${formattedRubric}).
        - Consider aspects such as clarity, depth, structure, relevance, engagement, and language use, as defined in the rubric.
        - If the response lacks sufficient detail, structure, or engagement, provide suggestions for improvement.
        - Ensure the feedback aligns with the rubric's expectations, emphasizing areas where the student can enhance their performance.

    3. **Suggestions for Improvement:**
        - Your feedback should provide general suggestions based on the rubric criteria but **not break down each rubric criterion individually**.
        - If the rubric highlights the need for more depth or detail, encourage the student to expand their answers with examples or further elaboration.
        - If the response lacked organization or clarity, suggest improving the structure by providing a clearer introduction, body, and conclusion.
        - If the student’s answer was too short or lacked coverage, recommend elaborating on their points and explaining them more thoroughly to meet the expectations set in the rubric.
        - If the response was too broad or unfocused, advise the student to focus more on specific details and ensure they remain on-topic throughout their answer.

    4. **Tone of Feedback:**
        - Your tone should be positive, supportive, and constructive.
        - Highlight both strengths and weaknesses in a balanced and respectful way, making sure your feedback is **encouraging** and **motivating**.
        - Use specific language to guide the student toward improving while acknowledging their efforts.
        - Your feedback should inspire the student to take actionable steps toward improving their responses in future assessments.

    5. **Example Feedback:**
        - "You have made a good attempt by addressing the key points of the question, but your response could benefit from more specific examples to support your ideas. The structure of your answer could also be improved by making sure there is a clear introduction and conclusion to wrap up your thoughts."
        - "You’ve demonstrated a solid understanding of the topic, but the response lacks some depth. Consider expanding on your points by providing more detailed examples and explanations to strengthen your answer."
        - "Your response shows an understanding of the topic but lacks sufficient detail. Try to elaborate more on your ideas, and structure your answer more clearly to provide a more comprehensive response."
        - "Your response is concise but misses key aspects of the question. Try to expand on your points and ensure that your answer addresses all the main parts of the question more thoroughly."

    **Feedback Format:**
    - Provide your feedback in a concise and positive manner.
    - Ensure the feedback is specific to the rubric’s criteria but delivered in a **holistic** and **supportive** manner, without referencing specific scores.
    - Focus on improvement and offer actionable advice for the student to better align their responses with the rubric's expectations.

    **Note**: If no valid response is provided or if the response is insufficient, please give "NIL" in place of feedback.
`;



    // Use OpenAI's GPT-4-o-mini model to generate feedback
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use GPT-4 model (or mini if necessary)
      messages: [
        { role: 'system', content: 'You are a grading assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500, // Adjust for feedback length
    });

    // Process and return the AI response
    const aiResponse = completion.choices[0].message.content.trim();
    return aiResponse;

  } catch (error) {
    console.error('Error generating feedback:', error); // Log any error that occurs
    return 'Error generating feedback.';
  }
};

// Express route to handle feedback generation without rubric
app.post('/generate-feedback', async (req, res) => {
  const { question, responses, selectedRubric } = req.body;

  if (!question || !responses || !selectedRubric) {
    return res.status(400).json({ error: 'Question, responses, and rubric are required' });
  }

  try {
    const feedback = await generateFeedback(question, responses, selectedRubric);
    res.status(200).json({ feedback });
  } catch (error) {
    console.error('Error generating feedback:', error);
    res.status(500).json({ error: 'Failed to generate feedback' });
  }
});

const generateGrade = async (question, responses, selectedRubric) => {
  let validGrade = false;  // Flag to track if we have received a valid grade
  let retryCount = 0;  // Counter for the number of retries

  while (!validGrade) {
    try {
      // Increment the retry counter every time we make an attempt
      retryCount++;

      // Log the rubric to check its structure
      console.log('Received Rubric:', selectedRubric);

      // Prepare the responses text to be included in the prompt
      const responsesText = responses.map(response => {
        if (response.sender && response.text) {
          return `${response.sender}: ${response.text}`;
        } else {
          console.error('Invalid response format:', response);
          return '';  // Skip invalid responses
        }
      }).join('\n');

      // Format the rubric into a readable text string (if it's an object or array)
      let formattedRubric;
      
      // If it's an object, stringify it; if it's already an array, we can process differently
      if (Array.isArray(selectedRubric)) {
        formattedRubric = selectedRubric.map(item => {
          return `${item.name}: Max Score = ${item.maxScore}, Weight = ${item.weight}`;
        }).join('\n');
      } else {
        formattedRubric = JSON.stringify(selectedRubric, null, 2); // Convert to formatted string for readability
      }

      // Construct the prompt to send to GPT
      const prompt = `
    You are a grading assistant, tasked with evaluating student responses based on a provided rubric. Please ensure that your evaluation is as accurate, consistent, and fair as possible. Use the following instructions to grade the responses:

    **Question:**
    "${question}"

    **Student Responses:**
    ${responsesText}

    **Grading Rubric:**
    ${formattedRubric}

    **Important Instructions for Grading:**
    1. **General Guidelines:**
        - Your goal is to assign a grade based on the provided rubric for each student's response.
        - Carefully read through the entire rubric, as it defines the specific criteria for grading.
        - Ensure that each criterion is considered independently, and grade it based on the student's response to the specific aspect outlined in the rubric.
        - Be strict about grading—if a response is not detailed enough or if it lacks any relevant content, it should not receive points for that criterion.
        - If a student does not provide a response to a specific criterion or if the response is completely irrelevant, assign it a score of **0** for that criterion.
        - If the response is incomplete or ambiguous, treat it as insufficient and score it lower or as **0** as per your judgment.
    
    2. **Detailed Instructions for Scoring:**
        - For each rubric item, evaluate the response and determine if it meets the expectations described in the rubric.
        - If the response is completely missing, score **0** for that criterion.
        - If the response is present but very minimal or lacks depth (e.g., one or two words without clear relevance or explanation), score **0** for that criterion or assign a very low score based on how minimal the response is.
        - If the response is present but only partially addresses the question or rubric criterion, assign a partial score reflecting the level of detail provided. Be sure to weigh partial responses fairly based on their contribution to the full answer.
        - If the response is clear, thorough, and fully addresses the rubric criterion, assign the full score possible for that criterion.
        - If the response provides more than expected, consider it positively but avoid giving excessive credit unless explicitly stated in the rubric.
    
    3. **Weighting and Calculation of Scores:**
        - Each rubric criterion has a maximum score and a weight. For each rubric item:
            - Divide the actual score assigned to the response by the maximum score for that criterion.
            - Multiply the result by the weight of that criterion, which is specified in the rubric.
            - Round the weighted score to **two decimal places**.
        - Once all rubric items have been graded, **sum the weighted scores** for each criterion to obtain the **total grade**.
    
    4. **Final Grade Calculation:**
        - The total grade should be calculated as a percentage, where the total weighted score is divided by the total possible weighted score (the sum of the maximum possible weighted scores for each rubric criterion).
        - The grade should be expressed as a percentage (e.g., 85%, 92.5%).
        - In cases where there are no responses or responses that do not meet the minimum standards (e.g., empty answers, one-word responses), assign a grade of **0%**.

    5. **Handling Special Cases:**
        - **No response**: If the student has provided no response to the question, mark all applicable rubric criteria as 0 and assign a **total grade of 0%**.
        - **Irrelevant response**: If the response is completely off-topic or does not address the question in any meaningful way, treat it as a lack of response and assign **0** for the criterion.
        - **Partial responses**: For responses that only partially address the question, grade them based on the depth and relevance of the content provided. Score **0** if the response is inadequate.
        - **Overly brief responses**: Responses that are extremely brief (e.g., one-word answers) or lack any supporting explanation should not be awarded full points. If the response does not address the rubric criterion properly, assign a **0**.
        - **Excessive or irrelevant content**: If the response contains irrelevant information, assign a lower score based on the relevance of the content to the rubric.
        
        6. **Consistency and Objectivity:**
        - Ensure that grading is **consistent** and based solely on the rubric criteria. Avoid subjective interpretations.
        - Be objective in your evaluation. If the response meets the criterion as described, assign the corresponding score.
        - In case of doubt or ambiguity, default to a lower score rather than overestimating the student's response.

    **Final Output:**
    - Once all rubric criteria have been scored, calculate the total grade by summing the weighted scores for each criterion.
    - Return the final grade as a percentage in the following format: "Total Grade: <score>%". For example, "Total Grade: 85%".
    - If the student has not responded adequately, return "Total Grade: 0%".

    Ensure that your grading follows the instructions strictly to guarantee fairness and consistency in evaluating all responses. 

**Example Output Format:**
    - "Total Grade: 92.5%"
    - "Total Grade: 0%" (if no valid response)
`;
      // Send the prompt to GPT
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',  // Use GPT-4 model (or mini if necessary)
        messages: [
          { role: 'system', content: 'You are a grading assistant.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000  // Increase this to avoid response cutoff
      });

      // Get the AI's response
      const aiResponse = completion.choices[0].message.content;

      // Log the full AI response to debug
      console.log('AI Response:', aiResponse); 

      // Use regex to extract the grade in the expected format "Total Grade: <score>%"
      const totalGradeMatch = aiResponse.trim().match(/Total Grade:\s*(\d+)%/);

      // Check if the grade was extracted successfully
      if (totalGradeMatch) {
        const totalScore = totalGradeMatch[1];  // Extracted score
        validGrade = true;  // Successfully got the grade, exit loop
        console.log(`Successfully generated grade after ${retryCount} attempts.`);
        return `${totalScore}%`;  // Return the grade as a percentage
      } else {
        // Continue retrying if the response format is invalid
        console.error(`Invalid response format. Attempt number: ${retryCount}`);
      }
    } catch (error) {
      // Log the error and continue retrying
      console.error(`Error generating grade on attempt ${retryCount}:`, error);
    }
  }
};





app.post('/generate-grade', async (req, res) => {
  try {
    const { rubric, question, responses } = req.body;

    // Log to check if the rubric is passed correctly
    console.log('Received Question:', question);
    console.log('Received Responses:', responses);
    console.log('Received Rubric:', rubric);

    // Pass the rubric, question, and responses to generateGrade
    const grade = await generateGrade(question, responses, rubric);  
    res.send({ grade });  // Send the generated grade back as a response
  } catch (error) {
    console.error('Error processing grade generation:', error);
    res.status(500).send('Error generating grade.');
  }
  if (breakdownMatches) {
    console.log('Grading Breakdown:');
    breakdownMatches.forEach(detail => console.log(detail));
} else {
    console.error('No grading breakdown found in AI response.');
}
});

// Create a route to handle both feedback and grade generation
app.post('/generate-feedback-and-grade', async (req, res) => {
  const { question, responses, selectedRubric } = req.body;

  if (!question || !responses || !selectedRubric) {
    return res.status(400).json({ error: 'Question, responses, and rubric are required' });
  }

  try {
    // Call both functions simultaneously
    const [feedback, grade] = await Promise.all([
      generateFeedback(question, responses, selectedRubric),
      generateGrade(question, responses, selectedRubric)
    ]);

    // Send the feedback and grade back in the response
    res.status(200).json({ feedback, grade });
  } catch (error) {
    console.error('Error generating feedback and grade:', error);
    res.status(500).json({ error: 'Failed to generate feedback and grade' });
  }
});

// Endpoint to save feedback and grade
app.post('/save-feedback', async (req, res) => {
  const { userId, username, topicId, grade, feedback } = req.body;
 
  try {
    if (!userId || !username || !topicId || !grade || !feedback) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
 
    let actualUsername = username;
    if (username.includes('@')) {
      const result = await pool.query('SELECT username FROM users WHERE email = $1', [username]);
      if (result.rows.length > 0) {
        actualUsername = result.rows[0].username;
      } else {
        return res.status(404).json({ error: 'Email not found in the database' });
      }
    }
 
    const attemptResult = await pool.query(
      `SELECT MAX(attempt_count) AS max_attempts
       FROM assessment_sessions
       WHERE user_id = $1 AND topic_id = $2`,
      [userId, topicId]
    );
 
    const currentAttempts = attemptResult.rows[0]?.max_attempts || 0;
 
    await pool.query(
      `INSERT INTO feedback (user_id, username, topic_id, grade, feedback_text, attempt_count, teacher_username)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, actualUsername, topicId, grade, feedback, currentAttempts, 'AI']
    );
 
    res.status(200).json({ success: 'Feedback saved successfully', attempt_count: currentAttempts });
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/get-user-id-by-email', async (req, res) => {
  const { email } = req.query;
  try {
    // Use pool.query instead of app.query
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      res.json({ user_id: result.rows[0].id });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to get average time_elapsed
app.get('/average-time', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT AVG(COALESCE(CAST("time_elapsed" AS numeric), 0)) AS average_time
      FROM "assessment_sessions";
    `);
    res.json({ averageTime: result.rows[0].average_time }); // Sends back the average time
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.get('/flag_attempts', async (req, res) => {
  const { username, topicId } = req.query;

  try {
    const client = await pool.connect();

    // Fetch attempts data based on the provided username and topicId
    const attemptsResult = await client.query(
      `SELECT user_id, attempt_count, datetime
       FROM assessment_sessions 
       WHERE username = $1 AND topic_id = $2 
       ORDER BY attempt_count ASC`,
      [username, topicId]
    );

    // Check if any attempts are found
    if (attemptsResult.rows.length === 0) {
      return res.status(404).send({ error: 'No attempts found for this user and topic' });
    }

    // Return the fetched attempts to the frontend
    res.status(200).send({ attempts: attemptsResult.rows });
    client.release();
  } catch (error) {
    console.error('Error fetching flaggable attempts:', error);
    res.status(500).send({ error: 'Failed to fetch flaggable attempts.' });
  }
});


// Listening on port 5000
app.listen(5000, () => {
  console.log('Server is running on port 5000');
});

