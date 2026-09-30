// KINDRED MEET - Main Application Controller

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const appBody = document.body;
  const modeSeniorBtn = document.getElementById('mode-senior-btn');
  const modeKidsBtn = document.getElementById('mode-kids-btn');
  const currentModeTag = document.getElementById('current-mode-tag');
  const btnEnableNotif = document.getElementById('btn-enable-notif');
  const selectSubLang = document.getElementById('select-sub-lang');

  // Screens
  const screenHome = document.getElementById('screen-home');
  const screenPrecall = document.getElementById('screen-precall');
  const screenRoom = document.getElementById('screen-room');

  // Home Screen Inputs
  const inputRoomCode = document.getElementById('input-room-code');
  const inputUserName = document.getElementById('input-user-name');
  const btnJoinCustom = document.getElementById('btn-join-custom');
  const wordTags = document.querySelectorAll('.word-tag');

  // Pre-call Elements
  const previewVideo = document.getElementById('preview-video');
  const precallCamOffOverlay = document.getElementById('precall-cam-off-overlay');
  const previewBadgeStatus = document.getElementById('preview-badge-status');
  const btnPrecallToggleMic = document.getElementById('btn-precall-toggle-mic');
  const btnPrecallToggleCam = document.getElementById('btn-precall-toggle-cam');
  const meterFill = document.getElementById('meter-fill');
  const meterStatusText = document.getElementById('meter-status-text');
  const btnTestSpeaker = document.getElementById('btn-test-speaker');
  const btnPrecallBack = document.getElementById('btn-precall-back');
  const btnPrecallEnter = document.getElementById('btn-precall-enter');
  const precallRoomLabel = document.getElementById('precall-room-label');
  const shareLinkText = document.getElementById('share-link-text');
  const btnCopyInviteLink = document.getElementById('btn-copy-invite-link');

  // Device selectors
  const btnToggleDeviceSettings = document.getElementById('btn-toggle-device-settings');
  const deviceSelectorsBox = document.getElementById('device-selectors-box');
  const selectCamera = document.getElementById('select-camera');
  const selectMic = document.getElementById('select-mic');

  // Room Elements
  const roomActiveTitle = document.getElementById('room-active-title');
  const btnRoomCopyLink = document.getElementById('btn-room-copy-link');
  const btnRoomRingAlert = document.getElementById('btn-room-ring-alert');
  const remoteVideo = document.getElementById('remote-video');
  const remotePlaceholder = document.getElementById('remote-placeholder');
  const remoteRoomTag = document.getElementById('remote-room-tag');
  const localPip = document.getElementById('local-pip');
  const localPipVideo = document.getElementById('local-pip-video');
  const captionsBanner = document.getElementById('captions-banner');
  const drawingCanvas = document.getElementById('drawing-canvas');
  const videoStickersOverlay = document.getElementById('video-stickers-overlay');
  const emojiTray = document.getElementById('emoji-tray');
  const drawingToolbar = document.getElementById('drawing-toolbar');

  // Screen Share Live Preview Card
  const screenSharePreviewCard = document.getElementById('screen-share-preview-card');
  const screenSharePreviewVideo = document.getElementById('screen-share-preview-video');
  const btnStopScreenPreview = document.getElementById('btn-stop-screen-preview');

  // Control Buttons
  const btnToggleMic = document.getElementById('btn-toggle-mic');
  const btnToggleCam = document.getElementById('btn-toggle-cam');
  const btnToggleScreen = document.getElementById('btn-toggle-screen');
  const btnEndCall = document.getElementById('btn-end-call');
  const btnVolumeBoost = document.getElementById('btn-volume-boost');
  const btnToggleCaptions = document.getElementById('btn-toggle-captions');
  const btnHelpCaregiver = document.getElementById('btn-help-caregiver');

  // Kids specific tool buttons
  const btnToolDraw = document.getElementById('btn-tool-draw');
  const btnToolStickers = document.getElementById('btn-tool-stickers');
  const btnToolSoundboard = document.getElementById('btn-tool-soundboard');
  const toastContainer = document.getElementById('toast-container');

  // In-App Hang Up Modal Elements
  const modalHangup = document.getElementById('modal-hangup');
  const btnModalCancel = document.getElementById('btn-modal-cancel');
  const btnModalConfirm = document.getElementById('btn-modal-confirm');

  // App State
  let currentMode = 'senior';
  let targetRoomId = '';
  let targetRoomName = '';
  let activeUserName = 'Grandma / User';
  let stopMicMeter = null;
  let isCaptionsActive = true;
  let isVolumeBoosted = false;
  let isDrawingActive = false;
  let isSoundboardActive = false;
  let currentSubLang = 'en';

  // Pre-call Hardware Toggle Preferences
  let precallAudioEnabled = true;
  let precallVideoEnabled = true;

  // --- INITIALIZATION ---
  function init() {
    window.deviceNotificationManager.init();
    updateNotificationButtonState();

    populateDeviceSelectors();
    bindEventListeners();
    setupSignalingHandlers();

    if (selectSubLang) {
      currentSubLang = selectSubLang.value || 'en';
      window.liveCaptionsManager.setLanguages('en', currentSubLang);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    const modeParam = urlParams.get('mode');
    if (modeParam === 'kids' || modeParam === 'senior') {
      setMode(modeParam);
    }
    if (roomParam) {
      inputRoomCode.value = roomParam;
      startPrecall(roomParam, `Room ${roomParam.toUpperCase()}`);
    }
  }

  // Set Theme Mode (Senior vs Kids)
  function setMode(mode) {
    currentMode = mode;
    if (mode === 'kids') {
      appBody.classList.remove('mode-senior');
      appBody.classList.add('mode-kids');
      modeKidsBtn.classList.add('active');
      modeSeniorBtn.classList.remove('active');
      if (currentModeTag) currentModeTag.textContent = 'Kids Mode';
      activeUserName = inputUserName.value || 'Little Buddy';
    } else {
      appBody.classList.remove('mode-kids');
      appBody.classList.add('mode-senior');
      modeSeniorBtn.classList.add('active');
      modeKidsBtn.classList.remove('active');
      if (currentModeTag) currentModeTag.textContent = 'Senior Mode';
      activeUserName = inputUserName.value || 'Grandma / User';
    }
  }

  // Update Notification Button UI
  function updateNotificationButtonState() {
    if ('Notification' in window && Notification.permission === 'granted') {
      btnEnableNotif.classList.add('active');
      btnEnableNotif.innerHTML = `
        <span class="notif-icon">🔔</span>
        <span class="notif-label">Alerts Active</span>
      `;
    } else {
      btnEnableNotif.classList.remove('active');
      btnEnableNotif.innerHTML = `
        <span class="notif-icon">🔔</span>
        <span class="notif-label">Device Alerts</span>
      `;
    }
  }

  // Populate Camera & Mic Selectors
  async function populateDeviceSelectors() {
    const { audioInputs, videoInputs } = await window.deviceNotificationManager.getMediaDevices();
    
    if (selectCamera) {
      selectCamera.innerHTML = '';
      videoInputs.forEach((d, idx) => {
        const opt = document.createElement('option');
        opt.value = d.deviceId;
        opt.textContent = d.label || `Camera ${idx + 1}`;
        selectCamera.appendChild(opt);
      });
    }

    if (selectMic) {
      selectMic.innerHTML = '';
      audioInputs.forEach((d, idx) => {
        const opt = document.createElement('option');
        opt.value = d.deviceId;
        opt.textContent = d.label || `Microphone ${idx + 1}`;
        selectMic.appendChild(opt);
      });
    }
  }

  // Screen Switcher
  function switchScreen(targetScreen) {
    [screenHome, screenPrecall, screenRoom].forEach((s) => s.classList.remove('active'));
    targetScreen.classList.add('active');
  }

  // Update Pre-Call Quick Hardware Toggle Buttons
  function updatePrecallToggleButtons() {
    if (btnPrecallToggleMic) {
      if (precallAudioEnabled) {
        btnPrecallToggleMic.className = 'precall-toggle-btn btn-mic-active';
        btnPrecallToggleMic.innerHTML = `
          <span class="btn-icon">🎤</span>
          <span class="btn-label">MIC IS ON</span>
        `;
      } else {
        btnPrecallToggleMic.className = 'precall-toggle-btn btn-mic-muted';
        btnPrecallToggleMic.innerHTML = `
          <span class="btn-icon">🔇</span>
          <span class="btn-label">MIC IS OFF</span>
        `;
      }
    }

    if (btnPrecallToggleCam) {
      if (precallVideoEnabled) {
        btnPrecallToggleCam.className = 'precall-toggle-btn btn-cam-active';
        btnPrecallToggleCam.innerHTML = `
          <span class="btn-icon">📹</span>
          <span class="btn-label">CAMERA ON</span>
        `;
        if (precallCamOffOverlay) precallCamOffOverlay.style.display = 'none';
        if (previewBadgeStatus) previewBadgeStatus.textContent = '📹 Camera Preview Working';
      } else {
        btnPrecallToggleCam.className = 'precall-toggle-btn btn-cam-off';
        btnPrecallToggleCam.innerHTML = `
          <span class="btn-icon">🚫</span>
          <span class="btn-label">CAMERA OFF</span>
        `;
        if (precallCamOffOverlay) precallCamOffOverlay.style.display = 'flex';
        if (previewBadgeStatus) previewBadgeStatus.textContent = '🚫 Camera is Turned Off';
      }
    }
  }

  // Start Pre-Call Hardware Test
  async function startPrecall(roomId, roomDisplayName) {
    targetRoomId = roomId;
    targetRoomName = roomDisplayName || roomId;
    precallRoomLabel.textContent = `Joining: ${targetRoomName}`;

    const inviteUrl = `${window.location.origin}/?room=${encodeURIComponent(targetRoomId)}&mode=${currentMode}`;
    shareLinkText.textContent = `Invite Link: ${inviteUrl}`;

    // Default to enabled on entry
    precallAudioEnabled = true;
    precallVideoEnabled = true;
    updatePrecallToggleButtons();

    switchScreen(screenPrecall);

    const { stream, error } = await window.webRTCManager.initLocalMedia(true, true);
    if (stream) {
      previewVideo.srcObject = stream;
      previewVideo.play().catch(() => {});

      if (stopMicMeter) stopMicMeter();
      stopMicMeter = window.soundEngine.setupMicMeter(stream, (level) => {
        if (!precallAudioEnabled) {
          meterFill.style.width = '0%';
          return;
        }
        meterFill.style.width = `${Math.min(100, level * 1.8)}%`;
      });
    }

    if (error) {
      showToast(`⚠️ ${error}`);
    }

    populateDeviceSelectors();
  }

  // Enter Active Call Room
  function enterCallRoom() {
    if (stopMicMeter) stopMicMeter();

    switchScreen(screenRoom);
    roomActiveTitle.textContent = `Call: ${targetRoomName}`;
    remoteRoomTag.textContent = `Room: ${targetRoomName}`;

    // Apply pre-call mic and camera choices to active WebRTC stream
    window.webRTCManager.setAudioEnabled(precallAudioEnabled);
    window.webRTCManager.setVideoEnabled(precallVideoEnabled);

    if (window.webRTCManager.localStream) {
      localPipVideo.srcObject = window.webRTCManager.localStream;
      localPipVideo.play().catch(() => {});

      window.soundEngine.setupMicMeter(window.webRTCManager.localStream, (level) => {
        if (level > 15 && !window.webRTCManager.isMuted) {
          localPip.classList.add('speaking-glow');
        } else {
          localPip.classList.remove('speaking-glow');
        }
      });
    }

    window.sharedCanvasManager.init(
      drawingCanvas,
      (strokeData) => window.webRTCManager.broadcastData('draw-stroke', strokeData),
      () => window.webRTCManager.broadcastData('draw-clear', {})
    );

    window.videoStickersManager.init(videoStickersOverlay);

    window.liveCaptionsManager.init(captionsBanner, (captionData) => {
      window.webRTCManager.broadcastData('live-caption', captionData);
    });
    window.liveCaptionsManager.setLanguages('en', currentSubLang);
    window.liveCaptionsManager.startListening(inputUserName.value || (currentMode === 'kids' ? 'Kiddo' : 'Senior'));

    window.webRTCManager.connectSignaling(() => {
      window.webRTCManager.joinRoom(
        targetRoomId,
        inputUserName.value || (currentMode === 'kids' ? 'Kiddo' : 'Senior'),
        currentMode
      );
    });

    updateControlButtons();
    updateScreenShareButton(false);
    showToast(`🟢 Connected to ${targetRoomName}!`);
  }

  // Setup Signaling Handlers
  function setupSignalingHandlers() {
    window.webRTCManager.onRemoteStreamAdded = (userId, userName, remoteStream) => {
      remotePlaceholder.style.display = 'none';
      remoteVideo.style.display = 'block';
      remoteVideo.srcObject = remoteStream;
      remoteVideo.play().catch(() => {});

      if (window.soundEngine) {
        window.soundEngine.playChime();
        if (isVolumeBoosted) {
          window.soundEngine.setVolumeBoost(remoteVideo, true);
        }
      }

      window.deviceNotificationManager.sendDeviceNotification(
        'Family Connected',
        `👋 ${userName} joined your video call!`,
        '👋'
      );
    };

    window.webRTCManager.onRemoteStreamRemoved = (userId, userName) => {
      remoteVideo.style.display = 'none';
      remoteVideo.srcObject = null;
      remotePlaceholder.style.display = 'flex';

      window.deviceNotificationManager.sendDeviceNotification(
        'Call Update',
        `👋 ${userName || 'Family member'} has left the call.`,
        '👋'
      );
    };

    window.webRTCManager.onDataMessage = (data) => {
      const { type, fromUserName, payload } = data;

      switch (type) {
        case 'draw-stroke':
          window.sharedCanvasManager.handleRemoteStroke(payload);
          break;

        case 'draw-clear':
          window.sharedCanvasManager.clearCanvas(false);
          break;

        case 'reaction':
          triggerFloatingReaction(payload.emoji, fromUserName);
          break;

        case 'live-caption':
          if (isCaptionsActive) {
            window.liveCaptionsManager.displayCaption(
              payload.speaker,
              payload.text,
              payload.translatedText,
              payload.isInterim
            );
          }
          break;

        case 'helper-alert':
          if (window.soundEngine) window.soundEngine.playHelpAlert();
          window.deviceNotificationManager.sendDeviceNotification(
            '🚨 Family Alert',
            `${fromUserName} pressed "I Need Help!"`,
            '🚨'
          );
          break;

        case 'ring-call':
          if (window.soundEngine) window.soundEngine.playChime();
          window.deviceNotificationManager.sendDeviceNotification(
            '🔔 Incoming Ring',
            `${fromUserName} is ringing the room!`,
            '🔔'
          );
          break;

        default:
          break;
      }
    };
  }

  // Update In-Call Control Buttons UI
  function updateControlButtons() {
    if (window.webRTCManager.isMuted) {
      btnToggleMic.className = 'giant-btn btn-mic-muted';
      btnToggleMic.innerHTML = `
        <span class="btn-icon">🔇</span>
        <span class="btn-label">MIC MUTED</span>
      `;
    } else {
      btnToggleMic.className = 'giant-btn btn-mic-active';
      btnToggleMic.innerHTML = `
        <span class="btn-icon">🎤</span>
        <span class="btn-label">MIC IS ON</span>
      `;
    }

    if (window.webRTCManager.isVideoOff) {
      btnToggleCam.className = 'giant-btn btn-cam-off';
      btnToggleCam.innerHTML = `
        <span class="btn-icon">🚫</span>
        <span class="btn-label">CAMERA OFF</span>
      `;
    } else {
      btnToggleCam.className = 'giant-btn btn-cam-active';
      btnToggleCam.innerHTML = `
        <span class="btn-icon">📹</span>
        <span class="btn-label">CAMERA ON</span>
      `;
    }

    if (isVolumeBoosted) {
      btnVolumeBoost.className = 'giant-btn btn-boost-active';
      btnVolumeBoost.innerHTML = `
        <span class="btn-icon">🔊</span>
        <span class="btn-label">EXTRA LOUD</span>
      `;
    } else {
      btnVolumeBoost.className = 'giant-btn btn-boost-off';
      btnVolumeBoost.innerHTML = `
        <span class="btn-icon">🔉</span>
        <span class="btn-label">NORMAL AUDIO</span>
      `;
    }
  }

  // Update Screen Sharing Button & Live Preview UI
  function updateScreenShareButton(isSharing) {
    if (btnToggleScreen) {
      if (isSharing) {
        btnToggleScreen.className = 'giant-btn btn-screen-active';
        btnToggleScreen.innerHTML = `
          <span class="btn-icon">🖥️</span>
          <span class="btn-label">STOP SHARING</span>
        `;
      } else {
        btnToggleScreen.className = 'giant-btn btn-screen-off';
        btnToggleScreen.innerHTML = `
          <span class="btn-icon">🖥️</span>
          <span class="btn-label">SHARE SCREEN</span>
        `;
      }
    }

    // Toggle the floating live screen share preview card
    if (screenSharePreviewCard && screenSharePreviewVideo) {
      if (isSharing && window.webRTCManager.screenStream) {
        screenSharePreviewVideo.srcObject = window.webRTCManager.screenStream;
        screenSharePreviewVideo.play().catch(() => {});
        screenSharePreviewCard.style.display = 'flex';
      } else {
        screenSharePreviewVideo.srcObject = null;
        screenSharePreviewCard.style.display = 'none';
      }
    }
  }

  // Floating Emoji Reactions & Sounds
  function sendReaction(emoji) {
    if (window.soundEngine) {
      if (emoji === '🎉') window.soundEngine.playPartyHorn();
      else if (emoji === '❤️') window.soundEngine.playHeartPop();
      else if (emoji === '👏') window.soundEngine.playApplause();
      else if (emoji === '🐶') window.soundEngine.playPuppySound();
      else window.soundEngine.playSparkle();
    }

    triggerFloatingReaction(emoji, 'You');
    window.webRTCManager.broadcastData('reaction', { emoji });
  }

  function triggerFloatingReaction(emoji, sender) {
    const particle = document.createElement('div');
    particle.className = 'floating-particle';
    particle.textContent = emoji;
    particle.style.left = `${20 + Math.random() * 60}%`;
    document.getElementById('video-stage').appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, 2500);
  }

  // Toast Alerts
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 350);
    }, 4000);
  }

  // Complete & Robust Hang-Up Implementation
  function hangUpCallNow() {
    modalHangup.style.display = 'none';

    window.webRTCManager.stopScreenShare();
    updateScreenShareButton(false);
    window.webRTCManager.leaveCall();
    window.liveCaptionsManager.stopListening();

    if (stopMicMeter) stopMicMeter();

    if (remoteVideo) {
      remoteVideo.srcObject = null;
      remoteVideo.style.display = 'none';
    }
    if (remotePlaceholder) {
      remotePlaceholder.style.display = 'flex';
    }
    if (localPipVideo) {
      localPipVideo.srcObject = null;
    }
    if (previewVideo) {
      previewVideo.srcObject = null;
    }

    window.sharedCanvasManager.clearCanvas(false);
    window.videoStickersManager.setSticker('none');
    drawingCanvas.classList.remove('active');
    drawingToolbar.style.display = 'none';
    emojiTray.style.display = 'none';
    isDrawingActive = false;
    isSoundboardActive = false;

    if (window.soundEngine) {
      window.soundEngine.playChime();
    }

    window.deviceNotificationManager.sendDeviceNotification('Call Ended', 'You left the call. Have a wonderful day!', '📞');
    switchScreen(screenHome);
  }

  // Copy Meeting Link to Clipboard
  function copyMeetingLink() {
    const inviteUrl = `${window.location.origin}/?room=${encodeURIComponent(targetRoomId)}&mode=${currentMode}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      showToast('📋 Meeting link copied to clipboard! Share it with family.');
    }).catch(() => {
      showToast(`Link: ${inviteUrl}`);
    });
  }

  // Bind All Event Listeners
  function bindEventListeners() {
    modeSeniorBtn.addEventListener('click', () => setMode('senior'));
    modeKidsBtn.addEventListener('click', () => setMode('kids'));

    if (selectSubLang) {
      selectSubLang.addEventListener('change', (e) => {
        currentSubLang = e.target.value;
        window.liveCaptionsManager.setLanguages('en', currentSubLang);
        showToast(`🌐 Subtitles set to ${e.target.options[e.target.selectedIndex].text}`);
      });
    }

    btnEnableNotif.addEventListener('click', async () => {
      await window.deviceNotificationManager.requestPermission();
      updateNotificationButtonState();
    });

    btnToggleDeviceSettings.addEventListener('click', () => {
      const isVisible = deviceSelectorsBox.style.display !== 'none';
      deviceSelectorsBox.style.display = isVisible ? 'none' : 'grid';
    });

    btnCopyInviteLink.addEventListener('click', copyMeetingLink);
    btnRoomCopyLink.addEventListener('click', copyMeetingLink);

    btnRoomRingAlert.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playChime();
      window.webRTCManager.broadcastData('ring-call', {});
      showToast('🔔 Ringing other devices in this room!');
    });

    wordTags.forEach((tag) => {
      tag.addEventListener('click', () => {
        inputRoomCode.value = tag.getAttribute('data-code');
      });
    });

    btnJoinCustom.addEventListener('click', () => {
      const code = inputRoomCode.value.trim().toLowerCase() || 'family-room';
      startPrecall(code, `Room: ${code.toUpperCase()}`);
    });

    // Pre-call Quick Mic & Camera Toggles
    if (btnPrecallToggleMic) {
      btnPrecallToggleMic.addEventListener('click', () => {
        precallAudioEnabled = !precallAudioEnabled;
        if (previewVideo && previewVideo.srcObject) {
          const audioTrack = previewVideo.srcObject.getAudioTracks()[0];
          if (audioTrack) audioTrack.enabled = precallAudioEnabled;
        }
        if (meterStatusText) {
          meterStatusText.textContent = precallAudioEnabled ? 'Listening...' : 'Microphone Muted';
          meterStatusText.style.color = precallAudioEnabled ? 'var(--btn-green)' : 'var(--btn-red)';
        }
        if (!precallAudioEnabled && meterFill) {
          meterFill.style.width = '0%';
        }
        updatePrecallToggleButtons();
        showToast(precallAudioEnabled ? '🎤 Microphone is ON' : '🔇 Microphone is OFF');
      });
    }

    if (btnPrecallToggleCam) {
      btnPrecallToggleCam.addEventListener('click', () => {
        precallVideoEnabled = !precallVideoEnabled;
        if (previewVideo && previewVideo.srcObject) {
          const videoTrack = previewVideo.srcObject.getVideoTracks()[0];
          if (videoTrack) videoTrack.enabled = precallVideoEnabled;
        }
        updatePrecallToggleButtons();
        showToast(precallVideoEnabled ? '📹 Camera is ON' : '🚫 Camera is OFF');
      });
    }

    btnTestSpeaker.addEventListener('click', () => {
      if (window.soundEngine) {
        window.soundEngine.playChime();
        showToast('🔔 Chime sound played! Did you hear it?');
      }
    });

    btnPrecallBack.addEventListener('click', () => {
      if (stopMicMeter) stopMicMeter();
      if (previewVideo.srcObject) {
        previewVideo.srcObject.getTracks().forEach((t) => t.stop());
        previewVideo.srcObject = null;
      }
      switchScreen(screenHome);
    });

    btnPrecallEnter.addEventListener('click', () => {
      enterCallRoom();
    });

    btnToggleMic.addEventListener('click', () => {
      const isOn = window.webRTCManager.toggleAudio();
      updateControlButtons();
      showToast(isOn ? '🎤 Microphone is now ON' : '🔇 Microphone is now MUTED');
    });

    btnToggleCam.addEventListener('click', () => {
      const isOn = window.webRTCManager.toggleVideo();
      updateControlButtons();
      showToast(isOn ? '📹 Camera is now ON' : '🚫 Camera is now OFF');
    });

    // In-Call Screen Share Toggle
    if (btnToggleScreen) {
      btnToggleScreen.addEventListener('click', async () => {
        try {
          const isSharing = await window.webRTCManager.toggleScreenShare((stoppedSharing) => {
            updateScreenShareButton(false);
            showToast('🖥️ Screen sharing ended');
          });
          updateScreenShareButton(isSharing);
          showToast(isSharing ? '🖥️ Screen sharing started!' : '🖥️ Screen sharing stopped');
        } catch (err) {
          console.error('Screen sharing error:', err);
          updateScreenShareButton(false);
          showToast('⚠️ Could not start screen sharing');
        }
      });
    }

    // Stop Screen Share button on the live preview floating card
    if (btnStopScreenPreview) {
      btnStopScreenPreview.addEventListener('click', async () => {
        await window.webRTCManager.stopScreenShare();
        updateScreenShareButton(false);
        showToast('🖥️ Screen sharing stopped');
      });
    }

    btnVolumeBoost.addEventListener('click', () => {
      isVolumeBoosted = !isVolumeBoosted;
      if (window.soundEngine) {
        window.soundEngine.setVolumeBoost(remoteVideo, isVolumeBoosted);
      }
      updateControlButtons();
      showToast(isVolumeBoosted ? '🔊 Audio Volume Boosted 2.5x!' : '🔉 Normal Audio Level');
    });

    btnToggleCaptions.addEventListener('click', () => {
      isCaptionsActive = !isCaptionsActive;
      window.liveCaptionsManager.toggleCaptions(isCaptionsActive);
      showToast(isCaptionsActive ? '💬 Live Subtitles Enabled' : 'Live Subtitles Disabled');
    });

    btnHelpCaregiver.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playHelpAlert();
      window.webRTCManager.broadcastData('helper-alert', {});
      showToast('🚨 Help Alert Sent to Family Members!');
    });

    // Hang Up Button opens the in-app confirmation modal
    btnEndCall.addEventListener('click', () => {
      modalHangup.style.display = 'flex';
    });

    btnModalCancel.addEventListener('click', () => {
      modalHangup.style.display = 'none';
    });

    btnModalConfirm.addEventListener('click', () => {
      hangUpCallNow();
    });

    modalHangup.addEventListener('click', (e) => {
      if (e.target === modalHangup) {
        modalHangup.style.display = 'none';
      }
    });

    // Kids Tool Bar Buttons
    btnToolDraw.addEventListener('click', () => {
      isDrawingActive = !isDrawingActive;
      drawingCanvas.classList.toggle('active', isDrawingActive);
      drawingToolbar.style.display = isDrawingActive ? 'flex' : 'none';
      btnToolDraw.classList.toggle('active', isDrawingActive);
    });

    btnToolStickers.addEventListener('click', () => {
      const stickers = ['none', 'party', 'crown', 'glasses', 'cat', 'space'];
      const currentIndex = stickers.indexOf(window.videoStickersManager.currentSticker);
      const nextSticker = stickers[(currentIndex + 1) % stickers.length];
      window.videoStickersManager.setSticker(nextSticker);
      showToast(`🎭 Sticker: ${nextSticker.toUpperCase()}`);
    });

    btnToolSoundboard.addEventListener('click', () => {
      isSoundboardActive = !isSoundboardActive;
      emojiTray.style.display = isSoundboardActive ? 'flex' : 'none';
      btnToolSoundboard.classList.toggle('active', isSoundboardActive);
    });

    // Drawing Color Picker & Tools
    document.querySelectorAll('.color-dot').forEach((dot) => {
      dot.addEventListener('click', (e) => {
        const color = e.target.getAttribute('data-color');
        window.sharedCanvasManager.setColor(color);
      });
    });

    document.getElementById('btn-clear-canvas').addEventListener('click', () => {
      window.sharedCanvasManager.clearCanvas(true);
    });

    // Emoji Soundboard Click
    document.querySelectorAll('.emoji-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const emoji = btn.getAttribute('data-emoji');
        sendReaction(emoji);
      });
    });
  }

  // Start Application
  init();
});
