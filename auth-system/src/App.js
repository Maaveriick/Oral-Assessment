// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Home from './components/Home';
import Register from './components/Register';
import Login from './components/Login';
import HomeStudent from './components/Pages/Student/HomeStudent';
import HomeTeacher from './components/Pages/Teacher/HomeTeacher';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import TopicList from './components/Pages/Teacher/TopicList';  // Import the TopicList component
import CreateTopic from './components/Pages/Teacher/CreateTopic'; // Adjust the path as necessary
import EditTopic from './components/Pages/Teacher/EditTopic'; // Adjust the path as necessary
import ViewTopic from './components/Pages/Teacher/ViewTopic'; // Adjust the path as necessary
import OralAssessment from './components/Pages/Student/OralAssessment';

const App = () => {
    const [user, setUser] = useState({ username: '', role: '' });

    const handleLogin = (username, role) => {
        setUser({ username, role });
        localStorage.setItem('user', JSON.stringify({ username, role }));
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
                    <Route path="/login" element={<Login onLoginSuccess={handleLogin} />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} /> 
                    <Route path="/reset-password/:token" element={<ResetPassword />} /> 
                    <Route
                        path="/homestudent"
                        element={user.role === 'Student' ? <HomeStudent username={user.username} onLogout={handleLogout} /> : <Home />}
                    />
                    <Route
                        path="/hometeacher"
                        element={user.role === 'Teacher' ? <HomeTeacher username={user.username} onLogout={handleLogout} /> : <Home />}
                    />
                    <Route path="/crud-topic" element={<TopicList />} /> {/* Define the route */}
                    <Route path="/create-topic" element={<CreateTopic />} /> 
                    <Route path="/edit-topic/:id" element={<EditTopic />} /> 
                    <Route path="/view-topic/:id" element={<ViewTopic />} /> 

                    <Route path="/oral-assessment" element={<OralAssessment />} /> 
                </Routes>
            </div>
        </Router>
    );
};

export default App;
