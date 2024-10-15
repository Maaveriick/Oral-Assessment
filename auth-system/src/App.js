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

const App = () => {
    const [user, setUser] = useState({ username: '', role: '' });

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
    }, []);

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
