import React, { useState, useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
    FiClipboard, FiClock, FiTool, FiCheckCircle, 
    FiTrendingUp, FiStar, FiArrowRight 
} from 'react-icons/fi';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import api from '../services/api';
import { StatusBadge, PriorityBadge, LoadingSpinner } from '../components/StatusBadge';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [recentRepairs, setRecentRepairs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, chartRes, recentRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/dashboard/chart'),
                api.get('/dashboard/recent?limit=5')
            ]);
            setStats(statsRes.data);
            setChartData(chartRes.data);
            setRecentRepairs(recentRes.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    const barChartData = {
        labels: chartData.map(d => new Date(d.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })),
        datasets: [{
            label: 'จำนวนแจ้งซ่อม',
            data: chartData.map(d => d.count),
            backgroundColor: 'rgba(79, 70, 229, 0.8)',
            borderRadius: 8
        }]
    };

    const statusChartData = {
        labels: ['รอดำเนินการ', 'กำลังดำเนินการ', 'เสร็จสิ้น', 'ยกเลิก'],
        datasets: [{
            data: [
                stats?.byStatus?.find(s => s.status === 'pending')?.count || 0,
                stats?.byStatus?.find(s => s.status === 'in_progress')?.count || 0,
                stats?.byStatus?.find(s => s.status === 'completed')?.count || 0,
                stats?.byStatus?.find(s => s.status === 'cancelled')?.count || 0
            ],
            backgroundColor: ['#F59E0B', '#FB923C', '#10B981', '#6B7280'],
            borderWidth: 0
        }]
    };

    return (
        <div>
            <div className="page-header">
                <h1>📊 Dashboard</h1>
            </div>

            {/* Stats Cards */}
            <Row className="g-4 mb-4">
                <Col sm={6} lg={3}>
                    <div className="stat-card">
                        <div className="stat-icon primary"><FiClipboard /></div>
                        <div className="stat-content">
                            <h3>{stats?.total || 0}</h3>
                            <p>รายการทั้งหมด</p>
                        </div>
                    </div>
                </Col>
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
            </Row>

            {/* Charts Row */}
            <Row className="g-4 mb-4">
                <Col lg={8}>
                    <Card>
                        <Card.Header>
                            <FiTrendingUp className="me-2" />
                            สถิติการแจ้งซ่อม 30 วันล่าสุด
                        </Card.Header>
                        <Card.Body>
                            <Bar 
                                data={barChartData} 
                                options={{
                                    responsive: true,
                                    plugins: { legend: { display: false } },
                                    scales: { y: { beginAtZero: true } }
                                }}
                            />
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4}>
                    <Card>
                        <Card.Header>สถานะรายการ</Card.Header>
                        <Card.Body>
                            <Doughnut 
                                data={statusChartData}
                                options={{
                                    responsive: true,
                                    plugins: { legend: { position: 'bottom' } }
                                }}
                            />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Recent Repairs */}
            <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <span>รายการแจ้งซ่อมล่าสุด</span>
                    <Link to="/repairs" className="btn btn-sm btn-outline-primary">
                        ดูทั้งหมด <FiArrowRight />
                    </Link>
                </Card.Header>
                <Card.Body className="p-0">
                    <table className="table mb-0">
                        <thead>
                            <tr>
                                <th>เลขที่</th>
                                <th>หัวข้อ</th>
                                <th>ผู้แจ้ง</th>
                                <th>สถานะ</th>
                                <th>ความเร่งด่วน</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentRepairs.map(repair => (
                                <tr key={repair.id}>
                                    <td>
                                        <Link to={`/repairs/${repair.id}`}>
                                            {repair.request_no}
                                        </Link>
                                    </td>
                                    <td>{repair.title}</td>
                                    <td>{repair.requester_name}</td>
                                    <td><StatusBadge status={repair.status} /></td>
                                    <td><PriorityBadge priority={repair.priority} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Dashboard;
