import React, { useMemo } from 'react';
import { jobStatusColors } from '../types.js';

const Dashboard = ({ contacts, onSelectContact }) => {

    // Get the start of today in the local timezone for accurate comparisons.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allJobs = useMemo(() => {
        return contacts.flatMap(contact => 
            contact.jobTickets.map(ticket => ({
                ...ticket,
                contactId: contact.id,
                contactName: contact.name
            }))
        );
    }, [contacts]);
    
    // Helper to parse 'YYYY-MM-DD' strings into local Date objects.
    // This avoids timezone issues where new Date('YYYY-MM-DD') is parsed as UTC midnight.
    const parseDateAsLocal = (dateString) => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const jobsAwaitingParts = useMemo(() => {
        return allJobs
            .filter(job => job.status === 'Awaiting Parts')
            .sort((a, b) => parseDateAsLocal(a.date).getTime() - parseDateAsLocal(b.date).getTime());
    }, [allJobs]);
    
    const todaysJobs = useMemo(() => {
        return allJobs
            .filter(job => {
                const jobDate = parseDateAsLocal(job.date);
                return (job.status === 'Scheduled' || job.status === 'In Progress') &&
                       jobDate.getTime() === today.getTime();
            })
            .sort((a, b) => parseDateAsLocal(a.date).getTime() - parseDateAsLocal(b.date).getTime());
    }, [allJobs, today]);

    const upcomingJobs = useMemo(() => {
        return allJobs
            .filter(job => {
                 const jobDate = parseDateAsLocal(job.date);
                 return job.status === 'Scheduled' && jobDate > today;
            })
            .sort((a, b) => parseDateAsLocal(a.date).getTime() - parseDateAsLocal(b.date).getTime());
    }, [allJobs, today]);

    const JobCard = ({ job }) => {
        const statusColor = jobStatusColors[job.status];
        return (
            React.createElement("li", { 
                onClick: () => onSelectContact(job.contactId),
                className: "p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-sky-500 dark:hover:border-sky-500 cursor-pointer transition-all"
            },
                React.createElement("div", { className: "flex justify-between items-start" },
                    React.createElement("div", null,
                        React.createElement("p", { className: "font-semibold text-slate-800 dark:text-slate-100" }, job.contactName),
                        React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400" }, new Date(job.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }))
                    ),
                     React.createElement("span", { className: `px-2 py-0.5 text-xs font-medium rounded-full ${statusColor.base} ${statusColor.text}` },
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
                React.createElement("div", { className: "text-center text-slate-500 dark:text-slate-400 py-6 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg" },
                    React.createElement("p", null, emptyMessage)
                )
            )
        )
    );

    return (
        React.createElement("div", { className: "h-full flex flex-col bg-slate-100 dark:bg-slate-900 overflow-y-auto" },
            React.createElement("div", { className: "px-4 sm:px-6 py-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" },
                React.createElement("h1", { className: "text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100" }, "Jobs Dashboard"),
                React.createElement("p", { className: "mt-1 text-slate-500 dark:text-slate-400" }, "A summary of your active jobs.")
            ),
            React.createElement("div", { className: "px-4 sm:px-6 py-6 flex-grow space-y-8" },
                React.createElement(Section, { 
                    title: "Awaiting Parts", 
                    jobs: jobsAwaitingParts, 
                    emptyMessage: "No customers are currently waiting for parts." 
                }),
                React.createElement(Section, { 
                    title: "Today's Jobs", 
                    jobs: todaysJobs, 
                    emptyMessage: "No jobs scheduled or in progress for today." 
                }),
                React.createElement(Section, { 
                    title: "Upcoming", 
                    jobs: upcomingJobs, 
                    emptyMessage: "No upcoming jobs scheduled." 
                })
            )
        )
    );
};

export default Dashboard;
