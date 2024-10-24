import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const { token } = useParams(); // Extract token from URL params
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      setMessage(data.message);

      if (response.ok) {
        // Navigate to login page after successful reset
        navigate('/login');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Failed to reset password.');
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="newPassword" className="form-label">New Password:</label>
          <input
            type="password"
            id="newPassword"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="confirmPassword" className="form-label">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            className="form-control"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">Reset Password</button>
      </form>

      {message && <div className="alert alert-info mt-3">{message}</div>} {/* Display success/error message */}

      {/* Back to Home Button */}
      <Link to="/" className="btn btn-secondary mt-4">
        Back to Home
      </Link>
    </div>
  );
};

export default ResetPassword;
