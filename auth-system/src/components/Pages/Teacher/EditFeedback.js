import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const EditFeedback = () => {
  const { username, topicId, attempt_count } = useParams(); // Fetch params
  const [feedback_text, setFeedback] = useState('');
  const [grade, setGrade] = useState(''); // New state for grade
  const [attemptDetails, setAttemptDetails] = useState(null); // To store attempt details
  const navigate = useNavigate();

  // Fetch attempt details and feedback when the page loads
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        // Fetch attempt details
        const attemptResponse = await axios.post('http://localhost:5000/get_attempt_details', {
          username,
          topicId,
          attempt_count,
        });
        setAttemptDetails(attemptResponse.data);

        // Fetch existing feedback
        const feedbackResponse = await axios.post('http://localhost:5000/feedbacks/details', {
          username,
          topicId,
          attempt_count,
        });

        setFeedback(feedbackResponse.data.feedback_text); // Assuming 'feedback_text' contains the feedback
        setGrade(feedbackResponse.data.grade); // Assuming 'grade' is included in the response data
      } catch (error) {
        console.error('Error fetching details or feedback:', error);
      }
    };

    fetchDetails();
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

  const handleUpdate = async (e) => {
    e.preventDefault();

    const teacherUsername = JSON.parse(localStorage.getItem('user'))?.username; // Get teacher username

    if (!teacherUsername) {
      console.error('No teacher username found!');
      return;
    }

    try {
      // Log data to confirm it's correct
      console.log({
        username,
        teacher_username: teacherUsername,
        topicId,
        attempt_count,
        feedback_text,
        grade, // Include the grade in the update
      });

      // Send updated feedback to the backend
      await axios.put('http://localhost:5000/feedbacks/update', {
        username,
        teacher_username: teacherUsername,
        topicId,
        attempt_count,
        feedback_text,
        grade, // Send the grade as part of the update
      });

      navigate(`/attempts/${username}/${topicId}`);
    } catch (error) {
      console.error('Error updating feedback:', error);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card shadow-lg border-light">
            <div className="card-body">
              <h2 className="text-center mb-4 text-primary">Edit Feedback for Attempt #{attempt_count}</h2>
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
                  <form onSubmit={handleUpdate}>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="feedbackTextarea">Feedback:</label>
                      <textarea
                        id="feedbackTextarea"
                        className="form-control"
                        value={feedback_text}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows="4"
                        required
                      ></textarea>
                    </div>

                    {/* Grade Input */}
                    <div className="mb-3">
                      <label className="form-label" htmlFor="gradeInput">Grade:</label>
                      <input
                        type="text"
                        id="gradeInput"
                        className="form-control"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        required
                      />
                    </div>

                    <button type="submit" className="btn btn-primary w-100">Update Feedback</button>
                  </form>
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
    </div>
  );
};

export default EditFeedback;
