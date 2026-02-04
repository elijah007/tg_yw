
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

const dbBaseConfig = {
  host: process.env.DB_HOST || '192.168.21.60', 
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '249gaqLY4pdeHH71T8',
  port: parseInt(process.env.DB_PORT || '3306'),
  connectTimeout: 15000 
};

const DB_NAME = process.env.DB_NAME || 'tiangong_db';
let pool = null;

// 通用日志记录函数
async function logToDB(level, module, message) {
  if (!pool) {
    console.log(`[${level}] [${module}] ${message}`);
    return;
  }
  try {
    await pool.query(
      'INSERT INTO system_logs (level, module, message) VALUES (?, ?, ?)',
      [level, module, message]
    );
  } catch (err) {
    console.error('Failed to write log to DB:', err.message);
  }
}

async function initDB() {
  console.log(`[DB] 正在建立中枢连接: ${dbBaseConfig.host}...`);
  try {
    const tempConn = await mysql.createConnection(dbBaseConfig);
    await tempConn.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4`);
    await tempConn.end();

    pool = mysql.createPool({
      ...dbBaseConfig,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 15
    });

    // 创建表结构
    await pool.query(`CREATE TABLE IF NOT EXISTS roles (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) UNIQUE, description VARCHAR(255))`);
    await pool.query(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) UNIQUE, password VARCHAR(100), real_name VARCHAR(100), role_id INT)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS announcements (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(200), content TEXT, app_context VARCHAR(50), priority VARCHAR(20), publish_date DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS sub_apps (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100), description TEXT, icon_type VARCHAR(50), color_theme VARCHAR(50), sort_order INT DEFAULT 0)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS data_sources (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100), type VARCHAR(20), host VARCHAR(100), status VARCHAR(20) DEFAULT 'online')`);
    await pool.query(`CREATE TABLE IF NOT EXISTS servers (id VARCHAR(50) PRIMARY KEY, hostname VARCHAR(100), ip VARCHAR(50), status VARCHAR(20), env VARCHAR(20), cpu_cores INT, memory_gb INT)`);
    
    // 日志表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        level VARCHAR(20) NOT NULL,
        module VARCHAR(50),
        message TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 初始化数据
    const [appsCount] = await pool.query('SELECT count(*) as count FROM sub_apps');
    if (appsCount[0].count === 0) {
      await pool.query("INSERT INTO roles (name, description) VALUES ('admin', '超级管理员')");
      await pool.query("INSERT INTO users (username, password, real_name, role_id) VALUES ('Admin', 'admin123', '系统管理员', 1)");
      await pool.query(`
        INSERT INTO sub_apps (id, name, description, icon_type, color_theme, sort_order) VALUES 
        ('DATABASE_MANAGER', '数据库管理', '实例生命周期与巡检', 'Database', 'blue', 1),
        ('SERVER_MANAGER', '资产管理系统', 'CMDB与主机监控', 'Server', 'indigo', 2),
        ('LOG_CENTER', '日志中心', '应用运行日志与审计看板', 'Terminal', 'slate', 3),
        ('SECURITY_AUDIT', '安全合规', '漏洞扫描与基线检查', 'Shield', 'amber', 4)
      `);
      await logToDB('INFO', 'SYSTEM', '天工平台核心元数据初始化完成');
    }

    await logToDB('INFO', 'DB_INIT', `连接池已建立，最大连接数: 15`);
  } catch (err) {
    console.error('[DB] CRITICAL ERROR:', err.message);
  }
}

const checkDb = (req, res, next) => { if (!pool) return res.status(503).json({ error: 'DATABASE_DISCONNECTED' }); next(); };

app.post('/api/login', checkDb, async (req, res) => {
  const { username, password } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    if (users.length > 0) {
      await logToDB('INFO', 'AUTH', `用户 ${username} 成功通过 Web 控制台登录`);
      res.json({ success: true, user: users[0] });
    } else {
      await logToDB('WARN', 'AUTH', `非法登录尝试: 账号 ${username}`);
      res.status(401).json({ success: false, error: '认证失败' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/portal/data', checkDb, async (req, res) => {
  const [apps] = await pool.query('SELECT * FROM sub_apps ORDER BY sort_order');
  const [ann] = await pool.query('SELECT * FROM announcements ORDER BY publish_date DESC');
  res.json({ success: true, apps, announcements: ann });
});

app.get('/api/logs', checkDb, async (req, res) => {
  const { level, limit = 50 } = req.query;
  let query = 'SELECT * FROM system_logs';
  const params = [];
  if (level) {
    query += ' WHERE level = ?';
    params.push(level);
  }
  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(parseInt(limit));
  
  const [rows] = await pool.query(query, params);
  res.json({ success: true, data: rows });
});

app.get('/api/servers', checkDb, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM servers');
  res.json({ success: true, data: rows });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

app.listen(PORT, async () => {
  console.log(`[SYS] O&M Platform started on port ${PORT}`);
  await initDB();
});
