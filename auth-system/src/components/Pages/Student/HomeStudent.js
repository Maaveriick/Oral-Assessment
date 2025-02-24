import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HomeStudent.css';  // Import the CSS file
import speaking from './speaking.jpg';

const HomeStudent = ({ username, onLogout }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch announcements based on the username (student)
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/student/announcements/${username}`);
        setAnnouncements(response.data);  // Store the fetched announcements
        setLoading(false);
      } catch (err) {
        console.error('Error fetching announcements:', err);
        setError('Error fetching announcements');
        setLoading(false);
      }
    };

    if (username) {
      fetchAnnouncements();
    }
  }, [username]);

  return (
    <div className="container-fluid">
      {/* Header */}
      <header className="header">
        <div className="nav">
          <div className="logo-container">
            <img src="logo.jpg" alt="Website Logo" id="logo" />
          </div>
          <nav>
            <a href="homestudent">Home</a>
            <a href="#logout" onClick={onLogout} className="logout">Logout</a>
          </nav>
        </div>
        <h1>Welcome, {username}!</h1>
        <h4>Your Student Portal</h4>
      </header>

     {/* Main content area */}
      <div className="row">
        {/* Sidebar */}
        <div className="col-lg-4 col-md-5 col-12 p-3" style={{ minHeight: '80vh' }}>
          <div className="sidebar-container"> {/* Outer Card Container */}
            <h5 className="content-header">Content</h5> {/* Content header */}
            <div className="sidebar">
              <div className="sidebar-button">
                <button onClick={() => navigate('/oral-assessment')} className="btn">
                  <img src={speaking} alt="Oral Assessment" className="img-fluid rounded mb-3" />
                  <h3>Oral Assessment</h3>
                  <p>Access the rubric management page to create and manage rubrics.</p>
                </button>
              </div>
              <div className="sidebar-button">
                <button onClick={() => navigate('/student-feedback')} className="btn">
                  <img src={speaking} alt="Feedback" className="img-fluid rounded mb-3" />
                  <h3>Feedback</h3>
                  <p>View your performance feedback.</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="col-lg-8 col-md-7 col-12 p-3">
          <div className="card announcement-card">
            <div className="card-body">
              <h5 className="card-title">Announcements</h5>
              {loading ? (
                <p>Loading announcements...</p>
              ) : error ? (
                <p>{error}</p>
              ) : announcements.length === 0 ? (
                <p>No announcements found.</p>
              ) : (
                announcements.map((announcement) => (
                  <div key={announcement.id} className="announcement-card">
                    <div className="card-body">
                      <h5 className="card-title">{announcement.title}</h5>
                      <p className="card-text">{announcement.content}</p>
                      <small className="text-muted">Posted on {new Date(announcement.date_posted).toLocaleString()}</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2025 Student Learning Space. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default HomeStudent;
