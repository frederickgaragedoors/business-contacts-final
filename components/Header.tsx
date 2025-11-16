import React from 'react';
import { ViewState } from '../types.ts';
import { PlusIcon, SettingsIcon, ClipboardListIcon, UsersIcon } from './icons.tsx';

interface HeaderProps {
    currentView: ViewState['type'];
    onNewContact: () => void;
    onGoToSettings: () => void;
    onGoToDashboard: () => void;
    onGoToList: () => void;
}

const Header: React.FC<HeaderProps> = ({
    currentView,
    onNewContact,
    onGoToSettings,
    onGoToDashboard,
    onGoToList,
}) => {
    const isDashboardActive = currentView === 'dashboard';
    const isListActive = !isDashboardActive;

    return (
        <header className="p-4 border-b border-slate-200 flex justify-between items-center space-x-2 bg-slate-50 flex-shrink-0 z-20">
            <div className="flex items-center space-x-1 p-1 bg-slate-200 rounded-lg">
                <button
                    onClick={onGoToDashboard}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${isDashboardActive ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`}
                    aria-label="Dashboard"
                >
                    <ClipboardListIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Dashboard</span>
                </button>
                <button
                    onClick={onGoToList}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${isListActive ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`}
                    aria-label="Contacts"
                >
                    <UsersIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Contacts</span>
                </button>
            </div>
            <div className="flex items-center space-x-2">
                <button
                    onClick={onGoToSettings}
                    className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
                    aria-label="Settings"
                >
                    <SettingsIcon className="w-6 h-6" />
                </button>
                <button
                    onClick={onNewContact}
                    className="p-2 rounded-full text-white bg-sky-500 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
                    aria-label="Add new contact"
                >
                    <PlusIcon className="w-6 h-6" />
                </button>
            </div>
        </header>
    );
};

export default Header;
