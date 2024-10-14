import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditTopic = () => {
    const { id } = useParams();
    const [topic, setTopic] = useState({ topicname: '', difficulty: '', description: '', video: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTopic = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/topics/${id}`);
                setTopic(response.data);
            } catch (error) {
                setError('Error fetching topic. Please try again.');
                console.error('Error fetching topic:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTopic();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTopic({ ...topic, [name]: value });
    };

    const handleFileChange = (e) => {
        setTopic({ ...topic, video: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('topicname', topic.topicname);
        formData.append('difficulty', topic.difficulty);
        formData.append('description', topic.description); // Append the description
        if (topic.video) {
            formData.append('video', topic.video); // Append the video file
        }

        try {
            await axios.put(`http://localhost:5000/topics/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Important for file uploads
                },
            });
            navigate('/crud-topic');
        } catch (error) {
            setError('Error updating topic. Please try again.');
            console.error('Error updating topic:', error);
        }
    };

    if (loading) {
        return <div>Loading...</div>; // Loading indicator
    }

    return (
        <div className="container">
            <h1 className="mb-4">Edit Topic</h1>
            {error && <div className="alert alert-danger">{error}</div>} {/* Error message */}
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Topic Name:</label>
                    <input
                        type="text"
                        name="topicname"
                        className="form-control"
                        value={topic.topicname}
                        onChange={handleChange}
                        placeholder="Topic Name"
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Difficulty:</label>
                    <select
                        name="difficulty"
                        className="form-select"
                        value={topic.difficulty}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Difficulty</option>
                        <option value="Easy">Easy</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Hard">Hard</option>
                    </select>
                </div>
                <div className="mb-3">
                    <label className="form-label">Description:</label>
                    <textarea
                        name="description"
                        className="form-control"
                        value={topic.description}
                        onChange={handleChange}
                        placeholder="Enter Topic Description"
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Upload Video:</label>
                    <input
                        type="file"
                        accept="video/*" // Accept video files
                        onChange={handleFileChange}
                        className="form-control"
                    />
                </div>
                {topic.video && (
                    <div className="mb-3">
                        <h5>Selected Video:</h5>
                        <video width="300" controls>
                            <source src={URL.createObjectURL(topic.video)} type={topic.video.type} />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                )}
                <button type="submit" className="btn btn-primary">Update Topic</button>
            </form>
        </div>
    );
};

export default EditTopic;
