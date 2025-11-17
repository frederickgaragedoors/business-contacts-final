import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Contact, JobTicket, BusinessInfo, FileAttachment } from '../types.ts';
import { ArrowLeftIcon } from './icons.tsx';
import { generateId, fileToDataUrl } from '../utils.ts';


interface InvoiceViewProps {
    contact: Contact;
    ticket: JobTicket;
    businessInfo: BusinessInfo;
    onClose: () => void;
    addFilesToContact: (contactId: string, files: FileAttachment[]) => void;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ contact, ticket, businessInfo, onClose, addFilesToContact }) => {
    const [docType, setDocType] = useState<'invoice' | 'quote'>('invoice');
    const [isSaving, setIsSaving] = useState(false);
    const invoiceContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        document.body.classList.add('invoice-view-active');
        return () => {
            document.body.classList.remove('invoice-view-active');
        };
    }, []);

    const handleSaveAndAttach = async () => {
        if (!invoiceContentRef.current || isSaving) return;
        
        setIsSaving(true);
        
        try {
            const canvas = await html2canvas(invoiceContentRef.current, {
                scale: 2, // Higher scale for better quality
                useCORS: true,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'letter'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            
            const width = pdfWidth;
            const height = width / ratio;

            pdf.addImage(imgData, 'PNG', 0, 0, width, height);
            
            const docTypeName = docType.charAt(0).toUpperCase() + docType.slice(1);
            const fileName = `${contact.name} - ${docTypeName} ${ticket.id}.pdf`;
            
            // Trigger download
            pdf.save(fileName);

            // Create FileAttachment and add to contact
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
        <div className="h-full flex flex-col bg-slate-200 overflow-y-auto print:overflow-visible">
            {/* Toolbar */}
            <div className="p-4 flex items-center justify-between border-b border-slate-300 bg-white print:hidden">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                    <ArrowLeftIcon className="w-6 h-6 text-slate-600" />
                </button>
                <div className="flex items-center space-x-2">
                     <div className="flex items-center space-x-1 p-1 bg-slate-200 rounded-lg">
                        <button
                            onClick={() => setDocType('quote')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${docType === 'quote' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`}
                        >
                            Quote
                        </button>
                        <button
                             onClick={() => setDocType('invoice')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${docType === 'invoice' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`}
                        >
                            Invoice
                        </button>
                    </div>
                    <button 
                        onClick={() => window.print()}
                        className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200"
                    >
                        Print
                    </button>
                    <button 
                        onClick={handleSaveAndAttach}
                        disabled={isSaving}
                        className="px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 disabled:cursor-wait"
                    >
                        {isSaving ? 'Saving...' : 'Save & Attach PDF'}
                    </button>
                </div>
            </div>

            {/* Invoice Paper */}
            <div className="p-4 md:p-8 flex-grow invoice-container">
                <div ref={invoiceContentRef} className="max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-lg print:shadow-none invoice-paper">
                    <header className="flex justify-between items-start pb-8 border-b">
                        <div>
                            {businessInfo.logoUrl && (
                                <img src={businessInfo.logoUrl} alt="Business Logo" className="h-16 w-auto mb-4" />
                            )}
                            <h1 className="text-2xl font-bold text-slate-800">{businessInfo.name || 'Your Company'}</h1>
                            <p className="text-sm text-slate-500 whitespace-pre-line">{businessInfo.address}</p>
                            <p className="text-sm text-slate-500">{businessInfo.phone}</p>
                            <p className="text-sm text-slate-500">{businessInfo.email}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-3xl uppercase font-bold text-slate-600">{docType}</h2>
                            <p className="text-sm text-slate-500 mt-2">
                                <span className="font-semibold">Job ID:</span> {ticket.id}
                            </p>
                            <p className="text-sm text-slate-500">
                                <span className="font-semibold">Date:</span> {new Date(ticket.date).toLocaleDateString(undefined, { timeZone: 'UTC'})}
                            </p>
                        </div>
                    </header>

                    <section className="mt-8">
                        <h3 className="text-sm font-semibold uppercase text-slate-500">Bill To</h3>
                        <div className="mt-2">
                            <p className="font-bold text-slate-700">{contact.name}</p>
                            <p className="text-sm text-slate-600 whitespace-pre-line">{contact.address}</p>
                            <p className="text-sm text-slate-600">{contact.phone}</p>
                            <p className="text-sm text-slate-600">{contact.email}</p>
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
                        <div className="w-full max-w-xs space-y-2">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-sm font-medium text-slate-600">Subtotal</span>
                                <span className="text-sm font-medium text-slate-700">${subtotal.toFixed(2)}</span>
                            </div>
                            {(ticket.salesTaxRate || 0) > 0 && (
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-sm font-medium text-slate-600">Sales Tax ({ticket.salesTaxRate}%)</span>
                                    <span className="text-sm font-medium text-slate-700">${taxAmount.toFixed(2)}</span>
                                </div>
                            )}
                            {(ticket.processingFeeRate || 0) > 0 && (
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-sm font-medium text-slate-600">Processing Fee ({ticket.processingFeeRate}%)</span>
                                    <span className="text-sm font-medium text-slate-700">${feeAmount.toFixed(2)}</span>
                                </div>
                            )}
                             <div className="flex justify-between py-2 bg-slate-100 px-3 mt-2 rounded-md">
                                <span className="text-lg font-bold text-slate-800">Total</span>
                                <span className="text-lg font-bold text-slate-800">${totalCost.toFixed(2)}</span>
                            </div>
                        </div>
                    </section>
                    
                    <footer className="mt-12 pt-8 border-t text-center">
                        <p className="text-sm text-slate-500">Thank you for your business!</p>
                    </footer>
                </div>
            </div>
            <style>
            {`
                @media print {
                    body.invoice-view-active > #root > div > header,
                    body.invoice-view-active > #root > div > div > div:first-child {
                        display: none !important;
                    }
                    body.invoice-view-active > #root > div > div > main {
                        width: 100% !important;
                        display: block !important;
                        height: auto !important;
                        overflow: visible !important;
                        flex-grow: 0 !important;
                    }
                    body.invoice-view-active,
                    body.invoice-view-active > #root,
                    body.invoice-view-active > #root > div,
                    body.invoice-view-active > #root > div > div {
                        display: block !important;
                        background-color: white !important;
                        height: auto !important;
                        overflow: visible !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .invoice-container {
                        padding: 0 !important;
                    }
                    .invoice-paper {
                        box-shadow: none !important;
                        margin: 0 !important;
                        max-width: 100% !important;
                        border-radius: 0 !important;
                    }
                }
            `}
            </style>
        </div>
    );
};

export default InvoiceView;
