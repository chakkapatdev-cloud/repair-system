import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Row, Col, Button, Form, Modal, Badge, Table, Alert, ProgressBar } from 'react-bootstrap';
import { 
    FiArrowLeft, FiEdit, FiTrash2, FiUser, FiMapPin, FiCalendar,
    FiMessageCircle, FiStar, FiUserCheck, FiImage, FiDollarSign,
    FiUpload, FiClock, FiAlertTriangle, FiCheckCircle, FiUsers
} from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge, LoadingSpinner } from '../components/StatusBadge';

const RepairDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAdmin, isTechnician } = useAuth();

    const [repair, setRepair] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [technicians, setTechnicians] = useState([]);
    const [teams, setTeams] = useState([]);
    const [spareParts, setSpareParts] = useState([]);
    const [selectedTechnician, setSelectedTechnician] = useState('');
    const [selectedTeam, setSelectedTeam] = useState('');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [showCostModal, setShowCostModal] = useState(false);
    const [showAfterPhotoModal, setShowAfterPhotoModal] = useState(false);
    const [rating, setRating] = useState(5);
    const [ratingComment, setRatingComment] = useState('');
    const [afterPhotos, setAfterPhotos] = useState([]);
    const [afterPhotoPreviews, setAfterPhotoPreviews] = useState([]);
    const [costs, setCosts] = useState([]);
    const [newCost, setNewCost] = useState({
        part_id: '', part_name: '', quantity: 1, unit_cost: 0, labor_cost: 0, other_cost: 0, note: ''
    });
    const [slaInfo, setSlaInfo] = useState(null);

    useEffect(() => {
        fetchRepair();
        if (isAdmin) {
            fetchTechnicians();
            fetchTeams();
        }
        if (isAdmin || isTechnician) {
            fetchSpareParts();
        }
        fetchSlaSettings();
    }, [id]);

    const fetchRepair = async () => {
        try {
            const response = await api.get(`/repairs/${id}`);
            setRepair(response.data);
            if (response.data.costs) {
                setCosts(response.data.costs);
            }
        } catch (error) {
            console.error('Error fetching repair:', error);
            navigate('/repairs');
        } finally {
            setLoading(false);
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

    const fetchTeams = async () => {
        try {
            const response = await api.get('/teams');
            setTeams(response.data);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const fetchSpareParts = async () => {
        try {
            const response = await api.get('/spareparts');
            setSpareParts(response.data);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const fetchSlaSettings = async () => {
        try {
            const response = await api.get('/reports/sla');
            setSlaInfo(response.data.settings);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await api.put(`/repairs/${id}/status`, { status: newStatus });
            fetchRepair();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleAssign = async () => {
        try {
            await api.put(`/repairs/${id}/assign`, { 
                technician_id: selectedTechnician,
                team_id: selectedTeam
            });
            setShowAssignModal(false);
            fetchRepair();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        try {
            await api.post(`/repairs/${id}/comments`, { content: comment });
            setComment('');
            fetchRepair();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleRating = async () => {
        try {
            await api.put(`/repairs/${id}/rate`, { rating, comment: ratingComment });
            setShowRatingModal(false);
            fetchRepair();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleAfterPhotoUpload = async () => {
        if (afterPhotos.length === 0) return;
        try {
            const formData = new FormData();
            afterPhotos.forEach(file => {
                formData.append('after_images', file);
            });
            await api.post(`/repairs/${id}/after-photo`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowAfterPhotoModal(false);
            setAfterPhotos([]);
            setAfterPhotoPreviews([]);
            fetchRepair();
        } catch (error) {
            console.error('Error:', error);
            alert('อัปโหลดไม่สำเร็จ');
        }
    };

    const handleAfterPhotoSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 5) {
            alert('อัปโหลดได้สูงสุด 5 รูป');
            return;
        }
        setAfterPhotos(files);
        const previews = files.map(file => URL.createObjectURL(file));
        setAfterPhotoPreviews(previews);
    };

    const handleAddCost = async () => {
        try {
            await api.post(`/repairs/${id}/costs`, newCost);
            setNewCost({ part_id: '', part_name: '', quantity: 1, unit_cost: 0, labor_cost: 0, other_cost: 0, note: '' });
            setShowCostModal(false);
            fetchRepair();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handlePartSelect = (partId) => {
        const part = spareParts.find(p => p.id === parseInt(partId));
        if (part) {
            setNewCost({
                ...newCost,
                part_id: part.id,
                part_name: part.name,
                unit_cost: part.unit_cost
            });
        }
    };

    const handleDelete = async () => {
        if (window.confirm('คุณต้องการลบรายการนี้หรือไม่?')) {
            try {
                await api.delete(`/repairs/${id}`);
                navigate('/repairs');
            } catch (error) {
                console.error('Error:', error);
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const calculateSLA = () => {
        if (!repair || !slaInfo) return null;
        const setting = slaInfo.find(s => s.priority === repair.priority);
        if (!setting) return null;

        const created = new Date(repair.created_at);
        const now = new Date();
        const hoursElapsed = (now - created) / (1000 * 60 * 60);
        
        const responseDeadline = setting.response_time_hours;
        const resolutionDeadline = setting.resolution_time_hours;
        
        return {
            responseHours: responseDeadline,
            resolutionHours: resolutionDeadline,
            hoursElapsed: hoursElapsed,
            responsePercent: Math.min(100, (hoursElapsed / responseDeadline) * 100),
            resolutionPercent: Math.min(100, (hoursElapsed / resolutionDeadline) * 100),
            isResponseOverdue: hoursElapsed > responseDeadline && repair.status === 'pending',
            isResolutionOverdue: hoursElapsed > resolutionDeadline && repair.status !== 'completed'
        };
    };

    const slaCalc = calculateSLA();

    if (loading) return <LoadingSpinner />;
    if (!repair) return null;

    const canEdit = repair.requester_id === user.id || isAdmin;
    const canRate = repair.requester_id === user.id && repair.status === 'completed' && !repair.rating;
    const totalCost = costs.reduce((sum, c) => {
        const qty = Number(c.quantity) || 0;
        const unit = Number(c.unit_cost) || 0;
        const labor = Number(c.labor_cost) || 0;
        const other = Number(c.other_cost) || 0;
        return sum + (qty * unit) + labor + other;
    }, 0);

    return (
        <div>
            <div className="page-header">
                <div>
                    <Button variant="link" className="p-0 mb-2" onClick={() => navigate(-1)}>
                        <FiArrowLeft /> กลับ
                    </Button>
                    <h1>🔧 {repair.request_no}</h1>
                </div>
                <div className="d-flex gap-2">
                    {canEdit && repair.status === 'pending' && (
                        <>
                            <Link to={`/repairs/${id}/edit`} className="btn btn-outline-primary">
                                <FiEdit /> แก้ไข
                            </Link>
                            <Button variant="outline-danger" onClick={handleDelete}>
                                <FiTrash2 /> ลบ
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* SLA Warning */}
            {slaCalc && (slaCalc.isResponseOverdue || slaCalc.isResolutionOverdue) && (
                <Alert variant="danger" className="d-flex align-items-center">
                    <FiAlertTriangle className="me-2" size={24} />
                    <div>
                        <strong>⚠️ SLA เกินกำหนด!</strong>
                        {slaCalc.isResponseOverdue && <span className="ms-2">Response Time เกิน</span>}
                        {slaCalc.isResolutionOverdue && <span className="ms-2">Resolution Time เกิน</span>}
                    </div>
                </Alert>
            )}

            <Row>
                {/* Main Content */}
                <Col lg={8}>
                    <Card className="mb-4">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <span>{repair.title}</span>
                            <div className="d-flex gap-2">
                                <StatusBadge status={repair.status} />
                                <PriorityBadge priority={repair.priority} />
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <p className="mb-4" style={{ whiteSpace: 'pre-wrap' }}>
                                {repair.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
                            </p>

                            <Row className="mb-3">
                                <Col sm={6}>
                                    <p className="mb-2">
                                        <FiMapPin className="me-2 text-primary" />
                                        <strong>สถานที่:</strong> {repair.location}
                                    </p>
                                </Col>
                                <Col sm={6}>
                                    <p className="mb-2">
                                        <strong>หมวดหมู่:</strong>{' '}
                                        <Badge style={{ backgroundColor: repair.category_color }}>
                                            {repair.category_name}
                                        </Badge>
                                    </p>
                                </Col>
                            </Row>

                            {/* Before/After Photos */}
                            <div className="mb-3">
                                <strong><FiImage className="me-2" />รูปภาพ:</strong>
                                <Row className="mt-2">
                                    <Col md={6}>
                                        <div className="text-center">
                                            <small className="text-muted">ก่อนซ่อม</small>
                                            {repair.files && repair.files.filter(f => f.file_type !== 'after').length > 0 ? (
                                                <div className="d-flex gap-2 flex-wrap justify-content-center">
                                                    {repair.files.filter(f => f.file_type !== 'after').map(file => (
                                                        <a key={file.id} href={`http://localhost:5001/uploads/${file.file_path}`} target="_blank" rel="noopener noreferrer">
                                                            <img src={`http://localhost:5001/uploads/${file.file_path}`} alt={file.file_name}
                                                                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #dc3545' }} />
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-muted">ไม่มีรูป</div>
                                            )}
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="text-center">
                                            <small className="text-muted">หลังซ่อม</small>
                                            {repair.files && repair.files.filter(f => f.file_type === 'after').length > 0 ? (
                                                <div className="d-flex gap-2 flex-wrap justify-content-center">
                                                    {repair.files.filter(f => f.file_type === 'after').map(file => (
                                                        <a key={file.id} href={`http://localhost:5001/uploads/${file.file_path}`} target="_blank" rel="noopener noreferrer">
                                                            <img src={`http://localhost:5001/uploads/${file.file_path}`} alt={file.file_name}
                                                                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #28a745' }} />
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : repair.after_image ? (
                                                <div>
                                                    <a href={`http://localhost:5001/uploads/${repair.after_image}`} target="_blank" rel="noopener noreferrer">
                                                        <img src={`http://localhost:5001/uploads/${repair.after_image}`} alt="After"
                                                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #28a745' }} />
                                                    </a>
                                                </div>
                                            ) : (
                                                <div>
                                                    {(isTechnician || isAdmin) && (repair.status === 'in_progress' || repair.status === 'completed') && (
                                                        <Button size="sm" variant="outline-success" onClick={() => setShowAfterPhotoModal(true)}>
                                                            <FiUpload /> อัปโหลดรูป
                                                        </Button>
                                                    )}
                                                    {!isTechnician && !isAdmin && <span className="text-muted">ยังไม่มี</span>}
                                                </div>
                                            )}
                                        </div>
                                    </Col>
                                </Row>
                            </div>

                            {/* Cost Summary */}
                            {costs.length > 0 && (
                                <div className="mb-3 p-3 bg-light rounded">
                                    <strong><FiDollarSign className="me-2" />ค่าใช้จ่าย:</strong>
                                    <Table size="sm" className="mt-2 mb-0">
                                        <thead><tr><th>รายการ</th><th>จำนวน</th><th>ราคา</th></tr></thead>
                                        <tbody>
                                            {costs.map((c, i) => {
                                                const qty = Number(c.quantity) || 0;
                                                const unit = Number(c.unit_cost) || 0;
                                                const labor = Number(c.labor_cost) || 0;
                                                const other = Number(c.other_cost) || 0;
                                                const itemTotal = (qty * unit) + labor + other;
                                                return (
                                                    <tr key={i}>
                                                        <td>{c.part_name || 'ค่าแรง/อื่นๆ'}</td>
                                                        <td>{qty}</td>
                                                        <td>฿{itemTotal.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr className="fw-bold"><td colSpan={2}>รวม</td><td>฿{totalCost.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
                                        </tfoot>
                                    </Table>
                                </div>
                            )}

                            {/* Rating */}
                            {repair.rating && (
                                <div className="p-3 bg-light rounded">
                                    <strong>คะแนนการซ่อม:</strong>
                                    <div className="rating-stars d-inline-flex ms-2">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <FiStar key={star} fill={star <= repair.rating ? '#FBBF24' : 'none'} color="#FBBF24" />
                                        ))}
                                    </div>
                                    {repair.rating_comment && <p className="mb-0 mt-2">{repair.rating_comment}</p>}
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Comments */}
                    <Card>
                        <Card.Header><FiMessageCircle className="me-2" />ความคิดเห็น ({repair.comments?.length || 0})</Card.Header>
                        <Card.Body>
                            {repair.comments?.map(c => (
                                <div key={c.id} className="comment-item">
                                    <div className="comment-avatar">{c.user_name?.charAt(0).toUpperCase()}</div>
                                    <div className="comment-content">
                                        <div className="comment-header">
                                            <span className="comment-author">
                                                {c.user_name}
                                                {c.user_role === 'technician' && <Badge bg="info" className="ms-2">ช่าง</Badge>}
                                            </span>
                                            <span className="comment-time">{formatDate(c.created_at)}</span>
                                        </div>
                                        <div className="comment-text">{c.content}</div>
                                    </div>
                                </div>
                            ))}
                            <Form onSubmit={handleAddComment} className="mt-3">
                                <Form.Control as="textarea" rows={2} placeholder="เพิ่มความคิดเห็น..." value={comment} onChange={(e) => setComment(e.target.value)} />
                                <Button type="submit" className="btn-primary mt-2" size="sm">ส่งความคิดเห็น</Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Sidebar */}
                <Col lg={4}>
                    {/* SLA Card */}
                    {slaCalc && repair.status !== 'completed' && (
                        <Card className="mb-4">
                            <Card.Header><FiClock className="me-2" />SLA Tracking</Card.Header>
                            <Card.Body>
                                <div className="mb-3">
                                    <small>Response Time ({slaCalc.responseHours}h)</small>
                                    <ProgressBar 
                                        now={slaCalc.responsePercent} 
                                        variant={slaCalc.responsePercent > 80 ? 'danger' : slaCalc.responsePercent > 50 ? 'warning' : 'success'}
                                    />
                                </div>
                                <div>
                                    <small>Resolution Time ({slaCalc.resolutionHours}h)</small>
                                    <ProgressBar 
                                        now={slaCalc.resolutionPercent} 
                                        variant={slaCalc.resolutionPercent > 80 ? 'danger' : slaCalc.resolutionPercent > 50 ? 'warning' : 'success'}
                                    />
                                </div>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Info Card */}
                    <Card className="mb-4">
                        <Card.Header>ข้อมูลรายการ</Card.Header>
                        <Card.Body>
                            <p><FiUser className="me-2" /><strong>ผู้แจ้ง:</strong> {repair.requester_name}</p>
                            <p><strong>แผนก:</strong> {repair.department_name || '-'}</p>
                            <p><FiCalendar className="me-2" /><strong>วันที่แจ้ง:</strong><br/>{formatDate(repair.created_at)}</p>
                            {repair.technician_name && (
                                <p><FiUserCheck className="me-2" /><strong>ช่าง:</strong><br/>{repair.technician_name}</p>
                            )}
                            {repair.team_name && (
                                <p><FiUsers className="me-2" /><strong>ทีม:</strong><br/>{repair.team_name}</p>
                            )}
                            {repair.completed_at && (
                                <p><FiCheckCircle className="me-2 text-success" /><strong>วันที่เสร็จ:</strong><br/>{formatDate(repair.completed_at)}</p>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Actions Card */}
                    {(isAdmin || isTechnician) && (
                        <Card className="mb-4">
                            <Card.Header>จัดการรายการ</Card.Header>
                            <Card.Body>
                                {isAdmin && !repair.technician_id && (
                                    <Button variant="primary" className="w-100 mb-2" onClick={() => setShowAssignModal(true)}>
                                        <FiUserCheck /> มอบหมายช่าง/ทีม
                                    </Button>
                                )}
                                {repair.status === 'accepted' && (
                                    <Button variant="warning" className="w-100 mb-2" onClick={() => handleStatusChange('in_progress')}>
                                        เริ่มดำเนินการ
                                    </Button>
                                )}
                                {repair.status === 'in_progress' && (
                                    <>
                                        <Button variant="outline-primary" className="w-100 mb-2" onClick={() => setShowCostModal(true)}>
                                            <FiDollarSign /> เพิ่มค่าใช้จ่าย
                                        </Button>
                                        <Button variant="success" className="w-100 mb-2" onClick={() => handleStatusChange('completed')}>
                                            <FiCheckCircle /> ซ่อมเสร็จแล้ว
                                        </Button>
                                    </>
                                )}
                            </Card.Body>
                        </Card>
                    )}

                    {/* Rating Button */}
                    {canRate && (
                        <Card><Card.Body className="text-center">
                            <p>การซ่อมเสร็จสิ้นแล้ว</p>
                            <Button variant="warning" onClick={() => setShowRatingModal(true)}><FiStar /> ให้คะแนน</Button>
                        </Card.Body></Card>
                    )}

                    {/* Timeline */}
                    {repair.history && repair.history.length > 0 && (
                        <Card className="mt-4">
                            <Card.Header>ประวัติการดำเนินงาน</Card.Header>
                            <Card.Body>
                                <div className="timeline">
                                    {repair.history.map(h => (
                                        <div key={h.id} className="timeline-item">
                                            <div className="small text-muted">{formatDate(h.created_at)}</div>
                                            <div><StatusBadge status={h.new_status} /></div>
                                            {h.note && <div className="small">{h.note}</div>}
                                            <div className="small text-muted">โดย {h.updated_by_name}</div>
                                        </div>
                                    ))}
                                </div>
                            </Card.Body>
                        </Card>
                    )}
                </Col>
            </Row>

            {/* Assign Modal */}
            <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)}>
                <Modal.Header closeButton><Modal.Title>มอบหมายช่าง/ทีม</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>เลือกช่าง</Form.Label>
                        <Form.Select value={selectedTechnician} onChange={(e) => setSelectedTechnician(e.target.value)}>
                            <option value="">-- เลือกช่าง --</option>
                            {technicians.map(tech => <option key={tech.id} value={tech.id}>{tech.full_name}</option>)}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>หรือเลือกทีม</Form.Label>
                        <Form.Select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
                            <option value="">-- เลือกทีม --</option>
                            {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                        </Form.Select>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAssignModal(false)}>ยกเลิก</Button>
                    <Button variant="primary" onClick={handleAssign} disabled={!selectedTechnician && !selectedTeam}>มอบหมาย</Button>
                </Modal.Footer>
            </Modal>

            {/* Cost Modal */}
            <Modal show={showCostModal} onHide={() => setShowCostModal(false)} size="lg">
                <Modal.Header closeButton><Modal.Title><FiDollarSign /> เพิ่มค่าใช้จ่าย</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>เลือกอะไหล่</Form.Label>
                                <Form.Select onChange={(e) => handlePartSelect(e.target.value)}>
                                    <option value="">-- เลือกจากคลัง --</option>
                                    {spareParts.map(p => <option key={p.id} value={p.id}>{p.name} (คงเหลือ {p.quantity})</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>หรือพิมพ์ชื่อ</Form.Label>
                                <Form.Control value={newCost.part_name} onChange={(e) => setNewCost({...newCost, part_name: e.target.value})} placeholder="ชื่อรายการ" />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>จำนวน</Form.Label>
                                <Form.Control type="number" min="1" value={newCost.quantity} onChange={(e) => setNewCost({...newCost, quantity: parseInt(e.target.value) || 1})} />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>ราคา/หน่วย</Form.Label>
                                <Form.Control type="number" value={newCost.unit_cost} onChange={(e) => setNewCost({...newCost, unit_cost: parseFloat(e.target.value) || 0})} />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>ค่าแรง</Form.Label>
                                <Form.Control type="number" value={newCost.labor_cost} onChange={(e) => setNewCost({...newCost, labor_cost: parseFloat(e.target.value) || 0})} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group>
                        <Form.Label>หมายเหตุ</Form.Label>
                        <Form.Control value={newCost.note} onChange={(e) => setNewCost({...newCost, note: e.target.value})} />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCostModal(false)}>ยกเลิก</Button>
                    <Button variant="primary" onClick={handleAddCost}>เพิ่มค่าใช้จ่าย</Button>
                </Modal.Footer>
            </Modal>

            {/* After Photo Modal */}
            <Modal show={showAfterPhotoModal} onHide={() => { setShowAfterPhotoModal(false); setAfterPhotos([]); setAfterPhotoPreviews([]); }}>
                <Modal.Header closeButton><Modal.Title><FiImage className="me-2" />อัปโหลดรูปหลังซ่อม</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form.Label>เลือกรูปภาพ (สูงสุด 5 รูป)</Form.Label>
                    <Form.Control 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={handleAfterPhotoSelect} 
                        className="mb-3" 
                    />
                    {afterPhotoPreviews.length > 0 && (
                        <div className="d-flex gap-2 flex-wrap justify-content-center">
                            {afterPhotoPreviews.map((preview, idx) => (
                                <img key={idx} src={preview} alt={`Preview ${idx + 1}`} 
                                    style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #28a745' }} />
                            ))}
                        </div>
                    )}
                    <p className="text-muted small mt-2 text-center">เลือกแล้ว {afterPhotos.length} รูป</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => { setShowAfterPhotoModal(false); setAfterPhotos([]); setAfterPhotoPreviews([]); }}>ยกเลิก</Button>
                    <Button variant="success" onClick={handleAfterPhotoUpload} disabled={afterPhotos.length === 0}>
                        <FiUpload className="me-1" /> อัปโหลด {afterPhotos.length > 0 && `(${afterPhotos.length} รูป)`}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Rating Modal */}
            <Modal show={showRatingModal} onHide={() => setShowRatingModal(false)}>
                <Modal.Header closeButton><Modal.Title>ให้คะแนนการซ่อม</Modal.Title></Modal.Header>
                <Modal.Body>
                    <div className="text-center mb-3">
                        <div className="rating-stars" style={{ fontSize: '2rem' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <FiStar key={star} fill={star <= rating ? '#FBBF24' : 'none'} color="#FBBF24" onClick={() => setRating(star)} style={{ cursor: 'pointer' }} />
                            ))}
                        </div>
                    </div>
                    <Form.Control as="textarea" rows={3} placeholder="ความคิดเห็นเพิ่มเติม" value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRatingModal(false)}>ยกเลิก</Button>
                    <Button variant="warning" onClick={handleRating}>ส่งคะแนน</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default RepairDetail;
