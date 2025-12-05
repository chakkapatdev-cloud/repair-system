import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { FiTool, FiUser, FiLock, FiMail, FiPhone } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        email: '',
        phone: '',
        department_id: ''
    });
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchDepartments();
    }, []);

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
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('รหัสผ่านไม่ตรงกัน');
            return;
        }

        if (formData.password.length < 6) {
            setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
            return;
        }

        setLoading(true);

        try {
            await register(formData);
            navigate('/login', { state: { message: 'สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ' } });
        } catch (err) {
            setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '500px' }}>
                <div className="auth-logo">
                    <FiTool size={48} />
                </div>
                <h2>สมัครสมาชิก</h2>
                <p className="subtitle">สร้างบัญชีใหม่เพื่อใช้งานระบบ</p>

                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label><FiUser className="me-2" />ชื่อผู้ใช้</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="username"
                                    placeholder="กรอกชื่อผู้ใช้"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>ชื่อ-นามสกุล</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="full_name"
                                    placeholder="กรอกชื่อ-นามสกุล"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label><FiMail className="me-2" />อีเมล</Form.Label>
                                <Form.Control
                                    type="email"
                                    name="email"
                                    placeholder="กรอกอีเมล"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label><FiPhone className="me-2" />โทรศัพท์</Form.Label>
                                <Form.Control
                                    type="tel"
                                    name="phone"
                                    placeholder="กรอกเบอร์โทร"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

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

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label><FiLock className="me-2" />รหัสผ่าน</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="password"
                                    placeholder="กรอกรหัสผ่าน"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>ยืนยันรหัสผ่าน</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="ยืนยันรหัสผ่าน"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Button 
                        type="submit" 
                        className="btn-gradient w-100 mb-3"
                        disabled={loading}
                    >
                        {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
                    </Button>

                    <p className="text-center mb-0">
                        มีบัญชีแล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
                    </p>
                </Form>
            </div>
        </div>
    );
};

export default Register;
