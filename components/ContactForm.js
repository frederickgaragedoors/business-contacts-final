import React, { useState, useCallback } from 'react';
import { UserCircleIcon, XIcon, ArrowLeftIcon, FileIcon, TrashIcon, PlusIcon } from './icons.js';
import { fileToDataUrl, formatFileSize, generateId } from '../utils.js';

const ContactForm = ({ initialContact, onSave, onCancel, defaultFields }) => {
  const [name, setName] = useState(initialContact?.name || '');
  const [email, setEmail] = useState(initialContact?.email || '');
  const [phone, setPhone] = useState(initialContact?.phone || '');
  const [address, setAddress] = useState(initialContact?.address || '');
  const [photoUrl, setPhotoUrl] = useState(initialContact?.photoUrl || '');
  const [files, setFiles] = useState(initialContact?.files || []);
  const [customFields, setCustomFields] = useState(
    initialContact?.customFields || defaultFields?.map(df => ({ id: generateId(), label: df.label, value: '' })) || []
  );

  const [stagedFiles, setStagedFiles] = useState([]);

  const handlePhotoChange = useCallback(async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const dataUrl = await fileToDataUrl(file);
      setPhotoUrl(dataUrl);
    }
  }, []);

  const handleFilesChange = useCallback(async (e) => {
    if (e.target.files) {
      const newFilesPromises = Array.from(e.target.files).map(async (file) => {
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
      setStagedFiles(prevFiles => [...prevFiles, ...newFiles]);
      if(e.target) e.target.value = '';
    }
  }, []);

  const removeFile = (id, isStaged) => {
    if (isStaged) {
        setStagedFiles(stagedFiles.filter(file => file.id !== id));
    } else {
        setFiles(files.filter(file => file.id !== id));
    }
  };
  
  const handleCustomFieldChange = (id, field, value) => {
    setCustomFields(customFields.map(cf => cf.id === id ? { ...cf, [field]: value } : cf));
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { id: generateId(), label: '', value: '' }]);
  };

  const removeCustomField = (id) => {
    setCustomFields(customFields.filter(cf => cf.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalFiles = [...files, ...stagedFiles];
    onSave({ name, email, phone, address, photoUrl, files: finalFiles, customFields, jobTickets: initialContact?.jobTickets || [] });
  };
  
  const inputStyles = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm";
  const labelStyles = "block text-sm font-medium text-slate-600 dark:text-slate-300";


  return (
    React.createElement("form", { onSubmit: handleSubmit, className: "h-full flex flex-col bg-white dark:bg-slate-800 overflow-y-auto" },
      React.createElement("div", { className: "p-4 flex items-center border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10" },
        React.createElement("button", { type: "button", onClick: onCancel, className: "p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 md:hidden" },
            React.createElement(ArrowLeftIcon, { className: "w-6 h-6 text-slate-600 dark:text-slate-300" })
        ),
        React.createElement("h2", { className: "ml-4 flex-grow font-bold text-lg text-slate-700 dark:text-slate-200" },
          initialContact ? 'Edit Contact' : 'New Contact'
        ),
        React.createElement("div", { className: "flex space-x-2" },
            React.createElement("button", { type: "button", onClick: onCancel, className: "hidden md:inline px-4 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" }, "Cancel"),
            React.createElement("button", { type: "submit", className: "px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors" }, "Save")
        )
      ),
      
      React.createElement("div", { className: "px-4 sm:px-6 py-6 flex-grow" },
        React.createElement("div", { className: "flex flex-col items-center mb-6" },
            React.createElement("div", { className: "relative w-24 h-24" },
                photoUrl ? (
                    React.createElement("img", { src: photoUrl, alt: "Contact", className: "w-24 h-24 rounded-full object-cover" })
                ) : (
                    React.createElement(UserCircleIcon, { className: "w-24 h-24 text-slate-300 dark:text-slate-600" })
                ),
                 React.createElement("label", { htmlFor: "photo-upload", className: "absolute -bottom-1 -right-1 p-2 bg-sky-500 text-white rounded-full cursor-pointer hover:bg-sky-600 transition-colors" },
                    React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" }), React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15 13a3 3 0 11-6 0 3 3 0 016 0z" })),
                    React.createElement("input", { id: "photo-upload", type: "file", accept: "image/*", className: "hidden", onChange: handlePhotoChange })
                )
            )
        ),

        React.createElement("div", { className: "space-y-4" },
          React.createElement("div", null,
            React.createElement("label", { htmlFor: "name", className: labelStyles }, "Full Name"),
            React.createElement("input", { type: "text", id: "name", value: name, onChange: e => setName(e.target.value), required: true, className: inputStyles })
          ),
          React.createElement("div", null,
            React.createElement("label", { htmlFor: "email", className: labelStyles }, "Email"),
            React.createElement("input", { type: "email", id: "email", value: email, onChange: e => setEmail(e.target.value), required: true, className: inputStyles })
          ),
          React.createElement("div", null,
            React.createElement("label", { htmlFor: "phone", className: labelStyles }, "Phone"),
            React.createElement("input", { type: "tel", id: "phone", value: phone, onChange: e => setPhone(e.target.value), required: true, className: inputStyles })
          ),
          React.createElement("div", null,
            React.createElement("label", { htmlFor: "address", className: labelStyles }, "Address"),
            React.createElement("textarea", { id: "address", value: address, onChange: e => setAddress(e.target.value), rows: 3, className: inputStyles })
          )
        ),

        React.createElement("div", { className: "mt-6 border-t dark:border-slate-700 pt-6" },
            React.createElement("h3", { className: "text-lg font-medium text-slate-800 dark:text-slate-100" }, "Custom Fields"),
            React.createElement("div", { className: "mt-4 space-y-4" },
                customFields.map((field) => (
                    React.createElement("div", { key: field.id, className: "flex items-end space-x-2" },
                        React.createElement("div", { className: "flex-1" },
                            React.createElement("label", { className: "block text-xs font-medium text-slate-500 dark:text-slate-400" }, "Label"),
                            React.createElement("input", { type: "text", value: field.label, onChange: (e) => handleCustomFieldChange(field.id, 'label', e.target.value), placeholder: "e.g. Company", className: `${inputStyles} text-sm` })
                        ),
                         React.createElement("div", { className: "flex-1" },
                            React.createElement("label", { className: "block text-xs font-medium text-slate-500 dark:text-slate-400" }, "Value"),
                            React.createElement("input", { type: "text", value: field.value, onChange: (e) => handleCustomFieldChange(field.id, 'value', e.target.value), placeholder: "e.g. Acme Corp", className: `${inputStyles} text-sm` })
                        ),
                        React.createElement("button", { type: "button", onClick: () => removeCustomField(field.id), className: "p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors" },
                            React.createElement(TrashIcon, { className: "w-5 h-5" })
                        )
                    )
                ))
            ),
            React.createElement("button", { type: "button", onClick: addCustomField, className: "mt-4 flex items-center px-3 py-2 rounded-md text-sm font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/50 hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors" },
                React.createElement(PlusIcon, { className: "w-4 h-4 mr-2" }), " Add Field"
            )
        ),

        React.createElement("div", { className: "mt-6 border-t dark:border-slate-700 pt-6" },
            React.createElement("h3", { className: "text-lg font-medium text-slate-800 dark:text-slate-100" }, "Attachments"),
             React.createElement("div", { className: "mt-4 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md" },
                React.createElement("div", { className: "space-y-1 text-center" },
                  React.createElement(FileIcon, { className: "mx-auto h-12 w-12 text-slate-400" }),
                  React.createElement("div", { className: "flex text-sm text-slate-600 dark:text-slate-400" },
                    React.createElement("label", { htmlFor: "file-upload", className: "relative cursor-pointer bg-white dark:bg-slate-800 rounded-md font-medium text-sky-600 dark:text-sky-400 hover:text-sky-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-sky-500" },
                      React.createElement("span", null, "Upload files"),
                      React.createElement("input", { id: "file-upload", name: "file-upload", type: "file", multiple: true, className: "sr-only", onChange: handleFilesChange })
                    ),
                    React.createElement("p", { className: "pl-1" }, "or drag and drop")
                  ),
                  React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-500" }, "Any file type")
                )
              )
        ),

        files.length > 0 && (
          React.createElement("div", { className: "mt-4" },
             React.createElement("h4", { className: "text-sm font-medium text-slate-600 dark:text-slate-300" }, "Current Attachments"),
             React.createElement("ul", { className: "mt-2 space-y-2" },
                files.map(file => (
                  React.createElement("li", { key: file.id, className: "flex items-center p-2 bg-slate-100 dark:bg-slate-700 rounded-md shadow-sm" },
                    React.createElement(FileIcon, { className: "w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" }),
                    React.createElement("div", { className: "ml-3 flex-grow truncate" },
                        React.createElement("p", { className: "text-sm font-medium text-slate-800 dark:text-slate-200 truncate" }, file.name),
                        React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, formatFileSize(file.size))
                    ),
                    React.createElement("button", { type: "button", onClick: () => removeFile(file.id, false), className: "ml-2 p-1 rounded-full text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50" },
                        React.createElement(TrashIcon, { className: "w-4 h-4" })
                    )
                  )
                ))
             )
          )
        ),

        stagedFiles.length > 0 && (
          React.createElement("div", { className: "mt-4" },
             React.createElement("h4", { className: "text-sm font-medium text-slate-600 dark:text-slate-300" }, "Staged Files for Upload"),
             React.createElement("ul", { className: "mt-2 space-y-2 p-3 bg-sky-50 dark:bg-sky-900/50 rounded-md" },
                stagedFiles.map(file => (
                  React.createElement("li", { key: file.id, className: "flex items-center p-2 bg-white dark:bg-slate-700 rounded-md shadow-sm" },
                    React.createElement(FileIcon, { className: "w-5 h-5 text-sky-500 flex-shrink-0" }),
                    React.createElement("div", { className: "ml-3 flex-grow truncate" },
                        React.createElement("p", { className: "text-sm font-medium text-slate-800 dark:text-slate-200 truncate" }, file.name),
                        React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, formatFileSize(file.size))
                    ),
                    React.createElement("button", { type: "button", onClick: () => removeFile(file.id, true), className: "ml-2 p-1 rounded-full text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50" },
                        React.createElement(TrashIcon, { className: "w-4 h-4" })
                    )
                  )
                ))
             )
          )
        )
      )
    )
  );
};

export default ContactForm;
