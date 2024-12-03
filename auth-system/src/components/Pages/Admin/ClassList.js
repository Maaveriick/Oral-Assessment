import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaChalkboardTeacher, FaSignOutAlt, FaClipboardList, FaUsers } from 'react-icons/fa'; // Importing the icon for the sidebar

const ClassList = ({ onLogout }) => {
  const [classes, setClasses] = useState([]); // State for storing classes
  const navigate = useNavigate(); // Navigation hook

  // Fetch classes from backend
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get("http://localhost:5000/classes"); // Backend route for fetching classes
        setClasses(response.data);
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };
    fetchClasses();
  }, []);

  // Handle delete class
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/classes/${id}`);
      setClasses(classes.filter((cls) => cls.id !== id));
    } catch (error) {
      console.error("Error deleting class:", error);
    }
  };

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className="sidebar bg-dark text-white p-4" style={{ width: "250px", height: "100vh" }}>
        <h2
          className="text-center mb-4 cursor-pointer"
          onClick={() => navigate("/homeadmin")} // Navigate to HomeAdmin on click
          style={{ cursor: "pointer" }} // Optional: Adds cursor pointer to indicate it's clickable
        >
          Admin Dashboard
        </h2>
        <ul className="nav flex-column">
          {/* Sidebar links */}
          <li className="nav-item">
            <button
              className="nav-link text-white"
              style={{ background: 'none', border: 'none' }}
              onClick={() => navigate('/crud-class')}
            >
              <FaChalkboardTeacher className="me-2" /> Manage Classes
            </button>
          </li>
          <li className="nav-item">
            <button
              className="nav-link text-white"
              style={{ background: 'none', border: 'none' }}
              onClick={() => navigate('/rubrics')}
            >
              <FaClipboardList className="me-2" /> Manage Rubrics
            </button>
          </li>
          <li className="nav-item">
        <button
          className="nav-link text-white"
          style={{ background: 'none', border: 'none' }}
          onClick={() => navigate('/teacherlist')}
        >
          <FaUsers className="me-2" /> Teacher List
        </button>
      </li>
          <li className="nav-item">
            <button
              className="nav-link text-white"
              style={{ background: 'none', border: 'none' }}
              onClick={() => navigate('/studentlist')}
            >
              <FaUsers className="me-2" /> Student List
            </button>
          </li>
        </ul>

        {/* Logout Button */}
        <div className="mt-auto">
          <button className="btn btn-danger w-100" onClick={onLogout}>
            <FaSignOutAlt className="me-2" /> Logout
          </button>
        </div>
      </div>
      {/* Main Content Area */}
      <div className="container-fluid d-flex flex-column align-items-start p-4">
        <div className="text-left w-100">
          <h2 className="text-center mb-4">Manage Classes</h2>
          <button
            className="btn btn-primary mb-4"
            onClick={() => navigate("/create-class")}
          >
            Create New Class
          </button>

          <div className="card shadow-lg">
            <div className="card-body">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Class Name</th>
                    <th>Teacher Username</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.length > 0 ? (
                    classes.map((cls) => (
                      <tr key={cls.id}>
                        <td>{cls.class_name}</td>
                        <td>{cls.teacher_username}</td>
                        <td>
                          <button
                            className="btn btn-primary me-2"
                            onClick={() => navigate(`/view-class/${cls.id}`)}
                          >
                            View
                          </button>
                          <button
                            className="btn btn-primary me-2"
                            onClick={() => navigate(`/edit-class/${cls.id}`)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDelete(cls.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center">
                        No classes found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassList;
