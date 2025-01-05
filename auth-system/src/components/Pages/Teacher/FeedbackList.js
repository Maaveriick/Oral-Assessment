import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Use 'useLocation' to read query params
import axios from 'axios';
import $ from 'jquery';
import 'datatables.net';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaChalkboardTeacher} from 'react-icons/fa'; // Add icons for visual appeal

const FeedbackList = () => {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);
  const tableRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation(); // Get query params

  // Extract classId from query parameters
  const queryParams = new URLSearchParams(location.search);
  const classId = queryParams.get('classId');


  // Initialize DataTable for student list
  useEffect(() => {
    if (students.length) {
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
  }, [students]);
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/classes/${classId}`);
        
        if (response.data && response.data.students) {
          let students = response.data.students;
          
          // Check if students is a string and needs to be parsed
          if (typeof students === 'string') {
            students = JSON.parse(students);
          }
  
          setStudents(students); // Set students in state
        } else {
          setError('No students found for this class.');
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        setError('Error fetching students. Please try again later.');
      }
    };
  
    if (classId) {
      fetchStudents();
    } else {
      setError('No class selected.');
    }
  }, [classId]); // Only re-run the effect when classId changes
  
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
                                  style={{ background: 'none', border: 'none' }}
                                  onClick={() => navigate('/crud-topic')} // Navigate to CRUD Topic
                                >
                                  <FaChalkboardTeacher className="me-2" /> Topic
                                </button>
                              </li>
                    
                              <li className="nav-item">
                                <button
                                  className="nav-link text-white"
                                  style={{ background: 'none', border: 'none' }}
                                  onClick={() => navigate('/class')} // Navigate to Classes page
                                >
                                  <FaChalkboardTeacher className="me-2" /> Classes
                                </button>
                              </li>
                    
                              <li className="nav-item">
                                <button
                                  className="nav-link text-white"
                                  style={{ background: 'none', border: 'none' }}
                                  onClick={() => navigate('/rubricsTeacher')} // Navigate to Classes page
                                >
                                  <FaChalkboardTeacher className="me-2" /> Rubrics
                                </button>
                              </li>
          {/* Additional links can be added here */}
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-fill p-4">
        <h1 className="mb-4">Students List</h1>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="overflow-auto">
          <table
            id="studentsTable"
            ref={tableRef}
            className="table table-bordered table-striped"
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FeedbackList;