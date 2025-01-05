import React, { useState } from 'react'; 
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const CreateAnnouncement = () => {
  const [announcementTitle, setAnnouncementTitle] = useState(''); // Title for the announcement
  const [announcementText, setAnnouncementText] = useState(''); // User's announcement text
  const [errorMessage, setErrorMessage] = useState(''); // For displaying error messages
  const navigate = useNavigate();
  const { classId } = useParams(); // Assuming the class ID is passed as a URL parameter

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();

    const teacherUsername = JSON.parse(localStorage.getItem('user'))?.username;
    if (!teacherUsername || !announcementTitle || !announcementText) {
      setErrorMessage('All fields are required.');
      return;
    }

    try {
      await axios.post('http://localhost:5000/announcements', {
        username: teacherUsername,
        class_id: parseInt(classId, 10), // Use class ID from the URL
        title: announcementTitle,
        content: announcementText,
      });

      // Redirect back to AnnouncementList
      navigate(`/crud-announcement/${classId}`);
    } catch (error) {
      setErrorMessage(error.response?.data || 'Failed to create the announcement.');
    }
  };

  // Back Button Click Handler
  const handleBackButton = () => {
    navigate(`/crud-announcement/${classId}`);
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card shadow-lg border-light">
            <div className="card-body">
              <h2 className="text-center mb-4 text-primary">Create Announcement</h2>

              {errorMessage && (
                <div className="alert alert-danger" role="alert">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleCreateAnnouncement}>
                {/* Title Input */}
                <div className="mb-3">
                  <label className="form-label" htmlFor="titleInput">Title:</label>
                  <input
                    id="titleInput"
                    className="form-control"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Announcement Textarea */}
                <div className="mb-3">
                  <label className="form-label" htmlFor="announcementTextarea">Content:</label>
                  <textarea
                    id="announcementTextarea"
                    className="form-control"
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    rows="4"
                    required
                  ></textarea>
                </div>

                {/* Submit Button */}
                <button type="submit" className="btn btn-primary w-100">
                  Create Announcement
                </button>
              </form>

              {/* Back button */}
              <button
                className="btn btn-secondary w-100 mt-3"
                onClick={handleBackButton} // Navigate back to announcements list
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

export default CreateAnnouncement;
