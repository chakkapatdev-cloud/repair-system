import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    FiHome, FiTool, FiPlus, FiList, FiUsers, FiSettings, 
    FiLogOut, FiClipboard, FiBarChart2, FiMonitor, FiPackage, 
    FiFileText, FiCheckSquare, FiCalendar, FiX
} from 'react-icons/fi';

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout, isAdmin, isTechnician } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
            
            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h4>🔧 ระบบแจ้งซ่อม</h4>
                        <small>Online Repair System</small>
                    </div>
                    <button className="btn btn-link text-white d-lg-none p-0" onClick={onClose}>
                        <FiX size={24} />
                    </button>
                </div>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <FiHome /> หน้าหลัก
                </NavLink>

                <div className="nav-divider"></div>
                <div className="nav-section-title">การแจ้งซ่อม</div>

                <NavLink to="/repairs/new" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <FiPlus /> แจ้งซ่อมใหม่
                </NavLink>

                <NavLink to="/repairs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <FiList /> รายการแจ้งซ่อม
                </NavLink>

                {user?.role === 'user' && (
                    <NavLink to="/my-requests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <FiClipboard /> รายการของฉัน
                    </NavLink>
                )}

                {isTechnician && (
                    <NavLink to="/my-jobs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <FiTool /> งานของฉัน
                    </NavLink>
                )}

                {(isAdmin || isTechnician) && (
                    <>
                        <div className="nav-divider"></div>
                        <div className="nav-section-title">คลังอะไหล่</div>

                        <NavLink to="/spareparts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <FiPackage /> คลังอะไหล่
                        </NavLink>
                    </>
                )}

                {isAdmin && (
                    <>
                        <div className="nav-divider"></div>
                        <div className="nav-section-title">ผู้ดูแลระบบ</div>

                        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <FiBarChart2 /> Dashboard
                        </NavLink>

                        <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <FiUsers /> จัดการผู้ใช้
                        </NavLink>

                        <NavLink to="/equipment" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <FiMonitor /> จัดการอุปกรณ์
                        </NavLink>

                        <NavLink to="/checklists" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <FiCheckSquare /> Checklist
                        </NavLink>

                        <NavLink to="/maintenance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <FiCalendar /> บำรุงรักษา PM
                        </NavLink>

                        <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <FiFileText /> รายงาน
                        </NavLink>
                    </>
                )}

                <div className="nav-divider"></div>

                <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <FiSettings /> โปรไฟล์
                </NavLink>

                <button className="nav-item" onClick={handleLogout} style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}>
                    <FiLogOut /> ออกจากระบบ
                </button>
            </nav>
        </div>
        </>
    );
};

export default Sidebar;
