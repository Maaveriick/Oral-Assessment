import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const ViewFeedback = () => {
  const { username, topicId, attempt_count } = useParams(); // Fetch params
  const [feedbackDetails, setFeedbackDetails] = useState(null); // To store feedback details
  const [attemptDetails, setAttemptDetails] = useState(null); // To store attempt details
  const navigate = useNavigate();

  // Fetch feedback details and attempt details when the page loads
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        // Fetch feedback details
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
    <div className="container-fluid bg-light">
      {/* Full-page Header */}
      <div className="row bg-primary text-white p-5">
        <div className="col-12 text-center">
          <h1 className="mb-0">View Feedback</h1>
          <h4 className="mb-3">For Attempt #{attempt_count}</h4>
        </div>
      </div>

      <div className="row" style={{ minHeight: 'calc(100vh - 120px)' }}>
        {/* Sidebar on the left */}
        <div className="col-lg-3 col-md-4 col-12 bg-white p-4 shadow-sm" style={{ height: '100%' }}>
          <h5 className="mb-4">Menu</h5>
          <ul className="list-unstyled">
            <li>
              <button
                className="btn btn-outline-primary w-100 mb-3"
                onClick={() => navigate('/oral-assessment')}
              >
                Oral Assessment
              </button>
            </li>
            <li>
              <button
                className="btn btn-outline-primary w-100 mb-3"
                onClick={() => navigate('/student-feedback')}
              >
                Feedback
              </button>
            </li>
            <li>
              <button
                className="btn btn-danger w-100"
                onClick={() => navigate('/logout')}
              >
                Logout
              </button>
            </li>
          </ul>
        </div>

        {/* Main content area */}
        <div className="col-lg-9 col-md-8 col-12 p-5 bg-white shadow-sm" style={{ height: '100%' }}>
          <div className="card shadow-lg border-light">
            <div className="card-body">
              <h2 className="text-center mb-4 text-primary">View Feedback for Attempt #{attempt_count}</h2>

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

              {feedbackDetails ? (
                <div className="mb-4">
                  <h5 className="text-info">Feedback:</h5>
                  <p>{feedbackDetails.feedback_text}</p>
                </div>
              ) : (
                <p className="text-muted">Loading feedback details...</p>
              )}

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

export default ViewFeedback;
