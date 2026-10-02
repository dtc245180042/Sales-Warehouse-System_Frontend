export type LogAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'LOCK' | 'UNLOCK' | 'EXPORT' | 'IMPORT';
export type LogModule = 'AUTH' | 'USER_MANAGEMENT' | 'INVENTORY' | 'SALES' | 'SETTINGS' | 'CATALOG';

export interface LogChange {
  field: string;
  fieldLabel: string;
  oldValue: any;
  newValue: any;
}

export interface SystemLog {
  id: string;
  action: LogAction;
  module: LogModule;
  description: string;
  executorName: string;
  executorRole: string;
  executorId: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: LogChange[];
}
