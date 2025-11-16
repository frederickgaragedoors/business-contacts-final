import React, { useState, useMemo, useEffect } from 'react';
import ContactList from './components/ContactList.js';
import ContactDetail from './components/ContactDetail.js';
import ContactForm from './components/ContactForm.js';
import Settings from './components/Settings.js';
import { UserCircleIcon } from './components/icons.js';
import { generateId } from './utils.js';

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
    workLogs: [
        { id: 'wl1', date: '2023-10-15', description: 'Initial consultation and project scope definition.' },
        { id: 'wl2', date: '2023-10-22', description: 'Completed phase 1 of the project deliverables.' },
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
    workLogs: [],
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
    workLogs: [],
  },
];

const initialDefaultFields = [
    { id: 'df1', label: 'Company' },
    { id: 'df2', label: 'Job Title' },
];

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
        const savedData = localStorage.getItem(APP_STORAGE_KEY);
        if (savedData) {
            const parsed = JSON.parse(savedData);
            return {
                contacts: parsed.contacts || initialContacts,
                defaultFields: parsed.defaultFields || initialDefaultFields,
                autoBackupEnabled: parsed.autoBackupEnabled || false,
                lastAutoBackup: parsed.lastAutoBackup || null,
            };
        }
        return {
            contacts: initialContacts,
            defaultFields: initialDefaultFields,
            autoBackupEnabled: false,
            lastAutoBackup: null,
        };
    });

    const [viewState, setViewState] = useState(() => {
        const savedData = localStorage.getItem(APP_STORAGE_KEY);
        const contacts = savedData ? JSON.parse(savedData).contacts : initialContacts;
        return contacts.length > 0 ? { type: 'detail', id: contacts[0].id } : { type: 'list' };
    });

    useEffect(() => {
        localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(appState));
    }, [appState]);

    useEffect(() => {
        if (appState.autoBackupEnabled) {
            const backupData = {
                contacts: appState.contacts,
                defaultFields: appState.defaultFields,
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
    }, [appState.contacts, appState.defaultFields, appState.autoBackupEnabled]);

    const addContact = (contactData) => {
        const newContact = {
            ...contactData,
            id: generateId(),
            workLogs: [],
        };
        setAppState(current => {
            const newContacts = [newContact, ...current.contacts];
            return { ...current, contacts: newContacts };
        });
        setViewState({ type: 'detail', id: newContact.id });
    };

    const updateContact = (id, contactData) => {
        setAppState(current => ({
            ...current,
            contacts: current.contacts.map(c => 
                c.id === id ? { ...c, ...contactData, id } : c
            )
        }));
        setViewState({ type: 'detail', id });
    };
  
    const addFilesToContact = (contactId, newFiles) => {
        setAppState(current => ({
            ...current,
            contacts: current.contacts.map(c => 
                c.id === contactId ? { ...c, files: [...c.files, ...newFiles] } : c
            )
        }));
    };
  
    const updateContactWorkLogs = (contactId, workLogs) => {
        setAppState(current => ({
            ...current,
            contacts: current.contacts.map(c =>
                c.id === contactId ? { ...c, workLogs } : c
            )
        }));
    };

    const deleteContact = (id) => {
        if (window.confirm('Are you sure you want to delete this contact?')) {
            const remainingContacts = appState.contacts.filter(c => c.id !== id);
            setAppState(current => ({ ...current, contacts: remainingContacts }));
            
            if ((viewState.type === 'detail' || viewState.type === 'edit_form') && viewState.id === id) {
                if (remainingContacts.length > 0) {
                    setViewState({ type: 'detail', id: remainingContacts[0].id });
                } else {
                    setViewState({ type: 'list' });
                }
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

    const restoreData = (fileContent, silent = false) => {
        try {
            const backupData = JSON.parse(fileContent);
            if (backupData.contacts && Array.isArray(backupData.contacts) && backupData.defaultFields && Array.isArray(backupData.defaultFields)) {
                 const performRestore = () => {
                    setAppState(current => ({
                        ...current,
                        contacts: backupData.contacts,
                        defaultFields: backupData.defaultFields,
                    }));
                    if (!silent) alert('Backup restored successfully!');
                    if (backupData.contacts.length > 0) {
                        setViewState({ type: 'detail', id: backupData.contacts[0].id });
                    } else {
                        setViewState({ type: 'list' });
                    }
                };

                if (silent || window.confirm('Are you sure you want to restore this backup? This will overwrite all current data.')) {
                    performRestore();
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
    
    const handleAcceptRecovery = () => {
        if (recoveryBackup) {
            if (restoreData(recoveryBackup.data, true)) { // Silent restore
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
        if (viewState.type === 'detail' || viewState.type === 'edit_form') {
            return appState.contacts.find(c => c.id === viewState.id);
        }
        return undefined;
    }, [viewState, appState.contacts]);
  
    const selectedContactId = useMemo(() => {
        if (viewState.type === 'detail' || viewState.type === 'edit_form') {
            return viewState.id;
        }
        return null;
    }, [viewState]);

    const renderRightPanel = () => {
        switch (viewState.type) {
            case 'detail':
                if (!selectedContact) {
                    if (appState.contacts.length > 0) {
                        setViewState({ type: 'detail', id: appState.contacts[0].id });
                        return null;
                    }
                    return React.createElement(WelcomeMessage, null);
                }
                return React.createElement(ContactDetail, {
                    contact: selectedContact,
                    defaultFields: appState.defaultFields,
                    onEdit: () => setViewState({ type: 'edit_form', id: selectedContact.id }),
                    onDelete: () => deleteContact(selectedContact.id),
                    onClose: () => setViewState({ type: 'list' }),
                    addFilesToContact: addFilesToContact,
                    updateContactWorkLogs: updateContactWorkLogs,
                });
            case 'new_form':
                return React.createElement(ContactForm, {
                    onSave: addContact,
                    onCancel: () => appState.contacts.length > 0 ? setViewState({ type: 'detail', id: appState.contacts[0].id }) : setViewState({ type: 'list' }),
                    defaultFields: appState.defaultFields,
                });
            case 'edit_form':
                if (!selectedContact) return React.createElement(WelcomeMessage, null);
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
                    onBack: () => appState.contacts.length > 0 ? setViewState({ type: 'detail', id: appState.contacts[0].id }) : setViewState({ type: 'list' }),
                    appStateForBackup: { contacts: appState.contacts, defaultFields: appState.defaultFields },
                    autoBackupEnabled: appState.autoBackupEnabled,
                    onToggleAutoBackup: handleToggleAutoBackup,
                    lastAutoBackup: appState.lastAutoBackup,
                    onRestoreBackup: (content) => restoreData(content, false),
                });
            default:
                return React.createElement(WelcomeMessage, null);
        }
    };
  
    const showListOnMobile = viewState.type === 'list';

    return React.createElement("div", { className: "h-screen w-screen flex antialiased text-slate-700 relative" },
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
        React.createElement("div", { className: `w-full md:w-1/3 lg:w-1/4 flex-shrink-0 ${showListOnMobile ? 'block' : 'hidden md:block'}` },
            React.createElement(ContactList, {
                contacts: appState.contacts,
                selectedContactId: selectedContactId,
                onSelectContact: (id) => setViewState({ type: 'detail', id }),
                onNewContact: () => setViewState({ type: 'new_form' }),
                onGoToSettings: () => setViewState({ type: 'settings' }),
            })
        ),
        React.createElement("main", { className: `flex-grow bg-white ${!showListOnMobile ? 'block' : 'hidden md:block'}` },
            renderRightPanel()
        )
    );
};

const WelcomeMessage = () => (
  React.createElement("div", { className: "h-full flex flex-col justify-center items-center text-center p-8 bg-slate-50" },
    React.createElement(UserCircleIcon, { className: "w-24 h-24 text-slate-300" }),
    React.createElement("h2", { className: "mt-4 text-2xl font-bold text-slate-600" }, "Welcome to your Contacts"),
    React.createElement("p", { className: "mt-2 text-slate-500" }, "Select a contact from the list to view their details or add a new one.")
  )
);

export default App;
