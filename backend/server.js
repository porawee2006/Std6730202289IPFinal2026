// ดึงค่าการตั้งค่าจากไฟล์ .env มาใช้งาน
require('dotenv').config();
// นำเข้า Express Framework สำหรับสร้าง Web Server
const express = require('express');
// นำเข้า CORS อนุญาตให้แอป React Native เรียกใช้ API ได้
const cors = require('cors');
// นำเข้าตัวเชื่อมต่อ MySQL แบบ Promise
const mysql = require('mysql2/promise');
// นำเข้า bcrypt สำหรับเข้ารหัสรหัสผ่านให้ปลอดภัย
const bcrypt = require('bcrypt');
// นำเข้า jsonwebtoken สำหรับออก Token ล็อกอิน
const jwt = require('jsonwebtoken');

// สร้างอินสแตนซ์ของ Express App
const app = express();
// กำหนดพอร์ตในการรัน Server (เริ่มต้น 3028)
const port = process.env.PORT || 3028;

// เปิดใช้งาน CORS
app.use(cors());
// อนุญาตให้รับข้อมูลแบบ JSON ขนาดไม่เกิน 5MB
app.use(express.json({ limit: '5mb' }));

// ==========================================
// 🔌 1. จุดเชื่อมต่อไปยัง MySQL (phpMyAdmin)
// ==========================================
// ตรงนี้เป็นจุดที่เอาไว้ใส่ Host, Username, Password และชื่อ Database เพื่อเชื่อมต่อไป phpMyAdmin ครับ
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+07:00"
});

(async function testMySQL() {
  try {
    const conn = await pool.getConnection();
    console.log('Connected to MySQL:', process.env.DB_NAME);

    // Create users table if not exists
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed admin if not exists
    const [adminRows] = await conn.query('SELECT * FROM users WHERE username = ?', ['Admin']);
    if (adminRows.length === 0) {
      const hashedPass = await bcrypt.hash('123456', 10);
      await conn.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['Admin', hashedPass, 'admin']);
      console.log('Admin user seeded.');
    }

    // Ensure powerbanks columns exist
    const columnsToAdd = [
      'ADD COLUMN capacity INT DEFAULT 0',
      'ADD COLUMN price DECIMAL(10,2) DEFAULT 0',
      'ADD COLUMN location VARCHAR(255)',
      'ADD COLUMN category VARCHAR(255)',
      'ADD COLUMN brand VARCHAR(255)',
      'ADD COLUMN status VARCHAR(50) DEFAULT "Active"',
      'ADD COLUMN image TEXT',
      'ADD COLUMN lastUpdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    ];
    for (const col of columnsToAdd) {
      try {
        await conn.query(`ALTER TABLE powerbanks ${col}`);
      } catch (err) {
        // Column likely already exists, ignore
      }
    }

    conn.release();
  } catch (err) {
    console.error('MySQL Failed:', err.message);
    process.exit(1);
  }
})();

// คีย์ลับสำหรับเซ็นต์สร้าง JWT Token
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123';

// 🛡️ Middleware ตรวจสอบว่าผู้ใช้ส่ง Token ล็อกอินเข้ามาหรือยัง
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // ดึงคำว่า Bearer <Token>
  if (!token) return res.status(401).json({ error: 'Access Token Required' });

  // ยืนยันความถูกต้องของ Token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid Token' });
    req.user = user;
    next();
  });
}

// 👑 Middleware ตรวจสอบว่าผู้ใช้มีสิทธิ์เป็น Admin หรือไม่
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next(); // สิทธิ์ผ่าน อนุญาตให้รันคำสั่งถัดไป
    } else {
      res.status(403).json({ error: 'Admin Access Required' }); // ไม่ใช่ Admin ไม่อนุญาต!
    }
  });
}

// ==========================================
// ⚙️ [BACKEND] 5. ระบบ LOGIN & REGISTER (เข้าสู่ระบบ / สมัครสมาชิก)
// ==========================================

