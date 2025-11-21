
import React, { useState } from 'react';
import { jobStatusColors, paymentStatusColors, paymentStatusLabels, DEFAULT_ON_MY_WAY_TEMPLATE } from '../types.js';
import JobTicketModal from './JobTicketModal.js';
import InspectionModal from './InspectionModal.js';
import {
  ArrowLeftIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  EditIcon,
  TrashIcon,
  ClipboardListIcon,
  MessageIcon,
  CarIcon,
  UserCircleIcon,
  ClipboardCheckIcon,
} from './icons.js';
import { calculateJobTicketTotal, formatTime, processTemplate, formatPhoneNumber } from '../utils.js';

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
  apiKey,
}) => {
  const [isJobTicketModalOpen, setIsJobTicketModalOpen] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);

  const { subtotal, taxAmount, feeAmount, totalCost, deposit } = calculateJobTicketTotal(ticket);
  const statusColor = jobStatusColors[ticket.status];
  
  const paymentStatus = ticket.paymentStatus || 'unpaid';
  const paymentStatusColor = paymentStatusColors[paymentStatus];
  const paymentStatusLabel = paymentStatusLabels[paymentStatus];

  const hasCosts = ticket.parts.length > 0 || (ticket.laborCost && ticket.laborCost > 0);

  let paidAmount = 0;
  if (paymentStatus === 'paid_in_full') {
      paidAmount = totalCost;
  } else if (paymentStatus === 'deposit_paid') {
      paidAmount = deposit;
  }
  const displayBalance = totalCost - paidAmount;

  const serviceLocation = ticket.jobLocation || contact.address;
  const isDifferentLocation = ticket.jobLocation && ticket.jobLocation !== contact.address;

  const primaryPhone = ticket.jobLocationContactPhone || contact.phone;
  const primaryName = ticket.jobLocationContactName || contact.name;

  const template = businessInfo.onMyWayTemplate || DEFAULT_ON_MY_WAY_TEMPLATE;
  const smsBody = processTemplate(template, {
    customerName: primaryName.split(' ')[0],
    businessName: businessInfo.name || 'your technician'
  });
  const smsLink = `sms:${primaryPhone}?body=${encodeURIComponent(smsBody)}`;
  
  const inspectionItems = ticket.inspection || [];
  const totalInspectionItems = inspectionItems.length;
  const failedItems = inspectionItems.filter(i => i.status === 'Fail').length;
  const repairedItems = inspectionItems.filter(i => i.status === 'Repaired').length;
  const passedItems = inspectionItems.filter(i => i.status === 'Pass').length;

  return (
    React.createElement(React.Fragment, null,
      React.createElement("div", { className: "h-full flex flex-col bg-slate-100 dark:bg-slate-900 overflow-y-auto" },
        /* Header with Action Buttons */
        React.createElement("div", { className: "p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10" },
          React.createElement("div", { className: "flex items-center" },
            React.createElement("button", { onClick: onBack, className: "p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" },
                React.createElement(ArrowLeftIcon, { className: "w-6 h-6 text-slate-600 dark:text-slate-300" })
            ),
            React.createElement("h2", { className: "ml-4 font-bold text-lg text-slate-700 dark:text-slate-200" },
                "Job Details"
            )
          ),
          React.createElement("div", { className: "flex items-center space-x-1 sm:space-x-2" },
             React.createElement("button", { 
                onClick: onViewInvoice, 
                className: "p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors",
                title: "View PDF"
             },
                React.createElement(ClipboardListIcon, { className: "w-5 h-5" })
             ),
             React.createElement("button", { 
                onClick: () => setIsJobTicketModalOpen(true), 
                className: "p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors",
                title: "Edit Job"
             },
                React.createElement(EditIcon, { className: "w-5 h-5" })
             ),
             React.createElement("button", { 
                onClick: onDeleteTicket, 
                className: "flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900 transition-colors",
                title: "Delete Job"
             },
                React.createElement(TrashIcon, { className: "w-5 h-5" })
             )
          )
        ),

        /* Compact Status Bar */
        React.createElement("div", { className: "bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between gap-4" },
            React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2" },
                 React.createElement("span", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase" }, "Status"),
                 React.createElement("span", { className: `px-2 py-0.5 rounded text-sm font-bold ${statusColor.base} ${statusColor.text} inline-block` }, ticket.status)
            ),
            React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-right sm:text-left" },
                 React.createElement("span", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase" }, "Payment"),
                 React.createElement("span", { className: `px-2 py-0.5 rounded text-sm font-bold ${paymentStatusColor.base} ${paymentStatusColor.text} inline-block` }, paymentStatusLabel)
            )
        ),

        React.createElement("div", { className: "px-4 sm:px-6 py-6 flex-grow space-y-6" },
          
          /* Job Logistics Card - Ticket Stub Style */
          React.createElement("div", { className: "bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col" },
            /* Header Strip */
            React.createElement("div", { className: "bg-slate-800 text-white p-3 flex justify-between items-center" },
                React.createElement("div", { className: "flex space-x-4" },
                    React.createElement("div", null,
                        React.createElement("span", { className: "text-[10px] uppercase opacity-70 block" }, "Date"),
                        React.createElement("span", { className: "font-bold" },
                            new Date(ticket.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
                        )
                    ),
                    React.createElement("div", null,
                        React.createElement("span", { className: "text-[10px] uppercase opacity-70 block" }, "Time"),
                        React.createElement("span", { className: "font-bold" }, ticket.time ? formatTime(ticket.time) : 'Anytime')
                    )
                ),
                React.createElement("div", { className: "text-right" },
                    React.createElement("span", { className: "text-[10px] uppercase opacity-70 block" }, "Ticket #"),
                    React.createElement("span", { className: "font-mono font-bold text-sky-400" }, ticket.id)
                )
            ),

            /* Body */
            React.createElement("div", { className: "p-5 pb-2" },
                /* 1. Notes (Top Priority) */
                React.createElement("div", { className: "mb-6" },
                    React.createElement("span", { className: "text-xs font-bold text-slate-400 uppercase mb-1 block" }, "Work Notes"),
                    React.createElement("p", { className: "text-slate-800 dark:text-slate-200 text-base whitespace-pre-wrap break-words" },
                        ticket.notes || 'No notes provided for this job.'
                    )
                ),

                React.createElement("div", { className: "border-t border-slate-100 dark:border-slate-700 pt-4 grid grid-cols-2 gap-4" },
                    /* Location Col */
                    React.createElement("div", { className: "min-w-0" },
                            React.createElement("p", { className: "text-xs font-bold text-slate-400 uppercase mb-2 flex items-center" },
                                React.createElement(MapPinIcon, { className: "w-3 h-3 mr-1 flex-shrink-0" }), " Site Location"
                            ),
                            React.createElement("a", {
                                href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(serviceLocation)}`,
                                target: "_blank",
                                rel: "noopener noreferrer",
                                className: "font-semibold text-sm text-slate-800 dark:text-slate-200 hover:text-sky-600 hover:underline whitespace-pre-line block break-words"
                            },
                                serviceLocation || 'No address provided'
                            ),
                            ticket.jobLocationContactName && (
                                React.createElement("p", { className: "text-xs text-slate-500 mt-1 truncate" }, `Contact: ${ticket.jobLocationContactName}`)
                            ),
                            ticket.jobLocationContactPhone && (
                                React.createElement("div", { className: "flex items-center mt-1 space-x-2" },
                                    React.createElement("a", { href: `tel:${ticket.jobLocationContactPhone}`, className: "text-xs text-slate-500 hover:text-sky-600 hover:underline flex items-center" },
                                       React.createElement(PhoneIcon, { className: "w-3 h-3 mr-1" }),
                                       ticket.jobLocationContactPhone
                                    )
                                )
                            )
                    ),

                    /* Client Col */
                    React.createElement("div", { className: "min-w-0" },
                            React.createElement("p", { className: "text-xs font-bold text-slate-400 uppercase mb-2 flex items-center" },
                                React.createElement(UserCircleIcon, { className: "w-3 h-3 mr-1 flex-shrink-0" }), " Client / Billing"
                            ),
                            React.createElement("div", { className: "flex flex-col" },
                                React.createElement("button", { onClick: onBack, className: "font-semibold text-sm text-slate-800 dark:text-slate-100 hover:underline text-left truncate max-w-full" },
                                    contact.name
                                ),
                                React.createElement("a", { href: `tel:${contact.phone}`, className: "text-xs text-slate-500 mt-1 truncate hover:text-sky-600 hover:underline block" },
                                    contact.phone
                                ),
                                React.createElement("a", { href: `mailto:${contact.email}`, className: "text-xs text-slate-500 hover:text-sky-600 block mt-0.5 truncate" }, contact.email)
                            )
                    )
                )
            ),

             /* Action Footer */
            React.createElement("div", { className: "bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-700 p-3" },
                 React.createElement("div", { className: "grid grid-cols-3 gap-3" },
                     React.createElement("a", { href: `tel:${primaryPhone}`, className: "flex flex-col items-center justify-center p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-sm hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-800 transition-all group" },
                         React.createElement(PhoneIcon, { className: "w-5 h-5 text-green-600 dark:text-green-500 mb-1 group-hover:scale-110 transition-transform" }),
                         React.createElement("span", { className: "text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-green-700 dark:group-hover:text-green-400" }, "Call")
                     ),
                     React.createElement("a", { href: `sms:${primaryPhone}`, className: "flex flex-col items-center justify-center p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-sm hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:border-sky-200 dark:hover:border-sky-800 transition-all group" },
                         React.createElement(MessageIcon, { className: "w-5 h-5 text-sky-600 dark:text-sky-500 mb-1 group-hover:scale-110 transition-transform" }),
                         React.createElement("span", { className: "text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-sky-700 dark:group-hover:text-sky-400" }, "Text")
                     ),
                     React.createElement("a", { href: smsLink, className: "flex flex-col items-center justify-center p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group" },
                         React.createElement(CarIcon, { className: "w-5 h-5 text-indigo-600 dark:text-indigo-500 mb-1 group-hover:scale-110 transition-transform" }),
                         React.createElement("span", { className: "text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400" }, "On My Way")
                     )
                 )
            )
          ),
          
          /* Safety Inspection Card */
          React.createElement("div", { className: "bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6" },
              React.createElement("div", { className: "flex justify-between items-center mb-4" },
                  React.createElement("div", { className: "flex items-center" },
                      React.createElement(ClipboardCheckIcon, { className: "w-6 h-6 text-slate-600 dark:text-slate-300 mr-2" }),
                      React.createElement("h3", { className: "text-lg font-semibold text-slate-800 dark:text-slate-100" }, "Safety Inspection")
                  ),
                  totalInspectionItems > 0 && (
                       React.createElement("span", { className: "text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full" }, `${passedItems + repairedItems + failedItems} / ${totalInspectionItems} Checked`)
                  )
              ),
              
              totalInspectionItems === 0 ? (
                  React.createElement("div", { className: "bg-slate-50 dark:bg-slate-700/30 rounded-lg p-6 text-center border border-dashed border-slate-300 dark:border-slate-600" },
                      React.createElement("p", { className: "text-slate-500 dark:text-slate-400 mb-3 text-sm" }, "Documenting the 25-point inspection protects your business and ensures safety."),
                      React.createElement("button", {
                        onClick: () => setIsInspectionModalOpen(true),
                        className: "px-4 py-2 bg-sky-500 text-white font-medium rounded-md hover:bg-sky-600 transition-colors text-sm"
                      }, "Start Inspection")
                  )
              ) : (
                  React.createElement("div", null,
                       React.createElement("div", { className: "grid grid-cols-3 gap-2 mb-4 text-center" },
                           React.createElement("div", { className: "bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800" },
                               React.createElement("p", { className: "text-2xl font-bold text-red-600 dark:text-red-400" }, failedItems),
                               React.createElement("p", { className: "text-xs text-red-600 dark:text-red-300 uppercase font-bold" }, "Fail")
                           ),
                           React.createElement("div", { className: "bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-800" },
                               React.createElement("p", { className: "text-2xl font-bold text-blue-600 dark:text-blue-400" }, repairedItems),
                               React.createElement("p", { className: "text-xs text-blue-600 dark:text-blue-300 uppercase font-bold" }, "Repaired")
                           ),
                           React.createElement("div", { className: "bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-100 dark:border-green-800" },
                               React.createElement("p", { className: "text-2xl font-bold text-green-600 dark:text-green-400" }, passedItems),
                               React.createElement("p", { className: "text-xs text-green-600 dark:text-green-300 uppercase font-bold" }, "Pass")
                           )
                       ),
                       React.createElement("button", {
                            onClick: () => setIsInspectionModalOpen(true),
                            className: "w-full py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                       }, "Edit Inspection")
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
                        
                        paymentStatus === 'unpaid' && deposit > 0 && React.createElement("div", { className: "flex justify-between text-slate-500 dark:text-slate-400 italic text-sm" }, React.createElement("span", null, "Required Deposit:"), React.createElement("span", null, `$${deposit.toFixed(2)}`)),

                        paidAmount > 0 && React.createElement("div", { className: "flex justify-between text-green-600 dark:text-green-400 font-medium" }, 
                            React.createElement("span", null, `${paymentStatus === 'paid_in_full' ? 'Paid in Full' : 'Deposit Paid'}:`), 
                            React.createElement("span", null, `-$${paidAmount.toFixed(2)}`)
                        ),

                        React.createElement("div", { className: "flex justify-between font-bold text-slate-800 dark:text-slate-100 mt-1 pt-1 border-t border-slate-200 dark:border-slate-700" }, React.createElement("span", null, "Balance Due:"), React.createElement("span", null, `$${displayBalance.toFixed(2)}`))
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
          enabledStatuses: enabledStatuses,
          contactAddress: contact.address,
          apiKey: apiKey
        })
      ),

      isInspectionModalOpen && (
        React.createElement(InspectionModal, {
          existingInspection: ticket.inspection,
          onSave: (inspection) => {
            onEditTicket({ ...ticket, inspection });
            setIsInspectionModalOpen(false);
          },
          onClose: () => setIsInspectionModalOpen(false)
        })
      )
    )
  );
};

export default JobDetailView;
