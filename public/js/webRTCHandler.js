const defaultConstraints = {
  audio: true,
  video: true,
};

const configuration = {
  iceServers: [
    {   
      urls: [ "stun:ss-turn2.xirsys.com" ]
    }, 
    {  
      username: "J7VWVgtwsmONXUYCzUwZgCI9rAUZxjrNCSTWv8k-sa-b86VQ5zESBIXrz5ESOzqVAAAAAGIA4DxBdW5nUHlhZVNvbmU=",
      credential: "bb634716-87f4-11ec-8468-0242ac140004",
      urls: [
        "turn:ss-turn2.xirsys.com:80?transport=udp",
        "turn:ss-turn2.xirsys.com:3478?transport=udp",
        "turn:ss-turn2.xirsys.com:80?transport=tcp",
        "turn:ss-turn2.xirsys.com:3478?transport=tcp",
        "turns:ss-turn2.xirsys.com:443?transport=tcp",
        "turns:ss-turn2.xirsys.com:5349?transport=tcp"
      ]
    }
  ]
};

const getLocalPreview = () => {
  navigator.mediaDevices
    .getUserMedia(defaultConstraints)
    .then((stream) => {
      // ui.updateLocalVideo(stream);
      const localVideo = document.getElementById("js_local_video");
      localVideo.srcObject = stream;

      localVideo.addEventListener("loadedmetadata", () => {
        localVideo.play();
      });

      // ui.showVideoCallButtons();
      setCallState("CALL_AVAILABLE");
      setLocalStream(stream);
    })
    .catch((err) => {
      console.log("error occured when trying to get access to camera");
      console.log(err);
    });
};

const createPeerConnection = () => {
  peerConnection = new RTCPeerConnection(configuration);

  peerConnection.onicecandidate = (event) => {
    console.log("getting ice candidates from stun server");
    if (event.candidate) {
      // send our ice candidates to other peer
      let data = {
        connectedUserSocketId: connectedUserDetails.socketId,
        type: "ICE_CANDIDATE",
        candidate: event.candidate,
      };
      sendDataUsingWebRTCSignaling_WSS(data);
    }
  };

  peerConnection.onconnectionstatechange = (event) => {
    if (peerConnection.connectionState === "connected") {
      console.log("successfully connected with other peer");
    }
  };

  // receiving tracks
  const remoteStream = new MediaStream();
  setRemoteStream(remoteStream);
  const remoteVideo = document.getElementById("js_remote_video");
  remoteVideo.srcObject = remoteStream;

  peerConnection.ontrack = (event) => {
    remoteStream.addTrack(event.track);
  };

  // add our stream to peer connection
  if (connectedUserDetails.callType === "VIDEO_PERSONAL_CODE") {
    const localStream = getState().localStream;

    for (const track of localStream.getTracks()) {
      peerConnection.addTrack(track, localStream);
    }
  }
};

const sendPreOffer = (callType, calleePersonalCode) => {
  connectedUserDetails = {
    callType,
    socketId: calleePersonalCode,
  };
  if (callType === "CHAT_PERSONAL_CODE" || callType === "VIDEO_PERSONAL_CODE") {
    const data = {
      callType,
      calleePersonalCode,
    };
    alert("calling...");

    setCallState("CALL_UNAVAILABLE");

    console.log("emmiting to server pre offer event");
    sendPreOffer_WSS(data);
  }
};

const checkCallPossibility = (callType) => {
  const callState = getState().callState;

  if (callState === "CALL_AVAILABLE") {
    return true;
  }

  if (
    (callType === "VIDEO_PERSONAL_CODE" || callType === "VIDEO_STRANGER") &&
    callState === "CALL_AVAILABLE_ONLY_CHAT"
  ) {
    return false;
  }
  return false;
};

const sendPreOfferAnswer = (preOfferAnswer, callerSockerId = null) => {
  const sockerId = callerSockerId
    ? callerSockerId
    : connectedUserDetails.socketId;
  const data = {
    callerSocketId: sockerId,
    preOfferAnswer,
  };
  sendPreOfferAnswer_WSS(data);
};

const acceptCallHandler = () => {
  console.log("call accepted");
  createPeerConnection();
  sendPreOfferAnswer("CALL_ACCEPTED");
  showOrHideCallSection_UI();
};

const setIncomingCallsAvailable = () => {
  const localStream = getState().localStream;
  if (localStream) {
    setCallState("CALL_AVAILABLE");
  } else {
    setCallState("CALL_AVAILABLE_ONLY_CHAT");
  }
};

const rejectCallHandler = () => {
  console.log("reject accepted");
  setIncomingCallsAvailable();
  sendPreOfferAnswer("CALL_REJECTED");
};

const handlerPreOffer = (data) => {
  const { callType, callerSocketId } = data;

  if (!checkCallPossibility()) {
    return sendPreOfferAnswer("CALL_UNAVAIABLE", callerSocketId);
  }

  connectedUserDetails = {
    socketId: callerSocketId,
    callType,
  };

  setCallState("CALL_UNAVAILABLE");

  if (callType === "CHAT_PERSONAL_CODE" || callType === "VIDEO_PERSONAL_CODE") {
    if (confirm("Calling From someone")) {
      acceptCallHandler();
    } else {
      rejectCallHandler();
    }
  }
};

const sendWebRTCOffer = async () => {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  let data = {
    connectedUserSocketId: connectedUserDetails.socketId,
    type: "OFFER",
    offer: offer,
  };
  sendDataUsingWebRTCSignaling_WSS(data);
};

const handlerPreOfferAnswer = (data) => {
  const { preOfferAnswer } = data;

  if (preOfferAnswer === "CALL_UNAVAILABLE") {
    setIncomingCallsAvailable();
    alert("Call unavailable");
  }

  if (preOfferAnswer === "CALL_REJECTED") {
    setIncomingCallsAvailable();
    alert("Call rejected");
  }

  if (preOfferAnswer === "CALL_ACCEPTED") {
    createPeerConnection();
    sendWebRTCOffer();
    showOrHideCallSection_UI();
  }
};

const handlerWebRTCOffer = async (data) => {
  await peerConnection.setRemoteDescription(data.offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  sendDataUsingWebRTCSignaling_WSS({
    connectedUserSocketId: connectedUserDetails.socketId,
    type: "ANSWER",
    answer: answer,
  });
};

const handlerWebRTCAnswer = async (data) => {
  console.log("handling webRTC Answer");
  await peerConnection.setRemoteDescription(data.answer);
};

const handleWebRTCCandidate = async (data) => {
  console.log("handling incoming webRTC candidates");
  try {
    await peerConnection.addIceCandidate(data.candidate);
  } catch (err) {
    console.error(
      "error occured when trying to add received ice candidate",
      err
    );
  }
};

const handleHangUp = () => {
  const data = {
    connectedUserSocketId: connectedUserDetails.socketId,
  };
  sendUserHangedUp_WSS(data);
  closePeerConnectionAndResetState();
};

const handlerConnectedUserHangedUp = () => {
  closePeerConnectionAndResetState();
};

const closePeerConnectionAndResetState = () => {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  // active mic and camera
  if (
    connectedUserDetails.callType === "VIDEO_PERSONAL_CODE" ||
    connectedUserDetails.callType === "CHAT_PERSONAL_CODE"
  ) {
    getState().localStream.getVideoTracks()[0].enabled = true;
    getState().localStream.getAudioTracks()[0].enabled = true;
  }

  showOrHideCallSection_UI(false);
  setIncomingCallsAvailable();
  connectedUserDetails = null;
};
