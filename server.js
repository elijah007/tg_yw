
import express from 'express';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const LOG_FILE_PATH = path.resolve(__dirname, 'tiangong_system.log');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

const dbBaseConfig = {
  host: process.env.DB_HOST || '192.168.21.60', 
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '249gaqLY4pdeHH71T8',
  port: parseInt(process.env.DB_PORT || '3306'),
  connectTimeout: 3000
};

const DB_NAME = process.env.DB_NAME || 'tiangong_db';
let pool = null;

async function logMessage(level, module, message) {
  const timestamp = new Date().toLocaleString();
  const logEntry = `[${timestamp}] [${level}] [${module}] ${message}`;
  const colors = { INFO: '\x1b[32m', WARN: '\x1b[33m', ERROR: '\x1b[31m', RESET: '\x1b[0m' };
  console.log(`${colors[level] || ''}${logEntry}${colors.RESET}`);
  try { fs.appendFileSync(LOG_FILE_PATH, logEntry + '\n'); } catch (e) {}
  if (pool) {
    try { await pool.query('INSERT INTO system_logs (level, module, message) VALUES (?, ?, ?)', [level, module, message]); } catch (e) {}
  }
}

async function initDB() {
  await logMessage('INFO', 'SYSTEM', `尝试连接元数据库: ${dbBaseConfig.host}...`);
  try {
    const tempConn = await mysql.createConnection(dbBaseConfig);
    await tempConn.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4`);
    await tempConn.end();
    pool = mysql.createPool({ ...dbBaseConfig, database: DB_NAME, waitForConnections: true, connectionLimit: 5 });
    
    await pool.query(`CREATE TABLE IF NOT EXISTS system_logs (id INT AUTO_INCREMENT PRIMARY KEY, level VARCHAR(20), module VARCHAR(50), message TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS sub_apps (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100), description TEXT, icon_type VARCHAR(50), color_theme VARCHAR(50), sort_order INT DEFAULT 0)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) UNIQUE, password VARCHAR(100), real_name VARCHAR(100))`);
    await pool.query(`CREATE TABLE IF NOT EXISTS servers (id VARCHAR(50) PRIMARY KEY, hostname VARCHAR(100), ip VARCHAR(50), status VARCHAR(20), env VARCHAR(20), cpu_cores INT, memory_gb INT)`);

    const [appsCount] = await pool.query('SELECT count(*) as count FROM sub_apps');
    if (appsCount[0].count === 0) {
      await pool.query(`INSERT INTO sub_apps (id, name, description, icon_type, color_theme, sort_order) VALUES 
        ('DATABASE_MANAGER', '数据库管理', '实例生命周期与巡检', 'Database', 'blue', 1),
        ('SERVER_MANAGER', '资产管理系统', 'CMDB与主机监控', 'Server', 'indigo', 2),
        ('LOG_CENTER', '日志中心', '应用运行日志与审计看板', 'Terminal', 'slate', 3),
        ('SECURITY_AUDIT', '安全合规', '漏洞扫描与基线检查', 'Shield', 'amber', 4)`);
      await pool.query("INSERT INTO users (username, password, real_name) VALUES ('Admin', 'admin123', '系统管理员')");
      await logMessage('INFO', 'INIT', '平台预置数据已就绪');
    }
    await logMessage('INFO', 'SYSTEM', '数据库连接与表结构校验通过');
  } catch (err) {
    await logMessage('ERROR', 'DATABASE', `连接失败: ${err.message}. 平台运行在演示模式。`);
  }
}

const checkDb = (req, res, next) => { if (!pool) return res.status(503).json({ success: false, error: 'DATABASE_OFFLINE' }); next(); };

app.get('/api/portal/data', checkDb, async (req, res) => {
  try {
    const [apps] = await pool.query('SELECT * FROM sub_apps ORDER BY sort_order');
    res.json({ success: true, apps });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/login', checkDb, async (req, res) => {
  const { username, password } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    if (users.length > 0) {
      await logMessage('INFO', 'AUTH', `用户 ${username} 登录成功`);
      res.json({ success: true, user: users[0] });
    } else {
      res.status(401).json({ success: false, error: '认证无效' });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/logs', checkDb, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 100');
  res.json({ success: true, data: rows });
});

app.get('/api/servers', checkDb, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM servers');
  res.json({ success: true, data: rows });
});

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) res.sendFile(indexPath);
  else res.status(404).send('Backend API is active. Frontend dist folder not found.');
});

app.listen(PORT, async () => {
  fs.writeFileSync(LOG_FILE_PATH, `>>> TIANGONG BOOT: ${new Date().toISOString()} <<<\n`);
  console.log(`\n\x1b[42m SUCCESS \x1b[0m 后端 API 服务: http://localhost:${PORT}`);
  console.log(`\x1b[44m INFO \x1b[0m 调试日志文件已创建: ${LOG_FILE_PATH}\n`);
  await initDB();
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\x1b[31m ERROR \x1b[0m 端口 ${PORT} 已被占用！请确认是否已经运行了另一个 Node 进程，或关闭占用 3000 端口的程序。\n`);
  }
});
