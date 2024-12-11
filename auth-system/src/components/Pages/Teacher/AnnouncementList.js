import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import $ from 'jquery';
import 'datatables.net';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaChalkboardTeacher } from 'react-icons/fa'; // Icons for visual appeal

const AnnouncementList = () => {
  const [announcements, setAnnouncements] = useState([]);
  const navigate = useNavigate();
  const tableRef = useRef(null);

  // Fetch announcements from the server
  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get('http://localhost:5000/announcements');
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
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
    fetchAnnouncements(); // Fetch announcements on component mount
  }, []);

  useEffect(() => {
    if (announcements.length) {
      initializeDataTable();
    }
  }, [announcements]);

  // Function to delete an announcement
  const deleteAnnouncement = async (id) => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this announcement?');
      if (confirmDelete) {
        await axios.delete(`http://localhost:5000/announcements/${id}`);
        setAnnouncements((prevAnnouncements) =>
          prevAnnouncements.filter((announcement) => announcement.id !== id)
        );
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div
        className="sidebar bg-dark text-white p-4"
        style={{ width: '250px', height: '100vh' }}
      >
        <h2
          className="text-center mb-4 cursor-pointer"
          onClick={() => navigate('/hometeacher')}
          style={{ cursor: 'pointer' }}
        >
          Teacher Navigation
        </h2>

        <ul className="nav flex-column">
          {/* Sidebar links */}
          <li className="nav-item">
            <button
              className="nav-link text-white"
              style={{ background: 'none', border: 'none' }}
              onClick={() => navigate('/class')}
            >
              <FaChalkboardTeacher className="me-2" /> Classes
            </button>
          </li>
          {/* Additional links can be added here */}
        </ul>
      </div>

      <div className="flex-fill p-4">
        <h1 className="mb-4">Announcement List</h1>
        <div className="mb-3">
          <button className="btn btn-success" onClick={() => navigate('/create-announcement')}>
            Create New Announcement
          </button>
        </div>
        <div className="overflow-auto">
          <table id="announcementTable" ref={tableRef} className="table table-bordered">
            <thead>
              <tr>
                <th>ID</th>
                <th>Announcement Title</th>
                <th>Date Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center">
                    No announcements available.
                  </td>
                </tr>
              ) : (
                announcements.map((announcement) => (
                  <tr key={announcement.id}>
                    <td>{announcement.id || 'N/A'}</td>
                    <td>{announcement.title || 'N/A'}</td>
                    <td>
                      {announcement.datecreated
                        ? new Date(announcement.datecreated).toLocaleString()
                        : 'N/A'}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-primary"
                          style={{ width: '100px' }}
                          onClick={() => navigate(`/edit-announcement/${announcement.id}`)}
                        >
                          Edit
                        </button>

                        <button
                          className="btn btn-warning"
                          style={{ width: '100px' }}
                          onClick={() => navigate(`/view-announcement/${announcement.id}`)}
                        >
                          View
                        </button>

                        <button
                          className="btn btn-danger"
                          style={{ width: '100px' }}
                          onClick={() => deleteAnnouncement(announcement.id)}
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

export default AnnouncementList;
