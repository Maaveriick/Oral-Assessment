import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in from localStorage
    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
      const { role } = JSON.parse(storedUser);
      // Redirect based on the role of the user (Student/Teacher)
      if (role === 'Student') {
        navigate('/homestudent');
      } else if (role === 'Teacher') {
        navigate('/hometeacher');
      }
    }
  }, [navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.oval}>
        <h1 style={styles.title}>Oral Assessment</h1>
      </div>
      <h2>Welcome</h2>
      <div style={styles.buttonContainer}>
        <Link to="/register" style={styles.button}>
          Register
        </Link>
        <Link to="/login" style={styles.button}>
          Login
        </Link>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f5f5f5',
  },
  oval: {
    backgroundColor: '#1E2761',
    borderRadius: '50%',
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    margin: 0,
  },
  buttonContainer: {
    marginTop: '20px',
  },
  button: {
    margin: '10px',
    padding: '10px 20px',
    backgroundColor: '#1E2761',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '5px',
  },
};

export default Home;
