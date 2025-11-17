import React, { useState, useEffect } from 'react';
import { XIcon, PlusIcon, TrashIcon } from './icons.js';
import { generateId } from '../utils.js';


const JobTemplateModal = ({ template, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [parts, setParts] = useState([]);
  const [laborCost, setLaborCost] = useState('');
  const [salesTaxRate, setSalesTaxRate] = useState('');
  const [processingFeeRate, setProcessingFeeRate] = useState('');

  useEffect(() => {
    if (template) {
      setName(template.name);
      setNotes(template.notes);
      setParts(template.parts.map(p => ({...p})));
      setLaborCost(template.laborCost);
      setSalesTaxRate(template.salesTaxRate || 0);
      setProcessingFeeRate(template.processingFeeRate || 0);
    }
  }, [template]);

  const handleAddPart = () => {
    setParts([...parts, { id: generateId(), name: '', cost: 0, quantity: 1 }]);
  };

  const handlePartChange = (id, field, value) => {
    const isNumeric = field === 'cost' || field === 'quantity';
    const parsedValue = isNumeric
        ? (field === 'quantity' ? Math.max(1, parseInt(value, 10) || 1) : parseFloat(value) || 0)
        : value;
    setParts(parts.map(p => p.id === id ? { ...p, [field]: parsedValue } : p));
  };

  const handleRemovePart = (id) => {
    setParts(parts.filter(p => p.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSave({
        id: template?.id,
        name,
        notes,
        parts,
        laborCost: Number(laborCost || 0),
        salesTaxRate: Number(salesTaxRate || 0),
        processingFeeRate: Number(processingFeeRate || 0),
      });
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
              React.createElement("h2", { className: "text-xl font-bold text-slate-800 dark:text-slate-100" }, template ? 'Edit Template' : 'Create Template'),
              React.createElement("button", { type: "button", onClick: onClose, className: "p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700" },
                React.createElement(XIcon, { className: "w-5 h-5" })
              )
            )
          ),

          React.createElement("div", { className: "p-6 space-y-4 overflow-y-auto flex-grow min-h-0" },
            React.createElement("div", null,
              React.createElement("label", { htmlFor: "template-name", className: labelStyles }, "Template Name"),
              React.createElement("input", { type: "text", id: "template-name", value: name, onChange: e => setName(e.target.value), required: true, className: `mt-1 ${inputStyles}`, placeholder: "e.g., Standard Spring Replacement" })
            ),
            
            React.createElement("div", null,
              React.createElement("label", { htmlFor: "template-notes", className: labelStyles }, "Notes"),
              React.createElement("textarea", { id: "template-notes", value: notes, onChange: e => setNotes(e.target.value), rows: 3, className: `mt-1 ${inputStyles}`, placeholder: "Default notes for this job..." })
            ),
            
            React.createElement("div", null,
                React.createElement("h3", { className: "text-md font-medium text-slate-700 dark:text-slate-200" }, "Default Costs"),
                React.createElement("div", { className: "mt-2 p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3" },
                    React.createElement("div", null,
                        React.createElement("h4", { className: "text-sm font-medium text-slate-600 dark:text-slate-300 mb-2" }, "Parts & Services"),
                        parts.map((part) => (
                            React.createElement("div", { key: part.id, className: "grid grid-cols-1 sm:grid-cols-[1fr_80px_120px_40px] gap-2 items-center mb-2" },
                                React.createElement("input", { type: "text", placeholder: "Part/Service Name", value: part.name, onChange: (e) => handlePartChange(part.id, 'name', e.target.value), className: inputStyles, "aria-label": "Part or Service" }),
                                React.createElement("input", { type: "number", placeholder: "1", value: part.quantity, onChange: (e) => handlePartChange(part.id, 'quantity', e.target.value), className: `${inputStyles} text-center`, min: "1", "aria-label": "Quantity" }),
                                React.createElement("div", { className: "relative" },
                                    React.createElement("div", { className: "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3" }, React.createElement("span", { className: "text-slate-500 sm:text-sm" }, "$")),
                                    React.createElement("input", { type: "number", placeholder: "0.00", value: part.cost, onChange: (e) => handlePartChange(part.id, 'cost', e.target.value), className: `${inputStyles} pl-7 pr-2`, "aria-label": "Price" })
                                ),
                                React.createElement("button", { type: "button", onClick: () => handleRemovePart(part.id), className: "p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full justify-self-end sm:justify-self-center" },
                                    React.createElement(TrashIcon, { className: "w-4 h-4" })
                                )
                            )
                        )),
                        React.createElement("button", { type: "button", onClick: handleAddPart, className: "mt-2 flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/50 hover:bg-sky-100 dark:hover:bg-sky-900" },
                            React.createElement(PlusIcon, { className: "w-4 h-4 mr-2" }), " Add Part"
                        )
                    ),
                    React.createElement("div", null,
                        React.createElement("label", { htmlFor: "labor-cost", className: labelStyles }, "Labor Cost"),
                        React.createElement("div", { className: "relative mt-1" },
                            React.createElement("div", { className: "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3" }, React.createElement("span", { className: "text-slate-500 sm:text-sm" }, "$")),
                            React.createElement("input", { type: "number", id: "labor-cost", value: laborCost, onChange: (e) => setLaborCost(e.target.value === '' ? '' : parseFloat(e.target.value)), className: `${inputStyles} pl-7` })
                        )
                    ),
                    React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4" },
                        React.createElement("div", null,
                            React.createElement("label", { htmlFor: "sales-tax-rate", className: labelStyles }, "Sales Tax (%)"),
                            React.createElement("input", { type: "number", id: "sales-tax-rate", value: salesTaxRate, onChange: (e) => setSalesTaxRate(e.target.value === '' ? '' : parseFloat(e.target.value)), className: `mt-1 ${inputStyles}`, step: "0.01", placeholder: "e.g. 8.5" })
                        ),
                        React.createElement("div", null,
                            React.createElement("label", { htmlFor: "processing-fee-rate", className: labelStyles }, "Card Fee (%)"),
                            React.createElement("input", { type: "number", id: "processing-fee-rate", value: processingFeeRate, onChange: (e) => setProcessingFeeRate(e.target.value === '' ? '' : parseFloat(e.target.value)), className: `mt-1 ${inputStyles}`, step: "0.01", placeholder: "e.g. 2.9" })
                        )
                    )
                )
            )
          ),
          
          React.createElement("div", { className: "bg-slate-50 dark:bg-slate-900 px-6 py-4 flex justify-end items-center rounded-b-lg border-t dark:border-slate-700 flex-shrink-0" },
            React.createElement("div", { className: "flex space-x-2" },
                React.createElement("button", { type: "button", onClick: onClose, className: "px-4 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" }, "Cancel"),
                React.createElement("button", { type: "submit", className: "px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors" }, "Save Template")
            )
          )
        )
      )
    )
  );
};

export default JobTemplateModal;
