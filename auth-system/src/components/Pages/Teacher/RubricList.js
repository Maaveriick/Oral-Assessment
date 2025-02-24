import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import $ from 'jquery';
import 'datatables.net';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaChalkboardTeacher, FaSignOutAlt, FaClipboardList, FaUsers } from 'react-icons/fa'; // Importing the icon for the sidebar

const RubricList = ({ onLogout }) => {
  const [rubrics, setRubrics] = useState([]);
  const navigate = useNavigate();
  const tableRef = useRef(null);

 // Fetch all rubrics from the backend
const fetchRubrics = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/rubrics');
    console.log(response.data); // Log the response data to check its structure
    setRubrics(response.data);
  } catch (error) {
    console.error('Error fetching rubrics:', error);
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
    fetchRubrics(); // Fetch rubrics on component mount
  }, []);

  useEffect(() => {
    if (rubrics.length) {
      initializeDataTable();
    }
  }, [rubrics]);

  // Function to delete a rubric
  const deleteRubric = async (id) => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this rubric?');
      if (confirmDelete) {
        await axios.delete(`http://localhost:5000/api/rubric/${id}`); // Corrected URL
        setRubrics((prev) => prev.filter((rubric) => rubric.rubric_id !== id));
        alert('Rubric deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting rubric:', error);
      alert('Error deleting rubric');
    }
  };
  

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
      {/* Main content */}
      <div className="flex-fill p-4">
        <h1 className="mb-4">Rubrics</h1>
        <div className="mb-3">
          <button className="btn btn-success" onClick={() => navigate('/create-rubric')}>
            Create New Rubric
          </button>
        </div>
        <div className="overflow-auto">
          <table id="rubricTable" ref={tableRef} className="table table-bordered">
            <thead>
              <tr>
                <th>ID</th>
                <th>Rubric Title</th>
                <th>Date Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rubrics.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center">
                    No rubrics available.
                  </td>
                </tr>
              ) : (
                rubrics.map((rubric) => (
                  <tr key={rubric.rubric_id}>
                    <td>{rubric.rubric_id}</td>
                    <td>{rubric.rubric_title}</td>
                    <td>{new Date(rubric.date_created).toLocaleString()}</td>
                    <td>
                    <button
                      className="btn btn-primary me-2"  // 'me-2' adds margin to the right
                      onClick={() => navigate(`/view-rubric/${rubric.rubric_id}`)}
                    >
                      View
                    </button>
                    <button
                      className="btn btn-warning me-2"  // 'me-2' adds margin to the right
                      onClick={() => navigate(`/edit-rubric/${rubric.rubric_id}`)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => deleteRubric(rubric.rubric_id)} // Pass the rubric ID here
                    >
                      Delete
                    </button>
                  </td>
                  </tr>
                ))
              )}
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

export default RubricList;
