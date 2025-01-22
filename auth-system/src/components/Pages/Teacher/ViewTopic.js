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
        console.log('Fetched topic:', data); // Log the fetched data to inspect its structure
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
        <h2 className="mb-4 text-center">View Topic</h2>

        {/* Topic Name */}
        <div className="mb-3">
          <label className="form-label">Topic Name:</label>
          <h5 className="form-control-plaintext">{topic.topicname}</h5>
        </div>

        {/* Difficulty */}
        <div className="mb-3">
          <label className="form-label">Difficulty:</label>
          <h5 className="form-control-plaintext">{topic.difficulty}</h5>
        </div>

        {/* Date Created */}
        <div className="mb-3">
          <label className="form-label">Date Created:</label>
          <h5 className="form-control-plaintext">
            {topic.datecreated ? new Date(topic.datecreated).toLocaleString() : 'N/A'}
          </h5>
        </div>

        {/* Description */}
        <div className="mb-3">
          <label className="form-label">Description:</label>
          <p className="form-control-plaintext">{topic.description}</p> {/* Display the description */}
        </div>

        {/* Related Video */}
        {topic.video_url && (
          <div className="mb-3">
            <label className="form-label">Related Video:</label>
            <div className="form-control-plaintext">
              <video width="600" controls>
                <source src={`http://localhost:5000/${topic.video_url}`} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}

        {/* Timer */}
        <div className="mb-3">
          <label className="form-label">Duration:</label>
          <p className="form-control-plaintext">{topic.timer}</p> {/* Display the timer */}
        </div>

        {/* Questions Section */}
        <div className="mb-3">
          <label className="form-label">Questions:</label>
          {topic.questions && topic.questions.length > 0 ? (
            topic.questions.map((question, index) => (
              <div key={index} className="form-control-plaintext mb-2">
                <h6>{question.text || question}</h6> {/* Adjust based on the actual structure */}
              </div>
            ))
          ) : (
            <p>No questions available for this topic.</p>
          )}
        </div>

        {/* Classes Section */}
        <div className="mb-3">
          <label className="form-label">Classes:</label>
          {topic.classes && topic.classes.length > 0 ? (
            <ul className="list-group">
              {topic.classes.map((className, index) => (
                <li key={index} className="list-group-item">{className}</li> // Assuming `classes` is an array of class names
              ))}
            </ul>
          ) : (
            <p>No classes associated with this topic.</p>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-4 text-center">
          <button className="btn btn-secondary" onClick={handleBack}>
            Back to Topics List
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewTopic;
