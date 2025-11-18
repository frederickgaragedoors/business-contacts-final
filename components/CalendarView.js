
import React, { useState, useMemo } from 'react';
import { jobStatusColors } from '../types.js';
import { ChevronLeftIcon, ChevronRightIcon, BriefcaseIcon } from './icons.js';
import { formatTime } from '../utils.js';
import EmptyState from './EmptyState.js';

const CalendarView = ({ contacts, onViewJob }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const allJobs = useMemo(() => {
        return contacts.flatMap(contact => 
            (contact.jobTickets || []).map(ticket => ({
                ...ticket,
                contactId: contact.id,
                contactName: contact.name
            }))
        );
    }, [contacts]);

    // Helpers for calendar logic
    const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

    const daysInMonth = getDaysInMonth(year, month);
    const startingDay = getFirstDayOfMonth(year, month);

    const calendarDays = useMemo(() => {
        const days = [];
        // Add padding for previous month
        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }
        // Add actual days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    }, [year, month, startingDay, daysInMonth]);

    const jobsForDate = (date) => {
        if (!date) return [];
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset*60*1000));
        const localDateString = localDate.toISOString().split('T')[0];

        return allJobs.filter(job => job.date === localDateString);
    };

    const selectedDateJobs = useMemo(() => jobsForDate(selectedDate), [selectedDate, allJobs]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const handleToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        React.createElement("div", { className: "h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden" },
            /* Calendar Header */
            React.createElement("div", { className: "flex items-center justify-between px-4 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0" },
                React.createElement("div", { className: "flex items-center space-x-2" },
                     React.createElement("h2", { className: "text-lg font-bold text-slate-800 dark:text-slate-100" },
                        currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })
                    )
                ),
                React.createElement("div", { className: "flex items-center space-x-2" },
                    React.createElement("button", { onClick: handleToday, className: "px-3 py-1 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200 dark:hover:bg-slate-600" }, "Today"),
                    React.createElement("button", { onClick: handlePrevMonth, className: "p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300" },
                        React.createElement(ChevronLeftIcon, { className: "w-6 h-6" })
                    ),
                    React.createElement("button", { onClick: handleNextMonth, className: "p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300" },
                        React.createElement(ChevronRightIcon, { className: "w-6 h-6" })
                    )
                )
            ),

            React.createElement("div", { className: "flex flex-col md:flex-row flex-grow overflow-hidden h-full" },
                /* Calendar Grid Container */
                React.createElement("div", { className: "flex flex-col flex-grow h-[50%] md:h-full overflow-y-auto md:w-2/3 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700" },
                    /* Weekday Headers */
                    React.createElement("div", { className: "grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex-shrink-0" },
                        weekDays.map(day => (
                            React.createElement("div", { key: day, className: "py-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase" }, day)
                        ))
                    ),
                    
                    /* Days Grid */
                    React.createElement("div", { className: "grid grid-cols-7 auto-rows-fr flex-grow bg-slate-200 dark:bg-slate-700 gap-px border-b border-slate-200 dark:border-slate-700" },
                        calendarDays.map((day, index) => {
                             if (!day) return React.createElement("div", { key: `empty-${index}`, className: "bg-white dark:bg-slate-800 min-h-[80px] md:min-h-[100px]" });
                             
                             const jobs = jobsForDate(day);
                             const isSelected = day.toDateString() === selectedDate.toDateString();
                             const isToday = day.toDateString() === new Date().toDateString();

                             return (
                                React.createElement("div", { 
                                    key: day.toISOString(), 
                                    onClick: () => setSelectedDate(day),
                                    className: `bg-white dark:bg-slate-800 min-h-[80px] md:min-h-[100px] p-1 sm:p-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors flex flex-col ${isSelected ? 'ring-2 ring-inset ring-sky-500 z-10' : ''}`
                                },
                                    React.createElement("div", { className: "flex justify-between items-start" },
                                        React.createElement("span", { className: `text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-sky-500 text-white' : 'text-slate-700 dark:text-slate-300'}` },
                                            day.getDate()
                                        ),
                                        jobs.length > 0 && (
                                            React.createElement("span", { className: "text-xs font-bold text-slate-400 md:hidden" }, jobs.length)
                                        )
                                    ),
                                    
                                    React.createElement("div", { className: "mt-1 space-y-1 flex-grow overflow-hidden" },
                                        /* Mobile: Just dots */
                                        React.createElement("div", { className: "flex flex-wrap gap-1 md:hidden justify-center mt-2" },
                                            jobs.slice(0, 4).map(job => (
                                                React.createElement("div", { key: job.id, className: `w-2 h-2 rounded-full ${jobStatusColors[job.status].base.split(' ')[0].replace('bg-', 'bg-').replace('100', '400')}` })
                                            )),
                                             jobs.length > 4 && React.createElement("div", { className: "w-2 h-2 rounded-full bg-slate-300" })
                                        ),

                                        /* Desktop: Bars */
                                        React.createElement("div", { className: "hidden md:flex flex-col gap-1" },
                                            jobs.slice(0, 4).map(job => (
                                                React.createElement("div", { key: job.id, className: `text-[10px] px-1.5 py-0.5 rounded truncate border border-opacity-10 ${jobStatusColors[job.status].base} ${jobStatusColors[job.status].text}` },
                                                     React.createElement("span", { className: "font-semibold mr-1" }, job.time || 'Any'),
                                                     job.contactName
                                                )
                                            )),
                                            jobs.length > 4 && (
                                                React.createElement("span", { className: "text-xs text-slate-400 pl-1" }, `+${jobs.length - 4} more`)
                                            )
                                        )
                                    )
                                )
                             );
                        })
                    )
                ),

                /* Agenda View */
                React.createElement("div", { className: "flex-grow h-[50%] md:h-full md:w-1/3 flex flex-col bg-white dark:bg-slate-800 overflow-hidden" },
                    React.createElement("div", { className: "p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0" },
                        React.createElement("h3", { className: "font-bold text-slate-800 dark:text-slate-100" },
                            `Schedule for ${selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}`
                        )
                    ),
                    React.createElement("div", { className: "overflow-y-auto flex-grow p-4" },
                        selectedDateJobs.length > 0 ? (
                            React.createElement("ul", { className: "space-y-3" },
                                selectedDateJobs.sort((a,b) => (a.time || '00:00').localeCompare(b.time || '00:00')).map(job => (
                                    React.createElement("li", { 
                                        key: job.id, 
                                        onClick: () => onViewJob(job.contactId, job.id),
                                        className: "p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:border-sky-500 dark:hover:border-sky-500 cursor-pointer transition-all"
                                    },
                                        React.createElement("div", { className: "flex justify-between items-start mb-1" },
                                            React.createElement("span", { className: `px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full ${jobStatusColors[job.status].base} ${jobStatusColors[job.status].text}` },
                                                job.status
                                            ),
                                            React.createElement("span", { className: "text-xs font-medium text-slate-500 dark:text-slate-400" },
                                                job.time ? formatTime(job.time) : 'No Time'
                                            )
                                        ),
                                        React.createElement("p", { className: "font-semibold text-slate-800 dark:text-slate-100" }, job.contactName),
                                        job.notes && (
                                            React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400 truncate mt-1" }, job.notes)
                                        )
                                    )
                                ))
                            )
                        ) : (
                            React.createElement(EmptyState, { 
                                Icon: BriefcaseIcon,
                                title: "No Jobs Scheduled",
                                message: "Select another date or add a job to a contact."
                            })
                        )
                    )
                )
            )
        )
    );
};

export default CalendarView;
