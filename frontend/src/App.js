import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import RepairList from './pages/RepairList';
import RepairForm from './pages/RepairForm';
import RepairDetail from './pages/RepairDetail';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import EquipmentManagement from './pages/EquipmentManagement';
import SparePartsManagement from './pages/SparePartsManagement';
import Reports from './pages/Reports';
import ChecklistTemplates from './pages/ChecklistTemplates';
import RecurringMaintenance from './pages/RecurringMaintenance';

// Protected Route Component
const ProtectedRoute = ({ children, roles }) => {
    const { user, loading, isAuthenticated } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="loading-spinner"><div className="spinner"></div></div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

// Main Layout
const MainLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="app-container">
            <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
            <div className="main-content">
                <Navbar toggleSidebar={toggleSidebar} />
                {children}
            </div>
        </div>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                    {/* Public Routes - NO LAYOUT */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected Routes - WITH LAYOUT */}
                    <Route path="/" element={
                        <ProtectedRoute>
                            <MainLayout><Home /></MainLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/dashboard" element={
                        <ProtectedRoute roles={['admin']}>
                            <MainLayout><Dashboard /></MainLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/repairs" element={
                        <ProtectedRoute>
                            <MainLayout><RepairList /></MainLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/repairs/new" element={
                        <ProtectedRoute>
                            <MainLayout><RepairForm /></MainLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/repairs/:id" element={
                        <ProtectedRoute>
                            <MainLayout><RepairDetail /></MainLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/repairs/:id/edit" element={
                        <ProtectedRoute>
                            <MainLayout><RepairForm /></MainLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/my-requests" element={
                        <ProtectedRoute>
                            <MainLayout><RepairList /></MainLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/my-jobs" element={
                        <ProtectedRoute roles={['technician', 'admin']}>
                            <MainLayout><RepairList /></MainLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/users" element={
                        <ProtectedRoute roles={['admin']}>
                            <MainLayout><UserManagement /></MainLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/equipment" element={
                        <ProtectedRoute roles={['admin']}>
                            <MainLayout><EquipmentManagement /></MainLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/spareparts" element={
                        <ProtectedRoute roles={['admin', 'technician']}>
                            <MainLayout><SparePartsManagement /></MainLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/reports" element={
                        <ProtectedRoute roles={['admin']}>
                            <MainLayout><Reports /></MainLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/checklists" element={
                        <ProtectedRoute roles={['admin']}>
                            <MainLayout><ChecklistTemplates /></MainLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/maintenance" element={
                        <ProtectedRoute roles={['admin']}>
                            <MainLayout><RecurringMaintenance /></MainLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <MainLayout><Profile /></MainLayout>
                        </ProtectedRoute>
                    } />

                    {/* Fallback - redirect to login */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
                <ToastContainer position="top-right" autoClose={3000} />
            </Router>
        </AuthProvider>
    );
};

export default App;
