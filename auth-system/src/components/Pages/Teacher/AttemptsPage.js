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
  const [studentId, setStudentId] = useState(null); // New state to store student.id
  const tableRef = useRef(null);
  const navigate = useNavigate();

  // Log the signed-in user from localStorage
  useEffect(() => {
    const loggedInUser = localStorage.getItem('username');
    console.log('Logged in user:', loggedInUser);
  }, []); // Log on component mount

  // Fetch attempts and student.id on mount
  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const response = await axios.post('http://localhost:5000/attempts', {
          username,
          topicId,
        });

        setAttempts(response.data); // Save the attempts
        if (response.data.length > 0) {
          // Save student id from the first attempt
          setStudentId(response.data[0].id);
        }
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

  // Delete feedback using attempt_count
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

  return (
    <div className="container">
    {/* Header */}
      <header className="header">
        <nav className="nav">
          <div className="logo">OralAssessment</div>
          <div>
            <a href="/hometeacher">Home</a>
            <a href="/crud-topic">Topics</a>
            <a href="/class">Classes</a>
          </div>
        </nav>
      </header>

      {/* Main content */}
      <div className="flex-fill p-4">
        <h1>Attempts for {username} on Topic ID: {topicId}</h1>

        {studentId && <p>Student ID: {studentId}</p>} {/* Display Student ID */}

        <table id="attemptsTable" ref={tableRef} className="table table-bordered table-striped">
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
                        className="btn btn-success"
                        style={{ width: '140px' }}
                        onClick={() =>
                          navigate(`/create-feedback/${username}/${topicId}/${attempt.attempt_count}`)
                        }
                      >
                        Create Feedback
                      </button>
                      
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
                        className="btn btn-primary"
                        style={{ width: '100px' }}
                        onClick={() =>
                          navigate(`/view-feedback/${username}/${topicId}/${attempt.attempt_count}`)
                        }
                      >
                        View
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
       {/* Footer */}
     <footer className="footer">
      <div className="footer-extra">Additional Information</div>
      <div>&copy; 2025 OralAssessment. All rights reserved.</div>
    </footer>
    </div>
  );
};

export default AttemptsPage;
