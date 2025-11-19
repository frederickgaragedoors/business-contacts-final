



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
  MessageIcon,
} from './icons.js';
import { calculateJobTicketTotal, formatTime } from '../utils.js';

const JobDetailView = ({
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
                 React.createElement("h3", { className: "text-lg font-semibold text-slate-800 dark:text-slate-100" }, "Job Overview"),
                 React.createElement("span", { className: `px-3 py-1 text-sm font-medium rounded-full ${statusColor.base} ${statusColor.text}` },
                    ticket.status
                )
            ),
            
            // Notes
            React.createElement("div", { className: "mb-6" },
               React.createElement("p", { className: "text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words text-base" },
                  ticket.notes || 'No notes provided for this job.'
               )
            ),

            // Meta Data
            React.createElement("div", { className: "flex flex-col items-start gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-6 border border-slate-100 dark:border-slate-700" },
                React.createElement("div", null,
                    React.createElement("p", { className: "text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider" }, "Date"),
                    React.createElement("p", { className: "text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5" },
                         new Date(ticket.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }),
                         ticket.time && React.createElement("span", { className: "ml-2 text-slate-600 dark:text-slate-300 font-normal" }, `at ${formatTime(ticket.time)}`)
                    )
                ),
                React.createElement("div", null,
                    React.createElement("p", { className: "text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider" }, "Job ID"),
                    React.createElement("p", { className: "text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5" }, ticket.id)
                )
            ),

            // Actions
            React.createElement("div", { className: "mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center space-x-3" },
                React.createElement("button", { onClick: () => setIsJobTicketModalOpen(true), className: "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors" },
                    React.createElement(EditIcon, { className: "w-4 h-4" }), React.createElement("span", null, "Edit")
                ),
                 React.createElement("button", { onClick: onDeleteTicket, className: "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900 transition-colors" },
                    React.createElement(TrashIcon, { className: "w-4 h-4" }), React.createElement("span", null, "Delete")
                ),
                 React.createElement("button", { onClick: onViewInvoice, className: "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors" },
                    React.createElement(ClipboardListIcon, { className: "w-4 h-4" }), React.createElement("span", null, "PDF")
                )
            )
          ),

          // Contact Info Card
          React.createElement("div", { className: "bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6" },
            React.createElement("h3", { className: "text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b dark:border-slate-700 pb-2" }, "Customer Information"),
            React.createElement("p", { className: "text-2xl font-bold text-slate-800 dark:text-slate-100" }, contact.name),
            React.createElement("div", { className: "mt-4 space-y-3 text-sm" },
              React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2" },
                React.createElement("div", { className: "flex items-center" },
                    React.createElement(PhoneIcon, { className: "w-4 h-4 text-slate-400 mr-3" }),
                    React.createElement("span", { className: "text-slate-600 dark:text-slate-300" }, contact.phone)
                ),
                React.createElement("div", { className: "flex space-x-2" },
                    React.createElement("a", { href: `tel:${contact.phone}`, className: "flex items-center space-x-1 px-2 py-1 rounded bg-sky-500 text-white hover:bg-sky-600 text-xs font-medium transition-colors" },
                        React.createElement(PhoneIcon, { className: "w-3 h-3" }),
                        React.createElement("span", null, "Call")
                    ),
                    React.createElement("a", { href: `sms:${contact.phone}`, className: "flex items-center space-x-1 px-2 py-1 rounded bg-sky-500 text-white hover:bg-sky-600 text-xs font-medium transition-colors" },
                        React.createElement(MessageIcon, { className: "w-3 h-3" }),
                        React.createElement("span", null, "Text")
                    )
                )
              ),
              React.createElement("div", { className: "flex items-center" },
                React.createElement("div", { className: "flex items-center" },
                  React.createElement(MailIcon, { className: "w-4 h-4 text-slate-400 mr-3" }),
                  React.createElement("a", { href: `mailto:${contact.email}`, className: "text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:underline transition-colors" }, contact.email)
                )
              ),
              React.createElement("div", { className: "flex items-start" },
                React.createElement("MapPinIcon", { className: "w-4 h-4 text-slate-400 mr-3 mt-1" }),
                React.createElement("a", { 
                    href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:underline transition-colors whitespace-pre-line" 
                }, contact.address)
              )
            )
          ),

          // Costs Card
          React.createElement("div", { className: "bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6" },
            React.createElement("h3", { className: "text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b dark:border-slate-700 pb-2" }, "Cost Breakdown"),
            hasCosts ? (
                React.createElement(React.Fragment, null,
                    React.createElement("div", { className: "" },
                        React.createElement("table", { className: "w-full text-left text-xs sm:text-sm table-fixed" },
                            React.createElement("thead", null,
                            React.createElement("tr", { className: "border-b dark:border-slate-700" },
                                React.createElement("th", { className: "py-2 px-1 sm:px-2 font-medium w-[40%]" }, "Item/Service"),
                                React.createElement("th", { className: "py-2 px-1 sm:px-2 font-medium text-center w-[12%]" }, "Qty"),
                                React.createElement("th", { className: "py-2 px-1 sm:px-2 font-medium text-right w-[24%]" }, "Unit"),
                                React.createElement("th", { className: "py-2 px-1 sm:px-2 font-medium text-right w-[24%]" }, "Total")
                            )
                            ),
                            React.createElement("tbody", null,
                            ticket.parts.map(p => (
                                React.createElement("tr", { key: p.id, className: "border-b dark:border-slate-700/50" },
                                React.createElement("td", { className: "py-2 px-1 sm:px-2 break-words align-top" }, p.name),
                                React.createElement("td", { className: "py-2 px-1 sm:px-2 text-center align-top whitespace-nowrap" }, p.quantity),
                                React.createElement("td", { className: "py-2 px-1 sm:px-2 text-right align-top whitespace-nowrap" }, `$${p.cost.toFixed(2)}`),
                                React.createElement("td", { className: "py-2 px-1 sm:px-2 text-right align-top whitespace-nowrap" }, `$${(p.cost * p.quantity).toFixed(2)}`)
                                )
                            )),
                            React.createElement("tr", { className: "border-b dark:border-slate-700/50" },
                                React.createElement("td", { className: "py-2 px-1 sm:px-2" }, "Labor"),
                                React.createElement("td", { colSpan: 2 }),
                                React.createElement("td", { className: "py-2 px-1 sm:px-2 text-right whitespace-nowrap" }, `$${ticket.laborCost.toFixed(2)}`)
                            )
                            )
                        )
                    ),
                    React.createElement("div", { className: "mt-4 flex justify-end" },
                        React.createElement("div", { className: "w-full max-w-xs space-y-1" },
                        React.createElement("div", { className: "flex justify-between" }, React.createElement("span", null, "Subtotal:"), React.createElement("span", null, `$${subtotal.toFixed(2)}`)),
                        React.createElement("div", { className: "flex justify-between" }, React.createElement("span", null, `Tax (${ticket.salesTaxRate || 0}%):`), React.createElement("span", null, `$${taxAmount.toFixed(2)}`)),
                        React.createElement("div", { className: "flex justify-between" }, React.createElement("span", null, `Fee (${ticket.processingFeeRate || 0}%):`), React.createElement("span", null, `$${feeAmount.toFixed(2)}`)),
                        React.createElement("div", { className: "flex justify-between font-bold text-lg mt-2 pt-2 border-t dark:border-slate-600" }, React.createElement("span", null, "Total:"), React.createElement("span", null, `$${totalCost.toFixed(2)}`)),
                        deposit > 0 && React.createElement("div", { className: "flex justify-between text-green-600 dark:text-green-400 font-medium" }, React.createElement("span", null, "Less Deposit:"), React.createElement("span", null, `-($${deposit.toFixed(2)})`)),
                        React.createElement("div", { className: "flex justify-between font-bold text-slate-800 dark:text-slate-100 mt-1 pt-1 border-t border-slate-200 dark:border-slate-700" }, React.createElement("span", null, "Balance Due:"), React.createElement("span", null, `$${balanceDue.toFixed(2)}`))
                        )
                    )
                )
            ) : (
                React.createElement("p", { className: "text-center text-slate-500 dark:text-slate-400 italic py-4" }, "No costs have been associated with this job yet.")
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
          jobTemplates: jobTemplates,
          partsCatalog: partsCatalog,
          enabledStatuses: enabledStatuses
        })
      )
    )
  );
};

export default JobDetailView;