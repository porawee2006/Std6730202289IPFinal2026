// ==============================================================================
// 🌟 HR Manager & Salary Analytics System - Backend (Express.js)
// Final Exam: Internet Programming (2026)
// Student ID: 6730202289
// ==============================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const port = process.env.PORT || 3028;

// Middleware
app.use(cors());
app.use(express.json());

// ==============================================================================
// 📦 1. Data Storage: In-Memory Array (Primary Spec) + MySQL Hybrid Auto-Sync
// ==============================================================================

// Initial mock employees (At least 5 records as required by Phase 1 spec)
let mockEmployees = [
  { id: "1", name: "John Doe", position: "Software Engineer", status: "Active", salary: 45000 },
  { id: "2", name: "Jane Smith", position: "HR Manager", status: "Active", salary: 65000 },
  { id: "3", name: "Somchai Jaidee", position: "Marketing Specialist", status: "On Leave", salary: 32000 },
  { id: "4", name: "Alice Johnson", position: "Senior DevOps Engineer", status: "Active", salary: 85000 },
  { id: "5", name: "Bob Lee", position: "Junior Frontend Developer", status: "Active", salary: 28000 },
  { id: "6", name: "Siriporn Wang", position: "Data Analyst", status: "Active", salary: 42000 }
];

let isDbConnected = false;
let pool = null;

// Graceful MySQL connection initialization (non-blocking fallback to in-memory)
(async function initDatabase() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'std6730202289',
      password: process.env.DB_PASSWORD ? String(process.env.DB_PASSWORD).replace(/^"|"$/g, '') : '',
      database: process.env.DB_NAME || 'ip_std6730202289',
      port: Number(process.env.DB_PORT) || 3306,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      connectTimeout: 4000
    });

    const conn = await pool.getConnection();
    console.log(`✅ [MySQL Connected] Database: ${process.env.DB_NAME}`);

    // Create table employees if not exists
    await conn.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        position VARCHAR(255) NOT NULL,
        status ENUM('Active', 'On Leave') NOT NULL DEFAULT 'Active',
        salary DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Check if table has data, otherwise seed initial mock data
    const [rows] = await conn.query('SELECT COUNT(*) as count FROM employees');
    if (rows[0].count === 0) {
      for (const emp of mockEmployees) {
        await conn.query(
          'INSERT INTO employees (id, name, position, status, salary) VALUES (?, ?, ?, ?, ?)',
          [emp.id, emp.name, emp.position, emp.status, emp.salary]
        );
      }
      console.log('🌱 Seeded initial 6 mock employees to MySQL database');
    } else {
      // Sync in-memory array with database records
      const [dbRows] = await conn.query('SELECT id, name, position, status, CAST(salary AS SIGNED) as salary FROM employees');
      if (dbRows.length > 0) {
        mockEmployees = dbRows.map(r => ({
          id: String(r.id),
          name: r.name,
          position: r.position,
          status: r.status,
          salary: Number(r.salary)
        }));
      }
    }

    conn.release();
    isDbConnected = true;
    console.log('✨ [Hybrid Storage] Synchronized with MySQL database.');
  } catch (err) {
    isDbConnected = false;
    console.warn(`⚠️ [Storage Notice] MySQL is unavailable (${err.message}).`);
    console.log('🚀 Running seamlessly in IN-MEMORY STORAGE MODE per exam specification.');
  }
})();

// Helper to get all current employees
async function getAllEmployees() {
  if (isDbConnected && pool) {
    try {
      const [rows] = await pool.query('SELECT id, name, position, status, CAST(salary AS SIGNED) as salary FROM employees ORDER BY id ASC');
      return rows.map(r => ({
        id: String(r.id),
        name: r.name,
        position: r.position,
        status: r.status,
        salary: Number(r.salary)
      }));
    } catch (e) {
      console.error('Error reading from DB, falling back to memory:', e.message);
    }
  }
  return [...mockEmployees];
}

// ==============================================================================
// 🛠️ Phase 1.1: Authentication (Login) Endpoint
// ==============================================================================
/**
 * [POST] /api/login (and /api/auth/login)
 * Accept username and password in request body.
 * If credentials are admin and password123, respond 200 OK with:
 * {"success": true, "token": "mock-jwt-token"}
 * If incorrect, respond 401 Unauthorized with error message.
 */
