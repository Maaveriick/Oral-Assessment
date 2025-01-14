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
import RubricsPage from './components/Pages/Admin/RubricsPage';  // Import the RubricsPage component

import FeedbackList from './components/Pages/Teacher/FeedbackList';
import CreateFeedback from './components/Pages/Teacher/CreateFeedback';
import EditFeedback from './components/Pages/Teacher/EditFeedback';
import ViewFeedback from './components/Pages/Teacher/ViewFeedback';
import StudentDetails from './components/Pages/Teacher/StudentDetails';
import AttemptsPage from './components/Pages/Teacher/AttemptsPage';
import TeacherList from './components/Pages/Admin/TeacherList';
import StudentList from './components/Pages/Admin/StudentList';
import StudentFeedback from './components/Pages/Student/StudentFeedback';
import StudentViewFeedback from './components/Pages/Student/StudentViewFeedback'
import HomeAdmin from './components/Pages/Admin/HomeAdmin';
import ClassList from './components/Pages/Admin/ClassList';
import CreateClass from './components/Pages/Admin/CreateClass';
import EditClass from './components/Pages/Admin/EditClass';
import ViewClass from './components/Pages/Admin/ViewClass';

import Class from './components/Pages/Teacher/Class';

import AnnouncementList from './components/Pages/Teacher/AnnouncementList';
import CreateAnnouncement from './components/Pages/Teacher/CreateAnnouncement';
import EditAnnouncement from './components/Pages/Teacher/EditAnnouncement';
import ViewAnnouncement from './components/Pages/Teacher/ViewAnnouncement';
import TeacherClasses from './components/Pages/Teacher/TeacherClasses';
import Rubrics from './components/Pages/Teacher/Rubrics'

import ClassAnalysis from './components/Pages/Teacher/ClassAnalysis';
import AnalysisList from './components/Pages/Teacher/AnalysisList';
import IndividualAnalysis from './components/Pages/Teacher/IndividualAnalysis';
import PerformanceManagement from './components/Pages/Teacher/PerformanceManagement';

import CreateRubric from './components/Pages/Teacher/CreateRubric';
import RubricList from './components/Pages/Teacher/RubricList';
import ViewRubric from './components/Pages/Teacher/ViewRubric';
import EditRubric from './components/Pages/Teacher/EditRubric';


