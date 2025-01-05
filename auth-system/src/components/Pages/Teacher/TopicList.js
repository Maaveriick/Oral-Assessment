import React, { useEffect, useState, useRef } from 'react'; 
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import $ from 'jquery';
import 'datatables.net';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaChalkboardTeacher} from 'react-icons/fa'; 

const TopicList = () => {
  const [topics, setTopics] = useState([]);
  const navigate = useNavigate();
  const tableRef = useRef(null);

  // Log the signed-in user from localStorage
  useEffect(() => {
    const loggedInUser = localStorage.getItem('username');
    console.log('Logged in user:', loggedInUser);
  }, []); // Log on component mount

  // Function to fetch topics
  const fetchTopics = async () => {
    const loggedInUser = localStorage.getItem('username'); // Get the logged-in username from localStorage
  
    try {
      const response = await axios.get('http://localhost:5000/topics', {
        headers: {
          'username': loggedInUser, // Send username in the header
        },
      });
      console.log('Fetched topics:', response.data);
      setTopics(response.data);
    } catch (error) {
      console.error('Error fetching topics:', error);
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
    fetchTopics(); // Fetch topics on component mount
  }, []);

  useEffect(() => {
    if (topics.length) {
      initializeDataTable();
    }
  }, [topics]);

  const deleteTopic = async (id) => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this topic?');
      if (confirmDelete) {
        await axios.delete(`http://localhost:5000/topics/${id}`);
        setTopics((prevTopics) => prevTopics.filter((topic) => topic.id !== id));
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
    }
  };

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div
        className="sidebar bg-dark text-white p-4"
        style={{ width: "250px", height: "100vh" }}
      >
        <h2
          className="text-center mb-4 cursor-pointer"
          onClick={() => navigate("/hometeacher")}
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

      <div className="flex-fill p-4">
        <h1 className="mb-4">Topic List</h1>
        <div className="mb-3">
          <button className="btn btn-success" onClick={() => navigate('/create-topic')}>
            Create New Topic
          </button>
        </div>
        <div className="overflow-auto">
          <table id="topicTable" ref={tableRef} className="table table-bordered">
            <thead>
              <tr>
                <th>ID</th>
                <th>Topic Name</th>
                <th>Created By</th>
                <th>Date Created</th>
                <th>Difficulty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {topics.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">
                    No topics available.
                  </td>
                </tr>
              ) : (
                topics.map((topic) => (
                  <tr key={topic.id}>
                    <td>{topic.id || 'N/A'}</td>
                    <td>{topic.topicname || 'N/A'}</td>
                    <td>{topic.teacher_username || 'N/A'}</td>
                    <td>{topic.datecreated ? new Date(topic.datecreated).toLocaleString() : 'N/A'}</td>
                    <td>{topic.difficulty || 'N/A'}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-primary"
                          style={{ width: '100px' }}
                          onClick={() => navigate(`/edit-topic/${topic.id}`)}
                        >
                          Edit
                        </button>

                        <button
                          className="btn btn-primary"
                          style={{ width: '100px' }}
                          onClick={() => navigate(`/view-topic/${topic.id}`)}
                        >
                          View
                        </button>

                        <button
                          className="btn btn-danger"
                          style={{ width: '100px' }}
                          onClick={() => deleteTopic(topic.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TopicList;
