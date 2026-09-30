// KINDRED MEET - Device & Browser Notifications Engine

class DeviceNotificationManager {
  constructor() {
    this.permissionGranted = false;
    this.audioOutputSupported = 'setSinkId' in HTMLMediaElement.prototype;
  }

  init() {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        this.permissionGranted = true;
      }
    }

    // Listen for hardware device changes (headphones plugged in, webcam connected)
    if (navigator.mediaDevices && navigator.mediaDevices.ondevicechange !== undefined) {
      navigator.mediaDevices.ondevicechange = () => {
        this.showDeviceToast('🔌 Hardware device list updated (headset/camera changed)');
      };
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      this.showDeviceToast('ℹ️ System notifications are not supported on this browser.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionGranted = (permission === 'granted');
      if (this.permissionGranted) {
        this.sendDeviceNotification('🌻 Notifications Enabled', 'You will receive alerts when family members call or join!');
        this.showDeviceToast('🔔 Device notifications enabled!');
      }
      return this.permissionGranted;
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return false;
    }
  }

  sendDeviceNotification(title, body, icon = '🌻') {
    // 1. Send native browser/system device notification
    if (this.permissionGranted && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: '/assets/logo.png',
          badge: '/assets/logo.png',
          tag: 'kindred-meet-alert',
          renotify: true
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (e) {
        console.warn('Native notification failed, falling back to in-app toast:', e);
      }
    }

    // 2. Always show in-app notification toast as well
    this.showDeviceToast(`${icon} <strong>${title}</strong>: ${body}`);
  }

  showDeviceToast(htmlMessage) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast toast-device';
    toast.innerHTML = htmlMessage;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-15px)';
      setTimeout(() => toast.remove(), 350);
    }, 4500);
  }

  // Enumerate input and output devices
  async getMediaDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return { audioInputs: [], videoInputs: [], audioOutputs: [] };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
      return { audioInputs, videoInputs, audioOutputs };
    } catch (err) {
      console.warn('Could not enumerate devices:', err);
      return { audioInputs: [], videoInputs: [], audioOutputs: [] };
    }
  }
}

window.deviceNotificationManager = new DeviceNotificationManager();
