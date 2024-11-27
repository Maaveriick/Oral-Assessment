import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const ViewClass = () => {
  const { classId } = useParams(); // Get the classId from the URL
  const [classData, setClassData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch class details on component mount
  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/classes/${classId}`);
        setClassData(response.data); // Set the retrieved class data in state
      } catch (err) {
        setError('Class not found');
        console.error(err);
      }
    };

    fetchClassData();
  }, [classId]); // Run effect when classId changes

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="mt-3">Loading class details...</p>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Class Details</h2>

      {/* Card for Class Details */}
      <div className="card shadow-lg border-0">
        <div className="card-body">
          <h5 className="card-title mb-4">Class Information</h5>
          
          {/* Class Name */}
          <div className="mb-3">
            <label htmlFor="className" className="form-label">
              <strong>Class Name</strong>
            </label>
            <p id="className" className="font-weight-bold">{classData.class_name}</p> {/* Accessing class_name */}
          </div>

          {/* Teacher Username */}
          <div className="mb-3">
            <label htmlFor="teacherUsername" className="form-label">
              <strong>Teacher Username</strong>
            </label>
            <p id="teacherUsername" className="font-weight-bold">{classData.teacher_username}</p> {/* Accessing teacher_username */}
          </div>

          {/* Students List */}
          <div className="mb-3">
            <label htmlFor="students" className="form-label">
              <strong>Students</strong>
            </label>
            {classData.students && classData.students.length > 0 ? (
              <ul className="list-group">
                {classData.students.map((student) => (
                  <li key={student.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{student.username}</strong>
                      <br />
                      <small>{student.email}</small>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No students enrolled yet.</p>
            )}
          </div>

          {/* Back Button */}
          <div className="d-flex justify-content-start">
            <a href="/crud-class" className="btn btn-secondary">
              <i className="bi bi-arrow-left-circle"></i> Back to Classes
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewClass;
