import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Table, Form, Row, Col, Button, InputGroup, Badge } from 'react-bootstrap';
import { FiPlus, FiSearch, FiFilter, FiEye } from 'react-icons/fi';
import api from '../services/api';
import { StatusBadge, PriorityBadge, EmptyState, LoadingSpinner } from '../components/StatusBadge';

const RepairList = () => {
    const [repairs, setRepairs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        category_id: '',
        search: ''
    });

    useEffect(() => {
        fetchCategories();
        fetchRepairs();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/repairs/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchRepairs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
            const response = await api.get(`/repairs?${params.toString()}`);
            setRepairs(response.data);
        } catch (error) {
            console.error('Error fetching repairs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchRepairs();
    };

    const clearFilters = () => {
        setFilters({ status: '', priority: '', category_id: '', search: '' });
        setTimeout(fetchRepairs, 100);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div>
            <div className="page-header">
                <h1>📋 รายการแจ้งซ่อม</h1>
                <Link to="/repairs/new" className="btn btn-gradient">
                    <FiPlus /> แจ้งซ่อมใหม่
                </Link>
            </div>

            {/* Filters */}
            <Card className="mb-4">
                <Card.Body>
                    <Form onSubmit={handleSearch}>
                        <Row className="g-3 align-items-end">
                            <Col md={3}>
                                <Form.Label><FiSearch /> ค้นหา</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="search"
                                    placeholder="ค้นหาเลขที่, หัวข้อ..."
                                    value={filters.search}
                                    onChange={handleFilterChange}
                                />
                            </Col>
                            <Col md={2}>
                                <Form.Label>สถานะ</Form.Label>
                                <Form.Select name="status" value={filters.status} onChange={handleFilterChange}>
                                    <option value="">ทั้งหมด</option>
                                    <option value="pending">รอดำเนินการ</option>
                                    <option value="accepted">รับเรื่องแล้ว</option>
                                    <option value="in_progress">กำลังดำเนินการ</option>
                                    <option value="completed">เสร็จสิ้น</option>
                                    <option value="cancelled">ยกเลิก</option>
                                </Form.Select>
                            </Col>
                            <Col md={2}>
                                <Form.Label>ความเร่งด่วน</Form.Label>
                                <Form.Select name="priority" value={filters.priority} onChange={handleFilterChange}>
                                    <option value="">ทั้งหมด</option>
                                    <option value="low">ต่ำ</option>
                                    <option value="medium">ปกติ</option>
                                    <option value="high">สูง</option>
                                    <option value="urgent">ฉุกเฉิน</option>
                                </Form.Select>
                            </Col>
                            <Col md={2}>
                                <Form.Label>หมวดหมู่</Form.Label>
                                <Form.Select name="category_id" value={filters.category_id} onChange={handleFilterChange}>
                                    <option value="">ทั้งหมด</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col md={3}>
                                <div className="d-flex gap-2">
                                    <Button type="submit" variant="primary">
                                        <FiFilter /> กรอง
                                    </Button>
                                    <Button type="button" variant="outline-secondary" onClick={clearFilters}>
                                        ล้าง
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* Repairs Grid */}
            {loading ? (
                <LoadingSpinner />
            ) : repairs.length === 0 ? (
                <EmptyState 
                    title="ไม่พบรายการแจ้งซ่อม" 
                    message="ยังไม่มีรายการแจ้งซ่อมในระบบ"
                />
            ) : (
                <Row xs={1} md={2} lg={3} className="g-4">
                    {repairs.map(repair => (
                        <Col key={repair.id}>
                            <Card className="h-100 hover-card">
                                <Card.Header className="d-flex justify-content-between align-items-center bg-transparent border-bottom-0 pb-0 pt-3">
                                    <span className="text-muted small">#{repair.request_no}</span>
                                    <StatusBadge status={repair.status} />
                                </Card.Header>
                                <Card.Body className="pt-2">
                                    <div className="mb-2">
                                        <Badge bg="light" text="dark" className="me-2" style={{ border: '1px solid #e9ecef' }}>
                                            <span style={{ color: repair.category_color || '#6c757d', marginRight: '5px' }}>●</span>
                                            {repair.category_name}
                                        </Badge>
                                        <PriorityBadge priority={repair.priority} />
                                    </div>
                                    <Link to={`/repairs/${repair.id}`} className="text-decoration-none text-dark">
                                        <h5 className="card-title mb-2 text-truncate" title={repair.title}>{repair.title}</h5>
                                    </Link>
                                    <p className="card-text text-muted small mb-2">
                                        <span className="d-block text-truncate">📍 {repair.location}</span>
                                    </p>
                                    <div className="d-flex align-items-center text-muted small mt-3">
                                        <img 
                                            src={`https://ui-avatars.com/api/?name=${repair.requester_name}&background=random&size=24`} 
                                            alt={repair.requester_name}
                                            className="rounded-circle me-2"
                                            width="24"
                                            height="24"
                                        />
                                        <span>{repair.requester_name}</span>
                                        <span className="mx-2">•</span>
                                        <span>{formatDate(repair.created_at)}</span>
                                    </div>
                                </Card.Body>
                                <Card.Footer className="bg-transparent border-top-0 pt-0 pb-3">
                                    <Link to={`/repairs/${repair.id}`} className="btn btn-outline-primary w-100 btn-sm">
                                        <FiEye className="me-1" /> ดูรายละเอียด
                                    </Link>
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
};

export default RepairList;
