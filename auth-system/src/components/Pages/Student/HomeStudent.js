import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS

const HomeStudent = ({ username, onLogout }) => {
  const navigate = useNavigate();

  // Log the username when the component renders
  useEffect(() => {
    console.log('Signed in as:', username);
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
                  <button className="btn btn-outline-secondary w-100 mb-2" onClick={() => navigate('/feedback')}>
                    View Feedback
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
              <h5 className="card-title">Announcement</h5>
              <p className="card-text">
                Stay tuned for the upcoming oral assessment schedule! More details will be shared soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeStudent;
