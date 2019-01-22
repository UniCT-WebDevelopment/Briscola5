/**
 * @since 1.0.0
 * @author Ismaele Benbachir
 **/

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server,{ pingTimeout: 120000, pingInterval: 100000 });
var path = require('path');
var bodyParser = require('body-parser');
var Room = require('./room.js');
var session = require('express-session');
var sessionStore = new session.MemoryStore();

var connectedUsers = [];

const bcrypt = require('bcrypt');

let mysql = require('mysql');

/**
 * @type {Connection}
 */

let connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "webdevprj",
    port: "8846"
});

/**
 * Session Middleware with cookie
 * @type {Function}
 */

var sessionMiddleware = session({
    store: sessionStore,
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true,
    cookie: {
        rolling: true,
        maxAge: 365 * 24 * 60 * 60 * 1000 * 10
    }
});

app.use(sessionMiddleware);

/**
 * Start connection with database
 */

connection.connect(function (err) {
    if (err) throw err;
    console.log(`[DATABASE][INFO] Connesso`);
    let sql = `UPDATE users set idroom ='0'`;
    connection.query(sql, function (err, rows) {
        if (err) {
            console.error(`[DATABASE][ERROR][CONNECT]  ${err}`);
        }
    })
});

var sess;
let RoomState = {};

server.listen(3000);

/**
 * Route
 */

app.get('/', function (req, res) {
    sess = req.session;
    //Control for session
    if (req.session.user) {
        if (req.session.idroom !== '0' && !RoomState[req.session.idroom]) {
            req.session.idroom = '0';
        }
        let user_info = {};
        if (!connectedUsers.find(name => name.username === req.session.user)) {
            user_info.username = req.session.user;
            user_info.sessionId = req.session.id;
            connectedUsers.push(user_info);
        }
        res.sendfile(path.join(__dirname, '../client/game/lobby.html'));
    } else {
        res.sendfile(path.join(__dirname, '../client/index.html'));
    }
});

/**
 * Use in caso of disconnession and riconnection in route /
 * @param idroom
 * @returns {Promise<any>}
 */

function resetTimer(idroom) {
    return new Promise(function (resolve, reject) {
        clearTimeout(RoomState[idroom].time);
        let oldPhase = RoomState[idroom].oldGamePhase;
        RoomState[idroom].changeGamePhase(oldPhase);
        resolve();
    });
}

app.use(express.static(path.join(__dirname, '../client')));

