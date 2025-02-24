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
      {/* Footer */}
     <footer className="footer">
      <div className="footer-extra">Additional Information</div>
      <div>&copy; 2025 OralAssessment. All rights reserved.</div>
    </footer>
    </div>
  );
};

export default FeedbackList;