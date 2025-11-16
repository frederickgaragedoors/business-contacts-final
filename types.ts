export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  dataUrl: string; // Base64 encoded file content
  size: number;
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export interface DefaultFieldSetting {
  id: string;
  label: string;
}

export interface WorkLogEntry {
  id: string;
  date: string; // ISO string format e.g., "2023-10-27"
  description: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  photoUrl: string; // Can be a URL or a Base64 data URL
  files: FileAttachment[];
  customFields: CustomField[];
  workLogs: WorkLogEntry[];
}

export type ViewState = 
  | { type: 'list' }
  | { type: 'detail'; id: string }
  | { type: 'new_form' }
  | { type: 'edit_form'; id: string }
  | { type: 'settings' };