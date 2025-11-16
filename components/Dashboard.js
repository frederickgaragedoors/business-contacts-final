import React, { useMemo } from 'react';
import { ClipboardListIcon } from './icons.js';

const jobStatusColors = {
  Scheduled: { base: 'bg-sky-100', text: 'text-sky-800' },
  'In Progress': { base: 'bg-yellow-100', text: 'text-yellow-800' },
  'Awaiting Parts': { base: 'bg-purple-100', text: 'text-purple-800' },
  Completed: { base: 'bg-green-100', text: 'text-green-800' },
  Invoiced: { base: 'bg-slate-200', text: 'text-slate-700' },
};

const Dashboard = ({ contacts, onSelectContact }) => {

    const allJobs = useMemo(() => {
        return contacts.flatMap(contact => 
            contact.jobTickets.map(ticket => ({
                ...ticket,
                contactId: contact.id,
                contactName: contact.name
            }))
        );
    }, [contacts]);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const jobsAwaitingParts = useMemo(() => {
        return allJobs
            .filter(job => job.status === 'Awaiting Parts')
            .sort((a, b) => a.date.localeCompare(b.date)); // Use string compare for robust sorting
    }, [allJobs]);
    
    const todaysJobs = useMemo(() => {
        const todayStr = today.toISOString().split('T')[0];
        return allJobs
            .filter(job => 
                (job.status === 'Scheduled' || job.status === 'In Progress') &&
                job.date === todayStr
            )
            .sort((a, b) => a.date.localeCompare(b.date)); // Use string compare for robust sorting
    }, [allJobs, today]);

    const upcomingJobs = useMemo(() => {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        return allJobs
            .filter(job => 
                job.status === 'Scheduled' &&
                job.date >= tomorrowStr // Use string comparison to avoid timezone issues
            )
            .sort((a, b) => a.date.localeCompare(b.date)); // Use string compare for robust sorting
    }, [allJobs, today]);

    const JobCard = ({ job }) => {
        const statusColor = jobStatusColors[job.status];
        return (
            React.createElement("li", { 
                onClick: () => onSelectContact(job.contactId),
                className: "p-4 bg-white rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-sky-500 cursor-pointer transition-all"
            },
                React.createElement("div", { className: "flex justify-between items-start" },
                    React.createElement("div", null,
                        React.createElement("p", { className: "font-semibold text-slate-800" }, job.contactName),
                        React.createElement("p", { className: "text-sm text-slate-500" }, new Date(job.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }))
                    ),
                     React.createElement("span", { className: `px-2 py-0.5 text-xs font-medium rounded-full ${statusColor.base} ${statusColor.text}` },
                        job.status
                    )
                ),
                React.createElement("p", { className: "mt-2 text-sm text-slate-600 truncate" }, job.notes)
            )
        );
    };

    const Section = ({ title, jobs, emptyMessage }) => (
        React.createElement("section", null,
            React.createElement("h2", { className: "text-xl font-bold text-slate-800 mb-4" }, title),
            jobs.length > 0 ? (
                React.createElement("ul", { className: "space-y-3" },
                    jobs.map(job => React.createElement(JobCard, { key: job.id, job: job }))
                )
            ) : (
                React.createElement("div", { className: "text-center text-slate-500 py-6 px-4 bg-slate-50 rounded-lg" },
                    React.createElement("p", null, emptyMessage)
                )
            )
        )
    );

    return (
        React.createElement("div", { className: "h-full flex flex-col bg-slate-100 overflow-y-auto" },
            React.createElement("div", { className: "p-6 border-b border-slate-200 bg-white" },
                React.createElement("h1", { className: "text-3xl font-bold text-slate-800" }, "Jobs Dashboard"),
                React.createElement("p", { className: "mt-1 text-slate-500" }, "A summary of your active jobs.")
            ),
            React.createElement("div", { className: "p-6 flex-grow space-y-8" },
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
