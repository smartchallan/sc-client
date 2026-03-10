import React from "react";
import { createPortal } from "react-dom";

export default function CustomModal({ open, title, description, icon, onConfirm, onCancel, confirmText = "Yes", cancelText = "Cancel", children }) {
  if (!open) return null;

  const modal = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-slide-up">
        {/* Close button */}
        <button 
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          onClick={onCancel} 
          aria-label="Close modal"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
        
        {/* Icon */}
        {icon && (
          <div className="flex justify-center pt-8 pb-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <i className={`${icon} text-3xl text-blue-600`}></i>
            </div>
          </div>
        )}
        
        {/* Title */}
        <h3 className="text-xl font-semibold text-slate-900 text-center px-6 mb-3">
          {title}
        </h3>
        
        {/* Description */}
        {description && (
          <p className="text-slate-600 text-center px-6 mb-6">
            {description}
          </p>
        )}
        
        {/* Custom content */}
        {children && (
          <div className="px-6 mb-6">
            {children}
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex gap-3 px-6 pb-6">
          <button 
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
          {cancelText && (
            <button 
              className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors duration-200"
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Render modal into document.body to avoid being affected by parent stacking contexts or transforms
  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modal, document.body);
  }
  return modal;
}
