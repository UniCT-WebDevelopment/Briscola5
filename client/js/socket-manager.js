sendToServer = {
    registerUser: () => {
        let username = document.getElementById('r_username').value,
            password = document.getElementById('r_password').value;
        socket.emit('register-user', {username: username, password: password});
    },
    loginUser: () => {
        let username = document.getElementById('username').value,
            password = document.getElementById('password').value;
        socket.emit('login-user', {username: username, password: password});

    },
    joinRoom: (room) => {
        let data = {
            user: window.user,
            room: room
        }
        socket.emit('request-join-room', data)
    }
};

socket.on('registration-success', (msg) => {
    let target = document.getElementById('alert-output');
    target.innerHTML = `
    <div class="alert alert-success alert-dismissible fade show" role="alert">
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
        <strong>${msg}</strong>
    </div>
    `;
    location.reload();
});
socket.on('registration-error', (msg) => {
    let target = document.getElementById('alert-output');
    target.innerHTML = `
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
        <strong>${msg}</strong>
    </div>
    `;
});
socket.on('login-error', (msg) => {
    let target = document.getElementById('alert-output');
    target.innerHTML = `
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
        <strong>${msg}</strong>
    </div>
    `;
});

socket.on('login-success', (data) => {
    window.user = data;

    $('#app-container').load('game/lobby.html', () => {
            $('#navbarDropdown').html(data.username);
            $('#dropdown-user-level').html(`Livello: ${data.level}`);
            $('#dropdown-user-score').html(`Punti: ${data.score}`);
            $('#dropdown-user-winloserate').html(`W: ${data.win} - L ${data.lose}`);

            socket.emit('request-room-status');
        }
    );
});

socket.on('request-confirmed', (data) => {
    window.registeredRoom = data;
    $('#app-container').load('game/game.html', () => {
        game.init();
    });
})

socket.on('reconnect', (data) => {
    window.user = data.user;

    window.registeredRoom = data.room;
    $('#app-container').load('game/game.html', () => {
        console.dir(data);
        game.setState({room: data.room});
        game.render();
    });
})




