import React, { useState } from 'react';
import { Contact, JobTicket, BusinessInfo } from '../types.ts';
import { ArrowLeftIcon } from './icons.tsx';

interface InvoiceViewProps {
    contact: Contact;
    ticket: JobTicket;
    businessInfo: BusinessInfo;
    onClose: () => void;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ contact, ticket, businessInfo, onClose }) => {
    const [docType, setDocType] = useState<'invoice' | 'quote'>('invoice');

    const totalPartsCost = ticket.parts.reduce((sum, part) => sum + part.cost, 0);
    const totalCost = totalPartsCost + ticket.laborCost;

    return (
        <div className="h-full flex flex-col bg-slate-200 overflow-y-auto">
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
                        className="px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600"
                    >
                        Print
                    </button>
                </div>
            </div>

            {/* Invoice Paper */}
            <div className="p-4 md:p-8 flex-grow">
                <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-lg print:shadow-none">
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
                                <span className="font-semibold">Job ID:</span> {ticket.id.slice(0, 8)}
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
                        <div className="w-full max-w-xs">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-sm font-medium text-slate-600">Subtotal</span>
                                <span className="text-sm font-medium text-slate-700">${totalCost.toFixed(2)}</span>
                            </div>
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
                    body {
                        background-color: white;
                    }
                    .print\\:hidden {
                        display: none;
                    }
                    .print\\:shadow-none {
                        box-shadow: none;
                    }
                }
            `}
            </style>
        </div>
    );
};

export default InvoiceView;
