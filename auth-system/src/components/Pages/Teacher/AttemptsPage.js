import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import $ from 'jquery';
import 'datatables.net';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaChalkboardTeacher } from 'react-icons/fa'; // Add icons for visual appeal

const AttemptsPage = () => {
  const { username, topicId } = useParams();
  const [attempts, setAttempts] = useState([]);
  const tableRef = useRef(null);
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

  // Initialize DataTable
  useEffect(() => {
    if (attempts.length) {
      if ($.fn.DataTable.isDataTable(tableRef.current)) {
        $(tableRef.current).DataTable().destroy();
      }
      $(tableRef.current).DataTable({
        paging: true,
        searching: true,
        ordering: true,
        info: true,
      });
    }
  }, [attempts]);

  // Delete feedback using `attempt_count`
  const deleteFeedback = async (username, topicId, attempt_count) => {
    try {
      await axios.delete('http://localhost:5000/feedbacks', {
        data: { username, topicId, attempt_count },
      });

      // Update UI to reflect feedback deletion
      const updatedAttempts = attempts.map((attempt) =>
        attempt.attempt_count === attempt_count
          ? { ...attempt, feedbackExists: false }
          : attempt
      );

      setAttempts(updatedAttempts);

      // Show success popup
      alert('Feedback successfully deleted.');
    } catch (error) {
      console.error('Error deleting feedback:', error);
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
    <div className="d-flex">
      {/* Sidebar */}
      <div
        className="sidebar bg-dark text-white p-4"
        style={{ width: "250px", height: "100vh" }}
      >
        <h2
          className="text-center mb-4 cursor-pointer"
          onClick={() => navigate("/hometeacher")} // Navigate to HomeAdmin on click
          style={{ cursor: "pointer" }} // Optional: Adds cursor pointer to indicate it's clickable
        >
          Teacher Navigation
        </h2>

        <ul className="nav flex-column">
          {/* Sidebar links */}
          <li className="nav-item">
            <button
              className="nav-link text-white"
              style={{ background: "none", border: "none" }}
              onClick={() => navigate("/crud-topic")}
            >
              <FaChalkboardTeacher className="me-2" /> Topic
            </button>
          </li>

          <li className="nav-item">
            <button
              className="nav-link text-white"
              style={{ background: "none", border: "none" }}
              onClick={() => navigate("/class")}
            >
              <FaChalkboardTeacher className="me-2" /> Class
            </button>
          </li>
          {/* Additional links can be added here */}
        </ul>
      </div>

      {/* Main content */}
      <div className="flex-fill p-4">
        <h1>Attempts for {username} on Topic ID: {topicId}</h1>

        <table
          id="attemptsTable"
          ref={tableRef}
          className="table table-bordered table-striped"
        >
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
                        className="btn btn-warning"
                        style={{ width: '140px' }}
                        onClick={() =>
                          navigate(`/edit-feedback/${username}/${topicId}/${attempt.attempt_count}`)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-secondary"
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
                        style={{ width: '140px' }}
                        onClick={() => deleteFeedback(username, topicId, attempt.attempt_count)}
                      >
                        Delete Feedback
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttemptsPage;
