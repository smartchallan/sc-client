import React from 'react';
import { FaCar, FaFileAlt, FaExclamationTriangle, FaShieldAlt } from 'react-icons/fa';
import { RiPoliceCarLine, RiSpeedLine, RiTrafficLightLine } from 'react-icons/ri';

const TrafficChallanAnimation = () => {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 overflow-hidden">
      {/* Animated background circles */}
      <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 -right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-8 py-12">
        {/* Logo/Title area */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 shadow-2xl">
            <RiTrafficLightLine className="w-12 h-12 text-white" />
          </div>
          {/* <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            SmartChallan
          </h1> */}
          <p className="text-blue-100 text-lg md:text-xl max-w-md mx-auto">
            Intelligent Traffic Violation Management System
          </p>
        </div>
        
        {/* Floating animated icons grid */}
        <div className="grid grid-cols-2 gap-8 max-w-lg mx-auto">
          {/* Card 1 - Vehicle Management */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-center w-14 h-14 bg-blue-500/30 rounded-xl mb-4">
              <FaCar className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Vehicle Tracking</h3>
            <p className="text-blue-100 text-sm">Real-time vehicle monitoring</p>
          </div>
          
          {/* Card 2 - Challan Management */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-center w-14 h-14 bg-purple-500/30 rounded-xl mb-4">
              <FaFileAlt className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Digital Challans</h3>
            <p className="text-blue-100 text-sm">Paperless documentation</p>
          </div>
          
          {/* Card 3 - Safety Monitoring */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-center w-14 h-14 bg-red-500/30 rounded-xl mb-4">
              <FaExclamationTriangle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Violation Alerts</h3>
            <p className="text-blue-100 text-sm">Instant notifications</p>
          </div>
          
          {/* Card 4 - Secure System */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-center w-14 h-14 bg-green-500/30 rounded-xl mb-4">
              <FaShieldAlt className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Secure & Safe</h3>
            <p className="text-blue-100 text-sm">Protected data system</p>
          </div>
        </div>
        
        {/* Floating animated elements */}
        <div className="absolute top-1/4 left-10 animate-bounce-slow">
          <RiPoliceCarLine className="w-8 h-8 text-white/40" />
        </div>
        <div className="absolute top-1/3 right-16 animate-bounce-slow" style={{ animationDelay: '1s' }}>
          <RiSpeedLine className="w-10 h-10 text-white/30" />
        </div>
        <div className="absolute bottom-1/4 left-20 animate-bounce-slow" style={{ animationDelay: '2s' }}>
          <FaCar className="w-6 h-6 text-white/30" />
        </div>
      </div>
      
      {/* Decorative road lines at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/20 to-transparent">
        <div className="flex justify-around items-center h-full px-8">
          <div className="w-16 h-1 bg-white/40 rounded"></div>
          <div className="w-16 h-1 bg-white/40 rounded"></div>
          <div className="w-16 h-1 bg-white/40 rounded"></div>
          <div className="w-16 h-1 bg-white/40 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default TrafficChallanAnimation;
