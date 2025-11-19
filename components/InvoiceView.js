
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateJobTicketTotal, formatPhoneNumber, generateId } from '../utils.js';
import { ArrowLeftIcon, DownloadIcon, ShareIcon, FileIcon } from './icons.js';

const InvoiceView = ({
  contact,
  ticket,
  businessInfo,
  emailSettings,
  onClose,
  addFilesToContact
}) => {
  const [docType, setDocType] = useState(
    ticket.status === 'Estimate Scheduled' || ticket.status === 'Quote Sent' ? 'estimate' : 'receipt'
  );
  const [isSaving, setIsSaving] = useState(false);

  const { subtotal, taxAmount, feeAmount, totalCost, deposit, balanceDue } = calculateJobTicketTotal(ticket);
  
  const paymentStatus = ticket.paymentStatus || 'unpaid';

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

    if (businessInfo.logoUrl) {
        try {
            const format = businessInfo.logoUrl.includes('image/png') ? 'PNG' : 'JPEG';
            doc.addImage(businessInfo.logoUrl, format, 20, 20, logoSize, logoSize);
            
            doc.setFontSize(20);
            doc.text(businessInfo.name, 20, 20 + logoSize + 10);
            
            doc.setFontSize(10);
            doc.text(businessInfo.address || '', 20, 20 + logoSize + 17);
            doc.text(`Phone: ${formatPhoneNumber(businessInfo.phone)}`, 20, 20 + logoSize + 22);
            doc.text(`Email: ${businessInfo.email}`, 20, 20 + logoSize + 27);

            startY = 20 + logoSize + 40;
        } catch (e) {
            console.error("Error adding logo to PDF", e);
            doc.setFontSize(20);
            doc.text(businessInfo.name, 20, 20);
            doc.setFontSize(10);
            doc.text(businessInfo.address || '', 20, 27);
            doc.text(`Phone: ${formatPhoneNumber(businessInfo.phone)}`, 20, 32);
            doc.text(`Email: ${businessInfo.email}`, 20, 37);
            startY = 50;
        }
    } else {
        doc.setFontSize(20);
        doc.text(businessInfo.name, 20, 20);
        doc.setFontSize(10);
        doc.text(businessInfo.address || '', 20, 27);
        doc.text(`Phone: ${formatPhoneNumber(businessInfo.phone)}`, 20, 32);
        doc.text(`Email: ${businessInfo.email}`, 20, 37);
        startY = 50;
    }

    doc.setFontSize(16);
    doc.text(docType.toUpperCase(), 150, 20);
    doc.setFontSize(10);
    doc.text(`# ${ticket.id}`, 150, 27);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 32);

    const billToY = startY;
    doc.text("BILL TO:", 20, billToY);
    doc.setFontSize(12);
    doc.text(contact.name, 20, billToY + 6);
    doc.setFontSize(10);
    doc.text(contact.address || '', 20, billToY + 11);
    doc.text(`Phone: ${formatPhoneNumber(contact.phone)}`, 20, billToY + 16);
    doc.text(`Email: ${contact.email}`, 20, billToY + 21);

    if (ticket.jobLocation && ticket.jobLocation !== contact.address) {
      doc.text("JOB LOCATION:", 100, billToY);
      doc.text(ticket.jobLocation, 100, billToY + 6);
    }

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

    let finalY = doc.lastAutoTable.finalY + 10;

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
                    const status = data.cell.raw;
                    if (status === 'FAIL') {
                        data.cell.styles.textColor = [220, 38, 38]; 
                    } else if (status === 'PASS') {
                        data.cell.styles.textColor = [22, 163, 74]; 
                    } else if (status === 'REPAIRED') {
                        data.cell.styles.textColor = [37, 99, 235]; 
                    } else {
                            data.cell.styles.textColor = [148, 163, 184]; 
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
            size: Math.round(pdfBase64.length * 0.75), 
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
    React.createElement("div", { className: "h-full flex flex-col bg-slate-100 dark:bg-slate-900 overflow-y-auto" },
       React.createElement("div", { className: "p-4 flex items-center border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10 gap-2" },
          React.createElement("button", { onClick: onClose, className: "p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex-shrink-0" },
            React.createElement(ArrowLeftIcon, { className: "w-6 h-6 text-slate-600 dark:text-slate-300" })
          ),
          
          React.createElement("div", { className: "flex-grow flex flex-col sm:flex-row sm:items-center gap-2 overflow-hidden" },
              React.createElement("h2", { className: "font-bold text-lg text-slate-700 dark:text-slate-200 truncate" },
                docType === 'estimate' ? 'Estimate' : 'Invoice'
              ),
              React.createElement("div", { className: "flex space-x-1" },
                React.createElement("button", { 
                    onClick: () => setDocType('estimate'),
                    className: `px-2 py-0.5 rounded text-xs font-medium transition-colors ${docType === 'estimate' ? 'bg-sky-500 text-white' : 'text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700'}`
                }, "Est"),
                React.createElement("button", { 
                    onClick: () => setDocType('receipt'),
                    className: `px-2 py-0.5 rounded text-xs font-medium transition-colors ${docType === 'receipt' ? 'bg-sky-500 text-white' : 'text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700'}`
                }, "Inv")
              )
          ),

          React.createElement("div", { className: "flex items-center space-x-1 sm:space-x-2 flex-shrink-0" },
             React.createElement("button", { 
                onClick: handleSaveToFiles, 
                disabled: isSaving,
                className: "p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
                title: "Save to Job Files"
             },
                React.createElement(FileIcon, { className: "w-6 h-6" })
             ),
             React.createElement("button", { onClick: handleShare, className: "p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700", title: "Share / Email" },
                React.createElement(ShareIcon, { className: "w-6 h-6" })
             ),
             React.createElement("button", { onClick: handleDownload, className: "p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700", title: "Download PDF" },
                React.createElement(DownloadIcon, { className: "w-6 h-6" })
             )
          )
       ),

       React.createElement("div", { className: "p-6 max-w-3xl mx-auto w-full bg-white dark:bg-slate-800 my-6 shadow-lg rounded-lg print:shadow-none" },
            /* Header */
            React.createElement("div", { className: "flex flex-col sm:flex-row justify-between border-b border-slate-200 dark:border-slate-700 pb-6 gap-6" },
                React.createElement("div", { className: "flex flex-col sm:flex-row gap-4" },
                    businessInfo.logoUrl && (
                        React.createElement("div", { className: "w-20 h-20 flex-shrink-0" },
                            React.createElement("img", { src: businessInfo.logoUrl, alt: "Logo", className: "w-full h-full object-contain" })
                        )
                    ),
                    React.createElement("div", null,
                        React.createElement("h1", { className: "text-2xl font-bold text-slate-800 dark:text-slate-100" }, businessInfo.name),
                        React.createElement("p", { className: "text-slate-600 dark:text-slate-400 whitespace-pre-line" }, businessInfo.address),
                        React.createElement("p", { className: "text-slate-600 dark:text-slate-400" }, formatPhoneNumber(businessInfo.phone)),
                        React.createElement("p", { className: "text-slate-600 dark:text-slate-400" }, businessInfo.email)
                    )
                ),
                React.createElement("div", { className: "text-left sm:text-right" },
                    React.createElement("h2", { className: "text-xl font-bold text-slate-700 dark:text-slate-200 uppercase" }, docType),
                    React.createElement("p", { className: "text-slate-600 dark:text-slate-400" }, `# ${ticket.id}`),
                    React.createElement("p", { className: "text-slate-600 dark:text-slate-400" }, `Date: ${new Date(ticket.date).toLocaleDateString()}`)
                )
            ),

            /* Bill To */
            React.createElement("div", { className: "py-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between gap-6" },
                React.createElement("div", null,
                    React.createElement("h3", { className: "text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-2" }, "Bill To:"),
                    React.createElement("p", { className: "font-bold text-slate-800 dark:text-slate-100" }, contact.name),
                    React.createElement("p", { className: "text-slate-600 dark:text-slate-400 whitespace-pre-line" }, contact.address),
                    React.createElement("p", { className: "text-slate-600 dark:text-slate-400" }, formatPhoneNumber(contact.phone)),
                    React.createElement("p", { className: "text-slate-600 dark:text-slate-400" }, contact.email)
                ),
                ticket.jobLocation && ticket.jobLocation !== contact.address && (
                    React.createElement("div", { className: "text-left sm:text-right" },
                         React.createElement("h3", { className: "text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-2" }, "Job Location:"),
                         React.createElement("p", { className: "text-slate-600 dark:text-slate-400 whitespace-pre-line" }, ticket.jobLocation)
                    )
                )
            ),

            /* Items */
            React.createElement("table", { className: "w-full mt-6" },
                React.createElement("thead", null,
                    React.createElement("tr", { className: "border-b border-slate-200 dark:border-slate-700" },
                        React.createElement("th", { className: "text-left py-2 text-slate-600 dark:text-slate-300" }, "Description"),
                        React.createElement("th", { className: "text-center py-2 text-slate-600 dark:text-slate-300" }, "Qty"),
                        React.createElement("th", { className: "text-right py-2 text-slate-600 dark:text-slate-300" }, "Unit Price"),
                        React.createElement("th", { className: "text-right py-2 text-slate-600 dark:text-slate-300" }, "Amount")
                    )
                ),
                React.createElement("tbody", null,
                    ticket.parts.map(part => (
                        React.createElement("tr", { key: part.id, className: "border-b border-slate-100 dark:border-slate-700/50" },
                            React.createElement("td", { className: "py-2 text-slate-800 dark:text-slate-200" }, part.name),
                            React.createElement("td", { className: "text-center py-2 text-slate-800 dark:text-slate-200" }, part.quantity),
                            React.createElement("td", { className: "text-right py-2 text-slate-800 dark:text-slate-200" }, `$${part.cost.toFixed(2)}`),
                            React.createElement("td", { className: "text-right py-2 text-slate-800 dark:text-slate-200" }, `$${(part.quantity * part.cost).toFixed(2)}`)
                        )
                    )),
                    ticket.laborCost > 0 && (
                         React.createElement("tr", { className: "border-b border-slate-100 dark:border-slate-700/50" },
                            React.createElement("td", { className: "py-2 text-slate-800 dark:text-slate-200" }, "Labor"),
                            React.createElement("td", { className: "text-center py-2 text-slate-800 dark:text-slate-200" }, "1"),
                            React.createElement("td", { className: "text-right py-2 text-slate-800 dark:text-slate-200" }, `$${ticket.laborCost.toFixed(2)}`),
                            React.createElement("td", { className: "text-right py-2 text-slate-800 dark:text-slate-200" }, `$${ticket.laborCost.toFixed(2)}`)
                        )
                    )
                )
            ),

            /* Totals */
            React.createElement("section", { className: "mt-6 flex flex-col items-end" },
                docType === 'estimate' && (ticket.processingFeeRate || 0) > 0 ? (
                    React.createElement("div", { className: "w-full mt-4" },
                        React.createElement("div", { className: "w-full max-w-sm ml-auto space-y-2 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-4 mb-6" },
                            React.createElement("div", { className: "flex justify-between pb-2" },
                                React.createElement("span", { className: "text-sm font-medium" }, "Subtotal"),
                                React.createElement("span", { className: "text-sm font-medium" }, `$${subtotal.toFixed(2)}`)
                            ),
                            (ticket.salesTaxRate || 0) > 0 && (
                                React.createElement("div", { className: "flex justify-between pb-2" },
                                    React.createElement("span", { className: "text-sm font-medium" }, `Sales Tax (${ticket.salesTaxRate}%)`),
                                    React.createElement("span", { className: "text-sm font-medium" }, `$${taxAmount.toFixed(2)}`)
                                )
                            )
                        ),

                        React.createElement("h4", { className: "text-center font-bold text-lg text-slate-800 dark:text-slate-100 mb-4 uppercase tracking-wide" }, "Payment Options"),
                        
                        React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-6" },
                            /* Cash/Check Option */
                            React.createElement("div", { className: "border-2 border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-700/30" },
                                React.createElement("h5", { className: "font-bold text-slate-700 dark:text-slate-200 text-center border-b border-slate-200 dark:border-slate-600 pb-2 mb-3" }, "Cash / Check"),
                                React.createElement("div", { className: "space-y-2 text-sm dark:text-slate-300" },
                                    deposit > 0 ? (
                                        React.createElement(React.Fragment, null,
                                            React.createElement("div", { className: "flex justify-between" },
                                                React.createElement("span", { className: "font-medium" }, "Required Deposit (30%)"),
                                                React.createElement("span", { className: "font-medium" }, `$${cashDeposit.toFixed(2)}`)
                                            ),
                                            React.createElement("div", { className: "flex justify-between mt-2" },
                                                React.createElement("span", null, "Balance Due (70%)"),
                                                React.createElement("span", null, `$${cashBalance.toFixed(2)}`)
                                            ),
                                            React.createElement("div", { className: "flex justify-between items-end border-t border-slate-200 dark:border-slate-600 pt-2 mt-4" },
                                                React.createElement("span", { className: "font-bold" }, "Total"),
                                                React.createElement("span", { className: "font-bold text-lg" }, `$${cashTotal.toFixed(2)}`)
                                            )
                                        )
                                    ) : (
                                        React.createElement("div", { className: "flex justify-between items-end" },
                                            React.createElement("span", null, "Total"),
                                            React.createElement("span", { className: "font-bold text-lg" }, `$${cashTotal.toFixed(2)}`)
                                        )
                                    )
                                )
                            ),

                            /* Card Option */
                            React.createElement("div", { className: "border-2 border-sky-100 dark:border-sky-900 rounded-lg p-4 bg-sky-50 dark:bg-sky-900/20" },
                                React.createElement("h5", { className: "font-bold text-slate-700 dark:text-slate-200 text-center border-b border-sky-200 dark:border-sky-800 pb-2 mb-3" }, "Card Payment"),
                                React.createElement("div", { className: "space-y-2 text-sm dark:text-slate-300" },
                                    React.createElement("div", { className: "flex justify-between" },
                                        React.createElement("span", null, `Processing Fee (${ticket.processingFeeRate}%)`),
                                        React.createElement("span", null, `$${feeAmount.toFixed(2)}`)
                                    ),
                                    deposit > 0 ? (
                                        React.createElement(React.Fragment, null,
                                            React.createElement("div", { className: "border-b border-sky-200 dark:border-sky-800 my-2" }),
                                            React.createElement("div", { className: "flex justify-between" },
                                                React.createElement("span", { className: "font-medium" }, "Required Deposit (30%)"),
                                                React.createElement("span", { className: "font-medium" }, `$${cardDeposit.toFixed(2)}`)
                                            ),
                                            React.createElement("div", { className: "flex justify-between mt-2" },
                                                React.createElement("span", null, "Balance Due (70%)"),
                                                React.createElement("span", null, `$${cardBalance.toFixed(2)}`)
                                            ),
                                            React.createElement("div", { className: "flex justify-between items-end border-t border-sky-200 dark:border-sky-800 pt-2 mt-4" },
                                                React.createElement("span", { className: "font-bold" }, "Total Charge"),
                                                React.createElement("span", { className: "font-bold text-lg" }, `$${cardTotal.toFixed(2)}`)
                                            )
                                        )
                                    ) : (
                                        React.createElement(React.Fragment, null,
                                            React.createElement("div", { className: "flex justify-between" },
                                                React.createElement("span", null, "Job Total"),
                                                React.createElement("span", null, `$${cashTotal.toFixed(2)}`)
                                            ),
                                            React.createElement("div", { className: "flex justify-between items-end border-t border-sky-200 dark:border-sky-800 pt-1 mt-1" },
                                                React.createElement("span", { className: "font-medium" }, "Total Charge"),
                                                React.createElement("span", { className: "font-bold text-lg" }, `$${cardTotal.toFixed(2)}`)
                                            )
                                        )
                                    )
                                )
                            )
                        )
                    )
                ) : (
                    React.createElement("div", { className: "w-full max-w-xs space-y-2 text-slate-700 dark:text-slate-300" },
                        React.createElement("div", { className: "flex justify-between py-2 border-b border-slate-100 dark:border-slate-700" },
                            React.createElement("span", { className: "text-sm font-medium" }, "Subtotal"),
                            React.createElement("span", { className: "text-sm font-medium" }, `$${subtotal.toFixed(2)}`)
                        ),
                        (ticket.salesTaxRate || 0) > 0 && (
                            React.createElement("div", { className: "flex justify-between py-2 border-b border-slate-100 dark:border-slate-700" },
                                React.createElement("span", { className: "text-sm font-medium" }, `Sales Tax (${ticket.salesTaxRate}%)`),
                                React.createElement("span", { className: "text-sm font-medium" }, `$${taxAmount.toFixed(2)}`)
                            )
                        ),
                        (ticket.processingFeeRate || 0) > 0 && (
                            React.createElement("div", { className: "flex justify-between py-2 border-b border-slate-100 dark:border-slate-700" },
                                React.createElement("span", { className: "text-sm font-medium" }, `Card Processing Fee (${ticket.processingFeeRate}%)`),
                                React.createElement("span", { className: "text-sm font-medium" }, `$${feeAmount.toFixed(2)}`)
                            )
                        ),
                         React.createElement("div", { className: "flex justify-between py-3 mt-2 border-t-2 border-slate-300 dark:border-slate-600" },
                            React.createElement("span", { className: "text-base font-bold" }, "Total"),
                            React.createElement("span", { className: "text-base font-bold" }, `$${totalCost.toFixed(2)}`)
                        ),
                        
                        docType === 'estimate' ? (
                            deposit > 0 && (
                                React.createElement("div", { className: "flex justify-between py-2 border-t text-slate-800 dark:text-slate-100 font-semibold bg-slate-50 dark:bg-slate-700 px-2 -mx-2 rounded" },
                                    React.createElement("span", null, "Required Deposit (30%)"),
                                    React.createElement("span", null, `$${deposit.toFixed(2)}`)
                                )
                            )
                        ) : (
                            React.createElement(React.Fragment, null,
                                paymentStatus === 'paid_in_full' ? (
                                    React.createElement(React.Fragment, null,
                                        React.createElement("div", { className: "flex justify-between py-2 border-b border-slate-100 dark:border-slate-700 text-green-600 dark:text-green-400 font-bold" },
                                            React.createElement("span", null, "Amount Paid"),
                                            React.createElement("span", null, `-$${totalCost.toFixed(2)}`)
                                        ),
                                        React.createElement("div", { className: "flex justify-between py-3 border-t border-slate-300 dark:border-slate-600" },
                                            React.createElement("span", { className: "text-base font-bold" }, "Balance Due"),
                                            React.createElement("span", { className: "text-base font-bold" }, "$0.00")
                                        )
                                    )
                                ) : paymentStatus === 'deposit_paid' && deposit > 0 ? (
                                     React.createElement(React.Fragment, null,
                                        React.createElement("div", { className: "flex justify-between py-2 border-b border-slate-100 dark:border-slate-700 text-green-600 dark:text-green-400" },
                                            React.createElement("span", { className: "text-sm font-medium" }, "Deposit Paid"),
                                            React.createElement("span", { className: "text-sm font-medium" }, `-$${deposit.toFixed(2)}`)
                                        ),
                                        React.createElement("div", { className: "flex justify-between py-3 border-t border-slate-300 dark:border-slate-600" },
                                            React.createElement("span", { className: "text-base font-bold" }, "Balance Due"),
                                            React.createElement("span", { className: "text-base font-bold" }, `$${balanceDue.toFixed(2)}`)
                                        )
                                    )
                                ) : (
                                    React.createElement("div", { className: "flex justify-between py-3 border-t border-slate-300 dark:border-slate-600" },
                                        React.createElement("span", { className: "text-base font-bold" }, "Balance Due"),
                                        React.createElement("span", { className: "text-base font-bold" }, `$${totalCost.toFixed(2)}`)
                                    )
                                )
                            )
                        )
                    )
                )
            ),

            docType === 'estimate' && deposit > 0 && (
                React.createElement("section", { className: "mt-8 pt-6 border-t border-slate-200 dark:border-slate-700" },
                    React.createElement("h3", { className: "text-sm font-bold text-slate-700 dark:text-slate-300 uppercase mb-3" }, "Payment Schedule"),
                    React.createElement("ul", { className: "list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1" },
                        React.createElement("li", null, "A deposit is due at contract signing to schedule the work."),
                        React.createElement("li", null, "The remaining balance is due upon completion of the job.")
                    )
                )
            ),

            ticket.inspection && ticket.inspection.length > 0 && (
                React.createElement("div", { className: "mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 break-before-page" },
                     React.createElement("h3", { className: "text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 uppercase" }, "Safety Inspection"),
                     React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm" },
                         ticket.inspection.map(item => (
                             React.createElement("div", { key: item.id, className: "flex justify-between border-b border-slate-100 dark:border-slate-800 py-1" },
                                 React.createElement("span", { className: "text-slate-600 dark:text-slate-300" }, item.name),
                                 React.createElement("span", { className: `font-bold uppercase ${item.status === 'fail' ? 'text-red-600' : item.status === 'pass' ? 'text-green-600' : item.status === 'repaired' ? 'text-blue-600' : 'text-slate-400'}` },
                                     item.status === 'na' ? 'N/A' : item.status
                                 )
                             )
                         ))
                     )
                )
            ),

            React.createElement("footer", { className: "mt-12 pt-8 border-t border-slate-200 dark:border-slate-700 text-center" },
                React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400" }, "Thank you for your business!")
            )
       )
    )
  );
};

export default InvoiceView;
