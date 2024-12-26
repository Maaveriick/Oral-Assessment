import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const StudentViewFeedback = () => {
  const { username, topicId, attempt_count } = useParams(); // Fetch params
  const [feedbackDetails, setFeedbackDetails] = useState(null); // To store feedback details
  const [attemptDetails, setAttemptDetails] = useState(null); // To store attempt details
  const navigate = useNavigate();

  // Fetch feedback details and attempt details when the page loads
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        // Fetch feedback details (including grade)
        const feedbackResponse = await axios.post('http://localhost:5000/feedbacks/details', {
          username,
          topicId,
          attempt_count,
        });
        setFeedbackDetails(feedbackResponse.data);

        // Fetch attempt details
        const attemptResponse = await axios.post('http://localhost:5000/get_attempt_details', {
          username,
          topicId,
          attempt_count,
        });
        setAttemptDetails(attemptResponse.data);
      } catch (error) {
        console.error('Error fetching details:', error);
      }
    };

    fetchDetails();
  }, [username, topicId, attempt_count]);

  return (
    
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-10">
          <div className="card shadow-lg border-light">
            <div className="card-body">
              <h2 className="text-center mb-4 text-primary">View Feedback for Attempt #{attempt_count}</h2>

              <div className="row">
                {/* Left Column: Attempt Details */}
                <div className="col-md-6 mb-4">
                  <div className="border p-3 rounded">
                    <h5 className="text-info">Generated Question:</h5>
                    {attemptDetails ? (
                      <p>{attemptDetails.question}</p>
                    ) : (
                      <p className="text-muted">Loading attempt details...</p>
                    )}
                  </div>

                  <div className="border p-3 rounded mt-4">
                    <h5 className="text-info">Responses:</h5>
                    {attemptDetails ? (
                      <ul className="list-group">
                        {attemptDetails.responses.map((response, index) => (
                          <li key={index} className="list-group-item">
                            <strong>{response.sender}:</strong> {response.text}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted">Loading responses...</p>
                    )}
                  </div>
                </div>

                {/* Right Column: Feedback and Grade */}
                <div className="col-md-6 mb-4">
                  <div className="border p-3 rounded">
                    <h5 className="text-info">Grade:</h5>
                    {feedbackDetails ? (
                      <p className="badge bg-success p-3 text-white">{feedbackDetails.grade}</p>
                    ) : (
                      <p className="text-muted">Loading grade...</p>
                    )}
                  </div>

                  {/* Added margin-top to Feedback section */}
                  <div className="border p-3 rounded mt-4">
                    <h5 className="text-info">Feedback:</h5>
                    {feedbackDetails ? (
                      <p>{feedbackDetails.feedback_text}</p>
                    ) : (
                      <p className="text-muted">Loading feedback details...</p>
                    )}
                  </div>
                </div>
              </div>

              <button
                className="btn btn-secondary w-100"
                onClick={() => navigate(-1)}
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

export default StudentViewFeedback;
