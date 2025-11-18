import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header.js';
import ContactList from './components/ContactList.js';
import ContactDetail from './components/ContactDetail.js';
import ContactForm from './components/ContactForm.js';
import Settings from './components/Settings.js';
import Dashboard from './components/Dashboard.js';
import InvoiceView from './components/InvoiceView.js';
import JobDetailView from './components/JobDetailView.js';
import EmptyState from './components/EmptyState.js';
import { UserCircleIcon } from './components/icons.js';
import { generateId } from './utils.js';
import { initDB, addFiles, deleteFiles, getAllFiles, clearAndAddFiles } from './db.js';

const initialContacts = [
  {
    id: '1',
    name: 'Eleanor Vance',
    email: 'eleanor.v@corpnet.com',
    phone: '555-0101',
    address: '123 Innovation Drive, Tech City, 94103',
    photoUrl: 'https://picsum.photos/id/1027/200/200',
    files: [],
    customFields: [{id: 'cf1', label: 'Company', value: 'CorpNet Inc.'}],
    jobTickets: [
        { id: 'jt1', date: new Date().toISOString().split('T')[0], notes: 'Customer reported grinding noise when opening door. Needs inspection.', status: 'Estimate Scheduled', parts: [], laborCost: 0 },
        { id: 'jt2', date: '2023-10-22', notes: 'Replaced both torsion springs and lubricated all moving parts. Door is now operating smoothly.', status: 'Paid', parts: [{id: 'p1', name: 'Torsion Spring', cost: 60, quantity: 2}], laborCost: 200 },
        { id: 'jt3', date: '2024-06-01', notes: 'Needs new logic board for opener. Part ordered.', status: 'Awaiting Parts', parts: [], laborCost: 75 },
    ],
  },
  {
    id: '2',
    name: 'Marcus Holloway',
    email: 'm.holloway@synergysys.io',
    phone: '555-0102',
    address: '456 Synergy Plaza, Metroville, 60601',
    photoUrl: 'https://picsum.photos/id/1005/200/200',
    files: [],
    customFields: [{id: 'cf2', label: 'Company', value: 'Synergy Systems'}],
    jobTickets: [
        { id: 'jt4', date: '2024-07-10', notes: 'Quote sent for new insulated garage door model #55A.', status: 'Quote Sent', parts: [{id: 'p3', name: 'Insulated Door', cost: 1200, quantity: 1}], laborCost: 450 }
    ],
  },
   {
    id: '3',
    name: 'Isabella Rossi',
    email: 'isabella.r@quantum-dynamics.net',
    phone: '555-0103',
    address: '789 Quantum Way, Silicon Valley, 95054',
    photoUrl: '',
    files: [],
    customFields: [{id: 'cf3', label: 'Company', value: 'Quantum Dynamics'}],
    jobTickets: [
        { id: 'jt5', date: new Date().toISOString().split('T')[0], notes: 'Install new smart garage opener.', status: 'In Progress', parts: [{id: 'p2', name: 'Smart Opener', cost: 350, quantity: 1}], laborCost: 150}
    ],
  },
];

const initialDefaultFields = [
    { id: 'df1', label: 'Company' },
    { id: 'df2', label: 'Job Title' },
];

const initialBusinessInfo = {
    name: '',
    address: '',
    phone: '',
    email: '',
    logoUrl: '',
};

const APP_STORAGE_KEY = 'businessContactsApp';
const RECOVERY_STORAGE_KEY = 'businessContactsRecoveryBackup';

