import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { FiUser, FiMail, FiPhone, FiLock, FiSave, FiCamera, FiUpload } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user, updateProfile } = useAuth();
    const fileInputRef = useRef(null);
    const [profileData, setProfileData] = useState({
        full_name: '',
        email: '',
        phone: '',
        avatar: ''
    });
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/auth/profile');
            setProfileData({
                full_name: response.data.full_name,
                email: response.data.email || '',
                phone: response.data.phone || '',
                avatar: response.data.avatar || ''
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: 'danger', text: 'ไฟล์รูปภาพต้องมีขนาดไม่เกิน 2MB' });
            return;
        }

        // Preview
        setAvatarPreview(URL.createObjectURL(file));

        // Upload
        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            const response = await api.post('/auth/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Update user in localStorage
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            savedUser.avatar = response.data.avatar;
            localStorage.setItem('user', JSON.stringify(savedUser));
            
            // Update local state
            setProfileData(prev => ({ ...prev, avatar: response.data.avatar }));
            setAvatarPreview(null);
            setMessage({ type: 'success', text: 'อัปโหลดรูปโปรไฟล์สำเร็จ' });
            
            // Dispatch custom event to notify Navbar to update
            window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: response.data.avatar }));
        } catch (error) {
            console.error('Upload error:', error);
            setMessage({ type: 'danger', text: error.response?.data?.message || 'อัปโหลดรูปไม่สำเร็จ' });
            setAvatarPreview(null);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setLoading(true);

        try {
            await updateProfile(profileData);
            setMessage({ type: 'success', text: 'อัปเดตโปรไฟล์สำเร็จ' });
        } catch (error) {
            setMessage({ type: 'danger', text: error.response?.data?.message || 'เกิดข้อผิดพลาด' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (passwordData.new_password !== passwordData.confirm_password) {
            setMessage({ type: 'danger', text: 'รหัสผ่านใหม่ไม่ตรงกัน' });
            return;
        }

        if (passwordData.new_password.length < 6) {
            setMessage({ type: 'danger', text: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
            return;
        }

        setLoading(true);

        try {
            await api.put('/auth/password', {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });
            setMessage({ type: 'success', text: 'เปลี่ยนรหัสผ่านสำเร็จ' });
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        } catch (error) {
            setMessage({ type: 'danger', text: error.response?.data?.message || 'เกิดข้อผิดพลาด' });
        } finally {
            setLoading(false);
        }
    };

    const getRoleLabel = (role) => {
        const roles = { admin: 'ผู้ดูแลระบบ', technician: 'ช่าง', user: 'ผู้ใช้ทั่วไป' };
        return roles[role] || role;
    };

    const getAvatarUrl = () => {
        if (avatarPreview) return avatarPreview;
        if (profileData.avatar) return `http://localhost:5001/uploads/${profileData.avatar}`;
        return null;
    };

    return (
        <div>
            <div className="page-header">
                <h1>⚙️ โปรไฟล์ของฉัน</h1>
            </div>

            {message.text && (
                <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
                    {message.text}
                </Alert>
            )}

            <Row>
                {/* Avatar Section */}
                <Col lg={4} className="mb-4">
                    <Card className="text-center">
                        <Card.Body>
                            <div 
                                className="avatar-upload-container" 
                                onClick={handleAvatarClick}
                                style={{
                                    width: '150px',
                                    height: '150px',
                                    margin: '0 auto 20px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    border: '4px solid #4F46E5',
                                    background: getAvatarUrl() ? 'transparent' : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)'
                                }}
                            >
                                {getAvatarUrl() ? (
                                    <img 
                                        src={getAvatarUrl()} 
                                        alt="Avatar" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        fontSize: '4rem',
                                        color: 'white',
                                        fontWeight: 'bold'
                                    }}>
                                        {user?.full_name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    background: 'rgba(0,0,0,0.6)',
                                    color: 'white',
                                    padding: '8px',
                                    fontSize: '0.8rem'
                                }}>
                                    <FiCamera className="me-1" /> เปลี่ยนรูป
                                </div>
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handleAvatarChange}
                                style={{ display: 'none' }}
                            />
                            <h4>{user?.full_name}</h4>
                            <p className="text-muted">{getRoleLabel(user?.role)}</p>
                            {uploadingAvatar && <p className="text-primary">กำลังอัปโหลด...</p>}
                            <small className="text-muted d-block mt-2">
                                คลิกที่รูปเพื่อเปลี่ยน (สูงสุด 2MB)
                            </small>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={8}>
                    <Row>
                        <Col lg={12}>
                            <Card className="mb-4">
                                <Card.Header>
                                    <FiUser className="me-2" />
                                    ข้อมูลส่วนตัว
                                </Card.Header>
                                <Card.Body>
                                    <Form onSubmit={handleProfileSubmit}>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>ชื่อผู้ใช้</Form.Label>
                                                    <Form.Control type="text" value={user?.username} disabled />
                                                    <Form.Text className="text-muted">ไม่สามารถเปลี่ยนได้</Form.Text>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>บทบาท</Form.Label>
                                                    <Form.Control type="text" value={getRoleLabel(user?.role)} disabled />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Form.Group className="mb-3">
                                            <Form.Label>ชื่อ-นามสกุล</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="full_name"
                                                value={profileData.full_name}
                                                onChange={handleProfileChange}
                                                required
                                            />
                                        </Form.Group>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label><FiMail className="me-2" />อีเมล</Form.Label>
                                                    <Form.Control
                                                        type="email"
                                                        name="email"
                                                        value={profileData.email}
                                                        onChange={handleProfileChange}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label><FiPhone className="me-2" />โทรศัพท์</Form.Label>
                                                    <Form.Control
                                                        type="tel"
                                                        name="phone"
                                                        value={profileData.phone}
                                                        onChange={handleProfileChange}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Button type="submit" className="btn-gradient" disabled={loading}>
                                            <FiSave /> บันทึก
                                        </Button>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={12}>
                            <Card>
                                <Card.Header>
                                    <FiLock className="me-2" />
                                    เปลี่ยนรหัสผ่าน
                                </Card.Header>
                                <Card.Body>
                                    <Form onSubmit={handlePasswordSubmit}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>รหัสผ่านปัจจุบัน</Form.Label>
                                            <Form.Control
                                                type="password"
                                                name="current_password"
                                                value={passwordData.current_password}
                                                onChange={handlePasswordChange}
                                                required
                                            />
                                        </Form.Group>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>รหัสผ่านใหม่</Form.Label>
                                                    <Form.Control
                                                        type="password"
                                                        name="new_password"
                                                        value={passwordData.new_password}
                                                        onChange={handlePasswordChange}
                                                        required
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>ยืนยันรหัสผ่านใหม่</Form.Label>
                                                    <Form.Control
                                                        type="password"
                                                        name="confirm_password"
                                                        value={passwordData.confirm_password}
                                                        onChange={handlePasswordChange}
                                                        required
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Button type="submit" variant="outline-primary" disabled={loading}>
                                            <FiLock /> เปลี่ยนรหัสผ่าน
                                        </Button>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </div>
    );
};

export default Profile;
