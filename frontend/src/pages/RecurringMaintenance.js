import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Badge, Row, Col, Alert } from 'react-bootstrap';
import { FiPlus, FiEdit, FiTrash2, FiCalendar, FiClock, FiAlertTriangle, FiPlay } from 'react-icons/fi';
import api from '../services/api';

const RecurringMaintenance = () => {
    const [schedules, setSchedules] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [teams, setTeams] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title: '', description: '', equipment_id: '', frequency: 'monthly',
        assigned_team_id: '', assigned_technician_id: '', next_due: ''
    });

    const frequencies = [
        { value: 'daily', label: 'รายวัน' },
        { value: 'weekly', label: 'รายสัปดาห์' },
        { value: 'monthly', label: 'รายเดือน' },
        { value: 'quarterly', label: 'รายไตรมาส' },
        { value: 'yearly', label: 'รายปี' }
    ];

    useEffect(() => {
        fetchSchedules();
        fetchEquipment();
        fetchTeams();
        fetchTechnicians();
    }, []);

    const fetchSchedules = async () => {
        try {
            const response = await api.get('/maintenance');
            setSchedules(response.data);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const fetchEquipment = async () => {
        try {
            const response = await api.get('/equipment');
            setEquipment(response.data);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const fetchTeams = async () => {
        try {
            const response = await api.get('/teams');
            setTeams(response.data);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const fetchTechnicians = async () => {
        try {
            const response = await api.get('/users/technicians');
            setTechnicians(response.data);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/maintenance/${editingId}`, formData);
            } else {
                await api.post('/maintenance', formData);
            }
            setShowModal(false);
            resetForm();
            fetchSchedules();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleEdit = (schedule) => {
        setEditingId(schedule.id);
        setFormData({
            title: schedule.title,
            description: schedule.description || '',
            equipment_id: schedule.equipment_id || '',
            frequency: schedule.frequency,
            assigned_team_id: schedule.assigned_team_id || '',
            assigned_technician_id: schedule.assigned_technician_id || '',
            next_due: schedule.next_due ? schedule.next_due.split('T')[0] : ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('ต้องการลบรายการนี้?')) {
            try {
                await api.delete(`/maintenance/${id}`);
                fetchSchedules();
            } catch (error) {
                console.error('Error:', error);
            }
        }
    };

    const handleRunNow = async (schedule) => {
        if (window.confirm('สร้างรายการแจ้งซ่อมจากกำหนดการนี้?')) {
            try {
                await api.post(`/maintenance/${schedule.id}/run`);
                alert('สร้างรายการแจ้งซ่อมสำเร็จ');
                fetchSchedules();
            } catch (error) {
                console.error('Error:', error);
            }
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            title: '', description: '', equipment_id: '', frequency: 'monthly',
            assigned_team_id: '', assigned_technician_id: '', next_due: ''
        });
    };

    const isDue = (nextDue) => {
        if (!nextDue) return false;
        return new Date(nextDue) <= new Date();
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('th-TH');
    };

    const overdue = schedules.filter(s => isDue(s.next_due) && s.is_active);

    return (
        <div>
            <div className="page-header">
                <h1><FiCalendar className="me-2" />บำรุงรักษาตามกำหนด</h1>
                <Button className="btn-gradient" onClick={() => { resetForm(); setShowModal(true); }}>
                    <FiPlus /> เพิ่มกำหนดการ
                </Button>
            </div>

            {overdue.length > 0 && (
                <Alert variant="danger" className="d-flex align-items-center">
                    <FiAlertTriangle className="me-2" size={24} />
                    <div>
                        <strong>มี {overdue.length} รายการถึงกำหนดบำรุงรักษา!</strong>
                        <div className="small">{overdue.map(s => s.title).join(', ')}</div>
                    </div>
                </Alert>
            )}

            <Card>
                <Card.Body>
                    {schedules.length === 0 ? (
                        <Alert variant="info">ยังไม่มีกำหนดการบำรุงรักษา</Alert>
                    ) : (
                        <Table responsive hover>
                            <thead>
                                <tr>
                                    <th>รายการ</th>
                                    <th>อุปกรณ์</th>
                                    <th>ความถี่</th>
                                    <th>กำหนดถัดไป</th>
                                    <th>ผู้รับผิดชอบ</th>
                                    <th>สถานะ</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedules.map(s => (
                                    <tr key={s.id} className={isDue(s.next_due) && s.is_active ? 'table-warning' : ''}>
                                        <td>
                                            <strong>{s.title}</strong>
                                            {s.description && <div className="small text-muted">{s.description}</div>}
                                        </td>
                                        <td>{s.equipment_name || '-'}</td>
                                        <td>
                                            <Badge bg="info">
                                                {frequencies.find(f => f.value === s.frequency)?.label}
                                            </Badge>
                                        </td>
                                        <td>
                                            {isDue(s.next_due) && s.is_active ? (
                                                <Badge bg="danger"><FiAlertTriangle /> เกินกำหนด</Badge>
                                            ) : (
                                                formatDate(s.next_due)
                                            )}
                                        </td>
                                        <td>{s.technician_name || s.team_name || '-'}</td>
                                        <td>
                                            <Badge bg={s.is_active ? 'success' : 'secondary'}>
                                                {s.is_active ? 'ใช้งาน' : 'ปิดใช้'}
                                            </Badge>
                                        </td>
                                        <td className="text-end">
                                            <Button variant="outline-success" size="sm" className="me-1" onClick={() => handleRunNow(s)} title="สร้างรายการซ่อมทันที">
                                                <FiPlay />
                                            </Button>
                                            <Button variant="outline-primary" size="sm" className="me-1" onClick={() => handleEdit(s)}>
                                                <FiEdit />
                                            </Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(s.id)}>
                                                <FiTrash2 />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingId ? 'แก้ไข' : 'เพิ่ม'}กำหนดการบำรุงรักษา</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>หัวข้อ *</Form.Label>
                            <Form.Control
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                required
                                placeholder="เช่น ล้างทำความสะอาดแอร์"
                            />
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>อุปกรณ์</Form.Label>
                                    <Form.Select
                                        value={formData.equipment_id}
                                        onChange={(e) => setFormData({...formData, equipment_id: e.target.value})}
                                    >
                                        <option value="">-- ไม่ระบุ --</option>
                                        {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>ความถี่ *</Form.Label>
                                    <Form.Select
                                        value={formData.frequency}
                                        onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                                    >
                                        {frequencies.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>รายละเอียด</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            />
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>ทีม</Form.Label>
                                    <Form.Select
                                        value={formData.assigned_team_id}
                                        onChange={(e) => setFormData({...formData, assigned_team_id: e.target.value})}
                                    >
                                        <option value="">-- ไม่ระบุ --</option>
                                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>หรือช่าง</Form.Label>
                                    <Form.Select
                                        value={formData.assigned_technician_id}
                                        onChange={(e) => setFormData({...formData, assigned_technician_id: e.target.value})}
                                    >
                                        <option value="">-- ไม่ระบุ --</option>
                                        {technicians.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group>
                            <Form.Label><FiClock className="me-1" />กำหนดถัดไป *</Form.Label>
                            <Form.Control
                                type="date"
                                value={formData.next_due}
                                onChange={(e) => setFormData({...formData, next_due: e.target.value})}
                                required
                            />
                        </Form.Group>
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

export default RecurringMaintenance;
