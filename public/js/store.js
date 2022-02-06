let state = {
  roomId: null,
  localStream: null,
  remoteStream: null,
  screenSharingActive: false,
  screenSharingStream: null,
  allowConnectionFromStrangers: false,
  callState: "CALL_AVAILABLE_ONLY_CHAT",
};

const setRoomId = (id) => {
  state = {
    ...state,
    roomId: id,
  };
  console.log(state);
};

const setLocalStream = (stream) => {
  state = {
    ...state,
    localStream: stream,
  };
};

const setAllowConnectionFromStrangers = (allowConnection) => {
  state = {
    ...state,
    allowConnectionFromStrangers: allowConnection,
  };
};

const setScreenSharingActive = (screenSharingActive) => {
  state = {
    ...state,
    screenSharingActive,
  };
};

const setScreenSharingStream = (stream) => {
  state = {
    ...state,
    screenSharingStream: stream,
  };
};

const setRemoteStream = (stream) => {
  state = {
    ...state,
    remoteStream: stream,
  };
};

const setCallState = (callState) => {
  state = {
    ...state,
    callState,
  };
};

const getState = () => {
  return state;
};
