
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

// 数据库基础连接配置 - 使用用户确认的 IP
const dbBaseConfig = {
  host: process.env.DB_HOST || '192.168.21.60', 
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '249gaqLY4pdeHH71T8',
  port: parseInt(process.env.DB_PORT || '3306'),
  connectTimeout: 15000 
};

const DB_NAME = process.env.DB_NAME || 'tiangong_db';

let pool = null;

async function initDB() {
  console.log(`[DB] 正在连接运维中枢数据库: ${dbBaseConfig.host}...`);
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

    // 核心元数据表初始化
    await pool.query(`CREATE TABLE IF NOT EXISTS roles (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) UNIQUE, description VARCHAR(255))`);
    await pool.query(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) UNIQUE, password VARCHAR(100), real_name VARCHAR(100), role_id INT)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS announcements (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(200), content TEXT, app_context VARCHAR(50), priority VARCHAR(20), publish_date DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS sub_apps (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100), description TEXT, icon_type VARCHAR(50), color_theme VARCHAR(50), sort_order INT DEFAULT 0)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS data_sources (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100), type VARCHAR(20), host VARCHAR(100), status VARCHAR(20) DEFAULT 'online')`);
    
    // 新增：服务器资产表 (CMDB)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS servers (
        id VARCHAR(50) PRIMARY KEY,
        hostname VARCHAR(100) NOT NULL,
        ip VARCHAR(50) NOT NULL,
        os VARCHAR(50),
        cpu_cores INT,
        memory_gb INT,
        status VARCHAR(20) DEFAULT 'running',
        env VARCHAR(20) DEFAULT 'prod',
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [count] = await pool.query('SELECT count(*) as count FROM servers');
    if (count[0].count === 0) {
      console.log(`[DB] 正在初始化模拟资产元数据...`);
      await pool.query("INSERT INTO roles (name, description) VALUES ('admin', '超级管理员'), ('ops', '运维')");
      await pool.query("INSERT INTO users (username, password, real_name, role_id) VALUES ('Admin', 'admin123', '系统管理员', 1)");
      await pool.query(`
        INSERT INTO sub_apps (id, name, description, icon_type, color_theme, sort_order) VALUES 
        ('DATABASE_MANAGER', '数据库管理', '实例生命周期、敏感词扫描、智能巡检', 'Database', 'blue', 1),
        ('SERVER_MANAGER', '资产管理系统', 'CMDB、主机监控、自动化运维台账', 'Server', 'indigo', 2),
        ('NETWORK_MANAGER', '流量监控', '网络链路拨测、拓扑自动发现', 'Globe', 'emerald', 3),
        ('SECURITY_AUDIT', '安全审计', '基线合规检查、漏洞定期扫描', 'Shield', 'amber', 4)
      `);
      await pool.query(`
        INSERT INTO servers (id, hostname, ip, os, cpu_cores, memory_gb, env) VALUES 
        ('srv-01', 'prod-web-01', '10.0.1.10', 'CentOS 7.9', 8, 16, 'prod'),
        ('srv-02', 'prod-db-master', '10.0.1.20', 'Ubuntu 22.04', 16, 64, 'prod'),
        ('srv-03', 'test-app-node', '10.0.2.5', 'Debian 11', 4, 8, 'test'),
        ('srv-04', 'prod-redis-01', '10.0.1.30', 'CentOS 7.9', 4, 16, 'prod')
      `);
    }

    console.log('[DB] 运维平台后端元数据库已就绪');
  } catch (err) {
    console.error('[DB] 初始化失败:', err.message);
  }
}

const checkDb = (req, res, next) => { if (!pool) return res.status(503).json({ error: 'DB NOT READY' }); next(); };

app.post('/api/login', checkDb, async (req, res) => {
  const { username, password } = req.body;
  const [users] = await pool.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
  if (users.length > 0) res.json({ success: true, user: users[0] });
  else res.status(401).json({ success: false, error: '认证失败' });
});

app.get('/api/portal/data', checkDb, async (req, res) => {
  const [apps] = await pool.query('SELECT * FROM sub_apps ORDER BY sort_order');
  const [ann] = await pool.query('SELECT * FROM announcements ORDER BY publish_date DESC LIMIT 5');
  res.json({ success: true, apps, announcements: ann });
});

app.get('/api/servers', checkDb, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM servers');
  res.json({ success: true, data: rows });
});

app.get('/api/sources', checkDb, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM data_sources');
  res.json(rows);
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

app.listen(PORT, async () => {
  console.log(`[SYS] 天工中枢监听于端口: ${PORT}`);
  await initDB();
});
