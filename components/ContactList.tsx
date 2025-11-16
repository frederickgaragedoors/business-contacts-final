import React, { useState } from 'react';
import { Contact, ViewState } from '../types.ts';
import ContactListItem from './ContactListItem.tsx';
import { PlusIcon, SettingsIcon, SearchIcon, ClipboardListIcon, UsersIcon } from './icons.tsx';

interface ContactListProps {
  contacts: Contact[];
  selectedContactId: string | null;
  currentView: ViewState['type'];
  onSelectContact: (id: string) => void;
  onNewContact: () => void;
  onGoToSettings: () => void;
  onGoToDashboard: () => void;
  onGoToList: () => void;
}

const ContactList: React.FC<ContactListProps> = ({ 
    contacts, 
    selectedContactId, 
    currentView,
    onSelectContact, 
    onNewContact, 
    onGoToSettings,
    onGoToDashboard,
    onGoToList,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full bg-slate-50 border-r border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center space-x-2">
        <div className="flex items-center space-x-1 p-1 bg-slate-200 rounded-lg">
            <button
                onClick={onGoToDashboard}
                className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentView === 'dashboard' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`}
                aria-label="Dashboard"
            >
                <ClipboardListIcon className="w-5 h-5" />
                <span>Dashboard</span>
            </button>
            <button
                onClick={onGoToList}
                className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentView !== 'dashboard' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`}
                aria-label="Contacts"
            >
                <UsersIcon className="w-5 h-5" />
                <span>Contacts</span>
            </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onGoToSettings}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
            aria-label="Settings"
          >
            <SettingsIcon className="w-6 h-6" />
          </button>
          <button
            onClick={onNewContact}
            className="p-2 rounded-full text-white bg-sky-500 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
            aria-label="Add new contact"
          >
            <PlusIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
      <div className="p-4 border-b border-slate-200">
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="w-5 h-5 text-slate-400" />
            </div>
            <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
            />
        </div>
      </div>
      <ul className="overflow-y-auto flex-grow">
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            <ContactListItem
              key={contact.id}
              contact={contact}
              isSelected={contact.id === selectedContactId}
              onSelect={() => onSelectContact(contact.id)}
            />
          ))
        ) : (
          <p className="text-center text-slate-500 p-4">No contacts found.</p>
        )}
      </ul>
    </div>
  );
};

export default ContactList;
