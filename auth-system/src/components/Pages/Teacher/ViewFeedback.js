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
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
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
