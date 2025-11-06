import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

const servers = {
  iceServers: [
    {
      urls: ["stun:stun0.l.google.com:19302", "stun:stun1.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

const peerConnection = new RTCPeerConnection(servers);
let localStream = null;
let remoteStream = null;

// Create offer and save to Firestore
export async function createOffer(): Promise<string> {
  const roomRef = doc(collection(db, "rooms"));
  const roomId = roomRef.id;
  

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      // TO DO: Save candidate to Firestore
    }
  };

  const offer = { type: "offer", sdp: "offer-sdp-data" }; // Placeholder

  await setDoc(roomRef, { offer });

  return roomId;
}

// Get offer from Firestore
export async function getOffer(roomId: string) {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnapshot = await getDoc(roomRef);

  if (!roomSnapshot.exists()) {
    throw new Error("Room does not exist");
  }

  return roomSnapshot.data().offer;
}

// Create and save answer to Firestore
export async function createAnswer(roomId: string) {
  const answer = { type: "answer", sdp: "answer-sdp-data" }; // Placeholder

  const roomRef = doc(db, "rooms", roomId);
  await updateDoc(roomRef, { answer });
}

// Listen for answer
export function listenForAnswer(
  roomId: string,
  callback: (answer: any) => void
) {
  const roomRef = doc(db, "rooms", roomId);

  return onSnapshot(roomRef, (snapshot) => {
    const data = snapshot.data();
    if (data?.answer) {
      callback(data.answer);
    }
  });
}
