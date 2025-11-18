
import React, { useState } from 'react';
import { jobStatusColors } from '../types.js';
import JobTicketModal from './JobTicketModal.js';
import {
  ArrowLeftIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  EditIcon,
  TrashIcon,
  ClipboardListIcon,
} from './icons.js';
import { calculateJobTicketTotal } from '../utils.js';

const JobDetailView = ({
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
    React.createElement(React.Fragment, null,
      React.createElement("div", { className: "h-full flex flex-col bg-slate-100 dark:bg-slate-900 overflow-y-auto" },
        React.createElement("div", { className: "p-4 flex items-center border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10" },
          React.createElement("button", { onClick: onBack, className: "p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" },
            React.createElement(ArrowLeftIcon, { className: "w-6 h-6 text-slate-600 dark:text-slate-300" })
          ),
          React.createElement("h2", { className: "ml-4 flex-grow font-bold text-lg text-slate-700 dark:text-slate-200" },
            "Job Details"
          )
        ),

        React.createElement("div", { className: "px-4 sm:px-6 py-6 flex-grow space-y-6" },
        
          // Job Overview Card (Combined Notes & Job Info)
          React.createElement("div", { className: "bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6" },
            React.createElement("div", { className: "flex justify-between items-start mb-4" },
                 React.createElement("h3", { className: "text-lg font-semibold text-slate-800 dark:text-slate-100" }, "Job Overview")
            ),
            
            // Notes
            React.createElement("div", { className: "mb-6" },
               React.createElement("p", { className: "text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words text-base" },
                  ticket.notes || 'No notes provided for this job.'
               )
            ),

            // Meta Data
            React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-6 border border-slate-100 dark:border-slate-700" },
                 React.createElement("div", { className: "flex gap-6" },
                    React.createElement("div", null,
                        React.createElement("p", { className: "text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider" }, "Date"),
                        React.createElement("p", { className: "text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5" }, new Date(ticket.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }))
                    ),
                    React.createElement("div", null,
                        React.createElement("p", { className: "text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider" }, "Job ID"),
                        React.createElement("p", { className: "text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5" }, ticket.id)
                    )
                 ),
                 React.createElement("span", { className: `px-3 py-1 text-sm font-medium rounded-full ${statusColor.base} ${statusColor.text}` },
                    ticket.status
                )
            ),

            // Actions
            React.createElement("div", { className: "pt-2 flex items-center justify-end space-x-2" },
                React.createElement("button", { onClick: () => setIsJobTicketModalOpen(true), className: "flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500" },
                    React.createElement(EditIcon, { className: "w-4 h-4" }), React.createElement("span", null, "Edit")
                ),
                 React.createElement("button", { onClick: onDeleteTicket, className: "flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900" },
                    React.createElement(TrashIcon, { className: "w-4 h-4" }), React.createElement("span", null, "Delete")
                ),
                 React.createElement("button", { onClick: onViewInvoice, className: "flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600" },
                    React.createElement(ClipboardListIcon, { className: "w-4 h-4" }), React.createElement("span", null, "PDF")
                )
            )
          ),

          // Contact Info Card
          React.createElement("div", { className: "bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6" },
            React.createElement("h3", { className: "text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b dark:border-slate-700 pb-2" }, "Customer Information"),
            React.createElement("p", { className: "text-2xl font-bold text-slate-800 dark:text-slate-100" }, contact.name),
            React.createElement("div", { className: "mt-4 space-y-3 text-sm" },
              React.createElement("div", { className: "flex items-center" },
                React.createElement(PhoneIcon, { className: "w-4 h-4 text-slate-400 mr-3" }),
                React.createElement("span", { className: "text-slate-600 dark:text-slate-300" }, contact.phone)
              ),
              React.createElement("div", { className: "flex items-center" },
                React.createElement(MailIcon, { className: "w-4 h-4 text-slate-400 mr-3" }),
                React.createElement("span", { className: "text-slate-600 dark:text-slate-300" }, contact.email)
              ),
              React.createElement("div", { className: "flex items-start" },
                React.createElement(MapPinIcon, { className: "w-4 h-4 text-slate-400 mr-3 mt-1" }),
                React.createElement("span", { className: "text-slate-600 dark:text-slate-300 whitespace-pre-line" }, contact.address)
              )
            )
          ),

          // Costs Card
          ticket.status !== 'Estimate Scheduled' && (
            React.createElement("div", { className: "bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6" },
              React.createElement("h3", { className: "text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b dark:border-slate-700 pb-2" }, "Cost Breakdown"),
              React.createElement("table", { className: "w-full text-left text-sm" },
                React.createElement("thead", null,
                  React.createElement("tr", { className: "border-b dark:border-slate-700" },
                    React.createElement("th", { className: "py-2 font-medium w-3/5" }, "Item/Service"),
                    React.createElement("th", { className: "py-2 font-medium text-center" }, "Qty"),
                    React.createElement("th", { className: "py-2 font-medium text-right" }, "Unit"),
                    React.createElement("th", { className: "py-2 font-medium text-right" }, "Total")
                  )
                ),
                React.createElement("tbody", null,
                  ticket.parts.map(p => (
                    React.createElement("tr", { key: p.id, className: "border-b dark:border-slate-700/50" },
                      React.createElement("td", { className: "py-2" }, p.name),
                      React.createElement("td", { className: "py-2 text-center" }, p.quantity),
                      React.createElement("td", { className: "py-2 text-right" }, `$${p.cost.toFixed(2)}`),
                      React.createElement("td", { className: "py-2 text-right" }, `$${(p.cost * p.quantity).toFixed(2)}`)
                    )
                  )),
                  React.createElement("tr", { className: "border-b dark:border-slate-700/50" },
                    React.createElement("td", { className: "py-2" }, "Labor"),
                    React.createElement("td", { colSpan: 2 }),
                    React.createElement("td", { className: "py-2 text-right" }, `$${ticket.laborCost.toFixed(2)}`)
                  )
                )
              ),
              React.createElement("div", { className: "mt-4 flex justify-end" },
                React.createElement("div", { className: "w-full max-w-xs space-y-1" },
                  React.createElement("div", { className: "flex justify-between" }, React.createElement("span", null, "Subtotal:"), React.createElement("span", null, `$${subtotal.toFixed(2)}`)),
                  React.createElement("div", { className: "flex justify-between" }, React.createElement("span", null, `Tax (${ticket.salesTaxRate || 0}%):`), React.createElement("span", null, `$${taxAmount.toFixed(2)}`)),
                  React.createElement("div", { className: "flex justify-between" }, React.createElement("span", null, `Fee (${ticket.processingFeeRate || 0}%):`), React.createElement("span", null, `$${feeAmount.toFixed(2)}`)),
                  React.createElement("div", { className: "flex justify-between font-bold text-lg mt-2 pt-2 border-t dark:border-slate-600" }, React.createElement("span", null, "Total:"), React.createElement("span", null, `$${totalCost.toFixed(2)}`))
                )
              )
            )
          )
        )
      ),

      isJobTicketModalOpen && (
        React.createElement(JobTicketModal, {
          entry: ticket,
          onSave: (updatedTicket) => {
            onEditTicket(updatedTicket);
            setIsJobTicketModalOpen(false);
          },
          onClose: () => setIsJobTicketModalOpen(false),
          jobTemplates: jobTemplates
        })
      )
    )
  );
};

export default JobDetailView;
