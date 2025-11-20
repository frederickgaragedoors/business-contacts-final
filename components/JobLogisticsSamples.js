
import React from 'react';
import { XIcon, CalendarIcon, MapPinIcon, UserCircleIcon, PhoneIcon, MessageIcon, MailIcon, CarIcon, BriefcaseIcon } from './icons.js';

const JobLogisticsSamples = ({ onClose }) => {
  // Mock Data
  const sampleData = {
    contact: {
      name: "Jane Doe",
      phone: "(555) 123-4567",
      email: "jane.doe@example.com",
      address: "123 Maple Ave, Springfield, IL"
    },
    job: {
      id: "JOB-1042",
      date: "Oct 27, 2023",
      time: "09:00 AM",
      location: "456 Oak St, Springfield, IL", // Different service location
      siteContact: "John Smith",
      notes: "Customer reported loud grinding noise when door opens. Spring looks rusty. Please check rollers as well."
    }
  };

  return (
    React.createElement("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto" },
      React.createElement("div", { className: "bg-slate-100 dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]" },
        
        React.createElement("div", { className: "p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center sticky top-0 z-10 rounded-t-lg" },
          React.createElement("h2", { className: "text-xl font-bold text-slate-800 dark:text-slate-100" }, "Layout Options Preview"),
          React.createElement("button", { onClick: onClose, className: "p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400" },
            React.createElement(XIcon, { className: "w-6 h-6" })
          )
        ),

        React.createElement("div", { className: "p-6 space-y-12 overflow-y-auto" },
          
          /* OPTION 1 */
          React.createElement("section", null,
            React.createElement("div", { className: "flex items-center mb-2" },
                React.createElement("span", { className: "bg-sky-500 text-white text-xs font-bold px-2 py-1 rounded mr-2" }, "Option 1"),
                React.createElement("h3", { className: "text-lg font-semibold text-slate-700 dark:text-slate-200" }, "The \"Icon Grid\" Layout")
            ),
            React.createElement("p", { className: "text-sm text-slate-500 mb-4" }, "Focuses on scanning speed using icons. Distinct footer for billing info."),
            
            /* CARD 1 IMPLEMENTATION */
            React.createElement("div", { className: "bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden" },
                /* Top: Notes */
                React.createElement("div", { className: "p-4 border-b border-slate-100 dark:border-slate-700 bg-amber-50 dark:bg-amber-900/10" },
                    React.createElement("p", { className: "text-xs font-bold text-amber-600 dark:text-amber-400 uppercase mb-1" }, "Notes"),
                    React.createElement("p", { className: "text-slate-700 dark:text-slate-300 text-sm" }, sampleData.job.notes)
                ),

                /* Middle: Grid */
                React.createElement("div", { className: "p-4 grid grid-cols-2 gap-4" },
                    React.createElement("div", { className: "flex items-start space-x-3" },
                        React.createElement(CalendarIcon, { className: "w-5 h-5 text-sky-500 mt-0.5" }),
                        React.createElement("div", null,
                            React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400 uppercase font-bold" }, "When"),
                            React.createElement("p", { className: "font-bold text-slate-800 dark:text-slate-100" }, sampleData.job.date),
                            React.createElement("p", { className: "text-sm text-slate-600 dark:text-slate-300" }, sampleData.job.time)
                        )
                    ),
                    React.createElement("div", { className: "flex items-start space-x-3" },
                        React.createElement(BriefcaseIcon, { className: "w-5 h-5 text-sky-500 mt-0.5" }),
                        React.createElement("div", null,
                            React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400 uppercase font-bold" }, "Job ID"),
                            React.createElement("p", { className: "font-bold text-slate-800 dark:text-slate-100" }, sampleData.job.id)
                        )
                    ),
                    React.createElement("div", { className: "flex items-start space-x-3 col-span-2 sm:col-span-1" },
                        React.createElement(MapPinIcon, { className: "w-5 h-5 text-sky-500 mt-0.5" }),
                        React.createElement("div", null,
                            React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400 uppercase font-bold" }, "Location"),
                            React.createElement("p", { className: "text-sm font-medium text-slate-800 dark:text-slate-100" }, sampleData.job.location),
                            React.createElement("p", { className: "text-xs text-amber-600 dark:text-amber-400 font-bold mt-0.5" }, "Different from billing")
                        )
                    ),
                    React.createElement("div", { className: "flex items-start space-x-3 col-span-2 sm:col-span-1" },
                        React.createElement(UserCircleIcon, { className: "w-5 h-5 text-sky-500 mt-0.5" }),
                        React.createElement("div", null,
                            React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400 uppercase font-bold" }, "Site Contact"),
                            React.createElement("p", { className: "text-sm font-medium text-slate-800 dark:text-slate-100" }, sampleData.job.siteContact),
                            React.createElement("div", { className: "flex space-x-2 mt-1" },
                                React.createElement("button", { className: "text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded" }, "Call"),
                                React.createElement("button", { className: "text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded" }, "Text")
                            )
                        )
                    )
                ),

                /* Footer: Billing */
                React.createElement("div", { className: "bg-slate-50 dark:bg-slate-750 border-t border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between" },
                    React.createElement("div", { className: "flex items-center space-x-3" },
                        React.createElement("div", { className: "w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold" }, "JD"),
                        React.createElement("div", null,
                            React.createElement("p", { className: "text-xs text-slate-500 uppercase font-bold" }, "Bill To"),
                            React.createElement("p", { className: "text-sm font-bold text-slate-700 dark:text-slate-200" }, sampleData.contact.name)
                        )
                    ),
                    React.createElement("div", { className: "text-right text-xs text-slate-500" },
                        React.createElement("p", null, sampleData.contact.phone),
                        React.createElement("p", null, sampleData.contact.email)
                    )
                )
            )
          ),


          /* OPTION 2 */
          React.createElement("section", null,
            React.createElement("div", { className: "flex items-center mb-2" },
                React.createElement("span", { className: "bg-sky-500 text-white text-xs font-bold px-2 py-1 rounded mr-2" }, "Option 2"),
                React.createElement("h3", { className: "text-lg font-semibold text-slate-700 dark:text-slate-200" }, "The \"Ticket Stub\" Layout")
            ),
            React.createElement("p", { className: "text-sm text-slate-500 mb-4" }, "Uses a dark header strip for high contrast. Clear separation of \"Work\" vs \"People\"."),

            /* CARD 2 IMPLEMENTATION */
            React.createElement("div", { className: "bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden" },
                /* Header Strip */
                React.createElement("div", { className: "bg-slate-800 text-white p-3 flex justify-between items-center" },
                    React.createElement("div", { className: "flex space-x-4" },
                        React.createElement("div", null,
                            React.createElement("span", { className: "text-[10px] uppercase opacity-70 block" }, "Date"),
                            React.createElement("span", { className: "font-bold" }, sampleData.job.date)
                        ),
                        React.createElement("div", null,
                            React.createElement("span", { className: "text-[10px] uppercase opacity-70 block" }, "Time"),
                            React.createElement("span", { className: "font-bold" }, sampleData.job.time)
                        )
                    ),
                    React.createElement("div", { className: "text-right" },
                        React.createElement("span", { className: "text-[10px] uppercase opacity-70 block" }, "Ticket #"),
                        React.createElement("span", { className: "font-mono font-bold text-sky-400" }, sampleData.job.id)
                    )
                ),

                /* Body */
                React.createElement("div", { className: "p-5" },
                    React.createElement("div", { className: "mb-4" },
                        React.createElement("p", { className: "text-xs font-bold text-slate-400 uppercase mb-1" }, "Work Notes"),
                        React.createElement("p", { className: "text-slate-800 dark:text-slate-200 text-base" }, sampleData.job.notes)
                    ),
                    
                    React.createElement("div", { className: "border-t border-slate-100 dark:border-slate-700 pt-4 flex flex-col sm:flex-row gap-6" },
                        /* Location Col */
                        React.createElement("div", { className: "flex-1" },
                             React.createElement("p", { className: "text-xs font-bold text-slate-400 uppercase mb-2 flex items-center" },
                                React.createElement(MapPinIcon, { className: "w-3 h-3 mr-1" }), " Site Location"
                             ),
                             React.createElement("p", { className: "font-semibold text-sm" }, sampleData.job.location),
                             React.createElement("p", { className: "text-xs text-slate-500 mt-1" }, `Contact: ${sampleData.job.siteContact}`)
                        ),
                        
                        /* Client Col */
                        React.createElement("div", { className: "flex-1 sm:border-l border-slate-100 dark:border-slate-700 sm:pl-6" },
                             React.createElement("p", { className: "text-xs font-bold text-slate-400 uppercase mb-2 flex items-center" },
                                React.createElement(UserCircleIcon, { className: "w-3 h-3 mr-1" }), " Client / Billing"
                             ),
                             React.createElement("div", { className: "flex justify-between items-start" },
                                React.createElement("div", null,
                                    React.createElement("p", { className: "font-semibold text-sm" }, sampleData.contact.name),
                                    React.createElement("p", { className: "text-xs text-slate-500 mt-1" }, sampleData.contact.phone)
                                ),
                                React.createElement("div", { className: "flex space-x-1" },
                                    React.createElement("button", { className: "p-1 bg-slate-100 rounded text-slate-600" }, React.createElement(PhoneIcon, { className: "w-3 h-3" })),
                                    React.createElement("button", { className: "p-1 bg-slate-100 rounded text-slate-600" }, React.createElement(MessageIcon, { className: "w-3 h-3" }))
                                )
                             )
                        )
                    )
                )
            )
          ),


          /* OPTION 3 */
          React.createElement("section", null,
            React.createElement("div", { className: "flex items-center mb-2" },
                React.createElement("span", { className: "bg-sky-500 text-white text-xs font-bold px-2 py-1 rounded mr-2" }, "Option 3"),
                React.createElement("h3", { className: "text-lg font-semibold text-slate-700 dark:text-slate-200" }, "Split Cards (Separation of Concerns)")
            ),
            React.createElement("p", { className: "text-sm text-slate-500 mb-4" }, "Physically separates the Job details from the Client details into two distinct boxes."),

            /* CARD 3 IMPLEMENTATION */
            React.createElement("div", { className: "space-y-3" },
                /* Box 1: The Job */
                React.createElement("div", { className: "bg-white dark:bg-slate-800 rounded-lg shadow-sm border-l-4 border-l-sky-500 border-y border-r border-slate-200 dark:border-slate-700 p-4" },
                    React.createElement("div", { className: "flex justify-between items-start mb-3" },
                        React.createElement("h4", { className: "font-bold text-slate-800 dark:text-slate-100 flex items-center" },
                            React.createElement(BriefcaseIcon, { className: "w-4 h-4 mr-2 text-sky-500" }),
                            "Job Details"
                        ),
                        React.createElement("span", { className: "text-xs font-mono text-slate-400" }, sampleData.job.id)
                    ),
                    React.createElement("div", { className: "grid grid-cols-2 gap-4 text-sm mb-3" },
                        React.createElement("div", null,
                            React.createElement("span", { className: "text-xs text-slate-400 block" }, "When"),
                            React.createElement("span", { className: "font-medium" }, `${sampleData.job.date} @ ${sampleData.job.time}`)
                        ),
                        React.createElement("div", null,
                            React.createElement("span", { className: "text-xs text-slate-400 block" }, "Where"),
                            React.createElement("span", { className: "font-medium" }, sampleData.job.location)
                        )
                    ),
                    React.createElement("div", { className: "bg-slate-50 dark:bg-slate-700/50 p-2 rounded text-sm text-slate-600 dark:text-slate-300" },
                        sampleData.job.notes
                    )
                ),

                /* Box 2: The Client */
                React.createElement("div", { className: "bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between" },
                    React.createElement("div", null,
                        React.createElement("h4", { className: "font-bold text-slate-800 dark:text-slate-100 flex items-center text-sm mb-1" },
                            React.createElement(UserCircleIcon, { className: "w-4 h-4 mr-2 text-slate-400" }),
                            `Client: ${sampleData.contact.name}`
                        ),
                        React.createElement("p", { className: "text-xs text-slate-500 ml-6" }, sampleData.contact.address)
                    ),
                    React.createElement("div", { className: "flex space-x-2" },
                         React.createElement("button", { className: "flex items-center space-x-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-medium text-slate-600 dark:text-slate-300" },
                            React.createElement(PhoneIcon, { className: "w-3 h-3" }),
                            React.createElement("span", null, "Call")
                         ),
                         React.createElement("button", { className: "flex items-center space-x-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-medium text-slate-600 dark:text-slate-300" },
                            React.createElement(CarIcon, { className: "w-3 h-3" }),
                            React.createElement("span", null, "Map")
                         )
                    )
                )
            )
          )

        ),
        
        React.createElement("div", { className: "p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-b-lg flex justify-end" },
            React.createElement("button", { onClick: onClose, className: "px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600" },
                "Close Preview"
            )
        )

      )
    )
  );
};

export default JobLogisticsSamples;
