import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Contact, FileAttachment, DefaultFieldSetting, JobTicket, jobStatusColors } from '../types.ts';
import PhotoGalleryModal from './PhotoGalleryModal.tsx';
import JobTicketModal from './JobTicketModal.tsx';
import {
  PhoneIcon,
  MailIcon,
  MessageIcon,
  MapPinIcon,
  EditIcon,
  TrashIcon,
  FileIcon,
  ArrowLeftIcon,
  TagIcon,
  EyeIcon,
  PlusIcon,
  CameraIcon,
  BriefcaseIcon,
} from './icons.tsx';
import { fileToDataUrl, formatFileSize, getInitials, generateId, calculateJobTicketTotal } from '../utils.ts';
import { getFiles } from '../db.ts';

interface ContactDetailProps {
  contact: Contact;
  defaultFields: DefaultFieldSetting[];
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  addFilesToContact: (contactId: string, files: FileAttachment[]) => void;
  updateContactJobTickets: (contactId: string, jobTickets: JobTicket[]) => void;
  onViewInvoice: (contactId: string, ticketId: string) => void;
}

const VIEWABLE_MIME_TYPES = [
    'application/pdf',
    'text/plain',
    'text/csv',
    'text/html',
    'text/xml',
    'image/svg+xml',
];

const ContactDetail: React.FC<ContactDetailProps> = ({ contact, defaultFields, onEdit, onDelete, onClose, addFilesToContact, updateContactJobTickets, onViewInvoice }) => {
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryCurrentIndex, setGalleryCurrentIndex] = useState(0);
    const [showPhotoOptions, setShowPhotoOptions] = useState(false);
    const [isJobTicketModalOpen, setIsJobTicketModalOpen] = useState(false);
    const [editingJobTicket, setEditingJobTicket] = useState<JobTicket | null>(null);
    const [hydratedFiles, setHydratedFiles] = useState<FileAttachment[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);

    const imageUploadRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const fileUploadRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (contact.files.length > 0) {
            setIsLoadingFiles(true);
            getFiles(contact.files.map(f => f.id))
                .then(filesFromDb => {
                    setHydratedFiles(filesFromDb);
                })
                .catch(err => {
                    console.error("Failed to load files from DB", err);
                    alert("Could not load some attachments for this contact.");
                })
                .finally(() => {
                    setIsLoadingFiles(false);
                });
        } else {
            setHydratedFiles([]);
            setIsLoadingFiles(false);
        }
    }, [contact.files]);

    const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        if (input.files && input.files.length > 0) {
            try {
                const newFilesPromises = Array.from(input.files).map(async (file: File) => {
                    const dataUrl = await fileToDataUrl(file);
                    return {
                        id: generateId(),
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        dataUrl: dataUrl,
                    };
                });
                const newFiles = await Promise.all(newFilesPromises);
                await addFilesToContact(contact.id, newFiles);
            } catch (error) {
                console.error("Error reading files:", error);
                alert("There was an error processing your files. They might be too large or corrupted.");
            }
        }
        // Always reset input to allow re-selecting the same file, and hide options
        input.value = '';
        setShowPhotoOptions(false);
    };

    const allCustomFields = useMemo(() => {
        const fieldsToShow = [...contact.customFields];
        const existingLabels = new Set(contact.customFields.map(cf => cf.label.toLowerCase()));

        defaultFields.forEach(df => {
            if (!existingLabels.has(df.label.toLowerCase())) {
                fieldsToShow.push({
                    id: df.id,
                    label: df.label,
                    value: '',
                });
            }
        });
        return fieldsToShow;
    }, [contact.customFields, defaultFields]);
    
    const galleryImages = useMemo(() => {
        const images: { url: string; name: string }[] = [];
        if (contact.photoUrl) {
            images.push({ url: contact.photoUrl, name: `${contact.name} (Profile)` });
        }
        hydratedFiles.forEach(file => {
            if (file.type.startsWith('image/') && file.dataUrl) {
                images.push({ url: file.dataUrl, name: file.name });
            }
        });
        return images;
    }, [contact.photoUrl, contact.name, hydratedFiles]);
    
    const imageFiles = useMemo(() => hydratedFiles.filter(file => file.type.startsWith('image/')), [hydratedFiles]);
    const otherFiles = useMemo(() => hydratedFiles.filter(file => !file.type.startsWith('image/')), [hydratedFiles]);

    const openGallery = (index: number) => {
        setGalleryCurrentIndex(index);
        setIsGalleryOpen(true);
    };

    const handleSaveJobTicket = (entry: Omit<JobTicket, 'id'> & { id?: string }) => {
        let updatedTickets;
        if (entry.id) {
            // Editing existing entry
            updatedTickets = contact.jobTickets.map(ticket => ticket.id === entry.id ? { ...ticket, ...entry } : ticket);
        } else {
            // Adding new entry
            const newTicket: JobTicket = { 
                id: generateId(), 
                date: entry.date, 
                notes: entry.notes,
                status: entry.status,
                parts: entry.parts,
                laborCost: entry.laborCost,
                salesTaxRate: entry.salesTaxRate,
                processingFeeRate: entry.processingFeeRate,
            };
            updatedTickets = [newTicket, ...contact.jobTickets];
        }
        updateContactJobTickets(contact.id, updatedTickets);
        setIsJobTicketModalOpen(false);
        setEditingJobTicket(null);
    };
    
    const handleDeleteJobTicket = (id: string) => {
        if (window.confirm('Are you sure you want to delete this job ticket?')) {
            const updatedTickets = contact.jobTickets.filter(ticket => ticket.id !== id);
            updateContactJobTickets(contact.id, updatedTickets);
        }
    };
    
    const sortedJobTickets = useMemo(() => {
        return [...contact.jobTickets].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [contact.jobTickets]);

    return (
        <>
        <div className="h-full flex flex-col bg-white overflow-y-auto">
             <div className="p-4 flex items-center md:hidden border-b border-slate-200">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                    <ArrowLeftIcon className="w-6 h-6 text-slate-600" />
                </button>
                <h2 className="ml-4 font-bold text-lg text-slate-700">Contact Details</h2>
            </div>
            {/* Header */}
            <div className="flex flex-col items-center p-6 bg-slate-50 border-b border-slate-200">
                <div className="relative group w-32 h-32 rounded-full overflow-hidden bg-slate-300 flex items-center justify-center mb-4 ring-4 ring-white ring-offset-2 ring-offset-slate-50">
                    {contact.photoUrl ? (
                        <img src={contact.photoUrl} alt={contact.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-5xl text-slate-600 font-semibold">{getInitials(contact.name)}</span>
                    )}
                    {galleryImages.length > 0 && (
                        <button onClick={() => openGallery(0)} className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-label="View photos">
                            <EyeIcon className="w-8 h-8"/>
                        </button>
                    )}
                </div>
                <h1 className="text-3xl font-bold text-slate-800">{contact.name}</h1>
                <div className="flex space-x-3 mt-4">
                    <button onClick={onEdit} className="p-2 rounded-full text-slate-600 bg-slate-200 hover:bg-slate-300 transition-colors">
                        <EditIcon className="w-5 h-5" />
                    </button>
                    <button onClick={onDelete} className="p-2 rounded-full text-red-600 bg-red-100 hover:bg-red-200 transition-colors">
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-4 p-4 border-b border-slate-200">
                <a href={`tel:${contact.phone}`} className="flex flex-col items-center p-3 rounded-lg hover:bg-sky-50 transition-colors text-sky-600">
                    <PhoneIcon className="w-6 h-6 mb-1" />
                    <span className="text-sm font-medium">Call</span>
                </a>
                <a href={`sms:${contact.phone}`} className="flex flex-col items-center p-3 rounded-lg hover:bg-sky-50 transition-colors text-sky-600">
                    <MessageIcon className="w-6 h-6 mb-1" />
                    <span className="text-sm font-medium">Text</span>
                </a>
                <a href={`mailto:${contact.email}`} className="flex flex-col items-center p-3 rounded-lg hover:bg-sky-50 transition-colors text-sky-600">
                    <MailIcon className="w-6 h-6 mb-1" />
                    <span className="text-sm font-medium">Email</span>
                </a>
            </div>

            {/* Contact Info */}
            <div className="p-6 space-y-4">
                <div className="flex items-start">
                    <MailIcon className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                    <div className="ml-4">
                        <p className="font-semibold text-slate-700">{contact.email}</p>
                        <p className="text-sm text-slate-500">Email</p>
                    </div>
                </div>
                <div className="flex items-start">
                    <PhoneIcon className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                    <div className="ml-4">
                        <p className="font-semibold text-slate-700">{contact.phone}</p>
                        <p className="text-sm text-slate-500">Mobile</p>
                    </div>
                </div>
                <div className="flex items-start">
                    <MapPinIcon className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                    <div className="ml-4">
                       {contact.address ? (
                         <a
                           href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="font-semibold text-slate-700 hover:text-sky-600 hover:underline cursor-pointer transition-colors"
                         >
                           {contact.address}
                         </a>
                       ) : (
                         <p className="font-semibold text-slate-700 italic text-slate-400">Not set</p>
                       )}
                       <p className="text-sm text-slate-500">Address</p>
                    </div>
                </div>
            </div>

            {/* Custom Fields */}
            {allCustomFields.length > 0 && (
                <div className="p-6 border-t border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Additional Information</h2>
                    <div className="space-y-4">
                        {allCustomFields.map(field => (
                            <div key={field.id} className="flex items-start">
                                <TagIcon className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                                <div className="ml-4">
                                    <p className={`font-semibold ${field.value ? 'text-slate-700' : 'text-slate-400 italic'}`}>
                                        {field.value || 'Not set'}
                                    </p>
                                    <p className="text-sm text-slate-500">{field.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Jobs Section */}
            <div className="p-6 border-t border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                        <BriefcaseIcon className="w-5 h-5 text-slate-400" />
                        <h2 className="ml-3 text-lg font-semibold text-slate-800">Jobs</h2>
                    </div>
                    <button 
                        onClick={() => { setEditingJobTicket(null); setIsJobTicketModalOpen(true); }}
                        className="p-2 rounded-full text-slate-500 hover:bg-slate-200"
                        aria-label="Add Job Ticket"
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>
                {sortedJobTickets.length > 0 ? (
                    <ul className="space-y-4">
                        {sortedJobTickets.map(ticket => {
                             const { totalCost } = calculateJobTicketTotal(ticket);
                             const statusColor = jobStatusColors[ticket.status];
                             return (
                                <li key={ticket.id} className="p-4 bg-slate-50 rounded-lg">
                                    <div className="flex justify-start items-center mb-2">
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColor.base} ${statusColor.text}`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-baseline mb-3">
                                        <p className="font-semibold text-slate-700">{new Date(ticket.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</p>
                                        <p className="font-bold text-lg text-slate-800">${totalCost.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center justify-evenly mb-3">
                                        <button 
                                            onClick={() => onViewInvoice(contact.id, ticket.id)}
                                            className="px-3 py-1 text-xs font-medium text-sky-700 bg-sky-100 hover:bg-sky-200 rounded-md"
                                        >
                                           View/Print
                                        </button>
                                        <button 
                                            onClick={() => { setEditingJobTicket(ticket); setIsJobTicketModalOpen(true); }}
                                            className="p-2 bg-sky-500 text-white hover:bg-sky-600 rounded-md"
                                            aria-label="Edit job ticket"
                                        >
                                            <EditIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteJobTicket(ticket.id)}
                                            className="p-2 bg-red-500 text-white hover:bg-red-600 rounded-md"
                                            aria-label="Delete job ticket"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {ticket.notes && (
                                        <p className="text-sm text-slate-600 whitespace-pre-wrap border-t border-slate-200 pt-3">{ticket.notes}</p>
                                    )}
                                </li>
                             )
                        })}
                    </ul>
                ) : (
                    <div className="text-center text-slate-500 py-4">
                        <p>No jobs have been logged for this contact.</p>
                    </div>
                )}
            </div>

            {/* Hidden file inputs */}
            <input type="file" accept="image/*" multiple ref={imageUploadRef} onChange={handleFilesSelected} className="hidden" />
            <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFilesSelected} className="hidden" />
            <input type="file" multiple ref={fileUploadRef} onChange={handleFilesSelected} className="hidden" />

            {/* Photos Section */}
            <div className="p-6 border-t border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-slate-800">Photos</h2>
                    <div className="relative">
                        <button 
                            onClick={() => setShowPhotoOptions(!showPhotoOptions)} 
                            className="p-2 rounded-full text-slate-500 hover:bg-slate-200"
                            aria-label="Add photo"
                        >
                            <PlusIcon className="w-5 h-5" />
                        </button>
                        {showPhotoOptions && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 ring-1 ring-black ring-opacity-5">
                                <button onClick={() => cameraInputRef.current?.click()} className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                                    <CameraIcon className="w-5 h-5 mr-3" />
                                    Take Photo
                                </button>
                                <button onClick={() => imageUploadRef.current?.click()} className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                                    <FileIcon className="w-5 h-5 mr-3" />
                                    Upload Image
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                {isLoadingFiles ? (
                     <div className="text-center text-slate-500 py-4">Loading photos...</div>
                ) : imageFiles.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {imageFiles.map(file => {
                            const imageIndexInGallery = galleryImages.findIndex(img => img.url === file.dataUrl);
                            return (
                                <button
                                    key={file.id}
                                    onClick={() => openGallery(imageIndexInGallery)}
                                    className="aspect-square rounded-lg overflow-hidden bg-slate-200 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                                >
                                    <img src={file.dataUrl} alt={file.name} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center text-slate-500 py-4">
                        <p>No photos attached.</p>
                    </div>
                )}
            </div>

            {/* Files Section */}
            <div className="p-6 border-t border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-slate-800">Files</h2>
                    <button 
                        onClick={() => fileUploadRef.current?.click()}
                        className="p-2 rounded-full text-slate-500 hover:bg-slate-200"
                        aria-label="Add file"
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>
                 {isLoadingFiles ? (
                     <div className="text-center text-slate-500 py-4">Loading files...</div>
                 ) : otherFiles.length > 0 ? (
                    <ul className="space-y-3">
                        {otherFiles.map(file => (
                            <li key={file.id} className="flex items-center p-3 bg-slate-50 rounded-lg">
                                <FileIcon className="w-6 h-6 text-slate-500 flex-shrink-0" />
                                <div className="ml-3 flex-grow truncate">
                                    <p className="font-medium text-slate-700 truncate">{file.name}</p>
                                    <p className="text-sm text-slate-500">{formatFileSize(file.size)}</p>
                                </div>
                                <div className="ml-4 flex-shrink-0 flex items-center space-x-4">
                                    {VIEWABLE_MIME_TYPES.includes(file.type) && (
                                        <a href={file.dataUrl} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-800 font-medium text-sm">View</a>
                                    )}
                                    <a href={file.dataUrl} download={file.name} className="text-sky-600 hover:text-sky-800 font-medium text-sm">Download</a>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center text-slate-500 py-4">
                        <p>No files attached.</p>
                    </div>
                )}
            </div>
        </div>
        {isGalleryOpen && (
            <PhotoGalleryModal
                images={galleryImages}
                startIndex={galleryCurrentIndex}
                onClose={() => setIsGalleryOpen(false)}
            />
        )}
        {isJobTicketModalOpen && (
            <JobTicketModal
                entry={editingJobTicket}
                onSave={handleSaveJobTicket}
                onClose={() => { setIsJobTicketModalOpen(false); setEditingJobTicket(null); }}
            />
        )}
        </>
    );
};

export default ContactDetail;
