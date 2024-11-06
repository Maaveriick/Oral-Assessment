import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import Home from './components/Home';
import Register from './components/Register';
import Login from './components/Login';
import HomeStudent from './components/Pages/Student/HomeStudent';
import HomeTeacher from './components/Pages/Teacher/HomeTeacher';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import TopicList from './components/Pages/Teacher/TopicList';
import CreateTopic from './components/Pages/Teacher/CreateTopic';
import EditTopic from './components/Pages/Teacher/EditTopic';
import ViewTopic from './components/Pages/Teacher/ViewTopic';
import OralAssessment from './components/Pages/Student/OralAssessment';

import FeedbackList from './components/Pages/Teacher/FeedbackList';
import CreateFeedback from './components/Pages/Teacher/CreateFeedback';
import EditFeedback from './components/Pages/Teacher/EditFeedback';
import ViewFeedback from './components/Pages/Teacher/ViewFeedback';
// import Feedback from './components/Pages/Student/Feedback';

const App = () => {
    const [user, setUser] = useState({ username: '', role: '' });
    const [loading, setLoading] = useState(true); // Loading state

    const handleLoginSuccess = (loggedInUsername, loggedInRole) => {
        setUser({ username: loggedInUsername, role: loggedInRole });
        localStorage.setItem('user', JSON.stringify({ username: loggedInUsername, role: loggedInRole }));
    };

    const handleLogout = () => {
        setUser({ username: '', role: '' });
        localStorage.removeItem('user');
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false); // Data is now loaded
    }, []);

    // Show a loading message until user data is retrieved
    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <Router>
            <div>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />

                    {/* Protected Routes */}
                    <Route
                        path="/homestudent"
                        element={user.role === 'Student' ? <HomeStudent username={user.username} onLogout={handleLogout} /> : <Navigate to="/" />}
                    />
                    <Route
                        path="/hometeacher"
                        element={user.role === 'Teacher' ? <HomeTeacher username={user.username} onLogout={handleLogout} /> : <Navigate to="/" />}
                    />

                    {/* Topic management routes for teachers */}
                    <Route
                        path="/crud-topic"
                        element={user.role === 'Teacher' ? <TopicList /> : <Navigate to="/" />}
                    />
                    <Route
                        path="/create-topic"
                        element={user.role === 'Teacher' ? <CreateTopic /> : <Navigate to="/" />}
                    />
                    <Route
                        path="/edit-topic/:id"
                        element={user.role === 'Teacher' ? <EditTopic /> : <Navigate to="/" />}
                    />
                    <Route
                        path="/view-topic/:id"
                        element={user.role === 'Teacher' ? <ViewTopic /> : <Navigate to="/" />}
                    />

<Route
                        path="/crud-feedback"
                        element={user.role === 'Teacher' ? <FeedbackList /> : <Navigate to="/" />}
                    />
                    <Route
                        path="/create-feedback"
                        element={user.role === 'Teacher' ? <CreateFeedback /> : <Navigate to="/" />}
                    />
                    <Route
                        path="/edit-feedback/:id"
                        element={user.role === 'Teacher' ? <EditFeedback /> : <Navigate to="/" />}
                    />
                    <Route
                        path="/view-feedback/:id"
                        element={user.role === 'Teacher' ? <ViewFeedback /> : <Navigate to="/" />}
                    />


                    {/* Student-specific routes */}
                    <Route 
                        path="/oral-assessment" 
                        element={user.role === 'Student' ? <OralAssessment username={user.username} /> : <Navigate to="/" />} 
                    />
                      
                </Routes>
            </div>
        </Router>
    );
};

export default App;
