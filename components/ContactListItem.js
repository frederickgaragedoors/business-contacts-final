import React from 'react';
import { getInitials } from '../utils.js';

const ContactListItem = ({ contact, isSelected, onSelect }) => {
  return (
    React.createElement("li", {
      onClick: onSelect,
      className: `flex items-center p-3 cursor-pointer transition-colors duration-200 ${
        isSelected ? 'bg-sky-100' : 'hover:bg-slate-200'
      }`
    },
      React.createElement("div", { className: "w-12 h-12 rounded-full overflow-hidden bg-slate-300 flex-shrink-0 flex items-center justify-center" },
        contact.photoUrl ? (
          React.createElement("img", { src: contact.photoUrl, alt: contact.name, className: "w-full h-full object-cover" })
        ) : (
          React.createElement("span", { className: "text-slate-600 font-semibold" }, getInitials(contact.name))
        )
      ),
      React.createElement("div", { className: "ml-4 truncate" },
        React.createElement("p", { className: `font-semibold text-slate-800 ${isSelected ? 'text-sky-800' : ''}` },
          contact.name
        ),
        React.createElement("p", { className: "text-sm text-slate-500 truncate" }, contact.email)
      )
    )
  );
};

export default ContactListItem;