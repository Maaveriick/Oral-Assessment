import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ViewTopic = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState({});
  const [loading, setLoading] = useState(true); // State for loading
  const [error, setError] = useState(null); // State for error handling

  useEffect(() => {
    // Fetch topic by ID
    const fetchTopic = async () => {
      try {
        const response = await fetch(`http://localhost:5000/topics/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch topic');
        }

        const data = await response.json();
        setTopic(data);
      } catch (error) {
        setError(error.message); // Update error state
      } finally {
        setLoading(false); // End loading state
      }
    };

    fetchTopic();
  }, [id]);

  const handleBack = () => {
    navigate('/crud-topic'); // Navigate back to the topic list
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
          Back to Topics List
        </button>
      </div>
    ); // Display error message
  }

  return (
    <div className="container mt-4">
      <div className="card p-4">
        <h2 className="mb-4">View Topic</h2>

        {/* Topic Name */}
        <div className="mb-3">
          <label className="form-label">Topic Name:</label>
          <h5 className="form-control">{topic.topicname}</h5>
        </div>

        {/* Difficulty */}
        <div className="mb-3">
          <label className="form-label">Difficulty:</label>
          <h5 className="form-control">{topic.difficulty}</h5>
        </div>

        {/* Date Created */}
        <div className="mb-3">
          <label className="form-label">Date Created:</label>
          <h5 className="form-control">
            {topic.datecreated ? new Date(topic.datecreated).toLocaleString() : 'N/A'}
          </h5>
        </div>

        {/* Description */}
        <div className="mb-3">
          <label className="form-label">Description:</label>
          <p className="form-control">{topic.description}</p> {/* Display the description */}
        </div>

        {/* Related Video */}
        {topic.video_url && (
          <div className="mb-3">
            <label className="form-label">Related Video:</label>
            <div className="form-control">
              <video width="600" controls>
                <source src={`http://localhost:5000/${topic.video_url}`} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-4">
          <button className="btn btn-secondary" onClick={handleBack}>
            Back to Topics List
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewTopic;
