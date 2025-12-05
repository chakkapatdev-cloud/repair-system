import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Badge, Alert, Row, Col } from 'react-bootstrap';
import { FiPlus, FiEdit, FiTrash2, FiCheckSquare, FiList } from 'react-icons/fi';
import api from '../services/api';

const ChecklistTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', description: '', category_id: '', steps: []
    });
    const [newStep, setNewStep] = useState('');

    useEffect(() => {
        fetchTemplates();
        fetchCategories();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/checklists');
            setTemplates(response.data);
        } catch (error) {
            console.error('Error:', error);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/checklists/${editingId}`, formData);
            } else {
                await api.post('/checklists', formData);
            }
            setShowModal(false);
            resetForm();
            fetchTemplates();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleEdit = (template) => {
        setEditingId(template.id);
        setFormData({
            name: template.name,
            description: template.description || '',
            category_id: template.category_id || '',
            steps: template.steps || []
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('ต้องการลบเทมเพลตนี้?')) {
            try {
                await api.delete(`/checklists/${id}`);
                fetchTemplates();
            } catch (error) {
                console.error('Error:', error);
            }
        }
    };

    const addStep = () => {
        if (newStep.trim()) {
            setFormData({
                ...formData,
                steps: [...formData.steps, { text: newStep, order: formData.steps.length + 1 }]
            });
            setNewStep('');
        }
    };

    const removeStep = (index) => {
        setFormData({
            ...formData,
            steps: formData.steps.filter((_, i) => i !== index)
        });
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ name: '', description: '', category_id: '', steps: [] });
        setNewStep('');
    };

    return (
        <div>
            <div className="page-header">
                <h1><FiCheckSquare className="me-2" />Checklist Templates</h1>
                <Button className="btn-gradient" onClick={() => { resetForm(); setShowModal(true); }}>
                    <FiPlus /> สร้างเทมเพลต
                </Button>
            </div>

            {templates.length === 0 ? (
                <Alert variant="info">ยังไม่มี Checklist Template</Alert>
            ) : (
                <Row xs={1} md={2} lg={3} className="g-4">
                    {templates.map(t => (
                        <Col key={t.id}>
                            <Card className="h-100 hover-card">
                                <Card.Header className="d-flex justify-content-between align-items-start bg-transparent border-bottom-0 pb-0 pt-3">
                                    <div className="fw-bold text-truncate me-2" title={t.name}>{t.name}</div>
                                    <Badge bg={t.is_active ? 'success' : 'secondary'}>
                                        {t.is_active ? 'ใช้งาน' : 'ปิดใช้'}
                                    </Badge>
                                </Card.Header>
                                <Card.Body className="pt-2">
                                    <p className="text-muted small mb-3" style={{ minHeight: '40px' }}>
                                        {t.description || '-'}
                                    </p>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-muted small">หมวดหมู่:</span>
                                        <span className="fw-medium">{t.category_name || '-'}</span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="text-muted small">จำนวนขั้นตอน:</span>
                                        <Badge bg="primary" pill>{t.steps?.length || 0}</Badge>
                                    </div>
                                </Card.Body>
                                <Card.Footer className="bg-transparent border-top-0 pt-0 pb-3">
                                    <div className="d-flex gap-2">
                                        <Button 
                                            variant="outline-primary" 
                                            size="sm" 
                                            className="flex-grow-1" 
                                            onClick={() => handleEdit(t)}
                                        >
                                            <FiEdit /> แก้ไข
                                        </Button>
                                        <Button 
                                            variant="outline-danger" 
                                            size="sm" 
                                            onClick={() => handleDelete(t.id)}
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

            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingId ? 'แก้ไข' : 'สร้าง'} Checklist Template</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>ชื่อเทมเพลต *</Form.Label>
                            <Form.Control
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                                placeholder="เช่น ขั้นตอนซ่อมแอร์"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>หมวดหมู่</Form.Label>
                            <Form.Select
                                value={formData.category_id}
                                onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                            >
                                <option value="">-- ทุกหมวดหมู่ --</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>รายละเอียด</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            />
                        </Form.Group>
                        
                        <Form.Label><FiList className="me-1" />ขั้นตอนการทำงาน</Form.Label>
                        <div className="border rounded p-3 bg-light mb-3">
                            {formData.steps.map((step, index) => (
                                <div key={index} className="d-flex align-items-center mb-2">
                                    <Badge bg="secondary" className="me-2">{index + 1}</Badge>
                                    <span className="flex-grow-1">{step.text}</span>
                                    <Button variant="link" className="text-danger p-0" onClick={() => removeStep(index)}>
                                        <FiTrash2 />
                                    </Button>
                                </div>
                            ))}
                            <div className="d-flex gap-2 mt-3">
                                <Form.Control
                                    placeholder="เพิ่มขั้นตอน..."
                                    value={newStep}
                                    onChange={(e) => setNewStep(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStep())}
                                />
                                <Button variant="primary" onClick={addStep}>เพิ่ม</Button>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>ยกเลิก</Button>
                        <Button type="submit" className="btn-gradient">บันทึก</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default ChecklistTemplates;
