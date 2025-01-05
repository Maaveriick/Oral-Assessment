import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import $ from 'jquery';
import 'datatables.net';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaChalkboardTeacher } from 'react-icons/fa';

const AnnouncementList = () => {
  const { classId } = useParams(); // Use classId from route params
  const [className, setClassName] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/announcements/class/${classId}`);
      console.log('Announcements fetched from backend:', response.data);
      setClassName(response.data.className); // Set the class name
      setAnnouncements(response.data.announcements); // Set announcements
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

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
  }, [classId]);

  useEffect(() => {
    if (announcements.length) {
      initializeDataTable();
    }
  }, [announcements]);

  const deleteAnnouncement = async (id) => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this announcement?');
      if (confirmDelete) {
        await axios.delete(`http://localhost:5000/announcements/${id}`);
        setAnnouncements((prev) => prev.filter((announcement) => announcement.id !== id));
        alert('Announcement deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Error deleting announcement');
    }
  };

  const formatDate = (date) => {
    const formattedDate = new Date(date);
    return !isNaN(formattedDate) ? formattedDate.toLocaleString() : 'Invalid Date';
  };

  return (
    <div className="d-flex">
      <div className="sidebar bg-dark text-white p-4" style={{ width: '250px', height: '100vh' }}>
        <h2
          className="text-center mb-4"
          onClick={() => navigate('/hometeacher')}
          style={{ cursor: 'pointer' }}
        >
          Teacher Navigation
        </h2>
        <ul className="nav flex-column">
          <li className="nav-item">
            <button
              className="nav-link text-white"
              style={{ background: 'none', border: 'none' }}
              onClick={() => navigate('/class')}
            >
              <FaChalkboardTeacher className="me-2" /> Classes
            </button>
          </li>
        </ul>
      </div>

      <div className="flex-fill p-4">
        <h1 className="mb-4">
          Announcements for Class: {className || 'Loading...'} 
        </h1>
        <div className="mb-3">
          <button
            className="btn btn-success"
            onClick={() => navigate(`/create-announcement/${classId}`)}
          >
            Create New Announcement
          </button>
        </div>
        <div className="overflow-auto">
          <table id="announcementTable" ref={tableRef} className="table table-bordered">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Date Posted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center">
                    No announcements available for this class.
                  </td>
                </tr>
              ) : (
                announcements.map((announcement) => (
                  <tr key={announcement.id}>
                    <td>{announcement.id || 'N/A'}</td>
                    <td>{announcement.title || 'N/A'}</td>
                    <td>{formatDate(announcement.date_posted)}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-primary"
                          onClick={() => navigate(`/edit-announcement/${classId}/${announcement.id}`)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-warning"
                          onClick={() => navigate(`/view-announcement/${classId}/${announcement.id}`)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-danger"
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
