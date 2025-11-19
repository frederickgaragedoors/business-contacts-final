











import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Contact, JobTicket, BusinessInfo, FileAttachment, EmailSettings, InspectionItem } from '../types.ts';
import { ArrowLeftIcon, MailIcon, ShareIcon } from './icons.tsx';
import { generateId, fileToDataUrl, calculateJobTicketTotal, processTemplate, formatPhoneNumber } from '../utils.ts';


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

    // --- Calculations ---
    const { subtotal, taxAmount, feeAmount, totalCost, deposit, balanceDue } = calculateJobTicketTotal(ticket);
    
    const cashTotal = subtotal + taxAmount;
    const cardTotal = totalCost; 
    const depositRatio = totalCost > 0 ? deposit / totalCost : 0;
    
    const cardDeposit = deposit; 
    const cardBalance = cardTotal - cardDeposit;
    
    const cashDeposit = cashTotal * depositRatio;
    const cashBalance = cashTotal - cashDeposit;

    const isNativeShareSupported = typeof navigator !== 'undefined' && !!navigator.share;

    // Determine Display Title and Logic based on Payment Status
    const paymentStatus = ticket.paymentStatus || 'unpaid';
    
    let displayTitle = docType.toUpperCase();
    if (docType === 'receipt') {
        if (paymentStatus === 'paid_in_full') {
            displayTitle = 'FINAL RECEIPT';
        } else if (paymentStatus === 'deposit_paid') {
            displayTitle = 'DEPOSIT RECEIPT';
        } else {
            displayTitle = 'INVOICE';
        }
    }

    const generatePdf = async () => {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'letter'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 40;
        const startY = 40;

        let logoWidth = 0;
        let logoHeight = 0;
        let headerHeight = 0;

        // --- 1. Logo (Left Margin) ---
        if (businessInfo.logoUrl) {
            try {
                const getImageDimensions = (src: string): Promise<{ width: number; height: number } | null> => {
                    return new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => resolve({ width: img.width, height: img.height });
                        img.onerror = () => resolve(null);
                        img.src = src;
                    });
                };

                const dims = await getImageDimensions(businessInfo.logoUrl);
                if (dims) {
                    const aspectRatio = dims.width / dims.height;
                    logoHeight = 60; // Fixed height target
                    logoWidth = logoHeight * aspectRatio;

                    if (logoWidth > 150) {
                        logoWidth = 150;
                        logoHeight = logoWidth / aspectRatio;
                    }

                    const format = businessInfo.logoUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                    doc.addImage(businessInfo.logoUrl, format, margin, startY, logoWidth, logoHeight);
                }
            } catch (e) {
                console.warn("Could not add logo", e);
            }
        }

        // --- 2. Business Info (Right of Logo) ---
        const infoX = margin + logoWidth + (logoWidth > 0 ? 20 : 0);
        let infoY = startY + 10;

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30);
        doc.text(businessInfo.name || 'Your Company', infoX, infoY);
        
        infoY += 15;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        
        const rightColWidth = 150;
        const maxInfoWidth = pageWidth - margin - rightColWidth - infoX - 20;
        const safeInfoWidth = Math.max(maxInfoWidth, 200);

        const addressLines = doc.splitTextToSize(businessInfo.address || '', safeInfoWidth);
        doc.text(addressLines, infoX, infoY);
        infoY += (addressLines.length * 12);
        
        if (businessInfo.phone) {
            doc.text(businessInfo.phone, infoX, infoY);
            infoY += 12;
        }
        if (businessInfo.email) {
            doc.text(businessInfo.email, infoX, infoY);
            infoY += 12;
        }
        
        const infoBlockHeight = infoY - startY;
        headerHeight = Math.max(logoHeight, infoBlockHeight);

        // --- 3. Document Info (Far Right) ---
        let docInfoY = startY + 10;
        const rightColX = pageWidth - margin;
        
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(50);
        doc.text(displayTitle, rightColX, docInfoY, { align: 'right' });
        docInfoY += 25;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text(`Job ID: ${ticket.id}`, rightColX, docInfoY, { align: 'right' });
        docInfoY += 14;
        doc.text(`Date: ${new Date(ticket.date).toLocaleDateString()}`, rightColX, docInfoY, { align: 'right' });
        
        let yPos = startY + Math.max(headerHeight, docInfoY - startY) + 35;
        
        // --- Bill To ---
        const leftColX = margin;
        // Calculate width to avoid overlapping with potential "Service Location"
        // If service location exists, we split width.
        const hasServiceLocation = ticket.jobLocation && ticket.jobLocation !== contact.address;
        const halfPageWidth = (pageWidth - (margin * 2)) / 2;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100);
        doc.text('BILL TO', leftColX, yPos);
        
        if (hasServiceLocation) {
             doc.text('SERVICE LOCATION', leftColX + halfPageWidth + 20, yPos);
        }

        yPos += 15;
        
        // Bill To Content
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text(contact.name, leftColX, yPos);
        
        // Service Location Content (Use specific site contact name if available, else main contact)
        if (hasServiceLocation) {
            const siteName = ticket.jobLocationContactName || contact.name;
            doc.text(siteName, leftColX + halfPageWidth + 20, yPos);
        }

        yPos += 14;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50);
        
        const clientAddressLines = doc.splitTextToSize(contact.address || '', 250);
        doc.text(clientAddressLines, leftColX, yPos);
        
        let billToY = yPos + (clientAddressLines.length * 12) + 5;
        if(contact.phone) {
             doc.text(contact.phone, leftColX, billToY);
             billToY += 12;
        }
        if(contact.email) {
             doc.text(contact.email, leftColX, billToY);
             billToY += 12;
        }

        let serviceY = yPos;
        // Service Location Address
        if (hasServiceLocation && ticket.jobLocation) {
             const serviceAddressLines = doc.splitTextToSize(ticket.jobLocation, 250);
             doc.text(serviceAddressLines, leftColX + halfPageWidth + 20, yPos);
             serviceY = yPos + (serviceAddressLines.length * 12) + 5;

             if (ticket.jobLocationContactPhone) {
                 doc.text(formatPhoneNumber(ticket.jobLocationContactPhone), leftColX + halfPageWidth + 20, serviceY);
                 serviceY += 12;
             }
        }
        
        // Advance Y position to max of both columns
        yPos = Math.max(billToY, serviceY) + 20;

        // --- Item Table ---
        const tableColumn = ["Description", "Qty", "Unit Price", "Amount"];
        const tableRows: string[][] = [];

        ticket.parts.forEach(part => {
            const partData = [
                part.name,
                part.quantity.toString(),
                `$${part.cost.toFixed(2)}`,
                `$${(part.cost * part.quantity).toFixed(2)}`
            ];
            tableRows.push(partData);
        });
        
        if (ticket.laborCost > 0) {
            tableRows.push(["Labor", "-", "-", `$${ticket.laborCost.toFixed(2)}`]);
        }

        autoTable(doc, {
            startY: yPos,
            head: [tableColumn],
            body: tableRows,
            theme: 'plain',
            headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold' }, 
            styles: { fontSize: 10, cellPadding: 8, lineColor: [226, 232, 240], lineWidth: 0.5 },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 40, halign: 'center' },
                2: { cellWidth: 80, halign: 'right' },
                3: { cellWidth: 80, halign: 'right' }
            }
        });
        
        let finalY = (doc as any).lastAutoTable.finalY + 30;

        // --- Totals & Payment Options ---
        
        if (finalY > doc.internal.pageSize.getHeight() - 200) {
            doc.addPage();
            finalY = 40;
        }

        if (docType === 'estimate' && ticket.processingFeeRate > 0) {
             // ** Dual Column Estimate Layout **
             doc.setFontSize(10);
             doc.setTextColor(50);
             const rAlign = pageWidth - margin;
             
             doc.text(`Subtotal: $${subtotal.toFixed(2)}`, rAlign, finalY, {align: 'right'});
             finalY += 15;
             if (ticket.salesTaxRate > 0) {
                 doc.text(`Sales Tax (${ticket.salesTaxRate}%): $${taxAmount.toFixed(2)}`, rAlign, finalY, {align: 'right'});
                 finalY += 25;
             } else {
                 finalY += 10;
             }
             
             doc.setFontSize(12);
             doc.setFont('helvetica', 'bold');
             doc.setTextColor(0);
             doc.text("PAYMENT OPTIONS", pageWidth / 2, finalY, { align: 'center' });
             finalY += 20;
             
             const boxWidth = 240;
             const boxHeight = 130;
             const boxY = finalY;
             
             const leftBoxX = margin;
             doc.setDrawColor(226, 232, 240);
             doc.setFillColor(248, 250, 252);
             doc.roundedRect(leftBoxX, boxY, boxWidth, boxHeight, 5, 5, 'FD');
             
             doc.setFontSize(11);
             doc.text("Cash / Check", leftBoxX + (boxWidth/2), boxY + 20, { align: 'center' });
             
             doc.setDrawColor(226, 232, 240);
             doc.line(leftBoxX + 20, boxY + 30, leftBoxX + boxWidth - 20, boxY + 30);
             
             doc.setFontSize(9);
             doc.setFont('helvetica', 'normal');
             let innerY = boxY + 50;
             
             if (deposit > 0) {
                doc.text("Required Deposit (30%)", leftBoxX + 15, innerY);
                doc.text(`$${cashDeposit.toFixed(2)}`, leftBoxX + boxWidth - 15, innerY, { align: 'right' });
                innerY += 20;
                
                doc.text("Balance Due (70%)", leftBoxX + 15, innerY);
                doc.text(`$${cashBalance.toFixed(2)}`, leftBoxX + boxWidth - 15, innerY, { align: 'right' });
                innerY += 25;

                doc.setDrawColor(226, 232, 240);
                doc.line(leftBoxX + 15, innerY - 15, leftBoxX + boxWidth - 15, innerY - 15);
             } else {
                innerY += 45;
             }
             
             doc.setFontSize(11);
             doc.setFont('helvetica', 'bold');
             doc.text("Total", leftBoxX + 15, innerY);
             doc.text(`$${cashTotal.toFixed(2)}`, leftBoxX + boxWidth - 15, innerY, { align: 'right' });

             const rightBoxX = pageWidth - margin - boxWidth;
             doc.setFillColor(240, 249, 255);
             doc.setDrawColor(186, 230, 253);
             doc.roundedRect(rightBoxX, boxY, boxWidth, boxHeight, 5, 5, 'FD');
             
             doc.setFontSize(11);
             doc.setTextColor(0);
             doc.text("Card Payment", rightBoxX + (boxWidth/2), boxY + 20, { align: 'center' });

             doc.setDrawColor(186, 230, 253);
             doc.line(rightBoxX + 20, boxY + 30, rightBoxX + boxWidth - 20, boxY + 30);
             
             doc.setFontSize(9);
             doc.setFont('helvetica', 'normal');
             doc.setTextColor(50);
             innerY = boxY + 50;

             doc.text(`Processing Fee (${ticket.processingFeeRate}%)`, rightBoxX + 15, innerY);
             doc.text(`$${feeAmount.toFixed(2)}`, rightBoxX + boxWidth - 15, innerY, { align: 'right' });
             innerY += 20;

             if (deposit > 0) {
                 doc.setDrawColor(186, 230, 253);
                 doc.line(rightBoxX + 15, innerY - 12, rightBoxX + boxWidth - 15, innerY - 12);

                 doc.text("Required Deposit (30%)", rightBoxX + 15, innerY);
                 doc.text(`$${cardDeposit.toFixed(2)}`, rightBoxX + boxWidth - 15, innerY, { align: 'right' });
                 innerY += 20;
                 
                 doc.text("Balance Due (70%)", rightBoxX + 15, innerY);
                 doc.text(`$${cardBalance.toFixed(2)}`, rightBoxX + boxWidth - 15, innerY, { align: 'right' });
                 innerY += 25; 
             } else {
                 innerY += 25;
             }

             doc.setDrawColor(186, 230, 253);
             doc.line(rightBoxX + 15, innerY - 15, rightBoxX + boxWidth - 15, innerY - 15);

             doc.setFontSize(11);
             doc.setFont('helvetica', 'bold');
             doc.setTextColor(0);
             doc.text("Total Charge", rightBoxX + 15, innerY);
             doc.text(`$${cardTotal.toFixed(2)}`, rightBoxX + boxWidth - 15, innerY, { align: 'right' });

             finalY += boxHeight + 30;

        } else {
            // ** Standard Single Column Layout (Receipts or simple Estimates) **
            const rAlign = pageWidth - margin;
            const lAlign = rAlign - 150;
            
            doc.setFontSize(10);
            doc.setTextColor(50);
            
            doc.text("Subtotal:", lAlign, finalY);
            doc.text(`$${subtotal.toFixed(2)}`, rAlign, finalY, { align: 'right' });
            finalY += 15;
            
            if (ticket.salesTaxRate > 0) {
                doc.text(`Sales Tax (${ticket.salesTaxRate}%):`, lAlign, finalY);
                doc.text(`$${taxAmount.toFixed(2)}`, rAlign, finalY, { align: 'right' });
                finalY += 15;
            }
            
            if (ticket.processingFeeRate > 0) {
                 doc.text(`Processing Fee (${ticket.processingFeeRate}%):`, lAlign, finalY);
                 doc.text(`$${feeAmount.toFixed(2)}`, rAlign, finalY, { align: 'right' });
                 finalY += 15;
            }
            
            finalY += 5;
            doc.setDrawColor(200);
            doc.line(lAlign - 10, finalY - 10, rAlign, finalY - 10);
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0);
            doc.text("Total:", lAlign, finalY);
            doc.text(`$${totalCost.toFixed(2)}`, rAlign, finalY, { align: 'right' });
            finalY += 20;
            
            // Logic for Receipts based on payment status
            if (docType === 'receipt') {
                if (paymentStatus === 'paid_in_full') {
                     doc.setFontSize(10);
                     doc.setFont('helvetica', 'normal');
                     doc.setTextColor(22, 163, 74);
                     doc.text("Amount Paid:", lAlign, finalY);
                     doc.text(`-$${totalCost.toFixed(2)}`, rAlign, finalY, { align: 'right' });
                     finalY += 15;
                     
                     doc.setFontSize(12);
                     doc.setFont('helvetica', 'bold');
                     doc.setTextColor(0);
                     doc.text("Balance Due:", lAlign, finalY);
                     doc.text(`$0.00`, rAlign, finalY, { align: 'right' });
                     finalY += 20;

                } else if (paymentStatus === 'deposit_paid' && deposit > 0) {
                     doc.setFontSize(10);
                     doc.setFont('helvetica', 'normal');
                     doc.setTextColor(22, 163, 74);
                     doc.text("Deposit Paid:", lAlign, finalY);
                     doc.text(`-$${deposit.toFixed(2)}`, rAlign, finalY, { align: 'right' });
                     finalY += 15;
                     
                     doc.setFontSize(12);
                     doc.setFont('helvetica', 'bold');
                     doc.setTextColor(0);
                     doc.text("Balance Due:", lAlign, finalY);
                     doc.text(`$${balanceDue.toFixed(2)}`, rAlign, finalY, { align: 'right' });
                     finalY += 20;
                } else {
                     // Unpaid receipt/invoice
                     doc.setFontSize(12);
                     doc.setFont('helvetica', 'bold');
                     doc.setTextColor(0);
                     doc.text("Balance Due:", lAlign, finalY);
                     doc.text(`$${totalCost.toFixed(2)}`, rAlign, finalY, { align: 'right' });
                     finalY += 20;
                }
            } else {
                // Estimate logic
                 if (deposit > 0) {
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(50); // Regular color for estimate
                    doc.text("Required Deposit:", lAlign, finalY);
                    doc.text(`$${deposit.toFixed(2)}`, rAlign, finalY, { align: 'right' });
                    finalY += 15;
                    
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(0);
                    doc.text("Balance Due:", lAlign, finalY);
                    doc.text(`$${balanceDue.toFixed(2)}`, rAlign, finalY, { align: 'right' });
                    finalY += 20;
                }
            }
        }

        // --- Payment Terms / Schedule ---
        if (docType === 'estimate' && deposit > 0) {
            if (finalY > doc.internal.pageSize.getHeight() - 100) {
                doc.addPage();
                finalY = 40;
            }
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0);
            doc.text("PAYMENT SCHEDULE", margin, finalY);
            finalY += 15;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(50);
            doc.text("• A deposit is due at contract signing to schedule the work.", margin + 10, finalY);
            finalY += 15;
            doc.text("• The remaining balance is due upon completion of the job.", margin + 10, finalY);
            finalY += 20;
        }

        // --- Inspection Summary (if exists) ---
        if (ticket.inspection && ticket.inspection.length > 0) {
             if (finalY > doc.internal.pageSize.getHeight() - 150) {
                doc.addPage();
                finalY = 40;
             } else {
                finalY += 20;
             }

             doc.setFontSize(12);
             doc.setFont('helvetica', 'bold');
             doc.setTextColor(0);
             doc.text("25-POINT SAFETY INSPECTION", margin, finalY);
             finalY += 15;
             
             // Separate Pass from Fail/Repaired/NA
             const failedOrRepaired = ticket.inspection.filter(i => i.status === 'Fail' || i.status === 'Repaired');
             const passed = ticket.inspection.filter(i => i.status === 'Pass');
             
             doc.setFontSize(10);
             doc.setFont('helvetica', 'normal');
             
             if (failedOrRepaired.length > 0) {
                // Table for Issues
                const tableColumn = ["Item", "Status", "Notes"];
                const tableRows = failedOrRepaired.map(item => [
                    item.name, 
                    item.status || 'N/A', 
                    item.notes || ''
                ]);

                autoTable(doc, {
                    startY: finalY + 5,
                    head: [tableColumn],
                    body: tableRows,
                    theme: 'plain',
                    headStyles: { fillColor: [255, 235, 235], textColor: [153, 27, 27], fontStyle: 'bold' }, // Reddish for issues
                    styles: { fontSize: 9, cellPadding: 4, lineColor: [200, 200, 200], lineWidth: 0.5 },
                    columnStyles: {
                        0: { cellWidth: 120 },
                        1: { cellWidth: 60, fontStyle: 'bold' },
                        2: { cellWidth: 'auto' }
                    }
                });
                
                finalY = (doc as any).lastAutoTable.finalY + 15;
             }

             // Brief summary of Passed items
             if (passed.length > 0) {
                 doc.setFontSize(9);
                 doc.setTextColor(70);
                 doc.text(`${passed.length} additional items passed safety inspection.`, margin, finalY);
                 finalY += 15;
             }
        }
        
        // --- Footer ---
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150);
        doc.text("Thank you for your business!", pageWidth / 2, doc.internal.pageSize.getHeight() - 30, { align: 'center' });

        return { pdf: doc, fileName: `${contact.name} - ${displayTitle} ${ticket.id}.pdf` };
    };

    const handleDownload = async () => {
        if (isSaving) return;
        setIsSaving(true);
        const result = await generatePdf();
        if (result) {
            result.pdf.save(result.fileName);
        }
        setIsSaving(false);
    };

    const handleAttach = async () => {
        if (isSaving) return;
        setIsSaving(true);
        const result = await generatePdf();
        if (result) {
            const { pdf, fileName } = result;
            const pdfBlob = pdf.output('blob');
            const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
            
            try {
                 const dataUrl = await fileToDataUrl(pdfFile);
                 const newFileAttachment: FileAttachment = {
                    id: generateId(),
                    name: fileName,
                    type: 'application/pdf',
                    size: pdfFile.size,
                    dataUrl: dataUrl
                };
                await addFilesToContact(contact.id, [newFileAttachment]);
                alert('PDF attached successfully!');
            } catch (error) {
                console.error("Error attaching PDF:", error);
                alert("Failed to attach PDF.");
            }
        }
        setIsSaving(false);
    };
    
    const handleEmail = async () => {
        if (isSaving) return;
        setIsSaving(true);

        const template = docType === 'estimate' ? emailSettings.estimate : emailSettings.receipt;
        
        const templateData = {
            customerName: contact.name,
            jobId: ticket.id,
            businessName: businessInfo.name || 'Our Company',
            date: new Date().toLocaleDateString()
        };

        const subject = processTemplate(template.subject, templateData);
        const body = processTemplate(template.body, templateData);
        
        const result = await generatePdf();
        
        if (result) {
            result.pdf.save(result.fileName);

            setTimeout(() => {
                const mailtoLink = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                window.location.href = mailtoLink;
                alert("PDF downloaded. Opening email client... Please attach the PDF file to your email.");
            }, 500);
        }
        setIsSaving(false);
    };

    const handleNativeShare = async () => {
        if (isSaving) return;
        setIsSaving(true);

        const template = docType === 'estimate' ? emailSettings.estimate : emailSettings.receipt;

        const templateData = {
            customerName: contact.name,
            jobId: ticket.id,
            businessName: businessInfo.name || 'Our Company',
            date: new Date().toLocaleDateString()
        };
        
        const subject = processTemplate(template.subject, templateData);
        const body = processTemplate(template.body, templateData);

        try {
             const result = await generatePdf();
             if (!result) throw new Error("Failed to generate PDF");
             
             const pdfBlob = result.pdf.output('blob');
             const file = new File([pdfBlob], result.fileName, { type: 'application/pdf' });

             if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                 await navigator.share({
                     files: [file],
                     title: subject,
                     text: body,
                 });
             } else {
                 alert("Sharing files is not supported on this device. Please use the Email or Download option.");
             }
        } catch (error) {
            console.error("Share failed:", error);
             if (error instanceof Error && error.name !== 'AbortError') {
                alert("Share failed. Please try downloading or using the Email button.");
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-200 dark:bg-slate-900 overflow-y-auto print:bg-white print:overflow-visible print:h-auto">
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-invoice, #printable-invoice * {
                        visibility: visible;
                    }
                    #printable-invoice {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                    }
                    @page {
                        size: auto;
                        margin: 0mm;
                    }
                    html, body, #root {
                        height: auto !important;
                        overflow: visible !important;
                    }
                }
            `}</style>
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 print:hidden">
                <div className="flex flex-col xl:flex-row items-center xl:justify-between gap-4 xl:gap-0">
                    <div className="w-full xl:w-auto flex items-center justify-center xl:justify-start relative">
                        <button onClick={onClose} className="absolute left-0 xl:static p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                            <ArrowLeftIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                        <div className="flex items-center justify-center w-full xl:w-auto">
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
                    <div className="w-full xl:w-auto flex flex-wrap items-center justify-center xl:justify-end gap-2">
                        <button 
                             onClick={handleEmail}
                             disabled={isSaving}
                             className="px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 disabled:cursor-wait flex items-center space-x-2"
                             title="Generate PDF and open email draft"
                        >
                             <MailIcon className="w-4 h-4" />
                             <span>{isSaving ? '...' : 'Email'}</span>
                        </button>
                         {isNativeShareSupported && (
                            <button 
                                onClick={handleNativeShare}
                                disabled={isSaving}
                                className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-wait flex items-center space-x-2"
                                title="Share PDF file"
                            >
                                <ShareIcon className="w-4 h-4" />
                                <span>Share</span>
                            </button>
                        )}
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
                <div id="printable-invoice" ref={invoiceContentRef} className="max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-lg print:shadow-none invoice-paper">
                    <header className="flex flex-col md:flex-row justify-between items-start pb-6 border-b border-slate-200 text-slate-800">
                         {/* Left: Logo (First in visual order for mobile usually, but here we use order classes) */}
                        <div className="w-full md:w-1/3 flex justify-center md:justify-start order-1">
                            {businessInfo.logoUrl && (
                                <img src={businessInfo.logoUrl} alt="Business Logo" className="max-h-24 max-w-[150px] object-contain" />
                            )}
                        </div>

                        {/* Center: Business Info */}
                        <div className="w-full md:w-1/3 text-left md:pl-4 order-2 mt-4 md:mt-0">
                            <h1 className="text-xl font-bold break-words">{businessInfo.name || 'Your Company'}</h1>
                            <div className="text-sm text-slate-500 mt-1 space-y-0.5">
                                <p className="whitespace-pre-line break-words">{businessInfo.address}</p>
                                <p className="break-words">{businessInfo.phone}</p>
                                <p className="break-words">{businessInfo.email}</p>
                            </div>
                        </div>

                        {/* Right: Doc Info */}
                        <div className="w-full md:w-1/3 text-right order-3 mt-4 md:mt-0">
                            <h2 className="text-3xl uppercase font-bold text-slate-700">{displayTitle}</h2>
                            <div className="text-sm text-slate-500 mt-2 space-y-1">
                                <p>
                                    <span className="font-semibold text-slate-600">Job ID:</span> {ticket.id}
                                </p>
                                <p>
                                    <span className="font-semibold text-slate-600">Date:</span> {new Date(ticket.date).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </header>

                    <section className="mt-8 flex flex-col md:flex-row gap-8">
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold uppercase text-slate-500">Bill To</h3>
                            <div className="mt-2 text-slate-700 min-w-0">
                                <p className="font-bold break-words">{contact.name}</p>
                                <p className="text-sm whitespace-pre-line break-words">{contact.address}</p>
                                <p className="text-sm break-words">{contact.phone}</p>
                                <p className="text-sm break-words">{contact.email}</p>
                            </div>
                        </div>
                        {ticket.jobLocation && ticket.jobLocation !== contact.address && (
                             <div className="flex-1">
                                <h3 className="text-sm font-semibold uppercase text-slate-500">Service Location</h3>
                                <div className="mt-2 text-slate-700 min-w-0">
                                    <p className="font-bold break-words">{ticket.jobLocationContactName || contact.name}</p>
                                    <p className="text-sm whitespace-pre-line break-words">{ticket.jobLocation}</p>
                                    {ticket.jobLocationContactPhone && <p className="text-sm break-words">{formatPhoneNumber(ticket.jobLocationContactPhone)}</p>}
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="mt-8">
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
                                                    
                                                    <div className="flex justify-between text-slate-500 mt-2">
                                                        <span>Balance Due (70%)</span>
                                                        <span>${cashBalance.toFixed(2)}</span>
                                                    </div>

                                                    <div className="flex justify-between items-end border-t border-slate-200 pt-2 mt-4">
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

                                                    <div className="flex justify-between text-slate-500 mt-2">
                                                        <span>Balance Due (70%)</span>
                                                        <span>${cardBalance.toFixed(2)}</span>
                                                    </div>

                                                    <div className="flex justify-between items-end border-t border-sky-200 pt-2 mt-4">
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
                                
                                {/* Logic for Receipt vs Estimate Totals */}
                                {docType === 'estimate' ? (
                                    deposit > 0 && (
                                        <div className="flex justify-between py-2 border-t text-slate-800 font-semibold bg-slate-50 px-2 -mx-2 rounded">
                                            <span>Required Deposit (30%)</span>
                                            <span>${deposit.toFixed(2)}</span>
                                        </div>
                                    )
                                ) : (
                                    // Receipt Mode logic
                                    <>
                                        {paymentStatus === 'paid_in_full' ? (
                                            <>
                                                <div className="flex justify-between py-2 border-b border-slate-100 text-green-600 font-bold">
                                                    <span>Amount Paid</span>
                                                    <span>-${totalCost.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between py-3 border-t border-slate-300">
                                                    <span className="text-base font-bold text-slate-800">Balance Due</span>
                                                    <span className="text-base font-bold text-slate-800">$0.00</span>
                                                </div>
                                            </>
                                        ) : paymentStatus === 'deposit_paid' && deposit > 0 ? (
                                             <>
                                                <div className="flex justify-between py-2 border-b border-slate-100 text-green-600">
                                                    <span className="text-sm font-medium">Deposit Paid</span>
                                                    <span className="text-sm font-medium">-${deposit.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between py-3 border-t border-slate-300">
                                                    <span className="text-base font-bold text-slate-800">Balance Due</span>
                                                    <span className="text-base font-bold text-slate-800">${balanceDue.toFixed(2)}</span>
                                                </div>
                                            </>
                                        ) : (
                                            // Unpaid receipt
                                            <div className="flex justify-between py-3 border-t border-slate-300">
                                                <span className="text-base font-bold text-slate-800">Balance Due</span>
                                                <span className="text-base font-bold text-slate-800">${totalCost.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                       )}
                    </section>

                     {docType === 'estimate' && deposit > 0 && (
                        <section className="mt-8 pt-6 border-t border-slate-200">
                            <h3 className="text-sm font-bold text-slate-700 uppercase mb-3">Payment Schedule</h3>
                            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                                <li>A deposit is due at contract signing to schedule the work.</li>
                                <li>The remaining balance is due upon completion of the job.</li>
                            </ul>
                        </section>
                     )}

                     {ticket.inspection && ticket.inspection.length > 0 && (
                        <section className="mt-8 pt-6 border-t border-slate-200">
                            <h3 className="text-sm font-bold text-slate-700 uppercase mb-3">25-Point Safety Inspection Summary</h3>
                            
                            <div className="text-sm">
                                {(() => {
                                    const failedOrRepaired = ticket.inspection.filter(i => i.status === 'Fail' || i.status === 'Repaired');
                                    const passedCount = ticket.inspection.filter(i => i.status === 'Pass').length;
                                    
                                    return (
                                        <>
                                            {failedOrRepaired.length > 0 && (
                                                <table className="w-full text-left border-collapse mb-4">
                                                    <thead>
                                                        <tr className="bg-red-50 text-red-800">
                                                            <th className="p-2 border border-red-100 w-1/2">Item</th>
                                                            <th className="p-2 border border-red-100 w-1/4">Status</th>
                                                            <th className="p-2 border border-red-100 w-1/4">Notes</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {failedOrRepaired.map(item => (
                                                            <tr key={item.id}>
                                                                <td className="p-2 border border-slate-200 text-slate-700">{item.name}</td>
                                                                <td className={`p-2 border border-slate-200 font-bold ${item.status === 'Fail' ? 'text-red-600' : 'text-blue-600'}`}>{item.status}</td>
                                                                <td className="p-2 border border-slate-200 text-slate-500 italic">{item.notes || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                            {passedCount > 0 && (
                                                <p className="text-slate-600">
                                                    <span className="font-bold text-green-600">{passedCount}</span> additional items passed safety inspection.
                                                </p>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </section>
                     )}
                    
                    <footer className="mt-12 pt-8 border-t text-center">
                        <p className="text-sm text-slate-500">Thank you for your business!</p>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default InvoiceView;