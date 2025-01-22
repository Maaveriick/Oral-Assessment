import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button } from 'react-bootstrap';


const CreateFeedback = () => {
  const { username, topicId, attempt_count } = useParams();
  const [feedback, setFeedback] = useState('');
  const [attemptDetails, setAttemptDetails] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [grade, setGrade] = useState('');
  const [selectedRubric, setSelectedRubric] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRubricModal, setShowRubricModal] = useState(false);
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

        const rubricResponse = await axios.get('http://localhost:5000/api/rubrics');
        if (rubricResponse.data.length > 0) {
          fetchRubricDetails(rubricResponse.data[0].rubric_id);
        }
      } catch (error) {
        console.error('Error fetching attempt or rubric details:', error);
      }
    };

    fetchAttemptDetails();
  }, [username, topicId, attempt_count]);

  const fetchRubricDetails = async (rubricId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/rubric/${rubricId}`);
      setSelectedRubric(response.data);
    } catch (error) {
      console.error('Error fetching rubric details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    const teacherUsername = loggedInUser;

    if (!teacherUsername) {
      console.error('No teacher username found!');
      return;
    }

    try {
      const finalFeedback = feedback;
      const userId = attemptDetails?.user_id;

      await axios.post('http://localhost:5000/feedbacks', {
        username,
        teacher_username: teacherUsername,
        topicId,
        attempt_count,
        feedback: finalFeedback,
        grade,
        user_id: userId,
      });

      navigate(`/attempts/${username}/${topicId}`);
    } catch (error) {
      console.error('Error creating feedback:', error);
    }
  };

  const handleShowRubricModal = () => setShowRubricModal(true);
  const handleCloseRubricModal = () => setShowRubricModal(false);

  const handleGenerateGrade = async () => {
    if (!attemptDetails || !selectedRubric) return;

    const { question, responses } = attemptDetails;

    try {
      const response = await axios.post('http://localhost:5000/generate-grade', {
        rubric: selectedRubric,  
        question,
        responses,
      });
      setGrade(response.data.grade);
    } catch (error) {
      console.error('Error generating grade:', error);
    }
  };
  
 const handleGenerateFeedback = async () => {
    if (!attemptDetails || !selectedRubric) return;
  
    const { question, responses } = attemptDetails;
  
    try {
      const response = await axios.post('http://localhost:5000/generate-feedback', {
        question,
        responses,
        selectedRubric,
      });
  
      // Set the generated feedback in the state
      setFeedback(response.data.feedback);
  
    } catch (error) {
      console.error('Error generating feedback:', error);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="col-md-8 mx-auto">
        <div className="card shadow-lg border-light">
          <div className="card-body">
            <h2 className="text-center mb-4 text-primary">Create Feedback for Attempt #{attempt_count}</h2>

            <Button
              variant="info"
              onClick={handleShowRubricModal}
              className="position-absolute top-0 end-0 m-3"
            >
              Show Rubric
            </Button>

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
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows="4"
                      required
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="gradeInput">Grade:</label>
                    <input
                      type="text"
                      id="gradeInput"
                      className="form-control"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      required
                      pattern="^\d+(\.\d+)?%$"  // Regex pattern to ensure a number followed by % (e.g., 85%)
                      title="Grade must include a percentage symbol (%)"  // Tooltip message for invalid input
                      placeholder="e.g., 85%"
                    />
                  </div>

                  {/* Add the "Generate Grade" button */}
                  <button
                    type="button"
                    className="btn btn-warning w-100 mt-3"
                    onClick={handleGenerateGrade}
                  >
                    Generate Grade
                  </button>

                  {/* Add the "Generate AI Feedback" button */}
                  <button
                    type="button"
                    className="btn btn-info w-100 mt-3"
                    onClick={handleGenerateFeedback}
                  >
                    Generate AI Feedback
                  </button>

                  <button type="submit" className="btn btn-primary w-100 mt-3">Submit Feedback</button>
                </form>
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

      <Modal show={showRubricModal} onHide={handleCloseRubricModal} size="lg" className="modal-dialog-scrollable">
        <Modal.Header closeButton>
          <Modal.Title>Grading Rubric</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: 'calc(100vh - 210px)', overflowY: 'auto' }}>
          {loading ? (
            <p>Loading rubric details...</p>
          ) : selectedRubric ? (
            <div>
              <h3>{selectedRubric.rubricTitle}</h3>
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Criteria</th>
                    <th>Weightage (%)</th>
                    {selectedRubric.columnOrder && selectedRubric.columnOrder.map((col, index) => (
                      <th key={index}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedRubric.rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.criteria}</td>
                      <td>{row.weightage ? row.weightage * 100 : "N/A"}%</td>
                      {selectedRubric.columnOrder.map((col, index) => (
                        <td key={`${row.id}-${col}`}>
                          {row.grading_values && row.grading_values[col] ? row.grading_values[col] : "N/A"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No rubric available.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseRubricModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CreateFeedback;
