import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const EditTopic = () => {
  const { id } = useParams();
  const [topicName, setTopicName] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(""); // State to hold video preview URL
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([""]);
  const [username, setUsername] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [generatedQuestionsSet, setGeneratedQuestionsSet] = useState(new Set());
  const [timer, setTimer] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsername = () => {
      const storedUsername = localStorage.getItem("username") || "DefaultTeacher";
      setUsername(storedUsername);
    };
    fetchUsername();
  }, []);

  useEffect(() => {
    const fetchClasses = async () => {
      if (username) {
        try {
          const response = await axios.get(`http://localhost:5000/classes/teacher/${username}`);
          setClasses(response.data);
        } catch (error) {
          console.error("Error fetching classes:", error);
        }
      }
    };
    fetchClasses();
  }, [username]);

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/topics/${id}`);
        const topicData = response.data;
        setTopicName(topicData.topicname);
        setDifficulty(topicData.difficulty);
        setDescription(topicData.description);
        setQuestions(topicData.questions || [""]);
        setSelectedClasses(topicData.classes || []);
        setTimer(topicData.timer || ""); // Set the timer value
      } catch (error) {
        console.error("Error fetching topic:", error);
      }
    };
    fetchTopic();
  }, [id]);
  

  const handleEdit = async (e) => {
    e.preventDefault();
  
    const validQuestions = questions.filter((question) => question.trim() !== '');
  
    const formData = new FormData();
    formData.append("topicname", topicName);
    formData.append("difficulty", difficulty);
    formData.append("description", description);
    formData.append("timer", timer); // Include the timer value
    formData.append("teacher_username", username);
  
    selectedClasses.forEach((className) => {
      formData.append("selectedClasses[]", className);
    });
  
    if (videoFile) {
      formData.append("video", videoFile);
    }
  
    validQuestions.forEach((question, index) => {
      formData.append(`questions[${index}]`, question);
    });
  
    try {
      await axios.put(`http://localhost:5000/topics/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      navigate("/crud-topic");
    } catch (error) {
      console.error("Error editing topic:", error);
    }
  };
  
  const handleQuestionChange = (index, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = value.trim();
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, ""]);
  };

  const removeQuestion = (index) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    const updatedSet = new Set(updatedQuestions);
    setGeneratedQuestionsSet(updatedSet);
    setQuestions(updatedQuestions);
  };

  const handleClassSelection = (className) => {
    setSelectedClasses((prevSelectedClasses) =>
      prevSelectedClasses.includes(className)
        ? prevSelectedClasses.filter((name) => name !== className)
        : [...prevSelectedClasses, className]
    );
  };

  const generateQuestions = async () => {
    if (!topicName || !description) {
      alert('Please enter a topic name and description before generating questions.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/generate-questions', {
        topicName,
        description,
      });

      const generatedQuestion = response.data.question;

      if (generatedQuestion && generatedQuestion.trim() !== '') {
        if (!generatedQuestionsSet.has(generatedQuestion)) {
          setQuestions((prevQuestions) => [...prevQuestions, generatedQuestion]);
          setGeneratedQuestionsSet((prevSet) => new Set(prevSet).add(generatedQuestion));
        } else {
          alert('This question has already been generated. Please try again.');
        }
      } else {
        alert('Failed to generate a question. Please try again.');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
    }
  };

  const handleBack = () => {
    navigate("/crud-topic");
  };

  // Handle file input and set preview
  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      const fileURL = URL.createObjectURL(file);
      setVideoPreview(fileURL); // Set video preview URL
    }
  };

  return (
    <div className="container mt-5">
      <h1>Edit Topic</h1>
      <form onSubmit={handleEdit} className="mt-4">
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

        {/* Show video preview if a file is selected */}
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
  <label className="form-label">Timer (in minutes):</label>
  <input
    type="number"
    className="form-control"
    value={timer}
    onChange={(e) => setTimer(e.target.value)}
    required
  />
</div>


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

        {/* Selected classes table */}
        <div className="mb-3">
          <label className="form-label">Selected Classes</label>
          {selectedClasses.length > 0 ? (
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Class Name</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedClasses.map((className, index) => (
                  <tr key={index}>
                    <td>{className}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          setSelectedClasses(
                            selectedClasses.filter((item) => item !== className)
                          )
                        }
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

        {/* Questions input */}
        <div className="mb-3">
          <label className="form-label">Questions:</label>
          {questions.map((question, index) => (
            <div key={index} className="mb-2">
              <input
                type="text"
                className="form-control"
                value={question}
                onChange={(e) => handleQuestionChange(index, e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-danger btn-sm mt-2"
                onClick={() => removeQuestion(index)}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-primary mt-2" onClick={addQuestion}>
            Add Question
          </button>
        </div>

        <button type="button" className="btn btn-secondary" onClick={generateQuestions}>
          Generate Questions
        </button>

        <div className="mt-3">
          <button type="button" className="btn btn-light" onClick={handleBack}>
            Back
          </button>
          <button type="submit" className="btn btn-primary ms-2">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditTopic;
