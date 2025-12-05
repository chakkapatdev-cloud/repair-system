import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Row, Col, Badge, Alert } from 'react-bootstrap';
import { FiPlus, FiEdit, FiTrash2, FiAlertTriangle, FiPackage } from 'react-icons/fi';
import api from '../services/api';
import { LoadingSpinner, EmptyState } from '../components/StatusBadge';

const SparePartsManagement = () => {
    const [parts, setParts] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [adjustItem, setAdjustItem] = useState(null);
    const [adjustment, setAdjustment] = useState(0);
    const [formData, setFormData] = useState({
        part_code: '', name: '', description: '', category: '',
        quantity: 0, min_quantity: 5, unit: 'ชิ้น', unit_cost: 0, location: ''
    });

    useEffect(() => {
        fetchParts();
        fetchLowStock();
    }, []);

    const fetchParts = async () => {
        try {
            const response = await api.get('/spareparts');
            setParts(response.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLowStock = async () => {
        try {
            const response = await api.get('/spareparts/low-stock');
            setLowStock(response.data);
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
                await api.put(`/spareparts/${editingItem.id}`, formData);
            } else {
                await api.post('/spareparts', formData);
            }
            setShowModal(false);
            resetForm();
            fetchParts();
            fetchLowStock();
        } catch (error) {
            console.error('Error:', error);
            alert(error.response?.data?.message || 'เกิดข้อผิดพลาด');
        }
    };

    const handleAdjust = async () => {
        try {
            await api.post(`/spareparts/${adjustItem.id}/adjust`, { adjustment });
            setShowAdjustModal(false);
            setAdjustItem(null);
            setAdjustment(0);
            fetchParts();
            fetchLowStock();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({ ...item });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('คุณต้องการลบอะไหล่นี้หรือไม่?')) {
            try {
                await api.delete(`/spareparts/${id}`);
                fetchParts();
            } catch (error) {
                console.error('Error:', error);
            }
        }
    };

    const resetForm = () => {
        setEditingItem(null);
        setFormData({
            part_code: '', name: '', description: '', category: '',
            quantity: 0, min_quantity: 5, unit: 'ชิ้น', unit_cost: 0, location: ''
        });
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <div className="page-header">
                <h1>📦 คลังอะไหล่</h1>
                <Button className="btn-gradient" onClick={() => { resetForm(); setShowModal(true); }}>
                    <FiPlus /> เพิ่มอะไหล่
                </Button>
            </div>

            {/* Low Stock Alert */}
            {lowStock.length > 0 && (
                <Alert variant="warning" className="d-flex align-items-center">
                    <FiAlertTriangle className="me-2" size={24} />
                    <div>
                        <strong>แจ้งเตือน:</strong> มี {lowStock.length} รายการที่จำนวนต่ำกว่าเกณฑ์
                        <span className="ms-2">
                            {lowStock.slice(0, 3).map(p => p.name).join(', ')}
                            {lowStock.length > 3 && ` และอื่นๆ`}
                        </span>
                    </div>
                </Alert>
            )}

            {parts.length === 0 ? (
                <EmptyState title="ไม่มีอะไหล่" message="ยังไม่มีอะไหล่ในคลัง" />
            ) : (
                <Row xs={1} md={2} lg={3} className="g-4">
                    {parts.map(item => (
                        <Col key={item.id}>
                            <Card className={`h-100 hover-card ${item.quantity <= item.min_quantity ? 'border-warning' : ''}`}>
                                <Card.Header className="bg-transparent border-bottom-0 pb-0 pt-3">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <Badge bg="light" text="dark" className="border">
                                            {item.part_code}
                                        </Badge>
                                        {item.quantity <= item.min_quantity && (
                                            <Badge bg="danger">สินค้าใกล้หมด</Badge>
                                        )}
                                    </div>
                                    <h5 className="card-title text-truncate mb-0" title={item.name}>{item.name}</h5>
                                </Card.Header>
                                <Card.Body className="pt-2">
                                    <div className="text-center py-3">
                                        <div className={`display-6 fw-bold ${item.quantity <= item.min_quantity ? 'text-danger' : 'text-primary'}`}>
                                            {item.quantity}
                                        </div>
                                        <div className="text-muted small">{item.unit}</div>
                                    </div>
                                    
                                    <div className="small">
                                        <div className="d-flex justify-content-between mb-1">
                                            <span className="text-muted">ราคา/หน่วย:</span>
                                            <span className="fw-bold">฿{parseFloat(item.unit_cost).toLocaleString()}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-1">
                                            <span className="text-muted">หมวดหมู่:</span>
                                            <span>{item.category}</span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">สถานที่เก็บ:</span>
                                            <span>{item.location || '-'}</span>
                                        </div>
                                    </div>
                                </Card.Body>
                                <Card.Footer className="bg-transparent border-top-0 pt-0 pb-3">
                                    <div className="d-flex gap-2">
                                        <Button 
                                            size="sm" 
                                            variant="outline-success" 
                                            className="flex-grow-1"
                                            onClick={() => { setAdjustItem(item); setShowAdjustModal(true); }}
                                            title="ปรับจำนวนสต๊อก"
                                        >
                                            <FiPackage /> ปรับสต๊อก
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outline-primary" 
                                            onClick={() => handleEdit(item)}
                                            title="แก้ไข"
                                        >
                                            <FiEdit />
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outline-danger" 
                                            onClick={() => handleDelete(item.id)}
                                            title="ลบ"
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

            {/* Add/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingItem ? 'แก้ไขอะไหล่' : 'เพิ่มอะไหล่ใหม่'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>รหัสอะไหล่ *</Form.Label>
                                    <Form.Control name="part_code" value={formData.part_code} 
                                        onChange={handleChange} required disabled={!!editingItem} />
                                </Form.Group>
                            </Col>
                            <Col md={8}>
                                <Form.Group className="mb-3">
                                    <Form.Label>ชื่ออะไหล่ *</Form.Label>
                                    <Form.Control name="name" value={formData.name} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>หมวดหมู่</Form.Label>
                                    <Form.Control name="category" value={formData.category} onChange={handleChange} 
                                        placeholder="เช่น ไฟฟ้า, ประปา, แอร์" />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>สถานที่เก็บ</Form.Label>
                                    <Form.Control name="location" value={formData.location} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>จำนวน</Form.Label>
                                    <Form.Control type="number" name="quantity" value={formData.quantity} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>จำนวนขั้นต่ำ</Form.Label>
                                    <Form.Control type="number" name="min_quantity" value={formData.min_quantity} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>หน่วย</Form.Label>
                                    <Form.Control name="unit" value={formData.unit} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>ราคา/หน่วย</Form.Label>
                                    <Form.Control type="number" step="0.01" name="unit_cost" value={formData.unit_cost} onChange={handleChange} />
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

            {/* Adjust Stock Modal */}
            <Modal show={showAdjustModal} onHide={() => setShowAdjustModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>ปรับจำนวนสต๊อก</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {adjustItem && (
                        <>
                            <p><strong>{adjustItem.name}</strong></p>
                            <p>จำนวนปัจจุบัน: {adjustItem.quantity} {adjustItem.unit}</p>
                            <Form.Group>
                                <Form.Label>ปรับจำนวน (+เพิ่ม / -ลด)</Form.Label>
                                <Form.Control type="number" value={adjustment} 
                                    onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)} />
                            </Form.Group>
                            <p className="mt-2">
                                จำนวนหลังปรับ: <strong>{adjustItem.quantity + adjustment} {adjustItem.unit}</strong>
                            </p>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAdjustModal(false)}>ยกเลิก</Button>
                    <Button variant="primary" onClick={handleAdjust}>ยืนยัน</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default SparePartsManagement;
