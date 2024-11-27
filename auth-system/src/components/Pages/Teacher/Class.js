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
  const [error, setError] = useState('');
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
        setError('An error occurred while fetching classes.');
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
          {/* Additional links can be added here */}
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-fill p-4">
        <h1 className="mb-4">Your Classes</h1>

        {error && <div className="alert alert-danger">{error}</div>}

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
      </div>
    </div>
  );
};

export default Class;
