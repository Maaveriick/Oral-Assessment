import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AttemptsPage = () => {
  const { username, topicId } = useParams();
  const [attempts, setAttempts] = useState([]);
  const navigate = useNavigate();

  // Fetch attempts on mount
  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const response = await axios.post('http://localhost:5000/attempts', {
          username,
          topicId,
        });
        setAttempts(response.data); // Ensure API returns the correct data structure
      } catch (error) {
        console.error('Error fetching attempts:', error);
      }
    };

    fetchAttempts();
  }, [username, topicId]);

  // Delete an attempt using `attempt_count`
  const deleteAttempt = async (attempt_count) => {
    try {
      await axios.delete(`http://localhost:5000/attempts/${attempt_count}`);
      setAttempts(attempts.filter((attempt) => attempt.attempt_count !== attempt_count));
    } catch (error) {
      console.error('Error deleting attempt:', error);
    }
  };

  // Log the logged-in user details to the console
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user')); // Retrieve user data from localStorage
    if (user) {
      console.log('Logged in as:', user.username); // Log the logged-in user's username to the console
    } else {
      console.log('No user logged in');
    }
  }, []);

  return (
    <div className="container mt-5">
      <h1>Attempts for {username} on Topic ID: {topicId}</h1>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Attempt Number</th>
            <th>Date and Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {attempts.length === 0 ? (
            <tr>
              <td colSpan="3" className="text-center">
                No attempts found.
              </td>
            </tr>
          ) : (
            attempts.map((attempt) => (
              <tr key={attempt.attempt_count}>
                <td>{attempt.attempt_count}</td>
                <td>{new Date(attempt.datetime).toLocaleString()}</td>
                <td>
                  <div className="d-flex gap-2">
                  <button
                        className="btn btn-secondary"
                        style={{ width: '140px' }}
                        onClick={() =>
                          navigate(`/edit-feedback/${username}/${topicId}/${attempt.attempt_count}`)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-warning"
                        style={{ width: '100px' }}
                        onClick={() =>
                          navigate(`/view-feedback/${username}/${topicId}/${attempt.attempt_count}`)
                        }
                      >
                        View
                      </button>

                    <button
                      className="btn btn-success"
                      style={{ width: '140px' }}
                      onClick={() =>
                        navigate(`/create-feedback/${username}/${topicId}/${attempt.attempt_count}`)
                      }
                    >
                      Create Feedback
                    </button>

                    <button
                      className="btn btn-danger"
                      style={{ width: '100px' }}
                      onClick={() => deleteAttempt(attempt.attempt_count)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AttemptsPage;
