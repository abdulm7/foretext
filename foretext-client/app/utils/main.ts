const servers = {
    iceServers: [
        { urls: ["stun:stun0.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
    ],
    iceCandidatePoolSize: 10,
};

const peerConnection = new RTCPeerConnection(servers);
let localStream = null;
let remoteStream = null;

