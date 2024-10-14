import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomeTeacher = ({ username, onLogout }) => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <h1>Welcome, {username}!</h1>
      <h2>What Would You Like To Do Today?</h2>
      <div style={styles.buttonContainer}>
        <button style={styles.button} onClick={() => navigate('/crud-topic')}>
          CRUD Topic
        </button>
        <button style={{ ...styles.button, marginLeft: '10px' }}>Student Attempts</button>
      </div>
      <button onClick={onLogout} style={styles.logoutButton}>Logout</button>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh', // Ensures the container fills the entire viewport height
    backgroundColor: '#f5f5f5',
    position: 'relative', // Add relative positioning for absolute elements
  },
  buttonContainer: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '20px',
  },
  button: {
    width: '150px', // Ensures both buttons have the same width
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    textAlign: 'center',
    transition: 'background-color 0.3s',
  },
  logoutButton: {
    position: 'absolute',
    bottom: '20px',
    left: '850px',
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    backgroundColor: '#ff4d4f',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    transition: 'background-color 0.3s',
    width: 'auto', // Allow the width to be determined by content
  },
};

export default HomeTeacher;
