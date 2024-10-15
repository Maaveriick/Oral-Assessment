// Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css'; // Import the CSS file

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student'); // New state for role
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });
  
      if (response.ok) {
        const data = await response.json();
        const { username, role } = data;
  
        // Store the username in local storage
        localStorage.setItem('username', username); // Save username
  
        onLoginSuccess(username, role); // Pass both username and role to parent
  
        // Navigate based on the role
        if (role === 'Student') {
          navigate('/homestudent');
        } else if (role === 'Teacher') {
          navigate('/hometeacher');
        }
      } else {
        setError('Invalid login credentials');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to login');
    }
  };

  // Handle forgot password navigation
  const handleForgotPassword = () => {
    navigate('/forgot-password'); // Navigate to Forgot Password page
  };

  return (
    <div className="container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Role Dropdown */}
        <div>
          <label>Role:</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="Student">Student</option>
            <option value="Teacher">Teacher</option>
          </select>
        </div>

        {error && <p className="error">{error}</p>} {/* Display error message */}
        <button type="submit">Login</button>
      </form>

      {/* Button Container for Forgot Password and Back to Home */}
      <div style={styles.buttonContainer}>
        {/* Button to navigate to Forgot Password */}
        <button className="forgot-password-button" onClick={handleForgotPassword} style={styles.button}>
          Forgot Password?
        </button>

        {/* Back to Home Button */}
        <Link to="/" style={styles.button}>
          Back to Home
        </Link>
      </div>
    </div>
  );
};

// Optional styles for the buttons and container
const styles = {
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '20px',
  },
  button: {
    marginRight: '10px', // Space between buttons
    padding: '10px 20px',
    backgroundColor: '#1E2761',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '5px',
    border: 'none', // Remove default button border
  },
};

export default Login;
