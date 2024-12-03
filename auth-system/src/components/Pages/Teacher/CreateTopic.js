import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const CreateTopic = () => {
  const [topicName, setTopicName] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [videoFile, setVideoFile] = useState(null);
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([{ text: "" }]);
  const [generatedQuestionsSet, setGeneratedQuestionsSet] = useState(new Set());
  const [username, setUsername] = useState(""); // State for the logged-in teacher's username
  const [classes, setClasses] = useState([]); // State for storing classes
  const [selectedClasses, setSelectedClasses] = useState([]); // State for storing selected class names
  const [videoPreview, setVideoPreview] = useState(""); // State for video preview URL
  const navigate = useNavigate();

  // Fetching the logged-in teacher's username
  useEffect(() => {
    const fetchUsername = () => {
      const storedUsername = localStorage.getItem("username") || "DefaultTeacher";
      setUsername(storedUsername);
    };

    fetchUsername();
  }, []);

  // Fetch classes assigned to the logged-in teacher
  useEffect(() => {
    const fetchClasses = async () => {
      if (username) {
        try {
          const response = await axios.get(`http://localhost:5000/classes/teacher/${username}`);
          setClasses(response.data); // Set the fetched classes
        } catch (error) {
          console.error("Error fetching classes:", error);
        }
      }
    };

    fetchClasses();
  }, [username]);

  // Handle creating a new topic
  const handleCreate = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("topicname", topicName);
    formData.append("difficulty", difficulty);
    formData.append("description", description);
    formData.append("teacher_username", username); // Include the teacher's username

    // Add selected class names to the form data
    selectedClasses.forEach((className) => {
      formData.append("classes[]", className); // Save class names instead of IDs
    });

    if (videoFile) {
      formData.append("video", videoFile);
    }

    // Add questions to the form data
    questions.forEach((question, index) => {
      if (question.text) {
        formData.append(`questions[${index}]`, question.text);
      }
    });

    try {
      await axios.post("http://localhost:5000/topics", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      navigate("/crud-topic"); // Redirect to topics list
    } catch (error) {
      console.error("Error creating topic:", error);
    }
  };

  // Handle input change for individual questions
  const handleQuestionChange = (index, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].text = value;
    setQuestions(updatedQuestions);
  };

  // Add a new question field
  const addQuestion = () => {
    setQuestions([...questions, { text: "" }]);
  };

  // Remove a specific question field
  const removeQuestion = (index) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
  };

  // Handle class selection (add or remove class)
  const handleClassSelection = (className) => {
    setSelectedClasses((prevSelectedClasses) =>
      prevSelectedClasses.includes(className)
        ? prevSelectedClasses.filter((name) => name !== className)
        : [...prevSelectedClasses, className]
    );
  };

  // Handle video file change for preview
  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    setVideoFile(file);
    if (file) {
      setVideoPreview(URL.createObjectURL(file)); // Generate video preview URL
    }
  };

  // Generate questions dynamically
  const generateQuestions = async () => {
    if (!topicName || !description) {
      alert("Please enter a topic name and description before generating questions.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/generate-questions", {
        topicName,
        description,
      });

      const generatedQuestion = response.data.question;

      if (typeof generatedQuestion === "string" && generatedQuestion.trim() !== "") {
        if (!generatedQuestionsSet.has(generatedQuestion)) {
          setQuestions((prevQuestions) => [
            ...prevQuestions,
            { text: generatedQuestion },
          ]);
          setGeneratedQuestionsSet((prevSet) =>
            new Set(prevSet).add(generatedQuestion)
          );
        } else {
          alert("This question has already been generated. Please try again.");
        }
      } else {
        console.error("Generated question is not a valid string:", generatedQuestion);
        alert("Failed to generate questions. Please try again.");
      }
    } catch (error) {
      console.error("Error generating questions:", error);
    }
  };

  // Navigate back to the topics list
  const handleBack = () => {
    navigate("/crud-topic");
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
            onChange={handleVideoFileChange}
          />
        </div>
        {videoPreview && (
          <div className="mb-3">
            <label className="form-label">Video Preview:</label>
            <video width="320" height="240" controls>
              <source src={videoPreview} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        )}
        <div className="mb-3">
          <label className="form-label">Available Classes</label>
          <div className="card">
            <div className="card-body">
              {classes.length > 0 ? (
                <ul className="list-group">
                  {classes.map((classItem) => (
                    <li
                      key={classItem.id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      {classItem.class_name}
                      {selectedClasses.includes(classItem.class_name) ? (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleClassSelection(classItem.class_name)}
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={() => handleClassSelection(classItem.class_name)}
                        >
                          Add
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No classes available.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Selected Classes</label>
          {selectedClasses.length > 0 ? (
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Class Name</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedClasses.map((className, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{className}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleClassSelection(className)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No classes selected.</p>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Questions:</label>
          {questions.map((question, index) => (
            <div key={index} className="d-flex mb-2">
              <input
                type="text"
                className="form-control"
                value={question.text}
                onChange={(e) => handleQuestionChange(index, e.target.value)}
                placeholder="Enter question"
              />
              <button
                type="button"
                className="btn btn-danger ms-2"
                onClick={() => removeQuestion(index)}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-primary"
            onClick={addQuestion}
          >
            Add Question
          </button>
        </div>

        <div className="mb-3">
          <button
            type="button"
            className="btn btn-warning"
            onClick={generateQuestions}
          >
            Generate Questions
          </button>
        </div>

        <div className="mb-3">
          <button type="submit" className="btn btn-primary">
            Create Topic
          </button>
          <button type="button" className="btn btn-secondary ms-2" onClick={handleBack}>
            Back
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTopic;
