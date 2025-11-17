import React, { useState, useMemo, useEffect } from 'react';
import { Contact, ViewState, DefaultFieldSetting, FileAttachment, JobTicket, BusinessInfo } from './types.ts';
import Header from './components/Header.tsx';
import ContactList from './components/ContactList.tsx';
import ContactDetail from './components/ContactDetail.tsx';
import ContactForm from './components/ContactForm.tsx';
import Settings from './components/Settings.tsx';
import Dashboard from './components/Dashboard.tsx';
import InvoiceView from './components/InvoiceView.tsx';
import { UserCircleIcon } from './components/icons.tsx';
import { generateId } from './utils.ts';
import { initDB, addFiles, deleteFiles, getAllFiles, clearAndAddFiles } from './db.ts';


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
    jobTickets: [
        { id: 'jt1', date: '2024-07-15', notes: 'Customer reported grinding noise when opening door. Inspected tracks and rollers.', status: 'Scheduled', parts: [], laborCost: 150 },
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
        { id: 'jt4', date: '2024-08-01', notes: 'Scheduled annual maintenance.', status: 'Scheduled', parts: [], laborCost: 90 }
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
        { id: 'jt5', date: '2024-07-20', notes: 'Install new smart garage opener.', status: 'In Progress', parts: [{id: 'p2', name: 'Smart Opener', cost: 350}], laborCost: 150}
    ],
  },
];

const initialDefaultFields: DefaultFieldSetting[] = [
    { id: 'df1', label: 'Company' },
    { id: 'df2', label: 'Job Title' },
];

const initialBusinessInfo: BusinessInfo = {
    name: '',
    address: '',
    phone: '',
    email: '',
    logoUrl: '',
};

type Theme = 'light' | 'dark' | 'system';

interface AppState {
    contacts: Contact[];
    defaultFields: DefaultFieldSetting[];
    businessInfo: BusinessInfo;
    autoBackupEnabled: boolean;
    lastAutoBackup: {
        timestamp: string; // ISO string
        data: string;      // JSON string of all app state
    } | null;
    theme: Theme;
}

const APP_STORAGE_KEY = 'businessContactsApp';
const RECOVERY_STORAGE_KEY = 'businessContactsRecoveryBackup';


