import React, { useState, useEffect } from 'react';
import { XIcon } from './icons.js';

const WorkLogModal = ({ entry, onSave, onClose }) => {
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (entry) {
      setDate(entry.date);
      setDescription(entry.description);
    } else {
      // Default to today's date for new entries
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
    }
  }, [entry]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (description.trim() && date) {
      onSave({
        id: entry?.id,
        date,
        description,
      });
    }
  };

  return (
    React.createElement("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", role: "dialog", "aria-modal": "true" },
      React.createElement("div", { className: "bg-white rounded-lg shadow-xl w-full max-w-md" },
        React.createElement("form", { onSubmit: handleSubmit },
          React.createElement("div", { className: "p-6" },
            React.createElement("div", { className: "flex justify-between items-center" },
              React.createElement("h2", { className: "text-xl font-bold text-slate-800" }, entry ? 'Edit Work Log' : 'Add Work Log'),
              React.createElement("button", { type: "button", onClick: onClose, className: "p-1 rounded-full text-slate-500 hover:bg-slate-200" },
                React.createElement(XIcon, { className: "w-5 h-5" })
              )
            ),
            React.createElement("div", { className: "mt-6 space-y-4" },
              React.createElement("div", null,
                React.createElement("label", { htmlFor: "work-date", className: "block text-sm font-medium text-slate-600" }, "Date"),
                React.createElement("input", {
                  type: "date",
                  id: "work-date",
                  value: date,
                  onChange: e => setDate(e.target.value),
                  required: true,
                  className: "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                })
              ),
              React.createElement("div", null,
                React.createElement("label", { htmlFor: "work-description", className: "block text-sm font-medium text-slate-600" }, "Description of Work"),
                React.createElement("textarea", {
                  id: "work-description",
                  value: description,
                  onChange: e => setDescription(e.target.value),
                  required: true,
                  rows: 5,
                  className: "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm",
                  placeholder: "Describe the work that was completed..."
                })
              )
            )
          ),
          React.createElement("div", { className: "bg-slate-50 px-6 py-3 flex justify-end space-x-2 rounded-b-lg" },
            React.createElement("button", { type: "button", onClick: onClose, className: "px-4 py-2 rounded-md text-sm font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 transition-colors" },
              "Cancel"
            ),
            React.createElement("button", { type: "submit", className: "px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors" },
              "Save Log"
            )
          )
        )
      )
    )
  );
};

export default WorkLogModal;