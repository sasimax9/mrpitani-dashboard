// Notification utility for real-time order alerts

// Request browser notification permission
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Send browser notification (works even when tab is in background)
export function sendBrowserNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: 'order-notification',
      renotify: true,
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    // Auto-close after 8 seconds
    setTimeout(() => notification.close(), 8000);
  }
}

// Play notification sound using Web Audio API
let audioCtx = null;

export function playNotificationSound() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    const now = audioCtx.currentTime;

    // Two-tone chime: pleasant ascending notes
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 (major chord)
    
    frequencies.forEach((freq, i) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now + i * 0.15);

      gainNode.gain.setValueAtTime(0, now + i * 0.15);
      gainNode.gain.linearRampToValueAtTime(0.3, now + i * 0.15 + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);

      oscillator.start(now + i * 0.15);
      oscillator.stop(now + i * 0.15 + 0.5);
    });
  } catch (e) {
    // Audio not available, silently fail
  }
}

// Combined notification: sound + browser notification
export function notifyNewOrder(type = 'order', details = '') {
  const title = type === 'bulk' ? 'New Bulk Order!' : 'New Order Received!';
  const body = details || (type === 'bulk' ? 'A new bulk order has been placed.' : 'A new order has been placed.');

  playNotificationSound();
  sendBrowserNotification(title, body);
}

export function notifyOrderUpdate(type = 'order') {
  // Lighter sound for updates
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const now = audioCtx.currentTime;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, now);
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    oscillator.start(now);
    oscillator.stop(now + 0.35);
  } catch (e) {
    // Audio not available
  }
}
