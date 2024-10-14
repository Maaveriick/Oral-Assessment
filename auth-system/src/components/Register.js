import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Register.css'; // Import the CSS file

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student'); // Add state for role
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Use navigate for redirection

  const validatePassword = (password) => {
    // Regular expression for password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if the password meets the criteria
    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters long, contain at least 1 uppercase letter, and 1 lowercase letter.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, role }), // Include role
      });

      if (response.ok) {
        // If registration is successful, navigate to the login page
        navigate('/login');
      } else {
        setError('Failed to register. Try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to register. Try again.');
    }
  };

  // Handle forgot password navigation
  const handleForgotPassword = () => {
    navigate('/forgot-password'); // Navigate to Forgot Password page
  };

  return (
    <div className="container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
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

        {/* Role Selection */}
        <div>
          <label>Role:</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="Student">Student</option>
            <option value="Teacher">Teacher</option>
          </select>
        </div>
        {error && <p className="error">{error}</p>} {/* Use the error class */}
        <button type="submit">Register</button>
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

export default Register;
