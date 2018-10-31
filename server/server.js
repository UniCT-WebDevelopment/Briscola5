var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var path = require('path');

class Room {
    get deck() {
        return this._deck;
    }

    set deck(value) {
        this._deck = value;
    }

    get chiamante() {
        return this._chiamante;
    }

    set chiamante(value) {
        this._chiamante = value;
    }

    get chiamata() {
        return this._chiamata;
    }

    set chiamata(value) {
        this._chiamata = value;
    }

    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }

    get rules() {
        return this._rules;
    }

    set rules(value) {
        this._rules = value;
    }

    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }

    get playerInside() {
        return this._playerInside;
    }

    set playerInside(value) {
        this._playerInside = value;
    }

    get gamePhase() {
        return this._gamePhase;
    }

    set gamePhase(value) {
        this._gamePhase = value;
    }

    get turniDiChiamata() {
        return this._turniDiChiamata
    }

    set turniDiChiamata(value) {
        this._turniDiChiamata = value
    }

    get hand() {
        return this._hand
    }

    set hand(value) {
        this._hand = value
    }

    get fineHand() {
        return this._fineHand
    }

    set fineHand(value) {
        this._fineHand = value
    }

    get cartaChiamata() {
        return this._cartaChiamata
    }

    set cartaChiamata(value) {
        this._cartaChiamata = value
    }

    get carteTavolo() {
        return this._carteTavolo
    }

    set carteTavolo(value) {
        this._carteTavolo = value
    }

    get compagno() {
        return this._compagno
    }

    set compagno(value) {
        this._compagno = value
    }

    get briscola() {
        return this._briscola
    }

    set briscola(value) {
        this._briscola = value
    }

    get ordine() {
        return this._ordine
    }

    set ordine(value) {
        this._ordine = value
    }

    get giocatorePrimo() {
        return this._giocatorePrimo
    }

    set giocatorePrimo(value) {
        this._giocatorePrimo = value
    }

    get oldGamePhase() {
        return this._oldGamePhase;
    }

    set oldGamePhase(value) {
        this._oldGamePhase = value;
    }

    get disconnesso() {
        return this._disconnesso;
    }

    set disconnesso(value) {
        this._disconnesso = value;
    }

    get time() {
        return this._time;
    }

    set time(value) {
        this._time = value;
    }

    get risultato() {
        return this._risultato;
    }

    set risultato(value) {
        this._risultato = value;
    }

    get levelup() {
        return this._levelup;
    }

    set levelup(value) {
        this._levelup = value;
    }

    constructor() {
        this._id = Date.now() + Math.floor(Math.random() * 1000000000);
        this._playerInside = [];
        this._roomStatus = 'open';
        this._gamePhase = 'idle';
        this._oldGamePhase = 'idle';
        this._rules = {};
        this._name = '';
        this._deck = [];
        this._chiamante = 0;
        this._chiamata = {
            punti: 80,
            carta: -1
        };
        this._hand = 0;
        this._compagno;
        this._disconnesso = [];
        this._utentiDisconnessi = 0;
        this._time;
        this._turniDiChiamata = 0;
        this._cartaChiamata = -1;
        this._carteTavolo = [];
        this._giro = 0;
        this._giocatorePrimo = 0;
        this._fineHand = 4;
        for (let i = 0; i < 40; i++) {
            this._deck.push(i);
        }
        this._briscola = -1;
        this._ordine = [1, 3, 4, 5, 6, 7, 8, 9, 2, 0];
        this._risultato = [];
        this._levelup = [];
    }


    isRoomFull() {
        return this._playerInside.length === 5;
    }

    addPlayer(player) {
        this._playerInside.push(player);
    }

    incTDC() {
        this._turniDiChiamata++;
    }

    shuffleDeck() {
        for (let i = this._deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this._deck[i], this._deck[j]] = [this._deck[j], this._deck[i]];
        }
        return this._deck;
    }

    changeGamePhase(newPhase) {
        this._gamePhase = newPhase;
    }

    changeOldGamePhase(phase) {
        this._oldGamePhase = phase;
    }


}

const bcrypt = require('bcrypt');

let mysql = require('mysql');

let connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "webdevprj",
    port: "8846"
});

connection.connect(function (err) {
    if (err) throw err;
    console.log(`[DATABASE][INFO] Connesso`);
});

server.listen(3000);

