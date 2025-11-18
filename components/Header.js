
import React from 'react';
import { PlusIcon, SettingsIcon, ClipboardListIcon, UsersIcon, CalendarIcon } from './icons.js';

const Header = ({
    currentView,
    onNewContact,
    onGoToSettings,
    onGoToDashboard,
    onGoToList,
    onGoToCalendar,
}) => {
    const isDashboardActive = currentView === 'dashboard';
    const isCalendarActive = currentView === 'calendar';
    const isListActive = !isDashboardActive && !isCalendarActive;

    return (
        React.createElement("header", { className: "px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center space-x-2 bg-slate-50 dark:bg-slate-800 flex-shrink-0 z-20" },
            React.createElement("div", { className: "flex items-center space-x-1 p-1 bg-slate-200 dark:bg-slate-900 rounded-lg overflow-x-auto no-scrollbar" },
                React.createElement("button", {
                    onClick: onGoToDashboard,
                    className: `flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${isDashboardActive ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'}`,
                    "aria-label": "Dashboard"
                },
                    React.createElement(ClipboardListIcon, { className: "w-5 h-5" }),
                    React.createElement("span", { className: "hidden sm:inline" }, "Dashboard")
                ),
                React.createElement("button", {
                    onClick: onGoToCalendar,
                    className: `flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${isCalendarActive ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'}`,
                    "aria-label": "Calendar"
                },
                    React.createElement(CalendarIcon, { className: "w-5 h-5" }),
                    React.createElement("span", { className: "hidden sm:inline" }, "Calendar")
                ),
                React.createElement("button", {
                    onClick: onGoToList,
                    className: `flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${isListActive ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'}`,
                    "aria-label": "Contacts"
                },
                    React.createElement(UsersIcon, { className: "w-5 h-5" }),
                    React.createElement("span", { className: "hidden sm:inline" }, "Contacts")
                )
            ),
            React.createElement("div", { className: "flex items-center space-x-2 flex-shrink-0" },
                React.createElement("button", {
                    onClick: onGoToSettings,
                    className: "p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors",
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
