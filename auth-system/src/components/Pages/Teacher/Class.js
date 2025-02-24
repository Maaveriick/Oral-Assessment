import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import $ from 'jquery';
import 'datatables.net';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaChalkboardTeacher} from 'react-icons/fa'; // Add icons for visual appeal

const Class = () => {
  const [classes, setClasses] = useState([]);
  const tableRef = useRef(null);
  const navigate = useNavigate();

  // Fetch username from localStorage
  const username = localStorage.getItem('username');

  useEffect(() => {
    // Check if the user is logged in
    if (!username) {
      navigate('/'); // Redirect to login page if not logged in
      return;
    }

    // Fetch classes for the logged-in teacher
    const fetchClasses = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/classes/teacher/${username}`);
        setClasses(response.data);
      } catch (err) {
        console.error('Error fetching classes:', err);
        // No need to set error state, as we're handling the case of no classes assigned below
      }
    };

    fetchClasses();
  }, [username, navigate]);

  // Initialize DataTable
  useEffect(() => {
    if (classes.length) {
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
  }, [classes]);

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
        <h1 className="mb-4">Your Classes</h1>

        {classes.length === 0 ? (
          <div className="alert alert-info">No class assigned to you yet.</div>
        ) : (
          <div className="overflow-auto">
            <table
              id="classesTable"
              ref={tableRef}
              className="table table-bordered table-striped"
            >
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Class Name</th>
                  <th>Teacher Username</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((classItem) => (
                  <tr key={classItem.id}>
                    <td>{classItem.id}</td>
                    <td>{classItem.class_name}</td>
                    <td>{classItem.teacher_username}</td>
                    <td>
                      <button
                        className="btn btn-primary"
                        onClick={() => navigate(`/feedback-list?classId=${classItem.id}`)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
       {/* Footer */}
     <footer className="footer">
      <div className="footer-extra">Additional Information</div>
      <div>&copy; 2025 OralAssessment. All rights reserved.</div>
    </footer>
    </div>
  );
};

export default Class;
