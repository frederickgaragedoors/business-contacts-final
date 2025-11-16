import React, { useState, useEffect } from 'react';
import { WorkLogEntry } from '../types.ts';
import { XIcon } from './icons.tsx';

interface WorkLogModalProps {
  entry?: WorkLogEntry | null;
  onSave: (entry: Omit<WorkLogEntry, 'id'> & { id?: string }) => void;
  onClose: () => void;
}

const WorkLogModal: React.FC<WorkLogModalProps> = ({ entry, onSave, onClose }) => {
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

  const handleSubmit = (e: React.FormEvent) => {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">{entry ? 'Edit Work Log' : 'Add Work Log'}</h2>
              <button type="button" onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="work-date" className="block text-sm font-medium text-slate-600">Date</label>
                <input
                  type="date"
                  id="work-date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="work-description" className="block text-sm font-medium text-slate-600">Description of Work</label>
                <textarea
                  id="work-description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  rows={5}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                  placeholder="Describe the work that was completed..."
                ></textarea>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-3 flex justify-end space-x-2 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors">
              Save Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkLogModal;