import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const CreateFeedback = () => {
  const [feedback, setFeedback] = useState('');
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
  
    try {
      await axios.post('http://localhost:5000/feedbacks', { feedback }); // Send JSON data
      navigate('/crud-feedback'); // Redirect after creating feedback
    } catch (error) {
      console.error('Error creating feedback:', error);
    }
  };
  
 /* const handleCreate = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('feedback', feedback);

    try {
      await axios.post('http://localhost:5000/feedbacks', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Important for file upload
        },
      });
      navigate('/crud-feedback'); // Redirect back to the topic list after creating the topic
    } catch (error) {
      console.error('Error creating feedback:', error);
    }
  };
   */
  return (
    <div className="container mt-5">
      <h1>Create New Feedback</h1>
      <form onSubmit={handleCreate} className="mt-4">
        <div className="mb-3">
          <label className="form-label">Feedback:</label>
          <input
            type="text"
            className="form-control"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Create Feedback
        </button>
      </form>
    </div>
  );
};

export default CreateFeedback;