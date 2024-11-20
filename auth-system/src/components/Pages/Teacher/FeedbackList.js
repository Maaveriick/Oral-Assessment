import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import $ from 'jquery';
import 'datatables.net';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const FeedbackList = () => {
  const [students, setStudents] = useState([]);
  const tableRef = useRef(null);
  const navigate = useNavigate();

  // Fetch the logged-in user's data from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user')); // Retrieve user data from localStorage
    if (user) {
      console.log('Logged in as:', user.username); // Log the logged-in user's username to the console
    } else {
      console.log('No user logged in');
    }
  }, []); // Empty dependency array means this effect runs only once when the component mounts

  // Function to fetch students
  const fetchStudents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/students');
      console.log('Fetched students:', response.data);  // Log the response
      setStudents(response.data);
      localStorage.setItem('students', JSON.stringify(response.data)); // Store students in localStorage
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  // Initialize DataTable
  const initializeDataTable = () => {
    if (tableRef.current) {
      // Destroy the DataTable if it exists before reinitializing
      if ($.fn.DataTable.isDataTable(tableRef.current)) {
        $(tableRef.current).DataTable().clear().destroy();
      }
      // Initialize the DataTable
      $(tableRef.current).DataTable({
        paging: true,
        searching: true,
        ordering: true,
        info: true,
      });
    }
  };

  // Load students from localStorage or fetch from the API
  useEffect(() => {
    const savedStudents = localStorage.getItem('students');
    if (savedStudents) {
      setStudents(JSON.parse(savedStudents)); // Load from localStorage if data exists
    } else {
      fetchStudents(); // Fetch from API if no data in localStorage
    }
  }, []);

  useEffect(() => {
    if (students.length) {
      initializeDataTable();
    }
  }, [students]); // Only re-initialize when the students data changes

  return (
    <div className="container-fluid vh-100 d-flex">
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
        <h1 className="mb-4">Students List</h1>
        <div className="overflow-auto">
          <table id="studentTable" ref={tableRef} className="table table-bordered">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center">
                    No students available.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.id}</td>
                    <td>{student.username}</td>
                    <td>
                      <button
                        className="btn btn-primary"
                        onClick={() => navigate(`/student-details/${student.id}`)}
                      >
                        View Details
                      </button>
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

export default FeedbackList;
