import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const CreateFeedback = () => {
  const { username, topicId, attempt_count } = useParams(); // Fetch params
  const [feedback, setFeedback] = useState(''); // User feedback
  const [generatedFeedback, setGeneratedFeedback] = useState(''); // To store AI-generated feedback
  const [attemptDetails, setAttemptDetails] = useState(null); // To store attempt details
  const [rubricText, setRubricText] = useState(''); // To store rubric text
  const [questionText, setQuestionText] = useState(''); // To store the generated question
  const navigate = useNavigate();

  // Fetch attempt details when the page loads
  useEffect(() => {
    const fetchAttemptDetails = async () => {
      try {
        // Fetch attempt details from the backend
        const response = await axios.post('http://localhost:5000/get_attempt_details', {
          username,
          topicId,
          attempt_count,
        });
        setAttemptDetails(response.data);

        // Fetch rubric text (assumed available from the backend)
        const rubricResponse = await axios.get('http://localhost:5000/rubrics');
        setRubricText(rubricResponse.data[0]?.rubric_text); // Use the first rubric, or customize as needed

        // Set the generated question
        setQuestionText(response.data?.question);
      } catch (error) {
        console.error('Error fetching attempt details:', error);
      }
    };

    fetchAttemptDetails();
  }, [username, topicId, attempt_count]);

  // Handle the form submission to store feedback
  const handleCreate = async (e) => {
    e.preventDefault();

    const teacherUsername = JSON.parse(localStorage.getItem('user'))?.username; // Get teacher's username from localStorage

    if (!teacherUsername) {
      console.error('No teacher username found!');
      return;
    }

    try {
      // Combine manual feedback with AI-generated feedback
      const finalFeedback = feedback || generatedFeedback; // Use manual feedback if provided, otherwise AI-generated

      // Send feedback data to the backend to save it
      await axios.post('http://localhost:5000/feedbacks', {
        username,             // Student's username
        teacher_username: teacherUsername,  // Teacher's username
        topicId,
        attempt_count,
        feedback: finalFeedback, // Save the final feedback
      });

      // Redirect back to attempts page
      navigate(`/attempts/${username}/${topicId}`);
    } catch (error) {
      console.error('Error creating feedback:', error);
    }
  };

  // Generate AI feedback based on rubric text, question, and responses
  const handleGenerateFeedback = async () => {
    try {
      const response = await axios.post('http://localhost:5000/generate-feedback', {
        rubric: rubricText, // Send rubric text for feedback generation
        question: questionText, // Send the question
        responses: attemptDetails?.responses || [], // Send student responses
      });

      // Update the AI-generated feedback in state
      setGeneratedFeedback(response.data.feedback);
    } catch (error) {
      console.error('Error generating feedback:', error);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card shadow-lg border-light">
            <div className="card-body">
              <h2 className="text-center mb-4 text-primary">Create Feedback for Attempt #{attempt_count}</h2>
              <div className="row">
                {/* Left Side: Attempt Details */}
                <div className="col-md-6">
                  {attemptDetails ? (
                    <>
                      <div className="mb-4">
                        <h5 className="text-info">Generated Question:</h5>
                        <p>{attemptDetails.question}</p>
                      </div>
                      <div className="mb-4">
                        <h5 className="text-info">Responses:</h5>
                        <ul className="list-group">
                          {attemptDetails.responses.map((response, index) => (
                            <li key={index} className="list-group-item">
                              <strong>{response.sender}:</strong> {response.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted">Loading attempt details...</p>
                  )}
                </div>

                {/* Right Side: Feedback Form */}
                <div className="col-md-6">
                  <form onSubmit={handleCreate}>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="feedbackTextarea">Feedback:</label>
                      <textarea
                        id="feedbackTextarea"
                        className="form-control"
                        value={feedback || generatedFeedback} // Show either manually entered or AI-generated feedback
                        onChange={(e) => setFeedback(e.target.value)} // Allow user to update feedback
                        rows="4"
                        required
                      ></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary w-100">Submit Feedback</button>
                  </form>

                  {/* Button to Generate AI Feedback */}
                  <button
                    className="btn btn-info w-100 mt-3"
                    onClick={handleGenerateFeedback} // Generate feedback on click
                  >
                    Generate AI Feedback
                  </button>
                </div>
              </div>
              {/* Back button to go to the previous page */}
              <button
                className="btn btn-secondary w-100 mt-3"
                onClick={() => navigate(-1)} // Navigate back to the previous page
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateFeedback;
