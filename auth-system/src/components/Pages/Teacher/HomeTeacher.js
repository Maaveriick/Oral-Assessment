import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Card, Button, Form, Modal } from 'react-bootstrap'; // Use Card, Button, Form, Modal from Bootstrap
import axios from 'axios';
import speaking from './speaking.jpg';
import './HomeTeacher.css';

const HomeTeacher = ({ username, onLogout }) => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState(null); 
  const [aiEnabled, setAiEnabled] = useState(false); 
  const [showSettingsModal, setShowSettingsModal] = useState(false); 
  
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/classes/teacher/${username}`);
        setClasses(response.data);
      } catch (err) {
        console.error('Error fetching classes:', err);
      }
    };
    fetchClasses();
  }, [username, navigate]);

  useEffect(() => {
    if (classId !== null) {
      const fetchClassStatus = async () => {
        try {
          const response = await fetch(`http://localhost:5000/classes/${classId}`);
          const classData = await response.json();
          setAiEnabled(classData.ai_enabled);
        } catch (error) {
          console.error("Failed to fetch class status:", error);
        }
      };
      fetchClassStatus();
    }
  }, [classId]);

  const handleSwitchChange = async (e, classId) => {
    const newStatus = e.target.checked;

    setClasses((prevClasses) => 
      prevClasses.map((classItem) => 
        classItem.id === classId 
          ? { ...classItem, ai_enabled: newStatus }
          : classItem
      )
    );

    try {
      const response = await fetch(`http://localhost:5000/classes/teacher/${username}/${classId}/ai-toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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

  const handleShowModal = () => setShowSettingsModal(true);
  const handleCloseModal = () => setShowSettingsModal(false);

  return (
    <div className="container">
      {/* Header Section */}
      <header className="header">
        <div className="nav">
        <div className="logo">OralAssessment</div>
        <h1>Welcome, {username}!</h1>
          <nav>
            <a href="/hometeacher">Home </a>
            <a href="crud-topic">Topic</a>
            <a href="class">Classes</a>
            <a href="#logout" onClick={onLogout} className="logout">Logout</a>
            {/* Settings Button */}
            <button 
              className="settings" 
              onClick={handleShowModal} // Show AI settings modal
            >
              Settings
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <h1>Welcome to the Oral Assessment</h1>
        <p>Optimising Oral Assesments To Be Hassle-Free And Fun</p>
      </section>

      {/* Main Content Section */}
      <section className="features">
         {/* Card 1 */}
      <div 
      className="feature"
      onClick={() => navigate('/crud-topic')} // This will trigger navigation to /crud-topic
      style={{ cursor: 'pointer' }} // Makes the div look clickable
      >
      <img src={speaking} alt="Feature 1" className="img-fluid rounded mb-3" />
      <h3>Create Assignment</h3>
      <p>Directs to the "Create Topic" page to create new assignments and topics.</p>
      </div>
       {/* Card 2 */}
       <div 
      className="feature"
      onClick={() => navigate('/class')} // This will trigger navigation to /crud-topic
      style={{ cursor: 'pointer' }} // Makes the div look clickable
      >
      <img src={speaking} alt="Feature 1" className="img-fluid rounded mb-3" />
      <h3>Track Student Progress</h3>
      <p>View the overall progress and performance of students in your classes.</p>
      </div>
       {/* Card 3 */}
       <div 
      className="feature"
      onClick={() => navigate('/performance-management')} // This will trigger navigation to /crud-topic
      style={{ cursor: 'pointer' }} // Makes the div look clickable
      >
      <img src={speaking} alt="Feature 1" className="img-fluid rounded mb-3" />
      <h3>Performance Management System</h3>
      <p>Manage student performance with a comprehensive performance management system.</p>
      </div>
      </section>
       {/* Card 4 */}
       <section className="features">
       <div 
      className="feature"
      onClick={() => navigate('/teacher-classes')} // This will trigger navigation to /crud-topic
      style={{ cursor: 'pointer' }} // Makes the div look clickable
      >
      <img src={speaking} alt="Feature 1" className="img-fluid rounded mb-3" />
      <h3>Create Announcement</h3>
      <p>Redirects you to the page where you can create announcements for your students.</p>
      </div>
       {/* Card 5 */}
       <div 
      className="feature"
      onClick={() => navigate('/rubricsTeacher')} // This will trigger navigation to /crud-topic
      style={{ cursor: 'pointer' }} // Makes the div look clickable
      >
      <img src={speaking} alt="Feature 1" className="img-fluid rounded mb-3" />
      <h3>Rubrics</h3>
      <p>Access the rubric management page to create and manage rubrics.</p>
      </div>
       {/* Card 6 */}
       <div 
      className="feature"
      onClick={() => navigate('/crud-rubric')} // This will trigger navigation to /crud-topic
      style={{ cursor: 'pointer' }} // Makes the div look clickable
      >
      <img src={speaking} alt="Feature 1" className="img-fluid rounded mb-3" />
      <h3>CRUD Rubrics</h3>
      <p>Create, update, or delete rubrics for your assignments.</p>
      </div>
      </section>

      {/* About Us Section */}
      <section className="about-us">
        <h2>About Us</h2>
        <p>Our vision is to create an online webpage that can boost students elonquent skills while alievating teachers workload</p>
      </section>

      {/* Footer Extra Section */}
      <section className="footer-extra">
        <p>Contact Us: oralassessment@hotmail.com</p>
      </section>

      {/* Footer Section */}
      <footer className="footer">
        <p>&copy; 2025 Student Learning Space | All Rights Reserved</p>
      </footer>

      {/* Modal for AI Settings */}
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
    </div>
  );
};

export default HomeTeacher;
