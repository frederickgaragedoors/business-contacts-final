
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Contact, JobTicket, BusinessInfo, EmailSettings, PaymentStatus } from '../types.ts';
import { calculateJobTicketTotal, formatPhoneNumber, generateId } from '../utils.ts';
import { ArrowLeftIcon, DownloadIcon, ShareIcon, FileIcon } from './icons.tsx';

interface InvoiceViewProps {
  contact: Contact;
  ticket: JobTicket;
  businessInfo: BusinessInfo;
  emailSettings: EmailSettings;
  onClose: () => void;
  addFilesToContact: (contactId: string, files: any[]) => Promise<void>;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({
  contact,
  ticket,
  businessInfo,
  emailSettings,
  onClose,
  addFilesToContact
}) => {
  const [docType, setDocType] = useState<'estimate' | 'receipt'>(
    ticket.status === 'Estimate Scheduled' || ticket.status === 'Quote Sent' ? 'estimate' : 'receipt'
  );
  const [isSaving, setIsSaving] = useState(false);

  const { subtotal, taxAmount, feeAmount, totalCost, deposit, balanceDue } = calculateJobTicketTotal(ticket);
  
  const paymentStatus = ticket.paymentStatus || 'unpaid';

  // Calculate breakdown for Estimate View
  const cashSubtotal = subtotal;
  const cashTax = cashSubtotal * ((ticket.salesTaxRate || 0) / 100);
  const cashTotal = cashSubtotal + cashTax;
  const cashDeposit = cashTotal * 0.3;
  const cashBalance = cashTotal - (ticket.deposit || 0);

  const cardTotal = totalCost; 
  const cardDeposit = cardTotal * 0.3;
  const cardBalance = cardTotal - (ticket.deposit || 0);

  const createPDFDoc = () => {
    const doc = new jsPDF();
    const logoSize = 30;
    let startY = 20;

    // Logo & Header
    if (businessInfo.logoUrl) {
        try {
            const format = businessInfo.logoUrl.includes('image/png') ? 'PNG' : 'JPEG';
            doc.addImage(businessInfo.logoUrl, format, 20, 20, logoSize, logoSize);
            
            // Company Info (pushed down)
            doc.setFontSize(20);
            doc.text(businessInfo.name, 20, 20 + logoSize + 10);
            
            doc.setFontSize(10);
            doc.text(businessInfo.address || '', 20, 20 + logoSize + 17);
            doc.text(`Phone: ${formatPhoneNumber(businessInfo.phone)}`, 20, 20 + logoSize + 22);
            doc.text(`Email: ${businessInfo.email}`, 20, 20 + logoSize + 27);

            startY = 20 + logoSize + 40;
        } catch (e) {
            console.error("Error adding logo to PDF", e);
            // Fallback layout if logo fails
            doc.setFontSize(20);
            doc.text(businessInfo.name, 20, 20);
            doc.setFontSize(10);
            doc.text(businessInfo.address || '', 20, 27);
            doc.text(`Phone: ${formatPhoneNumber(businessInfo.phone)}`, 20, 32);
            doc.text(`Email: ${businessInfo.email}`, 20, 37);
            startY = 50;
        }
    } else {
        // No Logo Layout
        doc.setFontSize(20);
        doc.text(businessInfo.name, 20, 20);
        doc.setFontSize(10);
        doc.text(businessInfo.address || '', 20, 27);
        doc.text(`Phone: ${formatPhoneNumber(businessInfo.phone)}`, 20, 32);
        doc.text(`Email: ${businessInfo.email}`, 20, 37);
        startY = 50;
    }

    // Document Details (Top Right)
    doc.setFontSize(16);
    doc.text(docType.toUpperCase(), 150, 20);
    doc.setFontSize(10);
    doc.text(`# ${ticket.id}`, 150, 27);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 32);

    // Bill To
    const billToY = startY;
    doc.text("BILL TO:", 20, billToY);
    doc.setFontSize(12);
    doc.text(contact.name, 20, billToY + 6);
    doc.setFontSize(10);
    doc.text(contact.address || '', 20, billToY + 11);
    doc.text(`Phone: ${formatPhoneNumber(contact.phone)}`, 20, billToY + 16);
    doc.text(`Email: ${contact.email}`, 20, billToY + 21);

    // Job Location
    if (ticket.jobLocation && ticket.jobLocation !== contact.address) {
      doc.text("JOB LOCATION:", 100, billToY);
      doc.text(ticket.jobLocation, 100, billToY + 6);
    }

    // Table
    const tableY = billToY + 30;
    const tableBody = ticket.parts.map(part => [
      part.name,
      part.quantity.toString(),
      `$${part.cost.toFixed(2)}`,
      `$${(part.quantity * part.cost).toFixed(2)}`
    ]);

    if (ticket.laborCost > 0) {
        tableBody.push(['Labor', '1', `$${ticket.laborCost.toFixed(2)}`, `$${ticket.laborCost.toFixed(2)}`]);
    }

    autoTable(doc, {
      startY: tableY,
      head: [['Description', 'Qty', 'Unit Price', 'Amount']],
      body: tableBody,
      theme: 'striped',
      headStyles: { fillColor: [66, 66, 66] },
    });

    let finalY = (doc as any).lastAutoTable.finalY + 10;

    // Totals
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 140, finalY);
    finalY += 5;
    if (ticket.salesTaxRate) {
        doc.text(`Tax (${ticket.salesTaxRate}%): $${taxAmount.toFixed(2)}`, 140, finalY);
        finalY += 5;
    }
    if (ticket.processingFeeRate) {
        doc.text(`Processing Fee (${ticket.processingFeeRate}%): $${feeAmount.toFixed(2)}`, 140, finalY);
        finalY += 5;
    }
    
