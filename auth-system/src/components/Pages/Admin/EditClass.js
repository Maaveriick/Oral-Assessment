import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';  // Import Bootstrap CSS

const EditClass = () => {
  const { classId } = useParams(); // Get the classId from the URL
  const [classData, setClassData] = useState({
    class_name: '',
    teacher_username: '',
    students: []
  });
  const [teachers, setTeachers] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1); // Current page for available students
  const [addedStudentsPage, setAddedStudentsPage] = useState(1); // Current page for added students
  const studentsPerPage = 10; // Students per page
  const navigate = useNavigate();

  // Fetch all teachers and students
  useEffect(() => {
    const fetchTeachersAndStudents = async () => {
      try {
        const teacherResponse = await axios.get('http://localhost:5000/teachers');
        const studentResponse = await axios.get('http://localhost:5000/students');
        
        setTeachers(teacherResponse.data); // Set the list of teachers
        setAvailableStudents(studentResponse.data); // Set the list of all students
      } catch (err) {
        setError('Error fetching teachers or students');
        console.error(err);
      }
    };

    fetchTeachersAndStudents();
  }, []);

  // Fetch class details on component mount
  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/classes/${classId}`);
        setClassData(response.data); // Set the class data from API response
        setIsLoading(false);
      } catch (err) {
        setError('Class not found');
        setIsLoading(false);
        console.error(err);
      }
    };
  
    fetchClassData();
  }, [classId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClassData((prevData) => {
      if (name === 'teacher_username') {
        return {
          ...prevData,
          teacher_username: value, // Set teacher_username directly
        };
      }
      return {
        ...prevData,
        [name]: value,
      };
    });
  };
  
  

  const handleStudentRemove = (index) => {
    // Show the confirmation dialog
    const isConfirmed = window.confirm('Are you sure you want to remove this student?');
  
    // If the user clicks "OK", proceed with removal
    if (isConfirmed) {
      const updatedStudents = classData.students.filter((_, i) => i !== index);
      setClassData((prevData) => ({
        ...prevData,
        students: updatedStudents,
      }));
    }
  };
  

  const handleAddStudents = () => {
    const studentsToAdd = availableStudents.filter(student =>
      selectedStudents.includes(student.id) // Check if student is selected
    );

    // Check if any student is already in the class (in classData.students)
    const alreadyAddedStudents = studentsToAdd.filter(student =>
      classData.students.some(s => s.id === student.id)
    );

    if (alreadyAddedStudents.length > 0) {
      // Show alert if student is already added
      alert('One or more selected students are already added to this class.');
    } else {
      // Add students only if they are not already in the class
      const updatedStudents = [...classData.students, ...studentsToAdd];
      setClassData((prevData) => ({
        ...prevData,
        students: updatedStudents,
      }));
    }

    // Clear the selected students after adding them
    setSelectedStudents([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if class name is defined and not empty
    if (!classData.class_name || !classData.class_name.trim()) {
      setError('Class name is required');
      return; // Do not submit if class name is empty or undefined
    }
    
    // Check if a teacher is selected
    if (!classData.teacher?.username) {
      setError('Teacher is required');
      return; // Do not submit if teacher is not selected
    }
    
    try {
      // Pass the teacher's username
      await axios.put(`http://localhost:5000/classes/${classId}`, {
        ...classData,
        teacher_username: classData.teacher.username // Set teacher_username correctly
      });
      navigate(`/crud-class`); // Redirect after successful edit
    } catch (err) {
      setError('Failed to update class details');
      console.error(err);
    }
  };
  
  


  // Filter available students based on the search term
  const filteredStudents = availableStudents.filter(student =>
    student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic for available students
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentAvailableStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  // Pagination logic for added students
  const indexOfLastAddedStudent = addedStudentsPage * studentsPerPage;
  const indexOfFirstAddedStudent = indexOfLastAddedStudent - studentsPerPage;
  const currentAddedStudents = classData.students.slice(indexOfFirstAddedStudent, indexOfLastAddedStudent);

  // Change page for available students
  const paginateAvailableStudents = (pageNumber) => setCurrentPage(pageNumber);

  // Change page for added students
  const paginateAddedStudents = (pageNumber) => setAddedStudentsPage(pageNumber);

  const totalAvailablePages = Math.ceil(filteredStudents.length / studentsPerPage);
  const totalAddedPages = Math.ceil(classData.students.length / studentsPerPage);

  if (isLoading) {
    return (
      <div className="container mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Edit Class</h2>
      
      <div className="row">
        {/* Left Column: Add Students */}
        <div className="col-md-6">
          <div className="card shadow-lg">
            <div className="card-body">
              <h5 className="card-title">Add Students to Class</h5>

              {/* Search Bar for available students */}
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search students by username or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Available Students List */}
              {filteredStudents.length > 0 ? (
                <div>
                  {currentAvailableStudents.map((student) => (
                    <div key={student.id} className="d-flex justify-content-between align-items-center mb-3">
                      <span>{student.username} ({student.email})</span>
                      <input
                        type="checkbox"
                        onChange={() => {
                          if (selectedStudents.includes(student.id)) {
                            setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                          } else {
                            setSelectedStudents([...selectedStudents, student.id]);
                          }
                        }}
                        checked={selectedStudents.includes(student.id)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No students found matching the search term.</p>
              )}

              {/* Pagination for available students */}
              <div className="d-flex justify-content-between mb-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => paginateAvailableStudents(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span>{currentPage} / {totalAvailablePages}</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => paginateAvailableStudents(currentPage + 1)}
                  disabled={currentPage === totalAvailablePages}
                >
                  Next
                </button>
              </div>

              {/* Add Students Button */}
              <button
                className="btn btn-primary"
                onClick={handleAddStudents}
                disabled={selectedStudents.length === 0}
              >
                Add Selected Students
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Class Details */}
        <div className="col-md-6">
          <div className="card shadow-lg">
            <div className="card-body">
              <h5 className="card-title">Class Details</h5>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="class_name" className="form-label">Class Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="class_name"
                    name="class_name"
                    value={classData.class_name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="mb-3">
  <label htmlFor="teacher_username" className="form-label">Teacher</label>
  <select
    className="form-select"
    id="teacher_username"
    name="teacher_username"
    value={classData.teacher?.username || ""} // Default to empty string if teacher is not set
    onChange={(e) => {
      const selectedTeacher = teachers.find((teacher) => teacher.username === e.target.value);
      setClassData((prevData) => ({
        ...prevData,
        teacher: selectedTeacher || {},
      }));
    }}
  >
    <option value="">Select Teacher</option>
    {teachers.map((teacher) => (
      <option key={teacher.username} value={teacher.username}>
        {teacher.username}
      </option>
    ))}
  </select>
</div>



                {/* Students List */}
                <h6>Added Students</h6>
{currentAddedStudents.length > 0 ? (
  <table className="table table-bordered mt-3">
    <thead>
      <tr>
        <th>Username</th>
        <th>Email</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      {currentAddedStudents.map((student, index) => (
        <tr key={student.id}>
          <td>{student.username}</td>
          <td>{student.email}</td>
          <td>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => handleStudentRemove(index)}
            >
              Remove
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
) : (
  <p className="text-muted">No students added yet.</p>
)}


                {/* Pagination for added students */}
                <div className="d-flex justify-content-between mt-3">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => paginateAddedStudents(addedStudentsPage - 1)}
                    disabled={addedStudentsPage === 1}
                  >
                    Previous
                  </button>
                  <span>{addedStudentsPage} / {totalAddedPages}</span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => paginateAddedStudents(addedStudentsPage + 1)}
                    disabled={addedStudentsPage === totalAddedPages}
                  >
                    Next
                  </button>
                </div>

                <button type="submit" className="btn btn-success mt-3">
                  Save Class
                </button>
              </form>
            </div>
          </div>
          <button
            className="btn btn-outline-dark mt-3"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditClass;
