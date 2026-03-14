import React from "react";

export default function RightSidebar({ open, onClose, title, children }) {
  return (
    <>
      {/* Overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-screen w-full sm:w-[480px] bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button 
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-colors"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 bg-slate-50">
          {children}
        </div>
      </div>
    </>
  );
}
