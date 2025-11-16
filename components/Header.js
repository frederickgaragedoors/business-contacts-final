import React from 'react';
import { PlusIcon, SettingsIcon, ClipboardListIcon, UsersIcon } from './icons.js';

const Header = ({
    currentView,
    onNewContact,
    onGoToSettings,
    onGoToDashboard,
    onGoToList,
}) => {
    const isDashboardActive = currentView === 'dashboard';
    const isListActive = !isDashboardActive;

    return (
        React.createElement("header", { className: "p-4 border-b border-slate-200 flex justify-between items-center space-x-2 bg-slate-50 flex-shrink-0 z-20" },
            React.createElement("div", { className: "flex items-center space-x-1 p-1 bg-slate-200 rounded-lg" },
                React.createElement("button", {
                    onClick: onGoToDashboard,
                    className: `flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${isDashboardActive ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`,
                    "aria-label": "Dashboard"
                },
                    React.createElement(ClipboardListIcon, { className: "w-5 h-5" }),
                    React.createElement("span", { className: "hidden sm:inline" }, "Dashboard")
                ),
                React.createElement("button", {
                    onClick: onGoToList,
                    className: `flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${isListActive ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`,
                    "aria-label": "Contacts"
                },
                    React.createElement(UsersIcon, { className: "w-5 h-5" }),
                    React.createElement("span", { className: "hidden sm:inline" }, "Contacts")
                )
            ),
            React.createElement("div", { className: "flex items-center space-x-2" },
                React.createElement("button", {
                    onClick: onGoToSettings,
                    className: "p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors",
                    "aria-label": "Settings"
                },
                    React.createElement(SettingsIcon, { className: "w-6 h-6" })
                ),
                React.createElement("button", {
                    onClick: onNewContact,
                    className: "p-2 rounded-full text-white bg-sky-500 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors",
                    "aria-label": "Add new contact"
                },
                    React.createElement(PlusIcon, { className: "w-6 h-6" })
                )
            )
        )
    );
};

export default Header;
