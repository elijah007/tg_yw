
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

// 确保日志文件路径绝对可靠
const LOG_FILE_PATH = path.resolve(__dirname, 'tiangong_system.log');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

const dbBaseConfig = {
  host: process.env.DB_HOST || '192.168.21.60', 
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '249gaqLY4pdeHH71T8',
  port: parseInt(process.env.DB_PORT || '3306'),
  connectTimeout: 5000 
};

const DB_NAME = process.env.DB_NAME || 'tiangong_db';
let pool = null;

/**
 * 核心日志处理器
 */
async function logMessage(level, module, message) {
  const timestamp = new Date().toLocaleString();
  const logEntry = `[${timestamp}] [${level}] [${module}] ${message}`;

  // 1. 始终输出到控制台（这是您本地运行 node server.js 最直观能看到的）
  if (level === 'ERROR') {
    console.error(`\x1b[31m${logEntry}\x1b[0m`);
  } else if (level === 'WARN') {
    console.warn(`\x1b[33m${logEntry}\x1b[0m`);
  } else {
    console.log(`\x1b[32m${logEntry}\x1b[0m`);
  }

  // 2. 写入物理文件
  try {
    fs.appendFileSync(LOG_FILE_PATH, logEntry + '\n', 'utf8');
  } catch (fsErr) {
    console.error('CRITICAL: Failed to write to log file at ' + LOG_FILE_PATH, fsErr.message);
  }

  // 3. 写入数据库 (仅在数据库连接成功后)
  if (pool) {
    try {
      await pool.query(
        'INSERT INTO system_logs (level, module, message) VALUES (?, ?, ?)',
        [level, module, message]
      );
    } catch (dbErr) {
      // 避免 DB 写入失败导致递归或刷屏，此处静默
    }
  }
}

async function initDB() {
  await logMessage('INFO', 'DB_INIT', `尝试连接数据库: ${dbBaseConfig.host}...`);
  try {
    const tempConn = await mysql.createConnection(dbBaseConfig);
    await tempConn.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4`);
    await tempConn.end();

    pool = mysql.createPool({
      ...dbBaseConfig,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10
    });

    // 创建表结构
    await pool.query(`CREATE TABLE IF NOT EXISTS system_logs (id INT AUTO_INCREMENT PRIMARY KEY, level VARCHAR(20), module VARCHAR(50), message TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS sub_apps (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100), description TEXT, icon_type VARCHAR(50), color_theme VARCHAR(50), sort_order INT DEFAULT 0)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) UNIQUE, password VARCHAR(100), real_name VARCHAR(100))`);
    await pool.query(`CREATE TABLE IF NOT EXISTS servers (id VARCHAR(50) PRIMARY KEY, hostname VARCHAR(100), ip VARCHAR(50), status VARCHAR(20), env VARCHAR(20), cpu_cores INT, memory_gb INT)`);

    // 检查并初始化子应用
    const [appsCount] = await pool.query('SELECT count(*) as count FROM sub_apps');
    if (appsCount[0].count === 0) {
      await pool.query(`
        INSERT INTO sub_apps (id, name, description, icon_type, color_theme, sort_order) VALUES 
        ('DATABASE_MANAGER', '数据库管理', '实例生命周期与巡检', 'Database', 'blue', 1),
        ('SERVER_MANAGER', '资产管理系统', 'CMDB与主机监控', 'Server', 'indigo', 2),
        ('LOG_CENTER', '日志中心', '应用运行日志与审计看板', 'Terminal', 'slate', 3),
        ('SECURITY_AUDIT', '安全合规', '漏洞扫描与基线检查', 'Shield', 'amber', 4)
      `);
      await pool.query("INSERT INTO users (username, password, real_name) VALUES ('Admin', 'admin123', '系统管理员')");
      await logMessage('INFO', 'SEED', '天工平台核心数据已初始化');
    }

    await logMessage('INFO', 'SYSTEM', `数据库连接成功，日志表已就绪`);
  } catch (err) {
    await logMessage('ERROR', 'DB_INIT', `数据库初始化失败 (请检查 IP ${dbBaseConfig.host}): ${err.message}`);
    // 不要抛出异常，让程序继续运行以便显示前端 UI
  }
}

const checkDb = (req, res, next) => { if (!pool) return res.status(503).json({ error: 'DATABASE_OFFLINE' }); next(); };

app.get('/api/logs', checkDb, async (req, res) => {
  const { level, limit = 100 } = req.query;
  try {
    let query = 'SELECT * FROM system_logs';
    const params = [];
    if (level) { query += ' WHERE level = ?'; params.push(level); }
    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(parseInt(limit));
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
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
      await logMessage('WARN', 'AUTH', `无效的登录尝试: ${username}`);
      res.status(401).json({ success: false, error: '认证失败' });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/portal/data', checkDb, async (req, res) => {
  try {
    const [apps] = await pool.query('SELECT * FROM sub_apps ORDER BY sort_order');
    res.json({ success: true, apps, announcements: [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/servers', checkDb, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM servers');
  res.json({ success: true, data: rows });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

app.listen(PORT, async () => {
  // 启动即写入文件
  fs.writeFileSync(LOG_FILE_PATH, `--- TIANGONG STARTUP AT ${new Date().toISOString()} ---\n`);
  await logMessage('INFO', 'SERVER', `天工运维平台启动，端口: ${PORT}`);
  await initDB();
});
