import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import $ from 'jquery';
import 'datatables.net';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const StudentDetails = () => {
  const { id } = useParams(); // Extract student ID from the URL
  const [student, setStudent] = useState(null);
  const [topics, setTopics] = useState([]);
  const tableRef = useRef(null);
  const navigate = useNavigate();

  // Fetch student details
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/students/${id}`);
        setStudent(response.data);
      } catch (error) {
        console.error('Error fetching student details:', error);
      }
    };

    fetchStudent();
  }, [id]);

  // Fetch topics
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await axios.get('http://localhost:5000/topics');
        setTopics(response.data);
      } catch (error) {
        console.error('Error fetching topics:', error);
      }
    };

    fetchTopics();
  }, []);

  // Initialize DataTable
  useEffect(() => {
    if (topics.length) {
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
  }, [topics]);

  // Log the logged-in user details to the console
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user')); // Retrieve user data from localStorage
    if (user) {
      console.log('Logged in as:', user.username); // Log the logged-in user's username to the console
    } else {
      console.log('No user logged in');
    }
  }, []);

  if (!student) {
    return <div>Loading student details...</div>;
  }

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div
        style={{
          backgroundColor: '#343a40', // Dark background
          color: 'white', // White text
          width: '200px',
          padding: '15px',
          height: '100vh', // Full height
        }}
      >
        <h5>MyApp</h5>
        <ul className="nav flex-column">
          <li className="nav-item">
            <button
              className="nav-link btn btn-link"
              style={{ color: 'white' }} // White text for link
              onClick={() => navigate('/')} // Navigate to home on click
            >
              Home
            </button>
          </li>
          <li className="nav-item">
            <button
              className="nav-link btn btn-link"
              style={{ color: 'white' }} // White text for link
              onClick={() => navigate('/crud-feedback')} // Navigate to feedback list
            >
              Student List
            </button>
          </li>
          {/* Add more nav items as needed */}
          <li className="nav-item">
            <button
              className="nav-link btn btn-link"
              style={{ color: 'white' }} // White text for link
              onClick={() => navigate('/crud-topic')} // Navigate to feedback list
            >
              Topic List
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-fill p-4">
        <h1>Student Details</h1>
        <h2>
          <strong>ID:</strong> {student.id}
        </h2>
        <h2>
          <strong>Username:</strong> {student.username}
        </h2>

        <hr />

        <h2>Topics</h2>
        <div className="overflow-auto">
          <table
            id="topicsTable"
            ref={tableRef}
            className="table table-bordered table-striped"
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>Topic Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {topics.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center">
                    No topics available.
                  </td>
                </tr>
              ) : (
                topics.map((topic) => (
                  <tr key={topic.id}>
                    <td>{topic.id}</td>
                    <td>{topic.topicname}</td>
                    <td>
                      <Link
                        to={`/attempts/${student.username}/${topic.id}`}
                        className="btn btn-primary"
                      >
                        View Attempts
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentDetails;
