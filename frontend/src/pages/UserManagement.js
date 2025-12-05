import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Row, Col, Badge } from 'react-bootstrap';
import { FiPlus, FiEdit, FiTrash2, FiUserCheck, FiUserX } from 'react-icons/fi';
import api from '../services/api';
import { LoadingSpinner, EmptyState } from '../components/StatusBadge';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        full_name: '',
        email: '',
        phone: '',
        role: 'user',
        department_id: ''
    });

    useEffect(() => {
        fetchUsers();
        fetchDepartments();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await api.get('/users/data/departments');
            setDepartments(response.data);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, formData);
            } else {
                await api.post('/users', formData);
            }
            setShowModal(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            alert(error.response?.data?.message || 'เกิดข้อผิดพลาด');
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: '',
            full_name: user.full_name,
            email: user.email || '',
            phone: user.phone || '',
            role: user.role,
            department_id: user.department_id || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('คุณต้องการลบผู้ใช้นี้หรือไม่?')) {
            try {
                await api.delete(`/users/${id}`);
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    const handleToggleActive = async (user) => {
        try {
            await api.put(`/users/${user.id}`, { is_active: !user.is_active });
            fetchUsers();
        } catch (error) {
            console.error('Error toggling user status:', error);
        }
    };

    const resetForm = () => {
        setEditingUser(null);
        setFormData({
            username: '',
            password: '',
            full_name: '',
            email: '',
            phone: '',
            role: 'user',
            department_id: ''
        });
    };

    const getRoleBadge = (role) => {
        const roles = {
            admin: { label: 'ผู้ดูแล', variant: 'danger' },
            technician: { label: 'ช่าง', variant: 'primary' },
            user: { label: 'ผู้ใช้', variant: 'secondary' }
        };
        const r = roles[role] || roles.user;
        return <Badge bg={r.variant}>{r.label}</Badge>;
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <div className="page-header">
                <h1>👥 จัดการผู้ใช้งาน</h1>
                <Button className="btn-gradient" onClick={() => { resetForm(); setShowModal(true); }}>
                    <FiPlus /> เพิ่มผู้ใช้
                </Button>
            </div>

            {users.length === 0 ? (
                <EmptyState title="ไม่มีผู้ใช้" message="ยังไม่มีผู้ใช้ในระบบ" />
            ) : (
                <Row xs={1} md={2} lg={3} xl={4} className="g-4">
                    {users.map(user => (
                        <Col key={user.id}>
                            <Card className="h-100 hover-card">
                                <Card.Header className="d-flex justify-content-between align-items-center bg-transparent border-bottom-0 pb-0 pt-3">
                                    <div className="d-flex align-items-center">
                                        <div className={`rounded-circle bg-${user.role === 'admin' ? 'danger' : user.role === 'technician' ? 'primary' : 'secondary'} text-white d-flex align-items-center justify-content-center me-2`} style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                                             {user.full_name?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="fw-bold text-truncate" style={{ maxWidth: '120px' }} title={user.username}>{user.username}</span>
                                    </div>
                                    <Badge bg={user.is_active ? 'success' : 'secondary'}>
                                        {user.is_active ? 'ใช้งาน' : 'ระงับ'}
                                    </Badge>
                                </Card.Header>
                                <Card.Body className="pt-2">
                                    <h5 className="card-title mb-1 text-truncate" title={user.full_name}>{user.full_name}</h5>
                                    <div className="mb-3">{getRoleBadge(user.role)}</div>
                                    
                                    <div className="text-muted small">
                                        <div className="mb-1 text-truncate" title={user.email}>📧 {user.email || '-'}</div>
                                        <div className="mb-1">📱 {user.phone || '-'}</div>
                                        <div className="text-truncate" title={user.department_name}>🏢 {user.department_name || '-'}</div>
                                    </div>
                                </Card.Body>
                                <Card.Footer className="bg-transparent border-top-0 pt-0 pb-3">
                                    <div className="d-flex gap-2">
                                        <Button 
                                            size="sm" 
                                            variant="outline-primary"
                                            className="flex-grow-1"
                                            onClick={() => handleEdit(user)}
                                        >
                                            <FiEdit /> แก้ไข
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant={user.is_active ? 'outline-warning' : 'outline-success'}
                                            onClick={() => handleToggleActive(user)}
                                            title={user.is_active ? 'ระงับการใช้งาน' : 'เปิดใช้งาน'}
                                        >
                                            {user.is_active ? <FiUserX /> : <FiUserCheck />}
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outline-danger"
                                            onClick={() => handleDelete(user.id)}
                                            title="ลบผู้ใช้"
                                        >
                                            <FiTrash2 />
                                        </Button>
                                    </div>
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* User Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>ชื่อผู้ใช้ <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                        disabled={!!editingUser}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        รหัสผ่าน {!editingUser && <span className="text-danger">*</span>}
                                    </Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required={!editingUser}
                                        placeholder={editingUser ? 'ปล่อยว่างถ้าไม่เปลี่ยน' : ''}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>ชื่อ-นามสกุล <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>อีเมล</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>โทรศัพท์</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>บทบาท</Form.Label>
                                    <Form.Select name="role" value={formData.role} onChange={handleChange}>
                                        <option value="user">ผู้ใช้ทั่วไป</option>
                                        <option value="technician">ช่าง</option>
                                        <option value="admin">ผู้ดูแลระบบ</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>แผนก</Form.Label>
                                    <Form.Select 
                                        name="department_id" 
                                        value={formData.department_id} 
                                        onChange={handleChange}
                                    >
                                        <option value="">-- เลือกแผนก --</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>ยกเลิก</Button>
                        <Button type="submit" variant="primary">บันทึก</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default UserManagement;
