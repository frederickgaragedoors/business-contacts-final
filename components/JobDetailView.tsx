import React, { useState } from 'react';
import { Contact, JobTicket, BusinessInfo, JobTemplate, jobStatusColors } from '../types.ts';
import JobTicketModal from './JobTicketModal.tsx';
import {
  ArrowLeftIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  EditIcon,
  TrashIcon,
  ClipboardListIcon,
} from './icons.tsx';
import { calculateJobTicketTotal } from '../utils.ts';

interface JobDetailViewProps {
  contact: Contact;
  ticket: JobTicket;
  businessInfo: BusinessInfo;
  jobTemplates: JobTemplate[];
  onBack: () => void;
  onEditTicket: (ticketData: Omit<JobTicket, 'id'> & { id?: string }) => void;
  onDeleteTicket: () => void;
  onViewInvoice: () => void;
}

const JobDetailView: React.FC<JobDetailViewProps> = ({
  contact,
  ticket,
  businessInfo,
  jobTemplates,
  onBack,
  onEditTicket,
  onDeleteTicket,
  onViewInvoice,
}) => {
  const [isJobTicketModalOpen, setIsJobTicketModalOpen] = useState(false);

  const { subtotal, taxAmount, feeAmount, totalCost } = calculateJobTicketTotal(ticket);
  const statusColor = jobStatusColors[ticket.status];

  return (
    <>
      <div className="h-full flex flex-col bg-slate-100 dark:bg-slate-900 overflow-y-auto">
        <div className="p-4 flex items-center border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
            <ArrowLeftIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
          </button>
          <h2 className="ml-4 flex-grow font-bold text-lg text-slate-700 dark:text-slate-200">
            Job Details
          </h2>
        </div>

        <div className="px-4 sm:px-6 py-6 flex-grow space-y-6">
          {/* Contact Info Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b dark:border-slate-700 pb-2">Customer Information</h3>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{contact.name}</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center">
                <PhoneIcon className="w-4 h-4 text-slate-400 mr-3" />
                <span className="text-slate-600 dark:text-slate-300">{contact.phone}</span>
              </div>
              <div className="flex items-center">
                <MailIcon className="w-4 h-4 text-slate-400 mr-3" />
                <span className="text-slate-600 dark:text-slate-300">{contact.email}</span>
              </div>
              <div className="flex items-start">
                <MapPinIcon className="w-4 h-4 text-slate-400 mr-3 mt-1" />
                <span className="text-slate-600 dark:text-slate-300 whitespace-pre-line">{contact.address}</span>
              </div>
            </div>
          </div>

          {/* Job Info & Actions Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Job ID: {ticket.id}</p>
                <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 mt-1">{new Date(ticket.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</p>
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColor.base} ${statusColor.text}`}>
                {ticket.status}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t dark:border-slate-700 flex items-center justify-end space-x-2">
                <button onClick={() => setIsJobTicketModalOpen(true)} className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500">
                    <EditIcon className="w-4 h-4" /><span>Edit</span>
                </button>
                 <button onClick={onDeleteTicket} className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900">
                    <TrashIcon className="w-4 h-4" /><span>Delete</span>
                </button>
                 <button onClick={onViewInvoice} className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600">
                    <ClipboardListIcon className="w-4 h-4" /><span>PDF</span>
                </button>
            </div>
          </div>

          {/* Costs Card */}
          {ticket.status !== 'Estimate Scheduled' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b dark:border-slate-700 pb-2">Cost Breakdown</h3>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b dark:border-slate-700">
                    <th className="py-2 font-medium w-3/5">Item/Service</th>
                    <th className="py-2 font-medium text-center">Qty</th>
                    <th className="py-2 font-medium text-right">Unit</th>
                    <th className="py-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ticket.parts.map(p => (
                    <tr key={p.id} className="border-b dark:border-slate-700/50">
                      <td className="py-2">{p.name}</td>
                      <td className="py-2 text-center">{p.quantity}</td>
                      <td className="py-2 text-right">${p.cost.toFixed(2)}</td>
                      <td className="py-2 text-right">${(p.cost * p.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="border-b dark:border-slate-700/50">
                    <td className="py-2">Labor</td>
                    <td colSpan={2}></td>
                    <td className="py-2 text-right">${ticket.laborCost.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-4 flex justify-end">
                <div className="w-full max-w-xs space-y-1">
                  <div className="flex justify-between"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Tax ({ticket.salesTaxRate || 0}%):</span><span>${taxAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Fee ({ticket.processingFeeRate || 0}%):</span><span>${feeAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t dark:border-slate-600"><span>Total:</span><span>${totalCost.toFixed(2)}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Notes Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Notes</h3>
            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words">
              {ticket.notes || 'No notes for this job.'}
            </p>
          </div>
        </div>
      </div>

      {isJobTicketModalOpen && (
        <JobTicketModal
          entry={ticket}
          onSave={(updatedTicket) => {
            onEditTicket(updatedTicket);
            setIsJobTicketModalOpen(false);
          }}
          onClose={() => setIsJobTicketModalOpen(false)}
          jobTemplates={jobTemplates}
        />
      )}
    </>
  );
};

export default JobDetailView;
