import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaChalkboardTeacher, FaSignOutAlt, FaClipboardList, FaUsers } from 'react-icons/fa';

const TeacherList = ({ username, onLogout }) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch teacher data from the backend
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/teachers');
        setTeachers(response.data);
      } catch (err) {
        setError(`Error: ${err.message}`);
        console.log('Error response:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  // Handle delete button click
  const handleDelete = async (id) => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this teacher?');
      if (confirmDelete) {
        await axios.delete(`http://localhost:5000/users/${id}`); // Call the delete endpoint
        setTeachers(teachers.filter((teacher) => teacher.id !== id)); // Update the state to remove the teacher
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error(err);
    }
  };
  

  if (loading) {
    return <div className="text-center mt-5">Loading teacher data...</div>;
  }

  if (error) {
    return <div className="text-center text-danger mt-5">{error}</div>;
  }

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
  <div className="container-fluid p-4" style={{ flex: 1 }}>
    <div className="text-center w-100">
      <h1 className="mb-4 text-primary">Teacher List</h1>
      <div className="table-responsive">
        <table className="table table-bordered table-striped">
        <thead className="table-dark">
  <tr>
    <th>ID</th>
    <th>Username</th>
    <th>Email</th>
    <th>Action</th>
  </tr>
</thead>
<tbody>
  {teachers.length > 0 ? (
    teachers.map((teacher) => (
      <tr key={teacher.id}>
        <td>{teacher.id}</td>
        <td>{teacher.username}</td>
        <td>{teacher.email}</td>
        <td>
          <button
            className="btn btn-danger"
            onClick={() => handleDelete(teacher.id, teacher.username, teacher.email)}
          >
            Delete
          </button>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="4" className="text-center">
        No teachers found.
      </td>
    </tr>
  )}
</tbody>

        </table>
      </div>
    </div>
  </div>
</div>

  );
};

export default TeacherList;
