import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ViewAnnouncement = () => {
  const { announcementId } = useParams();
  const [announcementDetails, setAnnouncementDetails] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/announcements/${announcementId}`);
        setAnnouncementDetails(response.data);
      } catch (err) {
        console.error('Error fetching announcement:', err);
        setError(err.response?.data?.message || 'Error fetching announcement.');
      }
    };

    fetchAnnouncement();
  }, [announcementId]);

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-lg border-light">
            <div className="card-body">
              <h2 className="text-center mb-4 text-primary">View Announcement</h2>
              {error ? (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              ) : announcementDetails ? (
                <>
                  <div className="mb-3">
                    <h5 className="text-info">Title:</h5>
                    <p>{announcementDetails.title}</p>
                  </div>
                  <div className="mb-3">
                    <h5 className="text-info">Content:</h5>
                    <p>{announcementDetails.content}</p>
                  </div>
                  <div className="mb-3">
                    <h5 className="text-info">Posted By:</h5>
                    <p>{announcementDetails.username}</p>
                  </div>
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => navigate(`/crud-announcement/${announcementDetails.class_id}`)} // Navigate back to the class's announcement list using the class_id
                  >
                    Back to Announcements
                  </button>
                </>
              ) : (
                <p className="text-muted">Loading announcement details...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewAnnouncement;
 