import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

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
    <div className="container-fluid bg-light">
      {/* Header */}
      <div className="row bg-primary text-white p-3">
        <div className="col-12 text-center">
          <h1 className="mb-0">Welcome, {username}!</h1>
          <h4 className="mb-3">Your Student Portal</h4>
        </div>
      </div>

      {/* Main content area */}
      <div className="row">
        {/* Sidebar */}
        <div className="col-lg-4 col-md-5 col-12 p-3" style={{ minHeight: '80vh' }}>
          <div className="card shadow-sm" style={{ height: '50%' }}>
            <div className="card-body">
              <h5 className="card-title">Menu</h5>
              <ul className="list-unstyled">
                <li>
                  <button
                    className="btn btn-outline-primary w-100 mb-2"
                    onClick={() => navigate('/oral-assessment')}
                  >
                    Oral Assessment
                  </button>
                </li>
                <li>
                  <button className="btn btn-outline-primary w-100 mb-2" onClick={() => navigate('/student-feedback')}>
                    Feedback
                  </button>
                </li>
                <li>
                  <button
                    onClick={onLogout}
                    className="btn btn-danger w-100"
                    style={{
                      height: '40px',
                      fontSize: '15px',
                      borderRadius: '50px',
                      transition: 'transform 0.3s ease',
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="col-lg-8 col-md-7 col-12 p-3">
          <div className="card">
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
                  <div key={announcement.id} className="card mb-3">
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
    </div>
  );
};

export default HomeStudent;