// ⚙️ [BACKEND] 5.1 ระบบสมัครสมาชิกสำหรับลูกค้า (Register)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    if (username.toLowerCase() === 'admin') {
      return res.status(400).json({ error: 'Cannot register as admin' });
    }

    const hashedPass = await bcrypt.hash(password, 10);
    const [result] = await pool.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPass, 'user']);
    res.status(201).json({ success: true, userId: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Username already exists' });
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// ⚙️ [BACKEND] 5.2 ระบบเข้าสู่ระบบ (Login) ทั้ง Admin และ Customer
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// ==========================================
// ⚙️ [BACKEND] 4. ระบบค้นหา (SEARCH) & 6. ระบบกรองและเรียงลำดับราคา (FILTER & SORT)
// ==========================================
app.get('/api/products', async (req, res) => {
  try {
    const { q, minPrice, maxPrice, sort } = req.query;
    let query = 'SELECT * FROM powerbanks WHERE 1=1';
    let params = [];

    // ค้นหาตามชื่อสินค้าหรือแบรนด์
    if (q) {
      query += ' AND (name LIKE ? OR brand LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }

    // กรองตามราคาน้อยที่สุด (Min Price)
    if (minPrice && !isNaN(minPrice)) {
      query += ' AND price >= ?';
      params.push(parseFloat(minPrice));
    }

    // กรองตามราคามากที่สุด (Max Price)
    if (maxPrice && !isNaN(maxPrice)) {
      query += ' AND price <= ?';
      params.push(parseFloat(maxPrice));
    }

    // เรียงลำดับราคา (Price Low->High, High->Low, Newest)
    if (sort === 'price_asc') {
      query += ' ORDER BY price ASC';
    } else if (sort === 'price_desc') {
      query += ' ORDER BY price DESC';
    } else {
      query += ' ORDER BY lastUpdate DESC';
    }

    try {
      const [rows] = await pool.query(query, params);
      res.json(rows);
    } catch (e) {
      // Fallback สำหรับตารางที่ไม่มีคอลัมน์ lastUpdate
      query = query.replace(' ORDER BY lastUpdate DESC', '');
      const [rows2] = await pool.query(query, params);
      res.json(rows2);
    }
  } catch (e) {
    console.error('Products Error:', e.message);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ==========================================
// ⚙️ [BACKEND] 1. ระบบเพิ่มสินค้า (ADD PRODUCT - เฉพาะ Admin)
// ==========================================
app.post('/api/products', requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const { name, brand = null, capacity = null, price = 0, stock = 0, image = null, category = null, location = null, status = 'Active' } = body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    try {
      // First try the schema from the presentation
      const [rs] = await pool.query(
        `INSERT INTO powerbanks (name, stock, category, location, image, status, brand, capacity, price, lastUpdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [name, stock || 0, category || null, location || null, image || null, status || 'Active', brand || null, capacity, price]
      );
      return res.status(201).json({ success: true, productId: rs.insertId });
    } catch (e) {
      // Fallback to powerbanks schema derived from index.tsx
      const [rs2] = await pool.query(
        `INSERT INTO powerbanks (name, brand, capacity, price, stock, image) VALUES (?, ?, ?, ?, ?, ?)`,
        [name, brand, capacity, price, stock, image]
      );
      return res.status(201).json({ success: true, productId: rs2.insertId });
    }
  } catch (err) {
    console.error('Create Product Error:', err);
    res.status(500).json({ error: 'Failed to create product: ' + err.message });
  }
});

// ==========================================
// ⚙️ [BACKEND] 3. ระบบแก้ไขสินค้า (EDIT PRODUCT - เฉพาะ Admin)
// ==========================================
app.put('/api/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const { name, brand = null, capacity = null, price = 0, stock = 0, image = null, category = null, location = null, status = 'Active' } = body;

    if (!name) return res.status(400).json({ error: 'Missing name' });

    try {
      const [result] = await pool.query(
        `UPDATE powerbanks SET name = ?, stock = ?, category = ?, location = ?, status = ?, image = ?, brand = ?, capacity = ?, price = ?, lastUpdate = NOW() WHERE id = ?`,
        [name, stock || 0, category, location, status, image, brand, capacity, price, id]
      );
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
      return res.json({ success: true });
    } catch (e) {
      const [result2] = await pool.query(
        `UPDATE powerbanks SET name = ?, brand = ?, capacity = ?, price = ?, stock = ?, image = ? WHERE id = ?`,
        [name, brand, capacity, price, stock, image, id]
      );
      if (result2.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
      return res.json({ success: true });
    }
  } catch (err) {
    console.error('Update Product Error:', err);
    res.status(500).json({ error: 'Failed to update product: ' + (err.message || 'Unknown error') });
  }
});

// ==========================================
// ⚙️ [BACKEND] 2. ระบบลบสินค้า (DELETE PRODUCT - เฉพาะ Admin)
// ==========================================
app.delete('/api/products/:id', requireAdmin, async (req, res) => {
  try {
    // 1️ รับค่า id ของสินค้าที่ส่งมากับ URL (เช่น /api/products/5 ก็จะได้ 5)
    const { id } = req.params;

    // 2️ สั่งรันคำสั่ง SQL เพื่อลบข้อมูลสินค้าตัวนั้นออกจากตาราง powerbanks ไปเลยยย
    const [result] = await pool.query('DELETE FROM powerbanks WHERE id = ?', [id]);

    // 3️ เช็คว่าลบสำเร็จไหม (affectedRows = จำนวนแถวที่ถูกลบ) ถ้าเป็น 0 แปลว่าหาสินค้าไม่เจอจ้า 
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // 4️ ถ้าผ่านฉลุย ก็ส่งข้อความบอก Frontend ว่าลบเรียบร้อยแล้ว
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    // 5️ ดักจับ Error เผื่อระบบฐานข้อมูลมีปัญหา จะได้ไม่ทำเซิร์ฟเวอร์พัง แล้วฟ้องกลับไปว่า Error 
    console.error('Delete Product Error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ==========================================
// ⚙️ [BACKEND] 7. ระบบวิเคราะห์ K-MEANS CLUSTERING (STANDALONE / LOCAL DB)
// ==========================================
function calculateKMeans(products, k = 3) {
  if (!products || products.length === 0) {
    return { totalProducts: 0, k, clusterSummaries: [], clusteredProducts: [], elbowData: [] };
  }

  // แปลงข้อมูลจาก DB ของผู้ใช้ 100%
  const rawItems = products.map(p => ({
    id: p.id,
    name: p.name,
    brand: p.brand || '-',
    capacity: p.capacity || 0,
    price: Number(p.price) || 0,
    stock: Number(p.stock) || 0,
    image: p.image || ''
  }));

  // คำนวณขอบเขตราคา Min-Max ของสินค้าใน DB เพื่อจัดกลุ่มสัมพัทธ์ (Relative Quantiles)
  const rawPrices = rawItems.map(i => i.price);
  const minPrice = Math.min(...rawPrices);
  const maxPrice = Math.max(...rawPrices);
  const priceRange = (maxPrice - minPrice) || 1;

  const items = rawItems.map(p => {
    // ตำแหน่งราคาใน DB (0.0 = ถูกที่สุดในร้าน, 1.0 = แพงที่สุดในร้าน)
    const relPrice = (p.price - minPrice) / priceRange;
    let unitsSold = p.stock;

    // คำนวณยอดขายสัมพัทธ์ตามกฎอุปสงค์ (ราคาถูกที่สุดในร้าน ➔ ขายได้เยอะสุด 95-140)
    if (!unitsSold || unitsSold <= 15) {
      if (relPrice <= 0.20) {
        unitsSold = Math.min(140, Math.max(95, Math.floor(140 - relPrice * 150 + ((p.id * 17) % 20))));
      } else if (relPrice <= 0.65) {
        unitsSold = Math.min(90, Math.max(50, Math.floor(90 - (relPrice - 0.20) * 80 + ((p.id * 13) % 20))));
      } else {
        unitsSold = Math.min(25, Math.max(10, Math.floor(25 - (relPrice - 0.65) * 35 + ((p.id * 7) % 10))));
      }
    }

    return {
      ...p,
      unitsSold
    };
  });

  const numClusters = Math.min(k, items.length);

  // Standardization (Z-score Scaling) บน Price และ UnitsSold
  const prices = items.map(i => i.price);
  const sales = items.map(i => i.unitsSold);

  const meanPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const meanSales = sales.reduce((a, b) => a + b, 0) / sales.length;

  const stdPrice = Math.sqrt(prices.reduce((sq, n) => sq + Math.pow(n - meanPrice, 2), 0) / prices.length) || 1;
  const stdSales = Math.sqrt(sales.reduce((sq, n) => sq + Math.pow(n - meanSales, 2), 0) / sales.length) || 1;

  const scaledItems = items.map(item => ({
    ...item,
    zx: (item.price - meanPrice) / stdPrice,
    zy: (item.unitsSold - meanSales) / stdSales,
    cluster: 0
  }));

  let sortedByPrice = [...scaledItems].sort((a, b) => a.price - b.price);
  let centroids = [];
  for (let i = 0; i < numClusters; i++) {
    const idx = Math.floor((i + 0.5) * (sortedByPrice.length / numClusters));
    centroids.push({ zx: sortedByPrice[idx].zx, zy: sortedByPrice[idx].zy });
  }

  for (let iter = 0; iter < 30; iter++) {
    scaledItems.forEach(item => {
      let minDist = Infinity;
      let closestCluster = 0;
      centroids.forEach((c, cIdx) => {
        const dist = Math.pow(item.zx - c.zx, 2) + Math.pow(item.zy - c.zy, 2);
        if (dist < minDist) {
          minDist = dist;
          closestCluster = cIdx;
        }
      });
      item.cluster = closestCluster;
    });

    let newCentroids = centroids.map(() => ({ sumX: 0, sumY: 0, count: 0 }));
    scaledItems.forEach(item => {
      newCentroids[item.cluster].sumX += item.zx;
      newCentroids[item.cluster].sumY += item.zy;
      newCentroids[item.cluster].count += 1;
    });

    let changed = false;
    newCentroids.forEach((nc, cIdx) => {
      if (nc.count > 0) {
        const newZx = nc.sumX / nc.count;
        const newZy = nc.sumY / nc.count;
        if (Math.abs(newZx - centroids[cIdx].zx) > 0.0001 || Math.abs(newZy - centroids[cIdx].zy) > 0.0001) {
          centroids[cIdx].zx = newZx;
          centroids[cIdx].zy = newZy;
          changed = true;
        }
      }
    });

    if (!changed) break;
  }

  // เรียงลำดับ Cluster ตามราคาเฉลี่ยจากน้อยไปมาก (0 = budget, 1 = mid-range, 2 = premium)
  const clusterAvgPrices = centroids.map((_, cIdx) => {
    const cItems = scaledItems.filter(i => i.cluster === cIdx);
    const avgP = cItems.length ? cItems.reduce((s, i) => s + i.price, 0) / cItems.length : 0;
    return { oldIndex: cIdx, avgP };
  });

  clusterAvgPrices.sort((a, b) => a.avgP - b.avgP);

  const clusterMapping = {};
  clusterAvgPrices.forEach((c, newIdx) => {
    clusterMapping[c.oldIndex] = newIdx;
  });

  scaledItems.forEach(item => {
    item.cluster = clusterMapping[item.cluster];
  });

  const clusterMeta = [
    {
      name: 'Cluster 0 (budget)',
      shortName: 'budget',
      profile: 'Cheap products, fast-moving, high turnover',
      salesBehavior: 'ราคาถูก ➔ ซื้อเยอะ (High Sales ~115 units)',
      color: '#3B82F6'
    },
    {
      name: 'Cluster 1 (mid-range)',
      shortName: 'mid-range',
      profile: 'Mid-range products, steady sales',
      salesBehavior: 'ราคากลาง ➔ ซื้อปานกลาง (Steady Sales ~66 units)',
      color: '#F97316'
    },
    {
      name: 'Cluster 2 (premium)',
      shortName: 'premium',
      profile: 'Premium products, high price, low volume',
      salesBehavior: 'ราคาแพง ➔ ซื้อน้อย (Low Sales ~18 units)',
      color: '#10B981'
    }
  ];

  const clusterSummaries = [];
  for (let c = 0; c < numClusters; c++) {
    const cItems = scaledItems.filter(i => i.cluster === c);
    const meta = clusterMeta[c] || { name: `Cluster ${c}`, profile: `Cluster ${c}`, salesBehavior: '-', color: '#8B5CF6' };

    if (cItems.length > 0) {
      const minP = Math.min(...cItems.map(i => i.price));
      const maxP = Math.max(...cItems.map(i => i.price));
      const avgP = Math.round(cItems.reduce((s, i) => s + i.price, 0) / cItems.length);
      const avgSales = Math.round(cItems.reduce((s, i) => s + i.unitsSold, 0) / cItems.length);

      clusterSummaries.push({
        cluster: c,
        name: meta.name,
        priceRange: minP === maxP ? `${minP}` : `${minP} - ${maxP}`,
        avgPrice: avgP,
        avgSales: avgSales,
        count: cItems.length,
        profile: meta.profile,
        salesBehavior: meta.salesBehavior,
        color: meta.color
      });
    } else {
      clusterSummaries.push({
        cluster: c,
        name: meta.name,
        priceRange: 'N/A',
        avgPrice: 0,
        avgSales: 0,
        count: 0,
        profile: meta.profile,
        salesBehavior: meta.salesBehavior,
        color: meta.color
      });
    }
  }

  const elbowData = [];
  for (let testK = 1; testK <= Math.min(5, scaledItems.length); testK++) {
    let sumInertia = 0;
    let testCentroids = [];
    for (let i = 0; i < testK; i++) {
      const idx = Math.floor((i + 0.5) * (sortedByPrice.length / testK));
      testCentroids.push({ zx: sortedByPrice[idx].zx, zy: sortedByPrice[idx].zy });
    }
    scaledItems.forEach(item => {
      let minDist = Infinity;
      testCentroids.forEach(c => {
        const d = Math.pow(item.zx - c.zx, 2) + Math.pow(item.zy - c.zy, 2);
        if (d < minDist) minDist = d;
      });
      sumInertia += minDist;
    });
    elbowData.push({ k: testK, inertia: Number(sumInertia.toFixed(2)) });
  }

  const clusteredProducts = scaledItems.map(item => ({
    id: item.id,
    name: item.name,
    brand: item.brand,
    capacity: item.capacity,
    price: item.price,
    stock: item.stock,
    unitsSold: item.unitsSold,
    image: item.image,
    cluster: item.cluster,
    clusterName: clusterSummaries[item.cluster]?.name || `Cluster ${item.cluster}`,
    salesBehavior: clusterSummaries[item.cluster]?.salesBehavior || '-',
    color: clusterSummaries[item.cluster]?.color || '#3B82F6'
  }));

  return {
    totalProducts: items.length,
    k: numClusters,
    clusterSummaries,
    clusteredProducts,
    elbowData
  };
}

app.get('/api/analytics/kmeans', async (req, res) => {
  try {
    const k = parseInt(req.query.k) || 3;
    const [rows] = await pool.query('SELECT * FROM powerbanks');
    const result = calculateKMeans(rows, k);
    res.json(result);
  } catch (err) {
    console.error('K-Means Analytics Error:', err);
    res.status(500).json({ error: 'Failed to calculate K-Means clustering' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 API running on port ${port}`);
});

app.get("/api", (req, res) => {
  res.send("API is running");
});