function handleLogin(req, res) {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username and password are required'
    });
  }

  // Exact credentials required by Exam spec
  if (username === 'admin' && password === 'password123') {
    return res.status(200).json({
      success: true,
      token: 'mock-jwt-token',
      user: {
        id: '1',
        username: 'admin',
        role: 'admin',
        name: 'System Administrator'
      }
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid credentials. Please check your username and password.'
  });
}

app.post('/api/login', handleLogin);
app.post('/api/auth/login', handleLogin); // Backward-compatibility alias

// ==============================================================================
// 🛠️ Phase 1.1: CRUD API Endpoints for Employees
// ==============================================================================

/**
 * [GET] /api/employees
 * Return all employee records.
 * Supports optional search query (?q=... or ?search=...)
 */
app.get('/api/employees', async (req, res) => {
  try {
    const list = await getAllEmployees();
    const q = (req.query.q || req.query.search || '').toString().trim().toLowerCase();

    if (q) {
      const filtered = list.filter(emp =>
        emp.name.toLowerCase().includes(q) ||
        emp.position.toLowerCase().includes(q) ||
        emp.status.toLowerCase().includes(q)
      );
      return res.status(200).json(filtered);
    }

    return res.status(200).json(list);
  } catch (err) {
    console.error('Get employees error:', err);
    return res.status(500).json({ error: 'Failed to retrieve employee records' });
  }
});

/**
 * [POST] /api/employees
 * Add a new employee.
 * Must receive name, position, and salary.
 * If any field is empty, respond with Status 400 Bad Request.
 */
app.post('/api/employees', async (req, res) => {
  try {
    const { name, position, salary, status } = req.body || {};

    // Strict validation: name, position, salary must not be empty
    if (
      !name ||
      typeof name !== 'string' ||
      name.trim() === '' ||
      !position ||
      typeof position !== 'string' ||
      position.trim() === '' ||
      salary === undefined ||
      salary === null ||
      salary === '' ||
      isNaN(Number(salary))
    ) {
      return res.status(400).json({
        error: 'Validation Error: name, position, and numeric salary are required and cannot be empty.'
      });
    }

    const numSalary = Number(salary);
    const empStatus = status === 'On Leave' ? 'On Leave' : 'Active';

    // Generate unique ID
    const newId = String(Date.now());

    const newEmployee = {
      id: newId,
      name: name.trim(),
      position: position.trim(),
      status: empStatus,
      salary: numSalary
    };

    // Save to DB if connected
    if (isDbConnected && pool) {
      try {
        await pool.query(
          'INSERT INTO employees (id, name, position, status, salary) VALUES (?, ?, ?, ?, ?)',
          [newEmployee.id, newEmployee.name, newEmployee.position, newEmployee.status, newEmployee.salary]
        );
      } catch (dbErr) {
        console.error('Failed to insert into DB, saving to in-memory:', dbErr.message);
      }
    }

    // Always update in-memory list
    mockEmployees.push(newEmployee);

    return res.status(201).json({
      success: true,
      employee: newEmployee
    });
  } catch (err) {
    console.error('Add employee error:', err);
    return res.status(500).json({ error: 'Internal server error while adding employee' });
  }
});

/**
 * [PUT] /api/employees/:id/status
 * Toggle the employee's status (Active <-> On Leave).
 */
app.put('/api/employees/:id/status', async (req, res) => {
  try {
    const { id } = req.params;

    // Find in memory
    const empIndex = mockEmployees.findIndex(e => String(e.id) === String(id));
    if (empIndex === -1 && !isDbConnected) {
      return res.status(404).json({ error: `Employee with id ${id} not found` });
    }

    let currentStatus = 'Active';
    if (empIndex !== -1) {
      currentStatus = mockEmployees[empIndex].status;
    } else if (isDbConnected && pool) {
      const [rows] = await pool.query('SELECT status FROM employees WHERE id = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: `Employee with id ${id} not found` });
      }
      currentStatus = rows[0].status;
    }

    // Toggle status
    const newStatus = currentStatus === 'Active' ? 'On Leave' : 'Active';

    if (empIndex !== -1) {
      mockEmployees[empIndex].status = newStatus;
    }

    if (isDbConnected && pool) {
      try {
        await pool.query('UPDATE employees SET status = ? WHERE id = ?', [newStatus, id]);
      } catch (dbErr) {
        console.error('Failed to update status in DB:', dbErr.message);
      }
    }

    const updatedEmp = empIndex !== -1
      ? mockEmployees[empIndex]
      : { id, status: newStatus };

    return res.status(200).json({
      success: true,
      employee: updatedEmp
    });
  } catch (err) {
    console.error('Toggle status error:', err);
    return res.status(500).json({ error: 'Internal server error while toggling status' });
  }
});

