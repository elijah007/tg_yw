
import express from 'express';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import cors from 'cors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 80;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

// 数据库连接配置（优先读取环境变量）
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'tiangong_db',
  port: parseInt(process.env.DB_PORT || '3306')
};

let pool;

async function initDB() {
  try {
    pool = mysql.createPool(dbConfig);
    console.log(`Connected to MySQL at ${dbConfig.host}`);
    
    // 初始化表结构
    await pool.query(`
      CREATE TABLE IF NOT EXISTS data_sources (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20),
        host VARCHAR(100),
        port INT,
        database_name VARCHAR(100),
        username VARCHAR(100),
        password VARCHAR(100),
        status VARCHAR(20) DEFAULT 'online',
        last_scanned VARCHAR(50)
      )
    `);
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
}

// API: 获取数据源
app.get('/api/sources', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM data_sources');
    // 将数据库字段映射回前端需要的 DataSource 接口
    const sources = rows.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      host: r.host,
      port: r.port,
      database: r.database_name,
      username: r.username,
      status: r.status,
      lastScanned: r.last_scanned
    }));
    res.json(sources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: 新增/更新数据源
app.post('/api/sources', async (req, res) => {
  const s = req.body;
  try {
    await pool.query(
      `INSERT INTO data_sources (id, name, type, host, port, database_name, username, password, status, last_scanned) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE name=?, type=?, host=?, port=?, database_name=?, username=?, password=?, status=?`,
      [s.id, s.name, s.type, s.host, s.port, s.database, s.username, s.password, s.status || 'online', s.lastScanned || '',
       s.name, s.type, s.host, s.port, s.database, s.username, s.password, s.status || 'online']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: 删除数据源
app.delete('/api/sources/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM data_sources WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 处理 SPA 路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  initDB();
  console.log(`Tiangong Platform Server running on port ${PORT}`);
});
