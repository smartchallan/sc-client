// Copy of AdminDashboard.jsx
import React, { useRef, useEffect } from "react";
import AdminDashboard from '../admin/AdminDashboard.jsx';


// Auto-logout on inactivity
function useAutoLogout() {
	const logoutTimeoutRef = useRef();
	const AUTO_LOGOUT_SECONDS = Number(import.meta.env.VITE_AUTO_LOGOUT_SECONDS) || 300;
	useEffect(() => {
		function resetLogoutTimer() {
			if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
			logoutTimeoutRef.current = setTimeout(() => {
				localStorage.clear();
				window.location.href = '/';
			}, AUTO_LOGOUT_SECONDS * 1000);
		}
		const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
		events.forEach(ev => window.addEventListener(ev, resetLogoutTimer));
		resetLogoutTimer();
		return () => {
			events.forEach(ev => window.removeEventListener(ev, resetLogoutTimer));
			if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
		};
	}, []);
}

function SuperDashboard() {
	useAutoLogout();
	return <AdminDashboard />;
}

export default SuperDashboard;

