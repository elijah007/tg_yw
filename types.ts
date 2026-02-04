
export enum AppType {
  PORTAL = 'PORTAL',
  DATABASE_MANAGER = 'DATABASE_MANAGER',
  SERVER_MANAGER = 'SERVER_MANAGER',
  NETWORK_MANAGER = 'NETWORK_MANAGER',
  SECURITY_AUDIT = 'SECURITY_AUDIT'
}

export type DatabaseType = 'mysql' | 'postgresql' | 'mongodb';

export interface DataSource {
  id: string;
  name: string;
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
  status: 'online' | 'offline' | 'error';
  lastScanned?: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  app_context: string;
  publish_date: string;
  priority: 'low' | 'medium' | 'high';
}

export interface SubApp {
  id: string;
  name: string;
  description: string;
  icon_type: string;
  color_theme: string;
  route_path: string;
  is_active: boolean;
}

export interface ScanResult {
  id: string;
  instanceId: string;
  database: string;
  table: string;
  column: string;
  ruleName: string;
  riskLevel: 'high' | 'medium' | 'low';
  timestamp: string;
}

export interface InspectionRecord {
  id: string;
  timestamp: string;
  type: 'backup' | 'replication' | 'ha' | 'vip';
  status: 'success' | 'warning' | 'error';
  details: string;
  instanceId: string;
}

// Added missing SensitiveRule interface to fix compilation errors
export interface SensitiveRule {
  id: string;
  name: string;
  pattern: string;
  description: string;
  isActive: boolean;
}