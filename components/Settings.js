









import React, { useState } from 'react';
import { ArrowLeftIcon, TrashIcon, PlusIcon, DownloadIcon, UploadIcon, UserCircleIcon, EditIcon, CalendarIcon, ChevronDownIcon } from './icons.js';
import { saveJsonFile, fileToDataUrl, generateICSContent, downloadICSFile } from '../utils.js';
import { getAllFiles } from '../db.js';
import JobTemplateModal from './JobTemplateModal.js';
import { ALL_JOB_STATUSES, DEFAULT_ON_MY_WAY_TEMPLATE } from '../types.js';

const SettingsSection = ({ title, subtitle, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
      React.createElement("div", { className: "border-t dark:border-slate-700" },
          React.createElement("button", {
              onClick: () => setIsOpen(!isOpen),
              className: "w-full flex items-center justify-between py-4 text-left focus:outline-none group"
          },
              React.createElement("div", null,
                  React.createElement("h3", { className: "text-lg font-semibold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" }, title),
                  subtitle && React.createElement("p", { className: "mt-1 text-sm text-slate-500 dark:text-slate-400" }, subtitle)
              ),
              React.createElement("div", { className: `transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}` },
                   React.createElement(ChevronDownIcon, { className: "w-5 h-5 text-slate-400 group-hover:text-sky-500" })
              )
          ),
          isOpen && (
              React.createElement("div", { className: "pb-6 animate-fadeIn" },
                  children
              )
          )
      )
    );
  }

