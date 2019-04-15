/**
 * @since 1.0.0
 * @author Ismaele Benbachir
 *
 * @type {{registerUser: sendToServer.registerUser, loginUser: sendToServer.loginUser, logout: sendToServer.logout, joinRoom: sendToServer.joinRoom}}
 */
var PORT = window.location.port;
//const API_ROOT_AUX = `http://localhost`;
var API_ROOT_AUX = window.location.hostname;
var API_ROOT = `http://${API_ROOT_AUX}:${80}/`;

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
        let url = API_ROOT + "register-user";

        let data = {};
        data.username = username;
        data.password = password;
        let json = JSON.stringify(data);
        if (data.password === "") {
            registrationError("Password required!");
        } else {
            if (data.password.length < 6) {
                registrationError("Password must have length between 6 and 16!");
            } else {
                let xhr = new XMLHttpRequest();
                xhr.open("POST", url, true);
                xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
                xhr.onload = function () {
                    if (this.responseText === 'Done') {
                        registrationSuccess('Successfully Registered');
                    } else {
                        registrationError(this.response);
                    }
                };
                xhr.send(json);
            }
        }
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

        let url = API_ROOT + "login-user";

        let data = {};
        data.username = username;
        data.password = password;
        if (localStorage.roomId) {
            data.id = localStorage.getItem('roomId');
        }
        let json = JSON.stringify(data);

        let xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        xhr.onload = function () {
            let response = JSON.parse(this.response);
            console.log(this.response);
            if (response !== "Username not found" && response !== "Password incorrect" && response !== "User already connected") {
                if (localStorage.roomId) {

                } else {
                    localStorage.setItem('username', data.username);
                    localStorage.setItem('roomId', 0);
                }
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

    logout:
        () => {
            let url = API_ROOT + "logout";

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

    joinRoom:
        (room) => {
            let data = {
                user: window.user,
                room: room
            };
            socket.emit('request-join-room', data)
        },

    requestHandle:
        (room) => {
            document.getElementById('myModalPass').style.display = 'block';
            localStorage.setItem('tmp', room);
        },

    joinPrivateRoom:
        () => {
            document.getElementById('myModalPass').style.display = 'none';
            let data = {
                user: window.user,
                room: localStorage.getItem('tmp'),
                pass: document.getElementById('room-pass-input').value
            };
            localStorage.setItem('tmp', '');
            socket.emit('request-join-private-room', data);
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

function loginError(msg) {
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

function loginSuccess(data) {
    window.user = data;
    window.seen = false;
    localStorage.setItem('roomData', "0");
    localStorage.setItem('roomId', "0");
    $('#app-container').load('game/lobby.html', () => {
            $('#navbarDropdown').html(data.username);
            $('#dropdown-user-level').html(`Livello: ${data.level}`);
            $('#dropdown-user-score').html(`Punti: ${data.score}`);
            $('#dropdown-user-winloserate').html(`W: ${data.win} - L ${data.lose}`);
            if (data.idroom === "0") {
                socket.emit('request-room-status');
            } else {

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
    //clean();
    game = new GameManager(socket);
    window.registeredRoom = data;
    changeView("game_screen");
    //game.setState({room: data});
    //game.render();
    console.log('Init dentro request confirmed');
    game.init();
});

socket.on('request-refused', (data) => {
    document.getElementById('myModalPassError').style.display = "block";
});

socket.on('kicked', () => {
    window.registeredRoom = "0";
    localStorage.setItem('roomId', "0");
    changeView("lobby_screen");
});

socket.on('refuse-for-kick', () => {
    document.getElementById('myModal-refuse-kick').style.display = 'block';
});

/**
 * From server for reconnect-server
 * @param room {string}
 * @param user {} All row from database or session
 * @param id {string}
 */

socket.on('reconnect', (data) => {
    window.user = data.user;
    //var game = new GameManager(socket);
    console.log("RECONNECT");
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

function finish() {
    game = new GameManager(socket);
    socket.emit('request-room-status');
    changeView('lobby_screen');
    document.getElementById('gameoverModal').style.display = "none";
    document.getElementById('myModal-leave').style.display = "none";
    clean();
}

socket.on('finish', () => {
    socket.emit('request-room-status');
    changeView('lobby_screen');
});

function clean() {
    //document.getElementById('gameoverModal').style.display = "none";
    for (let i = 0; i < 5; i++) {
        document.getElementById('cop' + i).style.display = 'none';
        document.getElementById('val' + i).style.display = "none";
        let c = document.getElementById('player' + i);
        c.classList.remove("round");
        c.classList.remove("start");

    }
    for (let i = 1; i < 5; i++) {
        document.getElementById('use' + i).style.display = "none";
    }
    document.getElementById('callCardModal').style.display = "none";
    //document.getElementsByClassName('coppola').style.display = "none";
    let x = document.getElementsByClassName("coppola");
    for (let i = 0; i < x.length; i++) {
        x[i].style.display = 'none';
    }
    document.getElementById('cardsT').style.display = "none";
    document.getElementById('myModal').style.display = "none";
    document.getElementById('myModal3').style.display = "none";
    document.getElementById('myModal-leave').style.display = "none";
    document.getElementById('myModal2').style.display = "none";
    document.getElementById('room-check').style.display = "none";
    document.getElementById('valueHand').style.display = "none";
    document.getElementById('myModal-refuse-kick').style.display = 'none';
    /*document.getElementById('match-result').style.marginLeft = '-117.5px';
    document.getElementById('you-result').style.left = '-235px';*/

    document.getElementById('winnerRound').innerHTML = "Start from: ";
    let giocatore = '';
    let node = document.createElement("LI");
    let textnode = document.createTextNode(giocatore);
    node.appendChild(textnode);
    document.getElementById('winnerRound').appendChild(node);
    document.getElementById('currentPlayer').innerHTML = "It's up to: ";

    let nodo = document.createElement("LI");
    let textnodo = document.createTextNode(giocatore);
    nodo.appendChild(textnodo);
    document.getElementById('currentPlayer').appendChild(nodo);
    document.getElementById('caller-right').innerHTML = "From: ";
    let nume = '';
    let chiamat = '';
    let na = document.createElement("LI");
    let texte = document.createTextNode(chiamat);
    na.appendChild(texte);
    document.getElementById('caller-right').appendChild(na);
    document.getElementById('points').innerHTML = "Points: ";
    let punta = 0;
    console.log(punta);
    let nia = document.createElement("LI");
    let texe = document.createTextNode(punta);
    nia.appendChild(texe);
    document.getElementById('points').appendChild(nia);
    document.getElementById('valueLastHand').innerHTML = "Last hand value: ";
    document.getElementById('valueLastHand').appendChild(nia);
}


