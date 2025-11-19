
export const jobStatusColors = {
  'Estimate Scheduled': { base: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-200' },
  'Quote Sent': { base: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-800 dark:text-orange-200' },
  'Scheduled': { base: 'bg-sky-100 dark:bg-sky-900', text: 'text-sky-800 dark:text-sky-200' },
  'In Progress': { base: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200' },
  'Awaiting Parts': { base: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-800 dark:text-purple-200' },
  'Completed': { base: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200' },
  'Paid': { base: 'bg-indigo-100 dark:bg-indigo-900', text: 'text-indigo-800 dark:text-indigo-200' },
  'Declined': { base: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200' },
};

export const ALL_JOB_STATUSES = Object.keys(jobStatusColors);

export const DEFAULT_EMAIL_SETTINGS = {
  estimate: {
    subject: 'Estimate from {{businessName}} - Job #{{jobId}}',
    body: 'Hi {{customerName}},\n\nPlease find attached the estimate for the requested work.\n\nIf you have any questions, please let us know.\n\nThanks,\n{{businessName}}'
  },
  receipt: {
    subject: 'Receipt from {{businessName}} - Job #{{jobId}}',
    body: 'Hi {{customerName}},\n\nThank you for your business. Please find attached the receipt for Job #{{jobId}}.\n\nThanks,\n{{businessName}}'
  }
};
