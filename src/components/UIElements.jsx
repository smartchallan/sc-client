import React, { useState } from 'react';

// Tooltip Component
export function Tooltip({ children, content, position = 'top' }) {
  const [show, setShow] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className={`absolute ${positions[position]} z-50 px-3 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg shadow-lg whitespace-nowrap animate-fade-in`}>
          {content}
          <div className={`absolute w-2 h-2 bg-slate-900 transform rotate-45 ${
            position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
            position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
            position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
            'left-[-4px] top-1/2 -translate-y-1/2'
          }`}></div>
        </div>
      )}
    </div>
  );
}

// Info Icon with Tooltip
export function InfoTooltip({ content, position = 'top' }) {
  return (
    <Tooltip content={content} position={position}>
      <i className="ri-information-line text-slate-400 hover:text-blue-600 cursor-help transition-colors text-lg"></i>
    </Tooltip>
  );
}

// Alert/Banner Component
export function Alert({ variant = 'info', title, children, icon, dismissible = false, onDismiss }) {
  const [visible, setVisible] = useState(true);

  const variants = {
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: icon || 'ri-information-line',
      iconColor: 'text-blue-600',
    },
    success: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: icon || 'ri-checkbox-circle-line',
      iconColor: 'text-green-600',
    },
    warning: {
      bg: 'bg-orange-50 border-orange-200',
      text: 'text-orange-800',
      icon: icon || 'ri-error-warning-line',
      iconColor: 'text-orange-600',
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: icon || 'ri-alert-line',
      iconColor: 'text-red-600',
    },
  };

  const style = variants[variant];

  if (!visible) return null;

  return (
    <div className={`${style.bg} border ${style.text} rounded-lg p-4 mb-4 animate-fade-in`} role="alert">
      <div className="flex items-start gap-3">
        <i className={`${style.icon} ${style.iconColor} text-xl flex-shrink-0`}></i>
        <div className="flex-1">
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          <div className="text-sm">{children}</div>
        </div>
        {dismissible && (
          <button
            onClick={() => {
              setVisible(false);
              onDismiss?.();
            }}
            className={`${style.text} hover:opacity-70 transition-opacity`}
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        )}
      </div>
    </div>
  );
}

// Legend Component for Charts/Data
export function Legend({ items, orientation = 'horizontal' }) {
  return (
    <div className={`flex ${orientation === 'horizontal' ? 'flex-row flex-wrap gap-x-4 gap-y-2' : 'flex-col gap-2'} items-start`}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: item.color }}
          ></div>
          <span className="text-sm text-slate-700 font-medium">{item.label}</span>
          {item.value !== undefined && (
            <span className="text-sm text-slate-500">({item.value})</span>
          )}
        </div>
      ))}
    </div>
  );
}

// Progress Bar Component
export function ProgressBar({ value, max = 100, label, variant = 'blue', showPercentage = true, size = 'md' }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const variants = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    orange: 'bg-orange-600',
    red: 'bg-red-600',
    purple: 'bg-purple-600',
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          {showPercentage && (
            <span className="text-sm font-semibold text-slate-900">{percentage.toFixed(0)}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-slate-200 rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`${variants[variant]} ${sizes[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

// Empty State Component
export function EmptyState({ icon = 'ri-inbox-line', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <i className={`${icon} text-3xl text-slate-400`}></i>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      {description && <p className="text-sm text-slate-600 max-w-sm mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

// Statistics Mini Card
export function StatMini({ label, value, icon, trend, trendValue, variant = 'default' }) {
  const variants = {
    default: 'bg-white border-slate-200',
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    orange: 'bg-orange-50 border-orange-200',
    red: 'bg-red-50 border-red-200',
  };

  return (
    <div className={`${variants[variant]} border rounded-lg p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-600 font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              <i className={`${trend === 'up' ? 'ri-arrow-up-line' : 'ri-arrow-down-line'}`}></i>
              <span className="font-semibold">{trendValue}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <i className={`${icon} text-xl text-slate-600`}></i>
          </div>
        )}
      </div>
    </div>
  );
}

// Info Panel Component
export function InfoPanel({ title, items, variant = 'default' }) {
  const variants = {
    default: 'bg-slate-50 border-slate-200',
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
  };

  return (
    <div className={`${variants[variant]} border rounded-lg p-4`}>
      {title && <h4 className="font-semibold text-slate-900 mb-3">{title}</h4>}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-2">
            <i className="ri-checkbox-circle-fill text-blue-600 text-sm mt-0.5 flex-shrink-0"></i>
            <span className="text-sm text-slate-700">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Quick Guide Component
export function QuickGuide({ steps, title = 'Quick Guide' }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <i className="ri-lightbulb-line text-2xl text-blue-600"></i>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {index + 1}
            </div>
            <p className="text-sm text-slate-700 pt-0.5">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Status Indicator
export function StatusIndicator({ status, label, size = 'md' }) {
  const statuses = {
    active: { color: 'bg-green-500', label: 'Active' },
    inactive: { color: 'bg-slate-400', label: 'Inactive' },
    pending: { color: 'bg-orange-500', label: 'Pending' },
    error: { color: 'bg-red-500', label: 'Error' },
    warning: { color: 'bg-yellow-500', label: 'Warning' },
  };

  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const statusConfig = statuses[status] || statuses.inactive;

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={`${statusConfig.color} ${sizes[size]} rounded-full`}></div>
        <div className={`${statusConfig.color} ${sizes[size]} rounded-full absolute top-0 left-0 animate-ping opacity-75`}></div>
      </div>
      <span className="text-sm font-medium text-slate-700">
        {label || statusConfig.label}
      </span>
    </div>
  );
}

// Metric Card with Icon
export function MetricCard({ icon, label, value, change, changeType = 'increase', color = 'blue' }) {
  const colors = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'bg-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600', icon: 'bg-green-600' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', icon: 'bg-orange-600' },
    red: { bg: 'bg-red-100', text: 'text-red-600', icon: 'bg-red-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'bg-purple-600' },
  };

  const colorConfig = colors[color];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`${colorConfig.bg} p-3 rounded-lg`}>
          <i className={`${icon} ${colorConfig.text} text-2xl`}></i>
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
            <i className={`${changeType === 'increase' ? 'ri-arrow-up-line' : 'ri-arrow-down-line'}`}></i>
            <span>{change}</span>
          </div>
        )}
      </div>
      <p className="text-sm text-slate-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

// Help Text Component
export function HelpText({ children, icon = 'ri-question-line' }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
      <i className={`${icon} text-blue-600 text-lg flex-shrink-0 mt-0.5`}></i>
      <div>{children}</div>
    </div>
  );
}

// Divider with Label
export function Divider({ label, icon }) {
  if (label || icon) {
    return (
      <div className="relative flex items-center py-4">
        <div className="flex-grow border-t border-slate-300"></div>
        <span className="flex-shrink mx-4 text-sm font-medium text-slate-600 flex items-center gap-2">
          {icon && <i className={icon}></i>}
          {label}
        </span>
        <div className="flex-grow border-t border-slate-300"></div>
      </div>
    );
  }
  return <div className="border-t border-slate-300 my-4"></div>;
}

// Loading Skeleton
export function Skeleton({ width = '100%', height = '20px', className = '' }) {
  return (
    <div
      className={`bg-slate-200 rounded animate-pulse ${className}`}
      style={{ width, height }}
    ></div>
  );
}
