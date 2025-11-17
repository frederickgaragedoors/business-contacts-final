import React, { useMemo } from 'react';
import { Contact, JobTicket, jobStatusColors } from '../types.ts';
import EmptyState from './EmptyState.tsx';
import { ClipboardListIcon, UsersIcon, BriefcaseIcon } from './icons.tsx';

interface DashboardProps {
    contacts: Contact[];
    onSelectContact: (id: string) => void;
}

type JobWithContact = JobTicket & {
    contactId: string;
    contactName: string;
};

const Dashboard: React.FC<DashboardProps> = ({ contacts, onSelectContact }) => {
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allJobs = useMemo<JobWithContact[]>(() => {
        return contacts.flatMap(contact => 
            (contact.jobTickets || []).map(ticket => ({
                ...ticket,
                contactId: contact.id,
                contactName: contact.name
            }))
        );
    }, [contacts]);

    const parseDateAsLocal = (dateString: string) => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const jobsAwaitingParts = useMemo(() => {
        return allJobs
            .filter(job => job.status === 'Awaiting Parts' && job.date)
            .sort((a, b) => parseDateAsLocal(a.date).getTime() - parseDateAsLocal(b.date).getTime());
    }, [allJobs]);
    
    const todaysJobs = useMemo(() => {
        return allJobs
            .filter(job => {
                if (!job.date) return false;
                const jobDate = parseDateAsLocal(job.date);
                return (job.status === 'Scheduled' || job.status === 'In Progress') &&
                       jobDate.getTime() === today.getTime();
            })
            .sort((a, b) => parseDateAsLocal(a.date).getTime() - parseDateAsLocal(b.date).getTime());
    }, [allJobs, today]);

    const upcomingJobs = useMemo(() => {
        return allJobs
            .filter(job => {
                 if (!job.date) return false;
                 const jobDate = parseDateAsLocal(job.date);
                 return job.status === 'Scheduled' && jobDate > today;
            })
            .sort((a, b) => parseDateAsLocal(a.date).getTime() - parseDateAsLocal(b.date).getTime());
    }, [allJobs, today]);

    const StatCard: React.FC<{ Icon: React.FC<any>, title: string, value: number | string, color: string }> = ({ Icon, title, value, color }) => (
        <div className={`p-5 rounded-xl shadow-sm text-white ${color} card-hover`}>
            <div className="flex justify-between items-center">
                <p className="text-lg font-medium opacity-90">{title}</p>
                <Icon className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-4xl font-bold mt-2">{value}</p>
        </div>
    );

    const JobCard: React.FC<{ job: JobWithContact }> = ({ job }) => {
        const statusColor = jobStatusColors[job.status];
        return (
            <li 
                onClick={() => onSelectContact(job.contactId)}
                className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-sky-500 dark:hover:border-sky-500 cursor-pointer card-hover"
            >
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{job.contactName}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(job.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</p>
                    </div>
                     <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColor.base} ${statusColor.text}`}>
                        {job.status}
                    </span>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 truncate">{job.notes}</p>
            </li>
        );
    };

    const Section: React.FC<{ title: string; jobs: JobWithContact[]; emptyMessage: string }> = ({ title, jobs, emptyMessage }) => (
        <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">{title}</h2>
            {jobs.length > 0 ? (
                <ul className="space-y-3">
                    {jobs.map(job => <JobCard key={job.id} job={job} />)}
                </ul>
            ) : (
                 <p className="text-center text-slate-500 dark:text-slate-400 py-6 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">{emptyMessage}</p>
            )}
        </section>
    );

    return (
        <div className="h-full flex flex-col bg-slate-100 dark:bg-slate-900 overflow-y-auto">
            <div className="px-4 sm:px-6 py-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">Good Morning!</h1>
                <p className="mt-1 text-slate-500 dark:text-slate-400">Here's a summary of your business activity.</p>
            </div>
            <div className="px-4 sm:px-6 py-6 flex-grow space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <StatCard Icon={UsersIcon} title="Total Contacts" value={contacts.length} color="bg-gradient-to-br from-sky-500 to-sky-600" />
                    <StatCard Icon={ClipboardListIcon} title="Jobs Today" value={todaysJobs.length} color="bg-gradient-to-br from-green-500 to-green-600" />
                    <StatCard Icon={BriefcaseIcon} title="Awaiting Parts" value={jobsAwaitingParts.length} color="bg-gradient-to-br from-purple-500 to-purple-600" />
                </div>
                
                {allJobs.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-8">
                            <Section 
                                title="Awaiting Parts" 
                                jobs={jobsAwaitingParts} 
                                emptyMessage="No jobs are awaiting parts." 
                            />
                        </div>
                        <div className="lg:col-span-2 space-y-8">
                            <Section 
                                title="Today's Jobs" 
                                jobs={todaysJobs} 
                                emptyMessage="You're all clear for today!" 
                            />
                            <Section 
                                title="Upcoming" 
                                jobs={upcomingJobs} 
                                emptyMessage="No upcoming jobs scheduled." 
                            />
                        </div>
                    </div>
                ) : (
                    <EmptyState 
                        Icon={ClipboardListIcon}
                        title="No Jobs Found"
                        message="Get started by adding a job to one of your contacts."
                    />
                )}
            </div>
        </div>
    );
};

export default Dashboard;
