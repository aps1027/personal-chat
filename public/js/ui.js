const changeActiveStatus_UI = (user, status) => {
  $(`[data-id="${user}"] .status`).empty();
  $(`[data-id="${user}"] .status`).append(
    `<i class="fa fa-circle ${status}"></i> ${status}`
  );
};

const showSingleMessage_UI = (from, message) => {
  let lastMessageClassList = $(".chat-history ul li div").last().attr("class");
  let classList = `message ${
    from === CURRENT_USER_ID ? "my-message float-right" : "other-message"
  }`;
  $("#js_chat_messages ul").append(
    `<li class="clearfix">
                  <div class="${
                    lastMessageClassList &&
                    lastMessageClassList.includes(classList)
                      ? classList
                      : classList + " mt-2"
                  }">
                      ${message}</div>
              </li>`
  );

  $("#js_chat_messages").scrollTop($("#js_chat_messages ul")[0].scrollHeight);
};

const showNoti_UI = (room) => {
  $(`#${room._id} .noti`).remove();
  $(`#${room._id}`).append(`
                  <div class="noti badge badge-light float-right m-2 text-danger" 
                    style="font-size: 18px;">
                      <i class="fas fa-bell"></i>
                  </div>`);
};

const showOrHideCallingModal_UI = (show = false, id, name, image) => {
  $("#js_calling_modal").remove();
  if (show) {
    $("#js_container").append(`
      <div class="calling card bg-light" id="js_calling_modal">
        <div class="card-body">
            <div class="target-profile text-center m-4">
                <img src="${image}" alt="avatar" referrerpolicy="no-referrer" />
                <div class="m-2">
                    <h2>${name}</h2>
                </div>
                <div>
                    <h5>Calling...</h5>
                </div>
                <div class="m-4">
                    <a class="btn btn-danger hangup-btn" onclick="cancelCall('${id}')">
                        <i class="fa fa-phone"></i>
                    </a>
                </div>
            </div>
        </div>
      </div>
    `);
  }
};

const showOrHideCallRequestModel_UI = (
  show = false,
  id,
  name,
  image,
  acceptCallHandler,
  rejectCallHandler
) => {
  $("#js_call_request_modal").remove();
  if (show) {
    $("#js_container").append(`
      <div class="call-request card bg-light" id="js_call_request_modal">
        <div class="card-body">
            <div class="target-profile text-center m-4">
                <img src="${image}" alt="avatar" referrerpolicy="no-referrer" />
                <div class="m-2">
                    <h2>${name}</h2>
                </div>
                <div>
                    <h5>is calling to you</h5>
                </div>
                <div class="row my-4 mx-2">
                <a class="btn btn-success accept-btn mr-3" id="js_call_accepted">
                        Accept
                    </a>
                    <a class="btn btn-danger reject-btn" id="js_call_rejected">
                        <i class="fa fa-phone"></i>
                    </a>
                </div>
            </div>
        </div>
      </div>
    `);

    $("#js_call_accepted").on("click", acceptCallHandler);
    $("#js_call_rejected").on("click", rejectCallHandler);
  }
};

const createUserCard_UI = (user, room) => {
  return `<li ${room ? `id="${room._id}"` : ""} data-id="${
    user._id
  }" class="clearfix" onclick="showChat('${user._id}', this)">
                      <img src="${
                        user.image
                      }" alt="avatar" referrerpolicy="no-referrer" />
                      <div class="about">
                          <div class="name">${user.displayName}</div>
                          <div class="status">
                              ${
                                user.connected
                                  ? '<i class="fa fa-circle online"></i> online'
                                  : '<i class="fa fa-circle offline"></i> offline'
                              }
                          </div>
                      </div>
                  </li>`;
};

const showChatHeader_UI = (user) => {
  $("#js_chat_header").remove();
  $("#js_chat").append(`<div id="js_chat_header" class="chat-header clearfix">
              <div class="row">
                  <div class="col-lg-6" data-id="${user._id}">
                      <img src="${
                        user.image
                      }" alt="avatar" referrerpolicy="no-referrer" />
                      <div class="chat-about">
                          <div class="name">${user.displayName}</div>
                          <div class="status">
                              ${
                                user.connected
                                  ? '<i class="fa fa-circle online"></i> online'
                                  : '<i class="fa fa-circle offline"></i> offline'
                              }
                          </div>
                      </div>
                  </div>
                  
                  <div class="col-lg-6">
                      <div class="float-right">
                          <a class="btn badge badge-light p-3 rounded-circle" id="js_video_call"
                              onclick="callVideo('${user._id}', '${
    user.displayName
  }', '${user.image}')">
                                  <i class="fa fa-video"></i>
                          </a>
                      </div>
                  </div>
              </div>
          </div>`);
};

const showChatMessages_UI = (messages) => {
  $("#js_chat_messages").remove();
  $("#js_chat").append(
    `<div class="chat-history" id="js_chat_messages"><ul class="m-b-0"></ul></div>`
  );
  messages.forEach((message) => {
    showSingleMessage_UI(message.from, message.text);
  });
};

const showMessageBox_UI = (user, room) => {
  $("#js_chat_message_box").remove();
  $("#js_chat")
    .append(`<div class= "chat-message clearfix" id="js_chat_message_box">
              <form onsubmit="sendMessage('${user._id}', '${room._id}')">
              <div class="input-group mb-0">
                  <div class="input-group-prepend">
                      <button type="submit" class="input-group-text"><i class="fa fa-paper-plane"></i></button>
                  </div>
                  <input type="text" class="form-control" placeholder="Enter text here..." id="js_message" autocomplete="off" />
              </div>
              </form>
          </div > `);
};

const showOrHideCallSection_UI = (show = true) => {
  if (show) {
    $("#js_call_section").show();
    $("#js_message_section").hide();
  } else {
    $("#js_call_section").hide();
    $("#js_message_section").show();
  }
};

const showOrHideScreenSharing_UI = (show = true) => {
  if (show) {
    $("#js_screen_share_status").show();
  } else {
    $("#js_screen_share_status").hide();
  }
};