    doc.setFontSize(12);
    doc.text(`Total: $${totalCost.toFixed(2)}`, 140, finalY + 2);
    finalY += 10;

    if (docType === 'receipt') {
        if (paymentStatus === 'paid_in_full') {
            doc.text(`Amount Paid: $${totalCost.toFixed(2)}`, 140, finalY);
            finalY += 5;
            doc.text(`Balance Due: $0.00`, 140, finalY);
        } else if (paymentStatus === 'deposit_paid' && deposit > 0) {
            doc.text(`Deposit Paid: $${deposit.toFixed(2)}`, 140, finalY);
            finalY += 5;
            doc.text(`Balance Due: $${balanceDue.toFixed(2)}`, 140, finalY);
        } else {
             doc.text(`Balance Due: $${totalCost.toFixed(2)}`, 140, finalY);
        }
    } else if (docType === 'estimate' && deposit > 0) {
        doc.setFontSize(10);
        doc.text(`Required Deposit: $${deposit.toFixed(2)}`, 140, finalY);
    }

    // Payment Terms
    if (docType === 'estimate' && deposit > 0) {
        if (finalY > doc.internal.pageSize.getHeight() - 60) {
            doc.addPage();
            finalY = 40;
        } else {
            finalY += 20;
        }
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("PAYMENT SCHEDULE", 20, finalY);
        finalY += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("• A deposit is due at contract signing to schedule the work.", 25, finalY);
        finalY += 6;
        doc.text("• The remaining balance is due upon completion of the job.", 25, finalY);
        finalY += 10;
    }
    
