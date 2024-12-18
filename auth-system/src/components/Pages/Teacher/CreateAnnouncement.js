import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const CreateAnnouncement = () => {
  const [classes, setClasses] = useState([]); // To store the classes
  const [selectedClass, setSelectedClass] = useState(''); // To store the selected class
  const [announcementTitle, setAnnouncementTitle] = useState(''); // Title for the announcement
  const [announcementText, setAnnouncementText] = useState(''); // User's announcement text
  const [errorMessage, setErrorMessage] = useState(''); // For displaying error messages
  const navigate = useNavigate();

  // Fetch classes when the component loads
  useEffect(() => {
    const fetchClasses = async () => {
      const teacherUsername = JSON.parse(localStorage.getItem('user'))?.username;

      if (!teacherUsername) {
        console.error('No teacher username found in localStorage!');
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/classes', {
          params: {
            username: teacherUsername,
            user_role: 'teacher', // Filter classes based on the teacher
          },
        });

        // Filter the classes assigned to the logged-in teacher
        const assignedClasses = response.data.filter(
          (classItem) => classItem.teacher_username === teacherUsername
        );

        setClasses(assignedClasses); // Set the assigned classes
      } catch (error) {
        console.error('Error fetching classes:', error.response?.data || error.message);
      }
    };

    fetchClasses();
  }, []);

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();

    const teacherUsername = JSON.parse(localStorage.getItem('user'))?.username;
    if (!teacherUsername || !selectedClass || !announcementTitle || !announcementText) {
      setErrorMessage('All fields are required.');
      return;
    }

    try {
      await axios.post('http://localhost:5000/announcements', {
        username: teacherUsername,
        class_id: parseInt(selectedClass, 10), // Ensure class_id is an integer
        title: announcementTitle,
        content: announcementText,
      });

      // Redirect back to AnnouncementList with selectedClass
      navigate(`/crud-announcement/${selectedClass}`);
    } catch (error) {
      setErrorMessage(error.response?.data || 'Failed to create the announcement.');
    }
  };

  // Back Button Click Handler
  const handleBackButton = () => {
    console.log('Selected Class:', selectedClass); // Debugging the selectedClass value

    if (selectedClass) {
      // Navigate to class-specific announcement list
      navigate(`/crud-announcement/${selectedClass}`);
    } else {
      // Fallback to the general announcement list if selectedClass is empty
      navigate('/crud-announcement');
    }
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
                {/* Class Selection Dropdown */}
                <div className="mb-3">
                  <label className="form-label" htmlFor="classSelect">Select Class:</label>
                  <select
                    id="classSelect"
                    className="form-select"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)} // Update selected class
                    required
                  >
                    <option value="">-- Select a Class --</option>
                    {classes.map((classItem) => (
                      <option key={classItem.id} value={classItem.id}>
                        {classItem.class_name}
                      </option>
                    ))}
                  </select>
                </div>

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
                    onChange={(e) => setAnnouncementText(e.target.value)} // Allow user to type announcement
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
