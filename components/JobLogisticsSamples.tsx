
import React from 'react';
import { XIcon, CalendarIcon, MapPinIcon, UserCircleIcon, PhoneIcon, MessageIcon, MailIcon, CarIcon, BriefcaseIcon } from './icons.tsx';

interface JobLogisticsSamplesProps {
  onClose: () => void;
}

const JobLogisticsSamples: React.FC<JobLogisticsSamplesProps> = ({ onClose }) => {
  // Mock Data
  const sampleData = {
    contact: {
      name: "Jane Doe",
      phone: "(555) 123-4567",
      email: "jane.doe@example.com",
      address: "123 Maple Ave, Springfield, IL"
    },
    job: {
      id: "JOB-1042",
      date: "Oct 27, 2023",
      time: "09:00 AM",
      location: "456 Oak St, Springfield, IL", // Different service location
      siteContact: "John Smith",
      notes: "Customer reported loud grinding noise when door opens. Spring looks rusty. Please check rollers as well."
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-100 dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center sticky top-0 z-10 rounded-t-lg">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Layout Options Preview</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-12 overflow-y-auto">
          
          {/* OPTION 1 */}
          <section>
            <div className="flex items-center mb-2">
                <span className="bg-sky-500 text-white text-xs font-bold px-2 py-1 rounded mr-2">Option 1</span>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">The "Icon Grid" Layout</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">Focuses on scanning speed using icons. Distinct footer for billing info.</p>
            
            {/* CARD 1 IMPLEMENTATION */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Top: Notes */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-amber-50 dark:bg-amber-900/10">
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase mb-1">Notes</p>
                    <p className="text-slate-700 dark:text-slate-300 text-sm">{sampleData.job.notes}</p>
                </div>

                {/* Middle: Grid */}
                <div className="p-4 grid grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                        <CalendarIcon className="w-5 h-5 text-sky-500 mt-0.5" />
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">When</p>
                            <p className="font-bold text-slate-800 dark:text-slate-100">{sampleData.job.date}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{sampleData.job.time}</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <BriefcaseIcon className="w-5 h-5 text-sky-500 mt-0.5" />
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Job ID</p>
                            <p className="font-bold text-slate-800 dark:text-slate-100">{sampleData.job.id}</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3 col-span-2 sm:col-span-1">
                        <MapPinIcon className="w-5 h-5 text-sky-500 mt-0.5" />
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Location</p>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{sampleData.job.location}</p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-0.5">Different from billing</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3 col-span-2 sm:col-span-1">
                        <UserCircleIcon className="w-5 h-5 text-sky-500 mt-0.5" />
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Site Contact</p>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{sampleData.job.siteContact}</p>
                            <div className="flex space-x-2 mt-1">
                                <button className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded">Call</button>
                                <button className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded">Text</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer: Billing */}
                <div className="bg-slate-50 dark:bg-slate-750 border-t border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold">JD</div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Bill To</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{sampleData.contact.name}</p>
                        </div>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                        <p>{sampleData.contact.phone}</p>
                        <p>{sampleData.contact.email}</p>
                    </div>
                </div>
            </div>
          </section>


          {/* OPTION 2 */}
          <section>
            <div className="flex items-center mb-2">
                <span className="bg-sky-500 text-white text-xs font-bold px-2 py-1 rounded mr-2">Option 2</span>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">The "Ticket Stub" Layout</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">Uses a dark header strip for high contrast. Clear separation of "Work" vs "People".</p>

            {/* CARD 2 IMPLEMENTATION */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Header Strip */}
                <div className="bg-slate-800 text-white p-3 flex justify-between items-center">
                    <div className="flex space-x-4">
                        <div>
                            <span className="text-[10px] uppercase opacity-70 block">Date</span>
                            <span className="font-bold">{sampleData.job.date}</span>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase opacity-70 block">Time</span>
                            <span className="font-bold">{sampleData.job.time}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] uppercase opacity-70 block">Ticket #</span>
                        <span className="font-mono font-bold text-sky-400">{sampleData.job.id}</span>
                    </div>
                </div>

                {/* Body */}
                <div className="p-5">
                    <div className="mb-4">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Work Notes</p>
                        <p className="text-slate-800 dark:text-slate-200 text-base">{sampleData.job.notes}</p>
                    </div>
                    
                    <div className="border-t border-slate-100 dark:border-slate-700 pt-4 flex flex-col sm:flex-row gap-6">
                        {/* Location Col */}
                        <div className="flex-1">
                             <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center">
                                <MapPinIcon className="w-3 h-3 mr-1" /> Site Location
                             </p>
                             <p className="font-semibold text-sm">{sampleData.job.location}</p>
                             <p className="text-xs text-slate-500 mt-1">Contact: {sampleData.job.siteContact}</p>
                        </div>
                        
                        {/* Client Col */}
                        <div className="flex-1 sm:border-l border-slate-100 dark:border-slate-700 sm:pl-6">
                             <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center">
                                <UserCircleIcon className="w-3 h-3 mr-1" /> Client / Billing
                             </p>
                             <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-sm">{sampleData.contact.name}</p>
                                    <p className="text-xs text-slate-500 mt-1">{sampleData.contact.phone}</p>
                                </div>
                                <div className="flex space-x-1">
                                    <button className="p-1 bg-slate-100 rounded text-slate-600"><PhoneIcon className="w-3 h-3" /></button>
                                    <button className="p-1 bg-slate-100 rounded text-slate-600"><MessageIcon className="w-3 h-3" /></button>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
          </section>


          {/* OPTION 3 */}
          <section>
            <div className="flex items-center mb-2">
                <span className="bg-sky-500 text-white text-xs font-bold px-2 py-1 rounded mr-2">Option 3</span>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Split Cards (Separation of Concerns)</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">Physically separates the Job details from the Client details into two distinct boxes.</p>

            {/* CARD 3 IMPLEMENTATION */}
            <div className="space-y-3">
                {/* Box 1: The Job */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border-l-4 border-l-sky-500 border-y border-r border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center">
                            <BriefcaseIcon className="w-4 h-4 mr-2 text-sky-500" />
                            Job Details
                        </h4>
                        <span className="text-xs font-mono text-slate-400">{sampleData.job.id}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                            <span className="text-xs text-slate-400 block">When</span>
                            <span className="font-medium">{sampleData.job.date} @ {sampleData.job.time}</span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 block">Where</span>
                            <span className="font-medium">{sampleData.job.location}</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded text-sm text-slate-600 dark:text-slate-300">
                        {sampleData.job.notes}
                    </div>
                </div>

                {/* Box 2: The Client */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center text-sm mb-1">
                            <UserCircleIcon className="w-4 h-4 mr-2 text-slate-400" />
                            Client: {sampleData.contact.name}
                        </h4>
                        <p className="text-xs text-slate-500 ml-6">{sampleData.contact.address}</p>
                    </div>
                    <div className="flex space-x-2">
                         <button className="flex items-center space-x-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-medium text-slate-600 dark:text-slate-300">
                            <PhoneIcon className="w-3 h-3" />
                            <span>Call</span>
                         </button>
                         <button className="flex items-center space-x-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-medium text-slate-600 dark:text-slate-300">
                            <CarIcon className="w-3 h-3" />
                            <span>Map</span>
                         </button>
                    </div>
                </div>
            </div>
          </section>

        </div>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-b-lg flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600">
                Close Preview
            </button>
        </div>

      </div>
    </div>
  );
};

export default JobLogisticsSamples;
