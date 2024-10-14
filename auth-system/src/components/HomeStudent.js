import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const HomeStudent = ({ username, onLogout }) => {
  return (
    <div className="container-fluid vh-100 d-flex flex-column align-items-center justify-content-center" style={{ backgroundColor: '#f5f5f5' }}>
      <h1>Welcome, {username}!</h1>
      <button onClick={onLogout} className="btn btn-primary" style={{ marginTop: '20px' }}>
        Logout
      </button>
    </div>
  );
};

export default HomeStudent;