    // Safety Inspection Report
    if (ticket.inspection && ticket.inspection.length > 0) {
        doc.addPage();
        let inspectY = 20;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("SAFETY INSPECTION REPORT", 20, inspectY);
        inspectY += 10;

        const inspectionRows = ticket.inspection.map(item => {
            let statusText = item.status.toUpperCase();
            if (statusText === 'NA') statusText = 'N/A';
            return [item.name, statusText];
        });

        autoTable(doc, {
            startY: inspectY,
            head: [['Inspection Point', 'Status']],
            body: inspectionRows,
            theme: 'striped',
            headStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 4 },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 60, halign: 'center', fontStyle: 'bold' }
            },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 1) {
                    const status = data.cell.raw as string;
                    if (status === 'FAIL') {
                        data.cell.styles.textColor = [220, 38, 38]; // Red
                    } else if (status === 'PASS') {
                        data.cell.styles.textColor = [22, 163, 74]; // Green
                    } else if (status === 'REPAIRED') {
                        data.cell.styles.textColor = [37, 99, 235]; // Blue
                    } else {
                        data.cell.styles.textColor = [148, 163, 184]; // Grey
                    }
                }
            }
        });
    }

    return doc;
  };

  const handleDownload = () => {
      const doc = createPDFDoc();
      doc.save(`${docType}_${ticket.id}.pdf`);
  };

  const handleShare = async () => {
    const doc = createPDFDoc();
    const pdfBlob = doc.output('blob');
    const file = new File([pdfBlob], `${docType}_${ticket.id}.pdf`, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: `${docType} #${ticket.id}`,
                text: `Here is the ${docType} for your review.`
            });
        } catch (error) {
            console.log('Error sharing', error);
        }
    } else {
        alert("Sharing is not supported on this device. Please download the file instead.");
    }
  };

  const handleSaveToFiles = async () => {
      setIsSaving(true);
      try {
        const doc = createPDFDoc();
        const pdfBase64 = doc.output('datauristring');
        const file = {
            id: generateId(),
            name: `${docType}_${ticket.id}.pdf`,
            type: 'application/pdf',
            size: Math.round(pdfBase64.length * 0.75), // Approx size
            dataUrl: pdfBase64
        };
        await addFilesToContact(contact.id, [file]);
        alert(`Saved ${docType} to contact files.`);
      } catch (e) {
          console.error(e);
          alert("Failed to save file.");
      } finally {
          setIsSaving(false);
      }
  };

  return (
    <div className="h-full flex flex-col bg-slate-100 dark:bg-slate-900 overflow-y-auto">
       <div className="px-4 py-3 flex flex-col sm:flex-row items-center justify-between border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md z-20 gap-3 sm:gap-4">
          
          <div className="flex w-full sm:w-auto items-center justify-between gap-4">
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
                <ArrowLeftIcon className="w-6 h-6" />
            </button>
            
            {/* Prominent Toggle */}
            <div className="flex bg-slate-200/80 dark:bg-slate-700/80 p-1 rounded-lg flex-grow sm:flex-grow-0 max-w-xs mx-auto sm:mx-0">
                <button 
                    onClick={() => setDocType('estimate')}
                    className={`flex-1 px-4 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 ${docType === 'estimate' ? 'bg-white dark:bg-slate-600 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                    Estimate
                </button>
                <button 
                    onClick={() => setDocType('receipt')}
                    className={`flex-1 px-4 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 ${docType === 'receipt' ? 'bg-white dark:bg-slate-600 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                    Receipt
                </button>
            </div>
            
            {/* Placeholder for balance in flex layout on mobile if needed, currently hidden */}
             <div className="w-10 sm:hidden"></div>
          </div>

          {/* Action Buttons Group */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center sm:justify-end">
             <button 
                onClick={handleSaveToFiles} 
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex-1 sm:flex-none"
                title="Save to Job Files"
             >
                <FileIcon className="w-5 h-5" />
                <span className="sm:hidden">Save</span>
             </button>
             
             <button 
                onClick={handleShare} 
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-sky-500 text-white font-medium text-sm hover:bg-sky-600 transition-colors flex-1 sm:flex-none shadow-sm"
                title="Share / Email"
             >
                <ShareIcon className="w-5 h-5" />
                <span className="sm:hidden">Share</span>
             </button>

             <button 
                onClick={handleDownload} 
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex-1 sm:flex-none"
                title="Download PDF"
             >
                <DownloadIcon className="w-5 h-5" />
                <span className="sm:hidden">Download</span>
             </button>
          </div>
       </div>

       <div className="p-4 sm:p-8 max-w-3xl mx-auto w-full flex-grow">
           <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg print:shadow-none p-6 sm:p-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between border-b border-slate-200 dark:border-slate-700 pb-8 gap-6">
                    <div className="flex flex-col gap-4">
                        {businessInfo.logoUrl && (
                            <div className="w-24 h-24 flex-shrink-0 self-start">
                                <img src={businessInfo.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{businessInfo.name}</h1>
                            <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line mt-1">{businessInfo.address}</p>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">{formatPhoneNumber(businessInfo.phone)}</p>
                            <p className="text-slate-600 dark:text-slate-400">{businessInfo.email}</p>
                        </div>
                    </div>
                    <div className="text-left sm:text-right">
                        <h2 className="text-3xl font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wide">{docType}</h2>
                        <div className="mt-2 space-y-1">
                            <p className="text-slate-800 dark:text-slate-200 font-medium"># {ticket.id}</p>
                            <p className="text-slate-600 dark:text-slate-400">{new Date(ticket.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* Bill To */}
                <div className="py-8 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between gap-8">
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Bill To</h3>
                        <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{contact.name}</p>
                        <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">{contact.address}</p>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">{formatPhoneNumber(contact.phone)}</p>
                        <p className="text-slate-600 dark:text-slate-400">{contact.email}</p>
                    </div>
                    {ticket.jobLocation && ticket.jobLocation !== contact.address && (
                        <div className="text-left sm:text-right">
                             <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Service Location</h3>
                             <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line max-w-xs ml-auto">{ticket.jobLocation}</p>
                        </div>
                    )}
                </div>

                {/* Items */}
                <div className="mt-8 overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                                <th className="text-left py-3 text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Description</th>
                                <th className="text-center py-3 text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Qty</th>
                                <th className="text-right py-3 text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Unit Price</th>
                                <th className="text-right py-3 text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-700 dark:text-slate-300 text-sm">
                            {ticket.parts.map(part => (
                                <tr key={part.id} className="border-b border-slate-100 dark:border-slate-700/50">
                                    <td className="py-4 font-medium">{part.name}</td>
                                    <td className="text-center py-4">{part.quantity}</td>
                                    <td className="text-right py-4">${part.cost.toFixed(2)}</td>
                                    <td className="text-right py-4 font-medium">${(part.quantity * part.cost).toFixed(2)}</td>
                                </tr>
                            ))}
                            {ticket.laborCost > 0 && (
                                 <tr className="border-b border-slate-100 dark:border-slate-700/50">
                                    <td className="py-4 font-medium">Labor</td>
                                    <td className="text-center py-4">1</td>
                                    <td className="text-right py-4">${ticket.laborCost.toFixed(2)}</td>
                                    <td className="text-right py-4 font-medium">${ticket.laborCost.toFixed(2)}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <section className="mt-8 flex flex-col items-end">
                    {docType === 'estimate' && (ticket.processingFeeRate || 0) > 0 ? (
                        <div className="w-full mt-4">
                            <div className="w-full max-w-sm ml-auto space-y-3 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-6 mb-8">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-slate-500 dark:text-slate-400">Subtotal</span>
                                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                                </div>
                                {(ticket.salesTaxRate || 0) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-slate-500 dark:text-slate-400">Sales Tax ({ticket.salesTaxRate}%)</span>
                                        <span className="font-medium">${taxAmount.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>

                            <h4 className="text-center font-bold text-lg text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-wide">Payment Options</h4>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Cash/Check Option */}
                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 bg-slate-50 dark:bg-slate-800/50 shadow-sm">
                                    <h5 className="font-bold text-slate-800 dark:text-slate-100 text-center mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">Cash / Check</h5>
                                    <div className="space-y-3 text-sm dark:text-slate-300">
                                        {deposit > 0 ? (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 dark:text-slate-400">Required Deposit (30%)</span>
                                                    <span className="font-semibold">${cashDeposit.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 dark:text-slate-400">Balance Due (70%)</span>
                                                    <span className="font-semibold">${cashBalance.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-600 pt-3 mt-3">
                                                    <span className="font-bold text-slate-800 dark:text-slate-100">Total</span>
                                                    <span className="font-bold text-xl text-slate-900 dark:text-white">${cashTotal.toFixed(2)}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-slate-800 dark:text-slate-100">Total</span>
                                                <span className="font-bold text-xl text-slate-900 dark:text-white">${cashTotal.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card Option */}
                                <div className="border border-sky-200 dark:border-sky-800 rounded-xl p-5 bg-sky-50 dark:bg-sky-900/10 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500 rotate-45 transform translate-x-8 -translate-y-8 opacity-10"></div>
                                    <h5 className="font-bold text-slate-800 dark:text-slate-100 text-center mb-4 pb-3 border-b border-sky-200 dark:border-sky-800">Card Payment</h5>
                                    <div className="space-y-3 text-sm dark:text-slate-300">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 dark:text-slate-400">Processing Fee ({ticket.processingFeeRate}%)</span>
                                            <span className="font-semibold">${feeAmount.toFixed(2)}</span>
                                        </div>
                                        {deposit > 0 ? (
                                            <>
                                                <div className="border-t border-dashed border-sky-200 dark:border-sky-800 my-2"></div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 dark:text-slate-400">Required Deposit (30%)</span>
                                                    <span className="font-semibold">${cardDeposit.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 dark:text-slate-400">Balance Due (70%)</span>
                                                    <span className="font-semibold">${cardBalance.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center border-t border-sky-200 dark:border-sky-800 pt-3 mt-3">
                                                    <span className="font-bold text-sky-900 dark:text-sky-100">Total Charge</span>
                                                    <span className="font-bold text-xl text-sky-700 dark:text-sky-300">${cardTotal.toFixed(2)}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 dark:text-slate-400">Job Total</span>
                                                    <span className="font-semibold">${cashTotal.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center border-t border-sky-200 dark:border-sky-800 pt-3 mt-3">
                                                    <span className="font-bold text-sky-900 dark:text-sky-100">Total Charge</span>
                                                    <span className="font-bold text-xl text-sky-700 dark:text-sky-300">${cardTotal.toFixed(2)}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full max-w-xs space-y-3 text-slate-700 dark:text-slate-300">
                            <div className="flex justify-between py-1">
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Subtotal</span>
                                <span className="text-sm font-semibold">${subtotal.toFixed(2)}</span>
                            </div>
                            {(ticket.salesTaxRate || 0) > 0 && (
                                <div className="flex justify-between py-1">
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Sales Tax ({ticket.salesTaxRate}%)</span>
                                    <span className="text-sm font-semibold">${taxAmount.toFixed(2)}</span>
                                </div>
                            )}
                            {(ticket.processingFeeRate || 0) > 0 && (
                                <div className="flex justify-between py-1">
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Processing Fee ({ticket.processingFeeRate}%)</span>
                                    <span className="text-sm font-semibold">${feeAmount.toFixed(2)}</span>
                                </div>
                            )}
                             <div className="flex justify-between py-4 mt-2 border-t-2 border-slate-200 dark:border-slate-700">
                                <span className="text-lg font-bold text-slate-800 dark:text-white">Total</span>
                                <span className="text-lg font-bold text-slate-800 dark:text-white">${totalCost.toFixed(2)}</span>
                            </div>
                            
                            {docType === 'estimate' ? (
                                deposit > 0 && (
                                    <div className="flex justify-between py-3 border-t border-dashed border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 font-bold bg-slate-50 dark:bg-slate-800 px-3 -mx-3 rounded-md">
                                        <span>Required Deposit (30%)</span>
                                        <span>${deposit.toFixed(2)}</span>
                                    </div>
                                )
                            ) : (
                                <>
                                    {paymentStatus === 'paid_in_full' ? (
                                        <>
                                            <div className="flex justify-between py-2 text-green-600 dark:text-green-400 font-bold">
                                                <span>Amount Paid</span>
                                                <span>-${totalCost.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between py-3 border-t border-slate-200 dark:border-slate-700">
                                                <span className="text-lg font-bold">Balance Due</span>
                                                <span className="text-lg font-bold">$0.00</span>
                                            </div>
                                        </>
                                    ) : paymentStatus === 'deposit_paid' && deposit > 0 ? (
                                         <>
                                            <div className="flex justify-between py-2 text-green-600 dark:text-green-400 font-medium">
                                                <span>Deposit Paid</span>
                                                <span>-${deposit.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between py-3 border-t border-slate-200 dark:border-slate-700">
                                                <span className="text-lg font-bold">Balance Due</span>
                                                <span className="text-lg font-bold">${balanceDue.toFixed(2)}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex justify-between py-3 border-t border-slate-200 dark:border-slate-700">
                                            <span className="text-lg font-bold">Balance Due</span>
                                            <span className="text-lg font-bold">${totalCost.toFixed(2)}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </section>

                {docType === 'estimate' && deposit > 0 && (
                    <section className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase mb-4 tracking-wide">Payment Schedule</h3>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-2">
                                <li>A <span className="font-semibold text-slate-800 dark:text-slate-200">30% deposit</span> is required at the time of approval to schedule the work.</li>
                                <li>The remaining balance is due upon satisfactory completion of the job.</li>
                            </ul>
                        </div>
                    </section>
                )}
                
                {ticket.inspection && ticket.inspection.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700 break-before-page">
                         <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-wide">Safety Inspection Report</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm">
                             {ticket.inspection.map(item => (
                                 <div key={item.id} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700/50 py-2">
                                     <span className="text-slate-600 dark:text-slate-300 font-medium">{item.name}</span>
                                     <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                                         item.status === 'fail' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 
                                         item.status === 'pass' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 
                                         item.status === 'repaired' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 
                                         'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                     }`}>
                                         {item.status === 'na' ? 'N/A' : item.status}
                                     </span>
                                 </div>
                             ))}
                         </div>
                    </div>
                )}

                <footer className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Thank you for your business!</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{`Generated on ${new Date().toLocaleDateString()}`}</p>
                </footer>
           </div>
       </div>
    </div>
  );
};

export default InvoiceView;
