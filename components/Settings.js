import React, { useState } from 'react';
import { ArrowLeftIcon, TrashIcon, PlusIcon, DownloadIcon, UploadIcon } from './icons.js';
import { downloadJsonFile } from '../utils.js';

const Settings = ({
    defaultFields,
    onAddDefaultField,
    onDeleteDefaultField,
    onBack,
    appStateForBackup,
    autoBackupEnabled,
    onToggleAutoBackup,
    lastAutoBackup,
    onRestoreBackup
}) => {
    const [newFieldLabel, setNewFieldLabel] = useState('');

    const handleDefaultFieldSubmit = (e) => {
        e.preventDefault();
        if (newFieldLabel.trim()) {
            onAddDefaultField(newFieldLabel.trim());
            setNewFieldLabel('');
        }
    };
    
    const handleManualBackup = () => {
        const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        downloadJsonFile(appStateForBackup, `contacts-backup-${timestamp}.json`);
    };

    const handleDownloadAutoBackup = () => {
        if (lastAutoBackup) {
            const backupData = JSON.parse(lastAutoBackup.data);
            const timestamp = new Date(lastAutoBackup.timestamp).toISOString().slice(0, 10);
            downloadJsonFile(backupData, `contacts-auto-backup-${timestamp}.json`);
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

    return (
        React.createElement("div", { className: "h-full flex flex-col bg-white overflow-y-auto" },
             React.createElement("div", { className: "p-4 flex items-center border-b border-slate-200 sticky top-0 bg-white z-10" },
                React.createElement("button", { onClick: onBack, className: "p-2 rounded-full hover:bg-slate-100 md:hidden" },
                    React.createElement(ArrowLeftIcon, { className: "w-6 h-6 text-slate-600" })
                ),
                React.createElement("h2", { className: "ml-4 flex-grow font-bold text-lg text-slate-700" },
                  "Settings"
                ),
                React.createElement("button", { type: "button", onClick: onBack, className: "hidden md:inline px-4 py-2 rounded-md text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors" }, "Back to Contacts")
            ),
            React.createElement("div", { className: "p-6 flex-grow" },
                React.createElement("div", null,
                    React.createElement("h3", { className: "text-xl font-semibold text-slate-800" }, "Manage Default Fields"),
                    React.createElement("p", { className: "mt-1 text-sm text-slate-500" }, "These fields will be automatically added to any new contact you create."),
                    React.createElement("form", { onSubmit: handleDefaultFieldSubmit, className: "mt-6 flex space-x-2" },
                        React.createElement("input", {
                            type: "text",
                            value: newFieldLabel,
                            onChange: (e) => setNewFieldLabel(e.target.value),
                            placeholder: "e.g. Birthday",
                            className: "flex-grow block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                        }),
                        React.createElement("button", { type: "submit", className: "inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors" },
                            React.createElement(PlusIcon, { className: "w-5 h-5" })
                        )
                    ),
                    React.createElement("div", { className: "mt-6 border-t pt-4" },
                        defaultFields.length > 0 ? (
                            React.createElement("ul", { className: "space-y-2" },
                                defaultFields.map(field => (
                                    React.createElement("li", { key: field.id, className: "flex items-center justify-between p-3 bg-slate-50 rounded-lg" },
                                        React.createElement("span", { className: "font-medium text-slate-700" }, field.label),
                                        React.createElement("button", {
                                            onClick: () => onDeleteDefaultField(field.id),
                                            className: "p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors",
                                            "aria-label": `Delete ${field.label} field`
                                        },
                                            React.createElement(TrashIcon, { className: "w-5 h-5" })
                                        )
                                    )
                                ))
                            )
                        ) : (
                            React.createElement("p", { className: "text-center text-slate-500 p-4" }, "No default fields have been set.")
                        )
                    )
                ),
                React.createElement("div", { className: "mt-8 border-t pt-6" },
                    React.createElement("h3", { className: "text-xl font-semibold text-slate-800" }, "Backup & Restore"),
                    React.createElement("p", { className: "mt-1 text-sm text-slate-500" }, "Manage your application data. Backups include all contacts, custom fields, and work logs."),
                    React.createElement("div", { className: "mt-6 space-y-3" },
                         React.createElement("div", { className: "flex items-center justify-between p-3 bg-slate-50 rounded-lg" },
                            React.createElement("div", null,
                                React.createElement("p", { className: "font-medium text-slate-700" }, "Manual Backup"),
                                React.createElement("p", { className: "text-xs text-slate-500" }, "Download all your data to a single file.")
                            ),
                            React.createElement("button", { onClick: handleManualBackup, className: "inline-flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-sky-600 bg-sky-100 hover:bg-sky-200 transition-colors" },
                                React.createElement(DownloadIcon, { className: "w-4 h-4" }),
                                React.createElement("span", null, "Backup Now")
                            )
                        ),
                        React.createElement("div", { className: "flex items-center justify-between p-3 bg-slate-50 rounded-lg" },
                            React.createElement("div", null,
                                React.createElement("p", { className: "font-medium text-slate-700" }, "Restore from Backup"),
                                React.createElement("p", { className: "text-xs text-slate-500" }, "Import data from a backup file.")
                            ),
                            React.createElement("label", { htmlFor: "backup-upload", className: "cursor-pointer inline-flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-sky-600 bg-sky-100 hover:bg-sky-200 transition-colors" },
                                React.createElement(UploadIcon, { className: "w-4 h-4" }),
                                React.createElement("span", null, "Import Backup"),
                                React.createElement("input", { id: "backup-upload", type: "file", accept: ".json", className: "hidden", onChange: handleFileImport })
                            )
                        ),
                        React.createElement("div", { className: "flex items-center justify-between p-3 bg-slate-50 rounded-lg" },
                            React.createElement("div", null,
                                React.createElement("p", { className: "font-medium text-slate-700" }, "Automatic Backups"),
                                React.createElement("p", { className: "text-xs text-slate-500" }, "Automatically save a backup when data changes.")
                            ),
                            React.createElement("button", {
                                onClick: () => onToggleAutoBackup(!autoBackupEnabled),
                                className: `relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 ${autoBackupEnabled ? 'bg-sky-500' : 'bg-slate-300'}`
                            },
                                React.createElement("span", { className: `inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${autoBackupEnabled ? 'translate-x-5' : 'translate-x-0'}` })
                            )
                        ),
                         autoBackupEnabled && lastAutoBackup && (
                            React.createElement("div", { className: "flex items-center justify-between p-3 bg-slate-50 rounded-lg" },
                                React.createElement("div", null,
                                    React.createElement("p", { className: "font-medium text-slate-700" }, "Last Automatic Backup"),
                                    React.createElement("p", { className: "text-xs text-slate-500" },
                                        new Date(lastAutoBackup.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                                    )
                                ),
                                React.createElement("button", { onClick: handleDownloadAutoBackup, className: "inline-flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-sky-600 bg-sky-100 hover:bg-sky-200 transition-colors" },
                                    React.createElement(DownloadIcon, { className: "w-4 h-4" }),
                                    React.createElement("span", null, "Download")
                                )
                            )
                        )
                    )
                )
            )
        )
    );
};

export default Settings;