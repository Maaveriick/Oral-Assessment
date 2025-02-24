import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import $ from 'jquery';
import 'datatables.net';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaChalkboardTeacher } from 'react-icons/fa'; // Add icons for visual appeal

const StudentDetails = () => {
  const { id } = useParams(); // Extract student ID from the URL
  const [student, setStudent] = useState(null);
  const [topics, setTopics] = useState([]);
  const tableRef = useRef(null);
  const navigate = useNavigate();
  // Fetch student details
  // Fetch student details
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/students/${id}`);
        setStudent(response.data);
        console.log("Student Object:", response.data);  // Log the student object
        console.log("Student Email:", response.data.email); // Log the email
      } catch (error) {
        console.error('Error fetching student details:', error);
      }
    };
  
    fetchStudent();
  }, [id]);
  


// Fetch topics for the student's class
useEffect(() => {
  const fetchTopics = async () => {
    if (!student?.username || !student?.email) return;  // Ensure both username and email are available

    try {
      // Passing both username and email
      const response = await axios.get(`http://localhost:5000/topics/student/${student.username}/${student.email}`);
      console.log('Topics fetched:', response.data);
      setTopics(response.data);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  fetchTopics();
}, [student]); // Trigger when student changes



  // Initialize DataTable
  useEffect(() => {
    if (topics.length) {
      if ($.fn.DataTable.isDataTable(tableRef.current)) {
        $(tableRef.current).DataTable().destroy();
      }
      $(tableRef.current).DataTable({
        paging: true,
        searching: true,
        ordering: true,
        info: true,
      });
    }
  }, [topics]);

  if (!student) {
    return <div>Loading student details...</div>;
  }

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

      {/* Main Content */}
      <div className="flex-fill p-4">
        <h1>Student Details</h1>
        <h2>
          <strong>ID:</strong> {student.id}
        </h2>
        <h2>
          <strong>Username:</strong> {student.username}
        </h2>

        <hr />

        <h2>Topics</h2>
        <div className="overflow-auto">
          <table
            id="topicsTable"
            ref={tableRef}
            className="table table-bordered table-striped"
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>Topic Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {topics.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center">
                    No topics assigned to this student.
                  </td>
                </tr>
              ) : (
                topics.map((topic) => (
                  <tr key={topic.id}>
                    <td>{topic.id}</td>
                    <td>{topic.topicname}</td>
                    <td>
                      <Link
                        to={`/attempts/${student.username}/${topic.id}`}
                        className="btn btn-primary"
                      >
                        View Attempts
                      </Link>
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

export default StudentDetails;
