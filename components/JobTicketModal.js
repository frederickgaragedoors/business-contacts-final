import React, { useState, useEffect, useMemo } from 'react';
import { XIcon, PlusIcon, TrashIcon } from './icons.js';
import { generateId, calculateJobTicketTotal } from '../utils.js';

const jobStatuses = ['Estimate Scheduled', 'Quote Sent', 'Scheduled', 'In Progress', 'Awaiting Parts', 'Completed', 'Paid', 'Declined'];

const JobTicketModal = ({ entry, onSave, onClose }) => {
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('Estimate Scheduled');
  const [notes, setNotes] = useState('');
  const [parts, setParts] = useState([]);
  const [laborCost, setLaborCost] = useState('');
  const [salesTaxRate, setSalesTaxRate] = useState('');
  const [processingFeeRate, setProcessingFeeRate] = useState('');


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
      setStatus('Estimate Scheduled');
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

  const handlePartChange = (id, field, value) => {
    const isCost = field === 'cost';
    const parsedValue = isCost ? parseFloat(value) || 0 : value;
    setParts(parts.map(p => p.id === id ? { ...p, [field]: parsedValue } : p));
  };

  const handleRemovePart = (id) => {
    setParts(parts.filter(p => p.id !== id));
  };
  
  const currentTicketState = useMemo(() => ({
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


  const handleSubmit = (e) => {
    e.preventDefault();
    if (notes.trim() && date) {
      onSave(currentTicketState);
    }
  };
  
  const inputStyles = "block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm";
  const labelStyles = "block text-sm font-medium text-slate-600 dark:text-slate-300";


  return (
    React.createElement("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", role: "dialog", "aria-modal": "true" },
      React.createElement("div", { className: "bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" },
        React.createElement("form", { onSubmit: handleSubmit, className: "flex flex-col flex-grow min-h-0" },
          React.createElement("div", { className: "p-6 border-b dark:border-slate-700 flex-shrink-0" },
            React.createElement("div", { className: "flex justify-between items-center" },
              React.createElement("h2", { className: "text-xl font-bold text-slate-800 dark:text-slate-100" }, entry ? 'Edit Job Ticket' : 'Add Job Ticket'),
              React.createElement("button", { type: "button", onClick: onClose, className: "p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700" },
                React.createElement(XIcon, { className: "w-5 h-5" })
              )
            )
          ),

          React.createElement("div", { className: "p-6 space-y-4 overflow-y-auto flex-grow min-h-0" },
            React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                React.createElement("div", null,
                    React.createElement("label", { htmlFor: "job-date", className: labelStyles }, "Date"),
                    React.createElement("input", {
                      type: "date",
                      id: "job-date",
                      value: date,
                      onChange: e => setDate(e.target.value),
                      required: true,
                      className: `mt-1 ${inputStyles}`
                    })
                ),
                React.createElement("div", null,
                    React.createElement("label", { htmlFor: "job-status", className: labelStyles }, "Status"),
                    React.createElement("select", {
                      id: "job-status",
                      value: status,
                      onChange: e => setStatus(e.target.value),
                      className: `mt-1 ${inputStyles}`
                    },
                      jobStatuses.map(s => React.createElement("option", { key: s, value: s }, s))
                    )
                )
            ),
            
            React.createElement("div", null,
              React.createElement("label", { htmlFor: "job-notes", className: labelStyles }, "Notes"),
              React.createElement("textarea", {
                id: "job-notes",
                value: notes,
                onChange: e => setNotes(e.target.value),
                required: true,
                rows: 4,
                className: `mt-1 ${inputStyles}`,
                placeholder: "Describe the job details..."
              })
            ),
            
            status !== 'Estimate Scheduled' && React.createElement("div", null,
                React.createElement("h3", { className: "text-md font-medium text-slate-700 dark:text-slate-200" }, "Costs"),
                React.createElement("div", { className: "mt-2 p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3" },
                    React.createElement("div", null,
                        React.createElement("h4", { className: "text-sm font-medium text-slate-600 dark:text-slate-300 mb-2" }, "Parts Used"),
                        parts.length > 0 && (
                            React.createElement("div", { className: "space-y-2" },
                                parts.map((part, index) => (
                                    React.createElement("div", { key: part.id, className: "flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0" },
                                        React.createElement("input", {
                                            type: "text",
                                            placeholder: `Part ${index + 1} Name`,
                                            value: part.name,
                                            onChange: (e) => handlePartChange(part.id, 'name', e.target.value),
                                            className: `${inputStyles} sm:flex-grow`
                                        }),
                                        React.createElement("div", { className: "relative" },
                                            React.createElement("div", { className: "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3" },
                                                React.createElement("span", { className: "text-slate-500 sm:text-sm" }, "$")
                                            ),
                                            React.createElement("input", {
                                                type: "number",
                                                placeholder: "Cost",
                                                value: part.cost,
                                                onChange: (e) => handlePartChange(part.id, 'cost', e.target.value),
                                                className: `${inputStyles} pl-7 pr-2 w-full sm:w-40`
                                            })
                                        ),
                                        React.createElement("button", { type: "button", onClick: () => handleRemovePart(part.id), className: "p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full self-end sm:self-center" },
                                            React.createElement(TrashIcon, { className: "w-4 h-4" })
                                        )
                                    )
                                ))
                            )
                        ),
                         React.createElement("button", { type: "button", onClick: handleAddPart, className: "mt-2 flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/50 hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors" },
                            React.createElement(PlusIcon, { className: "w-4 h-4 mr-2" }), " Add Part"
                        )
                    ),

                    React.createElement("div", { className: "!mt-4" },
                        React.createElement("label", { htmlFor: "labor-cost", className: labelStyles }, "Labor Cost"),
                        React.createElement("div", { className: "relative mt-1" },
                            React.createElement("div", { className: "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3" },
                                React.createElement("span", { className: "text-slate-500 sm:text-sm" }, "$")
                            ),
                            React.createElement("input", {
                                type: "number",
                                id: "labor-cost",
                                value: laborCost,
                                onChange: (e) => setLaborCost(e.target.value === '' ? '' : parseFloat(e.target.value)),
                                className: `${inputStyles} pl-7`
                            })
                        )
                    ),
                    
                    React.createElement("div", { className: "!mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4" },
                        React.createElement("div", null,
                            React.createElement("label", { htmlFor: "sales-tax-rate", className: labelStyles }, "Sales Tax (%)"),
                            React.createElement("div", { className: "relative mt-1" },
                                React.createElement("input", {
                                    type: "number",
                                    id: "sales-tax-rate",
                                    value: salesTaxRate,
                                    onChange: (e) => setSalesTaxRate(e.target.value === '' ? '' : parseFloat(e.target.value)),
                                    className: `${inputStyles} pr-2`,
                                    step: "0.01",
                                    placeholder: "e.g. 8.5"
                                })
                            )
                        ),
                        React.createElement("div", null,
                            React.createElement("label", { htmlFor: "processing-fee-rate", className: labelStyles }, "Card Processing Fee (%)"),
                            React.createElement("div", { className: "relative mt-1" },
                                React.createElement("input", {
                                    type: "number",
                                    id: "processing-fee-rate",
                                    value: processingFeeRate,
                                    onChange: (e) => setProcessingFeeRate(e.target.value === '' ? '' : parseFloat(e.target.value)),
                                    className: `${inputStyles} pr-2`,
                                    step: "0.01",
                                    placeholder: "e.g. 2.9"
                                })
                            )
                        )
                    )
                )
            )
          ),
          
          React.createElement("div", { className: "bg-slate-50 dark:bg-slate-900 px-6 py-4 flex justify-between items-center rounded-b-lg border-t dark:border-slate-700 flex-shrink-0" },
            status !== 'Estimate Scheduled' ? React.createElement("div", { className: "text-sm dark:text-slate-300" },
                React.createElement("p", null, "Subtotal: ", React.createElement("span", { className: "font-medium" }, `$${subtotal.toFixed(2)}`)),
                React.createElement("p", null, `Tax (${Number(salesTaxRate || 0)}%): `, React.createElement("span", { className: "font-medium" }, `$${taxAmount.toFixed(2)}`)),
                React.createElement("p", null, `Card Fee (${Number(processingFeeRate || 0)}%): `, React.createElement("span", { className: "font-medium" }, `$${feeAmount.toFixed(2)}`)),
                React.createElement("p", { className: "font-bold text-lg text-slate-800 dark:text-slate-100 mt-1" }, "Total: ", React.createElement("span", { className: "font-bold text-xl" }, `$${finalTotal.toFixed(2)}`))
            ) : React.createElement("div", null),
            React.createElement("div", { className: "flex space-x-2" },
                React.createElement("button", { type: "button", onClick: onClose, className: "px-4 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" },
                "Cancel"
                ),
                React.createElement("button", { type: "submit", className: "px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors" },
                "Save Ticket"
                )
            )
          )
        )
      )
    )
  );
};

export default JobTicketModal;
