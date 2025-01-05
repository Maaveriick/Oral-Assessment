import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button } from 'react-bootstrap'; // Import Modal and Button from react-bootstrap

const EditFeedback = () => {
  const { username, topicId, attempt_count } = useParams();
  const [feedback_text, setFeedback] = useState('');
  const [generatedFeedback, setGeneratedFeedback] = useState('');
  const [grade, setGrade] = useState('');
  const [attemptDetails, setAttemptDetails] = useState(null);
  const [rubricComponents, setRubricComponents] = useState([]);
  const [rubricId, setRubricId] = useState(null);
  const [showRubricModal, setShowRubricModal] = useState(false);
  const navigate = useNavigate();

  // Fetch attempt details and feedback when the page loads
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        // Fetch attempt details
        const attemptResponse = await axios.post('http://localhost:5000/get_attempt_details', {
          username,
          topicId,
          attempt_count,
        });
        setAttemptDetails(attemptResponse.data);

        // Fetch existing feedback
        const feedbackResponse = await axios.post('http://localhost:5000/feedbacks/details', {
          username,
          topicId,
          attempt_count,
        });
        setFeedback(feedbackResponse.data.feedback_text);
        setGrade(feedbackResponse.data.grade);

        // Fetch rubric details
        const rubricResponse = await axios.get('http://localhost:5000/rubrics');
        const firstRubricComponents = rubricResponse.data[0]?.components || [];
        setRubricComponents(firstRubricComponents);
        setRubricId(rubricResponse.data[0]?.id);
      } catch (error) {
        console.error('Error fetching details or feedback:', error);
      }
    };

    fetchDetails();
  }, [username, topicId, attempt_count]);

  const handleUpdate = async (e) => {
    e.preventDefault();

    const teacherUsername = JSON.parse(localStorage.getItem('user'))?.username;
    if (!teacherUsername) {
      console.error('No teacher username found!');
      return;
    }

    try {
      await axios.put('http://localhost:5000/feedbacks/update', {
        username,
        teacher_username: teacherUsername,
        topicId,
        attempt_count,
        feedback_text: feedback_text || generatedFeedback,
        grade,
      });
      navigate(`/attempts/${username}/${topicId}`);
    } catch (error) {
      console.error('Error updating feedback:', error);
    }
  };

  const handleGenerateFeedback = async () => {
    try {
      if (!rubricId || !rubricComponents.length) {
        alert('Unable to generate feedback: Rubric ID or components are missing.');
        return;
      }

      const response = await axios.post('http://localhost:5000/generate-feedback', {
        rubricId,
        rubricComponents,
        question: attemptDetails?.question,
        responses: attemptDetails?.responses || [],
      });
      setGeneratedFeedback(response.data.feedback);
    } catch (error) {
      console.error('Error generating feedback:', error.response?.data || error.message);
    }
  };

  const handleGenerateGrade = async () => {
    try {
      if (!rubricId || !rubricComponents.length) {
        alert('Unable to generate grade: Rubric ID or components are missing.');
        return;
      }

      const response = await axios.post('http://localhost:5000/generate-grade', {
        rubricId,
        rubricComponents,
        question: attemptDetails?.question,
        responses: attemptDetails?.responses || [],
      });
      setGrade(response.data.grade);
    } catch (error) {
      console.error('Error generating grade:', error.response?.data || error.message);
    }
  };

  const handleShowRubricModal = () => setShowRubricModal(true);
  const handleCloseRubricModal = () => setShowRubricModal(false);

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card shadow-lg border-light">
            <div className="card-body">
              <h2 className="text-center mb-4 text-primary">Edit Feedback for Attempt #{attempt_count}</h2>

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
                  <form onSubmit={handleUpdate}>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="feedbackTextarea">Feedback:</label>
                      <textarea
                        id="feedbackTextarea"
                        className="form-control"
                        value={feedback_text || generatedFeedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows="4"
                        required
                      ></textarea>
                    </div>

                    <button
                      type="button"
                      className="btn btn-info w-100 mt-3"
                      onClick={handleGenerateFeedback}
                    >
                      Generate AI Feedback
                    </button>

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

                    <button
                      type="button"
                      className="btn btn-info w-100 mt-3 mb-3"
                      onClick={handleGenerateGrade}
                    >
                      Generate AI Grade
                    </button>

                    <button type="submit" className="btn btn-primary w-100">
                      Update Feedback
                    </button>
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
      </div>

      <Modal show={showRubricModal} onHide={handleCloseRubricModal}>
        <Modal.Header closeButton>
          <Modal.Title>Grading Rubric</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Component</th>
                <th>Description</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {rubricComponents.map((component, index) => (
                <tr key={index}>
                  <td>{component.component}</td>
                  <td>{component.description}</td>
                  <td>{component.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
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

export default EditFeedback;
