import React, { useState, useCallback } from 'react';
import { Contact, FileAttachment, CustomField, DefaultFieldSetting } from '../types.ts';
import { UserCircleIcon, XIcon, ArrowLeftIcon, FileIcon, TrashIcon, PlusIcon } from './icons.tsx';
import { fileToDataUrl, formatFileSize, generateId } from '../utils.ts';

interface ContactFormProps {
  initialContact?: Contact;
  onSave: (contactData: Omit<Contact, 'id'>) => void;
  onCancel: () => void;
  defaultFields?: DefaultFieldSetting[];
}

const ContactForm: React.FC<ContactFormProps> = ({ initialContact, onSave, onCancel, defaultFields }) => {
  const [name, setName] = useState(initialContact?.name || '');
  const [email, setEmail] = useState(initialContact?.email || '');
  const [phone, setPhone] = useState(initialContact?.phone || '');
  const [address, setAddress] = useState(initialContact?.address || '');
  const [photoUrl, setPhotoUrl] = useState(initialContact?.photoUrl || '');
  const [files, setFiles] = useState<FileAttachment[]>(initialContact?.files || []);
  const [customFields, setCustomFields] = useState<CustomField[]>(
    initialContact?.customFields || defaultFields?.map(df => ({ id: generateId(), label: df.label, value: '' })) || []
  );

  const [stagedFiles, setStagedFiles] = useState<FileAttachment[]>([]);

  const handlePhotoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    input.value = '';
  }, []);

  const handleFilesChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    if (input.files) {
      try {
        const newFilesPromises = Array.from(input.files).map(async (file: File) => {
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
    }
    input.value = '';
  }, []);

  const removeFile = (id: string, isStaged: boolean) => {
    if (isStaged) {
        setStagedFiles(stagedFiles.filter(file => file.id !== id));
    } else {
        setFiles(files.filter(file => file.id !== id));
    }
  };
  
  const handleCustomFieldChange = (id: string, field: 'label' | 'value', value: string) => {
    setCustomFields(customFields.map(cf => cf.id === id ? { ...cf, [field]: value } : cf));
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { id: generateId(), label: '', value: '' }]);
  };

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter(cf => cf.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalFiles = [...files, ...stagedFiles];
    onSave({ name, email, phone, address, photoUrl, files: finalFiles, customFields, jobTickets: initialContact?.jobTickets || [] });
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col bg-white overflow-y-auto">
      <div className="p-4 flex items-center border-b border-slate-200 sticky top-0 bg-white z-10">
        <button type="button" onClick={onCancel} className="p-2 rounded-full hover:bg-slate-100 md:hidden">
            <ArrowLeftIcon className="w-6 h-6 text-slate-600" />
        </button>
        <h2 className="ml-4 flex-grow font-bold text-lg text-slate-700">
          {initialContact ? 'Edit Contact' : 'New Contact'}
        </h2>
        <div className="flex space-x-2">
            <button type="button" onClick={onCancel} className="hidden md:inline px-4 py-2 rounded-md text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors">Save</button>
        </div>
      </div>
      
      <div className="px-4 sm:px-6 py-6 flex-grow">
        <div className="flex flex-col items-center mb-6">
            <div className="relative w-24 h-24">
                {photoUrl ? (
                    <img src={photoUrl} alt="Contact" className="w-24 h-24 rounded-full object-cover" />
                ) : (
                    <UserCircleIcon className="w-24 h-24 text-slate-300" />
                )}
                 <label htmlFor="photo-upload" className="absolute -bottom-1 -right-1 p-2 bg-sky-500 text-white rounded-full cursor-pointer hover:bg-sky-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </label>
            </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-600">Full Name</label>
            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-600">Email</label>
            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-600">Phone</label>
            <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-slate-600">Address</label>
            <textarea id="address" value={address} onChange={e => setAddress(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"></textarea>
          </div>
        </div>

        <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-medium text-slate-800">Custom Fields</h3>
            <div className="mt-4 space-y-4">
                {customFields.map((field) => (
                    <div key={field.id} className="flex items-end space-x-2">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-500">Label</label>
                            <input type="text" value={field.label} onChange={(e) => handleCustomFieldChange(field.id, 'label', e.target.value)} placeholder="e.g. Company" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm" />
                        </div>
                         <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-500">Value</label>
                            <input type="text" value={field.value} onChange={(e) => handleCustomFieldChange(field.id, 'value', e.target.value)} placeholder="e.g. Acme Corp" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm" />
                        </div>
                        <button type="button" onClick={() => removeCustomField(field.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors">
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                    </div>
                ))}
            </div>
            <button type="button" onClick={addCustomField} className="mt-4 flex items-center px-3 py-2 rounded-md text-sm font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 transition-colors">
                <PlusIcon className="w-4 h-4 mr-2" /> Add Field
            </button>
        </div>


        <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-medium text-slate-800">Attachments</h3>
             <div className="mt-4 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <FileIcon className="mx-auto h-12 w-12 text-slate-400"/>
                  <div className="flex text-sm text-slate-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-sky-600 hover:text-sky-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-sky-500">
                      <span>Upload files</span>
                      <input id="file-upload" name="file-upload" type="file" multiple className="sr-only" onChange={handleFilesChange}/>
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-slate-500">Any file type</p>
                </div>
              </div>
        </div>

        {files.length > 0 && (
          <div className="mt-4">
             <h4 className="text-sm font-medium text-slate-600">Current Attachments</h4>
             <ul className="mt-2 space-y-2">
                {files.map(file => (
                  <li key={file.id} className="flex items-center p-2 bg-slate-100 rounded-md shadow-sm">
                    <FileIcon className="w-5 h-5 text-slate-500 flex-shrink-0" />
                    <div className="ml-3 flex-grow truncate">
                        <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                    </div>
                    <button type="button" onClick={() => removeFile(file.id, false)} className="ml-2 p-1 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-100">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                  </li>
                ))}
             </ul>
          </div>
        )}

        {stagedFiles.length > 0 && (
          <div className="mt-4">
             <h4 className="text-sm font-medium text-slate-600">Staged Files for Upload</h4>
             <ul className="mt-2 space-y-2 p-3 bg-sky-50 rounded-md">
                {stagedFiles.map(file => (
                  <li key={file.id} className="flex items-center p-2 bg-white rounded-md shadow-sm">
                    <FileIcon className="w-5 h-5 text-sky-500 flex-shrink-0" />
                    <div className="ml-3 flex-grow truncate">
                        <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                    </div>
                    <button type="button" onClick={() => removeFile(file.id, true)} className="ml-2 p-1 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-100">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                  </li>
                ))}
             </ul>
          </div>
        )}
      </div>
    </form>
  );
};

export default ContactForm;
