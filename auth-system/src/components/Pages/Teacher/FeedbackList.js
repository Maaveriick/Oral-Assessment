import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import $ from 'jquery';
import 'datatables.net';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const FeedbackList = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const navigate = useNavigate();
  const tableRef = useRef(null);

  // Function to fetch topics
  const fetchFeedbacks = async () => {
    try {
      const response = await axios.get('http://localhost:5000/feedbacks');
      setFeedbacks(response.data);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    }
  };

  // Initialize DataTable
  const initializeDataTable = () => {
    if ($.fn.DataTable.isDataTable(tableRef.current)) {
      $(tableRef.current).DataTable().destroy();
    }
    $(tableRef.current).DataTable({
      paging: true,
      searching: true,
      ordering: true,
      info: true,
    });
  };

  useEffect(() => {
    fetchFeedbacks(); // Fetch topics on component mount
  }, []);

  useEffect(() => {
    if (feedbacks.length) {
      initializeDataTable();
    }
  }, [feedbacks]);

  const deleteFeedback = async (id) => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this feedback?');
      if (confirmDelete) {
        await axios.delete(`http://localhost:5000/feedbacks/${id}`);
        setFeedbacks((prevFeedbacks) => prevFeedbacks.filter((feedback) => feedback.id !== id));
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex flex-column">
      <h1 className="mb-4">Feedback List</h1>
      <div className="mb-3">
        <button className="btn btn-success" onClick={() => navigate('/create-feedback')}>
          Create New Feedback
        </button>
      </div>
      <div className="overflow-auto">
        <table id="topicTable" ref={tableRef} className="table table-bordered">
          <thead>
            <tr>
              <th>ID</th>
              <th>Student Name</th>
              <th>Date Attempted</th>
              <th>Attempts</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">
                  No feedbacks available.
                </td>
              </tr>
            ) : (
              feedbacks.map((feedback) => (
                <tr key={feedback.id}>
                  <td>{feedback.id || 'N/A'}</td>
                  <td>{feedback.studentname || 'N/A'}</td>
                  <td>
                    {feedback.dateattempted
                      ? new Date(feedback.dateattempted).toLocaleString() // Show date and time
                      : 'N/A'}
                  </td>
                  <td>{feedback.attempts || 'N/A'}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-primary"
                        style={{ width: '100px' }}
                        onClick={() => navigate(`/edit-feedback/${feedback.id}`)}
                      >
                        Edit
                      </button>

                      <button
                      className = "btn btn-warning"
                      style={{ width: '100px' }}
                      onClick={() => navigate(`/view-topic/${feedback.id}`)}
                      >
                      View
                      </button>

                      <button
                        className="btn btn-danger"
                        style={{ width: '100px' }}
                        onClick={() => deleteFeedback(feedback.id)}
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
    </div>
  );
};

export default FeedbackList;
