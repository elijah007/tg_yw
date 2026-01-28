
export enum AppType {
  PORTAL = 'PORTAL',
  DATABASE_MANAGER = 'DATABASE_MANAGER',
  SERVER_MANAGER = 'SERVER_MANAGER',
  NETWORK_MANAGER = 'NETWORK_MANAGER'
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

export interface SensitiveRule {
  id: string;
  name: string;
  pattern: string;
  description: string;
  isActive: boolean;
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

export interface Announcement {
  id: string;
  title: string;
  content: string;
  app: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
}
