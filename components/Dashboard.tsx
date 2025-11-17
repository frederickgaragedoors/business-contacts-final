import React, { useMemo } from 'react';
import { Contact, JobTicket, jobStatusColors } from '../types.ts';
import { ClipboardListIcon, UsersIcon } from './icons.tsx';

interface DashboardProps {
    contacts: Contact[];
    onSelectContact: (id: string) => void;
}

type JobWithContact = JobTicket & {
    contactId: string;
    contactName: string;
};

const Dashboard: React.FC<DashboardProps> = ({ contacts, onSelectContact }) => {
    
    const getLocalDateAsString = (date: Date): string => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const todayStr = getLocalDateAsString(new Date());

    const allJobs = useMemo<JobWithContact[]>(() => {
        return contacts.flatMap(contact => 
            contact.jobTickets.map(ticket => ({
                ...ticket,
                contactId: contact.id,
                contactName: contact.name
            }))
        );
    }, [contacts]);

    const jobsAwaitingParts = useMemo(() => {
        return allJobs
            .filter(job => job.status === 'Awaiting Parts')
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [allJobs]);
    
    const todaysJobs = useMemo(() => {
        return allJobs
            .filter(job => 
                (job.status === 'Scheduled' || job.status === 'In Progress') &&
                job.date === todayStr
            )
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [allJobs, todayStr]);

    const upcomingJobs = useMemo(() => {
        return allJobs
            .filter(job => 
                job.status === 'Scheduled' &&
                job.date > todayStr
            )
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [allJobs, todayStr]);

    const JobCard: React.FC<{ job: JobWithContact }> = ({ job }) => {
        const statusColor = jobStatusColors[job.status];
        return (
            <li 
                onClick={() => onSelectContact(job.contactId)}
                className="p-4 bg-white rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-sky-500 cursor-pointer transition-all"
            >
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-slate-800">{job.contactName}</p>
                        <p className="text-sm text-slate-500">{new Date(job.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</p>
                    </div>
                     <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColor.base} ${statusColor.text}`}>
                        {job.status}
                    </span>
                </div>
                <p className="mt-2 text-sm text-slate-600 truncate">{job.notes}</p>
            </li>
        );
    };

    const Section: React.FC<{ title: string; jobs: JobWithContact[]; emptyMessage: string }> = ({ title, jobs, emptyMessage }) => (
        <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">{title}</h2>
            {jobs.length > 0 ? (
                <ul className="space-y-3">
                    {jobs.map(job => <JobCard key={job.id} job={job} />)}
                </ul>
            ) : (
                <div className="text-center text-slate-500 py-6 px-4 bg-slate-50 rounded-lg">
                    <p>{emptyMessage}</p>
                </div>
            )}
        </section>
    );

    return (
        <div className="h-full flex flex-col bg-slate-100 overflow-y-auto">
             <div className="px-4 sm:px-6 py-6 border-b border-slate-200 bg-white">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Jobs Dashboard</h1>
                <p className="mt-1 text-slate-500">A summary of your active jobs.</p>
            </div>
            <div className="px-4 sm:px-6 py-6 flex-grow space-y-8">
                <Section 
                    title="Awaiting Parts" 
                    jobs={jobsAwaitingParts} 
                    emptyMessage="No customers are currently waiting for parts." 
                />
                <Section 
                    title="Today's Jobs" 
                    jobs={todaysJobs} 
                    emptyMessage="No jobs scheduled or in progress for today." 
                />
                <Section 
                    title="Upcoming" 
                    jobs={upcomingJobs} 
                    emptyMessage="No upcoming jobs scheduled." 
                />
            </div>
        </div>
    );
};

export default Dashboard;
