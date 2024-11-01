import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const CreateTopic = () => {
  const [topicName, setTopicName] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [videoFile, setVideoFile] = useState(null);
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([{ text: '' }]);
  const [generatedQuestionsSet, setGeneratedQuestionsSet] = useState(new Set()); // To track unique questions
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('topicname', topicName);
    formData.append('difficulty', difficulty);
    formData.append('description', description);
    if (videoFile) {
      formData.append('video', videoFile);
    }

    // Send all questions as an array
    questions.forEach((question, index) => {
      if (question.text) {
        formData.append(`questions[${index}]`, question.text);
      }
    });

    try {
      await axios.post('http://localhost:5000/topics', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      navigate('/crud-topic');
    } catch (error) {
      console.error('Error creating topic:', error);
    }
  };

  const handleQuestionChange = (index, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].text = value;
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, { text: '' }]);
  };

  const removeQuestion = (index) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
  };

  // Function to generate questions
  const generateQuestions = async () => {
    if (!topicName || !description) {
      alert('Please enter a topic name and description before generating questions.');
      return;
    }

    try {
      // Call your backend API to generate questions
      const response = await axios.post('http://localhost:5000/generate-questions', {
        topicName,
        description,
      });

      // Log the entire response to inspect its structure
      console.log('Response from API:', response.data);

      // Extract the generated question
      const generatedQuestion = response.data.question; // Adjust based on your API response

      // Check if generatedQuestion is a string and not empty
      if (typeof generatedQuestion === 'string' && generatedQuestion.trim() !== '') {
        // Check for duplicates
        if (!generatedQuestionsSet.has(generatedQuestion)) {
          setQuestions(prevQuestions => [
            ...prevQuestions,
            { text: generatedQuestion },
          ]);
          setGeneratedQuestionsSet(prevSet => new Set(prevSet).add(generatedQuestion)); // Add to set
        } else {
          alert('This question has already been generated. Please try again.');
        }
      } else {
        console.error('Generated question is not a valid string:', generatedQuestion);
        alert('Failed to generate questions. Please try again.');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
    }
  };

  // Function to handle back navigation
  const handleBack = () => {
    navigate('/crud-topic');
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
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>
        </div>
        <div className="mb-3">
          <label className="form-label">Upload Video:</label>
          <input
            type="file"
            className="form-control"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files[0])}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Questions:</label>
          {questions.map((question, index) => (
            <div key={index} className="input-group mb-2">
              <input
                type="text"
                className="form-control"
                value={question.text}
                onChange={(e) => handleQuestionChange(index, e.target.value)}
                placeholder={`Question ${index + 1}`}
                required
              />
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => removeQuestion(index)}
              >
                Remove
              </button>
            </div>
          ))}

          <button type="button" className="btn btn-secondary" onClick={addQuestion}>
            Add Question
          </button>
        </div>
        <button type="button" className="btn btn-success" onClick={generateQuestions}>
          Generate Questions
        </button>
        <button type="submit" className="btn btn-primary">
          Create Topic
        </button>
      </form>
      <div className="mt-4">
        <button className="btn btn-secondary" onClick={handleBack}>
          Back to Topics List
        </button>
      </div>
    </div>
  );
};

export default CreateTopic;