const Settings = ({
    defaultFields,
    onAddDefaultField,
    onDeleteDefaultField,
    onBack,
    appStateForBackup,
    autoBackupEnabled,
    onToggleAutoBackup,
    lastAutoBackup,
    onRestoreBackup,
    businessInfo,
    onUpdateBusinessInfo,
    emailSettings,
    onUpdateEmailSettings,
    currentTheme,
    onUpdateTheme,
    jobTemplates,
    onAddJobTemplate,
    onUpdateJobTemplate,
    onDeleteJobTemplate,
    partsCatalog,
    onAddCatalogItem,
    onDeleteCatalogItem,
    enabledStatuses,
    onToggleJobStatus,
    contacts,
    autoCalendarExportEnabled,
    onToggleAutoCalendarExport,
}) => {
    const [newFieldLabel, setNewFieldLabel] = useState('');
    const [currentBusinessInfo, setCurrentBusinessInfo] = useState(businessInfo);
    const [currentEmailSettings, setCurrentEmailSettings] = useState(emailSettings);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [newCatalogItemName, setNewCatalogItemName] = useState('');
    const [newCatalogItemCost, setNewCatalogItemCost] = useState('');

    const handleDefaultFieldSubmit = (e) => {
        e.preventDefault();
        if (newFieldLabel.trim()) {
            onAddDefaultField(newFieldLabel.trim());
            setNewFieldLabel('');
        }
    };

    const handleBusinessInfoChange = (field, value) => {
        setCurrentBusinessInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleEmailSettingsChange = (type, field, value) => {
        setCurrentEmailSettings(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [field]: value
            }
        }));
    };

    const handleLogoUpload = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const dataUrl = await fileToDataUrl(e.target.files[0]);
            handleBusinessInfoChange('logoUrl', dataUrl);
        }
    };
    
    const handleBusinessInfoSubmit = (e) => {
        e.preventDefault();
        onUpdateBusinessInfo(currentBusinessInfo);
        alert('Business info saved.');
    };

    const handleEmailSettingsSubmit = (e) => {
        e.preventDefault();
        onUpdateEmailSettings(currentEmailSettings);
        onUpdateBusinessInfo(currentBusinessInfo); // Also save business info updates (for SMS template)
        alert('Settings saved.');
    };
    
    const handleManualBackup = async () => {
        try {
            const files = await getAllFiles();
            const backupData = { ...appStateForBackup, files };
            const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
            await saveJsonFile(backupData, `contacts-backup-${timestamp}.json`);
        } catch (error) {
            console.error("Failed to create backup:", error);
            alert("Could not create backup. Failed to read attachments from the database.");
        }
    };

    const handleDownloadAutoBackup = async () => {
        if (lastAutoBackup) {
            const backupData = JSON.parse(lastAutoBackup.data);
            const timestamp = new Date(lastAutoBackup.timestamp).toISOString().slice(0, 10);
            await saveJsonFile(backupData, `contacts-auto-backup-${timestamp}.json`);
        }
    };
    
    const handleFileImport = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result;
                onRestoreBackup(content);
            };
            reader.readAsText(file);
        }
        if(e.target) e.target.value = ''; // Reset input
    };
    
    const handleSaveTemplate = (templateData) => {
        if (templateData.id) {
            onUpdateJobTemplate(templateData.id, templateData);
        } else {
            onAddJobTemplate(templateData);
        }
        setIsTemplateModalOpen(false);
        setEditingTemplate(null);
    };

    const handleAddCatalogItem = (e) => {
        e.preventDefault();
        if (newCatalogItemName.trim()) {
            onAddCatalogItem({ name: newCatalogItemName.trim(), defaultCost: Number(newCatalogItemCost || 0) });
            setNewCatalogItemName('');
            setNewCatalogItemCost('');
        }
    };

    const handleExportCalendar = () => {
        const icsContent = generateICSContent(contacts);
        downloadICSFile(icsContent);
    };

    const inputStyles = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm dark:text-white";
    const labelStyles = "block text-sm font-medium text-slate-600 dark:text-slate-300";

    return (
        React.createElement("div", { className: "h-full flex flex-col bg-white dark:bg-slate-800 overflow-y-auto" },
             React.createElement("div", { className: "p-4 flex items-center border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10" },
                React.createElement("button", { onClick: onBack, className: "p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 md:hidden" },
                    React.createElement(ArrowLeftIcon, { className: "w-6 h-6 text-slate-600 dark:text-slate-300" })
                ),
                React.createElement("h2", { className: "ml-4 flex-grow font-bold text-lg text-slate-700 dark:text-slate-200" }, "Settings"),
                React.createElement("button", { type: "button", onClick: onBack, className: "hidden md:inline px-4 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" }, "Back")
            ),
            React.createElement("div", { className: "px-4 sm:px-6 py-6 flex-grow" },
                React.createElement("div", { className: "mb-8" },
                    React.createElement("h3", { className: "text-xl font-semibold text-slate-800 dark:text-slate-100" }, "Appearance"),
                    React.createElement("p", { className: "mt-1 text-sm text-slate-500 dark:text-slate-400" }, "Choose how the app looks."),
                    React.createElement("div", { className: "mt-6 flex space-x-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg" },
                        ['Light', 'Dark', 'System'].map(themeOption => (
                            React.createElement("button", {
                                key: themeOption,
                                onClick: () => onUpdateTheme(themeOption.toLowerCase()),
                                className: `flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${currentTheme === themeOption.toLowerCase() ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`
                            }, themeOption)
                        ))
                    )
                ),

                React.createElement(SettingsSection, { title: "Business Information", subtitle: "This info will appear on your estimates and receipts." },
                    React.createElement("form", { onSubmit: handleBusinessInfoSubmit },
                        React.createElement("div", { className: "mt-2 space-y-4" },
                            React.createElement("div", { className: "flex items-center space-x-4" },
                                React.createElement("div", { className: "w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center" },
                                    currentBusinessInfo.logoUrl ? (
                                        React.createElement("img", { src: currentBusinessInfo.logoUrl, alt: "Business Logo", className: "w-full h-full object-contain rounded-full" })
                                    ) : (
                                        React.createElement(UserCircleIcon, { className: "w-16 h-16 text-slate-400 dark:text-slate-500" })
                                    )
                                ),
                                React.createElement("label", { htmlFor: "logo-upload", className: "cursor-pointer text-sm font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/50 hover:bg-sky-100 dark:hover:bg-sky-900 px-3 py-2 rounded-md" },
                                    "Change Logo",
                                    React.createElement("input", { id: "logo-upload", type: "file", accept: "image/*", className: "hidden", onChange: handleLogoUpload })
                                )
                            ),
                            React.createElement("div", null,
                                React.createElement("label", { htmlFor: "business-name", className: labelStyles }, "Company Name"),
                                React.createElement("input", { type: "text", id: "business-name", value: currentBusinessInfo.name, onChange: e => handleBusinessInfoChange('name', e.target.value), className: inputStyles })
                            ),
                            React.createElement("div", null,
                                React.createElement("label", { htmlFor: "business-phone", className: labelStyles }, "Phone"),
                                React.createElement("input", { type: "tel", id: "business-phone", value: currentBusinessInfo.phone, onChange: e => handleBusinessInfoChange('phone', e.target.value), className: inputStyles })
                            ),
                            React.createElement("div", null,
                                React.createElement("label", { htmlFor: "business-email", className: labelStyles }, "Email"),
                                React.createElement("input", { type: "email", id: "business-email", value: currentBusinessInfo.email, onChange: e => handleBusinessInfoChange('email', e.target.value), className: inputStyles })
                            ),
                            React.createElement("div", null,
                                React.createElement("label", { htmlFor: "business-address", className: labelStyles }, "Address"),
                                React.createElement("textarea", { id: "business-address", value: currentBusinessInfo.address, onChange: e => handleBusinessInfoChange('address', e.target.value), rows: 3, className: inputStyles })
                            ),
                            React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4" },
                                React.createElement("div", null,
                                    React.createElement("label", { htmlFor: "default-tax", className: labelStyles }, "Default Sales Tax (%)"),
                                    React.createElement("input", { 
                                        type: "number", 
                                        id: "default-tax", 
                                        value: currentBusinessInfo.defaultSalesTaxRate || '', 
                                        onChange: e => handleBusinessInfoChange('defaultSalesTaxRate', parseFloat(e.target.value)), 
                                        step: "0.01",
                                        className: inputStyles,
                                        placeholder: "0.00"
                                    })
                                ),
                                React.createElement("div", null,
                                    React.createElement("label", { htmlFor: "default-fee", className: labelStyles }, "Default Card Fee (%)"),
                                    React.createElement("input", { 
                                        type: "number", 
                                        id: "default-fee", 
                                        value: currentBusinessInfo.defaultProcessingFeeRate || '', 
                                        onChange: e => handleBusinessInfoChange('defaultProcessingFeeRate', parseFloat(e.target.value)), 
                                        step: "0.01",
                                        className: inputStyles,
                                        placeholder: "0.00"
                                    })
                                )
                            )
                        ),
                        React.createElement("button", { type: "submit", className: "mt-4 px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors" }, "Save Business Info")
                    )
                ),

                 React.createElement(SettingsSection, { title: "Communication Templates", subtitle: "Configure default messages for SMS and Emails." },
                    React.createElement("form", { onSubmit: handleEmailSettingsSubmit },
                        React.createElement("div", { className: "mt-2 space-y-6" },
                             React.createElement("div", null,
                                React.createElement("h4", { className: "font-medium text-slate-700 dark:text-slate-200 mb-3" }, "\"On My Way\" SMS"),
                                React.createElement("div", null,
                                    React.createElement("label", { className: labelStyles }, "Message Body"),
                                    React.createElement("textarea", { 
                                        value: currentBusinessInfo.onMyWayTemplate || DEFAULT_ON_MY_WAY_TEMPLATE,
                                        onChange: e => handleBusinessInfoChange('onMyWayTemplate', e.target.value),
                                        rows: 3,
                                        className: inputStyles 
                                    })
                                )
                            ),
                            React.createElement("div", null,
                                React.createElement("h4", { className: "font-medium text-slate-700 dark:text-slate-200 mb-3" }, "Estimate Email"),
                                React.createElement("div", { className: "space-y-3" },
                                    React.createElement("div", null,
                                        React.createElement("label", { className: labelStyles }, "Subject"),
                                        React.createElement("input", { type: "text", value: currentEmailSettings.estimate.subject, onChange: e => handleEmailSettingsChange('estimate', 'subject', e.target.value), className: inputStyles })
                                    ),
                                    React.createElement("div", null,
                                        React.createElement("label", { className: labelStyles }, "Body"),
                                        React.createElement("textarea", { value: currentEmailSettings.estimate.body, onChange: e => handleEmailSettingsChange('estimate', 'body', e.target.value), rows: 4, className: inputStyles })
                                    )
                                )
                            ),

                            React.createElement("div", null,
                                React.createElement("h4", { className: "font-medium text-slate-700 dark:text-slate-200 mb-3" }, "Receipt Email"),
                                React.createElement("div", { className: "space-y-3" },
                                    React.createElement("div", null,
                                        React.createElement("label", { className: labelStyles }, "Subject"),
                                        React.createElement("input", { type: "text", value: currentEmailSettings.receipt.subject, onChange: e => handleEmailSettingsChange('receipt', 'subject', e.target.value), className: inputStyles })
                                    ),
                                    React.createElement("div", null,
                                        React.createElement("label", { className: labelStyles }, "Body"),
                                        React.createElement("textarea", { value: currentEmailSettings.receipt.body, onChange: e => handleEmailSettingsChange('receipt', 'body', e.target.value), rows: 4, className: inputStyles })
                                    )
                                )
                            )
                        ),
                        React.createElement("button", { type: "submit", className: "mt-4 px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors" }, "Save Templates")
                    )
                ),

                 React.createElement(SettingsSection, { title: "Job Status Visibility", subtitle: "Choose which statuses appear in the dropdown menu." },
                    React.createElement("div", { className: "mt-2 space-y-3" },
                         ALL_JOB_STATUSES.map((status) => (
                            React.createElement("div", { key: status, className: "flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg" },
                                React.createElement("span", { className: "font-medium text-slate-700 dark:text-slate-200" }, status),
                                React.createElement("button", {
                                    onClick: () => onToggleJobStatus(status, !enabledStatuses[status]),
                                    className: `relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 ${enabledStatuses[status] ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-600'}`
                                },
                                    React.createElement("span", { className: `inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${enabledStatuses[status] ? 'translate-x-5' : 'translate-x-0'}` })
                                )
                            )
                         ))
                    )
                ),

                React.createElement(SettingsSection, { title: "Manage Default Fields", subtitle: "These fields will be automatically added to any new contact." },
                    React.createElement("form", { onSubmit: handleDefaultFieldSubmit, className: "mt-2 flex space-x-2" },
                        React.createElement("input", { type: "text", value: newFieldLabel, onChange: (e) => setNewFieldLabel(e.target.value), placeholder: "e.g. Birthday", className: "flex-grow block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" }),
                        React.createElement("button", { type: "submit", className: "inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors" }, React.createElement(PlusIcon, { className: "w-5 h-5" }))
                    ),
                    React.createElement("div", { className: "mt-6 border-t dark:border-slate-700 pt-4" },
                        defaultFields.length > 0 ? React.createElement("ul", { className: "space-y-2" },
                            defaultFields.map(field => React.createElement("li", { key: field.id, className: "flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg" },
                                React.createElement("span", { className: "font-medium text-slate-700 dark:text-slate-200" }, field.label),
                                React.createElement("button", { onClick: () => onDeleteDefaultField(field.id), className: "p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors", "aria-label": `Delete ${field.label} field` }, React.createElement(TrashIcon, { className: "w-5 h-5" }))
                            ))
                        ) : React.createElement("p", { className: "text-center text-slate-500 dark:text-slate-400 p-4" }, "No default fields have been set.")
                    )
                ),

                React.createElement(SettingsSection, { title: "Manage Job Templates", subtitle: "Create reusable templates for common jobs to save time." },
                    React.createElement("div", { className: "mt-2" },
                        React.createElement("button", { type: "button", onClick: () => { setEditingTemplate(null); setIsTemplateModalOpen(true); }, className: "inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors" },
                            React.createElement(PlusIcon, { className: "w-5 h-5 mr-2" }), "Create New Template"
                        )
                    ),
                    React.createElement("div", { className: "mt-4 border-t dark:border-slate-700 pt-4" },
                        jobTemplates.length > 0 ? React.createElement("ul", { className: "space-y-2" },
                            jobTemplates.map(template => React.createElement("li", { key: template.id, className: "flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg" },
                                React.createElement("span", { className: "font-medium text-slate-700 dark:text-slate-200" }, template.name),
                                React.createElement("div", { className: "flex items-center space-x-2" },
                                    React.createElement("button", { onClick: () => { setEditingTemplate(template); setIsTemplateModalOpen(true); }, className: "p-2 text-slate-500 dark:text-slate-400 hover:text-sky-600 hover:bg-sky-100 dark:hover:bg-sky-900/50 rounded-full transition-colors", "aria-label": `Edit ${template.name} template` }, React.createElement(EditIcon, { className: "w-5 h-5" })),
                                    React.createElement("button", { onClick: () => onDeleteJobTemplate(template.id), className: "p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors", "aria-label": `Delete ${template.name} template` }, React.createElement(TrashIcon, { className: "w-5 h-5" }))
                                )
                            ))
                        ) : React.createElement("p", { className: "text-center text-slate-500 dark:text-slate-400 p-4" }, "No job templates have been created.")
                    )
                ),

                React.createElement(SettingsSection, { title: "Parts Catalog", subtitle: "Manage common parts and services for quick addition to job tickets." },
                    React.createElement("form", { onSubmit: handleAddCatalogItem, className: "mt-2 flex gap-2 items-end" },
                        React.createElement("div", { className: "flex-grow" },
                            React.createElement("label", { className: "block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1" }, "Item Name"),
                            React.createElement("input", {
                                type: "text",
                                value: newCatalogItemName,
                                onChange: (e) => setNewCatalogItemName(e.target.value),
                                placeholder: "e.g. Torsion Spring",
                                className: inputStyles
                            })
                        ),
                        React.createElement("div", { className: "w-32" },
                            React.createElement("label", { className: "block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1" }, "Default Cost"),
                            React.createElement("div", { className: "relative" },
                                React.createElement("div", { className: "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3" }, React.createElement("span", { className: "text-slate-500 sm:text-sm" }, "$")),
                                React.createElement("input", {
                                    type: "number",
                                    value: newCatalogItemCost,
                                    onChange: (e) => setNewCatalogItemCost(e.target.value === '' ? '' : parseFloat(e.target.value)),
                                    placeholder: "0.00",
                                    className: `${inputStyles} pl-7`
                                })
                            )
                        ),
                        React.createElement("button", { type: "submit", className: "mb-[2px] inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors" },
                            React.createElement(PlusIcon, { className: "w-5 h-5" })
                        )
                    ),
                    React.createElement("div", { className: "mt-6 border-t dark:border-slate-700 pt-4" },
                        partsCatalog && partsCatalog.length > 0 ? (
                            React.createElement("ul", { className: "space-y-2" },
                                partsCatalog.map(item => (
                                    React.createElement("li", { key: item.id, className: "flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg" },
                                        React.createElement("div", null,
                                            React.createElement("span", { className: "font-medium text-slate-700 dark:text-slate-200" }, item.name),
                                            React.createElement("span", { className: "ml-2 text-sm text-slate-500 dark:text-slate-400" }, `$${item.defaultCost.toFixed(2)}`)
                                        ),
                                        React.createElement("button", {
                                            onClick: () => onDeleteCatalogItem(item.id),
                                            className: "p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors"
                                        },
                                            React.createElement(TrashIcon, { className: "w-5 h-5" })
                                        )
                                    )
                                ))
                            )
                        ) : (
                            React.createElement("p", { className: "text-center text-slate-500 dark:text-slate-400 p-4" }, "No items in catalog.")
                        )
                    )
                ),

                 React.createElement("div", { className: "mt-8 border-t dark:border-slate-700 pt-6" },
                    React.createElement("h3", { className: "text-xl font-semibold text-slate-800 dark:text-slate-100" }, "Calendar Integration"),
                    React.createElement("p", { className: "mt-1 text-sm text-slate-500 dark:text-slate-400" }, "Export your jobs to an external calendar."),
                    React.createElement("div", { className: "mt-6 space-y-3" },
                        React.createElement("div", { className: "flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg" },
                            React.createElement("div", null,
                                React.createElement("p", { className: "font-medium text-slate-700 dark:text-slate-200" }, "Auto-Export .ics on Change"),
                                React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, "Automatically prompt to download an updated .ics file when you add, edit, or delete jobs.")
                            ),
                            React.createElement("button", {
                                onClick: () => onToggleAutoCalendarExport(!autoCalendarExportEnabled),
                                className: `relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 ${autoCalendarExportEnabled ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-600'}`
                            },
                                React.createElement("span", { className: `inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${autoCalendarExportEnabled ? 'translate-x-5' : 'translate-x-0'}` })
                            )
                        ),
                         React.createElement("div", { className: "flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg" },
                            React.createElement("div", null,
                                React.createElement("p", { className: "font-medium text-slate-700 dark:text-slate-200" }, "Manual Export"),
                                React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, "Download an .ics file to import into Google Calendar, Outlook, etc.")
                            ),
                            React.createElement("button", { onClick: handleExportCalendar, className: "inline-flex items-center justify-center whitespace-nowrap flex-shrink-0 space-x-2 px-3 py-2 rounded-md text-sm font-medium text-sky-600 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/50 hover:bg-sky-200 dark:hover:bg-sky-900 transition-colors" },
                                React.createElement(CalendarIcon, { className: "w-4 h-4" }),
                                React.createElement("span", null, "Export .ics")
                            )
                        )
                    )
                ),

                React.createElement("div", { className: "mt-8 border-t dark:border-slate-700 pt-6" },
                    React.createElement("h3", { className: "text-xl font-semibold text-slate-800 dark:text-slate-100" }, "Backup & Restore"),
                    React.createElement("p", { className: "mt-1 text-sm text-slate-500 dark:text-slate-400" }, "Manage your application data. Backups include all contacts, custom fields, and work logs."),
                    React.createElement("div", { className: "mt-6 space-y-3" },
                        React.createElement("div", { className: "flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg" },
                            React.createElement("div", null,
                                React.createElement("p", { className: "font-medium text-slate-700 dark:text-slate-200" }, "Manual Backup"),
                                React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, "Download all your data to a single file.")
                            ),
                            React.createElement("button", { onClick: handleManualBackup, className: "inline-flex items-center justify-center whitespace-nowrap flex-shrink-0 space-x-2 px-3 py-2 rounded-md text-sm font-medium text-sky-600 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/50 hover:bg-sky-200 dark:hover:bg-sky-900 transition-colors" },
                                React.createElement(DownloadIcon, { className: "w-4 h-4" }), React.createElement("span", null, "Backup Now")
                            )
                        ),
                        React.createElement("div", { className: "flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg" },
                            React.createElement("div", null,
                                React.createElement("p", { className: "font-medium text-slate-700 dark:text-slate-200" }, "Restore from Backup"),
                                React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, "Import data from a backup file.")
                            ),
                            React.createElement("label", { htmlFor: "backup-upload", className: "cursor-pointer inline-flex items-center justify-center whitespace-nowrap flex-shrink-0 space-x-2 px-3 py-2 rounded-md text-sm font-medium text-sky-600 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/50 hover:bg-sky-200 dark:hover:bg-sky-900 transition-colors" },
                                React.createElement(UploadIcon, { className: "w-4 h-4" }), React.createElement("span", null, "Import Backup"),
                                React.createElement("input", { id: "backup-upload", type: "file", accept: ".json", className: "hidden", onChange: handleFileImport })
                            )
                        ),
                        React.createElement("div", { className: "flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg" },
                            React.createElement("div", null,
                                React.createElement("p", { className: "font-medium text-slate-700 dark:text-slate-200" }, "Automatic Backups"),
                                React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, "Automatically save a backup when data changes.")
                            ),
                            React.createElement("button", { onClick: () => onToggleAutoBackup(!autoBackupEnabled), className: `relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 ${autoBackupEnabled ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-600'}` },
                                React.createElement("span", { className: `inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${autoBackupEnabled ? 'translate-x-5' : 'translate-x-0'}` })
                            )
                        ),
                        autoBackupEnabled && lastAutoBackup && React.createElement("div", { className: "flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg" },
                            React.createElement("div", null,
                                React.createElement("p", { className: "font-medium text-slate-700 dark:text-slate-200" }, "Last Automatic Backup"),
                                React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, new Date(lastAutoBackup.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }))
                            ),
                            React.createElement("button", { onClick: handleDownloadAutoBackup, className: "inline-flex items-center justify-center whitespace-nowrap flex-shrink-0 space-x-2 px-3 py-2 rounded-md text-sm font-medium text-sky-600 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/50 hover:bg-sky-200 dark:hover:bg-sky-900 transition-colors" },
                                React.createElement(DownloadIcon, { className: "w-4 h-4" }), React.createElement("span", null, "Download")
                            )
                        )
                    )
                )
            ),
            isTemplateModalOpen && React.createElement(JobTemplateModal, { template: editingTemplate, onSave: handleSaveTemplate, onClose: () => { setIsTemplateModalOpen(false); setEditingTemplate(null); } })
        )
    );
};

export default Settings;