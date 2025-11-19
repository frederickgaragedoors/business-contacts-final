

import React, { useState, useEffect, useMemo } from 'react';
import { JobTicket, JobStatus, Part, JobTemplate, ALL_JOB_STATUSES, CatalogItem } from '../types.ts';
import { XIcon, PlusIcon, TrashIcon } from './icons.tsx';
import { generateId, calculateJobTicketTotal } from '../utils.ts';

interface JobTicketModalProps {
  entry?: JobTicket | null;
  onSave: (entry: Omit<JobTicket, 'id'> & { id?: string }) => void;
  onClose: () => void;
  jobTemplates?: JobTemplate[];
  partsCatalog?: CatalogItem[];
  enabledStatuses?: Record<JobStatus, boolean>;
}

const JobTicketModal: React.FC<JobTicketModalProps> = ({ entry, onSave, onClose, jobTemplates, partsCatalog, enabledStatuses }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [status, setStatus] = useState<JobStatus>('Estimate Scheduled');
  const [notes, setNotes] = useState('');
  const [parts, setParts] = useState<Part[]>([]);
  const [laborCost, setLaborCost] = useState<number | ''>(0);
  const [salesTaxRate, setSalesTaxRate] = useState<number | ''>(0);
  const [processingFeeRate, setProcessingFeeRate] = useState<number | ''>(0);
  const [deposit, setDeposit] = useState<number | ''>(0);

  useEffect(() => {
    if (entry) {
      setDate(entry.date);
      setTime(entry.time || '');
      setStatus(entry.status);
      setNotes(entry.notes);
      setParts(entry.parts.map(p => ({...p}))); // Create a copy to avoid direct mutation
      setLaborCost(entry.laborCost);
      setSalesTaxRate(entry.salesTaxRate || 0);
      setProcessingFeeRate(entry.processingFeeRate || 0);
      setDeposit(entry.deposit || 0);
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setTime('');
      setStatus('Estimate Scheduled');
      setNotes('');
      setParts([]);
      setLaborCost(0);
      setSalesTaxRate(0);
      setProcessingFeeRate(0);
      setDeposit(0);
    }
  }, [entry]);

  const handleAddPart = () => {
    setParts([...parts, { id: generateId(), name: '', cost: 0, quantity: 1 }]);
  };

  const handlePartChange = (id: string, field: 'name' | 'cost' | 'quantity', value: string | number) => {
    const isNumeric = field === 'cost' || field === 'quantity';
    const parsedValue = isNumeric
        ? (field === 'quantity' ? Math.max(1, parseInt(value as string, 10) || 1) : parseFloat(value as string) || 0)
        : value;
    setParts(parts.map(p => p.id === id ? { ...p, [field]: parsedValue } : p));
  };

  const handleRemovePart = (id: string) => {
    setParts(parts.filter(p => p.id !== id));
  };
  
  const handleTemplateSelect = (templateId: string) => {
    if (!templateId) return;
    const selectedTemplate = jobTemplates?.find(t => t.id === templateId);
    if (selectedTemplate) {
        setNotes(selectedTemplate.notes);
        setParts(selectedTemplate.parts.map(p => ({...p, id: generateId()})));
        setLaborCost(selectedTemplate.laborCost);
        setSalesTaxRate(selectedTemplate.salesTaxRate || 0);
        setProcessingFeeRate(selectedTemplate.processingFeeRate || 0);
    }
  };
  
  const handleQuickAddPart = (catalogItemId: string) => {
      const item = partsCatalog?.find(i => i.id === catalogItemId);
      if (item) {
          setParts([...parts, { id: generateId(), name: item.name, cost: item.defaultCost, quantity: 1 }]);
      }
  };

  const currentTicketState = useMemo((): JobTicket => ({
      id: entry?.id || '',
      date,
      time,
      status,
      notes,
      parts,
      laborCost: Number(laborCost || 0),
      salesTaxRate: Number(salesTaxRate || 0),
      processingFeeRate: Number(processingFeeRate || 0),
      deposit: Number(deposit || 0),
      createdAt: entry?.createdAt, // Preserve original creation date
  }), [entry, date, time, status, notes, parts, laborCost, salesTaxRate, processingFeeRate, deposit]);

  const { subtotal, taxAmount, feeAmount, totalCost: finalTotal, balanceDue } = calculateJobTicketTotal(currentTicketState);

  const calculate30PercentDeposit = () => {
      const thirtyPercent = finalTotal * 0.30;
      setDeposit(parseFloat(thirtyPercent.toFixed(2)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (notes.trim() || parts.length > 0) { // Allow saving if there are parts or notes
      onSave(currentTicketState);
    } else {
      alert("Please add some notes or parts to the job ticket before saving.");
    }
  };

  const visibleStatuses = useMemo(() => {
    return ALL_JOB_STATUSES.filter(s => 
        (enabledStatuses ? enabledStatuses[s] : true) || (entry && entry.status === s)
    );
  }, [enabledStatuses, entry]);

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
            {jobTemplates && jobTemplates.length > 0 && !entry && (
                <div>
                    <label htmlFor="job-template" className={labelStyles}>Apply Template</label>
                    <select
                        id="job-template"
                        onChange={e => handleTemplateSelect(e.target.value)}
                        className={`mt-1 ${inputStyles}`}
                        defaultValue=""
                    >
                        <option value="" disabled>Select a template...</option>
                        {jobTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
            )}
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
                    <label htmlFor="job-time" className={labelStyles}>Time <span className="text-xs text-slate-400 font-normal">(Optional)</span></label>
                    <input
                    type="time"
                    id="job-time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className={`mt-1 ${inputStyles}`}
                    />
                </div>
            </div>
            
            <div>
                <label htmlFor="job-status" className={labelStyles}>Status</label>
                <select
                id="job-status"
                value={status}
                onChange={e => setStatus(e.target.value as JobStatus)}
                className={`mt-1 ${inputStyles}`}
                >
                {visibleStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            
            <div>
              <label htmlFor="job-notes" className={labelStyles}>Notes</label>
              <textarea
                id="job-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={4}
                className={`mt-1 ${inputStyles}`}
                placeholder="Describe the job details..."
              ></textarea>
            </div>
            
            {status !== 'Estimate Scheduled' && (
              <div>
                  <h3 className="text-md font-medium text-slate-700 dark:text-slate-200">Costs & Payments</h3>
                  <div className="mt-2 p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
                      <div>
                          <div className="flex justify-between items-center mb-2">
                              <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300">Parts Used</h4>
                              {partsCatalog && partsCatalog.length > 0 && (
                                  <select
                                      onChange={(e) => { handleQuickAddPart(e.target.value); e.target.value = ""; }}
                                      className="text-xs border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                                      defaultValue=""
                                  >
                                      <option value="" disabled>+ Quick Add</option>
                                      {partsCatalog.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                  </select>
                              )}
                          </div>
                           {parts.length > 0 && (
                              <div className="hidden sm:grid sm:grid-cols-[1fr_80px_120px_40px] sm:gap-x-2 mb-1">
                                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Part or Service</label>
                                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center">Qty</label>
                                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Price</label>
                                  <span />
                              </div>
                          )}
                          <div className="space-y-4 sm:space-y-2">
                              {parts.map((part) => (
                                  <div key={part.id} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_120px_40px] sm:gap-x-2 sm:items-center">
                                      <div>
                                          <label htmlFor={`part-name-${part.id}`} className={`${labelStyles} sm:hidden`}>Part or Service</label>
                                          <input
                                              id={`part-name-${part.id}`}
                                              type="text"
                                              placeholder="e.g. Inspection Fee"
                                              value={part.name}
                                              onChange={(e) => handlePartChange(part.id, 'name', e.target.value)}
                                              className={`mt-1 sm:mt-0 ${inputStyles}`}
                                              aria-label="Part or Service"
                                          />
                                      </div>
                                      <div>
                                          <label htmlFor={`part-qty-${part.id}`} className={`${labelStyles} sm:hidden`}>Qty</label>
                                          <input
                                              id={`part-qty-${part.id}`}
                                              type="number"
                                              placeholder="1"
                                              value={part.quantity}
                                              onChange={(e) => handlePartChange(part.id, 'quantity', e.target.value)}
                                              className={`mt-1 sm:mt-0 ${inputStyles} text-center`}
                                              min="1"
                                              aria-label="Qty"
                                          />
                                      </div>
                                      <div>
                                          <label htmlFor={`part-price-${part.id}`} className={`${labelStyles} sm:hidden`}>Price</label>
                                          <div className="relative mt-1 sm:mt-0">
                                              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                  <span className="text-slate-500 sm:text-sm">$</span>
                                              </div>
                                              <input
                                                  id={`part-price-${part.id}`}
                                                  type="number"
                                                  placeholder="0.00"
                                                  value={part.cost}
                                                  onChange={(e) => handlePartChange(part.id, 'cost', e.target.value)}
                                                  className={`${inputStyles} pl-7 pr-2`}
                                                  aria-label="Price"
                                              />
                                          </div>
                                      </div>
                                      <div className="flex justify-end sm:justify-center">
                                          <button type="button" onClick={() => handleRemovePart(part.id)} className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                              <TrashIcon className="w-4 h-4" />
                                          </button>
                                      </div>
                                  </div>
                              ))}
                          </div>
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
                      
                      <div className="!mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                              <label htmlFor="processing-fee-rate" className={labelStyles}>Card Processing Fee (%)</label>
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

                      <div className="!mt-4">
                          <label htmlFor="deposit-amount" className={labelStyles}>Deposit / Payment</label>
                          <div className="flex space-x-2">
                              <div className="relative mt-1 flex-grow">
                                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                      <span className="text-slate-500 sm:text-sm">$</span>
                                  </div>
                                  <input
                                      type="number"
                                      id="deposit-amount"
                                      value={deposit}
                                      onChange={(e) => setDeposit(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                      className={`${inputStyles} pl-7`}
                                      placeholder="0.00"
                                  />
                              </div>
                              <button 
                                  type="button" 
                                  onClick={calculate30PercentDeposit}
                                  className="mt-1 px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 text-sm font-medium transition-colors"
                                  title="Calculate 30% Deposit"
                              >
                                  30%
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
            )}
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 flex justify-between items-center rounded-b-lg border-t dark:border-slate-700 flex-shrink-0">
            {status !== 'Estimate Scheduled' ? (
                <div className="text-sm dark:text-slate-300">
                    <p>Subtotal: <span className="font-medium">${subtotal.toFixed(2)}</span></p>
                    <p>Tax ({Number(salesTaxRate || 0)}%): <span className="font-medium">${taxAmount.toFixed(2)}</span></p>
                    <p>Card Fee ({Number(processingFeeRate || 0)}%): <span className="font-medium">${feeAmount.toFixed(2)}</span></p>
                    <p className="font-bold text-lg text-slate-800 dark:text-slate-100 mt-1">Total: <span className="font-bold text-xl">${finalTotal.toFixed(2)}</span></p>
                    {Number(deposit || 0) > 0 && (
                        <p className="text-green-600 dark:text-green-400 font-medium mt-1">Paid/Deposit: -${Number(deposit).toFixed(2)}</p>
                    )}
                     <p className="font-bold text-slate-800 dark:text-slate-100 mt-1">Balance: <span className="font-bold">${balanceDue.toFixed(2)}</span></p>
                </div>
            ) : (
                <div></div> // Placeholder to keep layout consistent
            )}
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