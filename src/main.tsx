import './lib/apiInterceptor';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Override alert and confirm to prevent DOMException in sandboxed iFrames
const originalAlert = window.alert;
window.alert = function(msg: any) {
  try {
    const event = new CustomEvent('app-alert', { detail: { message: String(msg) } });
    window.dispatchEvent(event);
  } catch (e) {
    console.warn("Alert prevented:", msg);
  }
};

const originalConfirm = window.confirm;
window.confirm = function(msg: any) {
  try { return originalConfirm.call(window, msg); } catch (e) { console.warn("Confirm prevented:", msg); return true; }
};

const originalPrompt = window.prompt;
window.prompt = function(msg: any, defaultText?: string) {
  try { return originalPrompt.call(window, msg, defaultText); } catch (e) { console.warn("Prompt prevented:", msg); return null; }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
