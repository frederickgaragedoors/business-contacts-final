import React, { useState, useMemo, useEffect } from 'react';
import { Contact, ViewState, DefaultFieldSetting, FileAttachment, WorkLogEntry } from './types.ts';
import ContactList from './components/ContactList.tsx';
import ContactDetail from './components/ContactDetail.tsx';
import ContactForm from './components/ContactForm.tsx';
import Settings from './components/Settings.tsx';
import { UserCircleIcon } from './components/icons.tsx';
import { generateId } from './utils.ts';

const initialContacts: Contact[] = [
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

const initialDefaultFields: DefaultFieldSetting[] = [
    { id: 'df1', label: 'Company' },
    { id: 'df2', label: 'Job Title' },
];

interface AppState {
    contacts: Contact[];
    defaultFields: DefaultFieldSetting[];
    autoBackupEnabled: boolean;
    lastAutoBackup: {
        timestamp: string; // ISO string
        data: string;      // JSON string of contacts and defaultFields
    } | null;
}

const APP_STORAGE_KEY = 'businessContactsApp';

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>(() => {
        const savedData = localStorage.getItem(APP_STORAGE_KEY);
        if (savedData) {
            const parsed = JSON.parse(savedData);
            // Ensure backward compatibility and provide defaults for new properties
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

    const [viewState, setViewState] = useState<ViewState>(() => {
        const savedData = localStorage.getItem(APP_STORAGE_KEY);
        const contacts = savedData ? JSON.parse(savedData).contacts : initialContacts;
        return contacts.length > 0 ? { type: 'detail', id: contacts[0].id } : { type: 'list' };
    });

    // Effect to persist the entire app state to localStorage
    useEffect(() => {
        localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(appState));
    }, [appState]);

    // Effect for automatic backups
    useEffect(() => {
        if (appState.autoBackupEnabled) {
            const backupData = {
                contacts: appState.contacts,
                defaultFields: appState.defaultFields,
            };
            setAppState(current => ({
                ...current,
                lastAutoBackup: {
                    timestamp: new Date().toISOString(),
                    data: JSON.stringify(backupData),
                }
            }));
        }
    }, [appState.contacts, appState.defaultFields, appState.autoBackupEnabled]);


    const addContact = (contactData: Omit<Contact, 'id'>) => {
        const newContact: Contact = {
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

    const updateContact = (id: string, contactData: Omit<Contact, 'id'>) => {
        setAppState(current => ({
            ...current,
            contacts: current.contacts.map(c => 
                c.id === id ? { ...c, ...contactData, id } : c
            )
        }));
        setViewState({ type: 'detail', id });
    };
  
    const addFilesToContact = (contactId: string, newFiles: FileAttachment[]) => {
        setAppState(current => ({
            ...current,
            contacts: current.contacts.map(c => 
                c.id === contactId ? { ...c, files: [...c.files, ...newFiles] } : c
            )
        }));
    };
  
    const updateContactWorkLogs = (contactId: string, workLogs: WorkLogEntry[]) => {
        setAppState(current => ({
            ...current,
            contacts: current.contacts.map(c =>
                c.id === contactId ? { ...c, workLogs } : c
            )
        }));
    };

    const deleteContact = (id: string) => {
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

    const addDefaultField = (label: string) => {
        if (label && !appState.defaultFields.some(f => f.label.toLowerCase() === label.toLowerCase())) {
            const newField: DefaultFieldSetting = { id: generateId(), label };
            setAppState(current => ({
                ...current,
                defaultFields: [...current.defaultFields, newField]
            }));
        }
    };

    const deleteDefaultField = (id: string) => {
        setAppState(current => ({
            ...current,
            defaultFields: current.defaultFields.filter(f => f.id !== id)
        }));
    };

    const handleToggleAutoBackup = (enabled: boolean) => {
        setAppState(current => ({ ...current, autoBackupEnabled: enabled }));
    };

    const handleRestoreBackup = (fileContent: string) => {
        try {
            const backupData = JSON.parse(fileContent);
            if (backupData.contacts && Array.isArray(backupData.contacts) && backupData.defaultFields && Array.isArray(backupData.defaultFields)) {
                if (window.confirm('Are you sure you want to restore this backup? This will overwrite all current data.')) {
                    setAppState(current => ({
                        ...current,
                        contacts: backupData.contacts,
                        defaultFields: backupData.defaultFields,
                    }));
                    alert('Backup restored successfully!');
                    if (backupData.contacts.length > 0) {
                        setViewState({ type: 'detail', id: backupData.contacts[0].id });
                    } else {
                        setViewState({ type: 'list' });
                    }
                }
            } else {
                alert('Invalid backup file format.');
            }
        } catch (error) {
            alert('Failed to read or parse the backup file.');
            console.error("Backup restore error:", error);
        }
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
                    return <WelcomeMessage />;
                }
                return (
                    <ContactDetail
                        contact={selectedContact}
                        defaultFields={appState.defaultFields}
                        onEdit={() => setViewState({ type: 'edit_form', id: selectedContact.id })}
                        onDelete={() => deleteContact(selectedContact.id)}
                        onClose={() => setViewState({ type: 'list' })}
                        addFilesToContact={addFilesToContact}
                        updateContactWorkLogs={updateContactWorkLogs}
                    />
                );
            case 'new_form':
                return (
                    <ContactForm
                        onSave={addContact}
                        onCancel={() => appState.contacts.length > 0 ? setViewState({ type: 'detail', id: appState.contacts[0].id }) : setViewState({ type: 'list' })}
                        defaultFields={appState.defaultFields}
                    />
                );
            case 'edit_form':
                if (!selectedContact) return <WelcomeMessage />;
                return (
                    <ContactForm
                        initialContact={selectedContact}
                        onSave={(data) => updateContact(selectedContact.id, data)}
                        onCancel={() => setViewState({ type: 'detail', id: selectedContact.id })}
                    />
                );
            case 'settings':
                return (
                    <Settings
                        defaultFields={appState.defaultFields}
                        onAddDefaultField={addDefaultField}
                        onDeleteDefaultField={deleteDefaultField}
                        onBack={() => appState.contacts.length > 0 ? setViewState({ type: 'detail', id: appState.contacts[0].id }) : setViewState({ type: 'list' })}
                        appStateForBackup={{ contacts: appState.contacts, defaultFields: appState.defaultFields }}
                        autoBackupEnabled={appState.autoBackupEnabled}
                        onToggleAutoBackup={handleToggleAutoBackup}
                        lastAutoBackup={appState.lastAutoBackup}
                        onRestoreBackup={handleRestoreBackup}
                    />
                );
            default:
                return <WelcomeMessage />;
        }
    };
  
    const showListOnMobile = viewState.type === 'list';

    return (
        <div className="h-screen w-screen flex antialiased text-slate-700">
            <div className={`w-full md:w-1/3 lg:w-1/4 flex-shrink-0 ${showListOnMobile ? 'block' : 'hidden md:block'}`}>
                <ContactList
                    contacts={appState.contacts}
                    selectedContactId={selectedContactId}
                    onSelectContact={(id) => setViewState({ type: 'detail', id })}
                    onNewContact={() => setViewState({ type: 'new_form' })}
                    onGoToSettings={() => setViewState({ type: 'settings' })}
                />
            </div>
            <main className={`flex-grow bg-white ${!showListOnMobile ? 'block' : 'hidden md:block'}`}>
                {renderRightPanel()}
            </main>
        </div>
    );
};

const WelcomeMessage: React.FC = () => (
  <div className="h-full flex flex-col justify-center items-center text-center p-8 bg-slate-50">
    <UserCircleIcon className="w-24 h-24 text-slate-300" />
    <h2 className="mt-4 text-2xl font-bold text-slate-600">Welcome to your Contacts</h2>
    <p className="mt-2 text-slate-500">Select a contact from the list to view their details or add a new one.</p>
  </div>
);

export default App;