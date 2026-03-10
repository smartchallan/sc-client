import React from 'react';

export default function DashboardLayout({ children, sidebarOpen }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Main content area */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
        {children}
      </div>
    </div>
  );
}

// Dashboard Header Component
export function DashboardHeader({ title, subtitle, action }) {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}

// Dashboard Stats Card Component  
export function StatCard({ icon, title, value, subtitle, color = 'blue', onClick, children }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    green: 'from-green-500 to-green-600 shadow-green-500/30',
    orange: 'from-orange-500 to-orange-600 shadow-orange-500/30',
    red: 'from-red-500 to-red-600 shadow-red-500/30',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/30',
    teal: 'from-teal-500 to-teal-600 shadow-teal-500/30',
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Colored Header */}
      <div className={`bg-gradient-to-r ${colorClasses[color]} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-white/90 text-sm font-medium mb-1">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {subtitle && <p className="text-white/75 text-xs mt-1">{subtitle}</p>}
          </div>
          {icon && (
            <div className="bg-white/20 rounded-xl p-3 group-hover:scale-110 transition-transform duration-300">
              <i className={`${icon} text-3xl`}></i>
            </div>
          )}
        </div>
      </div>
      
      {/* Content Area */}
      {children && (
        <div className="p-4 bg-slate-50">
          {children}
        </div>
      )}
    </div>
  );
}

// Dashboard Content Area
export function DashboardContent({ children, className = '' }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

// Stats Grid
export function StatsGrid({ children, columns = 4 }) {
  const columnClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${columnClasses[columns]} gap-6 mb-6`}>
      {children}
    </div>
  );
}

// Card Component for tables and content sections
export function Card({ title, action, children, className = '', loading = false }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// Badge Component
export function Badge({ children, variant = 'default', size = 'md' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-orange-100 text-orange-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-cyan-100 text-cyan-700',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}

// Button Component
export function Button({ children, variant = 'primary', size = 'md', icon, onClick, disabled, className = '', loading = false, ...props }) {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    success: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/30',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/30',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <i className="ri-loader-4-line animate-spin mr-2"></i>}
      {!loading && icon && <i className={`${icon} mr-2`}></i>}
      {children}
    </button>
  );
}
