import React, { useMemo, useState, useRef } from 'react';
import { Contact, FileAttachment, DefaultFieldSetting, WorkLogEntry } from '../types.ts';
import PhotoGalleryModal from './PhotoGalleryModal.tsx';
import WorkLogModal from './WorkLogModal.tsx';
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
import { fileToDataUrl, formatFileSize, getInitials, generateId } from '../utils.ts';

interface ContactDetailProps {
  contact: Contact;
  defaultFields: DefaultFieldSetting[];
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  addFilesToContact: (contactId: string, files: FileAttachment[]) => void;
  updateContactWorkLogs: (contactId: string, workLogs: WorkLogEntry[]) => void;
}

const VIEWABLE_MIME_TYPES = [
    'application/pdf',
    'text/plain',
    'text/csv',
    'text/html',
    'text/xml',
    'image/svg+xml',
];

const ContactDetail: React.FC<ContactDetailProps> = ({ contact, defaultFields, onEdit, onDelete, onClose, addFilesToContact, updateContactWorkLogs }) => {
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryCurrentIndex, setGalleryCurrentIndex] = useState(0);
    const [showPhotoOptions, setShowPhotoOptions] = useState(false);
    const [isWorkLogModalOpen, setIsWorkLogModalOpen] = useState(false);
    const [editingWorkLog, setEditingWorkLog] = useState<WorkLogEntry | null>(null);

    const imageUploadRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const fileUploadRef = useRef<HTMLInputElement>(null);

    const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFilesPromises = Array.from(e.target.files).map(async (file) => {
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
            addFilesToContact(contact.id, newFiles);
            if(e.target) e.target.value = ''; // Reset input
        }
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
        contact.files.forEach(file => {
            if (file.type.startsWith('image/')) {
                images.push({ url: file.dataUrl, name: file.name });
            }
        });
        return images;
    }, [contact]);
    
    const imageFiles = useMemo(() => contact.files.filter(file => file.type.startsWith('image/')), [contact.files]);
    const otherFiles = useMemo(() => contact.files.filter(file => !file.type.startsWith('image/')), [contact.files]);

    const openGallery = (index: number) => {
        setGalleryCurrentIndex(index);
        setIsGalleryOpen(true);
    };

    const handleSaveWorkLog = (entry: Omit<WorkLogEntry, 'id'> & { id?: string }) => {
        let updatedLogs;
        if (entry.id) {
            // Editing existing entry
            updatedLogs = contact.workLogs.map(log => log.id === entry.id ? { ...log, date: entry.date, description: entry.description } : log);
        } else {
            // Adding new entry
            const newLog: WorkLogEntry = { id: generateId(), date: entry.date, description: entry.description };
            updatedLogs = [newLog, ...contact.workLogs];
        }
        updateContactWorkLogs(contact.id, updatedLogs);
        setIsWorkLogModalOpen(false);
        setEditingWorkLog(null);
    };
    
    const handleDeleteWorkLog = (id: string) => {
        if (window.confirm('Are you sure you want to delete this work log?')) {
            const updatedLogs = contact.workLogs.filter(log => log.id !== id);
            updateContactWorkLogs(contact.id, updatedLogs);
        }
    };
    
    const sortedWorkLogs = useMemo(() => {
        return [...contact.workLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [contact.workLogs]);

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
            
            {/* Work Done Section */}
            <div className="p-6 border-t border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                        <BriefcaseIcon className="w-5 h-5 text-slate-400" />
                        <h2 className="ml-3 text-lg font-semibold text-slate-800">Work Done</h2>
                    </div>
                    <button 
                        onClick={() => { setEditingWorkLog(null); setIsWorkLogModalOpen(true); }}
                        className="p-2 rounded-full text-slate-500 hover:bg-slate-200"
                        aria-label="Log work done"
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>
                {sortedWorkLogs.length > 0 ? (
                    <ul className="space-y-4">
                        {sortedWorkLogs.map(log => (
                            <li key={log.id} className="p-4 bg-slate-50 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-slate-700">{new Date(log.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</p>
                                        <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{log.description}</p>
                                    </div>
                                    <div className="flex-shrink-0 ml-4 space-x-1">
                                        <button 
                                            onClick={() => { setEditingWorkLog(log); setIsWorkLogModalOpen(true); }}
                                            className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-100 rounded-full"
                                            aria-label="Edit work log"
                                        >
                                            <EditIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteWorkLog(log.id)}
                                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full"
                                            aria-label="Delete work log"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center text-slate-500 py-4">
                        <p>No work has been logged for this contact.</p>
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
                {imageFiles.length > 0 ? (
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
                 {otherFiles.length > 0 ? (
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
        {isWorkLogModalOpen && (
            <WorkLogModal
                entry={editingWorkLog}
                onSave={handleSaveWorkLog}
                onClose={() => { setIsWorkLogModalOpen(false); setEditingWorkLog(null); }}
            />
        )}
        </>
    );
};

export default ContactDetail;