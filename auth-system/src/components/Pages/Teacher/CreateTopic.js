import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const CreateTopic = () => {
  const [topicName, setTopicName] = useState('');
  const [difficulty, setDifficulty] = useState('Easy'); // Default to 'Easy'
  const [videoFile, setVideoFile] = useState(null); // State for the uploaded file
  const [description, setDescription] = useState(''); // State for the description
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('topicname', topicName);
    formData.append('difficulty', difficulty);
    formData.append('description', description); // Append the description
    if (videoFile) {
      formData.append('video', videoFile); // Append the video file
    }

    try {
      await axios.post('http://localhost:5000/topics', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Important for file upload
        },
      });
      navigate('/crud-topic'); // Redirect back to the topic list after creating the topic
    } catch (error) {
      console.error('Error creating topic:', error);
    }
  };

  return (
    <div className="container mt-5">
      <h1>Create New Topic</h1>
      <form onSubmit={handleCreate} className="mt-4">
        <div className="mb-3">
          <label className="form-label">Topic Name:</label>
          <input
            type="text"
            className="form-control"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Difficulty:</label>
          <select
            className="form-select"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            required
          >
            <option value="Easy">Easy</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Description:</label>
          <textarea
            className="form-control"
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)} // Update description state
            required // Optional, remove if you don't want to make it required
          ></textarea>
        </div>
        <div className="mb-3">
          <label className="form-label">Upload Video:</label>
          <input
            type="file"
            className="form-control"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files[0])}
            required // Make it optional if you don't want to require a video
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Create Topic
        </button>
      </form>
    </div>
  );
};

export default CreateTopic;
