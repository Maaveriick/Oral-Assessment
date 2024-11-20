import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const CreateFeedback = () => {
  const { username, topicId, attempt_count } = useParams(); // Fetch params
  const [feedback, setFeedback] = useState('');
  const [attemptDetails, setAttemptDetails] = useState(null); // To store attempt details
  const navigate = useNavigate();

  // Fetch attempt details when the page loads
  useEffect(() => {
    const fetchAttemptDetails = async () => {
      try {
        const response = await axios.post('http://localhost:5000/get_attempt_details', {
          username,
          topicId,
          attempt_count,
        });
        setAttemptDetails(response.data);
      } catch (error) {
        console.error('Error fetching attempt details:', error);
      }
    };

    fetchAttemptDetails();
  }, [username, topicId, attempt_count]);

  // Log the logged-in user details to the console
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user')); // Retrieve user data from localStorage
    if (user) {
      console.log('Logged in as:', user.username); // Log the logged-in user's username to the console
    } else {
      console.log('No user logged in');
    }
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();

    const teacherUsername = JSON.parse(localStorage.getItem('user'))?.username; // Get the teacher's username from localStorage

    if (!teacherUsername) {
      console.error('No teacher username found!');
      return;
    }

    try {
      // Send the feedback data to the backend along with the teacher username
      await axios.post('http://localhost:5000/feedbacks', {
        username,            // Include the student username
        teacher_username: teacherUsername,  // Include the teacher's username
        topicId,
        attempt_count,
        feedback,
      });
      navigate(`/attempts/${username}/${topicId}`);
    } catch (error) {
      console.error('Error creating feedback:', error);
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
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows="4"
                        required
                      ></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary w-100">Submit Feedback</button>
                  </form>
                </div>
              </div>
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