const App: React.FC = () => {
    const [recoveryBackup, setRecoveryBackup] = useState<{ timestamp: string; data: string } | null>(() => {
        const savedDataString = localStorage.getItem(APP_STORAGE_KEY);
        // Only trigger recovery if main storage is empty
        if (!savedDataString) {
            const recoveryDataString = sessionStorage.getItem(RECOVERY_STORAGE_KEY);
            if (recoveryDataString) {
                return JSON.parse(recoveryDataString);
            }
        }
        return null;
    });
    
    const [appState, setAppState] = useState<AppState>(() => {
        try {
            const savedData = localStorage.getItem(APP_STORAGE_KEY);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                
                // Sanitize loaded contacts to ensure data integrity with new versions
                const sanitizedContacts = (parsed.contacts || initialContacts).map((c: any) => ({
                    ...initialContacts[0], // provides a base structure
                    ...c,
                    files: c.files || [],
                    customFields: c.customFields || [],
                    jobTickets: c.jobTickets || [],
                }));

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

    const [viewState, setViewState] = useState<ViewState>({ type: 'dashboard' });

    // Effect to initialize the database
    useEffect(() => {
        initDB().catch(err => console.error("Failed to initialize DB", err));
    }, []);
    
    // Effect to manage the theme
    useEffect(() => {
        const root = window.document.documentElement;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        // Determine if dark mode should be enabled
        const isDark = appState.theme === 'dark' || 
                       (appState.theme === 'system' && mediaQuery.matches);
        
        // Apply or remove the 'dark' class
        root.classList.toggle('dark', isDark);

        // Listener for system theme changes
        const systemThemeListener = (e: MediaQueryListEvent) => {
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

    // Debounced effect to persist the entire app state to localStorage
    useEffect(() => {
        const handler = setTimeout(() => {
            try {
                // Create a version of the state without any file data URLs for saving
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

    // Effect for automatic backups
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
             // Also save to sessionStorage for recovery
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
            const ticketForInvoice = contactForInvoice?.jobTickets.find(t => t.id === viewState.ticketId);
            if (!contactForInvoice || !ticketForInvoice) {
                setViewState({ type: 'dashboard' });
            }
        }
    }, [viewState, appState.contacts]);


    const updateBusinessInfo = (info: BusinessInfo) => {
        setAppState(current => ({ ...current, businessInfo: info }));
        alert('Business information saved!');
    };
    
    const updateTheme = (theme: Theme) => {
        setAppState(current => ({ ...current, theme }));
    };

    const addContact = async (contactData: Omit<Contact, 'id'>) => {
        const filesWithData = contactData.files.filter(f => f.dataUrl);
        if (filesWithData.length > 0) {
            await addFiles(filesWithData);
        }

        const newContact: Contact = {
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

    const updateContact = async (id: string, contactData: Omit<Contact, 'id'>) => {
        const originalContact = appState.contacts.find(c => c.id === id);
        if (!originalContact) return;

        const newFiles = contactData.files.filter(f => f.dataUrl);
        if (newFiles.length > 0) {
            await addFiles(newFiles);
        }

        const originalFileIds = new Set((originalContact.files || []).map((f: FileAttachment) => f.id));
        const updatedFileIds = new Set(contactData.files.map((f: FileAttachment) => f.id));
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
  
    const addFilesToContact = async (contactId: string, newFiles: FileAttachment[]) => {
        await addFiles(newFiles.filter(f => f.dataUrl));
        
        const filesMetadata = newFiles.map(({ dataUrl, ...metadata }) => metadata);
        
        setAppState(current => ({
            ...current,
            contacts: current.contacts.map(c => 
                c.id === contactId ? { ...c, files: [...(c.files || []), ...filesMetadata] } : c
            )
        }));
    };
  
    const updateContactJobTickets = (contactId: string, jobTickets: JobTicket[]) => {
        setAppState(current => ({
            ...current,
            contacts: current.contacts.map(c =>
                c.id === contactId ? { ...c, jobTickets } : c
            )
        }));
    };

    const deleteContact = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this contact?')) {
            const contactToDelete = appState.contacts.find(c => c.id === id);
            if (contactToDelete && contactToDelete.files && contactToDelete.files.length > 0) {
                await deleteFiles(contactToDelete.files.map((f: FileAttachment) => f.id));
            }

            const remainingContacts = appState.contacts.filter(c => c.id !== id);
            setAppState(current => ({ ...current, contacts: remainingContacts }));
            
            if ((viewState.type === 'detail' || viewState.type === 'edit_form') && viewState.id === id) {
                 setViewState({ type: 'dashboard' });
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

    const restoreData = async (fileContent: string, silent = false): Promise<boolean> => {
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
                 return <Dashboard 
                    contacts={appState.contacts} 
                    onSelectContact={(id) => setViewState({ type: 'detail', id })}
                 />;
            case 'list':
                 return <WelcomeMessage onNewContact={() => setViewState({ type: 'new_form' })} />;

            case 'detail':
                if (!selectedContact) return null; // Handled by useEffect
                return (
                    <ContactDetail
                        contact={selectedContact}
                        defaultFields={appState.defaultFields}
                        onEdit={() => setViewState({ type: 'edit_form', id: selectedContact.id })}
                        onDelete={() => deleteContact(selectedContact.id)}
                        onClose={() => setViewState({ type: 'list' })}
                        addFilesToContact={addFilesToContact}
                        updateContactJobTickets={updateContactJobTickets}
                        onViewInvoice={(contactId, ticketId) => setViewState({ type: 'invoice', contactId, ticketId })}
                    />
                );
            case 'new_form':
                return (
                    <ContactForm
                        onSave={addContact}
                        onCancel={() => appState.contacts.length > 0 ? setViewState({ type: 'list' }) : setViewState({type: 'dashboard'})}
                        defaultFields={appState.defaultFields}
                    />
                );
            case 'edit_form':
                if (!selectedContact) return null; // Handled by useEffect
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
                        onBack={() => setViewState({ type: 'dashboard' })}
                        appStateForBackup={{ ...appState }}
                        autoBackupEnabled={appState.autoBackupEnabled}
                        onToggleAutoBackup={handleToggleAutoBackup}
                        lastAutoBackup={appState.lastAutoBackup}
                        onRestoreBackup={(content) => restoreData(content, false)}
                        businessInfo={appState.businessInfo}
                        onUpdateBusinessInfo={updateBusinessInfo}
                        currentTheme={appState.theme}
                        onUpdateTheme={updateTheme}
                    />
                );
            case 'invoice':
                if (!selectedContact) return null; // Handled by useEffect
                const ticketForInvoice = selectedContact.jobTickets.find(t => t.id === (viewState.type === 'invoice' && viewState.ticketId));
                if (!ticketForInvoice) return null; // Handled by useEffect
                
                return (
                    <InvoiceView 
                        contact={selectedContact}
                        ticket={ticketForInvoice}
                        businessInfo={appState.businessInfo}
                        onClose={() => setViewState({ type: 'detail', id: viewState.contactId })}
                        addFilesToContact={addFilesToContact}
                    />
                );
            default:
                return <WelcomeMessage onNewContact={() => setViewState({ type: 'new_form' })} />;
        }
    };
    
    const isListHiddenOnMobile = ['detail', 'new_form', 'edit_form', 'settings', 'dashboard', 'invoice'].includes(viewState.type);

    return (
        <div className="h-screen w-screen flex flex-col antialiased text-slate-700 dark:text-slate-300 relative">
            {recoveryBackup && (
                <div className="absolute top-0 left-0 right-0 bg-yellow-100 border-b-2 border-yellow-300 p-4 z-50 flex items-center justify-between shadow-lg">
                    <div>
                        <p className="font-bold text-yellow-800">Data Recovery</p>
                        <p className="text-sm text-yellow-700">
                            We found an automatic backup from {new Date(recoveryBackup.timestamp).toLocaleString()}. Would you like to restore it?
                        </p>
                    </div>
                    <div className="flex space-x-2 flex-shrink-0 ml-4">
                        <button
                            onClick={handleAcceptRecovery}
                            className="px-3 py-1 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                        >
                            Restore
                        </button>
                        <button
                            onClick={handleDismissRecovery}
                            className="px-3 py-1 rounded-md text-sm font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            <div className={viewState.type === 'invoice' ? 'print:hidden' : ''}>
                <Header 
                    currentView={viewState.type}
                    onNewContact={() => setViewState({ type: 'new_form' })}
                    onGoToSettings={() => setViewState({ type: 'settings' })}
                    onGoToDashboard={() => setViewState({ type: 'dashboard' })}
                    onGoToList={() => setViewState({ type: 'list' })}
                />
            </div>
            
            <div className="flex flex-grow h-0"> {/* h-0 is key for flex overflow */}
                <div className={`w-full md:w-1/3 lg:w-1/4 flex-shrink-0 h-full ${isListHiddenOnMobile ? 'hidden md:block' : 'block'} ${viewState.type === 'invoice' ? 'print:hidden' : ''}`}>
                    <ContactList
                        contacts={appState.contacts}
                        selectedContactId={selectedContactId}
                        onSelectContact={(id) => setViewState({ type: 'detail', id })}
                    />
                </div>
                <main className={`flex-grow h-full ${!isListHiddenOnMobile ? 'hidden md:block' : 'block'} ${viewState.type === 'invoice' ? 'print:w-full' : ''}`}>
                    {renderMainContent()}
                </main>
            </div>
        </div>
    );
};

const WelcomeMessage: React.FC<{onNewContact?: () => void}> = ({ onNewContact }) => (
  <div className="h-full flex flex-col justify-center items-center text-center p-8 bg-slate-50 dark:bg-slate-800">
    <UserCircleIcon className="w-24 h-24 text-slate-300 dark:text-slate-600" />
    <h2 className="mt-4 text-2xl font-bold text-slate-600 dark:text-slate-300">Welcome to your Contacts</h2>
    <p className="mt-2 text-slate-500 dark:text-slate-400">Select a contact to view their details or add a new one.</p>
    {onNewContact && (
        <button 
            onClick={onNewContact} 
            className="mt-6 px-4 py-2 bg-sky-500 text-white font-medium rounded-md hover:bg-sky-600 transition-colors"
        >
            Add First Contact
        </button>
    )}
  </div>
);

export default App;
