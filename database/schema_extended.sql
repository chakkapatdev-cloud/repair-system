-- =============================================
-- Extended Features Schema
-- =============================================

USE repair_system;

-- =============================================
-- Equipment Table (สำหรับ QR Code)
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

-- Insert default SLA settings
INSERT INTO sla_settings (priority, response_time_hours, resolution_time_hours) VALUES
('low', 48, 168),
('medium', 24, 72),
('high', 8, 24),
('urgent', 2, 8);

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
-- Alter repair_requests table
-- =============================================
ALTER TABLE repair_requests 
    ADD COLUMN IF NOT EXISTS equipment_id INT,
    ADD COLUMN IF NOT EXISTS before_image VARCHAR(500),
    ADD COLUMN IF NOT EXISTS after_image VARCHAR(500),
    ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS team_id INT,
    ADD COLUMN IF NOT EXISTS response_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS sla_response_met BOOLEAN,
    ADD COLUMN IF NOT EXISTS sla_resolution_met BOOLEAN;

-- =============================================
-- Alter users table for notifications
-- =============================================
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS line_token VARCHAR(255),
    ADD COLUMN IF NOT EXISTS email_notify BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS line_notify BOOLEAN DEFAULT FALSE;

-- =============================================
-- Insert sample equipment
-- =============================================
INSERT INTO equipment (equipment_code, name, description, location, building, floor, category_id) VALUES
('EQ-AC-001', 'แอร์ห้องประชุม 1', 'เครื่องปรับอากาศ Daikin 24000 BTU', 'ห้องประชุม 1', 'อาคาร A', '2', 3),
('EQ-AC-002', 'แอร์ห้องทำงาน IT', 'เครื่องปรับอากาศ Mitsubishi 18000 BTU', 'ห้อง IT', 'อาคาร A', '3', 3),
('EQ-PC-001', 'คอมพิวเตอร์ฝ่ายบัญชี #1', 'Dell OptiPlex 7090', 'ห้องบัญชี', 'อาคาร B', '1', 4),
('EQ-PC-002', 'คอมพิวเตอร์ฝ่ายบัญชี #2', 'Dell OptiPlex 7090', 'ห้องบัญชี', 'อาคาร B', '1', 4),
('EQ-PUMP-001', 'ปั๊มน้ำหลัก', 'ปั๊มน้ำ Grundfos 2HP', 'ห้องเครื่อง', 'อาคาร A', 'B1', 2);

-- =============================================
-- Insert sample spare parts
-- =============================================
INSERT INTO spare_parts (part_code, name, category, quantity, min_quantity, unit, unit_cost) VALUES
('SP-AC-001', 'คอมเพรสเซอร์แอร์', 'แอร์', 5, 2, 'ตัว', 8500),
('SP-AC-002', 'น้ำยาแอร์ R32', 'แอร์', 20, 5, 'กระป๋อง', 350),
('SP-EL-001', 'หลอดไฟ LED 18W', 'ไฟฟ้า', 50, 10, 'หลอด', 120),
('SP-EL-002', 'สวิตช์ไฟ', 'ไฟฟ้า', 30, 10, 'ตัว', 85),
('SP-PL-001', 'ก๊อกน้ำ', 'ประปา', 10, 3, 'ตัว', 450),
('SP-PL-002', 'ท่อ PVC 1 นิ้ว', 'ประปา', 20, 5, 'เส้น', 65);

-- =============================================
-- Insert sample team
-- =============================================
INSERT INTO teams (name, description, leader_id) VALUES
('ทีมซ่อมบำรุงทั่วไป', 'ทีมซ่อมบำรุงอาคารและสิ่งอำนวยความสะดวก', 2),
('ทีม IT Support', 'ทีมดูแลระบบคอมพิวเตอร์และเครือข่าย', 2);

INSERT INTO team_members (team_id, user_id) VALUES (1, 2), (1, 3), (2, 2);
