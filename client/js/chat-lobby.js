const chat_send_message = () => {
    let message = document.getElementById('chat_input').value;
    if (message !== '') {
        socket.emit('new_message', {message: message, username: window.user.username});
        document.getElementById('chat_input').value = ''
    }
}

const chat_send_message_room = () => {
    let message = document.getElementById('chat_game_input').value;
    if (message !== '') {
        socket.emit('new_message_room', {message, username: window.user.username, room: window.registeredRoom});
        document.getElementById('chat_game_input').value = ''
    }
}

//Listen on new_message
socket.on("new_message", (data) => {
    const chat = document.getElementById('chat');
    var div = document.createElement('div');
    let date_h_m = new Date();
    let hour = date_h_m.getHours();
    let minutes = date_h_m.getMinutes();
    let hm = hour + ":" + minutes;
    div.innerHTML = " <p class='chat-message'><span style='color: grey'>[" + hm + "]</span> <span style='font-weight: bold'>" + data.username + "</span>: " + data.message + "</p>";
    document.getElementById('chat').appendChild(div.children[0]);
    chat.scrollTop = chat.scrollHeight;
})
//Listen on new_message in room
socket.on("new_message_room", (data) => {
    const chat = document.getElementById('chat-game');
    var tabGame = document.getElementById('chat-game-tab').style.display;
    console.log("VALORE TAB" + tabGame);
    if (tabGame !== 'block') {
        let ci = document.getElementById('chat-button');
        ci.classList.add("prova2");
    }
    var div = document.createElement('div');
    let date_h_m = new Date();
    let hour = date_h_m.getHours();
    let minutes = date_h_m.getMinutes();
    let hm = hour + ":" + minutes;
    div.innerHTML = " <p class='chat-message'><span style='color: grey'>[" + hm + "]</span> <span style='font-weight: bold'>" + data.username + "</span>: " + data.message + "</p>";
    document.getElementById('chat-game').appendChild(div.children[0]);
    chat.scrollTop = chat.scrollHeight;
})


