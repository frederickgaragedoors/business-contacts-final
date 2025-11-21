
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapPinIcon, CalendarIcon, ArrowLeftIcon } from './icons.js';
import { formatTime } from '../utils.js';

const RouteView = ({ contacts, mapSettings, onGoToSettings, onBack }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [routeError, setRouteError] = useState(null);
    const [routeLegs, setRouteLegs] = useState([]);
    
    const mapRef = useRef(null);
    const googleMapRef = useRef(null);
    const directionsRendererRef = useRef(null);

    // 1. Load Google Maps Script
    useEffect(() => {
        if (!mapSettings.apiKey) return;
        
        // Check if already loaded
        if (window.google && window.google.maps) {
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
        const jobs = [];
        
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

        const request = {
            origin: mapSettings.homeAddress,
            destination: mapSettings.homeAddress, // Round trip
            waypoints: waypoints,
            optimizeWaypoints: false, // We respect the time order
            travelMode: google.maps.TravelMode.DRIVING,
        };

        directionsService.route(request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
                directionsRendererRef.current.setDirections(result);
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
        React.createElement("div", { className: "h-full flex flex-col bg-slate-100 dark:bg-slate-900" },
            React.createElement("div", { className: "bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm z-10" },
               React.createElement("div", { className: "flex items-center" },
                    onBack && (
                        React.createElement("button", { onClick: onBack, className: "mr-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" },
                            React.createElement(ArrowLeftIcon, { className: "w-6 h-6 text-slate-600 dark:text-slate-300" })
                        )
                    ),
                    React.createElement("h2", { className: "text-xl font-bold text-slate-800 dark:text-slate-100" }, "Daily Route")
               ),
                React.createElement("div", { className: "flex items-center space-x-2" },
                    React.createElement("input", { 
                        type: "date", 
                        value: selectedDate.toISOString().split('T')[0],
                        onChange: (e) => setSelectedDate(new Date(e.target.value)),
                        className: "p-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 dark:text-slate-200"
                    })
                )
            ),

            !mapSettings.apiKey ? (
                React.createElement("div", { className: "flex flex-col items-center justify-center h-full p-8 text-center" },
                    React.createElement(MapPinIcon, { className: "w-16 h-16 text-slate-300 mb-4" }),
                    React.createElement("h3", { className: "text-lg font-semibold text-slate-700 dark:text-slate-200" }, "Google Maps Not Configured"),
                    React.createElement("p", { className: "text-slate-500 dark:text-slate-400 mt-2 mb-6" }, "Please add your Google Maps API Key in Settings to use the Route Planner."),
                    React.createElement("button", { 
                        onClick: onGoToSettings,
                        className: "px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors"
                    },
                        "Go to Settings"
                    )
                )
            ) : (
                React.createElement("div", { className: "flex-grow flex flex-col lg:flex-row overflow-hidden" },
                    /* Timeline Panel */
                    React.createElement("div", { className: "w-full lg:w-1/3 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto p-4" },
                        !mapSettings.homeAddress ? (
                             React.createElement("div", { className: "p-4 bg-yellow-50 text-yellow-800 rounded-md mb-4 text-sm" },
                                 "Warning: Home address not set. Route will not start/end correctly."
                             )
                        ) : null,

                        /* Timeline */
                        React.createElement("div", { className: "relative space-y-0" },
                            /* Start Node */
                            React.createElement("div", { className: "flex gap-4" },
                                React.createElement("div", { className: "flex flex-col items-center" },
                                    React.createElement("div", { className: "w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center z-10 border-4 border-white dark:border-slate-800" },
                                        React.createElement(MapPinIcon, { className: "w-4 h-4 text-slate-600 dark:text-slate-300" })
                                    ),
                                    React.createElement("div", { className: "h-full w-0.5 bg-slate-200 dark:bg-slate-700 my-1" })
                                ),
                                React.createElement("div", { className: "pb-8 pt-1" },
                                    React.createElement("p", { className: "font-bold text-slate-800 dark:text-slate-200" }, `Start: ${mapSettings.homeAddress || 'Home'}`),
                                    leaveHomeBy && (
                                        React.createElement("p", { className: "text-sm text-green-600 font-medium mt-1" },
                                            `Depart by ${leaveHomeBy}`
                                        )
                                    )
                                )
                            ),

                            jobsForDate.map((stop, index) => {
                                const leg = routeLegs[index];
                                return (
                                    React.createElement("div", { key: stop.job.id, className: "flex gap-4" },
                                        React.createElement("div", { className: "flex flex-col items-center" },
                                            /* Travel Line Content */
                                            React.createElement("div", { className: "absolute -mt-8 left-12 text-xs text-slate-400 bg-white dark:bg-slate-800 px-1" },
                                                leg ? `${leg.duration?.text} (${leg.distance?.text})` : '...'
                                            ),
                                            
                                            React.createElement("div", { className: "w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center z-10 border-4 border-white dark:border-slate-800 font-bold text-xs text-sky-700 dark:text-sky-300" },
                                                index + 1
                                            ),
                                            React.createElement("div", { className: "h-full w-0.5 bg-slate-200 dark:bg-slate-700 my-1" })
                                        ),
                                        React.createElement("div", { className: "pb-8 pt-1 w-full" },
                                            React.createElement("div", { className: "bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600" },
                                                React.createElement("div", { className: "flex justify-between items-start" },
                                                    React.createElement("p", { className: "font-bold text-slate-800 dark:text-slate-200" }, stop.contactName),
                                                    React.createElement("span", { className: "text-xs font-mono bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300" },
                                                        stop.job.time ? formatTime(stop.job.time) : 'Anytime'
                                                    )
                                                ),
                                                React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1" }, stop.address)
                                            )
                                        )
                                    )
                                );
                            }),

                            /* End Node */
                            React.createElement("div", { className: "flex gap-4" },
                                React.createElement("div", { className: "flex flex-col items-center" },
                                     /* Last Leg Info */
                                     React.createElement("div", { className: "absolute -mt-8 left-12 text-xs text-slate-400 bg-white dark:bg-slate-800 px-1" },
                                        routeLegs[jobsForDate.length] ? `${routeLegs[jobsForDate.length].duration?.text} (${routeLegs[jobsForDate.length].distance?.text})` : '...'
                                    ),
                                    React.createElement("div", { className: "w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center z-10 border-4 border-white dark:border-slate-800" },
                                        React.createElement(MapPinIcon, { className: "w-4 h-4 text-slate-600 dark:text-slate-300" })
                                    )
                                ),
                                React.createElement("div", { className: "pt-1" },
                                    React.createElement("p", { className: "font-bold text-slate-800 dark:text-slate-200" }, `End: ${mapSettings.homeAddress || 'Home'}`)
                                )
                            )
                        ),
                        
                        jobsForDate.length === 0 && (
                            React.createElement("p", { className: "text-center text-slate-500 mt-10 italic" }, "No scheduled jobs found for this date.")
                        )
                    ),

                    /* Map Panel */
                    React.createElement("div", { className: "w-full lg:w-2/3 h-64 lg:h-auto bg-slate-200 relative" },
                        React.createElement("div", { ref: mapRef, className: "w-full h-full" }),
                        routeError && (
                            React.createElement("div", { className: "absolute top-4 left-4 bg-red-100 text-red-800 p-3 rounded shadow-md max-w-sm text-sm" },
                                routeError
                            )
                        )
                    )
                )
            )
        )
    );
};

export default RouteView;
