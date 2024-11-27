import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS

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
    <div className="container mt-5">
      <h2 className="text-center mb-4">Register</h2>
      <form onSubmit={handleSubmit} className="border p-4 rounded">
        <div className="form-group mb-3">
          <label>Username:</label>
          <input
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group mb-3">
          <label>Email:</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group mb-3">
          <label>Password:</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* Role Selection */}
        <div className="form-group mb-3">
          <label>Role:</label>
          <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="Student">Student</option>
            <option value="Teacher">Teacher</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        {error && <p className="text-danger">{error}</p>}

        <button type="submit" className="btn btn-primary w-100">Register</button>
      </form>

      {/* Button Container for Forgot Password and Back to Home */}
      <div className="d-flex justify-content-between mt-3">
        {/* Button to navigate to Forgot Password */}
        <button className="btn btn-link p-0" onClick={handleForgotPassword}>
          Forgot Password?
        </button>

        {/* Back to Home Button */}
        <Link to="/" className="btn btn-link p-0">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default Register;