/**
 * [PUT] /api/employees/:id
 * Edit employee record (name, position, salary, status)
 */
app.put('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, position, salary, status } = req.body || {};

    const empIndex = mockEmployees.findIndex(e => String(e.id) === String(id));
    if (empIndex === -1 && !isDbConnected) {
      return res.status(404).json({ error: `Employee with id ${id} not found` });
    }

    const currentEmp = empIndex !== -1 ? mockEmployees[empIndex] : null;

    const updatedName = (name !== undefined && name !== null) ? String(name).trim() : (currentEmp?.name || '');
    const updatedPos = (position !== undefined && position !== null) ? String(position).trim() : (currentEmp?.position || '');
    const updatedSal = (salary !== undefined && salary !== null && !isNaN(Number(salary))) ? Number(salary) : (currentEmp?.salary || 0);
    const updatedStatus = status ? (status === 'On Leave' ? 'On Leave' : 'Active') : (currentEmp?.status || 'Active');

    if (!updatedName || !updatedPos || isNaN(updatedSal)) {
      return res.status(400).json({ error: 'Validation Error: name, position, and salary cannot be empty' });
    }

    const updatedEmployee = {
      id: String(id),
      name: updatedName,
      position: updatedPos,
      status: updatedStatus,
      salary: updatedSal
    };

    if (empIndex !== -1) {
      mockEmployees[empIndex] = updatedEmployee;
    }

    if (isDbConnected && pool) {
      try {
        await pool.query(
          'UPDATE employees SET name = ?, position = ?, status = ?, salary = ? WHERE id = ?',
          [updatedName, updatedPos, updatedStatus, updatedSal, id]
        );
      } catch (dbErr) {
        console.error('Failed to update employee in DB:', dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      employee: updatedEmployee
    });
  } catch (err) {
    console.error('Edit employee error:', err);
    return res.status(500).json({ error: 'Internal server error while editing employee' });
  }
});

