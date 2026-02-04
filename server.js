
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

// 数据库基础连接配置 - 默认改为 localhost 方便本地开发
const dbBaseConfig = {
  host: process.env.DB_HOST || '192.168.21.60', 
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '249gaqLY4pdeHH71T8',
  port: parseInt(process.env.DB_PORT || '3306'),
  connectTimeout: 10000 // 增加超时时间
};

const DB_NAME = process.env.DB_NAME || 'tiangong_db';

let pool = null;

async function initDB() {
  console.log(`[DB] 正在尝试连接数据库服务器: ${dbBaseConfig.host}:${dbBaseConfig.port}...`);
  try {
    // 1. 先建立一个不带数据库名的连接，用于创建数据库
    const tempConn = await mysql.createConnection(dbBaseConfig);
    console.log(`[DB] 物理连接成功，正在检查/创建数据库: ${DB_NAME}`);
    await tempConn.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await tempConn.end();

    // 2. 创建正式的连接池
    pool = mysql.createPool({
      ...dbBaseConfig,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log(`[DB] 正在初始化数据表结构...`);

    // 1. 权限角色表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(255)
      )
    `);

    // 2. 账号表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(100) NOT NULL,
        real_name VARCHAR(100),
        role_id INT,
        avatar_url VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active'
      )
    `);

    // 3. 系统公告表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        content TEXT,
        app_context VARCHAR(50),
        priority VARCHAR(20),
        publish_date DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. 子应用连接表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sub_apps (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon_type VARCHAR(50),
        color_theme VARCHAR(50),
        route_path VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0
      )
    `);

    // 5. 数据源管理表
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

    // 检查并初始化种子数据
    const [roles] = await pool.query('SELECT count(*) as count FROM roles');
    if (roles[0].count === 0) {
      console.log(`[DB] 检测到空库，正在植入预置元数据...`);
      await pool.query("INSERT INTO roles (name, description) VALUES ('admin', '超级管理员'), ('ops', '运维工程师'), ('viewer', '只读用户')");
      await pool.query("INSERT INTO users (username, password, real_name, role_id) VALUES ('Admin', 'admin123', '高级运维专家-王工', 1)");
      
      await pool.query(`
        INSERT INTO sub_apps (id, name, description, icon_type, color_theme, route_path, sort_order) VALUES 
        ('DATABASE_MANAGER', 'DB 云管平台', 'JDBC 连接管理、全量敏感词扫描、AI 自动化巡检日报', 'Database', 'blue', '/db', 1),
        ('SERVER_MANAGER', 'IT 资产系统', '全网 CMDB、服务器生命周期追踪、多云主机纳管与审计', 'Server', 'indigo', '/server', 2),
        ('NETWORK_MANAGER', '流量监控中心', '全链路拓扑发现、实时流量分析、边界防火墙规则审计', 'Globe', 'emerald', '/network', 3),
        ('SECURITY_AUDIT', '安全合规平台', '基线合规性检查、系统漏洞定期扫描、零信任准入管理', 'Shield', 'amber', '/security', 4)
      `);

      await pool.query(`
        INSERT INTO announcements (title, content, app_context, priority) VALUES 
        ('元数据库初始化成功', '天工平台核心元数据存储已成功挂载，所有子应用已就绪。', '门户', 'medium'),
        ('紧急安全补丁通知', '请所有 DBA 在本周五前完成生产库的 SSL 证书更新。', '数据库管理平台', 'high')
      `);
    }

    console.log('[DB] -----------------------------------------------');
    console.log('[DB] 天工运维平台元数据库初始化完成，表结构已同步。');
    console.log('[DB] -----------------------------------------------');
  } catch (err) {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('[DB] 关键错误: 数据库初始化失败！');
    console.error(`[DB] 错误原因: ${err.message}`);
    console.error('[DB] 请检查: 1.MySQL服务是否启动 2.账号密码是否正确 3.IP是否可达');
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    pool = null;
  }
}

const checkDbReady = (req, res, next) => {
  if (!pool) return res.status(503).json({ success: false, error: '元数据库服务初始化失败或未连接，请检查后台日志' });
  next();
};

// --- API 路由 ---

app.post('/api/login', checkDbReady, async (req, res) => {
  const { username, password } = req.body;
  try {
    const [users] = await pool.query(
      'SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.username = ? AND u.password = ?', 
      [username, password]
    );
    if (users.length > 0) {
      const user = users[0];
      delete user.password;
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, error: '账号或密码不正确' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/portal/data', checkDbReady, async (req, res) => {
  try {
    const [apps] = await pool.query('SELECT * FROM sub_apps WHERE is_active = TRUE ORDER BY sort_order ASC');
    const [announcements] = await pool.query('SELECT * FROM announcements ORDER BY publish_date DESC LIMIT 5');
    res.json({ success: true, apps, announcements });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/sources', checkDbReady, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM data_sources');
    res.json(rows.map(r => ({
      id: r.id, name: r.name, type: r.type, host: r.host, port: r.port, 
      database: r.database_name, username: r.username, status: r.status, lastScanned: r.last_scanned
    })));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sources', checkDbReady, async (req, res) => {
  const s = req.body;
  try {
    await pool.query(
      `INSERT INTO data_sources (id, name, type, host, port, database_name, username, password, status, last_scanned) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE 
       name=VALUES(name), type=VALUES(type), host=VALUES(host), port=VALUES(port), 
       database_name=VALUES(database_name), username=VALUES(username), password=VALUES(password)`,
      [s.id, s.name, s.type, s.host, s.port, s.database, s.username, s.password || '', s.status || 'online', s.lastScanned || '']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sources/test', async (req, res) => {
  const { type, host, port, username, password, database } = req.body;
  if (type !== 'mysql') return res.status(400).json({ success: false, error: '仅支持 MySQL 拨测' });
  try {
    const conn = await mysql.createConnection({ host, port, user: username, password, database, connectTimeout: 3000 });
    await conn.query('SELECT 1');
    await conn.end();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, async () => {
  console.log(`[SYS] 服务已启动，监听端口: ${PORT}`);
  await initDB();
});
