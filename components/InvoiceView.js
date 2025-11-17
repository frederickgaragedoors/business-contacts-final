import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon } from './icons.js';

const InvoiceView = ({ contact, ticket, businessInfo, onClose }) => {
    const [docType, setDocType] = useState('invoice');

    useEffect(() => {
        document.body.classList.add('invoice-view-active');
        // Cleanup function to remove the class when the component unmounts
        return () => {
            document.body.classList.remove('invoice-view-active');
        };
    }, []); // Empty dependency array means this runs once on mount and cleanup on unmount

    const totalPartsCost = ticket.parts.reduce((sum, part) => sum + part.cost, 0);
    const totalCost = totalPartsCost + ticket.laborCost;

    return (
        React.createElement("div", { className: "h-full flex flex-col bg-slate-200 overflow-y-auto" },
            // Toolbar
            React.createElement("div", { className: "p-4 flex items-center justify-between border-b border-slate-300 bg-white print:hidden" },
                React.createElement("button", { onClick: onClose, className: "p-2 rounded-full hover:bg-slate-100" },
                    React.createElement(ArrowLeftIcon, { className: "w-6 h-6 text-slate-600" })
                ),
                React.createElement("div", { className: "flex items-center space-x-2" },
                     React.createElement("div", { className: "flex items-center space-x-1 p-1 bg-slate-200 rounded-lg" },
                        React.createElement("button", {
                            onClick: () => setDocType('quote'),
                            className: `px-3 py-1 rounded-md text-sm font-medium transition-colors ${docType === 'quote' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`
                        }, "Quote"),
                        React.createElement("button", {
                             onClick: () => setDocType('invoice'),
                            className: `px-3 py-1 rounded-md text-sm font-medium transition-colors ${docType === 'invoice' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`
                        }, "Invoice")
                    ),
                    React.createElement("button", { 
                        onClick: () => window.print(),
                        className: "px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600"
                    }, "Print")
                )
            ),

            // Invoice Paper
            React.createElement("div", { className: "p-4 md:p-8 flex-grow invoice-container" },
                React.createElement("div", { className: "max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-lg print:shadow-none invoice-paper" },
                    React.createElement("header", { className: "flex justify-between items-start pb-8 border-b" },
                        React.createElement("div", null,
                            businessInfo.logoUrl && (
                                React.createElement("img", { src: businessInfo.logoUrl, alt: "Business Logo", className: "h-16 w-auto mb-4" })
                            ),
                            React.createElement("h1", { className: "text-2xl font-bold text-slate-800" }, businessInfo.name || 'Your Company'),
                            React.createElement("p", { className: "text-sm text-slate-500 whitespace-pre-line" }, businessInfo.address),
                            React.createElement("p", { className: "text-sm text-slate-500" }, businessInfo.phone),
                            React.createElement("p", { className: "text-sm text-slate-500" }, businessInfo.email)
                        ),
                        React.createElement("div", { className: "text-right" },
                            React.createElement("h2", { className: "text-3xl uppercase font-bold text-slate-600" }, docType),
                            React.createElement("p", { className: "text-sm text-slate-500 mt-2" },
                                React.createElement("span", { className: "font-semibold" }, "Job ID: "), ticket.id.slice(0, 8)
                            ),
                            React.createElement("p", { className: "text-sm text-slate-500" },
                                React.createElement("span", { className: "font-semibold" }, "Date: "), new Date(ticket.date).toLocaleDateString(undefined, { timeZone: 'UTC'})
                            )
                        )
                    ),

                    React.createElement("section", { className: "mt-8" },
                        React.createElement("h3", { className: "text-sm font-semibold uppercase text-slate-500" }, "Bill To"),
                        React.createElement("div", { className: "mt-2" },
                            React.createElement("p", { className: "font-bold text-slate-700" }, contact.name),
                            React.createElement("p", { className: "text-sm text-slate-600 whitespace-pre-line" }, contact.address),
                            React.createElement("p", { className: "text-sm text-slate-600" }, contact.phone),
                            React.createElement("p", { className: "text-sm text-slate-600" }, contact.email)
                        )
                    ),

                    React.createElement("section", { className: "mt-8" },
                        React.createElement("table", { className: "w-full text-left" },
                            React.createElement("thead", null,
                                React.createElement("tr", { className: "bg-slate-100" },
                                    React.createElement("th", { className: "p-3 text-sm font-semibold text-slate-600" }, "Description"),
                                    React.createElement("th", { className: "p-3 text-right text-sm font-semibold text-slate-600" }, "Amount")
                                )
                            ),
                            React.createElement("tbody", null,
                                ticket.parts.map(part => (
                                    React.createElement("tr", { key: part.id, className: "border-b" },
                                        React.createElement("td", { className: "p-3 text-sm text-slate-700" }, part.name),
                                        React.createElement("td", { className: "p-3 text-right text-sm text-slate-700" }, `$${part.cost.toFixed(2)}`)
                                    )
                                )),
                                 React.createElement("tr", { className: "border-b" },
                                    React.createElement("td", { className: "p-3 text-sm text-slate-700" }, "Labor"),
                                    React.createElement("td", { className: "p-3 text-right text-sm text-slate-700" }, `$${ticket.laborCost.toFixed(2)}`)
                                )
                            )
                        )
                    ),

                    React.createElement("section", { className: "mt-8 flex justify-end" },
                        React.createElement("div", { className: "w-full max-w-xs" },
                            React.createElement("div", { className: "flex justify-between py-2 border-b" },
                                React.createElement("span", { className: "text-sm font-medium text-slate-600" }, "Subtotal"),
                                React.createElement("span", { className: "text-sm font-medium text-slate-700" }, `$${totalCost.toFixed(2)}`)
                            ),
                             React.createElement("div", { className: "flex justify-between py-2 bg-slate-100 px-3 mt-2 rounded-md" },
                                React.createElement("span", { className: "text-lg font-bold text-slate-800" }, "Total"),
                                React.createElement("span", { className: "text-lg font-bold text-slate-800" }, `$${totalCost.toFixed(2)}`)
                            )
                        )
                    ),
                    
                    React.createElement("footer", { className: "mt-12 pt-8 border-t text-center" },
                        React.createElement("p", { className: "text-sm text-slate-500" }, "Thank you for your business!")
                    )
                )
            ),
            React.createElement("style", null, `
                @media print {
                    /* When invoice view is active, hide the main header and sidebar */
                    body.invoice-view-active > #root > div > header,
                    body.invoice-view-active > #root > div > div > div:first-child {
                        display: none;
                    }
                    
                    /* Expand the main content to fill the page */
                    body.invoice-view-active > #root > div > div > main {
                        width: 100%;
                        display: block !important; /* Override Tailwind responsive classes */
                    }
                    
                    /* Reset container styles for a clean print */
                    body.invoice-view-active,
                    body.invoice-view-active > #root,
                    body.invoice-view-active > #root > div,
                    body.invoice-view-active > #root > div > div {
                        background-color: white !important;
                        height: auto;
                        overflow: visible;
                        padding: 0;
                        margin: 0;
                    }
                    
                    /* Prepare the invoice component's layout for printing */
                    .invoice-container {
                        padding: 0 !important;
                    }
                    
                    .invoice-paper {
                        box-shadow: none !important;
                        margin: 0 !important;
                        max-width: 100% !important;
                        border-radius: 0;
                    }

                    /* Util classes from the original file */
                    .print\\:hidden {
                        display: none;
                    }
                    .print\\:shadow-none {
                        box-shadow: none;
                    }
                }
            `)
        )
    );
};

export default InvoiceView;
