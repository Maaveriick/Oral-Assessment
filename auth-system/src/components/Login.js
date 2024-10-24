// Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS

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
    <div className="container mt-5">
      <h2 className="mb-4">Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email:</label>
          <input
            type="email"
            id="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password:</label>
          <input
            type="password"
            id="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Role Dropdown */}
        <div className="mb-3">
          <label htmlFor="role" className="form-label">Role:</label>
          <select
            id="role"
            className="form-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="Student">Student</option>
            <option value="Teacher">Teacher</option>
          </select>
        </div>

        {error && <div className="alert alert-danger">{error}</div>} {/* Display error message */}

        <button type="submit" className="btn btn-primary w-100">Login</button>
      </form>

      {/* Button Container for Forgot Password and Back to Home */}
      <div className="d-flex justify-content-between mt-4">
        {/* Button to navigate to Forgot Password */}
        <button className="btn btn-link" onClick={handleForgotPassword}>
          Forgot Password?
        </button>

        {/* Back to Home Button */}
        <Link to="/" className="btn btn-link">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default Login;
