import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const CreateFeedback = () => {
  const { username, topicId, attempt_count } = useParams();
  const [feedback, setFeedback] = useState('');
  const [generatedFeedback, setGeneratedFeedback] = useState('');
  const [attemptDetails, setAttemptDetails] = useState(null);
  const [rubricText, setRubricText] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [grade, setGrade] = useState(''); // New state for grade
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('username');
    if (user) {
      setLoggedInUser(user);
    }
  }, []);

  useEffect(() => {
    const fetchAttemptDetails = async () => {
      try {
        const response = await axios.post('http://localhost:5000/get_attempt_details', {
          username,
          topicId,
          attempt_count,
        });
        setAttemptDetails(response.data);

        const rubricResponse = await axios.get('http://localhost:5000/rubrics');
        setRubricText(rubricResponse.data[0]?.rubric_text);

        setQuestionText(response.data?.question);
      } catch (error) {
        console.error('Error fetching attempt details:', error);
      }
    };

    fetchAttemptDetails();
  }, [username, topicId, attempt_count]);

  const handleCreate = async (e) => {
    e.preventDefault();

    const teacherUsername = loggedInUser;

    if (!teacherUsername) {
      console.error('No teacher username found!');
      return;
    }

    try {
      const finalFeedback = feedback || generatedFeedback;

      const userId = attemptDetails?.user_id;

      await axios.post('http://localhost:5000/feedbacks', {
        username,
        teacher_username: teacherUsername,
        topicId,
        attempt_count,
        feedback: finalFeedback,
        grade, // This sends the grade
        user_id: userId,
      });
      

      navigate(`/attempts/${username}/${topicId}`);
    } catch (error) {
      console.error('Error creating feedback:', error);
    }
  };

  const handleGenerateFeedback = async () => {
    try {
      const response = await axios.post('http://localhost:5000/generate-feedback', {
        rubric: rubricText,
        question: questionText,
        responses: attemptDetails?.responses || [],
      });

      setGeneratedFeedback(response.data.feedback);
    } catch (error) {
      console.error('Error generating feedback:', error);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card shadow-lg border-light">
            <div className="card-body">
              <h2 className="text-center mb-4 text-primary">Create Feedback for Attempt #{attempt_count}</h2>

              <div className="row">
                <div className="col-md-6">
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
                </div>

                <div className="col-md-6">
                  <form onSubmit={handleCreate}>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="feedbackTextarea">Feedback:</label>
                      <textarea
                        id="feedbackTextarea"
                        className="form-control"
                        value={feedback || generatedFeedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows="4"
                        required
                      ></textarea>
                    </div>

                    {/* New Grade Input */}
                    <div className="mb-3">
                      <label className="form-label" htmlFor="gradeInput">Grade:</label>
                      <input
                        type="text"
                        id="gradeInput"
                        className="form-control"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        required
                      />
                    </div>

                    <button type="submit" className="btn btn-primary w-100">Submit Feedback</button>
                  </form>

                  <button
                    className="btn btn-info w-100 mt-3"
                    onClick={handleGenerateFeedback}
                  >
                    Generate AI Feedback
                  </button>
                </div>
              </div>

              <button
                className="btn btn-secondary w-100 mt-3"
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

export default CreateFeedback;