/**
 * [DELETE] /api/employees/:id
 * Remove the employee from the system.
 */
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const empIndex = mockEmployees.findIndex(e => String(e.id) === String(id));
    if (empIndex === -1 && !isDbConnected) {
      return res.status(404).json({ error: `Employee with id ${id} not found` });
    }

    if (empIndex !== -1) {
      mockEmployees.splice(empIndex, 1);
    }

    if (isDbConnected && pool) {
      try {
        const [result] = await pool.query('DELETE FROM employees WHERE id = ?', [id]);
        if (result.affectedRows === 0 && empIndex === -1) {
          return res.status(404).json({ error: `Employee with id ${id} not found` });
        }
      } catch (dbErr) {
        console.error('Failed to delete from DB:', dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Employee with id ${id} removed successfully.`
    });
  } catch (err) {
    console.error('Delete employee error:', err);
    return res.status(500).json({ error: 'Internal server error while deleting employee' });
  }
});

// ==============================================================================
// 🧠 Phase 2: Automated Salary Clustering (1D K-Means Analytics, k=3)
// ==============================================================================

/**
 * 1D K-Means Clustering Algorithm
 * @param {number[]} salaries - Array of numeric salaries
 * @param {number} k - Number of clusters (k=3)
 * @returns {Array<{ group: string, centroid: number, count: number, minSalary?: number, maxSalary?: number }>}
 */
function run1DKMeans(salaries, k = 3) {
  if (!salaries || salaries.length === 0) {
    return [
      { group: 'Tier 1', centroid: 0, count: 0 },
      { group: 'Tier 2', centroid: 0, count: 0 },
      { group: 'Tier 3', centroid: 0, count: 0 }
    ];
  }

  // Edge case: if fewer employees than k, duplicate or assign naturally
  const sorted = [...salaries].sort((a, b) => a - b);
  const n = sorted.length;

  // Initialize centroids spread across the distribution (quantile-based initialization)
  let centroids = [];
  for (let i = 0; i < k; i++) {
    const quantileIndex = Math.min(n - 1, Math.floor(((i + 0.5) / k) * n));
    centroids.push(sorted[quantileIndex]);
  }

  // Iterate K-Means
  const maxIterations = 35;
  let assignments = new Array(n).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;

    // Assignment Step: Assign each salary to nearest centroid
    for (let i = 0; i < n; i++) {
      const val = sorted[i];
      let minDistance = Infinity;
      let bestCluster = 0;

      for (let c = 0; c < k; c++) {
        const dist = Math.abs(val - centroids[c]);
        if (dist < minDistance) {
          minDistance = dist;
          bestCluster = c;
        }
      }

      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster;
        changed = true;
      }
    }

    // Update Step: Compute new centroid for each cluster
    const newCentroids = [];
    for (let c = 0; c < k; c++) {
      const clusterMembers = sorted.filter((_, idx) => assignments[idx] === c);
      if (clusterMembers.length > 0) {
        const sum = clusterMembers.reduce((acc, curr) => acc + curr, 0);
        newCentroids.push(sum / clusterMembers.length);
      } else {
        // Handle empty cluster: fallback to previous centroid
        newCentroids.push(centroids[c]);
      }
    }

    // Check convergence
    let diff = 0;
    for (let c = 0; c < k; c++) {
      diff += Math.abs(newCentroids[c] - centroids[c]);
    }
    centroids = newCentroids;

    if (!changed || diff < 0.01) {
      break;
    }
  }

  // Build cluster results and sort by centroid ascending (Tier 1 = lower, Tier 2 = mid, Tier 3 = high)
  const clusterData = [];
  for (let c = 0; c < k; c++) {
    const clusterMembers = sorted.filter((_, idx) => assignments[idx] === c);
    const count = clusterMembers.length;
    const centroid = count > 0
      ? Math.round(clusterMembers.reduce((acc, curr) => acc + curr, 0) / count)
      : Math.round(centroids[c]);

    const minSal = count > 0 ? Math.min(...clusterMembers) : centroid;
    const maxSal = count > 0 ? Math.max(...clusterMembers) : centroid;

    clusterData.push({
      tempCentroid: centroid,
      count,
      minSalary: minSal,
      maxSalary: maxSal,
      salaries: clusterMembers
    });
  }

  // Sort clusters by centroid from low to high
  clusterData.sort((a, b) => a.tempCentroid - b.tempCentroid);

  // Map to the required JSON schema
  return clusterData.map((item, index) => ({
    group: `Tier ${index + 1}`,
    centroid: item.tempCentroid,
    count: item.count,
    minSalary: item.minSalary,
    maxSalary: item.maxSalary
  }));
}

/**
 * [GET] /api/employees/salary-clusters
 * Objective: Group company salary structure into 3 distinct tiers using 1D K-Means.
 * Response Format:
 * {
 *   "success": true,
 *   "clusters": [
 *     { "group": "Tier 1", "centroid": 18500, "count": 5 },
 *     { "group": "Tier 2", "centroid": 45000, "count": 3 },
 *     { "group": "Tier 3", "centroid": 85000, "count": 2 }
 *   ]
 * }
 */
app.get('/api/employees/salary-clusters', async (req, res) => {
  try {
    const employees = await getAllEmployees();

    // Extract only salary values
    const salaries = employees
      .map(e => Number(e.salary))
      .filter(s => !isNaN(s) && s > 0);

    const clusters = run1DKMeans(salaries, 3);

    return res.status(200).json({
      success: true,
      clusters
    });
  } catch (err) {
    console.error('K-Means clustering error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to calculate salary clusters'
    });
  }
});

// Root API Health Check
app.get('/api', (req, res) => {
  res.json({
    message: 'HR Manager & Salary Analytics API is online',
    version: '1.0.0',
    mode: isDbConnected ? 'MySQL Connected' : 'In-Memory Array'
  });
});

// Start Express Server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 HR Manager Backend running on http://localhost:${port}`);
  console.log(`📌 Authentication: POST /api/login`);
  console.log(`📌 CRUD API: /api/employees`);
  console.log(`📌 K-Means ML API: GET /api/employees/salary-clusters`);
});
