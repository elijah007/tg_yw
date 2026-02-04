
import React from 'react';
import { Database, Shield, Activity, Settings, LayoutDashboard, Search, Bell, Monitor, Server, Globe } from 'lucide-react';
import { AppType, DataSource, SensitiveRule, Announcement } from './types';

export const INITIAL_DATA_SOURCES: DataSource[] = [
  { id: '1', name: '生产库-核心-01', type: 'mysql', host: '192.168.1.100', port: 3306, database: 'order_db', username: 'admin', status: 'online', lastScanned: '2023-10-25 14:00' },
  { id: '2', name: '分析库-PG-02', type: 'postgresql', host: '192.168.1.101', port: 5432, database: 'analytics_db', username: 'repl', status: 'online', lastScanned: '2023-10-24 09:30' },
  { id: '3', name: '日志库-Mongo-01', type: 'mongodb', host: '192.168.1.102', port: 27017, database: 'logs', username: 'root', status: 'offline' },
];

export const INITIAL_RULES: SensitiveRule[] = [
  { id: 'r1', name: '手机号', pattern: 'phone|mobile|tel', description: '识别中国手机号字段', isActive: true },
  { id: 'r2', name: '身份证', pattern: 'id_card|identity', description: '识别身份证号码', isActive: true },
  { id: 'r3', name: '邮箱', pattern: 'email|mail', description: '电子邮箱地址', isActive: true },
  { id: 'r4', name: '银行卡', pattern: 'card_no|bank', description: '银行卡账户信息', isActive: true },
];

// Updated to match the Announcement interface (numeric IDs and correct property names)
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  { id: 1, title: '数据库管理平台升级公告', content: '本周五凌晨2:00-4:00进行系统维护，期间扫描功能可能受限。', app_context: '数据库管理平台', publish_date: '2024-05-20', priority: 'high' },
  { id: 2, title: '新子应用上线预告', content: '资产管理系统即将集成进入天工平台。', app_context: '门户', publish_date: '2024-05-18', priority: 'medium' },
];

export const APP_CONFIG = {
  [AppType.PORTAL]: { name: '天工综合运维管理平台', icon: <LayoutDashboard /> },
  [AppType.DATABASE_MANAGER]: { name: '数据库管理平台', icon: <Database /> },
  [AppType.SERVER_MANAGER]: { name: '服务器管理平台', icon: <Server /> },
  [AppType.NETWORK_MANAGER]: { name: '网络管理平台', icon: <Globe /> },
};