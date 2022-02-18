const defaultConstraints = {
  audio: true,
  video: true,
};

const configuration = {
  iceServers: [
    {
      url: "stun:global.stun.twilio.com:3478?transport=udp",
      urls: "stun:global.stun.twilio.com:3478?transport=udp",
    },
    {
      url: "turn:global.turn.twilio.com:3478?transport=udp",
      username:
        "4c033d765307fa9084b85f0529a9b3b1b538bb7e9bfa506d8e47be3e90dc5392",
      urls: "turn:global.turn.twilio.com:3478?transport=udp",
      credential: "N3ZkYsI5SWcPtmHUyya41aBgXq/SfEZaKDSVfs9NdQ8=",
    },
    {
      url: "turn:global.turn.twilio.com:3478?transport=tcp",
      username:
        "4c033d765307fa9084b85f0529a9b3b1b538bb7e9bfa506d8e47be3e90dc5392",
      urls: "turn:global.turn.twilio.com:3478?transport=tcp",
      credential: "N3ZkYsI5SWcPtmHUyya41aBgXq/SfEZaKDSVfs9NdQ8=",
    },
    {
      url: "turn:global.turn.twilio.com:443?transport=tcp",
      username:
        "4c033d765307fa9084b85f0529a9b3b1b538bb7e9bfa506d8e47be3e90dc5392",
      urls: "turn:global.turn.twilio.com:443?transport=tcp",
      credential: "N3ZkYsI5SWcPtmHUyya41aBgXq/SfEZaKDSVfs9NdQ8=",
    },
  ],
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
  const localStream = getState().localStream;

  for (const track of localStream.getTracks()) {
    peerConnection.addTrack(track, localStream);
  }
};

const sendPreOffer = (calleePersonalCode) => {
  connectedUserDetails = {
    socketId: calleePersonalCode,
  };
  const data = {
    calleePersonalCode,
  };

  setCallState("CALL_UNAVAILABLE");

  console.log("emmiting to server pre offer event");
  sendPreOffer_WSS(data);
};

const sendCancelPreoffer = (calleePersonalCode) => {
  setCallState("CALL_AVAILABLE");
  const data = {
    calleePersonalCode,
  };
  sendCancelPreOffer_WSS(data);
};

