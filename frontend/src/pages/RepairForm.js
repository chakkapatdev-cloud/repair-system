import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, Form, Button, Row, Col, Alert, Badge } from 'react-bootstrap';
import { FiSave, FiArrowLeft, FiUpload, FiX, FiMonitor, FiMapPin } from 'react-icons/fi';
import api from '../services/api';

const RepairForm = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        category_id: '',
        priority: 'medium',
        equipment_id: ''
    });
    const [categories, setCategories] = useState([]);
    const [files, setFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [equipment, setEquipment] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCategories();
        
        // Check for equipment code from QR scan
        const equipmentCode = searchParams.get('equipment');
        if (equipmentCode) {
            fetchEquipmentByCode(equipmentCode);
        }
        
        if (isEdit) {
            fetchRepair();
        }
    }, [id, searchParams]);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/repairs/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchEquipmentByCode = async (code) => {
        try {
            const response = await api.get(`/equipment/code/${code}`);
            const eq = response.data;
            setEquipment(eq);
            
            // Auto-fill form with equipment data
            setFormData(prev => ({
                ...prev,
                equipment_id: eq.id,
                location: `${eq.building || ''} ${eq.floor ? 'ชั้น ' + eq.floor : ''} ${eq.location || ''}`.trim(),
                category_id: eq.category_id || prev.category_id,
                title: `แจ้งซ่อม: ${eq.name}`
            }));
        } catch (error) {
            console.error('Equipment not found:', error);
        }
    };

    const fetchRepair = async () => {
        try {
            const response = await api.get(`/repairs/${id}`);
            const repair = response.data;
            setFormData({
                title: repair.title,
                description: repair.description || '',
                location: repair.location || '',
                category_id: repair.category_id || '',
                priority: repair.priority,
                equipment_id: repair.equipment_id || ''
            });
        } catch (error) {
            console.error('Error fetching repair:', error);
            navigate('/repairs');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files);
        const allFiles = [...files, ...newFiles].slice(0, 5);
        setFiles(allFiles);
        
        // Create preview URLs
        const urls = allFiles.map(file => {
            if (file.type.startsWith('image/')) {
                return URL.createObjectURL(file);
            }
            return null;
        });
        setPreviewUrls(urls);
    };

    const removeFile = (index) => {
        if (previewUrls[index]) {
            URL.revokeObjectURL(previewUrls[index]);
        }
        setFiles(files.filter((_, i) => i !== index));
        setPreviewUrls(previewUrls.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (value) data.append(key, value);
            });
            files.forEach(file => {
                data.append('files', file);
            });

            if (isEdit) {
                await api.put(`/repairs/${id}`, formData);
            } else {
                await api.post('/repairs', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            navigate('/repairs');
        } catch (err) {
            setError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>{isEdit ? '✏️ แก้ไขรายการแจ้งซ่อม' : '➕ แจ้งซ่อมใหม่'}</h1>
                <Button variant="outline-secondary" onClick={() => navigate(-1)}>
                    <FiArrowLeft /> กลับ
                </Button>
            </div>

            {/* Equipment Info Card - shows when QR scanned */}
            {equipment && (
                <Card className="mb-3 border-primary">
                    <Card.Body className="d-flex align-items-center gap-3">
                        <div className="bg-primary text-white rounded p-3">
                            <FiMonitor size={24} />
                        </div>
                        <div>
                            <h5 className="mb-1">
                                <Badge bg="primary" className="me-2">{equipment.equipment_code}</Badge>
                                {equipment.name}
                            </h5>
                            <p className="mb-0 text-muted">
                                <FiMapPin className="me-1" />
                                {equipment.building} {equipment.floor && `ชั้น ${equipment.floor}`} {equipment.location}
                            </p>
                        </div>
                    </Card.Body>
                </Card>
            )}

            <Card>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={8}>
                                <Form.Group className="mb-3">
                                    <Form.Label>หัวข้อ / ปัญหาที่พบ <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="title"
                                        placeholder="เช่น แอร์ไม่เย็น, ไฟดับ, ท่อน้ำรั่ว"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>หมวดหมู่ <span className="text-danger">*</span></Form.Label>
                                    <Form.Select
                                        name="category_id"
                                        value={formData.category_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">-- เลือกหมวดหมู่ --</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>รายละเอียด</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                name="description"
                                placeholder="อธิบายรายละเอียดปัญหาเพิ่มเติม..."
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        <Row>
                            <Col md={8}>
                                <Form.Group className="mb-3">
                                    <Form.Label>สถานที่ / ห้อง / อาคาร <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="location"
                                        placeholder="เช่น ห้อง 101 อาคาร A ชั้น 2"
                                        value={formData.location}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>ความเร่งด่วน</Form.Label>
                                    <Form.Select
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleChange}
                                    >
                                        <option value="low">🟢 ต่ำ - ไม่เร่งด่วน</option>
                                        <option value="medium">🟡 ปกติ</option>
                                        <option value="high">🟠 สูง - ต้องการเร็ว</option>
                                        <option value="urgent">🔴 ฉุกเฉิน - ด่วนมาก!</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        {!isEdit && (
                            <Form.Group className="mb-4">
                                <Form.Label>แนบรูปภาพ (สูงสุด 5 ไฟล์)</Form.Label>
                                <div className="border rounded p-3 bg-light">
                                    <input
                                        type="file"
                                        id="file-upload"
                                        multiple
                                        accept="image/*,.pdf"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                    <label 
                                        htmlFor="file-upload" 
                                        className="btn btn-outline-primary mb-2"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <FiUpload /> เลือกไฟล์
                                    </label>
                                    
                                    {files.length > 0 && (
                                        <div className="d-flex flex-wrap gap-2 mt-2">
                                            {files.map((file, index) => (
                                                <div key={index} className="position-relative" style={{ width: '100px' }}>
                                                    {previewUrls[index] ? (
                                                        <img 
                                                            src={previewUrls[index]} 
                                                            alt={file.name}
                                                            className="rounded"
                                                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <div className="bg-secondary rounded d-flex align-items-center justify-content-center text-white"
                                                             style={{ width: '100px', height: '100px' }}>
                                                            PDF
                                                        </div>
                                                    )}
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-sm btn-danger position-absolute"
                                                        style={{ top: '-8px', right: '-8px', borderRadius: '50%', padding: '2px 6px' }}
                                                        onClick={() => removeFile(index)}
                                                    >
                                                        <FiX size={12} />
                                                    </button>
                                                    <small className="d-block text-truncate text-center">{file.name}</small>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Form.Group>
                        )}

                        <div className="d-flex gap-2">
                            <Button type="submit" className="btn-gradient" disabled={loading}>
                                <FiSave /> {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                            </Button>
                            <Button type="button" variant="outline-secondary" onClick={() => navigate(-1)}>
                                ยกเลิก
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
};

export default RepairForm;
