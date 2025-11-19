
import React, { useState, useEffect } from 'react';
import { XIcon, ClipboardListIcon } from './icons.js';
import { generateId } from '../utils.js';
import { DEFAULT_INSPECTION_POINTS } from '../types.js';

const FALLBACK_INSPECTION_POINTS = [
    "Door Balance / Level",
    "Safety Sensors (Photo Eyes)",
    "Safety Reverse Test",
    "Cables",
    "Springs",
    "Rollers",
    "Hinges",
    "Bottom Brackets",
    "Center Bearing",
    "End Bearings",
    "Drums",
    "Shaft / Torsion Tube",
    "Tracks (Vertical & Horizontal)",
    "Opener Motor / Gear",
    "Trolley / Carriage",
    "J-Arm",
    "Emergency Release Cord",
    "Wall Button",
    "Remote Controls",
    "Keypad",
    "Wiring / Connections",
    "Limit Settings",
    "Force Settings",
    "Weather Seal (Bottom)",
    "Perimeter Seal (Jamb)"
];

const SafetyInspectionModal = ({ isOpen, onClose, initialInspection, onSave, jobId }) => {
    const [inspectionItems, setInspectionItems] = useState([]);

    useEffect(() => {
        if (isOpen) {
            setInspectionItems(initialInspection || []);
        }
    }, [isOpen, initialInspection]);

    const getStandardChecklist = () => {
        const points = (DEFAULT_INSPECTION_POINTS && DEFAULT_INSPECTION_POINTS.length > 0)
            ? DEFAULT_INSPECTION_POINTS
            : FALLBACK_INSPECTION_POINTS;

        return points.map(name => ({
            id: generateId(),
            name,
            status: 'na'
        }));
    };

    const handleInspectionChange = (id, status) => {
        setInspectionItems(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    };

    const loadDefaultChecklist = () => {
        setInspectionItems(getStandardChecklist());
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(inspectionItems);
        onClose();
    };

    if (!isOpen) return null;

    return (
        React.createElement("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", role: "dialog", "aria-modal": "true" },
            React.createElement("div", { className: "bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" },
                React.createElement("div", { className: "p-4 border-b dark:border-slate-700 flex justify-between items-center flex-shrink-0" },
                    React.createElement("div", { className: "flex items-center space-x-2" },
                        React.createElement("div", { className: "bg-sky-100 dark:bg-sky-900/50 p-2 rounded-full text-sky-600 dark:text-sky-400" },
                            React.createElement(ClipboardListIcon, { className: "w-5 h-5" })
                        ),
                        React.createElement("div", null,
                            React.createElement("h2", { className: "text-lg font-bold text-slate-800 dark:text-slate-100" }, "Safety Inspection"),
                            jobId && React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, `Job #${jobId}`)
                        )
                    ),
                    React.createElement("button", { onClick: onClose, className: "p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" },
                        React.createElement(XIcon, { className: "w-5 h-5" })
                    )
                ),

                React.createElement("div", { className: "p-4 overflow-y-auto flex-grow min-h-0" },
                    inspectionItems.length === 0 ? (
                         React.createElement("div", { className: "text-center py-8 px-4" },
                             React.createElement("p", { className: "text-slate-600 dark:text-slate-300 mb-4" },
                                 "No inspection checklist found for this job."
                             ),
                             React.createElement("button", {
                                 type: "button",
                                 onClick: loadDefaultChecklist,
                                 className: "inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
                             },
                                 "Load 25-Point Checklist"
                             )
                         )
                    ) : (
                        React.createElement("div", { className: "space-y-0 divide-y divide-slate-100 dark:divide-slate-700/50" },
                            inspectionItems.map(item => (
                                React.createElement("div", { key: item.id, className: "flex flex-col sm:flex-row sm:items-center justify-between py-3" },
                                    React.createElement("span", { className: "text-sm font-medium text-slate-700 dark:text-slate-200 mb-2 sm:mb-0 pr-2" }, item.name),
                                    React.createElement("div", { className: "flex space-x-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg self-start sm:self-auto flex-shrink-0" },
                                        React.createElement("button", {
                                            type: "button",
                                            onClick: () => handleInspectionChange(item.id, 'pass'),
                                            className: `px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${item.status === 'pass' ? 'bg-green-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-600'}`
                                        }, "Pass"),
                                        React.createElement("button", {
                                            type: "button",
                                            onClick: () => handleInspectionChange(item.id, 'repaired'),
                                            className: `px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${item.status === 'repaired' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-600'}`
                                        }, "Repaired"),
                                        React.createElement("button", {
                                            type: "button",
                                            onClick: () => handleInspectionChange(item.id, 'fail'),
                                            className: `px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${item.status === 'fail' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-600'}`
                                        }, "Fail"),
                                        React.createElement("button", {
                                            type: "button",
                                            onClick: () => handleInspectionChange(item.id, 'na'),
                                            className: `px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${item.status === 'na' ? 'bg-white dark:bg-slate-600 text-slate-600 dark:text-slate-200 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`
                                        }, "N/A")
                                    )
                                )
                            ))
                        )
                    )
                ),

                React.createElement("div", { className: "p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-b-lg flex justify-end space-x-3 flex-shrink-0" },
                    React.createElement("button", {
                        type: "button",
                        onClick: onClose,
                        className: "px-4 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    }, "Cancel"),
                    React.createElement("button", {
                        onClick: handleSubmit,
                        className: "px-4 py-2 rounded-md text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors shadow-sm"
                    }, "Save Inspection")
                )
            )
        )
    );
};

export default SafetyInspectionModal;
