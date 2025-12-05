import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Button, Form, Badge } from 'react-bootstrap';
import { 
    FiDownload, FiCalendar, FiTrendingUp, FiAward, 
    FiFileText, FiBarChart2 
} from 'react-icons/fi';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import api from '../services/api';
import { LoadingSpinner } from '../components/StatusBadge';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('monthly');
    const [monthlyData, setMonthlyData] = useState(null);
    const [trends, setTrends] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [slaData, setSlaData] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

    useEffect(() => {
        fetchAllData();
    }, [selectedYear, selectedMonth]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [monthly, trend, board, sla] = await Promise.all([
                api.get(`/reports/monthly?year=${selectedYear}&month=${selectedMonth}`),
                api.get('/reports/trends'),
                api.get('/reports/leaderboard'),
                api.get('/reports/sla')
            ]);
            setMonthlyData(monthly.data);
            setTrends(trend.data);
            setLeaderboard(board.data);
            setSlaData(sla.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const downloadViaForm = (endpoint, data) => {
        // Create a hidden form to submit - bypasses IDM interception
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `http://localhost:5000/api${endpoint}`;
        form.target = '_blank'; // Open in new tab to handle download
        
        // Add token as hidden field
        const token = localStorage.getItem('token');
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'token';
        tokenInput.value = token;
        form.appendChild(tokenInput);
        
        // Add data fields
        Object.keys(data).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = data[key];
            form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    const getMonthDateRange = () => {
        const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
        // Get last day of the month
        const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
        const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${lastDay}`;
        return { startDate, endDate };
    };

    const handleExportExcel = () => {
        const { startDate, endDate } = getMonthDateRange();
        downloadViaForm('/reports/excel', { start_date: startDate, end_date: endDate });
    };

    const handleExportPDF = () => {
        const { startDate, endDate } = getMonthDateRange();
        downloadViaForm('/reports/pdf', { start_date: startDate, end_date: endDate });
    };

    if (loading) return <LoadingSpinner />;

    const monthlyChartData = {
        labels: trends?.monthlyTrend?.map(m => m.month) || [],
        datasets: [
            {
                label: 'รายการแจ้งซ่อม',
                data: trends?.monthlyTrend?.map(m => m.total) || [],
                borderColor: '#4F46E5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'เสร็จสิ้น',
                data: trends?.monthlyTrend?.map(m => m.completed) || [],
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const categoryChartData = {
        labels: trends?.categoryTrend?.map(c => c.name) || [],
        datasets: [{
            data: trends?.categoryTrend?.map(c => c.count) || [],
            backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
            borderWidth: 0
        }]
    };

    const peakHoursData = {
        labels: trends?.peakHours?.map(h => `${h.hour}:00`) || [],
        datasets: [{
            label: 'จำนวนรายการ',
            data: trends?.peakHours?.map(h => h.count) || [],
            backgroundColor: '#4F46E5',
            borderRadius: 4
        }]
    };

    return (
        <div>
            <div className="page-header">
                <h1>📊 รายงาน</h1>
                <div className="d-flex gap-2">
                    <Button variant="outline-success" onClick={handleExportExcel}>
                        <FiDownload /> Excel
                    </Button>
                    <Button variant="outline-danger" onClick={handleExportPDF}>
                        <FiFileText /> PDF
                    </Button>
                </div>
            </div>

            {/* Month Selector */}
            <Card className="mb-4">
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={4}>
                            <div className="d-flex gap-2 align-items-center">
                                <FiCalendar />
                                <Form.Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                                    {Array.from({length: 12}, (_, i) => (
                                        <option key={i+1} value={i+1}>
                                            {new Date(2000, i, 1).toLocaleDateString('th-TH', { month: 'long' })}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                                    {[2023, 2024, 2025].map(y => (
                                        <option key={y} value={y}>{y + 543}</option>
                                    ))}
                                </Form.Select>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Monthly Stats */}
            <Row className="g-4 mb-4">
                <Col sm={6} lg={3}>
                    <div className="stat-card">
                        <div className="stat-icon primary"><FiBarChart2 /></div>
                        <div className="stat-content">
                            <h3>{monthlyData?.stats?.total || 0}</h3>
                            <p>รายการทั้งหมด</p>
                        </div>
                    </div>
                </Col>
                <Col sm={6} lg={3}>
                    <div className="stat-card">
                        <div className="stat-icon success"><FiTrendingUp /></div>
                        <div className="stat-content">
                            <h3>{monthlyData?.stats?.completed || 0}</h3>
                            <p>เสร็จสิ้น</p>
                        </div>
                    </div>
                </Col>
                <Col sm={6} lg={3}>
                    <div className="stat-card">
                        <div className="stat-icon warning"><FiAward /></div>
                        <div className="stat-content">
                            <h3>{parseFloat(monthlyData?.stats?.avg_rating || 0).toFixed(1)}</h3>
                            <p>คะแนนเฉลี่ย</p>
                        </div>
                    </div>
                </Col>
                <Col sm={6} lg={3}>
                    <div className="stat-card">
                        <div className="stat-icon info"><FiDownload /></div>
                        <div className="stat-content">
                            <h3>฿{parseFloat(monthlyData?.stats?.total_cost || 0).toLocaleString()}</h3>
                            <p>ค่าใช้จ่ายรวม</p>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Charts */}
            <Row className="g-4 mb-4">
                <Col lg={8}>
                    <Card>
                        <Card.Header>แนวโน้ม 12 เดือนล่าสุด</Card.Header>
                        <Card.Body>
                            <Line data={monthlyChartData} options={{ responsive: true }} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4}>
                    <Card>
                        <Card.Header>หมวดหมู่ที่แจ้งบ่อย</Card.Header>
                        <Card.Body>
                            <Doughnut data={categoryChartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4 mb-4">
                <Col lg={6}>
                    <Card>
                        <Card.Header>ช่วงเวลาที่แจ้งซ่อมบ่อย</Card.Header>
                        <Card.Body>
                            <Bar data={peakHoursData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={6}>
                    <Card>
                        <Card.Header><FiAward /> อันดับช่างซ่อม</Card.Header>
                        <Card.Body className="p-0">
                            <Table hover className="mb-0">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>ชื่อ</th>
                                        <th>งานที่ทำ</th>
                                        <th>คะแนน</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.slice(0, 5).map((tech, index) => (
                                        <tr key={tech.id}>
                                            <td>
                                                {index === 0 && <span>🥇</span>}
                                                {index === 1 && <span>🥈</span>}
                                                {index === 2 && <span>🥉</span>}
                                                {index > 2 && <span>{index + 1}</span>}
                                            </td>
                                            <td>{tech.full_name}</td>
                                            <td><Badge bg="primary">{tech.completed} งาน</Badge></td>
                                            <td>⭐ {parseFloat(tech.avg_rating || 0).toFixed(1)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* SLA Report */}
            <Card>
                <Card.Header>⏱️ SLA Performance</Card.Header>
                <Card.Body className="p-0">
                    <Table hover className="mb-0">
                        <thead>
                            <tr>
                                <th>ความเร่งด่วน</th>
                                <th>จำนวนทั้งหมด</th>
                                <th>ตอบสนองตาม SLA</th>
                                <th>แก้ไขตาม SLA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {slaData?.stats?.map(row => (
                                <tr key={row.priority}>
                                    <td>
                                        <Badge bg={
                                            row.priority === 'urgent' ? 'danger' :
                                            row.priority === 'high' ? 'warning' :
                                            row.priority === 'medium' ? 'info' : 'secondary'
                                        }>
                                            {row.priority}
                                        </Badge>
                                    </td>
                                    <td>{row.total}</td>
                                    <td>
                                        <span className={row.response_met / row.total >= 0.8 ? 'text-success' : 'text-danger'}>
                                            {row.response_met} ({Math.round(row.response_met / row.total * 100 || 0)}%)
                                        </span>
                                    </td>
                                    <td>
                                        <span className={row.resolution_met / row.total >= 0.8 ? 'text-success' : 'text-danger'}>
                                            {row.resolution_met} ({Math.round(row.resolution_met / row.total * 100 || 0)}%)
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Reports;
