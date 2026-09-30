// KINDRED MEET - Main Application Controller (Multi-Party & Screen Sharing Enabled)

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

  // Room Header & Layout Elements
  const roomActiveTitle = document.getElementById('room-active-title');
  const participantCountBadge = document.getElementById('participant-count-badge');
  const btnToggleLayout = document.getElementById('btn-toggle-layout');
  const layoutIcon = document.getElementById('layout-icon');
  const layoutLabel = document.getElementById('layout-label');
  const btnRoomCopyLink = document.getElementById('btn-room-copy-link');
  const btnRoomRingAlert = document.getElementById('btn-room-ring-alert');

  // Video Stage & Multi-Party Elements
  const remotePlaceholder = document.getElementById('remote-placeholder');
  const remoteRoomTag = document.getElementById('remote-room-tag');
  const multiVideoGrid = document.getElementById('multi-video-grid');
  const spotlightViewContainer = document.getElementById('spotlight-view-container');
  const spotlightBadgeTitle = document.getElementById('spotlight-badge-title');
  const spotlightVideo = document.getElementById('spotlight-video');
  const spotlightFilmstrip = document.getElementById('spotlight-filmstrip');
  const btnExitSpotlight = document.getElementById('btn-exit-spotlight');

  // Local Self PIP & Screen Preview
  const localPip = document.getElementById('local-pip');
  const localPipVideo = document.getElementById('local-pip-video');
  const screenSharePreviewCard = document.getElementById('screen-share-preview-card');
  const screenSharePreviewVideo = document.getElementById('screen-share-preview-video');
  const btnStopScreenPreview = document.getElementById('btn-stop-screen-preview');

  // Interactive Overlays
  const captionsBanner = document.getElementById('captions-banner');
  const drawingCanvas = document.getElementById('drawing-canvas');
  const videoStickersOverlay = document.getElementById('video-stickers-overlay');
  const emojiTray = document.getElementById('emoji-tray');
  const drawingToolbar = document.getElementById('drawing-toolbar');

  // In-Call Control Buttons
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

  // Multi-Party & Layout State
  const remotePeers = new Map(); // userId -> { userId, userName, stream, isScreenSharing, isSpeaking }
  let currentViewMode = 'grid'; // 'grid' | 'spotlight'
  let spotlightTargetUserId = null;

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

    // Apply pre-call mic and camera choices
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

    renderVideoStage();
    updateControlButtons();
    updateScreenShareButton(false);
    showToast(`🟢 Connected to ${targetRoomName}!`);
  }

  // Multi-Party & Screen Sharing Dynamic Video Stage Renderer
  function renderVideoStage() {
    const totalParticipants = remotePeers.size + 1;
    if (participantCountBadge) {
      participantCountBadge.textContent = totalParticipants === 1 ? '👤 1 in call' : `👥 ${totalParticipants} in call`;
    }

    // If zero remote participants: show friendly waiting placeholder
    if (remotePeers.size === 0) {
      remotePlaceholder.style.display = 'flex';
      multiVideoGrid.style.display = 'none';
      spotlightViewContainer.style.display = 'none';
      localPip.style.display = 'block';
      return;
    }

    remotePlaceholder.style.display = 'none';

    // Check if any peer is sharing screen OR if user selected spotlight mode
    let spotlightPeer = null;
    for (const [userId, peer] of remotePeers) {
      if (peer.isScreenSharing) {
        spotlightPeer = peer;
        break;
      }
    }
    if (!spotlightPeer && spotlightTargetUserId && remotePeers.has(spotlightTargetUserId)) {
      spotlightPeer = remotePeers.get(spotlightTargetUserId);
    }
    if (!spotlightPeer && currentViewMode === 'spotlight' && remotePeers.size > 0) {
      spotlightPeer = remotePeers.values().next().value;
    }

    if (spotlightPeer) {
      // --- SPOTLIGHT / PRESENTATION MODE ---
      multiVideoGrid.style.display = 'none';
      spotlightViewContainer.style.display = 'flex';
      localPip.style.display = 'block';

      spotlightBadgeTitle.textContent = spotlightPeer.isScreenSharing
        ? `🖥️ ${spotlightPeer.userName}'s Shared Screen`
        : `⭐ ${spotlightPeer.userName} (Spotlight)`;

      if (spotlightVideo.srcObject !== spotlightPeer.stream) {
        spotlightVideo.srcObject = spotlightPeer.stream;
        spotlightVideo.play().catch(() => {});
      }

      // Render filmstrip of other participants
      spotlightFilmstrip.innerHTML = '';
      remotePeers.forEach((peer) => {
        if (peer.userId === spotlightPeer.userId) return;
        const thumb = document.createElement('div');
        thumb.className = 'filmstrip-thumb';
        thumb.title = `Spotlight ${peer.userName}`;
        thumb.innerHTML = `
          <video autoplay playsinline muted></video>
          <div class="thumb-badge">${peer.userName}</div>
        `;
        const v = thumb.querySelector('video');
        v.srcObject = peer.stream;
        v.play().catch(() => {});
        thumb.addEventListener('click', () => {
          spotlightTargetUserId = peer.userId;
          renderVideoStage();
        });
        spotlightFilmstrip.appendChild(thumb);
      });
      return;
    }

    // --- MULTI-PARTY GALLERY GRID MODE ---
    spotlightViewContainer.style.display = 'none';
    multiVideoGrid.style.display = 'grid';
    localPip.style.display = 'block';

    const count = remotePeers.size;
    multiVideoGrid.className = `multi-video-grid grid-count-${count > 4 ? 'many' : count}`;

    // Synchronize DOM tiles with remotePeers Map
    const existingTileIds = new Set();
    document.querySelectorAll('.video-tile').forEach((tile) => {
      const uid = tile.getAttribute('data-user-id');
      if (!remotePeers.has(uid)) {
        tile.remove();
      } else {
        existingTileIds.add(uid);
      }
    });

    remotePeers.forEach((peer, userId) => {
      let tile = document.getElementById(`tile-${userId}`);
      if (!tile) {
        tile = document.createElement('div');
        tile.className = 'video-tile';
        tile.id = `tile-${userId}`;
        tile.setAttribute('data-user-id', userId);

        tile.innerHTML = `
          <video autoplay playsinline class="tile-video"></video>
          <div class="tile-badge">
            <span class="badge-status-dot"></span>
            <span class="badge-name">${peer.userName}</span>
            <span class="tile-screen-tag" style="display: none;">🖥️ SCREEN</span>
          </div>
          <button class="tile-pin-btn" type="button" title="Spotlight / Enlarge">⭐</button>
        `;

        const tileVideo = tile.querySelector('video');
        tileVideo.srcObject = peer.stream;
        tileVideo.play().catch(() => {});

        const pinBtn = tile.querySelector('.tile-pin-btn');
        pinBtn.addEventListener('click', () => {
          spotlightTargetUserId = peer.userId;
          currentViewMode = 'spotlight';
          renderVideoStage();
          showToast(`⭐ Spotlight on ${peer.userName}`);
        });

        multiVideoGrid.appendChild(tile);
      } else {
        const v = tile.querySelector('video');
        if (v && v.srcObject !== peer.stream) {
          v.srcObject = peer.stream;
          v.play().catch(() => {});
        }
        const nameEl = tile.querySelector('.badge-name');
        if (nameEl) nameEl.textContent = peer.userName;

        const screenTag = tile.querySelector('.tile-screen-tag');
        if (screenTag) screenTag.style.display = peer.isScreenSharing ? 'inline-flex' : 'none';
      }
    });
  }

  // Setup Signaling Handlers
  function setupSignalingHandlers() {
    window.webRTCManager.onRemoteStreamAdded = (userId, userName, remoteStream) => {
      remotePeers.set(userId, {
        userId,
        userName: userName || 'Family Member',
        stream: remoteStream,
        isScreenSharing: false,
        isSpeaking: false
      });

      renderVideoStage();

      if (window.soundEngine) {
        window.soundEngine.playChime();
        if (isVolumeBoosted) {
          // Boost stream volume if requested
          const audioTrack = remoteStream.getAudioTracks()[0];
          if (audioTrack) {
            const tempAudio = document.createElement('audio');
            tempAudio.srcObject = remoteStream;
            window.soundEngine.setVolumeBoost(tempAudio, true);
          }
        }
      }

      // Voice level active speaker meter for remote peer
      window.soundEngine.setupMicMeter(remoteStream, (level) => {
        const tile = document.getElementById(`tile-${userId}`);
        if (tile) {
          if (level > 15) {
            tile.classList.add('speaking-active');
          } else {
            tile.classList.remove('speaking-active');
          }
        }
      });

      window.deviceNotificationManager.sendDeviceNotification(
        'Family Connected',
        `👋 ${userName || 'A new participant'} joined the call!`,
        '👋'
      );
    };

    window.webRTCManager.onRemoteStreamRemoved = (userId, userName) => {
      remotePeers.delete(userId);
      if (spotlightTargetUserId === userId) {
        spotlightTargetUserId = null;
      }
      renderVideoStage();

      window.deviceNotificationManager.sendDeviceNotification(
        'Call Update',
        `👋 ${userName || 'Participant'} has left the call.`,
        '👋'
      );
    };

    window.webRTCManager.onDataMessage = (data) => {
      const { type, fromUserId, fromUserName, payload } = data;

      switch (type) {
        case 'screen-share-state': {
          const peer = remotePeers.get(fromUserId);
          if (peer) {
            peer.isScreenSharing = !!payload.isSharing;
          }
          if (payload.isSharing) {
            spotlightTargetUserId = fromUserId;
            currentViewMode = 'spotlight';
            showToast(`🖥️ ${fromUserName || 'Presenter'} started sharing screen`);
          } else {
            if (spotlightTargetUserId === fromUserId) {
              spotlightTargetUserId = null;
              currentViewMode = 'grid';
            }
            showToast(`🖥️ ${fromUserName || 'Presenter'} stopped sharing screen`);
          }
          renderVideoStage();
          break;
        }

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

    remotePeers.clear();
    spotlightTargetUserId = null;
    currentViewMode = 'grid';

    if (stopMicMeter) stopMicMeter();

    if (multiVideoGrid) multiVideoGrid.innerHTML = '';
    if (spotlightVideo) spotlightVideo.srcObject = null;
    if (spotlightFilmstrip) spotlightFilmstrip.innerHTML = '';
    if (localPipVideo) localPipVideo.srcObject = null;
    if (previewVideo) previewVideo.srcObject = null;

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
      showToast('📋 Meeting link copied to clipboard! Share it with family & team.');
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

    // Layout Toggle Button (Grid vs Spotlight)
    if (btnToggleLayout) {
      btnToggleLayout.addEventListener('click', () => {
        if (currentViewMode === 'grid') {
          currentViewMode = 'spotlight';
          if (!spotlightTargetUserId && remotePeers.size > 0) {
            spotlightTargetUserId = remotePeers.keys().next().value;
          }
          layoutIcon.textContent = '⭐';
          layoutLabel.textContent = 'Spotlight';
          showToast('⭐ Switched to Spotlight View');
        } else {
          currentViewMode = 'grid';
          spotlightTargetUserId = null;
          layoutIcon.textContent = '🔲';
          layoutLabel.textContent = 'Grid View';
          showToast('🔲 Switched to Grid View');
        }
        renderVideoStage();
      });
    }

    if (btnExitSpotlight) {
      btnExitSpotlight.addEventListener('click', () => {
        currentViewMode = 'grid';
        spotlightTargetUserId = null;
        if (layoutIcon) layoutIcon.textContent = '🔲';
        if (layoutLabel) layoutLabel.textContent = 'Grid View';
        renderVideoStage();
      });
    }

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
        document.querySelectorAll('video').forEach((v) => {
          if (v !== previewVideo && v !== localPipVideo && v !== screenSharePreviewVideo) {
            window.soundEngine.setVolumeBoost(v, isVolumeBoosted);
          }
        });
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
