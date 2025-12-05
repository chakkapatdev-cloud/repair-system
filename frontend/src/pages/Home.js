import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card } from 'react-bootstrap';
import { FiPlus, FiList, FiClipboard, FiClock, FiCheckCircle, FiTool } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { StatusBadge, PriorityBadge, LoadingSpinner } from '../components/StatusBadge';

const Home = () => {
    const { user, isAdmin, isTechnician } = useAuth();
    const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0 });
    const [recentRepairs, setRecentRepairs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, repairsRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/repairs?limit=5')
            ]);
            setStats(statsRes.data);
            setRecentRepairs(repairsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <div className="page-header">
                <h1>🏠 หน้าหลัก</h1>
            </div>

            {/* Welcome Card */}
            <Card className="mb-4" style={{ background: 'var(--gradient)', color: 'white' }}>
                <Card.Body className="py-4">
                    <h4>สวัสดี, {user?.full_name}! 👋</h4>
                    <p className="mb-0 opacity-75">
                        ยินดีต้อนรับสู่ระบบแจ้งซ่อมออนไลน์ คุณสามารถแจ้งปัญหาและติดตามสถานะการซ่อมได้ที่นี่
                    </p>
                </Card.Body>
            </Card>

            {/* Quick Stats */}
            <Row className="g-4 mb-4">
                <Col sm={6} lg={3}>
                    <div className="stat-card">
                        <div className="stat-icon warning"><FiClock /></div>
                        <div className="stat-content">
                            <h3>{stats?.pending || 0}</h3>
                            <p>รอดำเนินการ</p>
                        </div>
                    </div>
                </Col>
                <Col sm={6} lg={3}>
                    <div className="stat-card">
                        <div className="stat-icon info"><FiTool /></div>
                        <div className="stat-content">
                            <h3>{stats?.inProgress || 0}</h3>
                            <p>กำลังดำเนินการ</p>
                        </div>
                    </div>
                </Col>
                <Col sm={6} lg={3}>
                    <div className="stat-card">
                        <div className="stat-icon success"><FiCheckCircle /></div>
                        <div className="stat-content">
                            <h3>{stats?.completedThisMonth || 0}</h3>
                            <p>เสร็จสิ้นเดือนนี้</p>
                        </div>
                    </div>
                </Col>
                <Col sm={6} lg={3}>
                    <div className="stat-card">
                        <div className="stat-icon primary"><FiClipboard /></div>
                        <div className="stat-content">
                            <h3>{stats?.total || 0}</h3>
                            <p>รายการทั้งหมด</p>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Quick Actions */}
            <Row className="g-4 mb-4">
                <Col md={6}>
                    <Card className="h-100">
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center py-5">
                            <FiPlus size={48} className="text-primary mb-3" />
                            <h5>แจ้งซ่อมใหม่</h5>
                            <p className="text-muted text-center">พบปัญหา? แจ้งซ่อมได้ทันที</p>
                            <Link to="/repairs/new" className="btn btn-gradient">
                                <FiPlus /> แจ้งซ่อม
                            </Link>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="h-100">
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center py-5">
                            <FiList size={48} className="text-info mb-3" />
                            <h5>ดูรายการแจ้งซ่อม</h5>
                            <p className="text-muted text-center">ติดตามสถานะการซ่อมของคุณ</p>
                            <Link to="/repairs" className="btn btn-outline-primary">
                                <FiList /> ดูรายการ
                            </Link>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Recent Repairs */}
            <Card>
                <Card.Header>รายการแจ้งซ่อมล่าสุด</Card.Header>
                <Card.Body className="p-0">
                    {recentRepairs.length === 0 ? (
                        <div className="text-center py-4 text-muted">
                            ยังไม่มีรายการแจ้งซ่อม
                        </div>
                    ) : (
                        <table className="table mb-0">
                            <thead>
                                <tr>
                                    <th>เลขที่</th>
                                    <th>หัวข้อ</th>
                                    <th>สถานะ</th>
                                    <th>ความเร่งด่วน</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentRepairs.slice(0, 5).map(repair => (
                                    <tr key={repair.id}>
                                        <td>
                                            <Link to={`/repairs/${repair.id}`} className="fw-bold">
                                                {repair.request_no}
                                            </Link>
                                        </td>
                                        <td>{repair.title}</td>
                                        <td><StatusBadge status={repair.status} /></td>
                                        <td><PriorityBadge priority={repair.priority} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default Home;
