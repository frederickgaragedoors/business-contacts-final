








import React, { useState, useCallback } from 'react';
import { UserCircleIcon, XIcon, ArrowLeftIcon, FileIcon, TrashIcon, PlusIcon } from './icons.js';
import { fileToDataUrl, formatFileSize, generateId } from '../utils.js';

const ContactForm = ({ initialContact, onSave, onCancel, defaultFields, initialJobDate }) => {
  const [name, setName] = useState(initialContact?.name || '');
  const [email, setEmail] = useState(initialContact?.email || '');
  const [phone, setPhone] = useState(initialContact?.phone || '');
  const [address, setAddress] = useState(initialContact?.address || '');
  const [photoUrl, setPhotoUrl] = useState(initialContact?.photoUrl || '');
  const [files, setFiles] = useState(initialContact?.files || []);
  const [customFields, setCustomFields] = useState(
    initialContact?.customFields || defaultFields?.map(df => ({ id: generateId(), label: df.label, value: '' })) || []
  );
  
  const [doorProfiles, setDoorProfiles] = useState(() => {
      if (initialContact?.doorProfiles) {
          return initialContact.doorProfiles.map(p => ({
              ...p,
              doorInstallDate: p.doorInstallDate || p.installDate || 'Unknown',
              springInstallDate: p.springInstallDate || p.installDate || 'Unknown',
              openerInstallDate: p.openerInstallDate || p.installDate || 'Unknown',
          }));
      }
      if (initialContact?.doorProfile) {
          const oldP = initialContact.doorProfile;
          return [{ 
              ...oldP, 
              id: generateId(),
              doorInstallDate: oldP.installDate || 'Unknown',
              springInstallDate: oldP.installDate || 'Unknown',
              openerInstallDate: oldP.installDate || 'Unknown'
            }];
      }
      return [{
        id: generateId(),
        dimensions: '',
        doorType: '',
        springSystem: '',
        springSize: '',
        openerBrand: '',
        openerModel: '',
        doorInstallDate: 'Unknown',
        springInstallDate: 'Unknown',
        openerInstallDate: 'Unknown'
      }];
  });

  const [stagedFiles, setStagedFiles] = useState([]);

  const handlePhotoChange = useCallback(async (e) => {
    const input = e.target;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      try {
        const dataUrl = await fileToDataUrl(file);
        setPhotoUrl(dataUrl);
      } catch (error) {
        console.error("Error reading photo:", error);
        alert("There was an error processing the photo. It might be too large or corrupted.");
      }
    }
    if (input) input.value = '';
  }, []);

  const handleFilesChange = useCallback(async (e) => {
    const input = e.target;
    if (input.files) {
      try {
        const newFilesPromises = Array.from(input.files).map(async (file) => {
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
      } catch (error) {
        console.error("Error reading files:", error);
        alert("There was an error processing your files. They might be too large or corrupted.");
      }
      if (input) input.value = '';
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
  
  const handleDoorProfileChange = (id, field, value) => {
    setDoorProfiles(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };
  
  const addDoorProfile = () => {
      setDoorProfiles(prev => [...prev, {
        id: generateId(),
        dimensions: '',
        doorType: '',
        springSystem: '',
        springSize: '',
        openerBrand: '',
        openerModel: '',
        doorInstallDate: 'Unknown',
        springInstallDate: 'Unknown',
        openerInstallDate: 'Unknown'
      }]);
  };

  const removeDoorProfile = (id) => {
      setDoorProfiles(prev => prev.filter(p => p.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalFiles = [...files, ...stagedFiles];
    
    let initialJobTickets = initialContact?.jobTickets || [];
    
    if (initialJobDate && !initialContact) {
        initialJobTickets = [{
            id: generateId(),
            date: initialJobDate,
            status: 'Estimate Scheduled',
            notes: '',
            parts: [],
            laborCost: 0,
            createdAt: new Date().toISOString()
        }];
    }
    
    // Filter empty door profiles
    const finalDoorProfiles = doorProfiles.filter(p => 
        p.dimensions || p.doorType || p.springSystem || p.openerBrand || p.openerModel
    );

    onSave({ 
        name, 
        email, 
        phone, 
        address, 
        photoUrl, 
        files: finalFiles, 
        customFields, 
        jobTickets: initialJobTickets,
        doorProfiles: finalDoorProfiles
    });
  };
  
  const inputStyles = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm dark:text-white";
  const labelStyles = "block text-sm font-medium text-slate-600 dark:text-slate-300";
  const profileLabelClass = "block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1";

  const renderDateInput = (label, profileId, field, value) => {
      const isDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
      const selectValue = isDate ? 'date' : (value === 'Original' ? 'Original' : 'Unknown');

      const handleSelectChange = (e) => {
          const selection = e.target.value;
          if (selection === 'date') {
              handleDoorProfileChange(profileId, field, new Date().toISOString().split('T')[0]);
          } else {
              handleDoorProfileChange(profileId, field, selection);
          }
      };

      return (
          React.createElement("div", null,
              React.createElement("label", { className: profileLabelClass }, label),
              React.createElement("div", { className: "flex space-x-2" },
                  React.createElement("select", { value: selectValue, onChange: handleSelectChange, className: `${inputStyles} w-1/2` },
                      React.createElement("option", { value: "Unknown" }, "Unknown"),
                      React.createElement("option", { value: "Original" }, "Original"),
                      React.createElement("option", { value: "date" }, "Specific Date")
                  ),
                  isDate && (
                      React.createElement("input", {
                        type: "date",
                        value: value,
                        onChange: e => handleDoorProfileChange(profileId, field, e.target.value),
                        className: `${inputStyles} w-1/2`
                      })
                  )
              )
          )
      );
  };

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
      
      initialJobDate && !initialContact && (
        React.createElement("div", { className: "px-4 sm:px-6 pt-6" },
            React.createElement("div", { className: "bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-md p-3 text-sm text-sky-800 dark:text-sky-200" },
                "This new contact will be automatically scheduled for a job on ",
                React.createElement("strong", null, new Date(initialJobDate).toLocaleDateString()),
                "."
            )
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
        
        /* Door/System Profiles Section */
        React.createElement("div", { className: "mt-8 border-t dark:border-slate-700 pt-6" },
            React.createElement("div", { className: "flex items-center justify-between mb-4" },
                 React.createElement("h3", { className: "text-lg font-medium text-slate-800 dark:text-slate-100" }, "Door/System Profiles")
            ),
            React.createElement("div", { className: "space-y-6" },
                doorProfiles.map((profile, index) => (
                    React.createElement("div", { key: profile.id, className: "relative p-4 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-lg" },
                        React.createElement("div", { className: "flex justify-between items-center mb-4" },
                             React.createElement("h4", { className: "text-sm font-bold text-slate-700 dark:text-slate-200" },
                                doorProfiles.length > 1 ? `Door System #${index + 1}` : 'Primary Door System'
                             ),
                             React.createElement("button", { 
                                type: "button", 
                                onClick: () => removeDoorProfile(profile.id), 
                                className: "text-slate-400 hover:text-red-500 transition-colors",
                                title: "Remove this profile"
                             },
                                React.createElement(TrashIcon, { className: "w-5 h-5" })
                             )
                        ),
                        
                        // Door Details
                        React.createElement("div", { className: "mb-4 pb-4 border-b border-slate-200 dark:border-slate-600" },
                            React.createElement("h5", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3" }, "Door Details"),
                            React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4" },
                                React.createElement("div", null,
                                    React.createElement("label", { className: profileLabelClass }, "Dimensions (WxH)"),
                                    React.createElement("input", { type: "text", placeholder: "e.g. 16x7", value: profile.dimensions, onChange: e => handleDoorProfileChange(profile.id, 'dimensions', e.target.value), className: inputStyles })
                                ),
                                React.createElement("div", null,
                                    React.createElement("label", { className: profileLabelClass }, "Door Type"),
                                    React.createElement("select", { value: profile.doorType, onChange: e => handleDoorProfileChange(profile.id, 'doorType', e.target.value), className: inputStyles },
                                        React.createElement("option", { value: "" }, "Select Type..."),
                                        React.createElement("option", { value: "Sectional" }, "Sectional"),
                                        React.createElement("option", { value: "One-piece" }, "One-piece"),
                                        React.createElement("option", { value: "Rolling Steel" }, "Rolling Steel"),
                                        React.createElement("option", { value: "Other" }, "Other")
                                    )
                                ),
                                React.createElement("div", { className: "sm:col-span-2" },
                                    renderDateInput("Door Install Date", profile.id, 'doorInstallDate', profile.doorInstallDate)
                                )
                            )
                        ),

                        // Spring Details
                        React.createElement("div", { className: "mb-4 pb-4 border-b border-slate-200 dark:border-slate-600" },
                            React.createElement("h5", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3" }, "Spring Details"),
                            React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4" },
                                React.createElement("div", null,
                                    React.createElement("label", { className: profileLabelClass }, "Spring System"),
                                    React.createElement("select", { value: profile.springSystem, onChange: e => handleDoorProfileChange(profile.id, 'springSystem', e.target.value), className: inputStyles },
                                        React.createElement("option", { value: "" }, "Select System..."),
                                        React.createElement("option", { value: "Torsion" }, "Torsion"),
                                        React.createElement("option", { value: "Extension" }, "Extension"),
                                        React.createElement("option", { value: "TorqueMaster" }, "TorqueMaster"),
                                        React.createElement("option", { value: "Other" }, "Other")
                                    )
                                ),
                                React.createElement("div", null,
                                     React.createElement("label", { className: profileLabelClass }, "Spring Size"),
                                     React.createElement("input", { type: "text", placeholder: "e.g. .250 x 2 x 32", value: profile.springSize || '', onChange: e => handleDoorProfileChange(profile.id, 'springSize', e.target.value), className: inputStyles })
                                ),
                                React.createElement("div", { className: "sm:col-span-2" },
                                     renderDateInput("Spring Install Date", profile.id, 'springInstallDate', profile.springInstallDate)
                                )
                            )
                        ),

                        // Opener Details
                        React.createElement("div", null,
                            React.createElement("h5", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3" }, "Opener Details"),
                            React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4" },
                                React.createElement("div", null,
                                    React.createElement("label", { className: profileLabelClass }, "Opener Brand"),
                                    React.createElement("input", { type: "text", placeholder: "e.g. LiftMaster", value: profile.openerBrand, onChange: e => handleDoorProfileChange(profile.id, 'openerBrand', e.target.value), className: inputStyles })
                                ),
                                React.createElement("div", null,
                                    React.createElement("label", { className: profileLabelClass }, "Opener Model"),
                                    React.createElement("input", { type: "text", placeholder: "e.g. 8550W", value: profile.openerModel, onChange: e => handleDoorProfileChange(profile.id, 'openerModel', e.target.value), className: inputStyles })
                                ),
                                React.createElement("div", { className: "sm:col-span-2" },
                                     renderDateInput("Opener Install Date", profile.id, 'openerInstallDate', profile.openerInstallDate)
                                )
                            )
                        )
                    )
                ))
            ),
            React.createElement("button", { type: "button", onClick: addDoorProfile, className: "mt-4 w-full flex justify-center items-center px-4 py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" },
                React.createElement(PlusIcon, { className: "w-4 h-4 mr-2" }), " Add Another Door"
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
                  React.createElement("li", { key: file.id, className: "grid grid-cols-[auto_1fr_auto] items-center gap-x-3 p-2 bg-slate-100 dark:bg-slate-700 rounded-md shadow-sm" },
                    React.createElement(FileIcon, { className: "w-5 h-5 text-slate-500 dark:text-slate-400" },),
                    React.createElement("div", { className: "min-w-0" },
                        React.createElement("p", { className: "text-sm font-medium text-slate-800 dark:text-slate-200 truncate" }, file.name),
                        React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, formatFileSize(file.size))
                    ),
                    React.createElement("button", { type: "button", onClick: () => removeFile(file.id, false), className: "p-1 rounded-full text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50" },
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
                  React.createElement("li", { key: file.id, className: "grid grid-cols-[auto_1fr_auto] items-center gap-x-3 p-2 bg-white dark:bg-slate-700 rounded-md shadow-sm" },
                    React.createElement(FileIcon, { className: "w-5 h-5 text-sky-500" }),
                    React.createElement("div", { className: "min-w-0" },
                        React.createElement("p", { className: "text-sm font-medium text-slate-800 dark:text-slate-200 truncate" }, file.name),
                        React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, formatFileSize(file.size))
                    ),
                    React.createElement("button", { type: "button", onClick: () => removeFile(file.id, true), className: "p-1 rounded-full text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50" },
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