const App = () => {
    const [recoveryBackup, setRecoveryBackup] = useState(() => {
        const savedDataString = localStorage.getItem(APP_STORAGE_KEY);
        if (!savedDataString) {
            const recoveryDataString = sessionStorage.getItem(RECOVERY_STORAGE_KEY);
            if (recoveryDataString) {
                return JSON.parse(recoveryDataString);
            }
        }
        return null;
    });

    const [appState, setAppState] = useState(() => {
        try {
            const savedData = localStorage.getItem(APP_STORAGE_KEY);
            if (savedData) {
                const parsed = JSON.parse(savedData);

                const sanitizedContacts = (parsed.contacts || initialContacts).map((contact) => {
                    const jobTickets = (Array.isArray(contact.jobTickets) ? contact.jobTickets : [])
                        .filter(ticket => ticket && typeof ticket === 'object')
                        .map((ticket) => ({
                            id: ticket.id || generateId(),
                            date: ticket.date || new Date().toISOString().split('T')[0],
                            status: ticket.status || 'Scheduled',
                            notes: ticket.notes || '',
                            parts: Array.isArray(ticket.parts) ? ticket.parts.map((p) => ({
                                id: p.id || generateId(),
                                name: p.name || '',
                                cost: p.cost || 0,
                                quantity: typeof p.quantity === 'number' ? p.quantity : 1
                            })) : [],
                            laborCost: typeof ticket.laborCost === 'number' ? ticket.laborCost : 0,
                            salesTaxRate: ticket.salesTaxRate,
                            processingFeeRate: ticket.processingFeeRate,
                        }));
                    
                    const sanitizedFiles = (Array.isArray(contact.files) ? contact.files : [])
                        .filter(file => file && typeof file === 'object')
                        .map((file) => ({
                            id: file.id || generateId(),
                            name: file.name || 'Unnamed File',
                            type: file.type || 'application/octet-stream',
                            size: file.size || 0,
                        }));

                    return {
                        id: '', name: '', email: '', phone: '', address: '', photoUrl: '',
                        ...contact,
                        files: sanitizedFiles,
                        customFields: Array.isArray(contact.customFields) ? contact.customFields : [],
                        jobTickets: jobTickets,
                    };
                });
                
                const sanitizedTemplates = (parsed.jobTemplates || []).map((template) => ({
                    id: template.id || generateId(),
                    name: template.name || 'Untitled Template',
                    notes: template.notes || '',
                    parts: Array.isArray(template.parts) ? template.parts.map((p) => ({
                        id: p.id || generateId(),
                        name: p.name || '',
                        cost: p.cost || 0,
                        quantity: typeof p.quantity === 'number' ? p.quantity : 1
                    })) : [],
                    laborCost: typeof template.laborCost === 'number' ? template.laborCost : 0,
                    salesTaxRate: template.salesTaxRate,
                    processingFeeRate: template.processingFeeRate,
                }));

                return {
                    contacts: sanitizedContacts,
                    defaultFields: parsed.defaultFields || initialDefaultFields,
                    businessInfo: parsed.businessInfo || initialBusinessInfo,
                    autoBackupEnabled: parsed.autoBackupEnabled || false,
                    lastAutoBackup: parsed.lastAutoBackup || null,
                    theme: parsed.theme || 'system',
                    jobTemplates: sanitizedTemplates,
                };
            }
        } catch (error) {
            console.error("Failed to load or parse state from localStorage", error);
        }
        return {
            contacts: initialContacts,
            defaultFields: initialDefaultFields,
            businessInfo: initialBusinessInfo,
            autoBackupEnabled: false,
            lastAutoBackup: null,
            theme: 'system',
            jobTemplates: [],
        };
    });

    const [viewState, setViewState] = useState({ type: 'dashboard' });

    useEffect(() => {
        initDB().catch(err => console.error("Failed to initialize DB", err));
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const isDark = appState.theme === 'dark' || (appState.theme === 'system' && mediaQuery.matches);
        root.classList.toggle('dark', isDark);
        const systemThemeListener = (e) => root.classList.toggle('dark', e.matches);
        if (appState.theme === 'system') {
            mediaQuery.addEventListener('change', systemThemeListener);
        }
        return () => mediaQuery.removeEventListener('change', systemThemeListener);
    }, [appState.theme]);

    useEffect(() => {
        const handler = setTimeout(() => {
            try {
                const stateToSave = {
                    ...appState,
                    contacts: appState.contacts.map(contact => ({
                        ...contact,
                        files: (contact.files || []).map(({ dataUrl, ...fileMetadata }) => fileMetadata),
                    })),
                };
                localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(stateToSave));
            } catch (error) {
                console.error('Failed to save state to localStorage:', error);
                if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
                    alert('Could not save changes. The application storage is full. Please remove some large attachments from contacts to free up space.');
                } else {
                    alert('An unexpected error occurred while saving data.');
                }
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [appState]);

    useEffect(() => {
        if (appState.autoBackupEnabled) {
            const backupData = {
                contacts: appState.contacts,
                defaultFields: appState.defaultFields,
                businessInfo: appState.businessInfo,
                jobTemplates: appState.jobTemplates,
            };
            const newBackup = {
                timestamp: new Date().toISOString(),
                data: JSON.stringify(backupData),
            };
            setAppState(current => ({ ...current, lastAutoBackup: newBackup }));
            sessionStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(newBackup));
        }
    }, [appState.contacts, appState.defaultFields, appState.businessInfo, appState.autoBackupEnabled, appState.jobTemplates]);

    useEffect(() => {
        if (viewState.type === 'list' && window.innerWidth >= 768 && appState.contacts.length > 0) {
            setViewState({ type: 'detail', id: appState.contacts[0].id });
        }
        if ((viewState.type === 'detail' || viewState.type === 'edit_form') && !appState.contacts.some(c => c.id === viewState.id)) {
            setViewState({ type: 'dashboard' });
        }
        if (viewState.type === 'invoice' || viewState.type === 'job_detail') {
            const contactForView = appState.contacts.find(c => c.id === viewState.contactId);
            const ticketForView = contactForView?.jobTickets?.find(t => t.id === viewState.ticketId);
            if (!contactForView || !ticketForView) {
                setViewState({ type: 'dashboard' });
            }
        }
    }, [viewState, appState.contacts]);

    const updateBusinessInfo = (info) => {
        setAppState(current => ({ ...current, businessInfo: info }));
        alert('Business information saved!');
    };
    
    const updateTheme = (theme) => setAppState(current => ({ ...current, theme }));

    const addContact = async (contactData) => {
        const filesWithData = contactData.files.filter(f => f.dataUrl);
        if (filesWithData.length > 0) await addFiles(filesWithData);
        const newContact = {
            ...contactData,
            id: generateId(),
            jobTickets: [],
            files: contactData.files.map(({ dataUrl, ...metadata }) => metadata),
        };
        setAppState(current => ({ ...current, contacts: [newContact, ...current.contacts] }));
        setViewState({ type: 'detail', id: newContact.id });
    };

    const updateContact = async (id, contactData) => {
        const originalContact = appState.contacts.find(c => c.id === id);
        if (!originalContact) return;
        const newFiles = contactData.files.filter(f => f.dataUrl);
        if (newFiles.length > 0) await addFiles(newFiles);
        const originalFileIds = new Set((originalContact.files || []).map(f => f.id));
        const updatedFileIds = new Set((contactData.files || []).map(f => f.id));
        const deletedFileIds = [...originalFileIds].filter(fileId => !updatedFileIds.has(fileId));
        if (deletedFileIds.length > 0) await deleteFiles(deletedFileIds);
        const finalContactData = { ...contactData, files: contactData.files.map(({ dataUrl, ...metadata }) => metadata) };
        setAppState(current => ({ ...current, contacts: current.contacts.map(c => c.id === id ? { ...c, ...finalContactData, id } : c) }));
        setViewState({ type: 'detail', id });
    };
  
    const addFilesToContact = async (contactId, newFiles) => {
        await addFiles(newFiles.filter(f => f.dataUrl));
        const filesMetadata = newFiles.map(({ dataUrl, ...metadata }) => metadata);
        setAppState(current => ({ ...current, contacts: current.contacts.map(c => c.id === contactId ? { ...c, files: [...(c.files || []), ...filesMetadata] } : c) }));
    };
  
    const updateContactJobTickets = (contactId, jobTickets) => {
        setAppState(current => ({ ...current, contacts: current.contacts.map(c => c.id === contactId ? { ...c, jobTickets } : c) }));
    };

    const deleteContact = async (id) => {
        if (window.confirm('Are you sure you want to delete this contact?')) {
            const contactToDelete = appState.contacts.find(c => c.id === id);
            if (contactToDelete?.files?.length > 0) {
                const fileIds = contactToDelete.files.map(f => f.id).filter(id => id != null);
                await deleteFiles(fileIds);
            }
            setAppState(current => ({ ...current, contacts: current.contacts.filter(c => c.id !== id) }));
            if ((viewState.type === 'detail' || viewState.type === 'edit_form') && viewState.id === id) {
                 setViewState({ type: 'dashboard' });
            }
        }
    };

    const addDefaultField = (label) => {
        if (label && !appState.defaultFields.some(f => f.label.toLowerCase() === label.toLowerCase())) {
            setAppState(current => ({ ...current, defaultFields: [...current.defaultFields, { id: generateId(), label }] }));
        }
    };

    const deleteDefaultField = (id) => setAppState(current => ({ ...current, defaultFields: current.defaultFields.filter(f => f.id !== id) }));
    
    const addJobTemplate = (templateData) => {
        const newTemplate = { ...templateData, id: generateId() };
        setAppState(current => ({ ...current, jobTemplates: [...current.jobTemplates, newTemplate] }));
    };
    
    const updateJobTemplate = (id, templateData) => {
        setAppState(current => ({ ...current, jobTemplates: current.jobTemplates.map(t => t.id === id ? { ...t, ...templateData, id } : t) }));
    };
    
    const deleteJobTemplate = (id) => {
        if (window.confirm('Are you sure you want to delete this job template?')) {
            setAppState(current => ({ ...current, jobTemplates: current.jobTemplates.filter(t => t.id !== id) }));
        }
    };

    const handleToggleAutoBackup = (enabled) => setAppState(current => ({ ...current, autoBackupEnabled: enabled }));

    const restoreData = async (fileContent, silent = false) => {
        try {
            const backupData = JSON.parse(fileContent);
            if (backupData.contacts && Array.isArray(backupData.contacts)) {
                 const performRestore = async () => {
                    const { files, ...stateToRestore } = backupData;
                    if (files && Array.isArray(files)) await clearAndAddFiles(files);
                    setAppState(current => ({
                        ...current,
                        contacts: stateToRestore.contacts,
                        defaultFields: stateToRestore.defaultFields || initialDefaultFields,
                        businessInfo: stateToRestore.businessInfo || initialBusinessInfo,
                        jobTemplates: stateToRestore.jobTemplates || [],
                    }));
                    if (!silent) alert('Backup restored successfully!');
                    setViewState({ type: 'dashboard' });
                };
                if (silent || window.confirm('Are you sure you want to restore this backup? This will overwrite all current data.')) {
                    await performRestore();
                    return true;
                }
            } else if (!silent) alert('Invalid backup file format.');
        } catch (error) {
            if (!silent) alert('Failed to read or parse the backup file.');
            console.error("Backup restore error:", error);
        }
        return false;
    };
    
    const handleAcceptRecovery = async () => {
        if (recoveryBackup) {
            if (await restoreData(recoveryBackup.data, true)) {
                setRecoveryBackup(null);
                sessionStorage.removeItem(RECOVERY_STORAGE_KEY);
            } else {
                alert('Could not restore the automatic backup. It may be corrupted.');
                handleDismissRecovery();
            }
        }
    };

    const handleDismissRecovery = () => {
        setRecoveryBackup(null);
        sessionStorage.removeItem(RECOVERY_STORAGE_KEY);
    };

    const handleUpdateJobTicketForDetailView = (contactId, ticketData) => {
        const contact = appState.contacts.find(c => c.id === contactId);
        if (!contact) return;
        
        let updatedTickets;
        const currentTickets = contact.jobTickets || [];
        if (ticketData.id) {
            updatedTickets = currentTickets.map(ticket => ticket.id === ticketData.id ? { ...ticket, ...ticketData } : ticket);
        } else {
            const newTicket = { ...ticketData, id: generateId() };
            updatedTickets = [newTicket, ...currentTickets];
        }
        updateContactJobTickets(contactId, updatedTickets);
    };
    
    const handleDeleteJobTicketForDetailView = (contactId, ticketId) => {
        const contact = appState.contacts.find(c => c.id === contactId);
        if (!contact) return;
        
        if (window.confirm('Are you sure you want to delete this job ticket?')) {
            const updatedTickets = (contact.jobTickets || []).filter(ticket => ticket.id !== ticketId);
            updateContactJobTickets(contactId, updatedTickets);
            setViewState({ type: 'detail', id: contactId });
        }
    };

    const selectedContact = useMemo(() => {
        if (viewState.type === 'detail' || viewState.type === 'edit_form' || viewState.type === 'invoice' || viewState.type === 'job_detail') {
            const id = viewState.type === 'invoice' || viewState.type === 'job_detail' ? viewState.contactId : viewState.id;
            return appState.contacts.find(c => c.id === id);
        }
        return undefined;
    }, [viewState, appState.contacts]);
  
    const selectedContactId = useMemo(() => {
        if (viewState.type === 'detail' || viewState.type === 'edit_form') return viewState.id;
        return null;
    }, [viewState]);

    const renderMainContent = () => {
        switch (viewState.type) {
            case 'dashboard': return React.createElement(Dashboard, { contacts: appState.contacts, onViewJobDetail: (contactId, ticketId) => setViewState({ type: 'job_detail', contactId, ticketId }) });
            case 'list': return React.createElement(EmptyState, { Icon: UserCircleIcon, title: "Welcome", message: "Select a contact or add a new one.", actionText: appState.contacts.length === 0 ? "Add First Contact" : undefined, onAction: appState.contacts.length === 0 ? () => setViewState({ type: 'new_form' }) : undefined });
            case 'detail': return selectedContact ? React.createElement(ContactDetail, { contact: selectedContact, defaultFields: appState.defaultFields, onEdit: () => setViewState({ type: 'edit_form', id: selectedContact.id }), onDelete: () => deleteContact(selectedContact.id), onClose: () => setViewState({ type: 'list' }), addFilesToContact: addFilesToContact, updateContactJobTickets: updateContactJobTickets, onViewInvoice:(contactId, ticketId) => setViewState({ type: 'invoice', contactId, ticketId }), onViewJobDetail: (contactId, ticketId) => setViewState({ type: 'job_detail', contactId, ticketId }), jobTemplates: appState.jobTemplates }) : null;
            case 'new_form': return React.createElement(ContactForm, { onSave: addContact, onCancel: () => appState.contacts.length > 0 ? setViewState({ type: 'list' }) : setViewState({type: 'dashboard'}), defaultFields: appState.defaultFields });
            case 'edit_form': return selectedContact ? React.createElement(ContactForm, { initialContact: selectedContact, onSave: (data) => updateContact(selectedContact.id, data), onCancel: () => setViewState({ type: 'detail', id: selectedContact.id }) }) : null;
            case 'settings': return React.createElement(Settings, { defaultFields: appState.defaultFields, onAddDefaultField: addDefaultField, onDeleteDefaultField: deleteDefaultField, onBack: () => setViewState({ type: 'dashboard' }), appStateForBackup: { ...appState }, autoBackupEnabled: appState.autoBackupEnabled, onToggleAutoBackup: handleToggleAutoBackup, lastAutoBackup: appState.lastAutoBackup, onRestoreBackup: (content) => restoreData(content, false), businessInfo: appState.businessInfo, onUpdateBusinessInfo: updateBusinessInfo, currentTheme: appState.theme, onUpdateTheme: updateTheme, jobTemplates: appState.jobTemplates, onAddJobTemplate: addJobTemplate, onUpdateJobTemplate: updateJobTemplate, onDeleteJobTemplate: deleteJobTemplate });
            case 'invoice':
                if (!selectedContact) return null;
                const ticketForInvoice = (selectedContact.jobTickets || []).find(t => t.id === (viewState.type === 'invoice' && viewState.ticketId));
                return ticketForInvoice ? React.createElement(InvoiceView, { contact: selectedContact, ticket: ticketForInvoice, businessInfo: appState.businessInfo, onClose: () => setViewState({ type: 'job_detail', contactId: viewState.contactId, ticketId: viewState.ticketId }), addFilesToContact: addFilesToContact }) : null;
            case 'job_detail':
                const contactForJob = appState.contacts.find(c => c.id === viewState.contactId);
                if (!contactForJob) return null;
                const ticketForJob = contactForJob.jobTickets.find(t => t.id === viewState.ticketId);
                if (!ticketForJob) return null;
                return React.createElement(JobDetailView, {
                    contact: contactForJob,
                    ticket: ticketForJob,
                    businessInfo: appState.businessInfo,
                    jobTemplates: appState.jobTemplates,
                    onBack: () => setViewState({ type: 'detail', id: viewState.contactId }),
                    onEditTicket: (ticketData) => handleUpdateJobTicketForDetailView(viewState.contactId, ticketData),
                    onDeleteTicket: () => handleDeleteJobTicketForDetailView(viewState.contactId, viewState.ticketId),
                    onViewInvoice: () => setViewState({ type: 'invoice', contactId: viewState.contactId, ticketId: viewState.ticketId })
                });
            default: return React.createElement(EmptyState, { Icon: UserCircleIcon, title: "Welcome", message: "Select a contact or add a new one." });
        }
    };
  
    const isListHiddenOnMobile = ['detail', 'new_form', 'edit_form', 'settings', 'dashboard', 'invoice', 'job_detail'].includes(viewState.type);

    return React.createElement("div", { className: "h-screen w-screen flex flex-col antialiased text-slate-700 dark:text-slate-300 relative" },
        recoveryBackup && React.createElement("div", { className: "absolute top-0 left-0 right-0 bg-yellow-100 border-b-2 border-yellow-300 p-4 z-50 flex items-center justify-between shadow-lg" },
            React.createElement("div", null,
                React.createElement("p", { className: "font-bold text-yellow-800" }, "Data Recovery"),
                React.createElement("p", { className: "text-sm text-yellow-700" }, `We found an automatic backup from ${new Date(recoveryBackup.timestamp).toLocaleString()}. Would you like to restore it?`)
            ),
            React.createElement("div", { className: "flex space-x-2 flex-shrink-0 ml-4" },
                React.createElement("button", { onClick: handleAcceptRecovery, className: "px-3 py-1 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700" }, "Restore"),
                React.createElement("button", { onClick: handleDismissRecovery, className: "px-3 py-1 rounded-md text-sm font-medium text-slate-700 bg-slate-200 hover:bg-slate-300" }, "Dismiss")
            )
        ),
        React.createElement("div", { className: viewState.type === 'invoice' ? 'print:hidden' : '' },
            React.createElement(Header, { currentView: viewState.type, onNewContact: () => setViewState({ type: 'new_form' }), onGoToSettings: () => setViewState({ type: 'settings' }), onGoToDashboard: () => setViewState({ type: 'dashboard' }), onGoToList: () => setViewState({ type: 'list' }) })
        ),
        React.createElement("div", { className: "flex flex-grow h-0" },
            React.createElement("div", { className: `w-full md:w-1/3 lg:w-1/4 flex-shrink-0 h-full ${isListHiddenOnMobile ? 'hidden md:block' : 'block'} ${viewState.type === 'invoice' ? 'print:hidden' : ''}` },
                React.createElement(ContactList, { contacts: appState.contacts, selectedContactId: selectedContactId, onSelectContact: (id) => setViewState({ type: 'detail', id }) })
            ),
            React.createElement("main", { className: `flex-grow h-full ${!isListHiddenOnMobile ? 'hidden md:block' : 'block'} ${viewState.type === 'invoice' || viewState.type === 'job_detail' ? 'w-full' : ''}` }, renderMainContent())
        )
    );
};

export default App;
