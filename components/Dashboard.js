import React, { useMemo } from 'react';
import { jobStatusColors } from '../types.js';
import EmptyState from './EmptyState.js';
import { ClipboardListIcon, UsersIcon, BriefcaseIcon, BellIcon } from './icons.js';


const Dashboard = ({ contacts, onViewJobDetail }) => {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(today.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);

    const allJobs = useMemo(() => {
        return contacts.flatMap(contact => 
            (contact.jobTickets || []).map(ticket => ({
                ...ticket,
                contactId: contact.id,
                contactName: contact.name
            }))
        );
    }, [contacts]);
    
    const parseDateAsLocal = (dateString) => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const jobsAwaitingParts = useMemo(() => {
        return allJobs
            .filter(job => job.status === 'Awaiting Parts' && job.date)
            .sort((a, b) => parseDateAsLocal(a.date).getTime() - parseDateAsLocal(b.date).getTime());
    }, [allJobs]);
    
    const todaysAppointments = useMemo(() => {
        return allJobs.filter(job => {
            if (!job.date) return false;
            const jobDate = parseDateAsLocal(job.date);
            return job.status === 'Estimate Scheduled' && jobDate.getTime() === today.getTime();
        });
    }, [allJobs, today]);

    const todaysWork = useMemo(() => {
        return allJobs.filter(job => {
            if (!job.date) return false;
            const jobDate = parseDateAsLocal(job.date);
            return (job.status === 'Scheduled' || job.status === 'In Progress') &&
                   jobDate.getTime() === today.getTime();
        });
    }, [allJobs, today]);

    const quotesToFollowUp = useMemo(() => {
        return allJobs.filter(job => {
            if (!job.date) return false;
            const jobDate = parseDateAsLocal(job.date);
            return job.status === 'Quote Sent' && jobDate.getTime() <= threeDaysAgo.getTime();
        }).sort((a, b) => parseDateAsLocal(a.date).getTime() - parseDateAsLocal(b.date).getTime());
    }, [allJobs, threeDaysAgo]);

    const upcomingWork = useMemo(() => {
        return allJobs
            .filter(job => {
                 if (!job.date) return false;
                 const jobDate = parseDateAsLocal(job.date);
                 return job.status === 'Scheduled' && jobDate > today;
            })
            .sort((a, b) => parseDateAsLocal(a.date).getTime() - parseDateAsLocal(b.date).getTime());
    }, [allJobs, today]);
    
    const StatCard = ({ Icon, title, value, color }) => (
        React.createElement("div", { className: `p-5 rounded-xl shadow-sm text-white ${color} card-hover` },
            React.createElement("div", { className: "flex justify-between items-center" },
                React.createElement("p", { className: "text-lg font-medium opacity-90" }, title),
                React.createElement(Icon, { className: "w-8 h-8 opacity-50" })
            ),
            React.createElement("p", { className: "text-4xl font-bold mt-2" }, value)
        )
    );

    const JobCard = ({ job }) => {
        const statusColor = jobStatusColors[job.status];
        return (
            React.createElement("li", { 
                onClick: () => onViewJobDetail(job.contactId, job.id),
                className: "p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-sky-500 dark:hover:border-sky-500 cursor-pointer card-hover"
            },
                React.createElement("div", { className: "flex justify-between items-start space-x-2" },
                    React.createElement("div", { className: "min-w-0" },
                        React.createElement("p", { className: "font-semibold text-slate-800 dark:text-slate-100 truncate" }, job.contactName),
                        React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400" }, new Date(job.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }))
                    ),
                     React.createElement("span", { className: `flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${statusColor.base} ${statusColor.text}` },
                        job.status
                    )
                ),
                React.createElement("p", { className: "mt-2 text-sm text-slate-600 dark:text-slate-300 truncate" }, job.notes)
            )
        );
    };

    const Section = ({ title, jobs, emptyMessage }) => (
        React.createElement("section", null,
            React.createElement("h2", { className: "text-xl font-bold text-slate-800 dark:text-slate-100 mb-4" }, title),
            jobs.length > 0 ? (
                React.createElement("ul", { className: "space-y-3" },
                    jobs.map(job => React.createElement(JobCard, { key: job.id, job: job }))
                )
            ) : (
                React.createElement("p", { className: "text-center text-slate-500 dark:text-slate-400 py-6 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg" }, emptyMessage)
            )
        )
    );

    return (
        React.createElement("div", { className: "h-full flex flex-col bg-slate-100 dark:bg-slate-900 overflow-y-auto" },
            React.createElement("div", { className: "px-4 sm:px-6 py-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" },
                React.createElement("h1", { className: "text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100" }, "Good Morning!"),
                React.createElement("p", { className: "mt-1 text-slate-500 dark:text-slate-400" }, "Here's a summary of your business activity.")
            ),
            React.createElement("div", { className: "px-4 sm:px-6 py-6 flex-grow space-y-8" },
                React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" },
                    React.createElement(StatCard, { Icon: UsersIcon, title: "Total Contacts", value: contacts.length, color: "bg-gradient-to-br from-sky-500 to-sky-600" }),
                    React.createElement(StatCard, { Icon: ClipboardListIcon, title: "Jobs Today", value: todaysAppointments.length + todaysWork.length, color: "bg-gradient-to-br from-green-500 to-green-600" }),
                    React.createElement(StatCard, { Icon: BellIcon, title: "Follow Ups", value: quotesToFollowUp.length, color: "bg-gradient-to-br from-orange-500 to-orange-600" }),
                    React.createElement(StatCard, { Icon: BriefcaseIcon, title: "Awaiting Parts", value: jobsAwaitingParts.length, color: "bg-gradient-to-br from-purple-500 to-purple-600" })
                ),
                
                allJobs.length > 0 ? (
                    React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8" },
                        React.createElement("div", { className: "lg:col-span-2 space-y-8" },
                            React.createElement(Section, { 
                                title: "Today's Appointments", 
                                jobs: todaysAppointments, 
                                emptyMessage: "No estimates scheduled for today." 
                            }),
                            React.createElement(Section, { 
                                title: "Today's Work", 
                                jobs: todaysWork, 
                                emptyMessage: "No work scheduled for today." 
                            }),
                            React.createElement(Section, { 
                                title: "Upcoming Work", 
                                jobs: upcomingWork, 
                                emptyMessage: "No upcoming jobs scheduled." 
                            })
                        ),
                        React.createElement("div", { className: "lg:col-span-1 space-y-8" },
                            React.createElement(Section, {
                                title: "Follow-Ups Required",
                                jobs: quotesToFollowUp,
                                emptyMessage: "No quotes need follow-up."
                            }),
                            React.createElement(Section, {
                                title: "Awaiting Parts",
                                jobs: jobsAwaitingParts,
                                emptyMessage: "No jobs are awaiting parts."
                            })
                        )
                    )
                ) : (
                    React.createElement(EmptyState, {
                        Icon: ClipboardListIcon,
                        title: "No Jobs Found",
                        message: "Get started by adding a job to one of your contacts."
                    })
                )
            )
        )
    );
};

export default Dashboard;
