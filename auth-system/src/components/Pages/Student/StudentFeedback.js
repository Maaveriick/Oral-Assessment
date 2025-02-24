import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import $ from 'jquery';
import 'datatables.net';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const StudentFeedback = ({ username }) => {
  const [attempts, setAttempts] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const tableRef = useRef(null);

  // Log username to console
  useEffect(() => {
    console.log('Signed in as:', username);
  }, [username]);

  // Fetch data
  const fetchAttempts = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/student/attempts/${username}`);
      setAttempts(response.data);
    } catch (err) {
      console.error('Error fetching student attempts:', err);
      setError(err.message);
    }
  };

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

  // Fetch attempts on component load
  useEffect(() => {
    fetchAttempts();
  }, []);

  return (
    
      <div className="container">
    {/* Header */}
    <header className="header">
      <nav className="nav">
        <div className="logo">OralAssessment</div>
        <div>
          <a href="/homestudent">Home</a>
        </div>
      </nav>
    </header>

      {/* Main Content */}
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="card shadow-lg border-0">
              <div className="card-header bg-primary text-white text-center">
                <h3>Feedback</h3>
              </div>
              <div className="card-body">
                {error && <div className="alert alert-danger">Error: {error}</div>}
                <div className="table-responsive">
                  <table
                    ref={tableRef}
                    className="table table-hover table-striped table-bordered align-middle"
                  >
                    <thead className="bg-light">
                      <tr>
                        <th>Topic ID</th>
                        <th>Attempt Count</th>
                        <th>Teacher</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attempts.map((attempt, index) => (
                        <tr key={index}>
                          <td>{attempt.topic_id}</td>
                          <td>{attempt.attempt_count}</td>
                          <td>{attempt.teacher_username}</td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() =>
                                navigate(
                                  `/studentviewfeedback/${username}/${attempt.topic_id}/${attempt.attempt_count}`
                                )
                              }
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="footer">
          <div className="footer-extra">Additional Information</div>
          <div>&copy; 2025 OralAssessment. All rights reserved.</div>
        </footer>
    </div>
  );
};

export default StudentFeedback;
