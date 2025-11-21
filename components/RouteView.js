
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapPinIcon, CalendarIcon, ArrowLeftIcon, CarIcon } from './icons.js';
import { formatTime } from '../utils.js';

const RouteView = ({ contacts, mapSettings, onGoToSettings, onBack }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [routeError, setRouteError] = useState(null);
    const [routeLegs, setRouteLegs] = useState([]);
    // Default average job duration is 60 minutes if not specified in job
    const avgJobDuration = 60; 
    const [userLocation, setUserLocation] = useState(null);
    const [scheduleStatus, setScheduleStatus] = useState(null);
    const [isLocating, setIsLocating] = useState(false);
    
    const mapRef = useRef(null);
    const googleMapRef = useRef(null);
    const directionsRendererRef = useRef(null);
    const userMarkerRef = useRef(null);

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
                fullscreenControl: false,
                zoomControl: true, // Ensure zoom controls are enabled
                zoomControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_BOTTOM,
                }
            });
            directionsRendererRef.current = new google.maps.DirectionsRenderer({
                map: googleMapRef.current,
                suppressMarkers: false, 
            });
        }
    }, [isMapLoaded]);

    // 4. Geolocation Handling
    useEffect(() => {
        if (!isMapLoaded) return;

        const handlePosition = (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const newPos = { lat, lng };
            setUserLocation(newPos);
            setIsLocating(false);

            // Create or update marker
            if (googleMapRef.current) {
                if (!userMarkerRef.current) {
                    userMarkerRef.current = new google.maps.Marker({
                        position: newPos,
                        map: googleMapRef.current,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: "#4285F4",
                            fillOpacity: 1,
                            strokeColor: "white",
                            strokeWeight: 2,
                        },
                        title: "My Location"
                    });
                } else {
                    userMarkerRef.current.setPosition(newPos);
                }
            }
        };

        const handleError = (error) => {
            console.warn("Geolocation error:", error);
            setIsLocating(false);
        };

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(handlePosition, handleError);
        
        const watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });

        return () => {
            navigator.geolocation.clearWatch(watchId);
            if (userMarkerRef.current) {
                userMarkerRef.current.setMap(null);
                userMarkerRef.current = null;
            }
        };
    }, [isMapLoaded]);

    // 5. Live Status Calculation
    useEffect(() => {
        if (!userLocation || !isMapLoaded || jobsForDate.length === 0) return;

        const now = new Date();
        const dateStr = selectedDate.toISOString().split('T')[0];
        const todayStr = now.toISOString().split('T')[0];

        if (dateStr !== todayStr) {
            setScheduleStatus(null);
            return;
        }

        const currentHourMinute = now.getHours() * 60 + now.getMinutes();
        
        let nextStop = jobsForDate.find(stop => {
            if (!stop.job.time) return false; 
            const [h, m] = stop.job.time.split(':').map(Number);
            return (h * 60 + m) > currentHourMinute;
        });

        let targetAddress = nextStop ? nextStop.address : mapSettings.homeAddress;
        let targetTimeStr = nextStop ? nextStop.job.time : null; 
        let targetName = nextStop ? nextStop.contactName : 'Home';

        if (!targetAddress) return;

        const directionsService = new google.maps.DirectionsService();
        
        directionsService.route({
            origin: userLocation,
            destination: targetAddress,
            travelMode: google.maps.TravelMode.DRIVING
        }, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result.routes[0] && result.routes[0].legs[0]) {
                const durationSecs = result.routes[0].legs[0].duration.value;
                const arrivalTime = new Date(now.getTime() + durationSecs * 1000);
                
                if (targetTimeStr) {
                    const [th, tm] = targetTimeStr.split(':').map(Number);
                    const targetTime = new Date(now);
                    targetTime.setHours(th, tm, 0, 0);

                    const diffMs = targetTime.getTime() - arrivalTime.getTime();
                    const diffMinutes = Math.round(diffMs / 60000);

                    let state = 'on-time';
                    if (diffMinutes < -5) state = 'behind';
                    else if (diffMinutes > 5) state = 'ahead';

                    setScheduleStatus({
                        state,
                        minutes: Math.abs(diffMinutes),
                        targetName,
                        arrivalTime: arrivalTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                    });
                } else {
                    setScheduleStatus({
                        state: 'on-time',
                        minutes: 0,
                        targetName,
                        arrivalTime: arrivalTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                    });
                }
            }
        });

    }, [userLocation, isMapLoaded, jobsForDate, selectedDate, mapSettings.homeAddress]);

    // 6. Calculate Route (Full Day)
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

    // --- Helper Functions for Time Calc ---
    
    const getTimeDate = (baseDate, timeStr) => {
        if (!timeStr) return null;
        const [h, m] = timeStr.split(':').map(Number);
        const d = new Date(baseDate);
        d.setHours(h, m, 0, 0);
        return d;
    };

    const formatTimeDate = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Calculate departure time for first leg
    const firstLeg = routeLegs[0];
    let leaveHomeBy = "";
    
    if (firstLeg && firstLeg.duration && jobsForDate[0] && jobsForDate[0].job.time) {
        const jobStart = getTimeDate(selectedDate, jobsForDate[0].job.time);
        if (jobStart) {
            const durationSecs = firstLeg.duration.value;
            const leaveDate = new Date(jobStart.getTime() - (durationSecs * 1000));
            leaveHomeBy = formatTimeDate(leaveDate);
        }
    }

    // Calculate Est. Home Arrival
    const lastLeg = routeLegs[jobsForDate.length];
    let homeArrivalTime = "";
    if (lastLeg && lastLeg.duration && jobsForDate.length > 0) {
        const lastJob = jobsForDate[jobsForDate.length - 1];
        const jobStart = getTimeDate(selectedDate, lastJob.job.time);
        
        if (jobStart) {
            const durationToUse = lastJob.job.duration || avgJobDuration;
            // Known start time: Start + SpecificDuration/AvgDuration + Travel
            const jobEnd = new Date(jobStart.getTime() + (durationToUse * 60000));
            const arriveHome = new Date(jobEnd.getTime() + (lastLeg.duration.value * 1000));
            homeArrivalTime = formatTimeDate(arriveHome);
        }
    }

    const centerMapOnUser = () => {
        if (userLocation && googleMapRef.current) {
            googleMapRef.current.panTo(userLocation);
            googleMapRef.current.setZoom(14);
        } else if (!isLocating) {
            // If not locating and no location, trigger find again
            setIsLocating(true);
            navigator.geolocation.getCurrentPosition((position) => {
                const newPos = { lat: position.coords.latitude, lng: position.coords.longitude };
                setUserLocation(newPos);
                setIsLocating(false);
                googleMapRef.current?.panTo(newPos);
            }, () => {
                setIsLocating(false);
                alert("Could not get your location.");
            });
        }
    };

    return (
        React.createElement("div", { className: "h-full flex flex-col bg-slate-100 dark:bg-slate-900" },
            React.createElement("div", { className: "bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col xl:flex-row items-center justify-between shadow-sm z-20 gap-4" },
               React.createElement("div", { className: "flex items-center justify-between w-full xl:w-auto" },
                    React.createElement("div", { className: "flex items-center" },
                        onBack && (
                            React.createElement("button", { onClick: onBack, className: "mr-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" },
                                React.createElement(ArrowLeftIcon, { className: "w-6 h-6 text-slate-600 dark:text-slate-300" })
                            )
                        ),
                        React.createElement("h2", { className: "text-xl font-bold text-slate-800 dark:text-slate-100" }, "Daily Route")
                    )
               ),

               React.createElement("div", { className: "flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto justify-end" },
                    /* Schedule Status Indicator */
                    scheduleStatus && (
                        React.createElement("div", { className: `w-full sm:w-auto px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 border
                            ${scheduleStatus.state === 'ahead' ? 'bg-green-100 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300' : 
                              scheduleStatus.state === 'behind' ? 'bg-red-100 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300' : 
                              'bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'}`
                        },
                            React.createElement(CarIcon, { className: "w-4 h-4" }),
                            React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center sm:gap-2 leading-tight" },
                                React.createElement("span", null, 
                                    scheduleStatus.state === 'ahead' && `${scheduleStatus.minutes} min Ahead`,
                                    scheduleStatus.state === 'behind' && `${scheduleStatus.minutes} min Behind`,
                                    scheduleStatus.state === 'on-time' && `On Time`
                                ),
                                React.createElement("span", { className: "text-xs opacity-80 font-normal hidden sm:inline" }, "|"),
                                React.createElement("span", { className: "text-xs opacity-80 font-normal" }, `Est. Arrival: ${scheduleStatus.arrivalTime}`)
                            )
                        )
                    ),

                    React.createElement("div", { className: "flex items-center gap-2 w-full sm:w-auto" },
                        /* Locate Me Button in Header */
                        React.createElement("button", { 
                            onClick: centerMapOnUser,
                            className: "p-2.5 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex-shrink-0",
                            title: "Locate Me"
                        },
                            isLocating ? (
                                React.createElement("div", { className: "w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" })
                            ) : (
                                React.createElement("div", { className: "w-5 h-5 rounded-full border-2 border-current flex items-center justify-center" },
                                    React.createElement("div", { className: "w-2 h-2 bg-current rounded-full" })
                                )
                            )
                        ),

                        React.createElement("input", { 
                            type: "date", 
                            value: selectedDate.toISOString().split('T')[0],
                            onChange: (e) => setSelectedDate(new Date(e.target.value)),
                            className: "flex-grow sm:flex-grow-0 p-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 dark:text-slate-200"
                        })
                    )
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
                React.createElement("div", { className: "flex-grow flex flex-col lg:flex-row overflow-hidden relative" },
                    
                    /* Timeline Panel */
                    React.createElement("div", { className: "w-full lg:w-1/3 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto p-4 order-2 lg:order-1" },
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
                                const nextLeg = routeLegs[index + 1];
                                
                                let departureInfo = null;
                                const jobDuration = stop.job.duration || avgJobDuration;
                                const nextStop = jobsForDate[index + 1];
                                
                                if (nextStop && nextStop.job.time && nextLeg && nextLeg.duration) {
                                    const nextStart = getTimeDate(selectedDate, nextStop.job.time);
                                    if (nextStart) {
                                        const departDate = new Date(nextStart.getTime() - (nextLeg.duration.value * 1000));
                                        departureInfo = React.createElement("p", { className: "text-xs text-orange-600 dark:text-orange-400 font-semibold mt-2" },
                                            `Depart by ${formatTimeDate(departDate)} for next job`
                                        );
                                    }
                                } else if (stop.job.time) {
                                    const currentStart = getTimeDate(selectedDate, stop.job.time);
                                    if (currentStart) {
                                        const finishDate = new Date(currentStart.getTime() + (jobDuration * 60000));
                                        departureInfo = React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400 mt-2" },
                                            `Est. Completion: ${formatTimeDate(finishDate)}`
                                        );
                                    }
                                }

                                return (
                                    React.createElement("div", { key: stop.job.id, className: "flex gap-4" },
                                        React.createElement("div", { className: "flex flex-col items-center" },
                                            /* Travel Line Content */
                                            React.createElement("div", { className: "absolute -mt-8 left-12 text-xs text-slate-400 bg-white dark:bg-slate-800 px-1 whitespace-nowrap" },
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
                                                    React.createElement("div", null,
                                                        React.createElement("p", { className: "font-bold text-slate-800 dark:text-slate-200" }, stop.contactName),
                                                        stop.job.duration && (
                                                            React.createElement("p", { className: "text-[10px] text-slate-500 dark:text-slate-400" }, `Est. ${stop.job.duration} min`)
                                                        )
                                                    ),
                                                    React.createElement("span", { className: "text-xs font-mono bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300" },
                                                        stop.job.time ? formatTime(stop.job.time) : 'Anytime'
                                                    )
                                                ),
                                                React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1" }, stop.address),
                                                React.createElement("div", { className: "mt-3 flex items-center justify-between" },
                                                    React.createElement("div", null, departureInfo),
                                                    React.createElement("a", { 
                                                        href: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.address)}`,
                                                        target: "_blank",
                                                        rel: "noopener noreferrer",
                                                        className: "flex items-center space-x-1 px-2 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded hover:bg-sky-200 dark:hover:bg-sky-800 text-xs font-medium transition-colors"
                                                    },
                                                        React.createElement(CarIcon, { className: "w-3 h-3" }),
                                                        React.createElement("span", null, "Navigate")
                                                    )
                                                )
                                            )
                                        )
                                    )
                                );
                            }),

                            /* End Node */
                            React.createElement("div", { className: "flex gap-4" },
                                React.createElement("div", { className: "flex flex-col items-center" },
                                     /* Last Leg Info */
                                     React.createElement("div", { className: "absolute -mt-8 left-12 text-xs text-slate-400 bg-white dark:bg-slate-800 px-1 whitespace-nowrap" },
                                        routeLegs[jobsForDate.length] ? `${routeLegs[jobsForDate.length].duration?.text} (${routeLegs[jobsForDate.length].distance?.text})` : '...'
                                    ),
                                    React.createElement("div", { className: "w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center z-10 border-4 border-white dark:border-slate-800" },
                                        React.createElement(MapPinIcon, { className: "w-4 h-4 text-slate-600 dark:text-slate-300" })
                                    )
                                ),
                                React.createElement("div", { className: "pt-1" },
                                    React.createElement("p", { className: "font-bold text-slate-800 dark:text-slate-200" }, `End: ${mapSettings.homeAddress || 'Home'}`),
                                    homeArrivalTime && (
                                        React.createElement("p", { className: "text-sm text-green-600 font-medium mt-1" },
                                            `Est. Arrival: ${homeArrivalTime}`
                                        )
                                    )
                                )
                            )
                        ),
                        
                        jobsForDate.length === 0 && (
                            React.createElement("p", { className: "text-center text-slate-500 mt-10 italic" }, "No scheduled jobs found for this date.")
                        )
                    ),

                    /* Map Panel */
                    React.createElement("div", { className: "w-full lg:w-2/3 h-64 lg:h-auto bg-slate-200 relative order-1 lg:order-2" },
                        React.createElement("div", { ref: mapRef, className: "w-full h-full" }),
                        routeError && (
                            React.createElement("div", { className: "absolute top-4 left-4 bg-red-100 text-red-800 p-3 rounded shadow-md max-w-sm text-sm z-10" },
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
