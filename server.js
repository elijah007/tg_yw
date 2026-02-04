
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

// 数据库连接配置（平台自身元数据库）
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'tiangong_db',
  port: parseInt(process.env.DB_PORT || '3306'),
  connectTimeout: 5000
};

let pool;

async function initDB() {
  try {
    pool = mysql.createPool(dbConfig);
    console.log(`Connected to Meta-MySQL at ${dbConfig.host}`);
    
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
    console.error('Meta Database connection failed:', err.message);
  }
}

// API: 真实测试数据源连接
app.post('/api/sources/test', async (req, res) => {
  const { type, host, port, username, password, database } = req.body;
  
  if (type !== 'mysql') {
    return res.status(400).json({ error: `目前仅支持 MySQL 类型的数据源在线测试，${type} 正在开发中。` });
  }

  try {
    // 尝试建立一次性连接
    const connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user: username,
      password,
      database,
      connectTimeout: 5000 // 5秒超时
    });

    // 执行一个简单的查询
    await connection.query('SELECT 1');
    await connection.end();
    
    res.json({ success: true, message: '连接成功' });
  } catch (err) {
    console.error('Test Connection Failed:', err.message);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      code: err.code 
    });
  }
});

// API: 获取数据源
app.get('/api/sources', async (req, res) => {
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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  initDB();
  console.log(`Tiangong Platform Server running on port ${PORT}`);
});
