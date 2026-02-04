
import express from 'express';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 80;
const LOG_FILE_PATH = path.join(__dirname, 'tiangong_system.log');

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

/**
 * 核心日志处理器 (Triple-Play Logger)
 * 1. 终端打印 (Console)
 * 2. 数据库写入 (MySQL) - 供前端 LogCenter 使用
 * 3. 物理文件写入 (FS) - 供运维留存和分析
 */
async function logMessage(level, module, message) {
  const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  const logEntry = `[${timestamp}] [${level}] [${module}] ${message}`;

  // 1. 输出到终端
  if (level === 'ERROR') {
    console.error(logEntry);
  } else {
    console.log(logEntry);
  }

  // 2. 异步写入物理文件 (Append mode)
  try {
    fs.appendFileSync(LOG_FILE_PATH, logEntry + '\n');
  } catch (fsErr) {
    console.warn('[LOG_FS_ERR] 无法写入物理日志文件:', fsErr.message);
  }

  // 3. 写入数据库
  if (!pool) return;
  try {
    await pool.query(
      'INSERT INTO system_logs (level, module, message) VALUES (?, ?, ?)',
      [level, module, message]
    );
  } catch (dbErr) {
    // 此处不重复打印控制台，防止死循环
  }
}

async function initDB() {
  await logMessage('INFO', 'SYSTEM', `正在建立中枢数据库连接: ${dbBaseConfig.host}...`);
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

    // 初始化表结构
    await pool.query(`CREATE TABLE IF NOT EXISTS system_logs (id INT AUTO_INCREMENT PRIMARY KEY, level VARCHAR(20), module VARCHAR(50), message TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS roles (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) UNIQUE, description VARCHAR(255))`);
    await pool.query(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) UNIQUE, password VARCHAR(100), real_name VARCHAR(100), role_id INT)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS sub_apps (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100), description TEXT, icon_type VARCHAR(50), color_theme VARCHAR(50), sort_order INT DEFAULT 0)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS servers (id VARCHAR(50) PRIMARY KEY, hostname VARCHAR(100), ip VARCHAR(50), status VARCHAR(20), env VARCHAR(20), cpu_cores INT, memory_gb INT)`);

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
      await logMessage('INFO', 'INIT', '天工平台核心元数据初始化完成');
    }

    await logMessage('INFO', 'DB_POOL', `数据库连接池就绪，日志物理文件位于: ${LOG_FILE_PATH}`);
  } catch (err) {
    await logMessage('ERROR', 'DB_CRITICAL', `初始化数据库失败: ${err.message}`);
  }
}

const checkDb = (req, res, next) => { if (!pool) return res.status(503).json({ error: 'DATABASE_DISCONNECTED' }); next(); };

app.post('/api/login', checkDb, async (req, res) => {
  const { username, password } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    if (users.length > 0) {
      await logMessage('INFO', 'AUTH', `用户 ${username} 成功登录`);
      res.json({ success: true, user: users[0] });
    } else {
      await logMessage('WARN', 'AUTH', `失败的登录尝试: ${username}`);
      res.status(401).json({ success: false, error: '认证失败' });
    }
  } catch (e) {
    await logMessage('ERROR', 'AUTH_API', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/logs', checkDb, async (req, res) => {
  const { level, limit = 50 } = req.query;
  let query = 'SELECT * FROM system_logs';
  const params = [];
  if (level) { query += ' WHERE level = ?'; params.push(level); }
  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(parseInt(limit));
  const [rows] = await pool.query(query, params);
  res.json({ success: true, data: rows });
});

app.get('/api/portal/data', checkDb, async (req, res) => {
  const [apps] = await pool.query('SELECT * FROM sub_apps ORDER BY sort_order');
  const [ann] = await pool.query('SELECT * FROM announcements ORDER BY publish_date DESC');
  res.json({ success: true, apps, announcements: ann });
});

app.get('/api/servers', checkDb, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM servers');
  res.json({ success: true, data: rows });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

app.listen(PORT, async () => {
  await logMessage('INFO', 'SERVER', `天工运维平台启动，监听端口: ${PORT}`);
  await initDB();
});
