import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button } from 'react-bootstrap';
 
const CreateFeedback = () => {
  const { username, topicId, attempt_count } = useParams();
  const [feedback, setFeedback] = useState('');
  const [generatedFeedback, setGeneratedFeedback] = useState('');
  const [attemptDetails, setAttemptDetails] = useState(null);
  const [rubricComponents, setRubricComponents] = useState([]);
  const [rubricId, setRubricId] = useState(null);
  const [questionText, setQuestionText] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [grade, setGrade] = useState('');
  const [classId, setClassId] = useState(''); // New state for classId
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
        setQuestionText(response.data?.question);
 
        const rubricResponse = await axios.get('http://localhost:5000/rubrics');
        setRubricComponents(rubricResponse.data[0]?.components || []);
        setRubricId(rubricResponse.data[0]?.id);
 
        // Fetch classId (assuming an endpoint exists for this)
        const classResponse = await axios.post('http://localhost:5000/get_class_id', { topicId });
        setClassId(classResponse.data?.classId || '');
      } catch (error) {
        console.error('Error fetching attempt or rubric details:', error);
      }
    };
 
    fetchAttemptDetails();
  }, [username, topicId, attempt_count]);
 
  const handleCreate = async (e) => {
    e.preventDefault();
 
    const teacherUsername = loggedInUser;
 
    if (!teacherUsername || !classId) {
      console.error('Required fields are missing!');
      alert('Please ensure all fields, including Class ID, are filled.');
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
        grade,
        user_id: userId,
        classId, // Include classId in the request body
      });
 
      navigate(`/attempts/${username}/${topicId}`);
    } catch (error) {
      console.error('Error creating feedback:', error);
    }
  };
 
  const handleGenerateFeedback = async () => {
    try {
      if (!rubricId || !rubricComponents.length) {
        console.error('Rubric ID or components are missing');
        alert('Unable to generate feedback: Rubric ID or components are missing.');
        return;
      }
 
      const response = await axios.post('http://localhost:5000/generate-feedback', {
        rubricId,
        rubricComponents,
        question: questionText,
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
        console.error('Rubric ID or components are missing');
        alert('Unable to generate grade: Rubric ID or components are missing.');
        return;
      }
 
      const response = await axios.post('http://localhost:5000/generate-grade', {
        rubricId,
        rubricComponents,
        question: questionText,
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
                      value={feedback || generatedFeedback}
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
 
                  <div className="mb-3">
<label className="form-label" htmlFor="classIdInput">Class ID:</label>
<input
                      type="text"
                      id="classIdInput"
                      className="form-control"
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      required
                    />
</div>
 
                  <button type="submit" className="btn btn-primary w-100">Submit Feedback</button>
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
 
export default CreateFeedback