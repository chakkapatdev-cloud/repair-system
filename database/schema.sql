-- =============================================
-- ระบบแจ้งซ่อมออนไลน์ (Online Repair System)
-- Complete Database Schema
-- =============================================

CREATE DATABASE IF NOT EXISTS repair_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE repair_system;

-- =============================================
-- Departments Table (แผนก/หน่วยงาน)
-- =============================================
CREATE TABLE IF NOT EXISTS departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Categories Table (หมวดหมู่การซ่อม)
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT 'tools',
    color VARCHAR(20) DEFAULT '#6c757d',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Users Table (ผู้ใช้งาน)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    avatar VARCHAR(255),
    role ENUM('admin', 'technician', 'user') DEFAULT 'user',
    department_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    line_token VARCHAR(255),
    email_notify BOOLEAN DEFAULT TRUE,
    line_notify BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- =============================================
-- Equipment Table (อุปกรณ์/ทรัพย์สิน)
-- =============================================
CREATE TABLE IF NOT EXISTS equipment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    equipment_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    location VARCHAR(200),
    building VARCHAR(100),
    floor VARCHAR(20),
    category_id INT,
    qr_code_url VARCHAR(500),
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    purchase_date DATE,
    warranty_end DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- =============================================
-- Spare Parts Table (อะไหล่)
-- =============================================
CREATE TABLE IF NOT EXISTS spare_parts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    part_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    quantity INT DEFAULT 0,
    min_quantity INT DEFAULT 5,
    unit VARCHAR(20) DEFAULT 'ชิ้น',
    unit_cost DECIMAL(10,2) DEFAULT 0,
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- Teams Table (ทีมช่าง)
-- =============================================
CREATE TABLE IF NOT EXISTS teams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    leader_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- Team Members Table
-- =============================================
CREATE TABLE IF NOT EXISTS team_members (
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, user_id),
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- Repair Requests Table (รายการแจ้งซ่อม)
-- =============================================
CREATE TABLE IF NOT EXISTS repair_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_no VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    location VARCHAR(200),
    category_id INT,
    equipment_id INT,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('pending', 'accepted', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    requester_id INT NOT NULL,
    technician_id INT,
    team_id INT,
    before_image VARCHAR(500),
    after_image VARCHAR(500),
    total_cost DECIMAL(10,2) DEFAULT 0,
    rating INT,
    rating_comment TEXT,
    response_at TIMESTAMP NULL,
    sla_response_met BOOLEAN,
    sla_resolution_met BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);

-- =============================================
-- Repair Files Table (ไฟล์แนบ)
-- =============================================
CREATE TABLE IF NOT EXISTS repair_files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    repair_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (repair_id) REFERENCES repair_requests(id) ON DELETE CASCADE
);

-- =============================================
-- Repair Costs Table (ค่าใช้จ่าย)
-- =============================================
CREATE TABLE IF NOT EXISTS repair_costs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    repair_id INT NOT NULL,
    part_id INT,
    part_name VARCHAR(200),
    quantity INT DEFAULT 1,
    unit_cost DECIMAL(10,2) DEFAULT 0,
    labor_cost DECIMAL(10,2) DEFAULT 0,
    other_cost DECIMAL(10,2) DEFAULT 0,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (repair_id) REFERENCES repair_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (part_id) REFERENCES spare_parts(id) ON DELETE SET NULL
);

-- =============================================
-- Comments Table (ความคิดเห็น)
-- =============================================
CREATE TABLE IF NOT EXISTS comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    repair_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (repair_id) REFERENCES repair_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- Repair History Table (ประวัติการดำเนินงาน)
-- =============================================
CREATE TABLE IF NOT EXISTS repair_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    repair_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    note TEXT,
    updated_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (repair_id) REFERENCES repair_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- Notifications Table (การแจ้งเตือน)
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- Checklist Templates Table
-- =============================================
CREATE TABLE IF NOT EXISTS checklist_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    steps JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- =============================================
-- Recurring Maintenance Table (บำรุงรักษาประจำ)
-- =============================================
CREATE TABLE IF NOT EXISTS recurring_maintenance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    equipment_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    frequency ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') DEFAULT 'monthly',
    last_done DATE,
    next_due DATE,
    assigned_team_id INT,
    assigned_technician_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_team_id) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_technician_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- SLA Settings Table
-- =============================================
CREATE TABLE IF NOT EXISTS sla_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    priority VARCHAR(20) UNIQUE NOT NULL,
    response_time_hours INT NOT NULL,
    resolution_time_hours INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Floor Plans Table
-- =============================================
CREATE TABLE IF NOT EXISTS floor_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    building VARCHAR(100) NOT NULL,
    floor VARCHAR(20) NOT NULL,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INSERT DEFAULT DATA
-- =============================================

