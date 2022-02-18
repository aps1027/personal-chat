const socket = io();

socket.on("private-message", ({ message, from, roomId }) => {
  if (roomId === getState().roomId) {
    showSingleMessage_UI(from, message);
  }
});

socket.on("user-disconnected", ({ user }) => {
  changeActiveStatus_UI(user, "offline");
});

socket.on("user-connected", ({ user }) => {
  changeActiveStatus_UI(user, "online");
});

socket.on("show-noti", ({ room, user, noti }) => {
  let room_ids = [];
  $("#js_search_result")
    .find("li")
    .each(function () {
      room_ids.push(this.id);
    });

  if (!room_ids.includes(room._id)) {
    $("#js_search_result").append(createUserCard_UI(user, room));
  }

  if (room._id !== getState().roomId) {
    showNoti_UI(room);
    const msgNoti = new Notification("Personal Chat", {
      body: "You have new messages.",
      icon: "img/logo.png",
    });

    sendSaveNoti_WSS(1, room._id, user._id, CURRENT_USER_ID);
  }
});

socket.on("cancel-pre-offer", (data) => {
  handlerCancelPreOffer(data);
});

socket.on("pre-offer", (data) => {
  handlerPreOffer(data);
});

socket.on("pre-offer-answer", (data) => {
  handlerPreOfferAnswer(data);
});

socket.on("webRTC-signaling", (data) => {
  switch (data.type) {
    case "OFFER":
      handlerWebRTCOffer(data);
      break;
    case "ANSWER":
      handlerWebRTCAnswer(data);
      break;
    case "ICE_CANDIDATE":
      handleWebRTCCandidate(data);
      break;
    default:
      return;
  }
});

socket.on("user-hanged-up", () => {
  handlerConnectedUserHangedUp();
});

socket.on("mute-mic", (data) => {
  changeRemoteMicStatus_UI(data.mute);
});


socket.on("mute-camera", (data) => {
  changeRemoteVideoStatus_UI(data.mute);
});

const sendUserConnect_WSS = () => {
  socket.emit("user-connect", {
    userId: CURRENT_USER_ID,
  });
};

const sendTextMessage_WSS = (message, roomId, from, to) => {
  socket.emit("send-message", {
    message: message,
    roomId: roomId,
    from: from,
    to: to,
  });
};

const sendSelectRoom_WSS = (roomId) => {
  socket.emit("select-room", {
    roomId: roomId,
  });
};

const sendSaveNoti_WSS = (type, roomId, from, to) => {
  socket.emit("save-noti", {
    type: type, // 1 is for message, 2 is for call
    roomId: roomId,
    from: from,
    to: to,
  });
};
const sendCancelPreOffer_WSS = (data) => {
  socket.emit("cancel-pre-offer", data);
}
const sendPreOffer_WSS = (data) => {
  socket.emit("pre-offer", data);
};

const sendPreOfferAnswer_WSS = (data) => {
  socket.emit("pre-offer-answer", data);
};

const sendDataUsingWebRTCSignaling_WSS = (data) => {
  socket.emit("webRTC-signaling", data);
};

const sendUserHangedUp_WSS = (data) => {
  socket.emit("user-hanged-up", data);
};

const sendMutingCameraStatus_WSS = (data) => {
  socket.emit("mute-camera", data);
}

const sendMutingMicStatus_WSS = (data) => {
  socket.emit("mute-mic", data);
}