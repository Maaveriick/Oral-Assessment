import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ViewFeedback = () => {
  const { username, topicId, attempt_count } = useParams(); // Get URL parameters
  const [feedbackDetails, setFeedbackDetails] = useState(null); // Store feedback details
  const [error, setError] = useState(''); // Store errors if any
  const navigate = useNavigate();

  // Fetch feedback details from the backend
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await axios.post('http://localhost:5000/feedbacks/details', {
          username,
          topicId,
          attempt_count,
        });
        setFeedbackDetails(response.data);
      } catch (err) {
        console.error('Error fetching feedback:', err);
        setError(err.response?.data?.message || 'Error fetching feedback.');
      }
    };

    fetchFeedback();
  }, [username, topicId, attempt_count]);

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-lg border-light">
            <div className="card-body">
              <h2 className="text-center mb-4 text-primary">View Feedback</h2>
              {error ? (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              ) : feedbackDetails ? (
                <>
                  <div className="mb-3">
                    <h5 className="text-info">Username:</h5>
                    <p>{feedbackDetails.username}</p>
                  </div>
                  <div className="mb-3">
                    <h5 className="text-info">Teacher Username:</h5>
                    <p>{feedbackDetails.teacher_username}</p>
                  </div>
                  <div className="mb-3">
                    <h5 className="text-info">Topic ID:</h5>
                    <p>{feedbackDetails.topic_id}</p>
                  </div>
                  <div className="mb-3">
                    <h5 className="text-info">Attempt Count:</h5>
                    <p>{feedbackDetails.attempt_count}</p>
                  </div>
                  <div className="mb-3">
                    <h5 className="text-info">Feedback Text:</h5>
                    <p>{feedbackDetails.feedback_text}</p>
                  </div>
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => navigate('/crud-feedback')} // Navigate back to the feedback list
                  >
                    Back to Feedback List
                  </button>
                </>
              ) : (
                <p className="text-muted">Loading feedback details...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewFeedback;
