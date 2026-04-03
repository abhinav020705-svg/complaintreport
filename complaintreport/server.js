require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'complaints_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Category to Department Mapping
const categoryToDepartment = {
  'Road Damage': 'Roads & Infrastructure',
  'Water Issue': 'Water & Sanitation',
  'Garbage': 'Waste Management',
  'Streetlight': 'Public Lighting',
  'Drainage': 'Drainage & Sewerage',
  'Others': 'Other Services'
};

function now() {
  return new Date();
}

function getDepartmentForCategory(category) {
  return categoryToDepartment[category] || 'Other Services';
}

app.get('/api/health', (req, res) => res.json({ ok: true, now: now() }));

// ===== COMPLAINTS API =====

// Create complaint with department assignment
app.post('/api/complaints', async (req, res) => {
  try {
    const { id, createdAt, name, phone, category, location, description, status, photo } = req.body;
    const created = createdAt || new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // Auto-assign department based on category
    const department = getDepartmentForCategory(category);

    const sql = `INSERT INTO complaints (id, createdAt, name, phone, category, department, location, description, status, photo) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [id, created, name, phone, category, department, location, description, status || 'pending', photo || null];

    const [result] = await pool.query(sql, params);
    return res.status(201).json({ id, department });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// Get all complaints
app.get('/api/complaints', async (req, res) => {
  try {
    const department = req.query.department;
    let query = 'SELECT * FROM complaints';
    let params = [];
    
    if (department) {
      query += ' WHERE department = ?';
      params.push(department);
    }
    
    query += ' ORDER BY createdAt DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get complaint by ID
app.get('/api/complaints/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query('SELECT * FROM complaints WHERE id = ? LIMIT 1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update status
app.put('/api/complaints/:id/status', async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    await pool.query('UPDATE complaints SET status = ? WHERE id = ?', [status, id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Assign complaint to person (by Staff ID)
app.put('/api/complaints/:id/assign', async (req, res) => {
  try {
    const id = req.params.id;
    const { assignedToId, assignedTo } = req.body;
    
    await pool.query(
      'UPDATE complaints SET assignedToId = ?, assignedTo = ? WHERE id = ?',
      [assignedToId || null, assignedTo || null, id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete complaint
app.delete('/api/complaints/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM complaints WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== DEPARTMENTS API =====

// Get all departments
app.get('/api/departments', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM departments ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get department by name
app.get('/api/departments/:name', async (req, res) => {
  try {
    const name = req.params.name;
    const [rows] = await pool.query('SELECT * FROM departments WHERE name = ? LIMIT 1', [name]);
    if (!rows.length) return res.status(404).json({ error: 'Department not found' });
    
    // Get complaints for this department
    const [complaints] = await pool.query('SELECT * FROM complaints WHERE department = ? ORDER BY createdAt DESC', [name]);
    
    res.json({ ...rows[0], complaints });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create/Update department
app.post('/api/departments', async (req, res) => {
  try {
    const { name, email, phone, description } = req.body;
    const sql = `INSERT INTO departments (name, email, phone, description) VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE email = ?, phone = ?, description = ?`;
    const params = [name, email, phone, description, email, phone, description];
    
    await pool.query(sql, params);
    res.json({ ok: true, name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get complaints count by department
app.get('/api/stats/by-department', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT department, COUNT(*) as count, status 
      FROM complaints 
      GROUP BY department, status 
      ORDER BY department
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== STAFF API =====

// Get all staff members
app.get('/api/staff', async (req, res) => {
  try {
    const department = req.query.department;
    let query = 'SELECT * FROM staff WHERE status = "active"';
    let params = [];
    
    if (department) {
      query += ' AND department = ?';
      params.push(department);
    }
    
    query += ' ORDER BY department, name';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get staff by ID
app.get('/api/staff/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query('SELECT * FROM staff WHERE id = ? LIMIT 1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Staff not found' });
    
    // Get complaints assigned to this staff member
    const [complaints] = await pool.query(
      'SELECT * FROM complaints WHERE assignedToId = ? ORDER BY createdAt DESC',
      [id]
    );
    
    res.json({ ...rows[0], complaints });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create new staff member
app.post('/api/staff', async (req, res) => {
  try {
    const { id, name, email, phone, department, position } = req.body;
    
    if (!id || !name) {
      return res.status(400).json({ error: 'Staff ID and name required' });
    }
    
    const sql = `INSERT INTO staff (id, name, email, phone, department, position, status) 
                 VALUES (?, ?, ?, ?, ?, ?, 'active')
                 ON DUPLICATE KEY UPDATE name = ?, email = ?, phone = ?, department = ?, position = ?`;
    const params = [id, name, email, phone, department, position, name, email, phone, department, position];
    
    await pool.query(sql, params);
    res.json({ ok: true, id, name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update staff member
app.put('/api/staff/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, email, phone, department, position, status } = req.body;
    
    await pool.query(
      'UPDATE staff SET name = ?, email = ?, phone = ?, department = ?, position = ?, status = ? WHERE id = ?',
      [name, email, phone, department, position, status || 'active', id]
    );
    
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete staff member (deactivate)
app.delete('/api/staff/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query('UPDATE staff SET status = "inactive" WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get staff by ID for staff portal login
app.post('/api/staff/validate/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query('SELECT id, name, department, position FROM staff WHERE id = ? AND status = "active" LIMIT 1', [id]);
    
    if (!rows.length) return res.status(404).json({ error: 'Staff not found or inactive' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
