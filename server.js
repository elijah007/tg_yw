
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

// 数据库连接配置（天工平台元数据库，用于存储数据源信息）
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'tiangong_db',
  port: parseInt(process.env.DB_PORT || '3306'),
  connectTimeout: 5000
};

let pool = null;

async function initDB() {
  try {
    pool = mysql.createPool(dbConfig);
    // 立即尝试连一下确认元数据库配置正确
    await pool.query('SELECT 1');
    console.log(`Connected to Tiangong Meta-DB at ${dbConfig.host}`);
    
    // 初始化数据表
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
    console.error('Meta Database initialization failed:', err.message);
    pool = null;
  }
}

// 检查元数据库是否就绪
const checkDbReady = (req, res, next) => {
  if (!pool) {
    return res.status(503).json({ success: false, error: '元数据库连接失败，请检查后端 DB_HOST 环境变量。' });
  }
  next();
};

// API: 获取所有数据源
app.get('/api/sources', checkDbReady, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM data_sources');
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
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: 新增或修改数据源 (UPSERT)
app.post('/api/sources', checkDbReady, async (req, res) => {
  const s = req.body;
  try {
    // 使用 ON DUPLICATE KEY UPDATE 实现“有则改，无则加”
    await pool.query(
      `INSERT INTO data_sources (id, name, type, host, port, database_name, username, password, status, last_scanned) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
         name = VALUES(name), 
         type = VALUES(type), 
         host = VALUES(host), 
         port = VALUES(port), 
         database_name = VALUES(database_name), 
         username = VALUES(username), 
         password = VALUES(password), 
         status = VALUES(status)`,
      [s.id, s.name, s.type, s.host, s.port, s.database, s.username, s.password, s.status || 'online', s.lastScanned || '']
    );
    console.log(`Data source ${s.id} (${s.name}) saved/updated.`);
    res.json({ success: true, message: '数据已同步至元数据库' });
  } catch (err) {
    console.error('Save Source Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: 物理删除数据源
app.delete('/api/sources/:id', checkDbReady, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM data_sources WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: '记录不存在' });
    }
    console.log(`Data source ${req.params.id} deleted from database.`);
    res.json({ success: true, message: '数据库记录已删除' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: 真实物理拨测
app.post('/api/sources/test', async (req, res) => {
  const { type, host, port, username, password, database } = req.body;
  if (type !== 'mysql') {
    return res.status(400).json({ success: false, error: '目前仅支持 MySQL 测试' });
  }
  try {
    const conn = await mysql.createConnection({
      host, port: parseInt(port), user: username, password, database,
      connectTimeout: 5000
    });
    await conn.query('SELECT 1');
    await conn.end();
    res.json({ success: true, message: '物理连接测试成功' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  initDB();
  console.log(`Tiangong Platform Server running on port ${PORT}`);
});
