import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ViewFeedback = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState({});
  const [loading, setLoading] = useState(true); // State for loading
  const [error, setError] = useState(null); // State for error handling

  useEffect(() => {
    // Fetch feedback by ID
    const fetchFeedback = async () => {
      try {
        const response = await fetch(`http://localhost:5000/feedbacks/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch feedback');
        }

        const data = await response.json();
        setFeedback(data);
      } catch (error) {
        setError(error.message); // Update error state
      } finally {
        setLoading(false); // End loading state
      }
    };

    fetchFeedback();
  }, [id]);

  const handleBack = () => {
    navigate('/crud-feedback'); // Navigate back to the topic list
  };

  if (loading) {
    return <div className="container mt-4">Loading...</div>; // Loading message
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <button className="btn btn-secondary" onClick={handleBack}>
          Back to Feedbacks List
        </button>
      </div>
    ); // Display error message
  }

  return (
    <div className="container mt-4">
      <div className="card p-4">
        <h2 className="mb-4">View Feedback</h2>

        {/* Feedback */}
        <div className="mb-3">
          <label className="form-label">Feedback:</label>
          <h5 className="form-control">{feedback.feedback}</h5>
        </div>

        {/* Back Button */}
        <div className="mt-4">
          <button className="btn btn-secondary" onClick={handleBack}>
            Back to Feedback List
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewFeedback;
