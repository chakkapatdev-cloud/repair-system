import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Row, Col, Badge } from 'react-bootstrap';
import { FiPlus, FiEdit, FiTrash2, FiPrinter, FiSearch } from 'react-icons/fi';
import api from '../services/api';
import { LoadingSpinner, EmptyState } from '../components/StatusBadge';

const EquipmentManagement = () => {
    const [equipment, setEquipment] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedQR, setSelectedQR] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [filters, setFilters] = useState({ search: '', status: '' });
    const [formData, setFormData] = useState({
        equipment_code: '',
        name: '',
        description: '',
        location: '',
        building: '',
        floor: '',
        category_id: '',
        status: 'active'
    });

    useEffect(() => {
        fetchEquipment();
        fetchCategories();
    }, []);

    const fetchEquipment = async () => {
        try {
            const response = await api.get('/equipment', { params: filters });
            setEquipment(response.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/repairs/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await api.put(`/equipment/${editingItem.id}`, formData);
            } else {
                await api.post('/equipment', formData);
            }
            setShowModal(false);
            resetForm();
            fetchEquipment();
        } catch (error) {
            console.error('Error:', error);
            alert(error.response?.data?.message || 'เกิดข้อผิดพลาด');
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            equipment_code: item.equipment_code,
            name: item.name,
            description: item.description || '',
            location: item.location || '',
            building: item.building || '',
            floor: item.floor || '',
            category_id: item.category_id || '',
            status: item.status
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('คุณต้องการลบอุปกรณ์นี้หรือไม่?')) {
            try {
                await api.delete(`/equipment/${id}`);
                fetchEquipment();
            } catch (error) {
                console.error('Error:', error);
            }
        }
    };

    const handleShowQR = async (item) => {
        if (item.qr_code_url) {
            setSelectedQR({ name: item.name, code: item.equipment_code, qr: item.qr_code_url });
            setShowQRModal(true);
        } else {
            try {
                const response = await api.post(`/equipment/${item.id}/qrcode`);
                setSelectedQR({ name: item.name, code: item.equipment_code, qr: response.data.qr_code });
                setShowQRModal(true);
                fetchEquipment();
            } catch (error) {
                console.error('Error:', error);
            }
        }
    };

    const resetForm = () => {
        setEditingItem(null);
        setFormData({
            equipment_code: '', name: '', description: '', location: '',
            building: '', floor: '', category_id: '', status: 'active'
        });
    };

    const getStatusBadge = (status) => {
        const statuses = {
            active: { label: 'ใช้งาน', bg: 'success' },
            inactive: { label: 'ไม่ใช้งาน', bg: 'secondary' },
            maintenance: { label: 'ซ่อมบำรุง', bg: 'warning' }
        };
        const s = statuses[status] || statuses.active;
        return <Badge bg={s.bg}>{s.label}</Badge>;
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <div className="page-header">
                <h1>🖥️ จัดการอุปกรณ์</h1>
                <Button className="btn-gradient" onClick={() => { resetForm(); setShowModal(true); }}>
                    <FiPlus /> เพิ่มอุปกรณ์
                </Button>
            </div>

            {/* Filters */}
            <Card className="mb-4">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={4}>
                            <Form.Control
                                type="text"
                                placeholder="ค้นหา..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </Col>
                        <Col md={3}>
                            <Form.Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                                <option value="">ทุกสถานะ</option>
                                <option value="active">ใช้งาน</option>
                                <option value="inactive">ไม่ใช้งาน</option>
                                <option value="maintenance">ซ่อมบำรุง</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Button variant="primary" onClick={fetchEquipment}>
                                <FiSearch /> ค้นหา
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {equipment.length === 0 ? (
                <EmptyState title="ไม่มีอุปกรณ์" message="ยังไม่มีอุปกรณ์ในระบบ" />
            ) : (
                <Row xs={1} md={2} lg={3} xl={4} className="g-4">
                    {equipment.map(item => (
                        <Col key={item.id}>
                            <Card className="h-100 hover-card">
                                <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                                    <span className="fw-bold text-primary">{item.equipment_code}</span>
                                    {getStatusBadge(item.status)}
                                </Card.Header>
                                <Card.Body>
                                    <div className="text-center mb-3">
                                         <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px' }}>
                                            <FiPrinter size={32} className="text-secondary" />
                                        </div>
                                    </div>
                                    <h5 className="text-center mb-1 text-truncate" title={item.name}>{item.name}</h5>
                                    <p className="text-center text-muted small mb-3">{item.category_name}</p>
                                    
                                    <div className="d-flex align-items-center text-muted small mb-2">
                                        <div className="flex-shrink-0 me-2">📍</div>
                                        <div className="text-truncate">
                                            {item.building} {item.floor && `ชั้น ${item.floor}`} {item.location}
                                        </div>
                                    </div>
                                </Card.Body>
                                <Card.Footer className="bg-white border-top-0 pt-0">
                                    <div className="d-flex gap-2">
                                        <Button size="sm" variant="outline-primary" className="flex-grow-1" onClick={() => handleEdit(item)}>
                                            <FiEdit /> แก้ไข
                                        </Button>
                                        <Button size="sm" variant="outline-dark" onClick={() => handleShowQR(item)}>
                                            <FiPrinter /> QR
                                        </Button>
                                        <Button size="sm" variant="outline-danger" onClick={() => handleDelete(item.id)}>
                                            <FiTrash2 />
                                        </Button>
                                    </div>
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* Equipment Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingItem ? 'แก้ไขอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>รหัสอุปกรณ์ *</Form.Label>
                                    <Form.Control name="equipment_code" value={formData.equipment_code} 
                                        onChange={handleChange} required disabled={!!editingItem} />
                                </Form.Group>
                            </Col>
                            <Col md={8}>
                                <Form.Group className="mb-3">
                                    <Form.Label>ชื่ออุปกรณ์ *</Form.Label>
                                    <Form.Control name="name" value={formData.name} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>รายละเอียด</Form.Label>
                            <Form.Control as="textarea" name="description" value={formData.description} onChange={handleChange} />
                        </Form.Group>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>อาคาร</Form.Label>
                                    <Form.Control name="building" value={formData.building} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>ชั้น</Form.Label>
                                    <Form.Control name="floor" value={formData.floor} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>ห้อง/สถานที่</Form.Label>
                                    <Form.Control name="location" value={formData.location} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>หมวดหมู่</Form.Label>
                                    <Form.Select name="category_id" value={formData.category_id} onChange={handleChange}>
                                        <option value="">-- เลือก --</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>สถานะ</Form.Label>
                                    <Form.Select name="status" value={formData.status} onChange={handleChange}>
                                        <option value="active">ใช้งาน</option>
                                        <option value="inactive">ไม่ใช้งาน</option>
                                        <option value="maintenance">ซ่อมบำรุง</option>
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

            {/* QR Code Modal */}
            <Modal show={showQRModal} onHide={() => setShowQRModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>QR Code</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    {selectedQR && (
                        <>
                            <h5>{selectedQR.name}</h5>
                            <p className="text-muted">{selectedQR.code}</p>
                            <img src={selectedQR.qr} alt="QR Code" style={{ maxWidth: '250px' }} />
                            <p className="mt-3 small text-muted">
                                สแกนเพื่อแจ้งซ่อมอุปกรณ์นี้
                            </p>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => window.print()}>
                        <FiPrinter /> พิมพ์
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default EquipmentManagement;
