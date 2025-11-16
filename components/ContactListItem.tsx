
import React from 'react';
import { Contact } from '../types.ts';
import { getInitials } from '../utils.ts';

interface ContactListItemProps {
  contact: Contact;
  isSelected: boolean;
  onSelect: () => void;
}

const ContactListItem: React.FC<ContactListItemProps> = ({ contact, isSelected, onSelect }) => {
  return (
    <li
      onClick={onSelect}
      className={`flex items-center p-3 cursor-pointer transition-colors duration-200 ${
        isSelected ? 'bg-sky-100' : 'hover:bg-slate-200'
      }`}
    >
      <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-300 flex-shrink-0 flex items-center justify-center">
        {contact.photoUrl ? (
          <img src={contact.photoUrl} alt={contact.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-slate-600 font-semibold">{getInitials(contact.name)}</span>
        )}
      </div>
      <div className="ml-4 truncate">
        <p className={`font-semibold text-slate-800 ${isSelected ? 'text-sky-800' : ''}`}>
          {contact.name}
        </p>
        <p className="text-sm text-slate-500 truncate">{contact.email}</p>
      </div>
    </li>
  );
};

export default ContactListItem;