










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
import { calculateJobTicketTotal, formatTime, processTemplate } from '../utils.js';

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

  // Determine target location for map/service
  const serviceLocation = ticket.jobLocation || contact.address;
  const isDifferentLocation = ticket.jobLocation && ticket.jobLocation !== contact.address;

  // SMS Link for "On My Way"
  const template = businessInfo.onMyWayTemplate || DEFAULT_ON_MY_WAY_TEMPLATE;
  const smsBody = processTemplate(template, {
    customerName: contact.name.split(' ')[0],
    businessName: businessInfo.name || 'your technician'
  });
  const smsLink = `sms:${contact.phone}?body=${encodeURIComponent(smsBody)}`;
  
  // Inspection Summary
  const inspectionItems = ticket.inspection || [];
  const totalInspectionItems = inspectionItems.length;
  const failedItems = inspectionItems.filter(i => i.status === 'Fail').length;
  const repairedItems = inspectionItems.filter(i => i.status === 'Repaired').length;
  const passedItems = inspectionItems.filter(i => i.status === 'Pass').length;

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
                 React.createElement("div", { className: "flex flex-wrap justify-end gap-2" },
                     React.createElement("span", { className: `px-3 py-1 text-sm font-medium rounded-full ${paymentStatusColor.base} ${paymentStatusColor.text}` },
                        paymentStatusLabel
                    ),
                     React.createElement("span", { className: `px-3 py-1 text-sm font-medium rounded-full ${statusColor.base} ${statusColor.text}` },
                        ticket.status
                    )
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
                React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 w-full" },
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
                React.createElement("div", { className: "w-full pt-2 border-t border-slate-200 dark:border-slate-600 mt-1" },
                    React.createElement("p", { className: "text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center" }, 
                        "Service Location",
                        isDifferentLocation && React.createElement("span", { className: "ml-2 px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 font-bold" }, "Different from Billing")
                    ),
                    React.createElement("div", { className: "flex items-start mt-1" },
                        React.createElement(MapPinIcon, { className: "w-4 h-4 text-slate-400 mr-1.5 mt-0.5 flex-shrink-0" }),
                        React.createElement("a", {
                            href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(serviceLocation)}`,
                            target: "_blank",
                            rel: "noopener noreferrer",
                            className: "text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:underline whitespace-pre-line"
                        }, serviceLocation || 'No address provided')
                    ),
                    
                    // Site Contact
                     (ticket.jobLocationContactName || ticket.jobLocationContactPhone) && (
                        React.createElement("div", { className: "mt-3 pl-1" },
                            React.createElement("p", { className: "text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1" }, "Site Contact"),
                            ticket.jobLocationContactName && (
                                React.createElement("div", { className: "flex items-center mb-1" },
                                    React.createElement(UserCircleIcon, { className: "w-4 h-4 text-slate-400 mr-2" }),
                                    React.createElement("span", { className: "text-sm font-medium text-slate-700 dark:text-slate-200" }, ticket.jobLocationContactName)
                                )
                            ),
                            ticket.jobLocationContactPhone && (
                                React.createElement("div", { className: "flex items-center" },
                                    React.createElement(PhoneIcon, { className: "w-4 h-4 text-slate-400 mr-2" }),
                                    React.createElement("span", { className: "text-sm text-slate-600 dark:text-slate-300 mr-2" }, ticket.jobLocationContactPhone),
                                    React.createElement("a", { href: `tel:${ticket.jobLocationContactPhone}`, className: "p-1 text-sky-500 hover:bg-sky-100 dark:hover:bg-sky-900 rounded-full transition-colors", title: "Call" },
                                        React.createElement(PhoneIcon, { className: "w-3 h-3" })
                                    ),
                                    React.createElement("a", { href: `sms:${ticket.jobLocationContactPhone}`, className: "p-1 text-sky-500 hover:bg-sky-100 dark:hover:bg-sky-900 rounded-full transition-colors", title: "Text" },
                                        React.createElement(MessageIcon, { className: "w-3 h-3" })
                                    )
                                )
                            )
                        )
                    )
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

          // Contact Info Card
          React.createElement("div", { className: "bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6" },
            React.createElement("h3", { className: "text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b dark:border-slate-700 pb-2" }, "Customer Information"),
            React.createElement("button", { 
                onClick: onBack,
                className: "text-2xl font-bold text-slate-800 dark:text-slate-100 hover:text-sky-600 dark:hover:text-sky-400 hover:underline transition-colors text-left" 
            }, contact.name),
            React.createElement("div", { className: "mt-4 space-y-3 text-sm" },
              React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2" },
                React.createElement("div", { className: "flex items-center" },
                    React.createElement(PhoneIcon, { className: "w-4 h-4 text-slate-400 mr-3" }),
                    React.createElement("span", { className: "text-slate-600 dark:text-slate-300" }, contact.phone)
                ),
                React.createElement("div", { className: "flex flex-wrap gap-2" },
                    React.createElement("a", { href: `tel:${contact.phone}`, className: "flex items-center space-x-1 px-2 py-1 rounded bg-sky-500 text-white hover:bg-sky-600 text-xs font-medium transition-colors" },
                        React.createElement(PhoneIcon, { className: "w-3 h-3" }),
                        React.createElement("span", null, "Call")
                    ),
                    React.createElement("a", { href: `sms:${contact.phone}`, className: "flex items-center space-x-1 px-2 py-1 rounded bg-sky-500 text-white hover:bg-sky-600 text-xs font-medium transition-colors" },
                        React.createElement(MessageIcon, { className: "w-3 h-3" }),
                        React.createElement("span", null, "Text")
                    ),
                    React.createElement("a", { href: smsLink, className: "flex items-center space-x-1 px-2 py-1 rounded bg-teal-500 text-white hover:bg-teal-600 text-xs font-medium transition-colors" },
                        React.createElement(CarIcon, { className: "w-3 h-3" }),
                        React.createElement("span", null, "On My Way")
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
                React.createElement(MapPinIcon, { className: "w-4 h-4 text-slate-400 mr-3 mt-1" }),
                React.createElement("div", null,
                    React.createElement("span", { className: "text-xs text-slate-400 uppercase font-bold mb-0.5 block" }, "Billing Address"),
                    React.createElement("a", { 
                        href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:underline transition-colors whitespace-pre-line" 
                    }, contact.address)
                )
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
          contactAddress: contact.address
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