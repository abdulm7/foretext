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

// Print doc helper
export async function printDoc(roomId: string) {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnapshot = await getDoc(roomRef);
  
  console.log("Room ID:", roomId);
  if (roomSnapshot.exists()) {
    console.log("Room data:", roomSnapshot.data());
  } else {
    console.log("No such room!");
  }
}

// Get offer from Firestore
export async function getOffer(roomId: string) {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnapshot = await getDoc(roomRef);

  if (!roomSnapshot.exists()) {
    console.log(`Room ${roomId} does not exist. Creating a room and offer...`);
    await createOffer(roomId);

    const newRoomSnapshot = await getDoc(roomRef);
    const newOffer = newRoomSnapshot.data()?.offer;
    if (!newOffer) {
      throw new Error("Failed to create or retrieve the offer.");
    }

    return newOffer;
  }

  const roomData = roomSnapshot.data();
  if (!roomData?.offer) {
    console.log(`Room ${roomId} exists but no offer found. Creating an offer...`);
    await createOffer(roomId);

    const updatedRoomSnapshot = await getDoc(roomRef);
    const updatedOffer = updatedRoomSnapshot.data()?.offer;
    if (!updatedOffer) {
      throw new Error("Failed to create or retrieve the offer.");
    }

    return updatedOffer;
  }

  console.log(`Room ${roomId} exists with an offer. Creating an answer...`);
  await createAnswer(roomId);

  return roomData.offer;
}

// Create offer and save to Firestore
export async function createOffer(roomId: string) {
  const roomRef = doc(db, "rooms", roomId);

  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      const candidateRef = collection(roomRef, "creatorCandidates");
      await setDoc(doc(candidateRef), event.candidate.toJSON());
    }
  };

  const offerDescription = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  await setDoc(roomRef, { offer });
}

// Create and save answer to Firestore
export async function createAnswer(roomId: string) {
  const roomRef = doc(db, "rooms", roomId);

  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      const candidateRef = collection(roomRef, "answerCandidates");
      await setDoc(doc(candidateRef), event.candidate.toJSON());
    }
  };
  const answerDescription = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answerDescription);
  
  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

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
