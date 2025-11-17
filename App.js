import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header.js';
import ContactList from './components/ContactList.js';
import ContactDetail from './components/ContactDetail.js';
import ContactForm from './components/ContactForm.js';
import Settings from './components/Settings.js';
import Dashboard from './components/Dashboard.js';
import InvoiceView from './components/InvoiceView.js';
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
        { id: 'jt2', date: '2023-10-22', notes: 'Replaced both torsion springs and lubricated all moving parts. Door is now operating smoothly.', status: 'Paid', parts: [{id: 'p1', name: 'Torsion Spring (x2)', cost: 120}], laborCost: 200 },
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
        { id: 'jt4', date: '2024-07-10', notes: 'Quote sent for new insulated garage door model #55A.', status: 'Quote Sent', parts: [{id: 'p3', name: 'Insulated Door', cost: 1200}], laborCost: 450 }
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
        { id: 'jt5', date: new Date().toISOString().split('T')[0], notes: 'Install new smart garage opener.', status: 'In Progress', parts: [{id: 'p2', name: 'Smart Opener', cost: 350}], laborCost: 150}
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

                // Deep sanitize loaded contacts to ensure data integrity with new/old versions
                const sanitizedContacts = (parsed.contacts || initialContacts).map((contact) => {
                    const jobTickets = (Array.isArray(contact.jobTickets) ? contact.jobTickets : [])
                        .filter(ticket => ticket && typeof ticket === 'object')
                        .map((ticket) => ({
                            id: ticket.id || generateId(),
                            date: ticket.date || new Date().toISOString().split('T')[0],
                            status: ticket.status || 'Scheduled',
                            notes: ticket.notes || '',
                            parts: Array.isArray(ticket.parts) ? ticket.parts : [],
                            laborCost: typeof ticket.laborCost === 'number' ? ticket.laborCost : 0,
                            salesTaxRate: ticket.salesTaxRate,
                            processingFeeRate: ticket.processingFeeRate,
                        }));

                    return {
                        id: '', name: '', email: '', phone: '', address: '', photoUrl: '',
                        ...contact,
                        files: Array.isArray(contact.files) ? contact.files : [],
                        customFields: Array.isArray(contact.customFields) ? contact.customFields : [],
                        jobTickets: jobTickets,
                    };
                });

                return {
                    contacts: sanitizedContacts,
                    defaultFields: parsed.defaultFields || initialDefaultFields,
                    businessInfo: parsed.businessInfo || initialBusinessInfo,
                    autoBackupEnabled: parsed.autoBackupEnabled || false,
                    lastAutoBackup: parsed.lastAutoBackup || null,
                    theme: parsed.theme || 'system',
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
        };
    });

    const [viewState, setViewState] = useState({ type: 'dashboard' });

    useEffect(() => {
        initDB().catch(err => console.error("Failed to initialize DB", err));
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        // Determine if dark mode should be enabled
        const isDark = appState.theme === 'dark' || 
                       (appState.theme === 'system' && mediaQuery.matches);
        
        // Apply or remove the 'dark' class
        root.classList.toggle('dark', isDark);

        // Listener for system theme changes
        const systemThemeListener = (e) => {
            // This only needs to apply the class, toggle handles the logic
            root.classList.toggle('dark', e.matches);
        };
        
        // If theme is 'system', listen for changes.
        if (appState.theme === 'system') {
            mediaQuery.addEventListener('change', systemThemeListener);
        }

        // Cleanup listener on component unmount or when theme setting changes
        return () => {
            mediaQuery.removeEventListener('change', systemThemeListener);
        };
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
        }, 500); // 500ms debounce delay

        return () => {
            clearTimeout(handler);
        };
    }, [appState]);

    useEffect(() => {
        if (appState.autoBackupEnabled) {
            const backupData = {
                contacts: appState.contacts,
                defaultFields: appState.defaultFields,
                businessInfo: appState.businessInfo,
            };
            const newBackup = {
                timestamp: new Date().toISOString(),
                data: JSON.stringify(backupData),
            };
            setAppState(current => ({
                ...current,
                lastAutoBackup: newBackup
            }));
            sessionStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(newBackup));
        }
    }, [appState.contacts, appState.defaultFields, appState.businessInfo, appState.autoBackupEnabled]);

    // Effect to handle view transitions and data consistency checks
    useEffect(() => {
        // Auto-select first contact on desktop if in list view and no contact is selected
        if (viewState.type === 'list' && window.innerWidth >= 768 && appState.contacts.length > 0) {
            setViewState({ type: 'detail', id: appState.contacts[0].id });
        }

        // Redirect if the selected contact for detail/edit view is deleted
        if ((viewState.type === 'detail' || viewState.type === 'edit_form') && !appState.contacts.some(c => c.id === viewState.id)) {
            setViewState({ type: 'dashboard' });
        }

        // Redirect from invoice if contact/ticket is deleted
        if (viewState.type === 'invoice') {
            const contactForInvoice = appState.contacts.find(c => c.id === viewState.contactId);
            const ticketForInvoice = contactForInvoice?.jobTickets?.find(t => t.id === viewState.ticketId);
            if (!contactForInvoice || !ticketForInvoice) {
                setViewState({ type: 'dashboard' });
            }
        }
    }, [viewState, appState.contacts]);

    const updateBusinessInfo = (info) => {
        setAppState(current => ({ ...current, businessInfo: info }));
        alert('Business information saved!');
    };
    
    const updateTheme = (theme) => {
        setAppState(current => ({ ...current, theme }));
    };

    const addContact = async (contactData) => {
        const filesWithData = contactData.files.filter(f => f.dataUrl);
        if (filesWithData.length > 0) {
            await addFiles(filesWithData);
        }

        const newContact = {
            ...contactData,
            id: generateId(),
            jobTickets: [],
            files: contactData.files.map(({ dataUrl, ...metadata }) => metadata),
        };

        setAppState(current => {
            const newContacts = [newContact, ...current.contacts];
            return { ...current, contacts: newContacts };
        });
        setViewState({ type: 'detail', id: newContact.id });
    };

    const updateContact = async (id, contactData) => {
        const originalContact = appState.contacts.find(c => c.id === id);
        if (!originalContact) return;

        const newFiles = contactData.files.filter(f => f.dataUrl);
        if (newFiles.length > 0) {
            await addFiles(newFiles);
        }

        const originalFileIds = new Set((originalContact.files || []).map(f => f.id));
        const updatedFileIds = new Set((contactData.files || []).map(f => f.id));
        const deletedFileIds = [...originalFileIds].filter(fileId => !updatedFileIds.has(fileId));


        if (deletedFileIds.length > 0) {
            await deleteFiles(deletedFileIds);
        }

        const finalContactData = {
            ...contactData,
            files: contactData.files.map(({ dataUrl, ...metadata }) => metadata),
        };

        setAppState(current => ({
            ...current,
            contacts: current.contacts.map(c => 
                c.id === id ? { ...c, ...finalContactData, id } : c
            )
        }));
        setViewState({ type: 'detail', id });
    };
  
    const addFilesToContact = async (contactId, newFiles) => {
        await addFiles(newFiles.filter(f => f.dataUrl));
        const filesMetadata = newFiles.map(({ dataUrl, ...metadata }) => metadata);
        setAppState(current => ({
            ...current,
            contacts: current.contacts.map(c => 
                c.id === contactId ? { ...c, files: [...(c.files || []), ...filesMetadata] } : c
            )
        }));
    };
  
    const updateContactJobTickets = (contactId, jobTickets) => {
        setAppState(current => ({
            ...current,
            contacts: current.contacts.map(c =>
                c.id === contactId ? { ...c, jobTickets } : c
            )
        }));
    };

    const deleteContact = async (id) => {
        if (window.confirm('Are you sure you want to delete this contact?')) {
            const contactToDelete = appState.contacts.find(c => c.id === id);
            if (contactToDelete && contactToDelete.files && contactToDelete.files.length > 0) {
                const fileIds = contactToDelete.files.map(f => f.id).filter(id => id != null);
                await deleteFiles(fileIds);
            }
            const remainingContacts = appState.contacts.filter(c => c.id !== id);
            setAppState(current => ({ ...current, contacts: remainingContacts }));
            
            if ((viewState.type === 'detail' || viewState.type === 'edit_form') && viewState.id === id) {
                 setViewState({ type: 'dashboard' });
            }
        }
    };

    const addDefaultField = (label) => {
        if (label && !appState.defaultFields.some(f => f.label.toLowerCase() === label.toLowerCase())) {
            const newField = { id: generateId(), label };
            setAppState(current => ({
                ...current,
                defaultFields: [...current.defaultFields, newField]
            }));
        }
    };

    const deleteDefaultField = (id) => {
        setAppState(current => ({
            ...current,
            defaultFields: current.defaultFields.filter(f => f.id !== id)
        }));
    };

    const handleToggleAutoBackup = (enabled) => {
        setAppState(current => ({ ...current, autoBackupEnabled: enabled }));
    };

    const restoreData = async (fileContent, silent = false) => {
        try {
            const backupData = JSON.parse(fileContent);
            if (backupData.contacts && Array.isArray(backupData.contacts)) {
                 const performRestore = async () => {
                    const { files, ...stateToRestore } = backupData;
                    if (files && Array.isArray(files)) {
                        await clearAndAddFiles(files);
                    }
                    setAppState(current => ({
                        ...current,
                        contacts: stateToRestore.contacts,
                        defaultFields: stateToRestore.defaultFields || initialDefaultFields,
                        businessInfo: stateToRestore.businessInfo || initialBusinessInfo,
                    }));
                    if (!silent) alert('Backup restored successfully!');
                    setViewState({ type: 'dashboard' });
                };

                if (silent || window.confirm('Are you sure you want to restore this backup? This will overwrite all current data.')) {
                    await performRestore();
                    return true;
                }
            } else {
                if (!silent) alert('Invalid backup file format.');
            }
        } catch (error) {
            if (!silent) alert('Failed to read or parse the backup file.');
            console.error("Backup restore error:", error);
        }
        return false;
    };
    
    const handleAcceptRecovery = async () => {
        if (recoveryBackup) {
            if (await restoreData(recoveryBackup.data, true)) { // Silent restore
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

    const selectedContact = useMemo(() => {
        if (viewState.type === 'detail' || viewState.type === 'edit_form' || viewState.type === 'invoice') {
            const id = viewState.type === 'invoice' ? viewState.contactId : viewState.id;
            return appState.contacts.find(c => c.id === id);
        }
        return undefined;
    }, [viewState, appState.contacts]);
  
    const selectedContactId = useMemo(() => {
        if (viewState.type === 'detail' || viewState.type === 'edit_form') {
            return viewState.id;
        }
        return null;
    }, [viewState]);

    const renderMainContent = () => {
        switch (viewState.type) {
            case 'dashboard':
                 return React.createElement(Dashboard, { 
                    contacts: appState.contacts, 
                    onSelectContact: (id) => setViewState({ type: 'detail', id }),
                });
            case 'list':
                return React.createElement(EmptyState, {
                    Icon: UserCircleIcon,
                    title: "Welcome to your Contacts",
                    message: "Select a contact to view their details or add a new one.",
                    actionText: appState.contacts.length === 0 ? "Add First Contact" : undefined,
                    onAction: appState.contacts.length === 0 ? () => setViewState({ type: 'new_form' }) : undefined,
                });
            case 'detail':
                if (!selectedContact) return null; // Handled by useEffect
                return React.createElement(ContactDetail, {
                    contact: selectedContact,
                    defaultFields: appState.defaultFields,
                    onEdit: () => setViewState({ type: 'edit_form', id: selectedContact.id }),
                    onDelete: () => deleteContact(selectedContact.id),
                    onClose: () => setViewState({ type: 'list' }),
                    addFilesToContact: addFilesToContact,
                    updateContactJobTickets: updateContactJobTickets,
                    onViewInvoice:(contactId, ticketId) => setViewState({ type: 'invoice', contactId, ticketId }),
                });
            case 'new_form':
                return React.createElement(ContactForm, {
                    onSave: addContact,
                    onCancel: () => appState.contacts.length > 0 ? setViewState({ type: 'list' }) : setViewState({type: 'dashboard'}),
                    defaultFields: appState.defaultFields,
                });
            case 'edit_form':
                if (!selectedContact) return null; // Handled by useEffect
                return React.createElement(ContactForm, {
                    initialContact: selectedContact,
                    onSave: (data) => updateContact(selectedContact.id, data),
                    onCancel: () => setViewState({ type: 'detail', id: selectedContact.id }),
                });
            case 'settings':
                return React.createElement(Settings, {
                    defaultFields: appState.defaultFields,
                    onAddDefaultField: addDefaultField,
                    onDeleteDefaultField: deleteDefaultField,
                    onBack: () => setViewState({ type: 'dashboard' }),
                    appStateForBackup: { ...appState },
                    autoBackupEnabled: appState.autoBackupEnabled,
                    onToggleAutoBackup: handleToggleAutoBackup,
                    lastAutoBackup: appState.lastAutoBackup,
                    onRestoreBackup: (content) => restoreData(content, false),
                    businessInfo: appState.businessInfo,
                    onUpdateBusinessInfo: updateBusinessInfo,
                    currentTheme: appState.theme,
                    onUpdateTheme: updateTheme,
                });
            case 'invoice':
                if (!selectedContact) return null; // Handled by useEffect
                const ticketForInvoice = (selectedContact.jobTickets || []).find(t => t.id === (viewState.type === 'invoice' && viewState.ticketId));
                if (!ticketForInvoice) return null; // Handled by useEffect

                return React.createElement(InvoiceView, {
                    contact: selectedContact,
                    ticket: ticketForInvoice,
                    businessInfo: appState.businessInfo,
                    onClose: () => setViewState({ type: 'detail', id: viewState.contactId }),
                    addFilesToContact: addFilesToContact,
                });
            default:
                return React.createElement(EmptyState, {
                    Icon: UserCircleIcon,
                    title: "Welcome to your Contacts",
                    message: "Select a contact to view their details or add a new one.",
                });
        }
    };
  
    const isListHiddenOnMobile = ['detail', 'new_form', 'edit_form', 'settings', 'dashboard', 'invoice'].includes(viewState.type);

    return React.createElement("div", { className: "h-screen w-screen flex flex-col antialiased text-slate-700 dark:text-slate-300 relative" },
        recoveryBackup && (
            React.createElement("div", { className: "absolute top-0 left-0 right-0 bg-yellow-100 border-b-2 border-yellow-300 p-4 z-50 flex items-center justify-between shadow-lg" },
                React.createElement("div", null,
                    React.createElement("p", { className: "font-bold text-yellow-800" }, "Data Recovery"),
                    React.createElement("p", { className: "text-sm text-yellow-700" },
                        `We found an automatic backup from ${new Date(recoveryBackup.timestamp).toLocaleString()}. Would you like to restore it?`
                    )
                ),
                React.createElement("div", { className: "flex space-x-2 flex-shrink-0 ml-4" },
                    React.createElement("button", {
                        onClick: handleAcceptRecovery,
                        className: "px-3 py-1 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                    }, "Restore"),
                    React.createElement("button", {
                        onClick: handleDismissRecovery,
                        className: "px-3 py-1 rounded-md text-sm font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 transition-colors"
                    }, "Dismiss")
                )
            )
        ),

        React.createElement("div", { className: viewState.type === 'invoice' ? 'print:hidden' : '' },
            React.createElement(Header, {
                currentView: viewState.type,
                onNewContact: () => setViewState({ type: 'new_form' }),
                onGoToSettings: () => setViewState({ type: 'settings' }),
                onGoToDashboard: () => setViewState({ type: 'dashboard' }),
                onGoToList: () => setViewState({ type: 'list' }),
            })
        ),

        React.createElement("div", { className: "flex flex-grow h-0" },
            React.createElement("div", { className: `w-full md:w-1/3 lg:w-1/4 flex-shrink-0 h-full ${isListHiddenOnMobile ? 'hidden md:block' : 'block'} ${viewState.type === 'invoice' ? 'print:hidden' : ''}` },
                React.createElement(ContactList, {
                    contacts: appState.contacts,
                    selectedContactId: selectedContactId,
                    onSelectContact: (id) => setViewState({ type: 'detail', id }),
                })
            ),
            React.createElement("main", { className: `flex-grow h-full ${!isListHiddenOnMobile ? 'hidden md:block' : 'block'} ${viewState.type === 'invoice' ? 'print:w-full' : ''}` },
                renderMainContent()
            )
        )
    );
};

export default App;