-- Default Departments
INSERT INTO departments (name, description) VALUES
('ฝ่ายบริหาร', 'ฝ่ายบริหารจัดการทั่วไป'),
('ฝ่ายไอที', 'ฝ่ายเทคโนโลยีสารสนเทศ'),
('ฝ่ายบัญชี', 'ฝ่ายบัญชีและการเงิน'),
('ฝ่ายบุคคล', 'ฝ่ายทรัพยากรบุคคล'),
('ฝ่ายผลิต', 'ฝ่ายการผลิต');

-- Default Categories
INSERT INTO categories (name, icon, color) VALUES
('ไฟฟ้า', 'zap', '#ffc107'),
('ประปา', 'droplet', '#17a2b8'),
('แอร์', 'wind', '#6f42c1'),
('คอมพิวเตอร์', 'monitor', '#007bff'),
('เฟอร์นิเจอร์', 'square', '#28a745'),
('อื่นๆ', 'tool', '#6c757d');

-- Default SLA Settings
INSERT INTO sla_settings (priority, response_time_hours, resolution_time_hours) VALUES
('low', 48, 168),
('medium', 24, 72),
('high', 8, 24),
('urgent', 2, 8);

-- Default Admin User (password: admin123)
INSERT INTO users (username, password, full_name, email, role, department_id) VALUES
('admin', '$2a$10$rQnM1k.N8GVH5mLs8Z5JYeJQP.3K0NqX6xGgHvqrN8q8kzxK9KLXK', 'ผู้ดูแลระบบ', 'admin@example.com', 'admin', 1);

-- Default Technicians (password: tech123)
INSERT INTO users (username, password, full_name, email, role, department_id) VALUES
('tech1', '$2a$10$rQnM1k.N8GVH5mLs8Z5JYeJQP.3K0NqX6xGgHvqrN8q8kzxK9KLXK', 'ช่างสมชาย', 'tech1@example.com', 'technician', 2),
('tech2', '$2a$10$rQnM1k.N8GVH5mLs8Z5JYeJQP.3K0NqX6xGgHvqrN8q8kzxK9KLXK', 'ช่างสมหญิง', 'tech2@example.com', 'technician', 2);

-- Default User (password: user123)
INSERT INTO users (username, password, full_name, email, role, department_id) VALUES
('user1', '$2a$10$rQnM1k.N8GVH5mLs8Z5JYeJQP.3K0NqX6xGgHvqrN8q8kzxK9KLXK', 'พนักงานทดสอบ', 'user1@example.com', 'user', 3);

-- Sample Teams
INSERT INTO teams (name, description, leader_id) VALUES
('ทีมซ่อมบำรุงทั่วไป', 'ทีมซ่อมบำรุงอาคารและสิ่งอำนวยความสะดวก', 2),
('ทีม IT Support', 'ทีมดูแลระบบคอมพิวเตอร์และเครือข่าย', 2);

INSERT INTO team_members (team_id, user_id) VALUES (1, 2), (1, 3), (2, 2);

-- Sample Equipment
INSERT INTO equipment (equipment_code, name, description, location, building, floor, category_id) VALUES
('EQ-AC-001', 'แอร์ห้องประชุม 1', 'เครื่องปรับอากาศ Daikin 24000 BTU', 'ห้องประชุม 1', 'อาคาร A', '2', 3),
('EQ-AC-002', 'แอร์ห้องทำงาน IT', 'เครื่องปรับอากาศ Mitsubishi 18000 BTU', 'ห้อง IT', 'อาคาร A', '3', 3),
('EQ-PC-001', 'คอมพิวเตอร์ฝ่ายบัญชี #1', 'Dell OptiPlex 7090', 'ห้องบัญชี', 'อาคาร B', '1', 4),
('EQ-PC-002', 'คอมพิวเตอร์ฝ่ายบัญชี #2', 'Dell OptiPlex 7090', 'ห้องบัญชี', 'อาคาร B', '1', 4),
('EQ-PUMP-001', 'ปั๊มน้ำหลัก', 'ปั๊มน้ำ Grundfos 2HP', 'ห้องเครื่อง', 'อาคาร A', 'B1', 2);

-- Sample Spare Parts
INSERT INTO spare_parts (part_code, name, category, quantity, min_quantity, unit, unit_cost) VALUES
('SP-AC-001', 'คอมเพรสเซอร์แอร์', 'แอร์', 5, 2, 'ตัว', 8500),
('SP-AC-002', 'น้ำยาแอร์ R32', 'แอร์', 20, 5, 'กระป๋อง', 350),
('SP-EL-001', 'หลอดไฟ LED 18W', 'ไฟฟ้า', 50, 10, 'หลอด', 120),
('SP-EL-002', 'สวิตช์ไฟ', 'ไฟฟ้า', 30, 10, 'ตัว', 85),
('SP-PL-001', 'ก๊อกน้ำ', 'ประปา', 10, 3, 'ตัว', 450),
('SP-PL-002', 'ท่อ PVC 1 นิ้ว', 'ประปา', 20, 5, 'เส้น', 65);
