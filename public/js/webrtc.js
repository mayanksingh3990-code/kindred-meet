// KINDRED MEET - WebRTC & Peer Connection Manager

class WebRTCManager {
  constructor() {
    this.localStream = null;
    this.peerConnections = new Map(); // targetUserId -> RTCPeerConnection
    this.dataChannels = new Map(); // targetUserId -> RTCDataChannel
    this.ws = null;
    this.roomId = null;
    this.userId = 'user_' + Math.random().toString(36).substring(2, 9);
    this.userName = 'Friend';
    this.mode = 'senior';
    this.isMuted = false;
    this.isVideoOff = false;

    // Callbacks for UI updates
    this.onRemoteStreamAdded = null;
    this.onRemoteStreamRemoved = null;
    this.onConnectionStatusChanged = null;
    this.onDataMessage = null;

    this.iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.services.mozilla.com' }
    ];
  }

  // Initialize Local Media (Camera & Mic)
  async initLocalMedia(preferVideo = true, preferAudio = true) {
    try {
      if (this.localStream) {
        this.localStream.getTracks().forEach((t) => t.stop());
      }

      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: preferVideo ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false,
        audio: preferAudio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      });

      return { stream: this.localStream, error: null };
    } catch (err) {
      console.warn('getUserMedia failed, trying audio-only or canvas fallback:', err);
      // Fallback: try audio only or video only
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true
        });
        return { stream: this.localStream, error: 'Camera not found, audio only' };
      } catch (audioErr) {
        // Create a blank dummy stream so UI doesn't crash on devices with no webcam/mic
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Camera Preview (No Webcam)', 320, 240);
        const dummyStream = canvas.captureStream(15);
        this.localStream = dummyStream;
        return { stream: this.localStream, error: 'No camera or microphone found' };
      }
    }
  }

  // Connect to Signaling Server
  connectSignaling(onOpenCallback) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.ws = new WebSocket(`${protocol}//${host}`);

    this.ws.onopen = () => {
      console.log('Connected to Kindred Signaling Server');
      if (this.onConnectionStatusChanged) this.onConnectionStatusChanged('connected');
      if (onOpenCallback) onOpenCallback();
    };

    this.ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch (e) {
        return;
      }
      this.handleSignalingMessage(msg);
    };

    this.ws.onclose = () => {
      console.log('Signaling connection closed, retrying in 3s...');
      if (this.onConnectionStatusChanged) this.onConnectionStatusChanged('disconnected');
      setTimeout(() => {
        if (this.roomId) {
          this.connectSignaling(() => this.joinRoom(this.roomId, this.userName, this.mode));
        }
      }, 3000);
    };

    this.ws.onerror = (err) => {
      console.warn('Signaling error:', err);
    };
  }

  joinRoom(roomId, userName, mode) {
    this.roomId = roomId;
    this.userName = userName || 'Friend';
    this.mode = mode || 'senior';

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'join',
        roomId: this.roomId,
        userId: this.userId,
        userName: this.userName,
        mode: this.mode
      }));
    }
  }

  async handleSignalingMessage(msg) {
    const { type, roomId, userId, userName, fromUserId, fromUserName, peers, payload } = msg;

    switch (type) {
      case 'joined-room': {
        // Existing peers in the room: initiate call to each
        if (peers && peers.length > 0) {
          for (const peer of peers) {
            await this.createPeerConnection(peer.userId, peer.userName, true);
          }
        }
        break;
      }

      case 'user-joined': {
        // A new user joined our room: wait for their offer or create peer connection
        await this.createPeerConnection(userId, userName, false);
        if (window.soundEngine) {
          window.soundEngine.playChime();
        }
        break;
      }

      case 'offer': {
        const pc = await this.getOrCreatePeerConnection(fromUserId, fromUserName);
        await pc.setRemoteDescription(new RTCSessionDescription(payload));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        this.sendSignalingMessage({
          type: 'answer',
          targetUserId: fromUserId,
          payload: answer
        });
        break;
      }

      case 'answer': {
        const pc = this.peerConnections.get(fromUserId);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload));
        }
        break;
      }

      case 'ice-candidate': {
        const pc = this.peerConnections.get(fromUserId);
        if (pc && payload) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload));
          } catch (e) {
            console.warn('Error adding ICE candidate:', e);
          }
        }
        break;
      }

      case 'user-left': {
        this.closePeer(userId);
        if (this.onRemoteStreamRemoved) {
          this.onRemoteStreamRemoved(userId, userName);
        }
        break;
      }

      case 'draw-stroke':
      case 'draw-clear':
      case 'reaction':
      case 'live-caption':
      case 'helper-alert':
      case 'remote-mode-change': {
        if (this.onDataMessage) {
          this.onDataMessage({ type, fromUserId, fromUserName, payload });
        }
        break;
      }

      default:
        break;
    }
  }

  async getOrCreatePeerConnection(targetUserId, targetUserName) {
    if (this.peerConnections.has(targetUserId)) {
      return this.peerConnections.get(targetUserId);
    }
    return this.createPeerConnection(targetUserId, targetUserName, false);
  }

  async createPeerConnection(targetUserId, targetUserName, isInitiator) {
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    this.peerConnections.set(targetUserId, pc);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream);
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ice-candidate',
          targetUserId,
          payload: event.candidate
        });
      }
    };

    // Remote Track Handler
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      if (this.onRemoteStreamAdded) {
        this.onRemoteStreamAdded(targetUserId, targetUserName, remoteStream);
      }
    };

    // Setup DataChannel
    if (isInitiator) {
      try {
        const dc = pc.createDataChannel('kindred-chat');
        this.setupDataChannel(targetUserId, dc);
      } catch (e) {
        console.warn('DataChannel creation error:', e);
      }
    } else {
      pc.ondatachannel = (event) => {
        this.setupDataChannel(targetUserId, event.channel);
      };
    }

    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.sendSignalingMessage({
          type: 'offer',
          targetUserId,
          payload: offer
        });
      } catch (e) {
        console.error('Error creating WebRTC offer:', e);
      }
    }

    return pc;
  }

  setupDataChannel(targetUserId, dc) {
    this.dataChannels.set(targetUserId, dc);

    dc.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (this.onDataMessage) {
          this.onDataMessage(msg);
        }
      } catch (e) {
        console.warn('DataChannel parse error:', e);
      }
    };

    dc.onclose = () => {
      this.dataChannels.delete(targetUserId);
    };
  }

  broadcastData(type, payload) {
    const msg = {
      type,
      fromUserId: this.userId,
      fromUserName: this.userName,
      payload
    };
    const jsonStr = JSON.stringify(msg);

    // Send via DataChannels if open
    let sentViaDataChannel = false;
    this.dataChannels.forEach((dc) => {
      if (dc.readyState === 'open') {
        try {
          dc.send(jsonStr);
          sentViaDataChannel = true;
        } catch (e) {}
      }
    });

    // Fallback: broadcast via WebSocket server so everything is 100% reliable
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(jsonStr);
    }
  }

  sendSignalingMessage(msg) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  setAudioEnabled(enabled) {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !!enabled;
      this.isMuted = !audioTrack.enabled;
      return !this.isMuted; // true = audio on
    }
    return false;
  }

  setVideoEnabled(enabled) {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !!enabled;
      this.isVideoOff = !videoTrack.enabled;
      return !this.isVideoOff; // true = video on
    }
    return false;
  }

  toggleAudio() {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.isMuted = !audioTrack.enabled;
      return !this.isMuted; // true = audio on
    }
    return false;
  }

  toggleVideo() {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.isVideoOff = !videoTrack.enabled;
      return !this.isVideoOff; // true = video on
    }
    return false;
  }

  async toggleScreenShare(onStoppedCallback) {
    if (this.isScreenSharing) {
      await this.stopScreenShare();
      if (onStoppedCallback) onStoppedCallback(false);
      return false;
    } else {
      const stream = await this.startScreenShare(() => {
        if (onStoppedCallback) onStoppedCallback(false);
      });
      return !!stream;
    }
  }

  async startScreenShare(onNativeEnded) {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      });

      const screenTrack = this.screenStream.getVideoTracks()[0];

      // Replace video track in all active peer connections
      this.peerConnections.forEach((pc) => {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(screenTrack);
        }
      });

      screenTrack.onended = () => {
        this.stopScreenShare();
        if (onNativeEnded) onNativeEnded();
      };

      this.isScreenSharing = true;
      return this.screenStream;
    } catch (err) {
      console.warn('Screen share cancelled or failed:', err);
      this.isScreenSharing = false;
      return null;
    }
  }

  async stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
    }
    this.isScreenSharing = false;

    // Restore camera video track to peers
    if (this.localStream) {
      const camTrack = this.localStream.getVideoTracks()[0];
      if (camTrack) {
        this.peerConnections.forEach((pc) => {
          const senders = pc.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(camTrack);
          }
        });
      }
    }
  }

  closePeer(targetUserId) {
    const pc = this.peerConnections.get(targetUserId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(targetUserId);
    }
    this.dataChannels.delete(targetUserId);
  }

  leaveCall() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'leave',
        roomId: this.roomId,
        userId: this.userId
      }));
    }

    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.dataChannels.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }

    this.roomId = null;
  }
}

window.webRTCManager = new WebRTCManager();
