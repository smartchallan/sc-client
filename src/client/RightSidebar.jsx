import React from "react";

export default function RightSidebar({ open, onClose, title, children }) {
  return (
    <>
      {/* Overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-screen w-full sm:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button 
            className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
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
