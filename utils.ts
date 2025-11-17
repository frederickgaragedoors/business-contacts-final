import { JobTicket } from './types.ts';

/**
 * Generates a cryptographically secure unique ID.
 */
export const generateId = (): string => {
  return crypto.randomUUID();
};

/**
 * Converts a File object to a Base64 encoded data URL.
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Formats a file size in bytes into a human-readable string (KB, MB, etc.).
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Extracts the initials from a full name.
 */
export const getInitials = (name: string): string => {
    const names = name.trim().split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0] ? names[0][0].toUpperCase() : '';
};

/**
 * Calculates the subtotal, tax, fees, and final total for a job ticket.
 * @param ticket The JobTicket object.
 * @returns An object with the detailed cost breakdown.
 */
export const calculateJobTicketTotal = (ticket: JobTicket | null) => {
    if (!ticket) {
        return { subtotal: 0, taxAmount: 0, feeAmount: 0, totalCost: 0 };
    }
    const partsTotal = ticket.parts.reduce((sum, part) => sum + Number(part.cost || 0), 0);
    const subtotal = partsTotal + Number(ticket.laborCost || 0);
    const taxAmount = subtotal * (Number(ticket.salesTaxRate || 0) / 100);
    const totalAfterTaxes = subtotal + taxAmount;
    const feeAmount = totalAfterTaxes * (Number(ticket.processingFeeRate || 0) / 100);
    const totalCost = totalAfterTaxes + feeAmount;
    
    return {
        subtotal,
        taxAmount,
        feeAmount,
        totalCost,
    };
};


/**
 * Triggers a browser download for a JSON file.
 * @param data The object to serialize into JSON.
 * @param filename The desired filename for the download.
 */
export const downloadJsonFile = (data: object, filename: string): void => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Saves a JSON file, allowing the user to choose the location if the browser supports it.
 * Falls back to a direct download otherwise.
 * @param data The object to serialize into JSON.
 * @param filename The desired filename for the download.
 */
export const saveJsonFile = async (data: object, filename: string): Promise<void> => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Use the File System Access API if available
    if ('showSaveFilePicker' in window) {
        try {
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: filename,
                types: [
                    {
                        description: 'JSON Files',
                        accept: { 'application/json': ['.json'] },
                    },
                ],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return; // Success
        } catch (err) {
            // AbortError is thrown when the user cancels the save dialog.
            if (err instanceof DOMException && err.name === 'AbortError') {
                console.log('User cancelled save dialog.');
                return;
            }
            console.error('Error using showSaveFilePicker, falling back:', err);
        }
    }

    // Fallback for browsers that don't support the API
    console.log('File System Access API not supported, falling back to direct download.');
    downloadJsonFile(data, filename);
};