io.use(function (socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.post('/request-user', function (req, res) {
    sess = req.session;
    res.send(sess);
});

app.get('/request-room-modify', function (req, res) {
    req.session.idroom = '0';
});

app.post('/register-user', function (req, res) {
    let password = bcrypt.hashSync(req.body.password, 5);
    let sql = `INSERT INTO users (username, password, level, score, win, lose) VALUES ('${req.body.username}', '${password}', 1, 0, 0, 0)`;
    connection.query(sql, function (err, result) {
        if (err) {
            console.error(`[DATABASE][ERROR][register-user]  ${err}`);
            res.send(err.sqlMessage);
        } else {
            console.log("[DATABASE][INFO] Record inserito");
            res.write("Done");
            res.end();
        }
    });
});

app.post('/login-user', function (req, res) {

    sess = req.session;
    let sql = `SELECT * FROM users WHERE username = '${req.body.username}'`;
    connection.query(sql, function (err, rows) {
        if (err) {
            res.send(err.sqlMessage);
            res.end();
        } else if (!rows.length) {
            res.send(JSON.stringify("Username not found"));
            res.end();
        }
        else if (!bcrypt.compareSync(req.body.password, rows[0].password)) {
                res.send(JSON.stringify("Password incorrect"));
            res.end();
        } else {
            if (connectedUsers.find(name => name.username === req.body.username)) {
                res.send(JSON.stringify("User already connected"));
                res.end();
            } else {
                sess.row = rows[0];
                sess.user = req.body.username;
                if(req.body.id){
                    if (req.body.id !== '0' && !RoomState[req.body.id]) {
                        req.session.idroom = '0';
                    } else {
                        sess.idroom = req.body.id;
                    }
                } else {
                    sess.idroom = "0";
                }
                let user_info = {};
                user_info.username = req.body.username;
                user_info.sessionId = req.session.id;
                connectedUsers.push(user_info);
                res.send(JSON.stringify(rows[0]));
                res.end();
            }
        }
    });
});

app.post('/logout', function (req, res, next) {
    if (req.session) {
        //Remove session from server
        req.session.destroy(function (err) {
            if (err) {
                return next(err);
            } else {
                res.clearCookie('connect.sid');
                res.end();
            }
        });
    }
});

/**
 * Web socket
 */

io.on("connection", (socket) => {

    console.info(`[SOCKET][INFO] Client connesso! [ID=${socket.id}]`);

    //listen on new_message
    socket.on('new_message', (data) => {
        //broadcast the new message
        io.sockets.emit('new_message', {message: data.message, username: data.username});
    })
    //listen on new_message on room
    socket.on('new_message_room', (data) => {
        //broadcast the new message
        io.sockets.in(data.room).emit('new_message_room', {message: data.message, username: data.username});
    })

    /**
     *  Used from game-manager for lobby return
     *  Almost useless currently
     */

    socket.on('return-lobby', (data) => {
        sessionStore.get(socket.request.sessionID, function (err, data) {
            data.idroom = '0';
            sessionStore.sessions[socket.request.sessionID] = JSON.stringify(data);
            socket.emit('login-success', sessionStore.sessions[socket.request.sessionID].user);
        });
    });

    /* LOBBY */

    function createRoom(data) {
        let room = new Room();
        room.rules = data.rules;
        room.name = data.name;
        RoomState[room.id] = room;
        RoomState[room.id].addPlayer({player: data.creator, cards: [], passed: false, mazzo: [], compagno: false});
        socket.join(room.id);
        //socket.username = data.creator.username;
        updateRoom(room.id);
        socket.emit('request-confirmed', room.id);
        emitUpdate(RoomState[data.id], data.id);
        updateClientRoomStatus();
    }

    /**
     * Use for update client room status
     * Copy all rooms and remove ones with  timer
     * @param src
     * @returns {*}
     */

    function copy(src) {
        return Object.assign({}, src);
    }

    function updateClientRoomStatus() {

        let tmp = copy(RoomState);
        for (let roomId in tmp) {
            let room = tmp[roomId];
            if (room.time) delete tmp[roomId];
        }
        socket.emit('update-room-status', tmp);
        socket.broadcast.emit('update-room-status', tmp);
    }

    socket.on('create-room', (data) => {
        createRoom(data);
    });

    socket.on('request-room-status', (data) => {
        socket.username = data;
        updateClientRoomStatus();
    });

    /**
     * From lobby.html if the player was in a room
     */

    socket.on('reconnect-server', (data) => {
        console.log("REDIRECTED");
        socket.join(data.idroom);
        socket.username = data.row.username;
        let IDdisconnesso = RoomState[data.idroom].disconnesso.indexOf(data.row.username);
        if (IDdisconnesso > -1) {
            //console.info('@#@#@#@#@@#@#@#@#@#@#@#@#@#@#@#@#@#@#@#@ -------------------------------> entrato', req.session.user);
            RoomState[data.idroom].disconnesso.splice(IDdisconnesso, 1);
            if (RoomState[data.idroom].disconnesso.length === 0) {
                resetTimer(data.idroom).then(function () {
                    let oldPhase = RoomState[data.idroom].oldGamePhase;
                    RoomState[data.idroom].changeGamePhase(oldPhase);
                    socket.emit('reconnect', {room: RoomState[data.idroom], user: data.row, id: data.idroom});
                    emitUpdate(RoomState[data.idroom], data.idroom);
                })
            }
        } else {
            socket.emit('reconnect', {room: RoomState[data.idroom], user: data.row, id: data.idroom});
            emitUpdate(RoomState[data.idroom], data.idroom);
        }
    });

    /**
     * Update for room in session
     * @param data_room
     */

    function updateRoom(data_room) {
        sessionStore.get(socket.request.sessionID, function (err, data) {
            data.idroom = data_room;
            sessionStore.sessions[socket.request.sessionID] = JSON.stringify(data);
        });
    }

    /**
     * Promise to get room from session with socket
     * @returns {Promise<any>}
     */

    function getRoom() {
        return new Promise(function (resolve, reject) {
            sessionStore.get(socket.request.sessionID, function (err, data) {
                if (data) {
                    resolve(data.idroom);
                }
            });
        });
    }

    socket.on('request-join-room', (data) => {
        if (RoomState[data.room]._playerInside.length < 5) {
            console.log(`REQUEST JOIN ROOM ${data.room}`);
            socket.join(data.room);
            RoomState[data.room].addPlayer({
                player: data.user,
                cards: [],
                passed: false,
                mazzo: [],
                compagno: false
            });
            socket.emit('request-confirmed', data.room);
            updateRoom(data.room);
        }
        emitUpdate(RoomState[data.id], data.id);
        updateClientRoomStatus();
    });

    /* GAME */

    function emitUpdate(data, room) {
        socket.emit('update-game-state', data);
        socket.in(room).emit('update-game-state', data);
    }

    socket.on('request-game-state', (data) => {
        if (RoomState[data].isRoomFull()) {
            RoomState[data].changeGamePhase('start');
            updateRoom(data.room);
        }
        if (RoomState[data].gamePhase === 'start') {
            distCards(data);
        }
        console.log(`[GAME] ${socket.id} requested game state`);

        emitUpdate(RoomState[data], data);
    });

    function distCards(data) {
        let deck = RoomState[data].shuffleDeck();
        RoomState[data].turniDiChiamata = 0;
        RoomState[data].chiamante = 0;
        for (let i = 0; i < 5; i++) {
            RoomState[data].playerInside[i].passed = false;
            RoomState[data].playerInside[i].cards = deck.slice(i * 8, (i + 1) * 8);
        }
        RoomState[data].changeGamePhase('chiamata');
        console.log('[GAME] Distributed Cards');
        emitUpdate(RoomState[data], data);
    }

    function checkDeadLap(roomId) {
        if (RoomState[roomId].rules.giro === true) {
            RoomState[roomId].changeGamePhase('giroMorto');
            emitUpdate(RoomState[roomId], roomId);
        } else {
            RoomState[roomId].changeGamePhase('scegliCarta');
            emitUpdate(RoomState[roomId], roomId);
        }
    }

    function nextCaller(roomId) {
        if (RoomState[roomId].gamePhase === 'chiamata') {
            let tdc = RoomState[roomId].turniDiChiamata;
            //if someone calls 118
            if (RoomState[roomId].chiamata.punti === 118) {
                RoomState[roomId].hand = 0;
                checkDeadLap(roomId);
                return;
            }
            //if everyone rolls on
            let passedCount = 0;
            for (let i = 0; i < 5; i++) {
                if (RoomState[roomId].playerInside[i].passed === true) {
                    passedCount++;
                }
            }
            if (passedCount === 5) {
                RoomState[roomId].changeGamePhase('scegliCarta');
                distCards(roomId);
                console.log("Phase changed in start!!");
                emitUpdate(RoomState[roomId], roomId);
                return;
            }
            //Highlander. The last one who calls
            if (passedCount === 4 && tdc >= 5) {
                let highlander = -1;
                for (let i = 0; i < 5; i++) {
                    if (RoomState[roomId].playerInside[i].passed === false) {
                        highlander = i;
                    }
                }
                RoomState[roomId].chiamante = highlander;
                RoomState[roomId].hand = 0;
                checkDeadLap(roomId);
                return;
            }
            let next = (RoomState[roomId].chiamante + 1) % 5;
            RoomState[roomId].chiamante = next;
            RoomState[roomId].hand = next;
            if (RoomState[roomId].playerInside[next].passed === true) {
                nextCaller(roomId);
            }
            emitUpdate(RoomState[roomId], roomId);
        }
    }

    /**
     * Update points after calls
     * @param id
     * @param punti
     */

    function pointsUpdate(id, punti) {
        console.log('Update points');
        RoomState[id]._chiamata.punti = punti;
    }

    /**
     * From game manager after a call
     */

    socket.on('newCallScore', (data) => {
        pointsUpdate(data.id, data.value);
        RoomState[data.id]._nome = data.user;
        RoomState[data.id].incTDC();
        nextCaller(data.id);
    });

    /**
     * After a roll on from game manager
     */

    socket.on('passTheCall', (data) => {
        let caller = RoomState[data].chiamante;
        RoomState[data].playerInside[caller].passed = true;
        RoomState[data].incTDC();
        nextCaller(data);
    });

    socket.on('clickCard', (data) => {
        let iduser = -1;
        if(RoomState[data.roomId].callTimer === 1){
            clearTimeout(RoomState[data.roomId].time);
        }

        for (let i = 0; i < 5; i++) {
            if (data.giocatore === RoomState[data.roomId].playerInside[i].player.username) {
                iduser = i;
            }
        }
        if (iduser === RoomState[data.roomId].hand) {
            let id = RoomState[data.roomId].playerInside[iduser].cards.indexOf(data.carta);
            RoomState[data.roomId].playerInside[iduser].cards.splice(id, 1);
            RoomState[data.roomId].hand = (RoomState[data.roomId].hand + 1) % 5;
            RoomState[data.roomId].carteTavolo.push(data.carta);
            if (RoomState[data.roomId].carteTavolo.length === 5) {
                if (RoomState[data.roomId].rules.giro === false) {
                    console.log("No 'Giro Morto'!!");
                    taking(data);
                    return;
                } else if (RoomState[data.roomId].briscola === -1) {
                    console.log("First lap of 'Giro morto'!!");
                    //Bad delay
                    setTimeout(() => {
                        choose(data)
                    }, 1000);
                } else {
                    console.log("'Giro Morto'!!");
                    RoomState[data.roomId]._carteTavoloGiroMorto = RoomState[data.roomId]._carteTavolo;
                    taking(data);
                    RoomState[data.roomId].changeGamePhase('gioco');
                }
            }
            emitUpdate(RoomState[data.roomId], data.roomId);
        }
    });

    function choose(data) {
        RoomState[data.roomId]._carteTavoloGiroMorto = RoomState[data.roomId]._carteTavolo;
        RoomState[data.roomId].changeGamePhase('scegliCarta');
        emitUpdate(RoomState[data.roomId], data.roomId);
    }

    socket.on('timer', (data) => {
        if (RoomState[data].timerGame) {

        } else {
            RoomState[data].callTimer = 1;
            io.sockets.in(data).emit('new_message_room', {message: "Timer activated, 10 seconds before the random play", username: "System"});
            RoomState[data].time = setTimeout(() => {
            randomThrow(data);
            }, 10000); //10 secondi prima del lancio automatico
        }
    });

    function randomThrow(room) {
        let iduser = -1;
        let user;
        RoomState[room].callTimer = 0;
        for (let i = 0; i < 5; i++) {
            if (RoomState[room].hand === RoomState[room].playerInside[i].player.username) {
                user = RoomState[room].playerInside[i].player.username;
                iduser = i;
            }
        }

        let val = RoomState[room].hand;
        user = RoomState[room].playerInside[val].player.username;
        iduser = val;

        let cartaIndex = Math.floor((Math.random() * (RoomState[room].playerInside[iduser].cards.length - 1)));
        let carta = RoomState[room].playerInside[iduser].cards[cartaIndex];

        let data = {
            roomId: room,
            carta: carta,
            giocatore: user
        };

        RoomState[room].playerInside[iduser].cards.splice(cartaIndex, 1);
        RoomState[room].hand = (RoomState[data.roomId].hand + 1) % 5;
        RoomState[room].carteTavolo.push(carta);
        if (RoomState[room].carteTavolo.length === 5) {
            taking(data);
        }
        emitUpdate(RoomState[data.roomId], data.roomId);

    }

    socket.on('cardMate', (data) => {
        let room = RoomState[data.roomId];
        room.cartaChiamata = data.carta;
        for (let i = 0; i < room.playerInside.length; i++) {
            for (let j = 0; j < room.playerInside[i].cards.length; j++) {
                if (room.playerInside[i].cards[j] === room.cartaChiamata) {
                    room.compagno = i;
                    room.playerInside[i].compagno = true;
                }
            }
        }

        room.briscola = Math.floor(room.cartaChiamata / 10);
        if (room.rules.giro === true) {
            taking(data);
        } else {
            room.changeGamePhase('gioco');
        }
        emitUpdate(room, data.roomId);
    });

    function taking(data) {
        let numero = RoomState[data.roomId].carteTavolo,
            ordine = RoomState[data.roomId].ordine;
        for (let i = 0; i < numero.length; i++) {
            let valore = numero[i],
                val = valore % 10;
        }
        let cartaVincente = 0,
            posizione = 0,
            brisc = false,
            seme = 0,
            carteTavolo = RoomState[data.roomId].carteTavolo,

            briscola = RoomState[data.roomId].briscola;
        if (Math.floor(carteTavolo[0] / 10) === briscola) {
            cartaVincente = (carteTavolo[0]) % 10;
            for (let i = 1; i < carteTavolo.length; i++) {
                if (Math.floor(carteTavolo[i] / 10) === briscola) {
                    let c = carteTavolo[i] % 10;
                    if (ordine.indexOf(cartaVincente) < ordine.indexOf(c)) {
                        cartaVincente = c;
                        posizione = i;
                    }
                }
            }
        } else {
            seme = Math.floor(carteTavolo[0] / 10);
            cartaVincente = carteTavolo[0] % 10;
            for (let i = 1; i < carteTavolo.length; i++) {
                if (Math.floor(carteTavolo[i] / 10) === briscola && brisc === false) {
                    cartaVincente = carteTavolo[i] % 10;
                    brisc = true;
                    posizione = i;
                } else {
                    if (Math.floor(carteTavolo[i] / 10) === briscola && brisc === true) {
                        let c = (carteTavolo[i]) % 10;
                        if (ordine.indexOf(cartaVincente) < ordine.indexOf(c)) {
                            cartaVincente = c;
                            posizione = i;
                        }
                    } else {
                        if (Math.floor(carteTavolo[i] / 10) === seme && brisc === false) {
                            let c = carteTavolo[i] % 10;
                            if (ordine.indexOf(cartaVincente) < ordine.indexOf(c)) {
                                cartaVincente = c;
                                posizione = i;
                            }
                        }
                    }
                }
            }
        }
        RoomState[data.roomId]._giro = RoomState[data.roomId]._giro + 1;
        let vincente = (RoomState[data.roomId].giocatorePrimo + posizione) % 5;
        RoomState[data.roomId].fineHand = (vincente + 4) % 5;
        RoomState[data.roomId].hand = vincente;
        RoomState[data.roomId].playerInside[vincente].mazzo = RoomState[data.roomId].playerInside[vincente].mazzo.concat(carteTavolo);
        setTimeout(() => {
            resetArray(data, vincente)
        }, 2000);
        console.log("Caller" + RoomState[data.roomId].chiamante);
        // If is the last lap
        if (RoomState[data.roomId].playerInside[vincente].cards.length === 0) {
            scoreCalculate(data);
        }
        if (RoomState[data.roomId].rules.giro === true) {
            RoomState[data.roomId].changeGamePhase('gioco');
        }
        emitUpdate(RoomState[data.roomId], data.roomId);
    }

    function resetArray(data, winner) {
        while (RoomState[data.roomId].carteTavolo.length > 0) {
            RoomState[data.roomId].carteTavolo.pop();
        }
        RoomState[data.roomId].giocatorePrimo = winner;
        emitUpdate(RoomState[data.roomId], data.roomId);
    }

    function scoreCalculate(data) {
        let carteChiamante = [],
            carteFinali = [],
            punteggio = 0;
        let room = RoomState[data.roomId],
            compagno = room.compagno,
            chiamante = room.chiamante;
        let players = room.playerInside;
        carteChiamante = players[compagno].mazzo.concat(players[chiamante].mazzo);

        for (let i = 0; i < carteChiamante.length; i++) {
            if (carteChiamante[i] % 10 === 0) {
                punteggio += 11;
            } else if (carteChiamante[i] % 10 === 2) {
                punteggio += 10;
            } else if (carteChiamante[i] % 10 === 7) {
                punteggio += 2;
            } else if (carteChiamante[i] % 10 === 8) {
                punteggio += 3;
            } else if (carteChiamante[i] % 10 === 9) {
                punteggio += 4;
            }
        }
        room._punteggio = punteggio;
        if (punteggio >= room.chiamata.punti) {
            players[chiamante].player.score = players[chiamante].player.score + 25;
            players[chiamante].player.win++;
            players[compagno].player.score = players[compagno].player.score + 25;
            players[compagno].player.win++;
            room.risultato.push(players[chiamante].player.username);
            room.risultato.push(players[compagno].player.username);
            for (let i = 0; i < 5; i++) {
                if (i !== chiamante && i !== compagno) {
                    players[i].player.lose++;
                }
                if (players[i].player.score >= 100) {
                    players[i].player.level++;
                    room.levelup.push(players[i].player.username);
                    players[i].player.score = players[i].score - 100;
                }
            }
        } else {
            players[chiamante].player.lose++;
            players[compagno].player.lose++;
            for (let i = 0; i < 5; i++) {
                if (i !== chiamante && i !== compagno) {
                    room.risultato.push(players[i].player.username);
                    players[i].player.score = players[i].player.score + 25;
                    players[i].player.win++;
                }
                if (players[i].player.score >= 100) {
                    players[i].player.level++;
                    room.levelup.push(players[i].player.username);
                    players[i].player.score = players[i].player.score - 100;
                }
            }
        }
        emitUpdate(RoomState[data.roomId], data.roomId);
        setTimeout(() => {
            close(data.roomId)
        }, 5000);
    }

    function discHandle(room, sockUser) {
        RoomState[room].chiamataTimer = 0;
        RoomState[room].disconnesso.push(sockUser);
        if (RoomState[room].disconnesso.length === 2) {
            clearTimeout(RoomState[room].time);
            close(room);
        } else {
            if (RoomState[room].playerInside.length < 5) {
                close(room);
            } else {
                let phase = RoomState[room]._gamePhase;
                RoomState[room].changeOldGamePhase(phase);
                RoomState[room].changeGamePhase("disconnessione");
                emitUpdate(RoomState[room], room);
                setTimer(room);
            }
        }
    }

    function setTimer(data) {
        RoomState[data].time = setTimeout(() => {
            close(data)
        }, 30000);
    }

    function recordModifier(data) {
        return new Promise(function (resolve, reject) {
            for (let i = 0; i < RoomState[data].playerInside.length; i++) {
                let player = RoomState[data].playerInside[i].player;
                let sql = `UPDATE users SET score = '${player.score}',
        level = '${player.level}',
        win = '${player.win}',
        lose = '${player.lose}',
        idroom = '0'
        WHERE id = '${player.id}'`;
                connection.query(sql, function (err, rows) {
                    if (err) {
                        console.error(`[DATABASE][ERROR][recordModifier]  ${err}`);
                        return reject(err);
                    }
                    resolve(rows);
                });
                let data_user = connectedUsers.find(name => name.username === player.username);
                if(data_user) {
                    sessionStore.get(data_user.sessionId, function (err, data) {
                        data.idroom = '0';
                        sessionStore.sessions[data_user.sessionId] = JSON.stringify(data);
                    });
                }
            }
        });
    }

    function close(data) {
        RoomState[data].changeGamePhase('chiusura');
        recordModifier(data).then(function (rows) {
            emitUpdate(RoomState[data], data);
            setTimeout(() => {
                console.log("STANZA DISTRUTTA!!!!!!");
                delete RoomState[data];
            }, 5000);
        }).catch((err) => setImmediate(() => {
            console.error(`[DATABASE][ERROR][close]  ${err}`);
        }));
    }

    socket.on('give-up', (data) => {
        close(data);
    });
    /*socket.on('disconnect', reason => {
        console.log(`reason: ${reason}`);
    });*/
    socket.on("disconnect", () => {
        setTimeout(() => {

            console.info(`[SOCKET][INFO] Client disconnesso! [id = ${socket.id}] [username = ${socket.username}]`);
            console.dir(connectedUsers);
            if (socket.username) {
                let data = connectedUsers.find(name => name.username === socket.username);
                connectedUsers.splice(connectedUsers.indexOf(data), 1);
            }
            getRoom().then(function (room) {
                if (!RoomState[room]) {
                    let data = connectedUsers.find(name => name.username === socket.username);
                    connectedUsers.splice(connectedUsers.indexOf(data), 1);
                } else {
                    if (connectedUsers.find(name => name.username === socket.username)) {

                    } else {
                        console.dir(connectedUsers);
                        console.log("dentro else disconnessione");
                        discHandle(room, socket.username);
                    }
                }
            })
        }, 2000)
    });
});
