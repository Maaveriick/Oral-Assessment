import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage('Password reset link sent to your email');
        setError('');
      } else {
        setError('Failed to send password reset email. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to send password reset email. Please try again.');
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Forgot Password</h2>
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
        {message && <div className="alert alert-success">{message}</div>} {/* Display success message */}
        {error && <div className="alert alert-danger">{error}</div>} {/* Display error message */}
        <button type="submit" className="btn btn-primary w-100">Send Reset Link</button>
      </form>
    </div>
  );
};

export default ForgotPassword;
