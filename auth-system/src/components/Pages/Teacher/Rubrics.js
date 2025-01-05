import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Axios to fetch rubrics data
import { useNavigate } from 'react-router-dom'; // Assuming you're using react-router-dom for navigation
import { FaChalkboardTeacher } from 'react-icons/fa'; // FontAwesome icon

const Rubrics = () => {
  const [rubrics, setRubrics] = useState([]); // State to store fetched rubrics
  const navigate = useNavigate(); // Initialize navigate function

  // Fetch rubrics from backend on component mount
  useEffect(() => {
    const fetchRubrics = async () => {
      try {
        const response = await axios.get('http://localhost:5000/rubrics'); // Update with your endpoint
        setRubrics(response.data); // Store fetched rubrics in state
      } catch (error) {
        console.error('Error fetching rubrics:', error);
      }
    };

    fetchRubrics();
  }, []); // Empty dependency array, runs once on component mount

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div
        className="sidebar bg-dark text-white p-4"
        style={{
          width: '250px',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
        }}
      >
        <h2
          className="text-center mb-4 cursor-pointer"
          onClick={() => navigate('/hometeacher')} // Navigate to Teacher Home
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
        </ul>
      </div>

      {/* Main content (Rubrics) */}
      <div
        className="container mt-5"
        style={{
          marginLeft: '250px', // Ensure space for the sidebar, 250px for sidebar width
          paddingTop: '20px', // Add some padding at the top for better spacing
          flex: 1, // Ensure the main content takes the remaining space
        }}
      >
        <h1 className="text-center mb-4">Grading Rubrics</h1>

        {/* Card container to wrap the table for better design */}
        <div className="card shadow-sm">
          <div className="card-body">
            {/* Table to display rubrics */}
            <table className="table table-striped table-bordered table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Component</th>
                  <th>Description</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {/* Map over the rubrics array to display each rubric and its components */}
                {rubrics.map((rubric) => (
                  <React.Fragment key={rubric.id}>
                    {/* Render rows for each rubric's components */}
                    {rubric.components.map((component, index) => (
                      <tr key={component.component}>
                        {/* Display the actual component, description, and grade */}
                        <td>{component.component}</td>
                        <td>{component.description}</td>
                        <td>{component.grade}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rubrics;
