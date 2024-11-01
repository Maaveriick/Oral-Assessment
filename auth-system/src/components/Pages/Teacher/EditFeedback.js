import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditFeedback = () => {
    const { id } = useParams();
    const [feedback, setFeedback] = useState({ feedback: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/feedbacks/${id}`);
                setFeedback(response.data);
            } catch (error) {
                setError('Error fetching feedback. Please try again.');
                console.error('Error fetching feedback:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFeedback();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFeedback({ ...feedback, [name]: value });
    };

    const handleFileChange = (e) => {
        setFeedback({ ...feedback, video: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('feedback', feedback.feedback);

        try {
            await axios.put(`http://localhost:5000/feedbacks/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Important for file uploads
                },
            });
            navigate('/crud-feedback');
        } catch (error) {
            setError('Error updating feedback. Please try again.');
            console.error('Error updating feedback:', error);
        }
    };

    if (loading) {
        return <div>Loading...</div>; // Loading indicator
    }

    return (
        <div className="container">
            <h1 className="mb-4">Edit Feedback</h1>
            {error && <div className="alert alert-danger">{error}</div>} {/* Error message */}
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Feedback:</label>
                    <input
                        type="text"
                        name="feedback"
                        className="form-control"
                        value={feedback.feedback}
                        onChange={handleChange}
                        placeholder="Feedback"
                        required
                    />
                </div>
                
                <button type="submit" className="btn btn-primary">Update Topic</button>
            </form>
        </div>
    );
};

export default EditFeedback;
