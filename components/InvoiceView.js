import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ArrowLeftIcon } from './icons.js';
import { generateId, fileToDataUrl } from '../utils.js';

const InvoiceView = ({ contact, ticket, businessInfo, onClose, addFilesToContact }) => {
    const [docType, setDocType] = useState('invoice');
    const [isSaving, setIsSaving] = useState(false);
    const invoiceContentRef = useRef(null);

    const handlePrint = () => {
        const printStyles = `
            @media print {
                body * {
                    visibility: hidden;
                }
                .invoice-paper, .invoice-paper * {
                    visibility: visible;
                }
                .invoice-paper {
                    position: absolute;
                    left: 0;
                    top: 0;
                    right: 0;
                    width: 100%;
                    margin: 0;
                    padding: 0;
                    box-shadow: none;
                }
            }
        `;
        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = printStyles;
        document.head.appendChild(styleSheet);
        window.print();
        document.head.removeChild(styleSheet);
    };

    const handleSaveAndAttach = async () => {
        if (!invoiceContentRef.current || isSaving) return;
        
        setIsSaving(true);
        
        try {
            const canvas = await html2canvas(invoiceContentRef.current, {
                scale: 2,
                useCORS: true,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'letter'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            const width = pdfWidth;
            const height = width / ratio;

            pdf.addImage(imgData, 'PNG', 0, 0, width, height);
            
            const docTypeName = docType.charAt(0).toUpperCase() + docType.slice(1);
            const fileName = `${contact.name} - ${docTypeName} ${ticket.id}.pdf`;
            
            pdf.save(fileName);

            const pdfBlob = pdf.output('blob');
            const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
            const dataUrl = await fileToDataUrl(pdfFile);

            const newFileAttachment = {
                id: generateId(),
                name: pdfFile.name,
                type: pdfFile.type,
                size: pdfFile.size,
                dataUrl: dataUrl
            };
            
            addFilesToContact(contact.id, [newFileAttachment]);

        } catch (error) {
            console.error("Failed to generate or save PDF", error);
            alert("Sorry, there was an error creating the PDF.");
        } finally {
            setIsSaving(false);
        }
    };

    const subtotal = ticket.parts.reduce((sum, part) => sum + part.cost, 0) + ticket.laborCost;
    const taxAmount = subtotal * ((ticket.salesTaxRate || 0) / 100);
    const totalAfterTaxes = subtotal + taxAmount;
    const feeAmount = totalAfterTaxes * ((ticket.processingFeeRate || 0) / 100);
    const totalCost = totalAfterTaxes + feeAmount;

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
                        onClick: handlePrint,
                        className: "px-4 py-2 rounded-md text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200"
                    }, "Print"),
                    React.createElement("button", { 
                        onClick: handleSaveAndAttach,
                        disabled: isSaving,
                        className: "px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 disabled:cursor-wait"
                    }, isSaving ? 'Saving...' : 'Save & Attach PDF')
                )
            ),

            // Invoice Paper
            React.createElement("div", { className: "p-4 md:p-8 flex-grow" },
                React.createElement("div", { ref: invoiceContentRef, className: "max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-lg print:shadow-none invoice-paper" },
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
                                React.createElement("span", { className: "font-semibold" }, "Job ID: "), ticket.id
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
                        React.createElement("div", { className: "w-full max-w-xs space-y-2" },
                            React.createElement("div", { className: "flex justify-between py-2 border-b" },
                                React.createElement("span", { className: "text-sm font-medium text-slate-600" }, "Subtotal"),
                                React.createElement("span", { className: "text-sm font-medium text-slate-700" }, `$${subtotal.toFixed(2)}`)
                            ),
                            (ticket.salesTaxRate || 0) > 0 && (
                                React.createElement("div", { className: "flex justify-between py-2 border-b" },
                                    React.createElement("span", { className: "text-sm font-medium text-slate-600" }, `Sales Tax (${ticket.salesTaxRate}%)`),
                                    React.createElement("span", { className: "text-sm font-medium text-slate-700" }, `$${taxAmount.toFixed(2)}`)
                                )
                            ),
                            (ticket.processingFeeRate || 0) > 0 && (
                                React.createElement("div", { className: "flex justify-between py-2 border-b" },
                                    React.createElement("span", { className: "text-sm font-medium text-slate-600" }, `Processing Fee (${ticket.processingFeeRate}%)`),
                                    React.createElement("span", { className: "text-sm font-medium text-slate-700" }, `$${feeAmount.toFixed(2)}`)
                                )
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
            )
        )
    );
};

export default InvoiceView;
