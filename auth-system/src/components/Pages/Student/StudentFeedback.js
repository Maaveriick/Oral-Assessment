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
    <div className="container mt-4">
      <h1 className="mb-4">Student Feedback</h1>
      {error && <div className="alert alert-danger">Error: {error}</div>}
      <div className="overflow-auto">
        <table ref={tableRef} className="table table-bordered table-striped">
          <thead>
            <tr>
              <th>Topic ID</th>
              <th>Attempt Count</th>
              <th>Feedback</th>
              <th>Teacher</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((attempt, index) => (
              <tr key={index}>
                <td>{attempt.topic_id}</td>
                <td>{attempt.attempt_count}</td>
                <td>{attempt.feedback_text}</td>
                <td>{attempt.teacher_username}</td>
                <td>
                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      navigate(`/view-feedback/${username}/${attempt.topic_id}/${attempt.attempt_count}`)
                    }
                  >
                    View Feedback
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentFeedback;
