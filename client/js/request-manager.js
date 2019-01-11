/**
 * @since 1.0.0
 * @author Ismaele Benbachir
 *
 * @type {{registerUser: sendToServer.registerUser, loginUser: sendToServer.loginUser, logout: sendToServer.logout, joinRoom: sendToServer.joinRoom}}
 */
sendToServer = {
    /**
     * Send information to server for registration
     * Use of XMLHttpRequest
     * @param username {string}
     * @param password {string}
     */

    registerUser: () => {
        let username = document.getElementById('r_username').value,
            password = document.getElementById('r_password').value;
        $('input[type="text"]').val('');
        $('input[type="password"]').val('');
        let url = "http://localhost:3000/register-user";

        let data = {};
        data.username = username;
        data.password = password;
        let json = JSON.stringify(data);

        let xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
        xhr.onload = function () {
            if(this.responseText === 'Done'){
                registrationSuccess('Successfully Registered');
            } else {
                registrationError(this.response);
            }
        };
        xhr.send(json);
    },

    /**
     * Send information to server for login
     * Use of XMLHttpRequest
     * @param username {string}
     * @param password {string}
     */

    loginUser: () => {
        let username = document.getElementById('username').value,
            password = document.getElementById('password').value;

        let url = "http://localhost:3000/login-user";

        let data = {};
        data.username = username;
        data.password = password;
        let json = JSON.stringify(data);

        let xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        xhr.onload = function () {
            let response = JSON.parse(this.response);
            console.log(this.response);
            if (response !== "Username non trovato" && response !== "Password non corretta" && response !== "Utente già connesso") {
                loginSuccess(response);
            } else {
                loginError(this.responseText);
            }
        };
        xhr.send(json);
    },

    /**
     * Send information to server for logout
     * Use of XMLHttpRequest for session
     */

    logout: () =>{
        let url = "http://localhost:3000/logout";

        let xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        xhr.onload = function () {
            location.reload(true);
        };

        xhr.send();
    },
    //TODO Da cancellare
    /*
    requestUser: () =>{
        let xhr = new XMLHttpRequest();
        let url = "http://localhost:3000/request-user";
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        xhr.onload = function () {
            loginSuccess(this.response);
        };
        xhr.send();
    },*/

    /**
     * Request to join a room in server
     * @param room {string}
     */

    joinRoom: (room) => {
        let data = {
            user: window.user,
            room: room
        };
        socket.emit('request-join-room', data)
    }
};

/**
 * Function message for registration
 * @param msg {string}
 */

function registrationSuccess(msg) {
    let target = document.getElementById('alert-output');
    target.innerHTML = `
    <div class="alert alert-success alert-dismissible fade show" role="alert">
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
        <strong>${msg}</strong>
    </div>
    `;
};

/**
 * Function message for registration error
 * @param msg {string}
 */

function registrationError(msg) {
    let target = document.getElementById('alert-output');
    target.innerHTML = `
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
        <strong>${msg}</strong>
    </div>
    `;
};

/**
 * Function message for login error
 * @param msg {string}
 */

function loginError(msg){
    let target = document.getElementById('alert-output');
    target.innerHTML = `
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
        <strong>${msg}</strong>
    </div>
    `;
};

/**
 * Function message for login
 * @param data {string}
 */

function loginSuccess(data){
    window.user = data;
    $('#app-container').load('game/lobby.html', () => {
            $('#navbarDropdown').html(data.username);
            $('#dropdown-user-level').html(`Livello: ${data.level}`);
            $('#dropdown-user-score').html(`Punti: ${data.score}`);
            $('#dropdown-user-winloserate').html(`W: ${data.win} - L ${data.lose}`);
            if (data.idroom === "0") {
                socket.emit('request-room-status');
            }
        }
    );
};


/**
 * After create room from server
 * Change view in lobby.html
 * @param data {string}
 */

socket.on('request-confirmed', (data) => {
    window.registeredRoom = data;
    changeView("game_screen");
    game.init();
});

/**
 * From server for reconnect-server
 * @param room {string}
 * @param user {} All row from database or session
 * @param id {string}
 */

socket.on('reconnect', (data) => {
    window.user = data.user;

    window.registeredRoom = data.id;
    changeView("game_screen");
    $('#app-container').load('game/lobby.html', () => {
        game.setState({room: data.room});
        game.render();
    });
});

/**
 * Find view with class active;
 * remove active class and use hidden;
 * Give active to view: id=idView from function
 * @since 1.0.0
 * @author Mini Me
 * @param idView {string}
 */
function changeView(idView) {
    /*
    trovare la view che ha classe active
    rimuoverla
    assegnare la hidden
    assegnare active alla view che ha id = idView
    */
    var viewActive = $(".view.active")[0];
    $(viewActive).removeClass("active");
    $(viewActive).addClass("hidden");

    var nextView = $("#" + idView);
    $(nextView).removeClass("hidden");
    $(nextView).addClass("active");
}


