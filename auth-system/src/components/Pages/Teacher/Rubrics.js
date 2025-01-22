import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaChalkboardTeacher } from "react-icons/fa";

const Rubrics = () => {
  const [selectedRubric, setSelectedRubric] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch the first available rubric automatically
  useEffect(() => {
    const fetchRubrics = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/rubrics");
        if (response.data.length > 0) {
          fetchRubricDetails(response.data[0].rubric_id); // Load first rubric
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching rubrics:", error);
        setLoading(false);
      }
    };

    fetchRubrics();
  }, []);

  // Fetch details of the first rubric
  const fetchRubricDetails = async (rubricId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/rubric/${rubricId}`);
      console.log("Rubric details:", response.data); // Debugging
      setSelectedRubric(response.data);
    } catch (error) {
      console.error("Error fetching rubric details:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div
        className="sidebar bg-dark text-white p-4"
        style={{
          width: "250px",
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
        }}
      >
        <h2
          className="text-center mb-4 cursor-pointer"
          onClick={() => navigate("/hometeacher")}
        >
          Teacher Navigation
        </h2>

        <ul className="nav flex-column">
          <li className="nav-item">
            <button
              className="nav-link text-white"
              style={{ background: "none", border: "none" }}
              onClick={() => navigate("/crud-topic")}
            >
              <FaChalkboardTeacher className="me-2" /> Topic
            </button>
          </li>

          <li className="nav-item">
            <button
              className="nav-link text-white"
              style={{ background: "none", border: "none" }}
              onClick={() => navigate("/class")}
            >
              <FaChalkboardTeacher className="me-2" /> Classes
            </button>
          </li>

          <li className="nav-item">
            <button
              className="nav-link text-white"
              style={{ background: "none", border: "none" }}
              onClick={() => navigate("/rubricsTeacher")}
            >
              <FaChalkboardTeacher className="me-2" /> Rubrics
            </button>
          </li>
        </ul>
      </div>

      {/* Main content */}
      <div
        className="container mt-5"
        style={{
          marginLeft: "250px",
          paddingTop: "20px",
          flex: 1,
        }}
      >
        <h1 className="text-center mb-4">Grading Rubric</h1>

        {loading ? (
          <p className="text-center">Loading rubric details...</p>
        ) : selectedRubric ? (
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="text-center">{selectedRubric.rubricTitle}</h2>

              {/* Rubric Table */}
              <table className="table table-bordered mt-3">
                <thead className="table-dark">
                  <tr>
                    <th>Criteria</th>
                    <th>Weightage (%)</th>
                    {selectedRubric.columnOrder && selectedRubric.columnOrder.map((col, index) => (
                      <th key={index}>{col}</th> // Directly using the database column order
                    ))}
                  </tr>
                </thead>
                <tbody>
  {selectedRubric.rows.map((row) => (
    <tr key={row.id}>
      <td>{row.criteria}</td>
      <td>{row.weightage ? row.weightage * 100 : "N/A"}%</td>
      {selectedRubric.columnOrder.map((col, index) => (
        <td key={`${row.id}-${col}`}>
          {row.grading_values && row.grading_values[col] ? row.grading_values[col] : "N/A"}
        </td>
      ))}
    </tr>
  ))}
</tbody>

              </table>
            </div>
          </div>
        ) : (
          <p className="text-center">No rubrics available.</p>
        )}
      </div>
    </div>
  );
};

export default Rubrics;
