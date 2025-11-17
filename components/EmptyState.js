import React from 'react';

const EmptyState = ({ Icon, title, message, actionText, onAction }) => {
  return (
    React.createElement("div", { className: "h-full flex flex-col justify-center items-center text-center p-8 bg-slate-50 dark:bg-slate-800" },
      React.createElement("div", { className: "w-20 h-20 flex items-center justify-center bg-slate-200 dark:bg-slate-700 rounded-full mb-6" },
          React.createElement(Icon, { className: "w-10 h-10 text-slate-400 dark:text-slate-500" })
      ),
      React.createElement("h2", { className: "text-xl font-bold text-slate-700 dark:text-slate-200" }, title),
      React.createElement("p", { className: "mt-2 max-w-xs text-slate-500 dark:text-slate-400" }, message),
      actionText && onAction && (
          React.createElement("button", { 
              onClick: onAction, 
              className: "mt-6 px-4 py-2 bg-sky-500 text-white font-medium rounded-md hover:bg-sky-600 transition-colors"
          },
              actionText
          )
      )
    )
  );
};

export default EmptyState;
