-- Create database and tables
CREATE DATABASE IF NOT EXISTS complaints_db;
USE complaints_db;

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(128) NOT NULL UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(64),
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Staff/Employees table
CREATE TABLE IF NOT EXISTS staff (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(64),
  department VARCHAR(128),
  position VARCHAR(128),
  status VARCHAR(32) DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_department (department),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Complaints table with department assignment
CREATE TABLE IF NOT EXISTS complaints (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  createdAt DATETIME NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  category VARCHAR(128) NOT NULL,
  department VARCHAR(128),
  location VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  assignedToId VARCHAR(32),
  assignedTo VARCHAR(255),
  photo LONGTEXT,
  INDEX idx_status (status),
  INDEX idx_department (department),
  INDEX idx_assignedTo (assignedToId),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default departments
INSERT INTO departments (name, email, phone, description) VALUES 
('Roads & Infrastructure', 'roads@municipal.gov', '+91-1234-567890', 'Handles road damage, potholes, street maintenance'),
('Water & Sanitation', 'water@municipal.gov', '+91-1234-567891', 'Handles water issues, pipelines, drainage'),
('Waste Management', 'waste@municipal.gov', '+91-1234-567892', 'Handles garbage collection, cleanliness'),
('Public Lighting', 'lighting@municipal.gov', '+91-1234-567893', 'Handles streetlight maintenance and repairs'),
('Drainage & Sewerage', 'drainage@municipal.gov', '+91-1234-567894', 'Handles drainage issues, blockages'),
('Other Services', 'other@municipal.gov', '+91-1234-567895', 'Handles miscellaneous complaints')
ON DUPLICATE KEY UPDATE name=name;

-- Insert sample staff members
INSERT INTO staff (id, name, email, phone, department, position, status) VALUES 
('STF001', 'Rajesh Kumar', 'rajesh@municipal.gov', '+91-9876-543210', 'Roads & Infrastructure', 'Inspector', 'active'),
('STF002', 'Priya Singh', 'priya@municipal.gov', '+91-9876-543211', 'Water & Sanitation', 'Supervisor', 'active'),
('STF003', 'Amit Patel', 'amit@municipal.gov', '+91-9876-543212', 'Waste Management', 'Manager', 'active'),
('STF004', 'Neha Sharma', 'neha@municipal.gov', '+91-9876-543213', 'Public Lighting', 'Technician', 'active'),
('STF005', 'Arjun Verma', 'arjun@municipal.gov', '+91-9876-543214', 'Drainage & Sewerage', 'Inspector', 'active')
ON DUPLICATE KEY UPDATE name=name;
