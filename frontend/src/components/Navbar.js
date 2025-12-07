import React, { useState, useEffect } from 'react';
import { Dropdown } from 'react-bootstrap';
import { FiBell, FiMenu, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Navbar = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [avatar, setAvatar] = useState(null);

    useEffect(() => {
        fetchNotifications();
        fetchUserAvatar();
        
        // Listen for avatar update event from Profile page
        const handleAvatarUpdate = (event) => {
            setAvatar(event.detail);
        };
        window.addEventListener('avatarUpdated', handleAvatarUpdate);
        
        return () => {
            window.removeEventListener('avatarUpdated', handleAvatarUpdate);
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data.notifications || []);
            setUnreadCount(response.data.unreadCount || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const fetchUserAvatar = async () => {
        try {
            // First check localStorage
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (savedUser.avatar) {
                setAvatar(savedUser.avatar);
            }
            
            // Then fetch from API to get latest
            const response = await api.get('/auth/profile');
            if (response.data.avatar) {
                setAvatar(response.data.avatar);
                // Update localStorage
                savedUser.avatar = response.data.avatar;
                localStorage.setItem('user', JSON.stringify(savedUser));
            }
        } catch (error) {
            console.error('Error fetching avatar:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        try {
            // Mark as read (don't delete from database)
            await api.put(`/notifications/${notification.id}/read`);
            
            // Remove from displayed list only
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
            setUnreadCount(prev => Math.max(0, prev - 1));
            
            if (notification.link) {
                navigate(notification.link);
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="top-navbar">
            <div className="navbar-left">
                <button 
                    className="btn btn-link d-lg-none" 
                    onClick={toggleSidebar}
                    style={{ color: 'var(--dark)' }}
                >
                    <FiMenu size={24} />
                </button>
                <span className="d-none d-md-block text-secondary">
                    ยินดีต้อนรับ, <strong>{user?.full_name}</strong>
                </span>
            </div>

            <div className="navbar-right">
                {/* Notifications */}
                <Dropdown align="end">
                    <Dropdown.Toggle as="div" className="notification-bell">
                        <FiBell size={20} />
                        {unreadCount > 0 && (
                            <span className="notification-badge">{unreadCount}</span>
                        )}
                    </Dropdown.Toggle>

                    <Dropdown.Menu style={{ width: '320px', maxHeight: '400px', overflow: 'auto' }}>
                        <Dropdown.Header>
                            <strong>การแจ้งเตือน</strong>
                        </Dropdown.Header>
                        {notifications.length === 0 ? (
                            <Dropdown.ItemText className="text-center text-muted py-3">
                                ไม่มีการแจ้งเตือน
                            </Dropdown.ItemText>
                        ) : (
                            notifications.slice(0, 5).map(notif => (
                                <Dropdown.Item 
                                    key={notif.id} 
                                    onClick={() => handleNotificationClick(notif)}
                                    className={!notif.is_read ? 'bg-light' : ''}
                                >
                                    <div>
                                        <strong>{notif.title}</strong>
                                        <p className="mb-0 small text-muted">{notif.message}</p>
                                    </div>
                                </Dropdown.Item>
                            ))
                        )}
                    </Dropdown.Menu>
                </Dropdown>

                {/* User Menu */}
                <Dropdown align="end">
                    <Dropdown.Toggle as="div" className="user-dropdown">
                        <div className="user-avatar" style={{ overflow: 'hidden' }}>
                            {avatar ? (
                                <img 
                                    src={`http://localhost:5001/uploads/${avatar}`} 
                                    alt="Avatar"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                getInitials(user?.full_name)
                            )}
                        </div>
                        <span className="d-none d-md-block">{user?.full_name}</span>
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        <Dropdown.Item onClick={() => navigate('/profile')}>
                            <FiUser className="me-2" /> โปรไฟล์
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={handleLogout} className="text-danger">
                            ออกจากระบบ
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </div>
    );
};

export default Navbar;

