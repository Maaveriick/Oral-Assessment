import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';

const CreateClass = () => {
  const [formData, setFormData] = useState({
    className: '',
    teacherUsername: '',
    teacherEmail: '',
    students: [],
  });
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [addedStudentsPage, setAddedStudentsPage] = useState(1);
  const [studentsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const teachersRes = await axios.get('http://localhost:5000/teachers');
        const studentsRes = await axios.get('http://localhost:5000/students');
        setTeachers(teachersRes.data);
        setStudents(studentsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const filteredStudents = students.filter(
    (student) =>
      student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const totalAddedPages = Math.ceil(formData.students.length / studentsPerPage);

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  const indexOfLastAddedStudent = addedStudentsPage * studentsPerPage;
  const indexOfFirstAddedStudent = indexOfLastAddedStudent - studentsPerPage;
  const currentAddedStudents = formData.students.slice(indexOfFirstAddedStudent, indexOfLastAddedStudent);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const paginateAddedStudents = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalAddedPages) {
      setAddedStudentsPage(pageNumber);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddStudent = (student) => {
    // Check if the student is already in the current formData.students list
    if (formData.students.find((s) => s.username === student.username)) {
      alert('This student is already added to the class.');
      return;
    }
  
    // Check if the student is in another class
    if (student.className && student.className !== formData.className) {
      const isConfirmed = window.confirm(
        `This student is already assigned to the class "${student.className}". Do you still want to add them to the current class?`
      );
      if (!isConfirmed) return;
    }
  
    // Proceed to add the student if they are not in another class or the user confirmed to proceed
    setFormData({
      ...formData,
      students: [...formData.students, student],
    });
  };
  

  const handleRemoveStudent = (studentUsername) => {
    const isConfirmed = window.confirm('Are you sure you want to remove this student?');
    if (isConfirmed) {
      setFormData({
        ...formData,
        students: formData.students.filter((s) => s.username !== studentUsername),
      });
    }
  };
  

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { className, teacherUsername, students } = formData;

    try {
      await axios.post('http://localhost:5000/classes', {
        className,
        teacherUsername,
        students,
      });
      navigate('/crud-class');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Create a New Class</h2>
      <div className="row">
        <div className="col-md-6">
          <div className="card shadow-lg">
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Search Students</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="form-control"
                  placeholder="Search by username or email"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Available Students</label>
                <div className="card">
                  <div className="card-body">
                    {filteredStudents.length > 0 ? (
                      <ul className="list-group">
                        {currentStudents.map((student) => (
                          <li
                            key={student.id}
                            className="list-group-item d-flex justify-content-between align-items-center"
                          >
                            {student.username} ({student.email})
                            {formData.students.find(
                              (s) => s.username === student.username
                            ) ? (
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => handleRemoveStudent(student.username)}
                              >
                                Remove
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                onClick={() => handleAddStudent(student)}
                              >
                                Add
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No students available.</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span>
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-lg">
            <form onSubmit={handleSubmit}>
              <div className="card-body">
                <h5 className="card-title">Class Details</h5>
                <div className="mb-3">
                  <label htmlFor="className" className="form-label">
                    Class Name
                  </label>
                  <input
                    type="text"
                    id="className"
                    name="className"
                    value={formData.className}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Enter class name"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="teacherUsername" className="form-label">
                    Teacher
                  </label>
                  <select
                    id="teacherUsername"
                    name="teacherUsername"
                    value={formData.teacherUsername}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select a teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.username}>
                        {teacher.username} ({teacher.email})
                      </option>
                    ))}
                  </select>
                </div>
                <h5 className="card-title">Added Students</h5>
                <table className="table table-bordered mt-4">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.students.length > 0 ? (
                      currentAddedStudents.map((student, index) => (
                        <tr key={index}>
                          <td>{student.username}</td>
                          <td>{student.email}</td>
                          <td>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRemoveStudent(student.username)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center">
                          No students added
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => paginateAddedStudents(addedStudentsPage - 1)}
                    disabled={addedStudentsPage === 1}
                  >
                    Previous
                  </button>
                  <span>
                    {addedStudentsPage} / {totalAddedPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => paginateAddedStudents(addedStudentsPage + 1)}
                    disabled={addedStudentsPage === totalAddedPages}
                  >
                    Next
                  </button>
                </div>
                <div className="mt-4">
                  <button type="submit" className="btn btn-primary">
                    Create Class
                  </button>
                </div>
              </div>
            </form>
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

export default CreateClass;
