export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  dataUrl?: string; // Base64 encoded file content
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

export type JobStatus = 'Estimate Scheduled' | 'Quote Sent' | 'Scheduled' | 'In Progress' | 'Awaiting Parts' | 'Completed' | 'Paid' | 'Declined';

export const jobStatusColors: Record<JobStatus, { base: string, text: string }> = {
  'Estimate Scheduled': { base: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-200' },
  'Quote Sent': { base: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-800 dark:text-orange-200' },
  'Scheduled': { base: 'bg-sky-100 dark:bg-sky-900', text: 'text-sky-800 dark:text-sky-200' },
  'In Progress': { base: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200' },
  'Awaiting Parts': { base: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-800 dark:text-purple-200' },
  'Completed': { base: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200' },
  'Paid': { base: 'bg-indigo-100 dark:bg-indigo-900', text: 'text-indigo-800 dark:text-indigo-200' },
  'Declined': { base: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200' },
};

export interface Part {
  id: string;
  name: string;
  quantity: number;
  cost: number;
}

export interface JobTicket {
  id: string;
  date: string; // ISO string format e.g., "2023-10-27"
  status: JobStatus;
  notes: string;
  // FIX: Removed stray '6' that was causing a syntax error in the interface definition.
  parts: Part[];
  laborCost: number;
  salesTaxRate?: number;
  processingFeeRate?: number;
}

export interface JobTemplate {
  id: string;
  name: string;
  notes: string;
  parts: Part[];
  laborCost: number;
  salesTaxRate?: number;
  processingFeeRate?: number;
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
