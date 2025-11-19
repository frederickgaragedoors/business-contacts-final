
import React, { useState, useMemo } from 'react';
import { jobStatusColors, paymentStatusColors, paymentStatusLabels } from '../types.js';
import { ChevronLeftIcon, ChevronRightIcon, BriefcaseIcon, PlusIcon, CalendarIcon } from './icons.js';
import { formatTime } from '../utils.js';
import EmptyState from './EmptyState.js';

const CalendarView = ({ contacts, onViewJob, onAddJob }) => {
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

    // Optimization: Create a map of date string -> jobs to avoid filtering arrays for every calendar cell
    const jobsByDate = useMemo(() => {
        const map = {};
        allJobs.forEach(job => {
            if (job.date) {
                if (!map[job.date]) {
                    map[job.date] = [];
                }
                map[job.date].push(job);
            }
        });
        return map;
    }, [allJobs]);

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
    
    const weeksCount = Math.ceil(calendarDays.length / 7);

    // Safe local date string generation "YYYY-MM-DD"
    const getLocalDateString = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const selectedDateString = getLocalDateString(selectedDate);
    const selectedDateJobs = jobsByDate[selectedDateString] || [];

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
    
    const handleJumpToDate = (e) => {
        if (e.target.value) {
            const [y, m, d] = e.target.value.split('-').map(Number);
            // Note: Month in Date constructor is 0-indexed. Input gives 1-indexed month.
            const newDate = new Date(y, m - 1, d);
            setCurrentDate(newDate);
            setSelectedDate(newDate);
            e.target.value = '';
        }
    };

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        React.createElement("div", { className: "h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-y-auto" },
            /* Calendar Header */
            React.createElement("div", { className: "flex items-center justify-between px-4 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 sticky top-0 z-10" },
                React.createElement("div", { className: "flex items-center space-x-2" },
                     React.createElement("h2", { className: "text-lg font-bold text-slate-800 dark:text-slate-100" },
                        currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })
                    )
                ),
                React.createElement("div", { className: "flex items-center space-x-2" },
                    React.createElement("div", { className: "relative" },
                        React.createElement("button", { 
                            className: "p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600",
                            title: "Jump to date"
                        },
                            React.createElement(CalendarIcon, { className: "w-5 h-5" })
                        ),
                        React.createElement("input", {
                            type: "date",
                            onChange: handleJumpToDate,
                            className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10",
                            "aria-label": "Jump to specific date"
                        })
                    ),
                    React.createElement("button", { onClick: handleToday, className: "px-3 py-1 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200 dark:hover:bg-slate-600" }, "Today"),
                    React.createElement("button", { onClick: handlePrevMonth, className: "p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300" },
                        React.createElement(ChevronLeftIcon, { className: "w-6 h-6" })
                    ),
                    React.createElement("button", { onClick: handleNextMonth, className: "p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300" },
                        React.createElement(ChevronRightIcon, { className: "w-6 h-6" })
                    )
                )
            ),

            React.createElement("div", { className: "flex flex-col md:flex-row" },
                /* Calendar Grid Container */
                React.createElement("div", { className: "flex flex-col w-full md:w-2/3 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700" },
                    /* Weekday Headers */
                    React.createElement("div", { className: "grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex-shrink-0" },
                        weekDays.map(day => (
                            React.createElement("div", { key: day, className: "py-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase" }, day)
                        ))
                    ),
                    
                    /* Days Grid */
                    React.createElement("div", { 
                        className: "grid grid-cols-7 bg-slate-200 dark:bg-slate-700 gap-px border-b border-slate-200 dark:border-slate-700",
                        style: { gridTemplateRows: `repeat(${weeksCount}, minmax(80px, 1fr))` }
                    },
                        calendarDays.map((day, index) => {
                             if (!day) return React.createElement("div", { key: `empty-${index}`, className: "bg-white dark:bg-slate-800 min-h-[80px]" });
                             
                             const dateString = getLocalDateString(day);
                             const jobs = jobsByDate[dateString] || [];
                             const isSelected = day.toDateString() === selectedDate.toDateString();
                             const isToday = day.toDateString() === new Date().toDateString();

                             return (
                                React.createElement("div", { 
                                    key: dateString, 
                                    onClick: () => setSelectedDate(day),
                                    className: `bg-white dark:bg-slate-800 p-1 sm:p-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors flex flex-col min-h-[80px] ${isSelected ? 'ring-2 ring-inset ring-sky-500 z-0' : ''}`
                                },
                                    React.createElement("div", { className: "flex justify-between items-start flex-shrink-0" },
                                        React.createElement("span", { className: `text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-sky-500 text-white' : 'text-slate-700 dark:text-slate-300'}` },
                                            day.getDate()
                                        ),
                                        jobs.length > 0 && (
                                            React.createElement("span", { className: "text-xs font-bold text-slate-400 md:hidden" }, jobs.length)
                                        )
                                    ),
                                    
                                    React.createElement("div", { className: "mt-1 space-y-1 flex-grow relative" },
                                        /* Mobile: Just dots */
                                        React.createElement("div", { className: "flex flex-wrap gap-1 md:hidden justify-center mt-1" },
                                            jobs.slice(0, 4).map(job => (
                                                React.createElement("div", { key: job.id, className: `w-1.5 h-1.5 rounded-full ${jobStatusColors[job.status].base.split(' ')[0].replace('bg-', 'bg-').replace('100', '400')}` })
                                            )),
                                             jobs.length > 4 && React.createElement("div", { className: "w-1.5 h-1.5 rounded-full bg-slate-300" })
                                        ),

                                        /* Desktop: Bars */
                                        React.createElement("div", { className: "hidden md:flex flex-col gap-1" },
                                            jobs.slice(0, 4).map(job => (
                                                React.createElement("div", { key: job.id, className: `text-[10px] px-1.5 py-0.5 rounded truncate border border-opacity-10 ${jobStatusColors[job.status].base} ${jobStatusColors[job.status].text}` },
                                                     React.createElement("span", { className: "font-semibold mr-1" }, job.time || ''),
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
                React.createElement("div", { className: "w-full md:w-1/3 flex flex-col bg-white dark:bg-slate-800 border-t md:border-t-0 border-slate-200 dark:border-slate-700" },
                    React.createElement("div", { className: "p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0 flex justify-between items-center sticky top-0 z-10" },
                        React.createElement("h3", { className: "font-bold text-slate-800 dark:text-slate-100" },
                            selectedDate.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })
                        ),
                        React.createElement("button", { 
                            onClick: () => onAddJob(selectedDate),
                            className: "flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors"
                        },
                            React.createElement(PlusIcon, { className: "w-3 h-3" }),
                            React.createElement("span", null, "Add Job")
                        )
                    ),
                    React.createElement("div", { className: "p-4" },
                        selectedDateJobs.length > 0 ? (
                            React.createElement("ul", { className: "space-y-3" },
                                selectedDateJobs.sort((a,b) => (a.time || '00:00').localeCompare(b.time || '00:00')).map(job => {
                                    const paymentStatus = job.paymentStatus || 'unpaid';
                                    const paymentStatusColor = paymentStatusColors[paymentStatus];
                                    const paymentStatusLabel = paymentStatusLabels[paymentStatus];
                                    
                                    return (
                                        React.createElement("li", { 
                                            key: job.id, 
                                            onClick: () => onViewJob(job.contactId, job.id),
                                            className: "p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:border-sky-500 dark:hover:border-sky-500 cursor-pointer transition-all"
                                        },
                                            React.createElement("div", { className: "flex justify-between items-start mb-1" },
                                                 React.createElement("div", { className: "flex flex-wrap gap-1" },
                                                    React.createElement("span", { className: `px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full ${jobStatusColors[job.status].base} ${jobStatusColors[job.status].text}` },
                                                        job.status
                                                    ),
                                                    React.createElement("span", { className: `px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full ${paymentStatusColor.base} ${paymentStatusColor.text}` },
                                                        paymentStatusLabel
                                                    )
                                                ),
                                                React.createElement("span", { className: "text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap ml-2" },
                                                    job.time ? formatTime(job.time) : 'No Time'
                                                )
                                            ),
                                            React.createElement("p", { className: "font-semibold text-slate-800 dark:text-slate-100 mt-1" }, job.contactName),
                                            job.notes && (
                                                React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400 truncate mt-1" }, job.notes)
                                            )
                                        )
                                    );
                                })
                            )
                        ) : (
                            React.createElement("div", { className: "py-8" },
                                React.createElement(EmptyState, { 
                                    Icon: BriefcaseIcon,
                                    title: "No Jobs",
                                    message: "No jobs scheduled for this day."
                                })
                            )
                        )
                    )
                )
            )
        )
    );
};

export default CalendarView;