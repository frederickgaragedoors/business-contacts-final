
import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ArrowLeftIcon } from './icons.js';
import { generateId, fileToDataUrl, calculateJobTicketTotal } from '../utils.js';

const InvoiceView = ({ contact, ticket, businessInfo, onClose, addFilesToContact }) => {
    const [docType, setDocType] = useState('receipt');
    const [isSaving, setIsSaving] = useState(false);
    const invoiceContentRef = useRef(null);

    const generatePdf = async () => {
        const sourceElement = invoiceContentRef.current;
        if (!sourceElement) return null;

        // Create an off-screen container for rendering
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '8.5in'; // Simulate paper width for consistent rendering
        container.style.backgroundColor = 'white';

        // Clone the source element to render it in our controlled container
        const clone = sourceElement.cloneNode(true);
        container.appendChild(clone);
        document.body.appendChild(container);

        try {
            // Render the cloned element, which is in a fixed-width, off-screen environment
            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'letter'
            });

            const imgWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            const docTypeName = docType.charAt(0).toUpperCase() + docType.slice(1);
            const fileName = `${contact.name} - ${docTypeName} ${ticket.id}.pdf`;

            return { pdf, fileName };
        } catch (error) {
            console.error("Failed to generate or save PDF", error);
            alert("Sorry, there was an error creating the PDF.");
            return null;
        } finally {
            // Clean up by removing the off-screen container
            document.body.removeChild(container);
        }
    };

    const handleDownload = async () => {
        if (isSaving) return;
        setIsSaving(true);
        const pdfData = await generatePdf();
        if (pdfData) {
            pdfData.pdf.save(pdfData.fileName);
        }
        setIsSaving(false);
    };

    const handleAttach = async () => {
        if (isSaving) return;
        setIsSaving(true);
        const pdfData = await generatePdf();
        if (pdfData) {
            const { pdf, fileName } = pdfData;
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
            
            await addFilesToContact(contact.id, [newFileAttachment]);
            alert('PDF attached successfully!');
        }
        setIsSaving(false);
    };

    const { subtotal, taxAmount, feeAmount, totalCost } = calculateJobTicketTotal(ticket);

    return (
        React.createElement("div", { className: "h-full flex flex-col bg-slate-200 dark:bg-slate-900 overflow-y-auto print:bg-white" },
            // Toolbar
            React.createElement("div", { className: "p-4 border-b border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 print:hidden" },
                React.createElement("div", { className: "flex flex-col sm:flex-row items-center sm:justify-between gap-4 sm:gap-0" },
                    React.createElement("div", { className: "w-full sm:w-auto flex items-center justify-center sm:justify-start relative" },
                        React.createElement("button", { onClick: onClose, className: "absolute left-0 sm:static p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" },
                            React.createElement(ArrowLeftIcon, { className: "w-6 h-6 text-slate-600 dark:text-slate-300" })
                        ),
                        React.createElement("div", { className: "flex items-center space-x-1 p-1 bg-slate-200 dark:bg-slate-700 rounded-lg sm:ml-4" },
                            React.createElement("button", {
                                onClick: () => setDocType('estimate'),
                                className: `px-3 py-1 rounded-md text-sm font-medium transition-colors ${docType === 'estimate' ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`
                            }, "Estimate"),
                            React.createElement("button", {
                                onClick: () => setDocType('receipt'),
                                className: `px-3 py-1 rounded-md text-sm font-medium transition-colors ${docType === 'receipt' ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`
                            }, "Receipt")
                        )
                    ),
                    React.createElement("div", { className: "w-full sm:w-auto flex items-center justify-center sm:justify-end space-x-2" },
                        React.createElement("button", {
                            onClick: () => window.print(),
                            className: "px-4 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
                        }, "Print"),
                        React.createElement("button", {
                            onClick: handleDownload,
                            disabled: isSaving,
                            className: "px-4 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-wait"
                        }, isSaving ? 'Working...' : 'Download'),
                        React.createElement("button", {
                            onClick: handleAttach,
                            disabled: isSaving,
                            className: "px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 disabled:cursor-wait"
                        }, isSaving ? 'Working...' : 'Attach PDF')
                    )
                )
            ),


            // Invoice Paper
            React.createElement("div", { className: "p-4 md:p-8 flex-grow print:p-0" },
                React.createElement("div", { ref: invoiceContentRef, className: "max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-lg print:shadow-none invoice-paper" },
                    React.createElement("header", { className: "flex justify-between items-baseline pb-6 border-b border-slate-200 text-slate-800" },
                        React.createElement("div", { className: "min-w-0" },
                            businessInfo.logoUrl && React.createElement("img", { src: businessInfo.logoUrl, alt: "Business Logo", className: "h-16 w-auto mb-4" }),
                            React.createElement("h1", { className: "text-2xl font-bold break-words" }, businessInfo.name || 'Your Company'),
                            React.createElement("p", { className: "text-sm text-slate-500 whitespace-pre-line break-words" }, businessInfo.address),
                            React.createElement("p", { className: "text-sm text-slate-500 break-words" }, businessInfo.phone),
                            React.createElement("p", { className: "text-sm text-slate-500 break-words" }, businessInfo.email)
                        ),
                        React.createElement("div", { className: "text-right flex-shrink-0 ml-4" },
                            React.createElement("h2", { className: "text-4xl uppercase font-bold text-slate-700" }, docType),
                            React.createElement("p", { className: "text-sm text-slate-500 mt-2" },
                                React.createElement("span", { className: "font-semibold text-slate-600" }, "Job ID:"), ` ${ticket.id}`
                            ),
                            React.createElement("p", { className: "text-sm text-slate-500" },
                                React.createElement("span", { className: "font-semibold text-slate-600" }, "Date:"), ` ${new Date(ticket.date).toLocaleDateString(undefined, { timeZone: 'UTC'})}`
                            )
                        )
                    ),

                    React.createElement("section", { className: "mt-6" },
                        React.createElement("h3", { className: "text-sm font-semibold uppercase text-slate-500" }, "Bill To"),
                        React.createElement("div", { className: "mt-2 text-slate-700 min-w-0" },
                            React.createElement("p", { className: "font-bold break-words" }, contact.name),
                            React.createElement("p", { className: "text-sm whitespace-pre-line break-words" }, contact.address),
                            React.createElement("p", { className: "text-sm break-words" }, contact.phone),
                            React.createElement("p", { className: "text-sm break-words" }, contact.email)
                        )
                    ),

                    React.createElement("section", { className: "mt-6" },
                        React.createElement("table", { className: "w-full text-left table-fixed" },
                            React.createElement("thead", null,
                                React.createElement("tr", null,
                                    React.createElement("th", { className: "p-3 text-sm font-semibold text-slate-600 uppercase border-b-2 border-slate-200 w-1/2" }, "Description"),
                                    React.createElement("th", { className: "p-3 text-center text-sm font-semibold text-slate-600 uppercase border-b-2 border-slate-200 w-[15%]" }, "Qty"),
                                    React.createElement("th", { className: "p-3 text-right text-sm font-semibold text-slate-600 uppercase border-b-2 border-slate-200 w-[20%]" }, "Unit Price"),
                                    React.createElement("th", { className: "p-3 text-right text-sm font-semibold text-slate-600 uppercase border-b-2 border-slate-200 w-[20%]" }, "Amount")
                                )
                            ),
                            React.createElement("tbody", null,
                                ticket.parts.map(part => (
                                    React.createElement("tr", { key: part.id, className: "border-b border-slate-100" },
                                        React.createElement("td", { className: "p-3 text-sm text-slate-700 break-words" }, part.name),
                                        React.createElement("td", { className: "p-3 text-center text-sm text-slate-700" }, part.quantity),
                                        React.createElement("td", { className: "p-3 text-right text-sm text-slate-700" }, `$${part.cost.toFixed(2)}`),
                                        React.createElement("td", { className: "p-3 text-right text-sm text-slate-700" }, `$${(part.cost * part.quantity).toFixed(2)}`)
                                    )
                                )),
                                React.createElement("tr", { className: "border-b border-slate-100" },
                                    React.createElement("td", { className: "p-3 text-sm text-slate-700", colSpan: 3 }, "Labor"),
                                    React.createElement("td", { className: "p-3 text-right text-sm text-slate-700" }, `$${ticket.laborCost.toFixed(2)}`)
                                )
                            )
                        )
                    ),

                    React.createElement("section", { className: "mt-6 flex justify-end" },
                        docType === 'estimate' && (ticket.processingFeeRate || 0) > 0 ? (
                            React.createElement("div", { className: "w-full max-w-sm space-y-3 text-slate-700 border-t-2 border-slate-200 pt-4" },
                                React.createElement("div", { className: "flex justify-between pb-2" },
                                    React.createElement("span", { className: "text-sm font-medium text-slate-600" }, "Subtotal"),
                                    React.createElement("span", { className: "text-sm font-medium" }, `$${subtotal.toFixed(2)}`)
                                ),
                                (ticket.salesTaxRate || 0) > 0 && (
                                    React.createElement("div", { className: "flex justify-between pb-2" },
                                        React.createElement("span", { className: "text-sm font-medium text-slate-600" }, `Sales Tax (${ticket.salesTaxRate}%)`),
                                        React.createElement("span", { className: "text-sm font-medium" }, `$${taxAmount.toFixed(2)}`)
                                    )
                                ),
                                React.createElement("h4", { className: "font-bold text-lg text-slate-800 text-center pt-2" }, "Payment Options"),
                                React.createElement("div", { className: "flex justify-between py-2 border-t" },
                                    React.createElement("span", { className: "text-base font-semibold" }, "Pay by Check/Cash"),
                                    React.createElement("span", { className: "text-base font-semibold" }, `$${(subtotal + taxAmount).toFixed(2)}`)
                                ),
                                React.createElement("div", { className: "flex justify-between py-2 border-t text-green-700 dark:text-green-400" },
                                    React.createElement("span", { className: "text-base font-semibold" }, "Pay by Card"),
                                    React.createElement("span", { className: "text-base font-semibold" }, `$${totalCost.toFixed(2)}`)
                                ),
                                React.createElement("p", { className: "text-xs text-slate-500 text-center pt-2" }, `A ${ticket.processingFeeRate}% card processing fee is included in the card payment total.`)
                            )
                        ) : (
                            React.createElement("div", { className: "w-full max-w-xs space-y-2 text-slate-700" },
                                React.createElement("div", { className: "flex justify-between py-2 border-b border-slate-100" },
                                    React.createElement("span", { className: "text-sm font-medium text-slate-600" }, "Subtotal"),
                                    React.createElement("span", { className: "text-sm font-medium" }, `$${subtotal.toFixed(2)}`)
                                ),
                                (ticket.salesTaxRate || 0) > 0 && (
                                    React.createElement("div", { className: "flex justify-between py-2 border-b border-slate-100" },
                                        React.createElement("span", { className: "text-sm font-medium text-slate-600" }, `Sales Tax (${ticket.salesTaxRate}%)`),
                                        React.createElement("span", { className: "text-sm font-medium" }, `$${taxAmount.toFixed(2)}`)
                                    )
                                ),
                                (ticket.processingFeeRate || 0) > 0 && (
                                    React.createElement("div", { className: "flex justify-between py-2 border-b border-slate-100" },
                                        React.createElement("span", { className: "text-sm font-medium text-slate-600" }, `Card Processing Fee (${ticket.processingFeeRate}%)`),
                                        React.createElement("span", { className: "text-sm font-medium" }, `$${feeAmount.toFixed(2)}`)
                                    )
                                ),
                                React.createElement("div", { className: "flex justify-between py-3 mt-2 border-t-2 border-slate-300" },
                                    React.createElement("span", { className: "text-base font-bold text-slate-800" }, "Total"),
                                    React.createElement("span", { className: "text-base font-bold text-slate-800" }, `$${totalCost.toFixed(2)}`)
                                )
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