const App = () => {
    const [user, setUser] = useState({ username: '', role: '' });
    const [loading, setLoading] = useState(true);

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
        setLoading(false);
    }, []);

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
                    <Route
                        path="/homeadmin"
                        element={user.role === 'Admin' ? <HomeAdmin username={user.username} onLogout={handleLogout} /> : <Navigate to="/" />}
                    />

                    {/* Topic management routes for teachers */}
                    <Route path="/crud-topic" element={user.role === 'Teacher' ? <TopicList /> : <Navigate to="/" />} />
                    <Route path="/create-topic" element={user.role === 'Teacher' ? <CreateTopic /> : <Navigate to="/" />} />
                    <Route path="/edit-topic/:id" element={user.role === 'Teacher' ? <EditTopic /> : <Navigate to="/" />} />
                    <Route path="/view-topic/:id" element={user.role === 'Teacher' ? <ViewTopic /> : <Navigate to="/" />} />

                    {/* Feedback management routes */}
                    <Route path="/class" element={user.role === 'Teacher' ? <Class /> : <Navigate to="/" />} />
                    <Route path="/feedback-list" element={ user.role === 'Teacher' ? <FeedbackList /> : <Navigate to="/" />}/>

                    <Route path="/create-feedback/:username/:topicId/:attempt_count" element={<CreateFeedback />} />
                    <Route path="/edit-feedback/:username/:topicId/:attempt_count" element={<EditFeedback />} />
                    <Route path="/view-feedback/:username/:topicId/:attempt_count" element={<ViewFeedback />} />

                    {/* Student-specific routes */}
                    <Route path="/oral-assessment" element={user.role === 'Student' ? <OralAssessment username={user.username} /> : <Navigate to="/" />} />
                    <Route path="/student-details/:id" element={user.role === 'Teacher' ? <StudentDetails /> : <Navigate to="/" />} />
                    <Route path="/attempts/:username/:topicId" element={user.role === 'Teacher' ? <AttemptsPage /> : <Navigate to="/" />} />
                    <Route path="/student-feedback" element={user.role === 'Student' ? <StudentFeedback username={user.username}  /> : <Navigate to="/" />} />
                    <Route path="/studentviewfeedback/:username/:topicId/:attempt_count" element={user.role === 'Student' ? <StudentViewFeedback username={user.username}  /> : <Navigate to="/" />} />
                    {/* Rubrics Page Route */}
                    <Route path="/rubrics" element={user.role === 'Admin' ? <RubricsPage /> : <Navigate to="/" />} />

                    <Route path="/crud-class" element={user.role === 'Admin' ? <ClassList onLogout={handleLogout} /> : <Navigate to="/" />} />
                    <Route path="/create-class" element={user.role === 'Admin' ? <CreateClass /> : <Navigate to="/" />} />
                    <Route path="/edit-class/:classId" element={user.role === 'Admin' ? <EditClass /> : <Navigate to="/" />} />
                    <Route path="/view-class/:classId" element={user.role === 'Admin' ? <ViewClass /> : <Navigate to="/" />} />
                   
                    <Route path="/teacherlist" element={user.role === 'Admin' ? <TeacherList onLogout={handleLogout} /> : <Navigate to="/" />} />
                    <Route path="/studentlist" element={user.role === 'Admin' ? <StudentList onLogout={handleLogout} /> : <Navigate to="/" />} />

                    <Route path="/crud-announcement/:classId" element={user.role === 'Teacher' ? <AnnouncementList onLogout={handleLogout} /> : <Navigate to="/" />} />
                    <Route path="/create-announcement/:classId" element={user.role === 'Teacher' ? <CreateAnnouncement /> : <Navigate to="/" />} />
                    <Route path="/edit-announcement/:classId/:announcementId" element={user.role === 'Teacher' ? <EditAnnouncement /> : <Navigate to="/" />} />
                    <Route path="/view-announcement/:classId/:announcementId" element={user.role === 'Teacher' ? <ViewAnnouncement /> : <Navigate to="/" />} />
                    <Route path="/teacher-classes" element={user.role === 'Teacher' ? <TeacherClasses /> : <Navigate to="/" />} />

                    <Route path="/rubricsTeacher" element={user.role === 'Teacher' ? <Rubrics /> : <Navigate to="/" />} />

                    <Route path="/class-analysis" element={user.role === 'Teacher' ? <ClassAnalysis /> : <Navigate to="/" />} />
                    <Route path="/performance-management" element={user.role === 'Teacher' ? <PerformanceManagement /> : <Navigate to="/" />} />
                    <Route path="/individual-analysis/:classId/:userId" element={user.role === 'Teacher' ? <IndividualAnalysis /> : <Navigate to="/" />} />
                    <Route path="/analysis-list" element={user.role === 'Teacher' ? <AnalysisList /> : <Navigate to="/" />} />

                    <Route path="/crud-rubric" element={user.role === 'Teacher' ? <RubricList onLogout={handleLogout} /> : <Navigate to="/" />} />
                    <Route path="/create-rubric" element={user.role === 'Teacher' ? <CreateRubric onLogout={handleLogout} /> : <Navigate to="/" />} />
                    <Route path="/edit-rubric/:rubricId" element={user.role === 'Teacher' ? <EditRubric onLogout={handleLogout} /> : <Navigate to="/" />} />
                    <Route path="/view-rubric/:rubricId" element={user.role === 'Teacher' ? <ViewRubric onLogout={handleLogout} /> : <Navigate to="/" />} />
                
                </Routes>
            </div>
        </Router>
    );
};

export default App;
