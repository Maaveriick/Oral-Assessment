import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditTopic = () => {
    const { id } = useParams();
    const [topic, setTopic] = useState({
        topicname: '',
        difficulty: '',
        description: '',
        video: null,
        videoUrl: '', // State to hold the video URL
        questions: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTopic = async () => {
            try {
                const topicResponse = await axios.get(`http://localhost:5000/topics/${id}`);
                setTopic((prev) => ({
                    ...prev,
                    ...topicResponse.data,
                    questions: topicResponse.data.questions || [],
                    videoUrl: topicResponse.data.videoUrl || '',
                }));
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
        setTopic((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (file && file.type.startsWith('video/')) {
            const newVideoUrl = URL.createObjectURL(file);

            if (topic.videoUrl) {
                URL.revokeObjectURL(topic.videoUrl);
            }

            setTopic((prev) => ({
                ...prev,
                video: file,
                videoUrl: newVideoUrl,
            }));
        } else {
            setTopic((prev) => ({
                ...prev,
                video: null,
                videoUrl: '',
            }));
        }
    };

    const handleQuestionChange = (index, value) => {
        const updatedQuestions = [...topic.questions];
        updatedQuestions[index] = value;
        setTopic((prev) => ({
            ...prev,
            questions: updatedQuestions,
        }));
    };

    const addQuestion = () => {
        setTopic((prev) => ({ ...prev, questions: [...prev.questions, ''] }));
    };

    const removeQuestion = (index) => {
        const updatedQuestions = topic.questions.filter((_, i) => i !== index);
        setTopic((prev) => ({ ...prev, questions: updatedQuestions }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('topicname', topic.topicname);
        formData.append('difficulty', topic.difficulty);
        formData.append('description', topic.description);
        if (topic.video) {
            formData.append('video', topic.video);
        }

        topic.questions.forEach((question, index) => {
            if (question) {
                formData.append(`questions[${index}]`, question);
            }
        });

        try {
            const response = await axios.put(`http://localhost:5000/topics/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            console.log('Topic Response:', response.data);
            navigate('/crud-topic');
        } catch (error) {
            setError('Error updating topic. Please try again.');
            console.error('Error updating topic:', error);
        }
    };

    const handleBack = () => {
        navigate('/crud-topic');
    };

    useEffect(() => {
        return () => {
            if (topic.videoUrl) {
                URL.revokeObjectURL(topic.videoUrl);
            }
        };
    }, [topic.videoUrl]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container">
            <h1 className="mb-4">Edit Topic</h1>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Topic Name:</label>
                    <input
                        type="text"
                        name="topicname"
                        className="form-control"
                        value={topic.topicname}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Difficulty:</label>
                    <select
                        name="difficulty"
                        className="form-select"
                        value={topic.difficulty || ''}
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
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Upload Video:</label>
                    <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        className="form-control"
                    />
                </div>
                {topic.videoUrl && ( // Display selected video if available
                    <div className="mb-3">
                        <h5>Selected Video:</h5>
                        <video width="300" controls>
                            <source src={topic.videoUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                )}
                {topic.video_url && (
                    <div className="mb-3">
                        <h5>Original Video:</h5>
                        <video width="300" controls>
                            <source src={`http://localhost:5000/${topic.video_url}`} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                )}
                <div className="mb-3">
                    <label className="form-label">Questions:</label>
                    {topic.questions.map((question, index) => (
                        <div key={index} className="input-group mb-2">
                            <input
                                type="text"
                                className="form-control"
                                value={question} // Directly use the question here
                                onChange={(e) => handleQuestionChange(index, e.target.value)}
                                placeholder={`Question ${index + 1}`}
                            />
                            <button type="button" className="btn btn-danger" onClick={() => removeQuestion(index)}>Remove</button>
                        </div>
                    ))}
                    <button type="button" className="btn btn-secondary" onClick={addQuestion}>Add Question</button>
                </div>
                <button type="submit" className="btn btn-primary">Save Changes</button>
                <button type="button" className="btn btn-secondary" onClick={handleBack}>Back</button>
            </form>
        </div>
    );
};

export default EditTopic;