app.use(express.static(path.join(__dirname, '../client')));
app.get('/', function (req, res) {
    res.sendfile(path.join(__dirname, '../client/index.html'));
});

let RoomState = {};
io.on("connection", (socket) => {
    let me = null;
    console.info(`[SOCKET][INFO] Client connesso! [ID=${socket.id}]`);
    
    socket.on('register-user', (data) => {
        let password = bcrypt.hashSync(data.password, 5);
        let sql = `INSERT INTO users (username, password, level, score, win, lose) VALUES ('${data.username}', '${password}', 1, 0, 0, 0)`;
        connection.query(sql, function (err, result) {
            if (err) {
                socket.emit('registration-error', err);
                console.error(`[DATABASE][ERROR]  ${err}`);
            } else {
                socket.emit('registration-success', 'Registrato con successo');
                console.log("[DATABASE][INFO] Record inserito");
            }
        });
    });

    socket.on('login-user', (data) => {
        let sql = `SELECT * FROM users WHERE username = '${data.username}'`;
        connection.query(sql, function (err, rows) {
            if (err)
                socket.emit('login-error', err);
            else if (!rows.length) {
                socket.emit('login-error', 'Username non trovato');
            }
            else if (!bcrypt.compareSync(data.password, rows[0].password)) {
                socket.emit('login-error', 'Password non corretta');
            } else {
                me = rows[0];
                if (rows[0].idroom !== "0") {
                    socket.username = data.username;
                    let room = RoomState[rows[0].idroom];
                    if (room.disconnesso.indexOf(data.username) > -1) {
                        let indice = room.disconnesso.indexOf(data.username);
                        room.disconnesso.splice(indice, 1);
                        if (room.disconnesso.length === 0) {
                            clearTimeout(room.time);
                            let oldPhase = room.oldGamePhase;
                            room.changeGamePhase(oldPhase);
                            emitUpdate(room, rows[0].idroom);
                        }
                    }
                    reconnect(rows[0]);
                }
                else {
                    socket.username = data.username;
                    socket.emit('login-success', rows[0]);
                }
            }
        });
    });

    socket.on('return-lobby', (data) => {
        let sql = `SELECT * FROM users WHERE username = '${data}'`;
        connection.query(sql, function (err, rows) {
            if (err)
                socket.emit('login-error', err);
            else {
                me = rows[0];
                socket.emit('login-success', rows[0]);
            }
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
        updateRoom(room.id);
        socket.emit('request-confirmed', room.id);
        updateClientRoomStatus();
    }

    function copy(src) {
        return Object.assign({}, src);
    }

    function updateClientRoomStatus() {
        /*console.log('update client room status');
        console.dir(RoomState);*/
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

    socket.on('request-room-status', () => {
        updateClientRoomStatus();
    });

    function reconnect(data) {
        socket.join(data.idroom);
        socket.emit('reconnect', {room: RoomState[data.idroom], user: me});
        emitUpdate(RoomState[data.idroom], data.idroom);
    }

    function updateRoom(data) {
        let sql = `UPDATE users SET idroom='${data}' WHERE id='${me.id}'`;
        connection.query(sql, function (err, result) {
            if (err) {
                console.error(`[DATABASE][ERROR]  ${err}`);
            } else {
                console.log("[DATABASE][INFO] Record del giocatore modificato con la stanza: " + JSON.stringify(data, null, 4));
            }
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
        }
        if (RoomState[data].gamePhase === 'start') {
            distCarte(data);
        }
        console.log(`[GAME] ${socket.id} requested game state`);
        emitUpdate(RoomState[data], data);
    });

    function distCarte(data) {
        let deck = RoomState[data].shuffleDeck();
        RoomState[data].turniDiChiamata = 0;
        RoomState[data].chiamante = 0;
        for (let i = 0; i < 5; i++) {
            RoomState[data].playerInside[i].passed = false;
            RoomState[data].playerInside[i].cards = deck.slice(i * 8, (i + 1) * 8);
        }
        RoomState[data].changeGamePhase('chiamata');
        console.log('[GAME] Carte Distribuite');
        emitUpdate(RoomState[data], data);
    }

    function controlloGiroMorto(roomId) {
        if (RoomState[roomId].rules.giro === true) {
            RoomState[roomId].changeGamePhase('giroMorto');
            emitUpdate(RoomState[roomId], roomId);
        } else {
            RoomState[roomId].changeGamePhase('scegliCarta');
            emitUpdate(RoomState[roomId], roomId);
        }
    }

    function prossimoChiamante(roomId) {
        if (RoomState[roomId].gamePhase === 'chiamata') {
            let tdc = RoomState[roomId].turniDiChiamata;
            /** se chiamano 118 */
            if (RoomState[roomId].chiamata.punti === 118) {
                controlloGiroMorto(roomId);
                return;
            }
            /** se passano tutti */
            let passedCount = 0;
            for (let i = 0; i < 5; i++) {
                if (RoomState[roomId].playerInside[i].passed === true) {
                    passedCount++;
                }
            }
            if (passedCount === 5) {
                RoomState[roomId].changeGamePhase('scegliCarta');
                distCarte(roomId);
                console.log("Fase cambiata in start!!");
                emitUpdate(RoomState[roomId], roomId);
                return;
            }
            /* highlander */
            if (passedCount === 4 && tdc >= 5) {
                let highlander = -1;
                for (let i = 0; i < 5; i++) {
                    if (RoomState[roomId].playerInside[i].passed === false) {
                        highlander = i;
                    }
                }
                RoomState[roomId].chiamante = highlander;
                controlloGiroMorto(roomId);
                return;
            }
            let next = (RoomState[roomId].chiamante + 1) % 5;
            RoomState[roomId].chiamante = next;
            if (RoomState[roomId].playerInside[next].passed === true) {
                prossimoChiamante(roomId);
            }
            emitUpdate(RoomState[roomId], roomId);
        }
    }

    function aggiornaPunti(id, punti) {
        console.log('Aggiorno punti');
        RoomState[id]._chiamata.punti = punti;
    }

    socket.on('newChiamataScore', (data) => {
        aggiornaPunti(data.id, data.value);
        RoomState[data.id].incTDC();
        prossimoChiamante(data.id);
    });

    socket.on('passaChiamata', (data) => {
        let chiamante = RoomState[data].chiamante;
        RoomState[data].playerInside[chiamante].passed = true;
        RoomState[data].incTDC();
        prossimoChiamante(data);
    });

    socket.on('clickCarta', (data) => {
        let iduser = -1;
        for (let i = 0; i < 5; i++) {
            if (data.giocatore === RoomState[data.roomId].playerInside[i].player.username) {
                iduser = i;
            }
        }
        //console.log("Hand:" + RoomState[data.roomId].hand);
        if (iduser === RoomState[data.roomId].hand) {
            let id = RoomState[data.roomId].playerInside[iduser].cards.indexOf(data.carta);
            RoomState[data.roomId].playerInside[iduser].cards.splice(id, 1);
            //console.log(RoomState[data.roomId].playerInside[iduser].cards);
            RoomState[data.roomId].hand = (RoomState[data.roomId].hand + 1) % 5;
            RoomState[data.roomId].carteTavolo.push(data.carta);
            if (RoomState[data.roomId].carteTavolo.length === 5) {
                if (RoomState[data.roomId].rules.giro === false) {
                    console.log("Niente giro morto!!");
                    presa(data);
                    return;
                } else if (RoomState[data.roomId].briscola === -1) {
                    console.log("Primo giro con giro morto!!");
                    RoomState[data.roomId].changeGamePhase('scegliCarta');
                } else {
                    console.log("Giro di giro morto!!");
                    presa(data);
                    RoomState[data.roomId].changeGamePhase('gioco');
                }
            }
            emitUpdate(RoomState[data.roomId], data.roomId);
        }
    });

    socket.on('cartaCompagno', (data) => {
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
        console.log("Compagno: " + room.cartaChiamata + " Numero compagno: " + room.compagno);
        //console.log(room.playerInside);
        room.briscola = Math.floor(room.cartaChiamata / 10);
        if (room.rules.giro === true) {
            presa(data);
        } else {
            room.changeGamePhase('gioco');
        }
        emitUpdate(room, data.roomId);
    });

    function presa(data) {
        console.log("Carte In tavolo: " + RoomState[data.roomId].carteTavolo);
        let cartaVincente = 0,
            posizione = 0,
            brisc = false,
            seme = 0,
            carteTavolo = RoomState[data.roomId].carteTavolo,
            ordine = RoomState[data.roomId].ordine,
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
                } else if ((Math.floor(carteTavolo[i]) / 10) === briscola && brisc === true) {
                    let c = (carteTavolo[i]) % 10;
                    if (ordine.indexOf(cartaVincente) < ordine.indexOf(c)) {
                        cartaVincente = c;
                        posizione = i;
                    }
                } else {
                    if ((Math.floor(carteTavolo[i]) / 10) === seme && brisc === false) {
                        let c = carteTavolo[i] % 10;
                        if (ordine.indexOf(cartaVincente) < ordine.indexOf(c)) {
                            cartaVincente = c;
                            posizione = i;
                        }
                    }
                }
            }
        }
        RoomState[data.roomId].giro++;
        let vincente = (RoomState[data.roomId].giocatorePrimo + posizione) % 5;
        console.log("Vincente: " + vincente + " Posizione: " + posizione);
        RoomState[data.roomId].fineHand = (vincente + 4) % 5;
        RoomState[data.roomId].hand = vincente;
        RoomState[data.roomId].giocatorePrimo = vincente;
        RoomState[data.roomId].playerInside[vincente].mazzo = RoomState[data.roomId].playerInside[vincente].mazzo.concat(carteTavolo);
        //console.log("Mazzo: " + RoomState[data.roomId].playerInside[vincente].mazzo);
        //console.log("Hand: " + RoomState[data.roomId].hand + " Fine Hand: " + RoomState[data.roomId].fineHand);
        while (carteTavolo.length > 0) {
            carteTavolo.pop();
        }
        console.log("Chiamante" + RoomState[data.roomId].chiamante);
        // Se era l' ultimo giro
        if (RoomState[data.roomId].playerInside[vincente].cards.length === 0) {
            calcoloPunteggio(data);
        }
        if (RoomState[data.roomId].rules.giro === true) {
            RoomState[data.roomId].changeGamePhase('gioco');
        }
        emitUpdate(RoomState[data.roomId], data.roomId);
    }

    function calcoloPunteggio(data) {
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
        console.log("Punteggio: " + punteggio + "Carte: " + carteFinali + carteChiamante);
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
        console.log("Risultato: " +room.risultato);
        setTimeout(() => {
            chiudi(data.roomId)
        }, 5000);
    }

    function getRecordDisc(username) {
        return new Promise(function (resolve, reject) {
            let sql = `SELECT idroom FROM users WHERE username = '${username}'`;
            connection.query(sql, function (err, rows) {
                if (err) {
                    console.error(`[DATABASE][ERROR]  ${err}`);
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }

    function gestisciDisconnessione(sockid, sockUser) {
        console.log("Entrato in gestisci disconnessione per l' utente: " +sockUser);
        let room = '0';
        getRecordDisc(sockUser).then(function (rows) {
            room = rows[0].idroom;
            if (room !== '0') {
                RoomState[room].disconnesso.push(sockUser);
                if (RoomState[room].disconnesso.length === 2) {
                    clearTimeout(RoomState[room].time);
                    chiudi(room);
                } else {
                    let phase = RoomState[room]._gamePhase;
                    RoomState[room].changeOldGamePhase(phase);
                    RoomState[room].changeGamePhase("disconnessione");
                    emitUpdate(RoomState[room], room);
                    setTimer(room);
                }
            }
        }).catch((err) => setImmediate(() => { console.error(`[DATABASE][ERROR]  ${err}`); }));
    }

    function setTimer(data) {
        RoomState[data].time = setTimeout(() => {
            chiudi(data)
        }, 30000);
    }

    function modificaRecord(data) {
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
                    console.error(`[DATABASE][ERROR]  ${err}`);
                    return reject(err);
                }
                resolve(rows);
            });
            }
        });
    }

    function chiudi(data) {
        RoomState[data].changeGamePhase('chiusura');
            modificaRecord(data).then(function (rows) {
                emitUpdate(RoomState[data], data);
                delete RoomState[data];
            }).catch((err) => setImmediate(() => { console.error(`[DATABASE][ERROR]  ${err}`); }));
    }

    socket.on("disconnect", () => {
        console.info(`[SOCKET][INFO] Client disconnesso! [id = ${socket.id}] [username = ${socket.username}]`);
        if (socket.username) {
            let sockid = socket.id;
            gestisciDisconnessione(sockid, socket.username);
        }
    });
});
