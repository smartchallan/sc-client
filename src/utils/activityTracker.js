/**
 * Utility functions for tracking user activity
 */

const API_ROOT = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

/**
 * Get user's IP address using a public API
 * @returns {Promise<string>} IP address
 */
async function getUserIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'Unknown';
  } catch (error) {
    console.error('Failed to get IP address:', error);
    return 'Unknown';
  }
}

/**
 * Get user's location based on IP address
 * @param {string} ip - IP address
 * @returns {Promise<string>} Location string
 */
async function getUserLocation(ip) {
  try {
    // Using ip-api.com for geolocation (free, no API key required)
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    
    if (data.status === 'success') {
      const location = `${data.city || ''}, ${data.regionName || ''}, ${data.country || ''}`.replace(/^, |, $/g, '');
      return location || 'Unknown';
    }
    return 'Unknown';
  } catch (error) {
    console.error('Failed to get location:', error);
    return 'Unknown';
  }
}

/**
 * Save user activity to the server
 * @param {number} userId - User ID
 * @param {number|null} parentId - Parent ID
 * @param {string|null} clientName - Client name
 * @param {string} actionType - Type of action (e.g., 'login', 'logout')
 * @param {string} description - Description of the activity
 * @returns {Promise<Object>} API response
 */
export async function saveUserActivity(userId, parentId, clientName, actionType, description) {
  try {
    const response = await fetch(`${API_ROOT}/saveuseractivity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        parent_id: parentId,
        client_name: clientName,
        action_type: actionType,
        description: description,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to save user activity');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to save user activity:', error);
    // Don't throw error to prevent login flow from failing
    return null;
  }
}

/**
 * Track user login activity
 * @param {number} userId - User ID
 * @param {number|null} parentId - Parent ID
 * @param {string|null} clientName - Client name
 * @returns {Promise<void>}
 */
export async function trackLoginActivity(userId, parentId, clientName) {
  try {
    const ip = await getUserIP();
    const location = await getUserLocation(ip);
    
    const description = `User logged in from web portal ${ip} and ${location}`;
    
    await saveUserActivity(userId, parentId, clientName, 'login', description);
  } catch (error) {
    console.error('Failed to track login activity:', error);
    // Don't throw error to prevent login flow from failing
  }
}

/**
 * Track user logout activity
 * @param {number} userId - User ID
 * @param {number|null} parentId - Parent ID
 * @param {string|null} clientName - Client name
 * @returns {Promise<void>}
 */
export async function trackLogoutActivity(userId, parentId, clientName) {
  try {
    const ip = await getUserIP();
    const location = await getUserLocation(ip);
    
    const description = `User logged out from web portal ${ip} and ${location}`;
    
    await saveUserActivity(userId, parentId, clientName, 'logout', description);
  } catch (error) {
    console.error('Failed to track logout activity:', error);
    // Don't throw error to prevent logout flow from failing
  }
}

/**
 * Track menu navigation activity
 * @param {number} userId - User ID
 * @param {number|null} parentId - Parent ID
 * @param {string|null} clientName - Client name
 * @param {string} menuLabel - Label of the menu item clicked
 * @returns {Promise<void>}
 */
export async function trackMenuClick(userId, parentId, clientName, menuLabel) {
  try {
    const ip = await getUserIP();
    const location = await getUserLocation(ip);
    
    const description = `User navigated to ${menuLabel} from web portal ${ip} and ${location}`;
    
    await saveUserActivity(userId, parentId, clientName, 'menu_click', description);
  } catch (error) {
    console.error('Failed to track menu click activity:', error);
    // Don't throw error to prevent navigation flow from failing
  }
}
