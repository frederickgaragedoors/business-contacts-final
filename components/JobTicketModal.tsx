import React, { useState, useEffect, useMemo } from 'react';
import { JobTicket, JobStatus, Part } from '../types.ts';
import { XIcon, PlusIcon, TrashIcon } from './icons.tsx';
import { generateId, calculateJobTicketTotal } from '../utils.ts';

interface JobTicketModalProps {
  entry?: JobTicket | null;
  onSave: (entry: Omit<JobTicket, 'id'> & { id?: string }) => void;
  onClose: () => void;
}

const jobStatuses: JobStatus[] = ['Scheduled', 'In Progress', 'Awaiting Parts', 'Completed', 'Invoiced'];

const JobTicketModal: React.FC<JobTicketModalProps> = ({ entry, onSave, onClose }) => {
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<JobStatus>('Scheduled');
  const [notes, setNotes] = useState('');
  const [parts, setParts] = useState<Part[]>([]);
  const [laborCost, setLaborCost] = useState<number | ''>(0);
  const [salesTaxRate, setSalesTaxRate] = useState<number | ''>(0);
  const [processingFeeRate, setProcessingFeeRate] = useState<number | ''>(0);

  useEffect(() => {
    if (entry) {
      setDate(entry.date);
      setStatus(entry.status);
      setNotes(entry.notes);
      setParts(entry.parts.map(p => ({...p}))); // Create a copy to avoid direct mutation
      setLaborCost(entry.laborCost);
      setSalesTaxRate(entry.salesTaxRate || 0);
      setProcessingFeeRate(entry.processingFeeRate || 0);
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setStatus('Scheduled');
      setNotes('');
      setParts([]);
      setLaborCost(0);
      setSalesTaxRate(0);
      setProcessingFeeRate(0);
    }
  }, [entry]);

  const handleAddPart = () => {
    setParts([...parts, { id: generateId(), name: '', cost: 0 }]);
  };

  const handlePartChange = (id: string, field: 'name' | 'cost', value: string | number) => {
    const isCost = field === 'cost';
    const parsedValue = isCost ? parseFloat(value as string) || 0 : value;
    setParts(parts.map(p => p.id === id ? { ...p, [field]: parsedValue } : p));
  };

  const handleRemovePart = (id: string) => {
    setParts(parts.filter(p => p.id !== id));
  };

  const currentTicketState = useMemo((): JobTicket => ({
      id: entry?.id || '',
      date,
      status,
      notes,
      parts,
      laborCost: Number(laborCost || 0),
      salesTaxRate: Number(salesTaxRate || 0),
      processingFeeRate: Number(processingFeeRate || 0),
  }), [entry, date, status, notes, parts, laborCost, salesTaxRate, processingFeeRate]);

  const { subtotal, taxAmount, feeAmount, totalCost: finalTotal } = calculateJobTicketTotal(currentTicketState);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (notes.trim() && date) {
      onSave(currentTicketState);
    }
  };

  const inputStyles = "block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm";
  const labelStyles = "block text-sm font-medium text-slate-600 dark:text-slate-300";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow min-h-0">
          <div className="p-6 border-b dark:border-slate-700 flex-shrink-0">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{entry ? 'Edit Job Ticket' : 'Add Job Ticket'}</h2>
              <button type="button" onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto flex-grow min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="job-date" className={labelStyles}>Date</label>
                    <input
                    type="date"
                    id="job-date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    className={`mt-1 ${inputStyles}`}
                    />
                </div>
                <div>
                    <label htmlFor="job-status" className={labelStyles}>Status</label>
                    <select
                    id="job-status"
                    value={status}
                    onChange={e => setStatus(e.target.value as JobStatus)}
                    className={`mt-1 ${inputStyles}`}
                    >
                    {jobStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
            
            <div>
              <label htmlFor="job-notes" className={labelStyles}>Notes</label>
              <textarea
                id="job-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                required
                rows={4}
                className={`mt-1 ${inputStyles}`}
                placeholder="Describe the job details..."
              ></textarea>
            </div>
            
            <div>
                <h3 className="text-md font-medium text-slate-700 dark:text-slate-200">Costs</h3>
                <div className="mt-2 p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
                    <div>
                        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Parts Used</h4>
                        {parts.length > 0 && (
                            <div className="space-y-2">
                                {parts.map((part, index) => (
                                    <div key={part.id} className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            placeholder={`Part ${index + 1} Name`}
                                            value={part.name}
                                            onChange={(e) => handlePartChange(part.id, 'name', e.target.value)}
                                            className={inputStyles}
                                        />
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                <span className="text-slate-500 sm:text-sm">$</span>
                                            </div>
                                            <input
                                                type="number"
                                                placeholder="Cost"
                                                value={part.cost}
                                                onChange={(e) => handlePartChange(part.id, 'cost', e.target.value)}
                                                className={`${inputStyles} pl-7 pr-2`}
                                            />
                                        </div>
                                        <button type="button" onClick={() => handleRemovePart(part.id)} className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                         <button type="button" onClick={handleAddPart} className="mt-2 flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/50 hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors">
                            <PlusIcon className="w-4 h-4 mr-2" /> Add Part
                        </button>
                    </div>

                    <div className="!mt-4">
                        <label htmlFor="labor-cost" className={labelStyles}>Labor Cost</label>
                        <div className="relative mt-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-slate-500 sm:text-sm">$</span>
                            </div>
                            <input
                                type="number"
                                id="labor-cost"
                                value={laborCost}
                                onChange={(e) => setLaborCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                className={`${inputStyles} pl-7`}
                            />
                        </div>
                    </div>
                    
                    <div className="!mt-4 grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="sales-tax-rate" className={labelStyles}>Sales Tax (%)</label>
                            <div className="relative mt-1">
                                <input
                                    type="number"
                                    id="sales-tax-rate"
                                    value={salesTaxRate}
                                    onChange={(e) => setSalesTaxRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    className={`${inputStyles} pr-2`}
                                    step="0.01"
                                    placeholder="e.g. 8.5"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="processing-fee-rate" className={labelStyles}>Processing Fee (%)</label>
                            <div className="relative mt-1">
                                <input
                                    type="number"
                                    id="processing-fee-rate"
                                    value={processingFeeRate}
                                    onChange={(e) => setProcessingFeeRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    className={`${inputStyles} pr-2`}
                                    step="0.01"
                                    placeholder="e.g. 2.9"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 flex justify-between items-center rounded-b-lg border-t dark:border-slate-700 flex-shrink-0">
             <div className="text-sm dark:text-slate-300">
                <p>Subtotal: <span className="font-medium">${subtotal.toFixed(2)}</span></p>
                <p>Tax ({Number(salesTaxRate || 0)}%): <span className="font-medium">${taxAmount.toFixed(2)}</span></p>
                <p>Fee ({Number(processingFeeRate || 0)}%): <span className="font-medium">${feeAmount.toFixed(2)}</span></p>
                <p className="font-bold text-lg text-slate-800 dark:text-slate-100 mt-1">Total: <span className="font-bold text-xl">${finalTotal.toFixed(2)}</span></p>
            </div>
            <div className="flex space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors">
                Save Ticket
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobTicketModal;
