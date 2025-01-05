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
  const { topicname, difficulty, description, teacher_username, questions, classes } = req.body;
  const videoUrl = req.file ? req.file.path : null;
  const currentDate = new Date().toISOString();

  try {
    // Ensure that the 'classes' field is passed as an array.
    const classesArray = classes ? (Array.isArray(classes) ? classes : [classes]) : [];

    // Convert questions into an array if it's not already
    const questionsArray = questions ? (Array.isArray(questions) ? questions : [questions]) : null;

    const topicResult = await pool.query(
      'INSERT INTO topic (topicname, difficulty, description, teacher_username, video_url, datecreated, questions, classes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      [topicname, difficulty, description, teacher_username, videoUrl, currentDate, questionsArray, classesArray]
    );

    res.status(201).json({ message: 'Topic created successfully with questions and classes' });
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
  const { topicname, difficulty, description, teacher_username, questions, selectedClasses } = req.body;
  const videoUrl = req.file ? req.file.path : req.body.videoUrl || null;
  const currentDate = new Date().toISOString();
  const topicId = req.params.id;

  try {
    // Ensure selectedClasses is an array (no need for JSON.parse if it's already an array)
    const classesArray = Array.isArray(selectedClasses) ? selectedClasses : [];

    // Convert questions into an array if it's not already
    const questionsArray = questions ? (Array.isArray(questions) ? questions : [questions]) : null;

    const topicResult = await pool.query(
      'UPDATE topic SET topicname = $1, difficulty = $2, description = $3, teacher_username = $4, video_url = $5, datecreated = $6, questions = $7, classes = $8 WHERE id = $9',
      [topicname, difficulty, description, teacher_username, videoUrl, currentDate, questionsArray, classesArray, topicId]
    );

    res.status(200).json({ message: 'Topic updated successfully with questions and classes' });
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

// CRUD for Feedback

app.post('/feedbacks', async (req, res) => {
  const { username, teacher_username, topicId, attempt_count, feedback, grade, user_id } = req.body;

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
  const { username, topicId, attempt_count, feedback_text, grade } = req.body;

  if (!username || !topicId || !attempt_count || !feedback_text || !grade) {
    return res.status(400).send('All fields are required');
  }

  try {
    await pool.query(
      `UPDATE feedback 
       SET feedback_text = $1, grade = $2 
       WHERE username = $3 AND topic_id = $4 AND attempt_count = $5`,
      [feedback_text, grade, username, topicId, attempt_count]
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



const generateFeedback = async (rubricId, question, responses) => {
  try {
    // Fetch the rubric from the database using the rubricId
    const result = await pool.query('SELECT components FROM rubrics WHERE id = $1', [rubricId]);

    if (result.rows.length === 0) {
      throw new Error('Rubric not found'); // If no rubric is found with the given ID
    }

    const rubric = result.rows[0].components;
    console.log('Rubric:', rubric); // Log the entire rubric to inspect its structure

    // Ensure the fetched rubric is an array
    if (!rubric || !Array.isArray(rubric)) {
      throw new Error('Rubric components are not in the expected array format.');
    }

    // Log the rubric components to make sure they are correctly retrieved
    rubric.forEach((component, index) => {
      console.log(`Component ${index + 1}:`, component);
    });

    // Extract necessary details (grade, component, description) from each rubric component
    const criteria = rubric.map(component => ({
      grade: component.grade,          // The grade assigned for the component
      component: component.component,  // The name of the component (e.g., 'Pronunciation')
      description: component.description, // Description of the component (e.g., 'Clear and accurate pronunciation')
    }));

    console.log('Criteria:', criteria); // Log the criteria to check its structure

    // Use the 'grade' field to calculate maximum scores
    const maxScores = criteria.map(c => c.grade);

    // Prepare the responses text to be included in the prompt
    const responsesText = responses.map(response => `${response.sender}: ${response.text}`).join('\n');

    // Construct a detailed prompt for GPT-4
    const prompt = `
  You are a grading assistant. Evaluate the following student responses based on the rubric provided below:
  
  Question: "${question}"
  
  Responses:
  ${responsesText}
  
  The rubric for evaluation is as follows:
  ${JSON.stringify(criteria)}
  
 Instructions:
1. Evaluate the student's responses for each component listed in the rubric.
2. For each component, provide qualitative feedback:
   - Assess how well the student's response meets the expectations described in the rubric.
   - Highlight the strengths and weaknesses of the response with respect to the rubric component.
   - Suggest areas for improvement where applicable, based on the rubric's criteria.

Please do not include any scores. The focus should be on providing detailed, constructive feedback for each component.
    `;


    // Use OpenAI to generate feedback
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use GPT-4 model
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



// Express route to handle feedback generation
app.post('/generate-feedback', async (req, res) => {
  const { rubricId, question, responses } = req.body; // Expecting rubricId in the request body
  if (!rubricId) {
    return res.status(400).json({ error: 'Rubric ID is required' });
  }

  try {
    const feedback = await generateFeedback(rubricId, question, responses); // Pass rubricId instead of the full rubric
    res.status(200).json({ feedback });
  } catch (error) {
    console.error('Error generating feedback:', error);
    res.status(500).json({ error: 'Failed to generate feedback' });
  }
});


const generateGrade = async (rubricId, question, responses) => {
  try {
    // Fetch the rubric from the database using the rubricId
    const result = await pool.query('SELECT components FROM rubrics WHERE id = $1', [rubricId]);

    if (result.rows.length === 0) {
      throw new Error('Rubric not found'); // If no rubric is found with the given ID
    }

    const rubric = result.rows[0].components;

    // Ensure the fetched rubric is an array
    if (!rubric || !Array.isArray(rubric)) {
      throw new Error('Rubric components are not in the expected array format.');
    }

    // Calculate the maximum possible score (sum of max grade of each rubric component)
    const maxScore = rubric.reduce((sum, component) => sum + Number(component.grade), 0);

    // Log rubric and max score for debugging
    console.log('Rubric:', JSON.stringify(rubric, null, 2));
    console.log('Max Score:', maxScore);

    // Prepare the rubric components for grading
    const criteria = rubric.map(component => ({
      grade: Number(component.grade), // Convert grade to number
      component: component.component, // Component name (e.g., 'Pronunciation')
      description: component.description, // Description (e.g., 'Clear and accurate pronunciation')
    }));

    // Log each rubric component's details
    criteria.forEach(component => {
      console.log(`Component: ${component.component}`);
      console.log(`Grade: ${component.grade}`);
      console.log(`Description: ${component.description}`);
      console.log('------------------------');
    });

    // Prepare the responses text to be included in the prompt
    const responsesText = responses.map(response => `${response.sender}: ${response.text}`).join('\n');

    // Construct a detailed prompt for GPT-4 to generate a grade based on responses and rubric
    const prompt = `
      You are a grading assistant. Evaluate the following student responses based on the rubric provided below:

      Question: "${question}"

      Responses:
      ${responsesText}

      The rubric for evaluation is as follows:
      ${JSON.stringify(criteria)}

      The total possible score is ${maxScore}.

 **Important Instructions for Grading:**
      - Please grade each component strictly according to the rubric. The total grade should be based on the sum of the individual rubric components.
      - A higher score should reflect a better and more detailed response, while a lower score should reflect a less complete or less relevant answer.
      - Grades should **not exceed the maximum possible score** as defined in the rubric. Do not inflate the grades or give bonus points. If the rubric defines a maximum score for a component, the total score should reflect that.
      - Be **strict in grading**. Only give the full grade for a component if the student's answer fully meets the expectations set in the rubric. Partial credit should only be given when warranted, and scores should **not be generous**.
      - The total grade should be **exactly the sum of the individual component grades** based on the rubric. Ensure that the total grade does **not exceed ${maxScore}**.
      Please provide the total grade in the format: "Total Grade: score/${maxScore}".
    `;

    // Use OpenAI to generate the grade
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use GPT-4 model
      messages: [
        { role: 'system', content: 'You are a grading assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500, // Adjust for grade output length
    });

    // Process and return the AI response (total grade)
    const aiResponse = completion.choices[0].message.content.trim();

    // Now, parse the response correctly to extract the total grade and max grade
    const totalGradeMatch = aiResponse.match(/Total Grade: (\d+)\/(\d+)/);

    if (totalGradeMatch) {
      const totalScore = totalGradeMatch[1];
      const maxScore = totalGradeMatch[2];

      // Log the total grade and max score
      console.log('Total Grade:', totalScore);
      console.log('Max Score:', maxScore);

      // Return the total score and max score in the desired format
      return `${totalScore}/${maxScore}`;
    } else {
      throw new Error('Invalid response format from GPT-4');
    }

  } catch (error) {
    console.error('Error generating grade:', error); // Log any error that occurs
    return 'Error generating grade.';
  }
};




app.post('/generate-grade', async (req, res) => {
  try {
    const { rubricId, question, responses } = req.body;

    // Generate grade using AI-based grading function
    const grade = await generateGrade(rubricId, question, responses);

    res.json({ grade });
  } catch (error) {
    console.error('Error generating grade:', error);
    res.status(500).json({ error: 'Failed to generate grade' });
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


// Chat Logs
app.post('/end_session', async (req, res) => {
  const { email, topicId, generatedQuestion, responses, datetime } = req.body;

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

    // Insert the session with incremented attempt count, user_id, and username
    await client.query(
      `INSERT INTO assessment_sessions (user_id, username, topic_id, question, responses, datetime, attempt_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, username, topicId, generatedQuestion, JSON.stringify(responses), datetime, currentAttempts + 1]
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

// Save or Update Rubric (POST for create, PUT for update)
app.post('/save-rubric', async (req, res) => {
  const { rubric, rubricId } = req.body;

  try {
    if (rubricId) {
      // Update existing rubric
      const result = await pool.query(
        'UPDATE rubrics SET rubric_text = $1 WHERE id = $2 RETURNING *',
        [rubric, rubricId]
      );

      if (result.rowCount > 0) {
        res.status(200).json({ message: 'Rubric updated successfully', rubric: result.rows[0] });
      } else {
        res.status(404).json({ message: 'Rubric not found' });
      }
    } else {
      // Insert new rubric
      const result = await pool.query(
        'INSERT INTO rubrics (rubric_text) VALUES ($1) RETURNING *',
        [rubric]
      );
      res.status(200).json({ message: 'Rubric saved successfully', rubric: result.rows[0] });
    }
  } catch (error) {
    console.error('Error saving rubric:', error);
    res.status(500).json({ error: 'Failed to save rubric' });
  }
});

// Fetch Rubrics
app.get('/rubrics', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rubrics');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching rubrics:', error);
    res.status(500).json({ error: 'Failed to fetch rubrics' });
  }
});

// Add the PUT route for updating rubrics
app.put('/save-rubric', async (req, res) => {
  const { rubric, rubricId } = req.body;

  try {
    if (!rubricId) {
      return res.status(400).json({ error: 'Rubric ID is required to update' });
    }

    const result = await pool.query(
      'UPDATE rubrics SET rubric_text = $1 WHERE id = $2 RETURNING *',
      [rubric, rubricId]
    );

    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Rubric updated successfully', rubric: result.rows[0] });
    } else {
      res.status(404).json({ message: 'Rubric not found' });
    }
  } catch (error) {
    console.error('Error updating rubric:', error);
    res.status(500).json({ error: 'Failed to update rubric' });
  }
});

// DELETE Route
app.delete('/delete-rubric/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM rubrics WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Rubric not found' });
    }

    res.status(200).json({ message: 'Rubric deleted successfully', rubric: result.rows[0] });
  } catch (error) {
    console.error('Error deleting rubric:', error);
    res.status(500).json({ message: 'Internal Server Error' });
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
      'SELECT id, class_name, teacher_username, students FROM classes WHERE teacher_username = $1',
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
    let gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };

    // Instead of summing attempt counts, count the number of records for totalAttempts
    const totalAttempts = individualGrades.length; // Count the number of grades, not sum attempts

    individualGrades.forEach((gradeData) => {
      const grade = Number(gradeData.grade);

      // Add the grade to totalPoints (no multiplication with attempt_count)
      totalPoints += grade;

      // Calculate grade distribution once for each grade
      if (grade >= 36) gradeDistribution.A++;
      else if (grade >= 31) gradeDistribution.B++;
      else if (grade >= 26) gradeDistribution.C++;
      else if (grade >= 21) gradeDistribution.D++;
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
  if (grade >= 36) return 'A';
  if (grade >= 31) return 'B';
  if (grade >= 26) return 'C';
  if (grade >= 21) return 'D';
  return 'F';
}
// Listening on port 5000
app.listen(5000, () => {
  console.log('Server is running on port 5000');
});

