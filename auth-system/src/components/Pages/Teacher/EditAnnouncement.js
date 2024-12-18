import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditAnnouncement = () => {
  const { classId, announcementId } = useParams(); // Get classId and announcementId from the URL
  const [announcementDetails, setAnnouncementDetails] = useState(null); // Store announcement details
  const [title, setTitle] = useState(''); // Store title
  const [content, setContent] = useState(''); // Store content
  const [classIdState, setClassIdState] = useState(classId); // Store class ID for select
  const [classes, setClasses] = useState([]); // Store available classes
  const [error, setError] = useState(''); // Store error messages
  const navigate = useNavigate();

  // Fetch announcement details from the backend
  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        // Fetch the specific announcement
        const response = await axios.get(`http://localhost:5000/announcements/${announcementId}`);
        const data = response.data;
        setAnnouncementDetails(data);
        setTitle(data.title);
        setContent(data.content);
        setClassIdState(data.class_id); // Set class_id from fetched announcement

        // Fetch the available classes for the dropdown
        const classResponse = await axios.get(`http://localhost:5000/classes`);
        setClasses(classResponse.data); // Set available classes
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
      const updatedAnnouncement = {
        title,
        content,
        class_id: classIdState, // Use the class_id from the state
      };

      await axios.put(`http://localhost:5000/announcements/${announcementId}`, updatedAnnouncement);
      alert('Announcement updated successfully!');
      navigate(`/crud-announcement/${classIdState}`); // Redirect to the class's announcement list
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
              {announcementDetails ? (
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
                  <div className="mb-3">
                    <label htmlFor="classId" className="form-label">Class</label>
                    <select
                      id="classId"
                      className="form-control"
                      value={classIdState}
                      onChange={(e) => setClassIdState(e.target.value)}
                    >
                      <option value="">Select Class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.class_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary w-100">
                    Update Announcement
                  </button>
                </form>
              ) : (
                <p className="text-muted">Loading announcement details...</p>
              )}

              {/* "Back to Announcements" button */}
              <button
                className="btn btn-secondary w-100 mt-3"
                onClick={() => navigate(`/crud-announcement/${classIdState}`)} // Navigate back to class's announcement list
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
