import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import { Card, Button, Form, Modal } from 'react-bootstrap'; // Use Card, Button, Form, Modal from Bootstrap
import axios from 'axios';

const HomeTeacher = ({ username, onLogout }) => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState(null); // Declare state for classId
  const [aiEnabled, setAiEnabled] = useState(false); // Default to false
  const [showSettingsModal, setShowSettingsModal] = useState(false); // State to control modal visibility
  
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/classes/teacher/${username}`);
        setClasses(response.data);
        console.log('Classes assigned to teacher:', response.data); // Log the classes
      } catch (err) {
        console.error('Error fetching classes:', err);
      }
    };
  
    fetchClasses();
  }, [username, navigate]);

  useEffect(() => {
    console.log('Signed in as:', username);
  }, [username]);

  useEffect(() => {
    if (classId !== null) {
      const fetchClassStatus = async () => {
        try {
          const response = await fetch(`http://localhost:5000/classes/${classId}`);
          const classData = await response.json();
          setAiEnabled(classData.ai_enabled); // Set the initial AI status
        } catch (error) {
          console.error("Failed to fetch class status:", error);
        }
      };
      fetchClassStatus();
    }
  }, [classId]); // Only fetch status when classId changes

  const handleSwitchChange = async (e, classId) => {
    const newStatus = e.target.checked;

    // Update local state immediately
    setClasses((prevClasses) => 
      prevClasses.map((classItem) => 
        classItem.id === classId 
          ? { ...classItem, ai_enabled: newStatus } // Update ai_enabled in local state
          : classItem
      )
    );

    try {
      // Send the updated status to the backend for the specific teacher and class
      const response = await fetch(`http://localhost:5000/classes/teacher/${username}/${classId}/ai-toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ aiEnabled: newStatus }),
      });

      if (response.ok) {
        console.log('AI feature status updated for class:', classId);
      } else {
        const errorData = await response.json();
        console.error('Failed to update AI feature status:', errorData.message);
      }
    } catch (error) {
      console.error('Error updating AI feature:', error);
    }
  };

  const handleShowModal = () => setShowSettingsModal(true); // Show modal
  const handleCloseModal = () => setShowSettingsModal(false); // Close modal

  return (
    <div className="container-fluid d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light">
      {/* Hero Section */}
      <div className="text-center mb-5 w-100 p-5 bg-primary text-white rounded-3 shadow-lg">
        <h1 className="display-4">Welcome, {username}!</h1>
        <p className="lead">Manage your topics, track student progress, and create rubrics all in one place.</p>
      </div>
  
      {/* Action Cards Section */}
      <div className="row justify-content-center mb-4">
        {/* Card 1 */}
        <div className="col-12 col-md-4 mb-4 d-flex">
          <Card className="shadow-lg border-primary h-100 w-100">
            <Card.Body className="text-center p-4">
              <i className="bi bi-file-earmark-plus mb-3" style={{ fontSize: '50px', color: '#fff' }}></i>
              <Card.Title className="text-black h5">Create Assignment</Card.Title>
              <Button
                variant="primary"
                className="w-100 mt-3"
                onClick={() => navigate('/crud-topic')}
              >
                <i className="bi bi-file-earmark-plus me-2"></i> Create Topic
              </Button>
              <Card.Text className="text-black mt-3">
                Directs to the "Create Topic" page to create new assignments and topics.
              </Card.Text>
            </Card.Body>
          </Card>
        </div>
  
        {/* Card 2 */}
        <div className="col-12 col-md-4 mb-4 d-flex">
          <Card className="shadow-lg border-primary h-100 w-100">
            <Card.Body className="text-center p-4">
              <i className="bi bi-bar-chart-line mb-3" style={{ fontSize: '50px', color: '#fff' }}></i>
              <Card.Title className="text-black h5">Track Student Progress</Card.Title>
              <Button
                variant="primary"
                className="w-100 mt-3"
                onClick={() => navigate('/class')}
              >
                <i className="bi bi-bar-chart-line me-2"></i> View Student's Progress
              </Button>
              <Card.Text className="text-black mt-3">
                View the overall progress and performance of students in your classes.
              </Card.Text>
  
              <Button
                variant="primary"
                className="w-100 mt-3"
                onClick={() => navigate('/performance-management')}
              >
                <i className="bi bi-bar-chart-line me-2"></i> Performance Management System
              </Button>
              <Card.Text className="text-black mt-3">
                Manage student performance with a comprehensive performance management system.
              </Card.Text>
            </Card.Body>
          </Card>
        </div>
  
        {/* Card 3 */}
        <div className="col-12 col-md-4 mb-4 d-flex">
          <Card className="shadow-lg border-primary h-100 w-100">
            <Card.Body className="text-center p-4">
              <i className="bi bi-bar-chart-line mb-3" style={{ fontSize: '50px', color: '#fff' }}></i>
              <Card.Title className="text-black h5">Create Announcement</Card.Title>
              <Button
                variant="primary"
                className="w-100 mt-3"
                onClick={() => navigate('/teacher-classes')}
              >
                <i className="bi bi-bar-chart-line me-2"></i> Create Announcement
              </Button>
              <Card.Text className="text-black mt-3">
                Redirects you to the page where you can create announcements for your students.
              </Card.Text>
            </Card.Body>
          </Card>
        </div>
  
        {/* Card 4 */}
        <div className="col-12 col-md-4 mb-4 d-flex">
          <Card className="shadow-lg border-primary h-100 w-100">
            <Card.Body className="text-center p-4">
              <i className="bi bi-bar-chart-line mb-3" style={{ fontSize: '50px', color: '#fff' }}></i>
              <Card.Title className="text-black h5">Rubrics</Card.Title>
              <Button
                variant="primary"
                className="w-100 mt-3"
                onClick={() => navigate('/rubricsTeacher')}
              >
                <i className="bi bi-bar-chart-line me-2"></i> Rubrics
              </Button>
              <Card.Text className="text-black mt-3">
                Access the rubric management page to create and manage rubrics.
              </Card.Text>
              
              <Button
                variant="primary"
                className="w-100 mt-3"
                onClick={() => navigate('/crud-rubric')}
              >
                <i className="bi bi-bar-chart-line me-2"></i> CRUD Rubrics
              </Button>
              <Card.Text className="text-black mt-3">
                Create, update, or delete rubrics for your assignments.
              </Card.Text>
            </Card.Body>
          </Card>
        </div>
  
        {/* New Card with Switch Slider */}
        <div className="col-12 col-md-4 mb-4 d-flex">
          <Card className="shadow-lg border-primary h-100 w-100">
            <Card.Body className="text-center p-4">
              <Card.Title className="text-black h5 mb-3">AI Feature Settings</Card.Title>
              <Button
                variant="primary"
                className="w-100 mt-3"
                onClick={handleShowModal} // Open the modal
              >
                Configure AI Grading
              </Button>
              <Card.Text className="text-black mt-3">
                Access the settings to configure AI features like grading for all your classes.
              </Card.Text>
            </Card.Body>
          </Card>
        </div>
      </div>
  
      {/* Modal to show settings for all classes */}
      <Modal show={showSettingsModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Configure AI Features</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {classes.map((classItem) => (
            <div key={classItem.id} className="mb-3">
              <Card>
                <Card.Body>
                  <Card.Title>{classItem.class_name}</Card.Title>
                  <Form.Group controlId={`formSwitch-${classItem.id}`} className="mt-3">
                    <Form.Check
                      type="switch"
                      id={`switch-${classItem.id}`}
                      label={classItem.ai_enabled ? 'Feature Enabled' : 'Feature Disabled'}
                      checked={classItem.ai_enabled}
                      onChange={(e) => handleSwitchChange(e, classItem.id)}
                      className="text-black"
                      style={{
                        transform: 'scale(1.6)',
                        margin: '0 auto',
                        display: 'block',
                        maxWidth: '120px',
                      }}
                    />
                  </Form.Group>
                </Card.Body>
              </Card>
            </div>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
  
      {/* Logout Button */}
      <div className="d-flex justify-content-center mt-5">
        <button
          onClick={onLogout}
          className="btn btn-danger"
          style={{
            width: '200px',
            padding: '10px 0',
            fontSize: '18px',
            borderRadius: '50px',
          }}
        >
          <i className="bi bi-box-arrow-right me-2"></i> Logout
        </button>
      </div>
    </div>
    
  );
  
};

export default HomeTeacher;
