import React, { useMemo, useState, useRef, useEffect } from 'react';
import PhotoGalleryModal from './PhotoGalleryModal.js';
import JobTicketModal from './JobTicketModal.js';
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
} from './icons.js';
import { fileToDataUrl, formatFileSize, getInitials, generateId } from '../utils.js';
import { getFiles } from '../db.js';

const VIEWABLE_MIME_TYPES = [
    'application/pdf',
    'text/plain',
    'text/csv',
    'text/html',
    'text/xml',
    'image/svg+xml',
];

const jobStatusColors = {
  Scheduled: { base: 'bg-sky-100', text: 'text-sky-800' },
  'In Progress': { base: 'bg-yellow-100', text: 'text-yellow-800' },
  'Awaiting Parts': { base: 'bg-purple-100', text: 'text-purple-800' },
  Completed: { base: 'bg-green-100', text: 'text-green-800' },
  Invoiced: { base: 'bg-slate-200', text: 'text-slate-700' },
};

const ContactDetail = ({ contact, defaultFields, onEdit, onDelete, onClose, addFilesToContact, updateContactJobTickets, onViewInvoice }) => {
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryCurrentIndex, setGalleryCurrentIndex] = useState(0);
    const [showPhotoOptions, setShowPhotoOptions] = useState(false);
    const [isJobTicketModalOpen, setIsJobTicketModalOpen] = useState(false);
    const [editingJobTicket, setEditingJobTicket] = useState(null);
    const [hydratedFiles, setHydratedFiles] = useState([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);

    const imageUploadRef = useRef(null);
    const cameraInputRef = useRef(null);
    const fileUploadRef = useRef(null);
    
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

    const handleFilesSelected = async (e) => {
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
            await addFilesToContact(contact.id, newFiles);
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
        const images = [];
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

    const openGallery = (index) => {
        setGalleryCurrentIndex(index);
        setIsGalleryOpen(true);
    };

    const handleSaveJobTicket = (entry) => {
        let updatedTickets;
        if (entry.id) {
            updatedTickets = contact.jobTickets.map(ticket => ticket.id === entry.id ? { ...ticket, ...entry } : ticket);
        } else {
            const newTicket = { 
                id: generateId(), 
                date: entry.date, 
                notes: entry.notes,
                status: entry.status,
                parts: entry.parts,
                laborCost: entry.laborCost,
            };
            updatedTickets = [newTicket, ...contact.jobTickets];
        }
        updateContactJobTickets(contact.id, updatedTickets);
        setIsJobTicketModalOpen(false);
        setEditingJobTicket(null);
    };
    
    const handleDeleteJobTicket = (id) => {
        if (window.confirm('Are you sure you want to delete this job ticket?')) {
            const updatedTickets = contact.jobTickets.filter(ticket => ticket.id !== id);
            updateContactJobTickets(contact.id, updatedTickets);
        }
    };
    
    const sortedJobTickets = useMemo(() => {
        return [...contact.jobTickets].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [contact.jobTickets]);

    return (
        React.createElement(React.Fragment, null,
            React.createElement("div", { className: "h-full flex flex-col bg-white overflow-y-auto" },
                React.createElement("div", { className: "p-4 flex items-center md:hidden border-b border-slate-200" },
                    React.createElement("button", { onClick: onClose, className: "p-2 rounded-full hover:bg-slate-100" },
                        React.createElement(ArrowLeftIcon, { className: "w-6 h-6 text-slate-600" })
                    ),
                    React.createElement("h2", { className: "ml-4 font-bold text-lg text-slate-700" }, "Contact Details")
                ),
                React.createElement("div", { className: "flex flex-col items-center p-6 bg-slate-50 border-b border-slate-200" },
                    React.createElement("div", { className: "relative group w-32 h-32 rounded-full overflow-hidden bg-slate-300 flex items-center justify-center mb-4 ring-4 ring-white ring-offset-2 ring-offset-slate-50" },
                        contact.photoUrl ? (
                            React.createElement("img", { src: contact.photoUrl, alt: contact.name, className: "w-full h-full object-cover" })
                        ) : (
                            React.createElement("span", { className: "text-5xl text-slate-600 font-semibold" }, getInitials(contact.name))
                        ),
                        galleryImages.length > 0 && (
                            React.createElement("button", { onClick: () => openGallery(0), className: "absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300", "aria-label": "View photos" },
                                React.createElement(EyeIcon, { className: "w-8 h-8" })
                            )
                        )
                    ),
                    React.createElement("h1", { className: "text-3xl font-bold text-slate-800" }, contact.name),
                    React.createElement("div", { className: "flex space-x-3 mt-4" },
                        React.createElement("button", { onClick: onEdit, className: "p-2 rounded-full text-slate-600 bg-slate-200 hover:bg-slate-300 transition-colors" },
                            React.createElement(EditIcon, { className: "w-5 h-5" })
                        ),
                        React.createElement("button", { onClick: onDelete, className: "p-2 rounded-full text-red-600 bg-red-100 hover:bg-red-200 transition-colors" },
                            React.createElement(TrashIcon, { className: "w-5 h-5" })
                        )
                    )
                ),
                React.createElement("div", { className: "grid grid-cols-3 gap-4 p-4 border-b border-slate-200" },
                    React.createElement("a", { href: `tel:${contact.phone}`, className: "flex flex-col items-center p-3 rounded-lg hover:bg-sky-50 transition-colors text-sky-600" },
                        React.createElement(PhoneIcon, { className: "w-6 h-6 mb-1" }),
                        React.createElement("span", { className: "text-sm font-medium" }, "Call")
                    ),
                    React.createElement("a", { href: `sms:${contact.phone}`, className: "flex flex-col items-center p-3 rounded-lg hover:bg-sky-50 transition-colors text-sky-600" },
                        React.createElement(MessageIcon, { className: "w-6 h-6 mb-1" }),
                        React.createElement("span", { className: "text-sm font-medium" }, "Text")
                    ),
                    React.createElement("a", { href: `mailto:${contact.email}`, className: "flex flex-col items-center p-3 rounded-lg hover:bg-sky-50 transition-colors text-sky-600" },
                        React.createElement(MailIcon, { className: "w-6 h-6 mb-1" }),
                        React.createElement("span", { className: "text-sm font-medium" }, "Email")
                    )
                ),
                React.createElement("div", { className: "p-6 space-y-4" },
                    React.createElement("div", { className: "flex items-start" },
                        React.createElement(MailIcon, { className: "w-5 h-5 text-slate-400 mt-1 flex-shrink-0" }),
                        React.createElement("div", { className: "ml-4" },
                            React.createElement("p", { className: "font-semibold text-slate-700" }, contact.email),
                            React.createElement("p", { className: "text-sm text-slate-500" }, "Email")
                        )
                    ),
                    React.createElement("div", { className: "flex items-start" },
                        React.createElement(PhoneIcon, { className: "w-5 h-5 text-slate-400 mt-1 flex-shrink-0" }),
                        React.createElement("div", { className: "ml-4" },
                            React.createElement("p", { className: "font-semibold text-slate-700" }, contact.phone),
                            React.createElement("p", { className: "text-sm text-slate-500" }, "Mobile")
                        )
                    ),
                    React.createElement("div", { className: "flex items-start" },
                        React.createElement(MapPinIcon, { className: "w-5 h-5 text-slate-400 mt-1 flex-shrink-0" }),
                        React.createElement("div", { className: "ml-4" },
                           contact.address ? (
                             React.createElement("a", {
                               href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`,
                               target: "_blank",
                               rel: "noopener noreferrer",
                               className: "font-semibold text-slate-700 hover:text-sky-600 hover:underline cursor-pointer transition-colors"
                             }, contact.address)
                           ) : (
                             React.createElement("p", { className: "font-semibold text-slate-700 italic text-slate-400" }, "Not set")
                           ),
                           React.createElement("p", { className: "text-sm text-slate-500" }, "Address")
                        )
                    )
                ),
                allCustomFields.length > 0 && (
                    React.createElement("div", { className: "p-6 border-t border-slate-200" },
                        React.createElement("h2", { className: "text-lg font-semibold text-slate-800 mb-4" }, "Additional Information"),
                        React.createElement("div", { className: "space-y-4" },
                            allCustomFields.map(field => (
                                React.createElement("div", { key: field.id, className: "flex items-start" },
                                    React.createElement(TagIcon, { className: "w-5 h-5 text-slate-400 mt-1 flex-shrink-0" }),
                                    React.createElement("div", { className: "ml-4" },
                                        React.createElement("p", { className: `font-semibold ${field.value ? 'text-slate-700' : 'text-slate-400 italic'}` },
                                            field.value || 'Not set'
                                        ),
                                        React.createElement("p", { className: "text-sm text-slate-500" }, field.label)
                                    )
                                )
                            ))
                        )
                    )
                ),
                React.createElement("div", { className: "p-6 border-t border-slate-200" },
                    React.createElement("div", { className: "flex justify-between items-center mb-4" },
                        React.createElement("div", { className: "flex items-center" },
                            React.createElement(BriefcaseIcon, { className: "w-5 h-5 text-slate-400" }),
                            React.createElement("h2", { className: "ml-3 text-lg font-semibold text-slate-800" }, "Jobs")
                        ),
                        React.createElement("button", { 
                            onClick: () => { setEditingJobTicket(null); setIsJobTicketModalOpen(true); },
                            className: "p-2 rounded-full text-slate-500 hover:bg-slate-200",
                            "aria-label": "Add Job Ticket"
                        }, React.createElement(PlusIcon, { className: "w-5 h-5" }))
                    ),
                    sortedJobTickets.length > 0 ? (
                        React.createElement("ul", { className: "space-y-4" },
                            sortedJobTickets.map(ticket => {
                                const totalCost = ticket.laborCost + ticket.parts.reduce((sum, part) => sum + part.cost, 0);
                                const statusColor = jobStatusColors[ticket.status];
                                return React.createElement("li", { key: ticket.id, className: "p-4 bg-slate-50 rounded-lg" },
                                    React.createElement("div", { className: "flex justify-between items-start" },
                                        React.createElement("div", null,
                                            React.createElement("div", { className: "flex items-center gap-x-3" },
                                                React.createElement("p", { className: "font-semibold text-slate-700" }, new Date(ticket.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })),
                                                React.createElement("span", { className: `px-2 py-0.5 text-xs font-medium rounded-full ${statusColor.base} ${statusColor.text}` }, ticket.status)
                                            ),
                                            React.createElement("p", { className: "mt-2 text-sm text-slate-600 whitespace-pre-wrap" }, ticket.notes)
                                        ),
                                        React.createElement("div", { className: "text-right flex-shrink-0 ml-4" },
                                            React.createElement("p", { className: "font-bold text-lg text-slate-800" }, `$${totalCost.toFixed(2)}`),
                                            React.createElement("div", { className: "mt-2 flex items-center justify-end space-x-1" },
                                                React.createElement("button", { 
                                                    onClick: () => onViewInvoice(contact.id, ticket.id),
                                                    className: "px-3 py-1 text-xs font-medium text-sky-700 bg-sky-100 hover:bg-sky-200 rounded-md"
                                                }, "View/Print"),
                                                React.createElement("button", { 
                                                    onClick: () => { setEditingJobTicket(ticket); setIsJobTicketModalOpen(true); },
                                                    className: "p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-100 rounded-full",
                                                    "aria-label": "Edit job ticket"
                                                }, React.createElement(EditIcon, { className: "w-4 h-4" })),
                                                React.createElement("button", {
                                                    onClick: () => handleDeleteJobTicket(ticket.id),
                                                    className: "p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full",
                                                    "aria-label": "Delete job ticket"
                                                }, React.createElement(TrashIcon, { className: "w-4 h-4" }))
                                            )
                                        )
                                    )
                                );
                            })
                        )
                    ) : (
                        React.createElement("div", { className: "text-center text-slate-500 py-4" },
                            React.createElement("p", null, "No jobs have been logged for this contact.")
                        )
                    )
                ),
                React.createElement("input", { type: "file", accept: "image/*", multiple: true, ref: imageUploadRef, onChange: handleFilesSelected, className: "hidden" }),
                React.createElement("input", { type: "file", accept: "image/*", capture: "environment", ref: cameraInputRef, onChange: handleFilesSelected, className: "hidden" }),
                React.createElement("input", { type: "file", multiple: true, ref: fileUploadRef, onChange: handleFilesSelected, className: "hidden" }),
                React.createElement("div", { className: "p-6 border-t border-slate-200" },
                    React.createElement("div", { className: "flex justify-between items-center mb-4" },
                        React.createElement("h2", { className: "text-lg font-semibold text-slate-800" }, "Photos"),
                        React.createElement("div", { className: "relative" },
                            React.createElement("button", { 
                                onClick: () => setShowPhotoOptions(!showPhotoOptions), 
                                className: "p-2 rounded-full text-slate-500 hover:bg-slate-200",
                                "aria-label": "Add photo"
                            }, React.createElement(PlusIcon, { className: "w-5 h-5" })),
                            showPhotoOptions && (
                                React.createElement("div", { className: "absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 ring-1 ring-black ring-opacity-5" },
                                    React.createElement("button", { onClick: () => cameraInputRef.current?.click(), className: "w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" },
                                        React.createElement(CameraIcon, { className: "w-5 h-5 mr-3" }), "Take Photo"
                                    ),
                                    React.createElement("button", { onClick: () => imageUploadRef.current?.click(), className: "w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" },
                                        React.createElement(FileIcon, { className: "w-5 h-5 mr-3" }), "Upload Image"
                                    )
                                )
                            )
                        )
                    ),
                    isLoadingFiles ? (
                         React.createElement("div", { className: "text-center text-slate-500 py-4" }, "Loading photos...")
                    ) : imageFiles.length > 0 ? (
                        React.createElement("div", { className: "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-4" },
                            imageFiles.map(file => {
                                const imageIndexInGallery = galleryImages.findIndex(img => img.url === file.dataUrl);
                                return (
                                    React.createElement("button", {
                                        key: file.id,
                                        onClick: () => openGallery(imageIndexInGallery),
                                        className: "aspect-square rounded-lg overflow-hidden bg-slate-200 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                                    },
                                        React.createElement("img", { src: file.dataUrl, alt: file.name, className: "w-full h-full object-cover group-hover:opacity-80 transition-opacity" })
                                    )
                                );
                            })
                        )
                    ) : (
                        React.createElement("div", { className: "text-center text-slate-500 py-4" },
                            React.createElement("p", null, "No photos attached.")
                        )
                    )
                ),
                React.createElement("div", { className: "p-6 border-t border-slate-200" },
                    React.createElement("div", { className: "flex justify-between items-center mb-4" },
                        React.createElement("h2", { className: "text-lg font-semibold text-slate-800" }, "Files"),
                        React.createElement("button", { 
                            onClick: () => fileUploadRef.current?.click(),
                            className: "p-2 rounded-full text-slate-500 hover:bg-slate-200",
                            "aria-label": "Add file"
                        }, React.createElement(PlusIcon, { className: "w-5 h-5" }))
                    ),
                     isLoadingFiles ? (
                        React.createElement("div", { className: "text-center text-slate-500 py-4" }, "Loading files...")
                     ) : otherFiles.length > 0 ? (
                        React.createElement("ul", { className: "space-y-3" },
                            otherFiles.map(file => (
                                React.createElement("li", { key: file.id, className: "flex items-center p-3 bg-slate-50 rounded-lg" },
                                    React.createElement(FileIcon, { className: "w-6 h-6 text-slate-500 flex-shrink-0" }),
                                    React.createElement("div", { className: "ml-3 flex-grow truncate" },
                                        React.createElement("p", { className: "font-medium text-slate-700 truncate" }, file.name),
                                        React.createElement("p", { className: "text-sm text-slate-500" }, formatFileSize(file.size))
                                    ),
                                    React.createElement("div", { className: "ml-4 flex-shrink-0 flex items-center space-x-4" },
                                        VIEWABLE_MIME_TYPES.includes(file.type) && (
                                            React.createElement("a", { href: file.dataUrl, target: "_blank", rel: "noopener noreferrer", className: "text-sky-600 hover:text-sky-800 font-medium text-sm" }, "View")
                                        ),
                                        React.createElement("a", { href: file.dataUrl, download: file.name, className: "text-sky-600 hover:text-sky-800 font-medium text-sm" }, "Download")
                                    )
                                )
                            ))
                        )
                    ) : (
                        React.createElement("div", { className: "text-center text-slate-500 py-4" },
                            React.createElement("p", null, "No files attached.")
                        )
                    )
                )
            ),
            isGalleryOpen && (
                React.createElement(PhotoGalleryModal, {
                    images: galleryImages,
                    startIndex: galleryCurrentIndex,
                    onClose: () => setIsGalleryOpen(false)
                })
            ),
            isJobTicketModalOpen && (
                React.createElement(JobTicketModal, {
                    entry: editingJobTicket,
                    onSave: handleSaveJobTicket,
                    onClose: () => { setIsJobTicketModalOpen(false); setEditingJobTicket(null); }
                })
            )
        )
    );
};

export default ContactDetail;
