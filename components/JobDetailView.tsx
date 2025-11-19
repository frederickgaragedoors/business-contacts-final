

import React, { useState } from 'react';
import { Contact, JobTicket, BusinessInfo, JobTemplate, jobStatusColors, JobStatus, CatalogItem } from '../types.ts';
import JobTicketModal from './JobTicketModal.tsx';
import {
  ArrowLeftIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  EditIcon,
  TrashIcon,
  ClipboardListIcon,
  MessageIcon,
} from './icons.tsx';
import { calculateJobTicketTotal, formatTime } from '../utils.ts';

interface JobDetailViewProps {
  contact: Contact;
  ticket: JobTicket;
  businessInfo: BusinessInfo;
  jobTemplates: JobTemplate[];
  partsCatalog: CatalogItem[];
  onBack: () => void;
  onEditTicket: (ticketData: Omit<JobTicket, 'id'> & { id?: string }) => void;
  onDeleteTicket: () => void;
  onViewInvoice: () => void;
  enabledStatuses: Record<JobStatus, boolean>;
}

const JobDetailView: React.FC<JobDetailViewProps> = ({
  contact,
  ticket,
  businessInfo,
  jobTemplates,
  partsCatalog,
  onBack,
  onEditTicket,
  onDeleteTicket,
  onViewInvoice,
  enabledStatuses,
}) => {
  const [isJobTicketModalOpen, setIsJobTicketModalOpen] = useState(false);

  const { subtotal, taxAmount, feeAmount, totalCost, deposit, balanceDue } = calculateJobTicketTotal(ticket);
  const statusColor = jobStatusColors[ticket.status];
  const hasCosts = ticket.parts.length > 0 || (ticket.laborCost && ticket.laborCost > 0);

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
          
          {/* Job Overview Card (Combined Notes & Job Info) */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
                 <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Job Overview</h3>
                 <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColor.base} ${statusColor.text}`}>
                    {ticket.status}
                </span>
            </div>
            
            {/* Notes Section */}
            <div className="mb-6">
               <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words text-base">
                  {ticket.notes || 'No notes provided for this job.'}
               </p>
            </div>

            {/* Meta Data Section */}
            <div className="flex flex-col items-start gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-6 border border-slate-100 dark:border-slate-700">
                <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {new Date(ticket.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                        {ticket.time && <span className="ml-2 text-slate-600 dark:text-slate-300 font-normal">at {formatTime(ticket.time)}</span>}
                    </p>
                </div>
                <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Job ID</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{ticket.id}</p>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center space-x-3">
                <button onClick={() => setIsJobTicketModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                    <EditIcon className="w-4 h-4" /><span>Edit</span>
                </button>
                 <button onClick={onDeleteTicket} className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900 transition-colors">
                    <TrashIcon className="w-4 h-4" /><span>Delete</span>
                </button>
                 <button onClick={onViewInvoice} className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors">
                    <ClipboardListIcon className="w-4 h-4" /><span>PDF</span>
                </button>
            </div>
          </div>

          {/* Customer Info Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b dark:border-slate-700 pb-2">Customer Information</h3>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{contact.name}</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center">
                    <PhoneIcon className="w-4 h-4 text-slate-400 mr-3" />
                    <span className="text-slate-600 dark:text-slate-300">{contact.phone}</span>
                </div>
                <div className="flex space-x-2">
                    <a href={`tel:${contact.phone}`} className="flex items-center space-x-1 px-2 py-1 rounded bg-sky-500 text-white hover:bg-sky-600 text-xs font-medium transition-colors">
                        <PhoneIcon className="w-3 h-3" />
                        <span>Call</span>
                    </a>
                    <a href={`sms:${contact.phone}`} className="flex items-center space-x-1 px-2 py-1 rounded bg-sky-500 text-white hover:bg-sky-600 text-xs font-medium transition-colors">
                        <MessageIcon className="w-3 h-3" />
                        <span>Text</span>
                    </a>
                </div>
              </div>
              <div className="flex items-center">
                <MailIcon className="w-4 h-4 text-slate-400 mr-3" />
                <a href={`mailto:${contact.email}`} className="text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:underline transition-colors">{contact.email}</a>
              </div>
              <div className="flex items-start">
                <MapPinIcon className="w-4 h-4 text-slate-400 mr-3 mt-1" />
                <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:underline transition-colors whitespace-pre-line" 
                >
                    {contact.address}
                </a>
              </div>
            </div>
          </div>

          {/* Costs Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b dark:border-slate-700 pb-2">Cost Breakdown</h3>
            {hasCosts ? (
                <>
                  <div className="">
                      <table className="w-full text-left text-xs sm:text-sm table-fixed">
                        <thead>
                          <tr className="border-b dark:border-slate-700">
                            <th className="py-2 px-1 sm:px-2 font-medium w-[40%]">Item/Service</th>
                            <th className="py-2 px-1 sm:px-2 font-medium text-center w-[12%]">Qty</th>
                            <th className="py-2 px-1 sm:px-2 font-medium text-right w-[24%]">Unit</th>
                            <th className="py-2 px-1 sm:px-2 font-medium text-right w-[24%]">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ticket.parts.map(p => (
                            <tr key={p.id} className="border-b dark:border-slate-700/50">
                              <td className="py-2 px-1 sm:px-2 break-words align-top">{p.name}</td>
                              <td className="py-2 px-1 sm:px-2 text-center align-top whitespace-nowrap">{p.quantity}</td>
                              <td className="py-2 px-1 sm:px-2 text-right align-top whitespace-nowrap">${p.cost.toFixed(2)}</td>
                              <td className="py-2 px-1 sm:px-2 text-right align-top whitespace-nowrap">${(p.cost * p.quantity).toFixed(2)}</td>
                            </tr>
                          ))}
                          <tr className="border-b dark:border-slate-700/50">
                            <td className="py-2 px-1 sm:px-2">Labor</td>
                            <td colSpan={2}></td>
                            <td className="py-2 px-1 sm:px-2 text-right whitespace-nowrap">${ticket.laborCost.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <div className="w-full max-w-xs space-y-1">
                      <div className="flex justify-between"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Tax ({ticket.salesTaxRate || 0}%):</span><span>${taxAmount.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Fee ({ticket.processingFeeRate || 0}%):</span><span>${feeAmount.toFixed(2)}</span></div>
                      <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t dark:border-slate-600"><span>Total:</span><span>${totalCost.toFixed(2)}</span></div>
                      {deposit > 0 && (
                        <div className="flex justify-between text-green-600 dark:text-green-400 font-medium"><span>Less Deposit:</span><span>-(${deposit.toFixed(2)})</span></div>
                      )}
                      <div className="flex justify-between font-bold text-slate-800 dark:text-slate-100 mt-1 pt-1 border-t border-slate-200 dark:border-slate-700"><span>Balance Due:</span><span>${balanceDue.toFixed(2)}</span></div>
                    </div>
                  </div>
                </>
            ) : (
                <p className="text-center text-slate-500 dark:text-slate-400 italic py-4">No costs have been associated with this job yet.</p>
            )}
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
          partsCatalog={partsCatalog}
          enabledStatuses={enabledStatuses}
        />
      )}
    </>
  );
};

export default JobDetailView;