const CONTAINER_ID = 'app-toasts-container';

function ensureContainer() {
  let c = document.getElementById(CONTAINER_ID);
  if (!c) {
    c = document.createElement('div');
    c.id = CONTAINER_ID;
    c.style.position = 'fixed';
    c.style.top = '16px';
    c.style.right = '16px';
    c.style.zIndex = 9999;
    c.style.display = 'flex';
    c.style.flexDirection = 'column';
    c.style.alignItems = 'flex-end';
    document.body.appendChild(c);
  }
  return c;
}

export function showToast({ message = '', type = 'info', duration = 3000 } = {}) {
  const container = ensureContainer();
  const el = document.createElement('div');
  el.className = `app-toast app-toast-${type}`;
  el.textContent = message;
  el.style.marginTop = '8px';
  el.style.padding = '10px 14px';
  el.style.borderRadius = '6px';
  el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
  el.style.maxWidth = '320px';
  el.style.fontSize = '13px';
  el.style.lineHeight = '1.2';
  if (type === 'success') el.style.background = '#e6fffa';
  else if (type === 'error') el.style.background = '#fff5f5';
  else el.style.background = '#f1f5f9';

  container.appendChild(el);

  setTimeout(() => {
    el.style.transition = 'opacity 300ms';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, duration);
}

export default { showToast };
