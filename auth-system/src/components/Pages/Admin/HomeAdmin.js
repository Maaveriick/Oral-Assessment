import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import { FaChalkboardTeacher, FaSignOutAlt, FaClipboardList, FaUsers } from 'react-icons/fa'; // Add FaUsers for Teacher List

const HomeAdmin = ({ username, onLogout }) => {
  const navigate = useNavigate();

  // Log the username when the component renders
  useEffect(() => {
    console.log('Signed in as:', username);
  }, [username]);

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className="sidebar bg-dark text-white p-4" style={{ width: '250px', height: '100vh' }}>
        <h2 className="text-center mb-4">Admin Dashboard</h2>
        <ul className="nav flex-column align-items-start">
          {/* Sidebar links */}
          <li className="nav-item">
            <button
              className="nav-link text-white"
              style={{ background: 'none', border: 'none' }}
              onClick={() => navigate('/crud-class')}
            >
              <FaChalkboardTeacher className="me-2" /> Manage Classes
            </button>
          </li>
          <li className="nav-item">
            <button
              className="nav-link text-white"
              style={{ background: 'none', border: 'none' }}
              onClick={() => navigate('/rubrics')}
            >
              <FaClipboardList className="me-2" /> Manage Rubrics
            </button>
          </li>
          <li className="nav-item">
            <button
              className="nav-link text-white"
              style={{ background: 'none', border: 'none' }}
              onClick={() => navigate('/teacherlist')}
            >
              <FaUsers className="me-2" /> Teacher List
            </button>
          </li>
          <li className="nav-item">
            <button
              className="nav-link text-white"
              style={{ background: 'none', border: 'none' }}
              onClick={() => navigate('/studentlist')}
            >
              <FaUsers className="me-2" /> Student List
            </button>
          </li>
        </ul>

        {/* Logout Button */}
        <div className="mt-auto">
          <button className="btn btn-danger w-100" onClick={onLogout}>
            <FaSignOutAlt className="me-2" /> Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container-fluid d-flex flex-column justify-content-center align-items-center vh-100 bg-light p-4">
        <div className="text-center w-100">
          <h1 className="mb-4 text-primary">Welcome, {username}!</h1>
          <h2 className="mb-5 text-muted">What Would You Like To Do Today?</h2>

          {/* Action Cards */}
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 mb-5">
            <div className="col">
              <div className="card shadow-sm">
                <div className="card-body text-center">
                  <FaChalkboardTeacher size={40} className="mb-3" />
                  <h5 className="card-title">Manage Classes</h5>
                  <p className="card-text">Create, update, and manage class details.</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate('/crud-class')}
                  >
                    Go to Classes
                  </button>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="card shadow-sm">
                <div className="card-body text-center">
                  <FaClipboardList size={40} className="mb-3" />
                  <h5 className="card-title">Manage Rubrics</h5>
                  <p className="card-text">Define and update rubrics for assessments.</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate('/rubrics')}
                  >
                    Go to Rubrics
                  </button>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="card shadow-sm">
                <div className="card-body text-center">
                  <FaUsers size={40} className="mb-3" />
                  <h5 className="card-title">Teacher List</h5>
                  <p className="card-text">View and manage the list of teachers.</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate('/teacherlist')}
                  >
                    Go to Teacher List
                  </button>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="card shadow-sm">
                <div className="card-body text-center">
                  <FaUsers size={40} className="mb-3" />
                  <h5 className="card-title">Student List</h5>
                  <p className="card-text">View and manage the list of students.</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate('/studentlist')}
                  >
                    Go to Student List
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeAdmin;