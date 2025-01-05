import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditAnnouncement = () => {
  const { announcementId } = useParams(); // Get announcementId from the URL
  const [title, setTitle] = useState(''); // Store title
  const [content, setContent] = useState(''); // Store content
  const [classId, setClassId] = useState(''); // Store class_id for navigation
  const [error, setError] = useState(''); // Store error messages
  const navigate = useNavigate();

  // Fetch announcement details from the backend
  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/announcements/${announcementId}`);
        const data = response.data;
        setTitle(data.title);
        setContent(data.content);
        setClassId(data.class_id); // Capture class_id for navigation
      } catch (err) {
        console.error('Error fetching announcement:', err);
        setError(err.response?.data?.message || 'Error fetching announcement.');
      }
    };

    fetchAnnouncement();
  }, [announcementId]);

  // Handle form submission to update the announcement
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedAnnouncement = { title, content };

      await axios.put(`http://localhost:5000/announcements/${announcementId}`, updatedAnnouncement);
      alert('Announcement updated successfully!');
      navigate(`/crud-announcement/${classId}`); // Redirect to the class-specific announcements list
    } catch (err) {
      console.error('Error updating announcement:', err);
      setError(err.response?.data?.message || 'Error updating announcement.');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-lg border-light">
            <div className="card-body">
              <h2 className="text-center mb-4 text-primary">Edit Announcement</h2>
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">Title</label>
                  <input
                    type="text"
                    id="title"
                    className="form-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="content" className="form-label">Content</label>
                  <textarea
                    id="content"
                    className="form-control"
                    rows="4"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  Update Announcement
                </button>
              </form>

              {/* "Back to Announcements" button */}
              <button
                className="btn btn-secondary w-100 mt-3"
                onClick={() => navigate(`/crud-announcement/${classId}`)} // Navigate back to the class-specific announcements list
              >
                Back to Announcements
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAnnouncement;
