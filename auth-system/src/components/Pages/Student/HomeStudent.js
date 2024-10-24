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
    <div className="container d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
      <div className="text-center">
        <h1 className="mb-4">Welcome, {username}!</h1>
        <h2 className="mb-5">What Would You Like To Do Today?</h2>
        <div className="d-flex justify-content-center mb-3">
          <button className="btn btn-primary mx-2" onClick={() => navigate('/oral-assessment')}>
            Oral Assessment
          </button>
          <button className="btn btn-secondary mx-2">Feedback</button>
        </div>
        <button className="btn btn-danger" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default HomeStudent;

