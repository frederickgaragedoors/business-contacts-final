import React, { useState } from 'react';
import ContactListItem from './ContactListItem.js';
import { PlusIcon, SettingsIcon, SearchIcon } from './icons.js';

const ContactList = ({ contacts, selectedContactId, onSelectContact, onNewContact, onGoToSettings }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    React.createElement("div", { className: "h-full bg-slate-50 border-r border-slate-200 flex flex-col" },
      React.createElement("div", { className: "p-4 border-b border-slate-200 flex justify-between items-center space-x-2" },
        React.createElement("h1", { className: "text-2xl font-bold text-slate-800" }, "Contacts"),
        React.createElement("div", { className: "flex items-center space-x-2" },
          React.createElement("button", {
            onClick: onGoToSettings,
            className: "p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors",
            "aria-label": "Settings"
          },
            React.createElement(SettingsIcon, { className: "w-6 h-6" })
          ),
          React.createElement("button", {
            onClick: onNewContact,
            className: "p-2 rounded-full text-white bg-sky-500 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors",
            "aria-label": "Add new contact"
          },
            React.createElement(PlusIcon, { className: "w-6 h-6" })
          )
        )
      ),
      React.createElement("div", { className: "p-4 border-b border-slate-200" },
        React.createElement("div", { className: "relative" },
            React.createElement("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" },
                React.createElement(SearchIcon, { className: "w-5 h-5 text-slate-400" })
            ),
            React.createElement("input", {
                type: "text",
                placeholder: "Search contacts...",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: "w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
            })
        )
      ),
      React.createElement("ul", { className: "overflow-y-auto flex-grow" },
        filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            React.createElement(ContactListItem, {
              key: contact.id,
              contact: contact,
              isSelected: contact.id === selectedContactId,
              onSelect: () => onSelectContact(contact.id)
            })
          ))
        ) : (
          React.createElement("p", { className: "text-center text-slate-500 p-4" }, "No contacts found.")
        )
      )
    )
  );
};

export default ContactList;