import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Contact, JobTicket, BusinessInfo, FileAttachment } from '../types.ts';
import { ArrowLeftIcon } from './icons.tsx';
import { generateId, fileToDataUrl, calculateJobTicketTotal } from '../utils.ts';


interface InvoiceViewProps {
    contact: Contact;
    ticket: JobTicket;
    businessInfo: BusinessInfo;
    onClose: () => void;
    addFilesToContact: (contactId: string, files: FileAttachment[]) => void;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ contact, ticket, businessInfo, onClose, addFilesToContact }) => {
    const [docType, setDocType] = useState<'receipt' | 'estimate'>('receipt');
    const [isSaving, setIsSaving] = useState(false);
    const invoiceContentRef = useRef<HTMLDivElement>(null);

    const generatePdf = async () => {
        if (!invoiceContentRef.current) return null;
        
        try {
            const canvas = await html2canvas(invoiceContentRef.current, {
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

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            
            const width = pdfWidth;
            const height = width / ratio;

            pdf.addImage(imgData, 'PNG', 0, 0, width, height);
            
            const docTypeName = docType.charAt(0).toUpperCase() + docType.slice(1);
            const fileName = `${contact.name} - ${docTypeName} ${ticket.id}.pdf`;

            return { pdf, fileName };
        } catch (error) {
            console.error("Failed to generate PDF", error);
            alert("Sorry, there was an error creating the PDF.");
            return null;
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

    const { subtotal, taxAmount, feeAmount, totalCost } = calculateJobTicketTotal(ticket);

    return (
        <div className="h-full flex flex-col bg-slate-200 dark:bg-slate-900 overflow-y-auto print:bg-white">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 print:hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between">
                    <div className="flex items-center">
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                            <ArrowLeftIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                        <div className="flex items-center space-x-1 p-1 bg-slate-200 dark:bg-slate-700 rounded-lg ml-4">
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
                    <div className="mt-4 sm:mt-0 flex items-center justify-end space-x-2 w-full sm:w-auto">
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
                            {isSaving ? 'Working...' : 'Download'}
                        </button>
                        <button 
                            onClick={handleAttach}
                            disabled={isSaving}
                            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 disabled:cursor-wait"
                        >
                            {isSaving ? 'Working...' : 'Attach PDF'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Invoice Paper */}
            <div className="p-4 md:p-8 flex-grow print:p-0">
                <div ref={invoiceContentRef} className="max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-lg print:shadow-none invoice-paper">
                    <header className="flex justify-between items-start pb-8 border-b text-slate-800">
                        <div>
                            {businessInfo.logoUrl && (
                                <img src={businessInfo.logoUrl} alt="Business Logo" className="h-16 w-auto mb-4" />
                            )}
                            <h1 className="text-2xl font-bold">{businessInfo.name || 'Your Company'}</h1>
                            <p className="text-sm text-slate-500 whitespace-pre-line">{businessInfo.address}</p>
                            <p className="text-sm text-slate-500">{businessInfo.phone}</p>
                            <p className="text-sm text-slate-500">{businessInfo.email}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-3xl uppercase font-bold text-slate-600">{docType}</h2>
                            <p className="text-sm text-slate-500 mt-2">
                                <span className="font-semibold text-slate-600">Job ID:</span> {ticket.id}
                            </p>
                            <p className="text-sm text-slate-500">
                                <span className="font-semibold text-slate-600">Date:</span> {new Date(ticket.date).toLocaleDateString(undefined, { timeZone: 'UTC'})}
                            </p>
                        </div>
                    </header>

                    <section className="mt-8">
                        <h3 className="text-sm font-semibold uppercase text-slate-500">Bill To</h3>
                        <div className="mt-2 text-slate-700">
                            <p className="font-bold">{contact.name}</p>
                            <p className="text-sm whitespace-pre-line">{contact.address}</p>
                            <p className="text-sm">{contact.phone}</p>
                            <p className="text-sm">{contact.email}</p>
                        </div>
                    </section>

                    <section className="mt-8">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="p-3 text-sm font-semibold text-slate-600">Description</th>
                                    <th className="p-3 text-right text-sm font-semibold text-slate-600">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ticket.parts.map(part => (
                                    <tr key={part.id} className="border-b">
                                        <td className="p-3 text-sm text-slate-700">{part.name}</td>
                                        <td className="p-3 text-right text-sm text-slate-700">${part.cost.toFixed(2)}</td>
                                    </tr>
                                ))}
                                 <tr className="border-b">
                                    <td className="p-3 text-sm text-slate-700">Labor</td>
                                    <td className="p-3 text-right text-sm text-slate-700">${ticket.laborCost.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    <section className="mt-8 flex justify-end">
                       {docType === 'estimate' && (ticket.processingFeeRate || 0) > 0 ? (
                            <div className="w-full max-w-sm space-y-3 text-slate-700 p-4 bg-slate-50 rounded-lg border">
                                <h4 className="font-bold text-lg text-slate-800 text-center">Payment Options</h4>
                                <div className="flex justify-between py-2 border-t">
                                    <span className="text-base font-semibold">Pay by Check/Cash</span>
                                    <span className="text-base font-semibold">${(subtotal + taxAmount).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between py-2 border-t bg-green-50 px-2 rounded-md">
                                    <span className="text-base font-semibold text-green-800">Pay by Card</span>
                                    <span className="text-base font-semibold text-green-800">${totalCost.toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-slate-500 text-center pt-2">A {ticket.processingFeeRate}% card processing fee is included in the card payment total.</p>
                            </div>
                       ) : (
                            <div className="w-full max-w-xs space-y-2 text-slate-700">
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-sm font-medium text-slate-600">Subtotal</span>
                                    <span className="text-sm font-medium">${subtotal.toFixed(2)}</span>
                                </div>
                                {(ticket.salesTaxRate || 0) > 0 && (
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-sm font-medium text-slate-600">Sales Tax ({ticket.salesTaxRate}%)</span>
                                        <span className="text-sm font-medium">${taxAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                {(ticket.processingFeeRate || 0) > 0 && (
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-sm font-medium text-slate-600">Card Processing Fee ({ticket.processingFeeRate}%)</span>
                                        <span className="text-sm font-medium">${feeAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                 <div className="flex justify-between py-2 bg-slate-100 px-3 mt-2 rounded-md">
                                    <span className="text-lg font-bold text-slate-800">Total</span>
                                    <span className="text-lg font-bold text-slate-800">${totalCost.toFixed(2)}</span>
                                </div>
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
