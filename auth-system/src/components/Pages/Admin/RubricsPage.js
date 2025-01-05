import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const RubricsPage = () => {
  const [rubrics, setRubrics] = useState([]); // State to store rubrics
  const [components, setComponents] = useState([{ component: '', description: '', grade: '' }]); // Initial input fields for components
  const [editRubricId, setEditRubricId] = useState(null); // State to track which rubric is being edited
  const navigate = useNavigate(); // Initialize navigate hook

  // Fetch rubrics from backend when component mounts
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

    // Initialize Bootstrap tooltips
    const tooltipElements = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipElements.forEach((element) => {
      new window.bootstrap.Tooltip(element); // Initialize each tooltip
    });
  }, []);

  // Handle changes in input fields for components
  const handleComponentChange = (index, field, value) => {
    const newComponents = [...components];
    newComponents[index][field] = value; // Update the specific field (component, description, or grade)
    setComponents(newComponents); // Update the state
  };

  // Add a new component input field
  const addComponent = () => {
    setComponents([...components, { component: '', description: '', grade: '' }]);
  };

  // Remove a component input field
  const removeComponent = (index) => {
    const newComponents = components.filter((_, i) => i !== index);
    setComponents(newComponents);
  };

  // Save or update the rubric
  const saveRubric = async () => {
    console.log("Components being sent:", components); // Debugging line
  
    // Ensure that components array has valid data
    if (components.some(comp => !comp.component || !comp.description || !comp.grade)) {
      console.error('Please fill in all fields');
      return; // Prevent sending incomplete data
    }
  
    try {
      let url = 'http://localhost:5000/save-rubric';
      let method = 'POST';
  
      // If editing an existing rubric, use the PUT method
      if (editRubricId) {
        url = `http://localhost:5000/update-rubric/${editRubricId}`;
        method = 'PUT';
      }
  
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ components }) // Sending the dynamic components
      });
  
      const data = await response.json();
      if (response.ok) {
        console.log('Rubric saved:', data);
        // Reset state or navigate back to rubrics list page
        setComponents([{ component: '', description: '', grade: '' }]); // Reset components
        setEditRubricId(null); // Reset the editing rubric ID
      } else {
        console.error('Error saving rubric:', data);
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  // Handle editing an existing rubric
  const handleEdit = (rubric) => {
    const rubricData = rubric.components.map(comp => ({
      component: comp.component,
      description: comp.description,
      grade: comp.grade,
    }));
    setComponents(rubricData);
    setEditRubricId(rubric.id);
  };

  // Handle deleting a rubric
  const handleDelete = async (rubricId) => {
    try {
      // Delete the rubric from the backend
      await axios.delete(`http://localhost:5000/delete-rubric/${rubricId}`);

      // Update the state by removing the deleted rubric
      setRubrics(rubrics.filter((rubric) => rubric.id !== rubricId));
      setComponents([{ component: '', description: '', grade: '' }]); // Reset components on deletion
      setEditRubricId(null); // Reset editing state
    } catch (error) {
      console.error('Error deleting rubric:', error);
    }
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
        <h3>{editRubricId ? 'Edit Rubric' : 'Add a New Rubric'}</h3>

        {/* Component input fields */}
        {components.map((component, index) => (
          <div key={index} className="mb-3">
            <div className="d-flex">
              <input
                type="text"
                className="form-control me-2"
                placeholder="Component"
                value={component.component}
                onChange={(e) => handleComponentChange(index, 'component', e.target.value)} // Update component name
              />
              <input
                type="text"
                className="form-control me-2"
                placeholder="Description"
                value={component.description}
                onChange={(e) => handleComponentChange(index, 'description', e.target.value)} // Update description
              />
              <input
                type="number"
                className="form-control me-2"
                placeholder="Grade"
                value={component.grade}
                onChange={(e) => handleComponentChange(index, 'grade', e.target.value)} // Update grade, ensure it's numeric
                min="0" // Optional: set a minimum value (e.g., 0)
                max="10" // Optional: set a maximum value (e.g., 10)
              />
              <button
                className="btn btn-danger btn-sm"
                onClick={() => removeComponent(index)} // Remove this component input
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {/* Add Component Button */}
        <button 
          className="btn btn-success mt-2" 
          onClick={addComponent} 
          disabled={editRubricId === null && rubrics.length > 0} // Disable if rubric already exists
          data-bs-toggle="tooltip"
          title="You are only able to make 1 rubric and edit the previous one"
        >
          Add Component
        </button>

        {/* Save/Update Rubric Button */}
        <button 
          className="btn btn-primary mt-3" 
          onClick={saveRubric} 
          disabled={editRubricId === null && rubrics.length > 0} // Disable if rubric already exists
          data-bs-toggle="tooltip"
          title="You are only able to make 1 rubric and edit the previous one"
        >
          {editRubricId ? 'Update Rubric' : 'Save Rubric'}
        </button>
      </div>

      {/* Saved Rubrics Table */}
      <h3>Saved Rubrics</h3>
      <table className="table table-bordered mb-4">
        <thead>
          <tr>
            <th>Components</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rubrics.map((rubric) => (
            <tr key={rubric.id}>
              <td>
                {/* List components of the rubric */}
                <ul>
                  {rubric.components.map((comp, idx) => (
                    <li key={idx}>
                      <strong>{comp.component}</strong>: {comp.description} - Grade: {comp.grade}
                    </li>
                  ))}
                </ul>
              </td>
              <td>
                <button
                  className="btn btn-warning btn-sm me-2"
                  onClick={() => handleEdit(rubric)} // Edit the whole rubric
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(rubric.id)} // Delete the whole rubric
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RubricsPage;
