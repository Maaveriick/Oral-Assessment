import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const RubricsPage = () => {
  const [rubrics, setRubrics] = useState([]);
  const [newRubric, setNewRubric] = useState('');
  const [editRubricId, setEditRubricId] = useState(null); // To track which rubric is being edited
  const navigate = useNavigate(); // Initialize navigate hook

  // Fetch Rubrics from Backend
  useEffect(() => {
    const fetchRubrics = async () => {
      try {
        const response = await axios.get('http://localhost:5000/rubrics');
        setRubrics(response.data);
      } catch (error) {
        console.error('Error fetching rubrics:', error);
      }
    };

    fetchRubrics();
  }, []);

  // Save or Update Rubric
  const saveRubric = async () => {
    if (!newRubric.trim()) return;

    try {
      if (editRubricId) {
        // Update existing rubric
        const response = await axios.put('http://localhost:5000/save-rubric', {
          rubricId: editRubricId,
          rubric: newRubric,
        });
        setRubrics(
          rubrics.map((rubric) =>
            rubric.id === editRubricId ? response.data.rubric : rubric
          )
        );
      } else {
        // Create new rubric
        const response = await axios.post('http://localhost:5000/save-rubric', {
          rubric: newRubric,
        });
        setRubrics([...rubrics, response.data.rubric]);
      }

      // Clear the form and reset the edit state
      setNewRubric('');
      setEditRubricId(null);
    } catch (error) {
      console.error('Error saving rubric:', error);
    }
  };

  // Handle editing a rubric
  const handleEdit = (rubric) => {
    setNewRubric(rubric.rubric_text);
    setEditRubricId(rubric.id);
  };

  // Handle deleting a rubric
  const handleDelete = async (rubricId) => {
    try {
      // Delete the rubric from the backend
      await axios.delete(`http://localhost:5000/delete-rubric/${rubricId}`);

      // Update the state by removing the deleted rubric
      setRubrics(rubrics.filter((rubric) => rubric.id !== rubricId));
    } catch (error) {
      console.error('Error deleting rubric:', error);
    }
  };

  // Auto-resize Textarea
  const handleInputChange = (e) => {
    setNewRubric(e.target.value);
    e.target.style.height = 'auto'; // Reset the height
    e.target.style.height = `${e.target.scrollHeight}px`; // Adjust height to fit content
  };

  return (
    <div className="container mt-4">
      <h1>Oral Assessment Rubrics</h1>

      {/* Back Button */}
      <button className="btn btn-secondary mb-4" onClick={() => navigate("/homeadmin")}>
        Back to Home
      </button>

      {/* Input Form for New Rubric */}
      <div className="mb-4">
        <label htmlFor="newRubric" className="form-label">
          {editRubricId ? 'Edit Rubric' : 'Add a New Rubric'}
        </label>
        <textarea
          id="newRubric"
          className="form-control"
          value={newRubric}
          onChange={handleInputChange} // Dynamically adjust height
          placeholder="e.g., Clarity, Content, Presentation"
          rows="3" // Initial size (you can change this)
          style={{ resize: 'vertical', overflowY: 'auto' }} // Allow vertical resizing
        />
        <button className="btn btn-primary mt-2" onClick={saveRubric}>
          {editRubricId ? 'Update Rubric' : 'Save Rubric'}
        </button>
      </div>

      {/* List of Saved Rubrics */}
      <h3>Saved Rubrics</h3>
      <ul className="list-group mb-4">
        {rubrics.map((rubric) => (
          <li key={rubric.id} className="list-group-item d-flex justify-content-between align-items-center">
            {rubric.rubric_text}
            <div>
              <button
                className="btn btn-warning btn-sm me-2"
                onClick={() => handleEdit(rubric)}
              >
                Edit
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(rubric.id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RubricsPage;
