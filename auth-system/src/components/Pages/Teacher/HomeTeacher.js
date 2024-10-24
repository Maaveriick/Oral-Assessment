import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS

const HomeTeacher = ({ username, onLogout }) => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Signed in as:', username);
  }, [username]);

  return (
    <div className="container text-center d-flex flex-column justify-content-center align-items-center min-vh-100">
      <h1>Welcome, {username}!</h1>
      <h2 className="mt-3">What Would You Like To Do Today?</h2>
      
      <div className="d-flex mt-4">
        <button
          className="btn btn-primary mx-2"
          style={{ width: '150px' }} // Same width for buttons
          onClick={() => navigate('/crud-topic')}
        >
          CRUD Topic
        </button>
        <button
          className="btn btn-primary mx-2"
          style={{ width: '150px' }} // Same width for buttons
        >
          Student Attempts
        </button>
      </div>

      <button
        onClick={onLogout}
        className="btn btn-danger position-absolute"
        style={{ bottom: '20px', left: '50%', transform: 'translateX(-50%)' }} // Center logout button
      >
        Logout
      </button>
    </div>
  );
};

export default HomeTeacher;
