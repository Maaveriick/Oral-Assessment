import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FlaggedAttempts = ({ username, topicId }) => {
  const [attempts, setAttempts] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch flaggable attempts when the component loads
    const fetchFlaggableAttempts = async () => {
      setLoading(true);
      setStatusMessage('Loading attempts...');
      
      try {
        // Fetch flaggable attempts from the backend
        const response = await axios.get('http://localhost:5000/flag_attempts', {
          params: { username, topicId },
        });
        
        setAttempts(response.data.attempts); // assuming the backend returns an array of attempts
        setStatusMessage('Attempts loaded');
      } catch (error) {
        console.error('Error fetching flaggable attempts:', error);
        setStatusMessage('Error fetching attempts. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFlaggableAttempts();
  }, [username, topicId]);

  return (
    <div>
      <h3>Flaggable Attempts for Grading</h3>
      {loading ? (
        <p>{statusMessage}</p>
      ) : (
        <div>
          {attempts.length > 0 ? (
            attempts.map((attempt) => (
              <div key={attempt.attempt_count}>
                <p>Attempt #{attempt.attempt_count} on {attempt.datetime}</p>
                {/* Add more details based on your needs */}
              </div>
            ))
          ) : (
            <p>No attempts found to flag</p>
          )}
        </div>
      )}
      <p>{statusMessage}</p>
    </div>
  );
};

export default FlaggedAttempts;
