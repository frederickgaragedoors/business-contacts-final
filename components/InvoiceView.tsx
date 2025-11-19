
import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Contact, JobTicket, BusinessInfo, FileAttachment, EmailSettings } from '../types.ts';
import { ArrowLeftIcon, MailIcon } from './icons.tsx';
import { generateId, fileToDataUrl, calculateJobTicketTotal } from '../utils.ts';


interface InvoiceViewProps {
    contact: Contact;
    ticket: JobTicket;
    businessInfo: BusinessInfo;
    emailSettings: EmailSettings;
    onClose: () => void;
    addFilesToContact: (contactId: string, files: FileAttachment[]) => void;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ contact, ticket, businessInfo, emailSettings, onClose, addFilesToContact }) => {
    const [docType, setDocType] = useState<'receipt' | 'estimate'>('receipt');
    const [isSaving, setIsSaving] = useState(false);
    const invoiceContentRef = useRef<HTMLDivElement>(null);

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
        const clone = sourceElement.cloneNode(true) as HTMLElement;
        container.appendChild(clone);
        document.body.appendChild(container);

        try {
            // Render the cloned element, which is in a fixed-width, off-screen environment
            const canvas = await html2canvas(clone, {
                scale: 2, // Higher scale for better quality
                useCORS: true,
                backgroundColor: '#ffffff',
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
            console.error("Failed to generate PDF", error);
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

            const newFileAttachment: FileAttachment = {
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
    
    const replacePlaceholders = (text: string) => {
        return text
            .replace(/{{customerName}}/g, contact.name)
            .replace(/{{jobId}}/g, ticket.id)
            .replace(/{{businessName}}/g, businessInfo.name || 'Our Company')
            .replace(/{{date}}/g, new Date().toLocaleDateString());
    };

    const handleShare = async () => {
        if (isSaving) return;
        setIsSaving(true);

        const template = docType === 'estimate' ? emailSettings.estimate : emailSettings.receipt;
        const subject = replacePlaceholders(template.subject);
        const body = replacePlaceholders(template.body);

        try {
            // Check if the browser supports sharing files
            // Note: This API often requires HTTPS
            if (navigator.share && navigator.canShare) {
                 const pdfData = await generatePdf();
                 if (!pdfData) {
                     setIsSaving(false);
                     return;
                 }
                 
                 const { pdf, fileName } = pdfData;
                 const pdfBlob = pdf.output('blob');
                 const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
                 
                 if (navigator.canShare({ files: [file] })) {
                     await navigator.share({
                         files: [file],
                         title: subject,
                         text: body,
                     });
                 } else {
                     // Fallback if sharing files specifically isn't supported but navigator.share is
                     // Usually just share text/url or fallback to mailto
                      throw new Error("File sharing not supported");
                 }
            } else {
                 throw new Error("Navigator.share not supported");
            }
        } catch (error) {
            // Fallback to mailto link for Desktop or incompatible browsers
            // Note: We cannot attach the file via mailto, user must attach manually.
            const mailtoLink = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailtoLink;
            
            // Also prompt download so they have the file to attach
            alert("Opening your email client. Please attach the PDF that will be downloaded.");
            const pdfData = await generatePdf();
            if (pdfData) {
                pdfData.pdf.save(pdfData.fileName);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const { subtotal, taxAmount, feeAmount, totalCost, deposit, balanceDue } = calculateJobTicketTotal(ticket);

    // Calculations for dual-estimate view
    const cashTotal = subtotal + taxAmount;
    const cardTotal = totalCost; // includes fee
    
    // Calculate the deposit ratio based on the saved ticket state (which includes the fee if present)
    // This allows us to scale the deposit for the cash price accurately.
    const depositRatio = totalCost > 0 ? deposit / totalCost : 0;

    // Card Deposit is the saved deposit (as that matches the saved total which includes fees)
    const cardDeposit = deposit; 
    const cardBalance = cardTotal - cardDeposit;

    // Cash Deposit is scaled by the ratio
    const cashDeposit = cashTotal * depositRatio;
    const cashBalance = cashTotal - cashDeposit;

    return (
        <div className="h-full flex flex-col bg-slate-200 dark:bg-slate-900 overflow-y-auto print:bg-white print:overflow-visible print:h-auto">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 print:hidden">
                <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 sm:gap-0">
                    <div className="w-full sm:w-auto flex items-center justify-center sm:justify-start relative">
                        <button onClick={onClose} className="absolute left-0 sm:static p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                            <ArrowLeftIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                        <div className="flex items-center justify-center w-full sm:w-auto">
                            <div className="flex items-center space-x-1 p-1 bg-slate-200 dark:bg-slate-700 rounded-lg sm:ml-4">
                                <button
                                    onClick={() => setDocType('estimate')}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${docType === 'estimate' ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                                >
                                    Estimate
                                </button>
                                <button
                                    onClick={() => setDocType('receipt')}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${docType === 'receipt' ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                                >
                                    Receipt
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="w-full sm:w-auto flex items-center justify-center sm:justify-end space-x-2">
                        <button 
                             onClick={handleShare}
                             disabled={isSaving}
                             className="px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 disabled:cursor-wait flex items-center space-x-2"
                        >
                             <MailIcon className="w-4 h-4" />
                             <span>{isSaving ? '...' : 'Share'}</span>
                        </button>
                        <button 
                            onClick={() => window.print()}
                            className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
                        >
                            Print
                        </button>
                        <button 
                            onClick={handleDownload}
                            disabled={isSaving}
                            className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isSaving ? '...' : 'Download'}
                        </button>
                        <button 
                            onClick={handleAttach}
                            disabled={isSaving}
                            className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isSaving ? '...' : 'Attach'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Invoice Paper */}
            <div className="p-4 md:p-8 flex-grow print:p-0">
                <div ref={invoiceContentRef} className="max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-lg print:shadow-none invoice-paper">
                    <header className="flex justify-between items-baseline pb-6 border-b border-slate-200 text-slate-800">
                        <div className="min-w-0">
                            {businessInfo.logoUrl && (
                                <img src={businessInfo.logoUrl} alt="Business Logo" className="h-16 w-auto mb-4" />
                            )}
                            <h1 className="text-2xl font-bold break-words">{businessInfo.name || 'Your Company'}</h1>
                            <p className="text-sm text-slate-500 whitespace-pre-line break-words">{businessInfo.address}</p>
                            <p className="text-sm text-slate-500 break-words">{businessInfo.phone}</p>
                            <p className="text-sm text-slate-500 break-words">{businessInfo.email}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                            <h2 className="text-4xl uppercase font-bold text-slate-700">{docType}</h2>
                            <p className="text-sm text-slate-500 mt-2">
                                <span className="font-semibold text-slate-600">Job ID:</span> {ticket.id}
                            </p>
                            <p className="text-sm text-slate-500">
                                <span className="font-semibold text-slate-600">Date:</span> {new Date(ticket.date).toLocaleDateString(undefined, { timeZone: 'UTC'})}
                            </p>
                        </div>
                    </header>

                    <section className="mt-6">
                        <h3 className="text-sm font-semibold uppercase text-slate-500">Bill To</h3>
                        <div className="mt-2 text-slate-700 min-w-0">
                            <p className="font-bold break-words">{contact.name}</p>
                            <p className="text-sm whitespace-pre-line break-words">{contact.address}</p>
                            <p className="text-sm break-words">{contact.phone}</p>
                            <p className="text-sm break-words">{contact.email}</p>
                        </div>
                    </section>

                    <section className="mt-6">
                        <table className="w-full text-left table-fixed">
                            <thead>
                                <tr>
                                    <th className="p-3 text-sm font-semibold text-slate-600 uppercase border-b-2 border-slate-200 w-1/2">Description</th>
                                    <th className="p-3 text-center text-sm font-semibold text-slate-600 uppercase border-b-2 border-slate-200 w-[15%]">Qty</th>
                                    <th className="p-3 text-right text-sm font-semibold text-slate-600 uppercase border-b-2 border-slate-200 w-[20%]">Unit Price</th>
                                    <th className="p-3 text-right text-sm font-semibold text-slate-600 uppercase border-b-2 border-slate-200 w-[20%]">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ticket.parts.map(part => (
                                    <tr key={part.id} className="border-b border-slate-100">
                                        <td className="p-3 text-sm text-slate-700 break-words">{part.name}</td>
                                        <td className="p-3 text-center text-sm text-slate-700">{part.quantity}</td>
                                        <td className="p-3 text-right text-sm text-slate-700">${part.cost.toFixed(2)}</td>
                                        <td className="p-3 text-right text-sm text-slate-700">${(part.cost * part.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                                 <tr className="border-b border-slate-100">
                                    <td className="p-3 text-sm text-slate-700" colSpan={3}>Labor</td>
                                    <td className="p-3 text-right text-sm text-slate-700">${ticket.laborCost.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    <section className="mt-6 flex flex-col items-end">
                       {docType === 'estimate' && (ticket.processingFeeRate || 0) > 0 ? (
                           <div className="w-full mt-4">
                                <div className="w-full max-w-sm ml-auto space-y-2 text-slate-700 border-b border-slate-200 pb-4 mb-6">
                                    <div className="flex justify-between pb-2">
                                        <span className="text-sm font-medium text-slate-600">Subtotal</span>
                                        <span className="text-sm font-medium">${subtotal.toFixed(2)}</span>
                                    </div>
                                    {(ticket.salesTaxRate || 0) > 0 && (
                                        <div className="flex justify-between pb-2">
                                            <span className="text-sm font-medium text-slate-600">Sales Tax ({ticket.salesTaxRate}%)</span>
                                            <span className="text-sm font-medium">${taxAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                <h4 className="text-center font-bold text-lg text-slate-800 mb-4 uppercase tracking-wide">Payment Options</h4>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Cash/Check Option */}
                                    <div className="border-2 border-slate-200 rounded-lg p-4 bg-slate-50">
                                        <h5 className="font-bold text-slate-700 text-center border-b border-slate-200 pb-2 mb-3">Cash / Check</h5>
                                        <div className="space-y-2 text-sm">
                                            {deposit > 0 ? (
                                                <>
                                                    <div className="flex justify-between text-slate-700">
                                                        <span className="font-medium">Required Deposit (30%)</span>
                                                        <span className="font-medium">${cashDeposit.toFixed(2)}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-500 text-right -mt-1 mb-2 italic">Due Now to Schedule</div>
                                                    
                                                    <div className="flex justify-between text-slate-500">
                                                        <span>Balance Due (70%)</span>
                                                        <span>${cashBalance.toFixed(2)}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 text-right -mt-1 mb-2 italic">Due Upon Completion</div>

                                                    <div className="flex justify-between items-end border-t border-slate-200 pt-2 mt-2">
                                                        <span className="text-slate-600 font-bold">Total</span>
                                                        <span className="font-bold text-lg text-slate-800">${cashTotal.toFixed(2)}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex justify-between items-end">
                                                    <span className="text-slate-600">Total</span>
                                                    <span className="font-bold text-lg text-slate-800">${cashTotal.toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Option */}
                                    <div className="border-2 border-sky-100 rounded-lg p-4 bg-sky-50">
                                        <h5 className="font-bold text-slate-700 text-center border-b border-sky-200 pb-2 mb-3">Card Payment</h5>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between text-slate-500">
                                                <span>Processing Fee ({ticket.processingFeeRate}%)</span>
                                                <span>${feeAmount.toFixed(2)}</span>
                                            </div>

                                            {deposit > 0 ? (
                                                <>
                                                    <div className="border-b border-sky-200 my-2"></div>

                                                    <div className="flex justify-between text-slate-700">
                                                        <span className="font-medium">Required Deposit (30%)</span>
                                                        <span className="font-medium">${cardDeposit.toFixed(2)}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-500 text-right -mt-1 mb-2 italic">Due Now to Schedule</div>

                                                    <div className="flex justify-between text-slate-500">
                                                        <span>Balance Due (70%)</span>
                                                        <span>${cardBalance.toFixed(2)}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 text-right -mt-1 mb-2 italic">Due Upon Completion</div>

                                                    <div className="flex justify-between items-end border-t border-sky-200 pt-2 mt-2">
                                                        <span className="text-slate-700 font-bold">Total Charge</span>
                                                        <span className="font-bold text-lg text-slate-800">${cardTotal.toFixed(2)}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">Job Total</span>
                                                        <span className="text-slate-800">${cashTotal.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-end border-t border-sky-200 pt-1 mt-1">
                                                        <span className="text-slate-700 font-medium">Total Charge</span>
                                                        <span className="font-bold text-lg text-slate-800">${cardTotal.toFixed(2)}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                           </div>
                       ) : (
                            <div className="w-full max-w-xs space-y-2 text-slate-700">
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-sm font-medium text-slate-600">Subtotal</span>
                                    <span className="text-sm font-medium">${subtotal.toFixed(2)}</span>
                                </div>
                                {(ticket.salesTaxRate || 0) > 0 && (
                                    <div className="flex justify-between py-2 border-b border-slate-100">
                                        <span className="text-sm font-medium text-slate-600">Sales Tax ({ticket.salesTaxRate}%)</span>
                                        <span className="text-sm font-medium">${taxAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                {(ticket.processingFeeRate || 0) > 0 && (
                                    <div className="flex justify-between py-2 border-b border-slate-100">
                                        <span className="text-sm font-medium text-slate-600">Card Processing Fee ({ticket.processingFeeRate}%)</span>
                                        <span className="text-sm font-medium">${feeAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                 <div className="flex justify-between py-3 mt-2 border-t-2 border-slate-300">
                                    <span className="text-base font-bold text-slate-800">Total</span>
                                    <span className="text-base font-bold text-slate-800">${totalCost.toFixed(2)}</span>
                                </div>
                                {docType === 'estimate' ? (
                                    deposit > 0 && (
                                        <div className="flex justify-between py-2 border-t text-slate-800 font-semibold bg-slate-50 px-2 -mx-2 rounded">
                                            <span>Required Deposit (30%)</span>
                                            <span>${deposit.toFixed(2)}</span>
                                        </div>
                                    )
                                ) : (
                                    <>
                                        {deposit > 0 && (
                                            <div className="flex justify-between py-2 border-b border-slate-100 text-green-600">
                                                <span className="text-sm font-medium">Deposit / Paid</span>
                                                <span className="text-sm font-medium">-${deposit.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between py-3 border-t border-slate-300">
                                            <span className="text-base font-bold text-slate-800">Balance Due</span>
                                            <span className="text-base font-bold text-slate-800">${balanceDue.toFixed(2)}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                       )}
                    </section>
                    
                    <footer className="mt-12 pt-8 border-t text-center">
                        <p className="text-sm text-slate-500">Thank you for your business!</p>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default InvoiceView;
