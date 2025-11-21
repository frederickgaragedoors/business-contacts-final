
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Contact, JobTicket, MapSettings } from '../types.ts';
import { MapPinIcon, ArrowLeftIcon } from './icons.tsx';
import { formatTime } from '../utils.ts';

// Fix for missing Google Maps types
declare const google: any;

interface RouteViewProps {
    contacts: Contact[];
    mapSettings: MapSettings;
    onGoToSettings: () => void;
    onBack?: () => void;
}

interface JobStop {
    job: JobTicket;
    contactName: string;
    address: string;
    type: 'job';
    order?: number;
    duration?: string; // Estimated duration of drive TO this stop
    distance?: string;
    departureTime?: string; // When to leave PREVIOUS stop to get here on time
}

const RouteView: React.FC<RouteViewProps> = ({ contacts, mapSettings, onGoToSettings, onBack }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [routeError, setRouteError] = useState<string | null>(null);
    const [routeLegs, setRouteLegs] = useState<any[]>([]);
    
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<any>(null);
    const directionsRendererRef = useRef<any>(null);

    // 1. Load Google Maps Script
    useEffect(() => {
        if (!mapSettings.apiKey) return;
        
        // Check if already loaded
        if ((window as any).google && (window as any).google.maps) {
            setIsMapLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${mapSettings.apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => setIsMapLoaded(true);
        script.onerror = () => setRouteError("Failed to load Google Maps API. Check your API Key.");
        document.head.appendChild(script);

        return () => {
            // Cleanup not strictly necessary for script tag itself
        };
    }, [mapSettings.apiKey]);

    // 2. Prepare Job Data
    const jobsForDate = useMemo(() => {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const jobs: JobStop[] = [];
        
        contacts.forEach(contact => {
            contact.jobTickets.forEach(ticket => {
                if (ticket.date === dateStr && (ticket.status === 'Scheduled' || ticket.status === 'Estimate Scheduled' || ticket.status === 'In Progress')) {
                    jobs.push({
                        job: ticket,
                        contactName: contact.name,
                        address: ticket.jobLocation || contact.address,
                        type: 'job'
                    });
                }
            });
        });

        // Sort by time
        return jobs.sort((a, b) => (a.job.time || '23:59').localeCompare(b.job.time || '23:59'));
    }, [contacts, selectedDate]);

    // 3. Initialize Map
    useEffect(() => {
        if (isMapLoaded && mapRef.current && !googleMapRef.current) {
            googleMapRef.current = new google.maps.Map(mapRef.current, {
                center: { lat: 39.8283, lng: -98.5795 }, // Center of US
                zoom: 4,
                streetViewControl: false,
                mapTypeControl: false,
            });
            directionsRendererRef.current = new google.maps.DirectionsRenderer({
                map: googleMapRef.current,
            });
        }
    }, [isMapLoaded]);

    // 4. Calculate Route
    useEffect(() => {
        if (!isMapLoaded || !directionsRendererRef.current || !mapSettings.homeAddress || jobsForDate.length === 0) {
            setRouteLegs([]);
            return;
        }

        const directionsService = new google.maps.DirectionsService();
        
        const waypoints = jobsForDate.map(stop => ({
            location: stop.address,
            stopover: true
        }));

        const request: any = {
            origin: mapSettings.homeAddress,
            destination: mapSettings.homeAddress, // Round trip
            waypoints: waypoints,
            optimizeWaypoints: false, // We respect the time order
            travelMode: google.maps.TravelMode.DRIVING,
        };

        directionsService.route(request, (result: any, status: any) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
                directionsRendererRef.current?.setDirections(result);
                if (result.routes[0] && result.routes[0].legs) {
                    setRouteLegs(result.routes[0].legs);
                }
            } else {
                console.error("Directions request failed due to " + status);
                setRouteError("Could not calculate route. Check addresses.");
            }
        });

    }, [isMapLoaded, jobsForDate, mapSettings.homeAddress]);

    // Calculate departure time for first leg
    const firstLeg = routeLegs[0];
    let leaveHomeBy = "";
    
    if (firstLeg && firstLeg.duration && jobsForDate[0] && jobsForDate[0].job.time) {
        const firstJobTimeParts = jobsForDate[0].job.time.split(':');
        const jobDate = new Date(selectedDate);
        jobDate.setHours(parseInt(firstJobTimeParts[0]), parseInt(firstJobTimeParts[1]), 0);
        
        // Subtract duration (in seconds) from job time
        const durationSecs = firstLeg.duration.value;
        const leaveDate = new Date(jobDate.getTime() - (durationSecs * 1000));
        
        leaveHomeBy = leaveDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return (
        <div className="h-full flex flex-col bg-slate-100 dark:bg-slate-900">
            <div className="bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm z-10">
               <div className="flex items-center">
                    {onBack && (
                        <button onClick={onBack} className="mr-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                            <ArrowLeftIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    )}
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Daily Route</h2>
               </div>
                <div className="flex items-center space-x-2">
                    <input 
                        type="date" 
                        value={selectedDate.toISOString().split('T')[0]}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        className="p-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 dark:text-slate-200"
                    />
                </div>
            </div>

            {!mapSettings.apiKey ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <MapPinIcon className="w-16 h-16 text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Google Maps Not Configured</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">Please add your Google Maps API Key in Settings to use the Route Planner.</p>
                    <button 
                        onClick={onGoToSettings}
                        className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors"
                    >
                        Go to Settings
                    </button>
                </div>
            ) : (
                <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
                    {/* Timeline Panel */}
                    <div className="w-full lg:w-1/3 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto p-4">
                        {!mapSettings.homeAddress ? (
                             <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md mb-4 text-sm">
                                 Warning: Home address not set. Route will not start/end correctly.
                             </div>
                        ) : null}

                        {/* Timeline */}
                        <div className="relative space-y-0">
                            {/* Start Node */}
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center z-10 border-4 border-white dark:border-slate-800">
                                        <MapPinIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                    </div>
                                    <div className="h-full w-0.5 bg-slate-200 dark:bg-slate-700 my-1"></div>
                                </div>
                                <div className="pb-8 pt-1">
                                    <p className="font-bold text-slate-800 dark:text-slate-200">Start: {mapSettings.homeAddress || 'Home'}</p>
                                    {leaveHomeBy && (
                                        <p className="text-sm text-green-600 font-medium mt-1">
                                            Depart by {leaveHomeBy}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {jobsForDate.map((stop, index) => {
                                const leg = routeLegs[index];
                                return (
                                    <div key={stop.job.id} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            {/* Travel Line Content */}
                                            <div className="absolute -mt-8 left-12 text-xs text-slate-400 bg-white dark:bg-slate-800 px-1">
                                                {leg ? `${leg.duration?.text} (${leg.distance?.text})` : '...'}
                                            </div>
                                            
                                            <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center z-10 border-4 border-white dark:border-slate-800 font-bold text-xs text-sky-700 dark:text-sky-300">
                                                {index + 1}
                                            </div>
                                            <div className="h-full w-0.5 bg-slate-200 dark:bg-slate-700 my-1"></div>
                                        </div>
                                        <div className="pb-8 pt-1 w-full">
                                            <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-bold text-slate-800 dark:text-slate-200">{stop.contactName}</p>
                                                    <span className="text-xs font-mono bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                                                        {stop.job.time ? formatTime(stop.job.time) : 'Anytime'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{stop.address}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* End Node */}
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center">
                                     {/* Last Leg Info */}
                                     <div className="absolute -mt-8 left-12 text-xs text-slate-400 bg-white dark:bg-slate-800 px-1">
                                        {routeLegs[jobsForDate.length] ? `${routeLegs[jobsForDate.length].duration?.text} (${routeLegs[jobsForDate.length].distance?.text})` : '...'}
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center z-10 border-4 border-white dark:border-slate-800">
                                        <MapPinIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                    </div>
                                </div>
                                <div className="pt-1">
                                    <p className="font-bold text-slate-800 dark:text-slate-200">End: {mapSettings.homeAddress || 'Home'}</p>
                                </div>
                            </div>
                        </div>
                        
                        {jobsForDate.length === 0 && (
                            <p className="text-center text-slate-500 mt-10 italic">No scheduled jobs found for this date.</p>
                        )}
                    </div>

                    {/* Map Panel */}
                    <div className="w-full lg:w-2/3 h-64 lg:h-auto bg-slate-200 relative">
                        <div ref={mapRef} className="w-full h-full"></div>
                        {routeError && (
                            <div className="absolute top-4 left-4 bg-red-100 text-red-800 p-3 rounded shadow-md max-w-sm text-sm">
                                {routeError}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RouteView;
