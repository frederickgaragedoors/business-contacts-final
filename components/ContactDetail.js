

















import React, { useMemo, useState, useRef, useEffect } from 'react';
import PhotoGalleryModal from './PhotoGalleryModal.js';
import JobTicketModal from './JobTicketModal.js';
import EmptyState from './EmptyState.js';
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
  ClipboardListIcon,
  HomeIcon,
} from './icons.js';
import { fileToDataUrl, formatFileSize, getInitials, generateId, calculateJobTicketTotal, formatTime } from '../utils.js';
import { getFiles } from '../db.js';
import { jobStatusColors, paymentStatusColors, paymentStatusLabels } from '../types.js';


const VIEWABLE_MIME_TYPES = [
    'application/pdf',
    'text/plain',
    'text/csv',
    'text/html',
    'text/xml',
    'image/svg+xml',
];

const ContactDetail = ({ contact, defaultFields, onEdit, onDelete, onClose, addFilesToContact, updateContactJobTickets, onViewInvoice, onViewJobDetail, jobTemplates, partsCatalog, enabledStatuses, initialJobDate, openJobId, businessInfo }) => {
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryCurrentIndex, setGalleryCurrentIndex] = useState(0);
    const [showPhotoOptions, setShowPhotoOptions] = useState(false);
    const [isJobTicketModalOpen, setIsJobTicketModalOpen] = useState(false);
    const [editingJobTicket, setEditingJobTicket] = useState(null);
    const [hydratedFiles, setHydratedFiles] = useState([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [activeTab, setActiveTab] = useState('details');

    const imageUploadRef = useRef(null);
    const cameraInputRef = useRef(null);
    const fileUploadRef = useRef(null);

    // Handle initialJobDate prop to open modal automatically for NEW job
    // OR openJobId to open modal automatically for EXISTING job
    useEffect(() => {
        if (initialJobDate) {
            setActiveTab('jobs');
            setEditingJobTicket({
                id: generateId(),
                date: initialJobDate,
                status: 'Estimate Scheduled',
                notes: '',
                parts: [],
                laborCost: 0,
                createdAt: new Date().toISOString(),
                salesTaxRate: businessInfo?.defaultSalesTaxRate || 0,
                processingFeeRate: businessInfo?.defaultProcessingFeeRate || 0,
                jobLocation: contact.address || '',
            });
            setIsJobTicketModalOpen(true);
        } else if (openJobId) {
             const ticketToEdit = contact.jobTickets?.find(t => t.id === openJobId);
             if (ticketToEdit) {
                 setActiveTab('jobs');
                 setEditingJobTicket(ticketToEdit);
                 setIsJobTicketModalOpen(true);
             }
        }
    }, [initialJobDate, openJobId, businessInfo]);
    
    const handleViewFile = async (file) => {
        if (!file.dataUrl) return;
        try {
            const response = await fetch(file.dataUrl);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error('Error opening file:', error);
            alert('Could not open the file.');
        }
    };

    useEffect(() => {
        const contactFiles = contact.files || [];
        if (contactFiles.length > 0) {
            setIsLoadingFiles(true);
            getFiles(contactFiles.map(f => f.id))
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
        const input = e.target;
        if (input.files) {
            try {
                const newFilesPromises = Array.from(input.files).map(async (file) => {
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
            if(input) input.value = ''; // Reset input
        }
        setShowPhotoOptions(false);
    };

    const allCustomFields = useMemo(() => {
        const fieldsToShow = [...(contact.customFields || [])];
        const existingLabels = new Set(fieldsToShow.map(cf => cf.label.toLowerCase()));

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
        const currentTickets = contact.jobTickets || [];
        if (entry.id && currentTickets.some(t => t.id === entry.id)) {
            updatedTickets = currentTickets.map(ticket => ticket.id === entry.id ? { ...ticket, ...entry } : ticket);
        } else {
            const newTicket = { 
                id: entry.id || generateId(), 
                date: entry.date, 
                time: entry.time,
                notes: entry.notes,
                status: entry.status,
                parts: entry.parts,
                laborCost: entry.laborCost,
                salesTaxRate: entry.salesTaxRate,
                processingFeeRate: entry.processingFeeRate,
                deposit: entry.deposit || 0,
                createdAt: new Date().toISOString(),
                jobLocation: entry.jobLocation,
            };
            updatedTickets = [newTicket, ...currentTickets];
        }
        updateContactJobTickets(contact.id, updatedTickets);
        setIsJobTicketModalOpen(false);
        setEditingJobTicket(null);
    };
    
    const handleDeleteJobTicket = (id) => {
        if (window.confirm('Are you sure you want to delete this job ticket?')) {
            const updatedTickets = (contact.jobTickets || []).filter(ticket => ticket.id !== id);
            updateContactJobTickets(contact.id, updatedTickets);
        }
    };
    
    const sortedJobTickets = useMemo(() => {
        return [...(contact.jobTickets || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [contact.jobTickets]);
    
    const normalizedDoorProfiles = useMemo(() => {
        if (contact.doorProfiles && contact.doorProfiles.length > 0) {
             return contact.doorProfiles.map(p => ({
                ...p,
                doorInstallDate: p.doorInstallDate || p.installDate || 'Unknown',
                springInstallDate: p.springInstallDate || p.installDate || 'Unknown',
                openerInstallDate: p.openerInstallDate || p.installDate || 'Unknown',
            }));
        }
        if (contact.doorProfile) {
            const oldP = contact.doorProfile;
            return [{
                ...oldP,
                doorInstallDate: oldP.installDate || 'Unknown',
                springInstallDate: oldP.installDate || 'Unknown',
                openerInstallDate: oldP.installDate || 'Unknown',
            }];
        }
        return [];
    }, [contact.doorProfiles, contact.doorProfile]);

    const formatInstallDate = (value) => {
        if (!value || value === 'Unknown' || value === 'Original') {
            return (
                React.createElement("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600" },
                    value || 'Unknown'
                )
            );
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
             return React.createElement("span", { className: "text-sm font-semibold text-slate-800 dark:text-slate-200" }, new Date(value).toLocaleDateString());
        }
        return React.createElement("span", { className: "text-sm font-semibold text-slate-800 dark:text-slate-200" }, value);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'details':
                return React.createElement(React.Fragment, null,
                    React.createElement("div", { className: "space-y-4" },
                        React.createElement("div", { className: "flex items-start" },
                            React.createElement(MailIcon, { className: "w-5 h-5 text-slate-400 mt-1 flex-shrink-0" }),
                            React.createElement("div", { className: "ml-4 min-w-0" },
                                React.createElement("a", { href: `mailto:${contact.email}`, className: "font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:underline cursor-pointer transition-colors break-words" }, contact.email),
                                React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400" }, "Email")
                            )
                        ),
                        React.createElement("div", { className: "flex items-start" },
                            React.createElement(PhoneIcon, { className: "w-5 h-5 text-slate-400 mt-1 flex-shrink-0" }),
                            React.createElement("div", { className: "ml-4 flex-grow min-w-0" },
                                React.createElement("div", { className: "flex justify-between items-center" },
                                    React.createElement("p", { className: "font-semibold text-slate-700 dark:text-slate-200 break-words" }, contact.phone),
                                    React.createElement("div", { className: "flex space-x-2 flex-shrink-0 ml-2" },
                                        React.createElement("a", { href: `tel:${contact.phone}`, className: "flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors" },
                                            React.createElement(PhoneIcon, { className: "w-4 h-4" }), React.createElement("span", null, "Call")
                                        ),
                                        React.createElement("a", { href: `sms:${contact.phone}`, className: "flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors" },
                                            React.createElement(MessageIcon, { className: "w-4 h-4" }), React.createElement("span", null, "Text")
                                        )
                                    )
                                ),
                                React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400" }, "Mobile")
                            )
                        ),
                        React.createElement("div", { className: "flex items-start" },
                            React.createElement(MapPinIcon, { className: "w-5 h-5 text-slate-400 mt-1 flex-shrink-0" }),
                            React.createElement("div", { className: "ml-4 min-w-0" },
                            contact.address ? (
                                React.createElement("a", {
                                    href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`,
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                    className: "font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:underline cursor-pointer transition-colors break-words"
                                }, contact.address)
                            ) : (
                                React.createElement("p", { className: "font-semibold text-slate-700 dark:text-slate-200 italic text-slate-400" }, "Not set")
                            ),
                            React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400" }, "Address")
                            )
                        )
                    ),
                    
                    // Door/System Profiles Section
                    normalizedDoorProfiles.length > 0 && React.createElement("div", { className: "mt-6 pt-6 border-t border-slate-200 dark:border-slate-700" },
                        React.createElement("div", { className: "flex items-center mb-4" },
                            React.createElement(HomeIcon, { className: "w-6 h-6 text-slate-400 mr-2" }),
                            React.createElement("h2", { className: "text-lg font-semibold text-slate-800 dark:text-slate-100" }, "Door & System Profiles")
                        ),
                        React.createElement("div", { className: "space-y-6" },
                            normalizedDoorProfiles.map((profile, index) => (
                                React.createElement("div", { key: index, className: `bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 ${index > 0 ? 'border-t border-slate-200 dark:border-slate-600' : ''}` },
                                    normalizedDoorProfiles.length > 1 && (
                                        React.createElement("h3", { className: "text-md font-bold text-slate-700 dark:text-slate-200 mb-3" }, `System ${index + 1}`)
                                    ),
                                    
                                    // Door Section
                                    React.createElement("div", { className: "mb-4 pb-4 border-b border-slate-200 dark:border-slate-600" },
                                        React.createElement("h4", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3" }, "Door"),
                                        React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-4" },
                                            React.createElement("div", null,
                                                React.createElement("p", { className: "text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide" }, "Dimensions"),
                                                React.createElement("p", { className: "text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5" }, profile.dimensions || '-')
                                            ),
                                            React.createElement("div", null,
                                                React.createElement("p", { className: "text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide" }, "Type"),
                                                React.createElement("p", { className: "text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5" }, profile.doorType || '-')
                                            ),
                                            React.createElement("div", null,
                                                React.createElement("p", { className: "text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide" }, "Installed"),
                                                React.createElement("div", { className: "mt-0.5" }, formatInstallDate(profile.doorInstallDate))
                                            )
                                        )
                                    ),

                                    // Spring Section
                                    React.createElement("div", { className: "mb-4 pb-4 border-b border-slate-200 dark:border-slate-600" },
                                        React.createElement("h4", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3" }, "Springs"),
                                        React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-4" },
                                            React.createElement("div", null,
                                                React.createElement("p", { className: "text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide" }, "System"),
                                                React.createElement("p", { className: "text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5" }, profile.springSystem || '-')
                                            ),
                                            React.createElement("div", null,
                                                React.createElement("p", { className: "text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide" }, "Size"),
                                                React.createElement("p", { className: "text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5" }, profile.springSize || '-')
                                            ),
                                            React.createElement("div", null,
                                                React.createElement("p", { className: "text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide" }, "Installed"),
                                                React.createElement("div", { className: "mt-0.5" }, formatInstallDate(profile.springInstallDate))
                                            )
                                        )
                                    ),

                                    // Opener Section
                                    React.createElement("div", null,
                                        React.createElement("h4", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3" }, "Opener"),
                                        React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-4" },
                                            React.createElement("div", null,
                                                React.createElement("p", { className: "text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide" }, "Brand"),
                                                React.createElement("p", { className: "text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5" }, profile.openerBrand || '-')
                                            ),
                                            React.createElement("div", null,
                                                React.createElement("p", { className: "text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide" }, "Model"),
                                                React.createElement("p", { className: "text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5" }, profile.openerModel || '-')
                                            ),
                                            React.createElement("div", null,
                                                React.createElement("p", { className: "text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide" }, "Installed"),
                                                React.createElement("div", { className: "mt-0.5" }, formatInstallDate(profile.openerInstallDate))
                                            )
                                        )
                                    )
                                )
                            ))
                        )
                    ),

                    allCustomFields.length > 0 && (
                        React.createElement("div", { className: "mt-6 pt-6 border-t border-slate-200 dark:border-slate-700" },
                            React.createElement("h2", { className: "text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4" }, "Additional Information"),
                            React.createElement("div", { className: "space-y-4" },
                                allCustomFields.map(field => (
                                    React.createElement("div", { key: field.id, className: "flex items-start" },
                                        React.createElement(TagIcon, { className: "w-5 h-5 text-slate-400 mt-1 flex-shrink-0" }),
                                        React.createElement("div", { className: "ml-4 min-w-0" },
                                            React.createElement("p", { className: `font-semibold break-words ${field.value ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 italic'}` },
                                                field.value || 'Not set'
                                            ),
                                            React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400" }, field.label)
                                        )
                                    )
                                ))
                            )
                        )
                    )
                );
            case 'jobs':
                return React.createElement("div", null,
                    React.createElement("div", { className: "flex justify-between items-center mb-4" },
                        React.createElement("h2", { className: "text-lg font-semibold text-slate-800 dark:text-slate-100" }, "Job History"),
                        React.createElement("button", {
                            onClick: () => { setEditingJobTicket(null); setIsJobTicketModalOpen(true); },
                            className: "p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
                            "aria-label": "Add Job Ticket"
                        }, React.createElement(PlusIcon, { className: "w-5 h-5" }))
                    ),
                    sortedJobTickets.length > 0 ? (
                        React.createElement("ul", { className: "space-y-4" },
                            sortedJobTickets.map(ticket => {
                                const { totalCost } = calculateJobTicketTotal(ticket);
                                const statusColor = jobStatusColors[ticket.status];
                                const paymentStatus = ticket.paymentStatus || 'unpaid';
                                const paymentStatusColor = paymentStatusColors[paymentStatus];
                                const paymentStatusLabel = paymentStatusLabels[paymentStatus];

                                return React.createElement("li", { key: ticket.id, className: "p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg card-hover" },
                                    React.createElement("div", { className: "flex justify-between items-start mb-2" },
                                        React.createElement("div", { className: "flex flex-wrap gap-2" },
                                            React.createElement("span", { className: `px-2 py-0.5 text-xs font-medium rounded-full ${statusColor.base} ${statusColor.text}` },
                                                ticket.status
                                            ),
                                            React.createElement("span", { className: `px-2 py-0.5 text-xs font-medium rounded-full ${paymentStatusColor.base} ${paymentStatusColor.text}` },
                                                paymentStatusLabel
                                            )
                                        ),
                                        React.createElement("p", { className: "font-bold text-lg text-slate-800 dark:text-slate-100" }, `$${totalCost.toFixed(2)}`)
                                    ),
                                    React.createElement("p", { className: "font-semibold text-slate-700 dark:text-slate-200" }, 
                                        new Date(ticket.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }),
                                        ticket.time && React.createElement("span", { className: "text-slate-500 dark:text-slate-400 font-normal ml-1" }, ` at ${formatTime(ticket.time)}`)
                                    ),
                                    ticket.notes && (
                                        React.createElement("p", { className: "text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words mt-3" }, ticket.notes)
                                    ),
                                    React.createElement("div", { className: "flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-600" },
                                        React.createElement("button", {
                                            onClick: () => onViewInvoice(contact.id, ticket.id),
                                            className: "flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-center",
                                            "aria-label": "View PDF"
                                        }, React.createElement(ClipboardListIcon, { className: "w-4 h-4" }), React.createElement("span", null, "PDF")),
                                        React.createElement("button", {
                                            onClick: () => { setEditingJobTicket(ticket); setIsJobTicketModalOpen(true); },
                                            className: "flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-center",
                                            "aria-label": "Edit job"
                                        }, React.createElement(EditIcon, { className: "w-4 h-4" }), React.createElement("span", null, "Edit")),
                                        React.createElement("button", {
                                            onClick: () => handleDeleteJobTicket(ticket.id),
                                            className: "flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900 text-center",
                                            "aria-label": "Delete job"
                                        }, React.createElement(TrashIcon, { className: "w-4 h-4" }), React.createElement("span", null, "Delete")),
                                        React.createElement("button", {
                                            onClick: () => onViewJobDetail(contact.id, ticket.id),
                                            className: "flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 text-center",
                                            "aria-label": "View job"
                                        }, React.createElement(EyeIcon, { className: "w-4 h-4" }), React.createElement("span", null, "View"))
                                    )
                                );
                            })
                        )
                    ) : (
                        React.createElement(EmptyState, {
                            Icon: BriefcaseIcon,
                            title: "No Jobs Yet",
                            message: "No jobs have been logged for this contact.",
                            actionText: "Add First Job",
                            onAction: () => { setEditingJobTicket(null); setIsJobTicketModalOpen(true); }
                        })
                    )
                );
            case 'files':
                return React.createElement("div", null,
                    React.createElement("div", { className: "mb-8" },
                        React.createElement("div", { className: "flex justify-between items-center mb-4" },
                            React.createElement("h2", { className: "text-lg font-semibold text-slate-800 dark:text-slate-100" }, "Photos"),
                            React.createElement("div", { className: "relative" },
                                React.createElement("button", {
                                    onClick: () => setShowPhotoOptions(!showPhotoOptions),
                                    className: "p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
                                    "aria-label": "Add photo"
                                }, React.createElement(PlusIcon, { className: "w-5 h-5" })),
                                showPhotoOptions && (
                                    React.createElement("div", { className: "absolute right-0 mt-2 w-48 bg-white dark:bg-slate-700 rounded-md shadow-lg z-10 ring-1 ring-black ring-opacity-5" },
                                        React.createElement("button", { onClick: () => cameraInputRef.current?.click(), className: "w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600" },
                                            React.createElement(CameraIcon, { className: "w-5 h-5 mr-3" }), "Take Photo"
                                        ),
                                        React.createElement("button", { onClick: () => imageUploadRef.current?.click(), className: "w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600" },
                                            React.createElement(FileIcon, { className: "w-5 h-5 mr-3" }), "Upload Image"
                                        )
                                    )
                                )
                            )
                        ),
                        isLoadingFiles ? (
                            React.createElement("div", { className: "text-center text-slate-500 dark:text-slate-400 py-4" }, "Loading photos...")
                        ) : imageFiles.length > 0 ? (
                            React.createElement("div", { className: "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-4" },
                                imageFiles.map(file => {
                                    const imageIndexInGallery = galleryImages.findIndex(img => img.url === file.dataUrl);
                                    return (
                                        React.createElement("button", {
                                            key: file.id,
                                            onClick: () => openGallery(imageIndexInGallery),
                                            className: "aspect-square rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 card-hover"
                                        },
                                            React.createElement("img", { src: file.dataUrl, alt: file.name, className: "w-full h-full object-cover group-hover:opacity-80 transition-opacity" })
                                        )
                                    );
                                })
                            )
                        ) : (
                            React.createElement("p", { className: "text-center text-slate-500 dark:text-slate-400 py-4" }, "No photos attached.")
                        )
                    ),
                    React.createElement("div", null,
                        React.createElement("div", { className: "flex justify-between items-center mb-4" },
                            React.createElement("h2", { className: "text-lg font-semibold text-slate-800 dark:text-slate-100" }, "Files"),
                            React.createElement("button", {
                                onClick: () => fileUploadRef.current?.click(),
                                className: "p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
                                "aria-label": "Add file"
                            }, React.createElement(PlusIcon, { className: "w-5 h-5" }))
                        ),
                        isLoadingFiles ? (
                            React.createElement("div", { className: "text-center text-slate-500 dark:text-slate-400 py-4" }, "Loading files...")
                        ) : otherFiles.length > 0 ? (
                            React.createElement("ul", { className: "space-y-3" },
                                otherFiles.map(file => (
                                    React.createElement("li", { key: file.id, className: "grid grid-cols-[auto_1fr_auto] items-center gap-x-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg" },
                                        React.createElement(FileIcon, { className: "w-6 h-6 text-slate-500 dark:text-slate-400" }),
                                        React.createElement("div", { className: "min-w-0" },
                                            React.createElement("p", { className: "font-medium text-slate-700 dark:text-slate-200 truncate" }, file.name),
                                            React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400" }, formatFileSize(file.size))
                                        ),
                                        React.createElement("div", { className: "flex items-center space-x-2 flex-shrink-0" },
                                            VIEWABLE_MIME_TYPES.includes(file.type) && file.dataUrl && (
                                                React.createElement("button", { onClick: () => handleViewFile(file), className: "text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 font-medium text-sm flex-shrink-0" }, "View")
                                            ),
                                            file.dataUrl && React.createElement("a", { href: file.dataUrl, download: file.name, className: "text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 font-medium text-sm flex-shrink-0" }, "Download")
                                        )
                                    )
                                ))
                            )
                        ) : (
                            React.createElement("p", { className: "text-center text-slate-500 dark:text-slate-400 py-4" }, "No files attached.")
                        )
                    )
                );
        }
    }


    const TabButton = ({ tab, label }) => (
        React.createElement("button", {
            onClick: () => setActiveTab(tab),
            className: `tab-button px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === tab
                ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`
        }, label)
    );

    return (
        React.createElement(React.Fragment, null,
            React.createElement("div", { className: "h-full flex flex-col bg-white dark:bg-slate-800 overflow-y-auto" },
                React.createElement("div", { className: "p-4 flex items-center md:hidden border-b border-slate-200 dark:border-slate-700" },
                    React.createElement("button", { onClick: onClose, className: "p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" },
                        React.createElement(ArrowLeftIcon, { className: "w-6 h-6 text-slate-600 dark:text-slate-300" })
                    ),
                    React.createElement("h2", { className: "ml-4 font-bold text-lg text-slate-700 dark:text-slate-200" }, "Contact Details")
                ),
                React.createElement("div", { className: "flex flex-col items-center px-4 sm:px-6 py-6 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700" },
                    React.createElement("div", { className: "relative group w-32 h-32 rounded-full overflow-hidden bg-slate-300 dark:bg-slate-600 flex items-center justify-center mb-4 ring-4 ring-white dark:ring-slate-700 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-800" },
                        contact.photoUrl ? (
                            React.createElement("img", { src: contact.photoUrl, alt: contact.name, className: "w-full h-full object-cover" })
                        ) : (
                            React.createElement("span", { className: "text-5xl text-slate-600 dark:text-slate-300 font-semibold" }, getInitials(contact.name))
                        ),
                        galleryImages.length > 0 && (
                            React.createElement("button", { onClick: () => openGallery(0), className: "absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300", "aria-label": "View photos" },
                                React.createElement(EyeIcon, { className: "w-8 h-8" })
                            )
                        )
                    ),
                    React.createElement("h1", { className: "text-3xl font-bold text-slate-800 dark:text-slate-100 text-center break-words" }, contact.name),
                    React.createElement("div", { className: "flex space-x-3 mt-4" },
                        React.createElement("button", {
                            onClick: () => { setEditingJobTicket(null); setIsJobTicketModalOpen(true); },
                            className: "flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors"
                        },
                            React.createElement(BriefcaseIcon, { className: "w-4 h-4" }),
                            React.createElement("span", null, "Add Job")
                        ),
                        React.createElement("button", { onClick: onEdit, className: "flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors" },
                            React.createElement(EditIcon, { className: "w-4 h-4" }),
                            React.createElement("span", null, "Edit")
                        ),
                        React.createElement("button", { onClick: onDelete, className: "flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900 transition-colors" },
                            React.createElement(TrashIcon, { className: "w-4 h-4" }),
                            React.createElement("span", null, "Delete")
                        )
                    )
                ),
                
                React.createElement("div", { className: "border-b border-slate-200 dark:border-slate-700" },
                    React.createElement("nav", { className: "flex justify-center space-x-2 p-2", "aria-label": "Tabs" },
                        React.createElement(TabButton, { tab: "details", label: "Details" }),
                        React.createElement(TabButton, { tab: "jobs", label: "Jobs" }),
                        React.createElement(TabButton, { tab: "files", label: "Files & Photos" })
                    )
                ),

                React.createElement("div", { className: "px-4 sm:px-6 py-6" },
                    renderTabContent()
                ),

                React.createElement("input", { type: "file", accept: "image/*", multiple: true, ref: imageUploadRef, onChange: handleFilesSelected, className: "hidden" }),
                React.createElement("input", { type: "file", accept: "image/*", capture: "environment", ref: cameraInputRef, onChange: handleFilesSelected, className: "hidden" }),
                React.createElement("input", { type: "file", multiple: true, ref: fileUploadRef, onChange: handleFilesSelected, className: "hidden" }),

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
                    onClose: () => { setIsJobTicketModalOpen(false); setEditingJobTicket(null); },
                    jobTemplates: jobTemplates,
                    partsCatalog: partsCatalog,
                    enabledStatuses: enabledStatuses,
                    defaultSalesTaxRate: businessInfo?.defaultSalesTaxRate,
                    defaultProcessingFeeRate: businessInfo?.defaultProcessingFeeRate,
                    contactAddress: contact.address
                })
            )
        )
    );
};

export default ContactDetail;