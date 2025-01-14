import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import { Card, Button } from 'react-bootstrap'; // Use Card and Button from Bootstrap

const HomeTeacher = ({ username, onLogout }) => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Signed in as:', username);
  }, [username]);

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
              <Card.Title className="text-white h5">Create Assignment</Card.Title>
              <Button
                variant="primary"
                className="w-100 mt-3"
                onClick={() => navigate('/crud-topic')}
              >
                <i className="bi bi-file-earmark-plus me-2"></i> Create Topic
              </Button>
            </Card.Body>
          </Card>
        </div>

        {/* Card 2 */}
        <div className="col-12 col-md-4 mb-4 d-flex">
          <Card className="shadow-lg border-primary h-100 w-100">
            <Card.Body className="text-center p-4">
              <i className="bi bi-bar-chart-line mb-3" style={{ fontSize: '50px', color: '#fff' }}></i>
              <Card.Title className="text-white h5">Track Student Progress</Card.Title>
              <Button
                variant="primary"
                className="w-100 mt-3"
                onClick={() => navigate('/class')}
              >
                <i className="bi bi-bar-chart-line me-2"></i> View Student's Progress
              </Button>

              <Button
                variant="primary"
                className="w-100 mt-3"
                onClick={() => navigate('/performance-management')}
              >
                <i className="bi bi-bar-chart-line me-2"></i> Performance Management System
              </Button>
              
            </Card.Body>
          </Card>
        </div>

        {/* Card 3 */}
        <div className="col-12 col-md-4 mb-4 d-flex">
                  <Card className="shadow-lg border-primary h-100 w-100">
                    <Card.Body className="text-center p-4">
                      <i className="bi bi-bar-chart-line mb-3" style={{ fontSize: '50px', color: '#fff' }}></i>
                      <Card.Title className="text-white h5">CreateAnnouncement</Card.Title>
                      <Button
                        variant="primary"
                        className="w-100 mt-3"
                        onClick={() => navigate('/teacher-classes')}
                      >
                        <i className="bi bi-bar-chart-line me-2"></i> Create Announcement
                      </Button>
                    </Card.Body>
                  </Card>
                </div>   

                 {/* Card 4 */}
        <div className="col-12 col-md-4 mb-4 d-flex">
                  <Card className="shadow-lg border-primary h-100 w-100">
                    <Card.Body className="text-center p-4">
                      <i className="bi bi-bar-chart-line mb-3" style={{ fontSize: '50px', color: '#fff' }}></i>
                      <Card.Title className="text-white h5">Rubrics</Card.Title>
                      <Button
                        variant="primary"
                        className="w-100 mt-3"
                        onClick={() => navigate('/rubricsTeacher')}
                      >
                        <i className="bi bi-bar-chart-line me-2"></i> Rubrics
                      </Button>
                      <Button
                        variant="primary"
                        className="w-100 mt-3"
                        onClick={() => navigate('/crud-rubric')}
                      >
                        <i className="bi bi-bar-chart-line me-2"></i> CRUD Rubrics
                      </Button>
                    </Card.Body>
                  </Card>
                </div>   
      </div>

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
