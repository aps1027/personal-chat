let connectedUserDetails;
let peerConnection;

const callVideo = (userId, userName, userImg) => {
  showOrHideCallingModal_UI(true, userId, userName, userImg);
  getLocalPreview();
  sendPreOffer(userId);
};

const cancelCall = (userId) => {
  sendCancelPreoffer(userId);
  handleCancelCalling();
  showOrHideCallingModal_UI();
}

const hangupCall = () => {
  handleHangUp();
};

const shareScreen = () => {
  const screenSharingActive = getState().screenSharingActive;
  switchBetweenCameraAndScreenSharing(screenSharingActive);
}

const muteCamera = () => {
  handleMutingCamera();
}

const muteMic = () => {
  handleMutingMic();
}

const selectTargetUser = (tragetId) => {
  location.href = `/chat/${tragetId}`;
};

const sendMessage = (targetId, roomId) => {
  event.preventDefault();
  if (js_message.value) {
    sendTextMessage_WSS(js_message.value, roomId, CURRENT_USER_ID, targetId);
    showSingleMessage_UI(CURRENT_USER_ID, js_message.value);
    js_message.value = "";
  }
};

const showChat = (targetUserId, element) => {
  $(element).children(".noti").remove();
  $.post(
    "/api/chat-room",
    {
      target_user: targetUserId,
      current_user: CURRENT_USER_ID,
    },
    function (data, status) {
      setRoomId(data.room._id);
      showChatHeader_UI(data.user);
      showChatMessages_UI(data.messages);
      showMessageBox_UI(data.user, data.room);
      sendSelectRoom_WSS(getState().roomId);
    }
  );
};

const showFriendList = () => {
  $("#js_search_result").empty();
  $.get(`/api/chat-room`, function (data, status) {
    data.rooms.forEach((room) => {
      room.members.forEach((user) => {
        $("#js_search_result").append(createUserCard_UI(user, room));
        if (data.notiRooms.includes(room._id)) {
          showNoti_UI(room);
        }
      });
    });
  });
};

sendUserConnect_WSS();

showFriendList();

$("#js_search_user").on("keyup", function () {
  $.post(
    "/api/user-search",
    {
      search_user: this.value,
    },
    function (data, status) {
      $("#js_search_result").empty();
      data.forEach((user) => {
        $("#js_search_result").append(
          CURRENT_USER_ID !== user._id ? createUserCard_UI(user) : ``
        );
      });
    }
  );
});

$("#js_search_cancel").on("click", function () {
  $("#js_search_user").val("");
  showFriendList();
});
