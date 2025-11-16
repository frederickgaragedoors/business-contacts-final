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

export type JobStatus = 'Scheduled' | 'In Progress' | 'Awaiting Parts' | 'Completed' | 'Invoiced';

export const jobStatusColors: Record<JobStatus, { base: string, text: string }> = {
  Scheduled: { base: 'bg-sky-100', text: 'text-sky-800' },
  'In Progress': { base: 'bg-yellow-100', text: 'text-yellow-800' },
  'Awaiting Parts': { base: 'bg-purple-100', text: 'text-purple-800' },
  Completed: { base: 'bg-green-100', text: 'text-green-800' },
  Invoiced: { base: 'bg-slate-200', text: 'text-slate-700' },
};

export interface Part {
  id: string;
  name: string;
  cost: number;
}

export interface JobTicket {
  id: string;
  date: string; // ISO string format e.g., "2023-10-27"
  status: JobStatus;
  notes: string;
  parts: Part[];
  laborCost: number;
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
  jobTickets: JobTicket[];
}

export interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string; // Base64 data URL
}

export type ViewState = 
  | { type: 'list' }
  | { type: 'detail'; id: string }
  | { type: 'new_form' }
  | { type: 'edit_form'; id: string }
  | { type: 'settings' }
  | { type: 'dashboard' }
  | { type: 'invoice'; contactId: string; ticketId: string };