const checkCallPossibility = () => {
  const callState = getState().callState;

  if (callState === "CALL_AVAILABLE") {
    return true;
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

const handleCameraAccess = () => {
  navigator.permissions.query({ name: "camera" }).then((res) => {
    if (res.state === "granted") {
      setTimeout(() => {
        createPeerConnection();
        muteMic_UI(false);
        muteVideo_UI(false);
        changeRemoteMicStatus_UI(false);
        changeRemoteVideoStatus_UI(false);
        sendPreOfferAnswer("CALL_ACCEPTED");
        showOrHideCallSection_UI();
        showOrHideCallRequestModel_UI();
      }, 1000);
    } else if (res.state === "prompt") {
      handleCameraAccess();
    } else {
      alert("Please granted Camera Permission");
    }
  });
};

const acceptCallHandler = () => {
  console.log("call accepted");

  getLocalPreview();
  handleCameraAccess();
};

const setIncomingCallsAvailable = () => {
  setCallState("CALL_AVAILABLE");
};

const rejectCallHandler = () => {
  console.log("reject accepted");
  setIncomingCallsAvailable();
  sendPreOfferAnswer("CALL_REJECTED");
  showOrHideCallRequestModel_UI();
};

const handlerPreOffer = (data) => {
  const { callerSocketId, callerName, callerImg } = data;

  if (!checkCallPossibility()) {
    return sendPreOfferAnswer("CALL_UNAVAIABLE", callerSocketId);
  }

  connectedUserDetails = {
    socketId: callerSocketId,
  };

  setCallState("CALL_UNAVAILABLE");

  console.log("caling ....");
  showOrHideCallRequestModel_UI(
    true,
    callerSocketId,
    callerName,
    callerImg,
    acceptCallHandler,
    rejectCallHandler
  );
};

const stopStreamedVideo = (stream) => {
  const tracks = stream.getTracks();

  tracks.forEach(function (track) {
    track.stop();
  });
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

const handlerCancelPreOffer = () => {
  setIncomingCallsAvailable();
  showOrHideCallRequestModel_UI();
};

const handlerPreOfferAnswer = (data) => {
  const { preOfferAnswer } = data;

  if (preOfferAnswer === "CALL_UNAVAILABLE") {
    setIncomingCallsAvailable();
    alert("Call unavailable");
  }

  if (preOfferAnswer === "CALL_REJECTED") {
    setIncomingCallsAvailable();
    showOrHideCallingModal_UI();
    stopStreamedVideo(getState().localStream);
  }

  if (preOfferAnswer === "CALL_ACCEPTED") {
    createPeerConnection();
    muteMic_UI(false);
    muteVideo_UI(false);
    changeRemoteMicStatus_UI(false);
    changeRemoteVideoStatus_UI(false);
    sendWebRTCOffer();
    showOrHideCallSection_UI();
    showOrHideCallingModal_UI();
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

const handleCancelCalling = () => {
  stopStreamedVideo(getState().localStream);
};

const closePeerConnectionAndResetState = () => {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  // active mic and camera
  stopStreamedVideo(getState().localStream);
  if (getState().screenSharingStream) {
    stopStreamedVideo(getState().screenSharingStream);
  }
  setScreenSharingActive(false);
  setScreenSharingStream(null);
  showOrHideScreenSharing_UI(false);
  showOrHideCallSection_UI(false);
  setIncomingCallsAvailable();
  connectedUserDetails = null;
};

let screenSharingStream;

const endStopScreenSharing = (screenSharingActive) => {
  const localStream = getState().localStream;
  const senders = peerConnection.getSenders();

  const sender = senders.find((sender) => {
    return sender.track.kind === localStream.getVideoTracks()[0].kind;
  });

  if (sender) {
    sender.replaceTrack(localStream.getVideoTracks()[0]);
  }

  getState()
    .screenSharingStream.getTracks()
    .forEach((track) => track.stop());

  setScreenSharingActive(!screenSharingActive);
  showOrHideScreenSharing_UI(false);
};

const switchBetweenCameraAndScreenSharing = async (screenSharingActive) => {
  if (screenSharingActive) {
    endStopScreenSharing(screenSharingActive);
  } else {
    console.log("switching for screen sharing");
    try {
      screenSharingStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      setScreenSharingStream(screenSharingStream);

      // replace track which sender is sending
      const senders = peerConnection.getSenders();

      const sender = senders.find((sender) => {
        return (
          sender.track.kind === screenSharingStream.getVideoTracks()[0].kind
        );
      });

      if (sender) {
        sender.replaceTrack(screenSharingStream.getVideoTracks()[0]);
      }

      setScreenSharingActive(!screenSharingActive);
      showOrHideScreenSharing_UI();

      // ui.updateLocalVideo(screenSharingStream);

      screenSharingStream.getVideoTracks()[0].addEventListener("ended", () => {
        endStopScreenSharing(screenSharingActive);
      });
    } catch (err) {
      console.error(
        "error occured when trying to get screen sharing stream",
        err
      );
    }
  }
};

const handleMutingCamera = () => {
  const localStream = getState().localStream;
  const videoTrack = localStream
    .getTracks()
    .find((track) => track.kind === "video");
  if (videoTrack.enabled) {
    videoTrack.enabled = false;
    muteVideo_UI(true);
    sendMutingCameraStatus_WSS({
      calleePersonalCode: connectedUserDetails.socketId,
      mute: true,
    });
  } else {
    videoTrack.enabled = true;
    muteVideo_UI(false);
    sendMutingCameraStatus_WSS({
      calleePersonalCode: connectedUserDetails.socketId,
      mute: false,
    });
  }
};

const handleMutingMic = () => {
  const localStream = getState().localStream;
  const audioTrack = localStream
    .getTracks()
    .find((track) => track.kind === "audio");
  if (audioTrack.enabled) {
    audioTrack.enabled = false;
    muteMic_UI(true);
    sendMutingMicStatus_WSS({
      calleePersonalCode: connectedUserDetails.socketId,
      mute: true,
    });
  } else {
    audioTrack.enabled = true;
    muteMic_UI(false);
    sendMutingMicStatus_WSS({
      calleePersonalCode: connectedUserDetails.socketId,
      mute: false,
    });
  }
};
