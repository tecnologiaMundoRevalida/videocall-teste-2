"use client"

import { useEffect, useRef } from 'react';
import { Socket, io } from 'socket.io-client';

export default function Home() {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const socketRef = useRef();

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('https://web-socket-mundorevalida.com:3000',{autoConnect: false,secure:false});

    socketRef.current.auth = {user_id: '1234528'}
    socketRef.current.connect();

    socketRef.current.emit('joinRoom', {training: '20', id: '123452'});
    // Access user's camera
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
        
        // Emit 'offer' event
        const peerConnection = new RTCPeerConnection(
          {
            iceServers: [
              {
                urls: "stun:stun.l.google.com:19302"
              }
            ]
          }
        );
        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream);
        });

        // peerConnection.createOffer()
        //   .then((offer) => peerConnection.setLocalDescription(offer))
        //   .then(() => {
        //     socketRef.current.emit('offer', {offer:peerConnection.localDescription,room:'20'});
        //   });

        // Listen for 'offerReceived' event
        socketRef.current.on('offerReceived', (offer) => {
          peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            peerConnection.createAnswer()
            .then((answer) => peerConnection.setLocalDescription(answer))
            .then(() => {
              socketRef.current.emit('answer', {answer:peerConnection.localDescription,room:'20'});
            });
            // peerConnection.setLocalDescription(new RTCSessionDescription(peerConnection.localDescription));
        });
        
        // Listen for 'answer' event
        // socketRef.current.on('answer', (answer) => {
        //   peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        // });

        // Listen for 'ice-candidate' event
        socketRef.current.on('iceCandidateReceived', (candidate) => {
          peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        });

        // Create answer and emit 'answer' event
        // peerConnection.onicecandidate = (event) => {
        //   if (event.candidate) {
        //     socketRef.current.emit('ice-candidate', event.candidate);
        //   }
        // };

        // peerConnection.ontrack = (event) => {
        //   remoteVideoRef.current.srcObject = event.streams[0];
        // };
      })
      .catch((error) => console.error('Error accessing camera:', error));
  }, []);

  return (
    <div>
      <h1>WebRTC Video Call</h1>
      <video ref={localVideoRef} autoPlay muted />
      <video ref={remoteVideoRef} autoPlay />
    </div>
  );
}