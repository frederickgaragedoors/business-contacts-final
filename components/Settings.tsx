import React, { useState } from 'react';
import { DefaultFieldSetting, BusinessInfo } from '../types.ts';
import { ArrowLeftIcon, TrashIcon, PlusIcon, DownloadIcon, UploadIcon, UserCircleIcon } from './icons.tsx';
import { saveJsonFile, fileToDataUrl } from '../utils.ts';
import { getAllFiles } from '../db.ts';

interface SettingsProps {
    defaultFields: DefaultFieldSetting[];
    onAddDefaultField: (label: string) => void;
    onDeleteDefaultField: (id: string) => void;
    onBack: () => void;
    appStateForBackup: object;
    autoBackupEnabled: boolean;
    onToggleAutoBackup: (enabled: boolean) => void;
    lastAutoBackup: { timestamp: string; data: string } | null;
    onRestoreBackup: (fileContent: string) => void;
    businessInfo: BusinessInfo;
    onUpdateBusinessInfo: (info: BusinessInfo) => void;
}

const Settings: React.FC<SettingsProps> = ({
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
    onUpdateBusinessInfo
}) => {
    const [newFieldLabel, setNewFieldLabel] = useState('');
    const [currentBusinessInfo, setCurrentBusinessInfo] = useState<BusinessInfo>(businessInfo);

    const handleDefaultFieldSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newFieldLabel.trim()) {
            onAddDefaultField(newFieldLabel.trim());
            setNewFieldLabel('');
        }
    };
    
    const handleBusinessInfoChange = (field: keyof BusinessInfo, value: string) => {
        setCurrentBusinessInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const dataUrl = await fileToDataUrl(e.target.files[0]);
            handleBusinessInfoChange('logoUrl', dataUrl);
        }
    };

    const handleBusinessInfoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateBusinessInfo(currentBusinessInfo);
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
    
    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                onRestoreBackup(content);
            };
            reader.readAsText(file);
        }
        if(e.target) e.target.value = ''; // Reset input
    };

    return (
        <div className="h-full flex flex-col bg-white overflow-y-auto">
             <div className="p-4 flex items-center border-b border-slate-200 sticky top-0 bg-white z-10">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 md:hidden">
                    <ArrowLeftIcon className="w-6 h-6 text-slate-600" />
                </button>
                <h2 className="ml-4 flex-grow font-bold text-lg text-slate-700">
                  Settings
                </h2>
                <button type="button" onClick={onBack} className="hidden md:inline px-4 py-2 rounded-md text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">Back</button>
            </div>
            <div className="px-4 sm:px-6 py-6 flex-grow">
                
                <form onSubmit={handleBusinessInfoSubmit}>
                    <h3 className="text-xl font-semibold text-slate-800">Business Information</h3>
                    <p className="mt-1 text-sm text-slate-500">This info will appear on your quotes and invoices.</p>
                    <div className="mt-6 space-y-4">
                        <div className="flex items-center space-x-4">
                            <div className="w-24 h-24 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center">
                                {currentBusinessInfo.logoUrl ? (
                                    <img src={currentBusinessInfo.logoUrl} alt="Business Logo" className="w-full h-full object-contain rounded-full" />
                                ) : (
                                    <UserCircleIcon className="w-16 h-16 text-slate-400" />
                                )}
                            </div>
                            <label htmlFor="logo-upload" className="cursor-pointer text-sm font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 px-3 py-2 rounded-md">
                                Change Logo
                                <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                            </label>
                        </div>
                        <div>
                            <label htmlFor="business-name" className="block text-sm font-medium text-slate-600">Company Name</label>
                            <input type="text" id="business-name" value={currentBusinessInfo.name} onChange={e => handleBusinessInfoChange('name', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm sm:text-sm" />
                        </div>
                         <div>
                            <label htmlFor="business-phone" className="block text-sm font-medium text-slate-600">Phone</label>
                            <input type="tel" id="business-phone" value={currentBusinessInfo.phone} onChange={e => handleBusinessInfoChange('phone', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm sm:text-sm" />
                        </div>
                         <div>
                            <label htmlFor="business-email" className="block text-sm font-medium text-slate-600">Email</label>
                            <input type="email" id="business-email" value={currentBusinessInfo.email} onChange={e => handleBusinessInfoChange('email', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="business-address" className="block text-sm font-medium text-slate-600">Address</label>
                            <textarea id="business-address" value={currentBusinessInfo.address} onChange={e => handleBusinessInfoChange('address', e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm sm:text-sm"></textarea>
                        </div>
                    </div>
                     <button type="submit" className="mt-4 px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors">Save Business Info</button>
                </form>

                <div className="mt-8 border-t pt-6">
                    <h3 className="text-xl font-semibold text-slate-800">Manage Default Fields</h3>
                    <p className="mt-1 text-sm text-slate-500">These fields will be automatically added to any new contact you create.</p>

                    <form onSubmit={handleDefaultFieldSubmit} className="mt-6 flex space-x-2">
                        <input
                            type="text"
                            value={newFieldLabel}
                            onChange={(e) => setNewFieldLabel(e.target.value)}
                            placeholder="e.g. Birthday"
                            className="flex-grow block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                        />
                        <button type="submit" className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors">
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="mt-6 border-t pt-4">
                        {defaultFields.length > 0 ? (
                            <ul className="space-y-2">
                                {defaultFields.map(field => (
                                    <li key={field.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <span className="font-medium text-slate-700">{field.label}</span>
                                        <button
                                            onClick={() => onDeleteDefaultField(field.id)}
                                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                            aria-label={`Delete ${field.label} field`}
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-slate-500 p-4">No default fields have been set.</p>
                        )}
                    </div>
                </div>

                <div className="mt-8 border-t pt-6">
                    <h3 className="text-xl font-semibold text-slate-800">Backup & Restore</h3>
                    <p className="mt-1 text-sm text-slate-500">Manage your application data. Backups include all contacts, custom fields, and work logs.</p>
                    <div className="mt-6 space-y-3">
                         <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-medium text-slate-700">Manual Backup</p>
                                <p className="text-xs text-slate-500">Download all your data to a single file.</p>
                            </div>
                            <button onClick={handleManualBackup} className="inline-flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-sky-600 bg-sky-100 hover:bg-sky-200 transition-colors">
                                <DownloadIcon className="w-4 h-4" />
                                <span>Backup Now</span>
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-medium text-slate-700">Restore from Backup</p>
                                <p className="text-xs text-slate-500">Import data from a backup file.</p>
                            </div>
                            <label htmlFor="backup-upload" className="cursor-pointer inline-flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-sky-600 bg-sky-100 hover:bg-sky-200 transition-colors">
                                <UploadIcon className="w-4 h-4" />
                                <span>Import Backup</span>
                                <input id="backup-upload" type="file" accept=".json" className="hidden" onChange={handleFileImport} />
                            </label>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-medium text-slate-700">Automatic Backups</p>
                                <p className="text-xs text-slate-500">Automatically save a backup when data changes.</p>
                            </div>
                            <button
                                onClick={() => onToggleAutoBackup(!autoBackupEnabled)}
                                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 ${autoBackupEnabled ? 'bg-sky-500' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${autoBackupEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                         {autoBackupEnabled && lastAutoBackup && (
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-slate-700">Last Automatic Backup</p>
                                    <p className="text-xs text-slate-500">
                                        {new Date(lastAutoBackup.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                                <button onClick={handleDownloadAutoBackup} className="inline-flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-sky-600 bg-sky-100 hover:bg-sky-200 transition-colors">
                                    <DownloadIcon className="w-4 h-4" />
                                    <span>Download</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
