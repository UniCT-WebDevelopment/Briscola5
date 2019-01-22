/**
 * @since 1.0.0
 * @author Ismaele Benbachir
 **/

/**
 * @type {HTMLElement}
 */

let modal = document.getElementById('myModal'),
    btn = document.getElementById("myBtn"),
    span = document.getElementsByClassName("close")[0];

class GameManager {

    constructor(socket) {
        this.socket = socket;
        this.state = {
            room: {}
        };
        this._img = new Image();
    }

    setState(state) {
        Object.assign(this.state, state);
        this.render();
    }

    init() {
        socket.emit('request-game-state', window.registeredRoom);
    }

    distructor(socket) {
        game = new GameManager(socket);
    }

    render_Cards(target, carta, w, h, onclick = null, zoom = true) {
        let cartaImg = document.createElement('canvas');
        cartaImg.classList.add("canv");
        cartaImg.width = w;
        cartaImg.height = h;
        cartaImg.onclick = onclick;
        if (zoom) cartaImg.className = "zoom";
        let ctx = cartaImg.getContext('2d');// 'assets/images/carte.png';
        let x = Math.floor((carta % 10) * 102),
            y = Math.floor(carta / 10) * 162,
            cw = 102,
            ch = 162;
        console.log(x, y, w, h)
        ctx.drawImage(this._img, x, y, cw, ch, 0, 0, w, h);
        document.getElementById(target).appendChild(cartaImg);

    }

    async render_GameStatus() {
        //   let room = this.state.room;
        let room = await localStorage.getItem('roomData');
        room = JSON.parse(room);
        let target = document.getElementById('game-status'),
            html = '';
        let id = room._chiamante;
        if (room._gamePhase !== 'disconnessione') {
            document.getElementById('discModal').style.display = "none";
        }
        switch (room._gamePhase) {
            case 'idle':
                html = '<h5><center>Waiting players...</center></h5>';
                break;
            case 'chiamata':
                html = '<h5><center>Call Phase</center></h5>';
                if (room._playerInside[id].player.username === window.user.username) {
                    document.getElementById('calling-input').value = this.state.room._chiamata.punti + 1;
                    document.getElementById('myModal').style.display = "block";
                }
                break;
            case 'scegliCarta':
                html = '<h5><center>Card Call Phase</center></h5>';
                if (room._playerInside[id].player.username === window.user.username) {
                    document.getElementById('callCardModal').style.display = "block";
                    if (room._rules.giro === true) {
                        document.getElementById('cardsT').style.display = "block";
                    }
                    let scegliCartaDiv = document.createElement('div');
                    scegliCartaDiv.setAttribute("id", "scegli");
                    for (let c = 0; c < 40; c++) {
                        let cartaImg = document.createElement('canvas');
                        cartaImg.className = "zoom";
                        cartaImg.onclick = () => {
                            if (room._carteTavolo.indexOf(c) > -1) {
                                alert("You can not select that card");
                            } else {
                                socket.emit('cardMate', {
                                    roomId: room._id,
                                    carta: c
                                });
                                document.getElementById('callCardModal').style.display = "none";
                                document.getElementById('cardsT').style.display = "none";
                            }
                        };
                        cartaImg.width = 102;
                        cartaImg.height = 162;
                        let ctx = cartaImg.getContext('2d');// 'assets/images/carte.png';
                        let x = Math.floor((c % 10) * 102),
                            y = Math.floor(c / 10) * 162,
                            w = 102,
                            h = 162;
                        ctx.drawImage(this._img, x, y, w, h, 0, 0, w, h);
                        scegliCartaDiv.appendChild(cartaImg);
                    }
                    document.getElementById('callCard').appendChild(scegliCartaDiv);
                }
                break;
            case 'giroMorto':
                html = '<h5><center>"Giro Morto!"</center></h5>';
                let valor = 0;
                for (let i = 0; i < room._playerInside.length; i++) {
                    let user = room._playerInside[i].player;
                    document.getElementById('table' + i).innerHTML = "&nbsp;";
                    if (user.username === window.user.username) {
                        valor = i;
                    }
                }
                let man = room._giocatorePrimo;
                for (let i = 0; i < room._carteTavolo.length; i++) {
                    let carta = room._carteTavolo[i];
                    let ap = (4 - valor + i + man) % 5;
                    this.render_Cards('table' + ap, carta, 81, 129);
                }
                document.getElementById('winnerRound').innerHTML = "Start from: ";
                let giocatore = room._playerInside[0].player.username;
                let node = document.createElement("LI");
                let textnode = document.createTextNode(giocatore);
                node.appendChild(textnode);
                document.getElementById('winnerRound').appendChild(node);
                document.getElementById('currentPlayer').innerHTML = "It's up to: ";
                let giocat = room._playerInside[room._hand].player.username;
                let nodo = document.createElement("LI");
                let textnodo = document.createTextNode(giocat);
                nodo.appendChild(textnodo);
                document.getElementById('currentPlayer').appendChild(nodo);
                document.getElementById('caller-right').innerHTML = "From: ";
                let nume = room._chiamante;
                let chiamat = room._playerInside[nume].player.username;
                let na = document.createElement("LI");
                let texte = document.createTextNode(chiamat);
                na.appendChild(texte);
                document.getElementById('caller-right').appendChild(na);
                document.getElementById('points').innerHTML = "Points: ";
                let punta = room._chiamata.punti;
                console.log(punta);
                let nia = document.createElement("LI");
                let texe = document.createTextNode(punta);
                nia.appendChild(texe);
                document.getElementById('points').appendChild(nia);
                break;
            case 'gioco':
                html = '<h5><center>Si Gioca</center></h5>';
                let carta = room._cartaChiamata;
                document.getElementById('card-called').innerHTML = "";
                this.render_Cards('card-called', carta, 102, 162, null, false);
                let valore = 0;
                for (let i = 0; i < room._playerInside.length; i++) {
                    let user = room._playerInside[i].player;
                    document.getElementById('table' + i).innerHTML = "&nbsp;";
                    if (user.username === window.user.username) {
                        valore = i;
                    }
                }
                let mano = room._giocatorePrimo;
                for (let i = 0; i < room._carteTavolo.length; i++) {
                    let carta = room._carteTavolo[i];
                    let ap = (4 - valore + i + mano) % 5;
                    this.render_Cards('table' + ap, carta, 81, 129);
                }
                document.getElementById('currentPlayer').innerHTML = "";
                document.getElementById('currentPlayer').innerHTML = "It's up to: ";
                let gioca = room._playerInside[room._hand].player.username;
                let nod = document.createElement("LI");
                let textnod = document.createTextNode(gioca);
                nod.appendChild(textnod);
                document.getElementById('currentPlayer').appendChild(nod);
                if (room._giro === 0) {
                    document.getElementById('winnerRound').innerHTML = "";
                    document.getElementById('winnerRound').innerHTML = "Start from: ";
                    let giocatore = room._playerInside[0].player.username;
                    let node = document.createElement("LI");
                    let textnode = document.createTextNode(giocatore);
                    node.appendChild(textnode);
                    document.getElementById('winnerRound').appendChild(node);
                }
                else {
                    document.getElementById('winnerRound').innerHTML = "";
                    //Hand means who takes turn
                    document.getElementById('winnerRound').innerHTML = "Hand: ";
                    let vincitore = room._playerInside[room._giocatorePrimo].player.username;
                    let node = document.createElement("LI");
                    let textnode = document.createTextNode(vincitore);
                    node.appendChild(textnode);
                    document.getElementById('winnerRound').appendChild(node);
                }
                if (room._punteggio !== 0) {
                    document.getElementById('winnerRound').innerHTML = "Caller and companion score: ";
                    let punteggio = room._punteggio;
                    let node = document.createElement("LI");
                    let textnode = document.createTextNode(punteggio);
                    node.appendChild(textnode);
                    document.getElementById('winnerRound').appendChild(node);
                }
                break;
            case 'disconnessione':
                move();
                break;
            case 'chiusura':
                document.getElementById('gameoverModal').style.display = "block";
                document.getElementById('match-result').innerText = room._risultato.indexOf(window.user.username) > -1 ? "WON!" : "LOST!";
                document.getElementById('match-result').style.left = '-10%';
                document.getElementById('you-result').style.left = '110%';
                document.getElementById('match-result').velocity({left: '50%'}, 'easeOutExpo', 1200);
                document.getElementById('you-result').velocity({left: '55%'}, 'easeOutExpo', 1200);

                let index = room._risultato.length,
                    compagno = room._compagno,
                    chiamante = room._chiamante;
                let tmp = [];
                let players = room._playerInside;
                if (index !== 0) {
                    for (let i = 0; i < 5; i++) {
                        if(room._risultato.indexOf(players[i].player.username) > -1){

                        } else {
                            tmp.push(players[i].player.username);
                        }
                    }
                }

                console.log('chiamante: ' + chiamante);
                console.log('compagno: ' + compagno);
                console.log('tmp: ' + tmp);
                console.log('risultato: ' + room._risultato);

                document.getElementById('call').innerHTML = "";
                document.getElementById('caller-mate').innerHTML = "";
                document.getElementById('first').innerHTML = "";
                document.getElementById('second').innerHTML = "";
                document.getElementById('third').innerHTML = "";
                document.getElementById('duo-points').innerHTML = "";
                document.getElementById('trio-points').innerHTML = "";

                if (index === 2) {
                    document.getElementById('trio').style.color = 'red';
                    let ni = document.createElement("I");
                    let tex = document.createTextNode(room._risultato[0]);
                    ni.appendChild(tex);
                    document.getElementById('call').appendChild(ni);
                    tex = document.createTextNode(room._risultato[1]);
                    let nni = document.createElement("I");
                    nni.appendChild(tex);
                    document.getElementById('caller-mate').appendChild(nni);
                    let nii = document.createElement("I");
                    tex = document.createTextNode(tmp[0]);
                    nii.appendChild(tex);
                    document.getElementById('first').appendChild(nii);
                    tex = document.createTextNode(tmp[1]);
                    let nui = document.createElement("I");
                    nui.appendChild(tex);
                    document.getElementById('second').appendChild(nui);
                    tex = document.createTextNode(tmp[2]);
                    let nai = document.createElement("I");
                    nai.appendChild(tex);
                    document.getElementById('third').appendChild(nai);
                } else if (index === 3) {
                    document.getElementById('duo').style.color = 'red';
                    let ni = document.createElement("I");
                    let tex = document.createTextNode(room._risultato[0]);
                    ni.appendChild(tex);
                    document.getElementById('first').appendChild(ni);
                    let nni = document.createElement("I");
                    tex = document.createTextNode(room._risultato[1]);
                    nni.appendChild(tex);
                    document.getElementById('second').appendChild(nni);
                    tex = document.createTextNode(room._risultato[2]);
                    let mi = document.createElement("I");
                    mi.appendChild(tex);
                    document.getElementById('third').appendChild(mi);
                    let mmi = document.createElement("I");
                    tex = document.createTextNode(tmp[0]);
                    mmi.appendChild(tex);
                    document.getElementById('call').appendChild(mmi);
                    let vi = document.createElement("I");
                    tex = document.createTextNode(tmp[1]);
                    vi.appendChild(tex);
                    document.getElementById('caller-mate').appendChild(vi);
                } else {
                    document.getElementById('final-table').innerText = '';
                }
                let punteggio = 120 - room._punteggio;
                let ni = document.createElement('I');
                let tex = document.createTextNode(room._punteggio);
                ni.appendChild(tex);
                document.getElementById('duo-points').appendChild(ni);
                let no = document.createElement("I");
                tex = document.createTextNode((punteggio));
                no.appendChild(tex);
                document.getElementById('trio-points').appendChild(no);


                if (room._risultato.indexOf(window.user.username) > -1) {
                    if (room._levelup.indexOf(window.user.username) > -1) {
                        document.getElementById('level-up').play();
                    } else {
                        document.getElementById('win').play();
                    }
                } else {
                    document.getElementById('lose').play();
                }
                setTimeout(() => {

                    let url = "http://localhost:3000/request-room-modify";

                    let xhr = new XMLHttpRequest();
                    xhr.open("get", url, true);
                    xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
                    xhr.onload = function () {
                    };
                    xhr.send();

                    document.getElementById('gameoverModal').style.display = "none";
                    //changeView('lobby-screen');
                    socket.emit('return-lobby', window.user.username);
                    game.distructor(this.socket);

                }, 5555000);
                break;
            default:
                break;
        }
        target.innerHTML = html;
    }

    async render() {
        this.render_GameStatus();
        // let room = this.state.room;
        let room = await localStorage.getItem('roomData');
        room = JSON.parse(room);
        if (room._rules.carte === 'siciliane') {
            this._img.src = 'assets/images/carte_sic.png';
        } else {
            this._img.src = 'assets/images/carte.png';
        }

        let valore = 0;
        for (let i = 0; i < room._playerInside.length; i++) {
            let user = room._playerInside[i].player;


            if (user.username === window.user.username) {
                valore = i;
            }
        }
        let call = room._chiamante;

        let mano = room._giocatorePrimo;
        let val = (4 - valore + mano) % 5;
        let caller = (4 - valore + call) % 5;
        let turno = room._hand;
        let valturno = (4 - valore + turno) % 5;
        if (room._gamePhase !== 'idle' && room._gamePhase !== 'chiamata') {
            document.getElementById('cop' + caller).style.display = 'block';
        }
        if (room._gamePhase !== 'idle') {
            document.getElementById('caller-right').innerHTML = "";
            document.getElementById('caller-right').innerHTML = "From: ";
            let nom = room._nome;
            let n = document.createElement("LI");
            let text = document.createTextNode(nom);
            n.appendChild(text);
            document.getElementById('caller-right').appendChild(n);
            document.getElementById('points').innerHTML = "";
            document.getElementById('points').innerHTML = "Points: ";
            let punt = room._chiamata.points;
            if (punt !== 80) {
                let ni = document.createElement("LI");
                let tex = document.createTextNode(punt);
                ni.appendChild(tex);
                document.getElementById('points').appendChild(ni);
            }
        }
        for (let i = 0; i < room._playerInside.length; i++) {
            let ci = document.getElementById('player' + i);
            let c = document.getElementById('player' + i);
            c.classList.remove("round");
            ci.classList.remove("start");
        }
        for (let i = 0; i < room._playerInside.length; i++) {
            document.getElementById('player' + i).innerHTML = '';
            let pii = i + 1;
            let pi = (pii + valore) % 5;
            let ci = document.getElementById('player' + val);
            ci.classList.remove("start");
            ci.classList.add("start");
            let ct = document.getElementById('player' + valturno);
            ct.classList.remove("round");
            ct.classList.add("round");
            let cardsLength = room._playerInside[valore].cards.length;
            let user = room._playerInside[pi].player;
            let username = user.username;
            let node = document.createElement("LI");
            let textnode = document.createTextNode(username);
            node.appendChild(textnode);
            document.getElementById('player' + i).appendChild(node);

            this._img.onload = () => {
                this.render_GameStatus();

                if (window.user.username === user.username) {
                    document.getElementById('my-cards').innerHTML = '';
                    room._playerInside[valore].cards.sort((a, b) => {
                        return a > b ? 1 : -1;
                    })
                    /* My cards */
                    for (let c = 0; c < cardsLength; c++) {
                        let carta = room._playerInside[valore].cards[c];
                        const onclick = () => {
                                switch (room._gamePhase) {
                                    case 'gioco':
                                        socket.emit('clickCard', {
                                            roomId: room._id,
                                            carta: carta,
                                            giocatore: window.user.username
                                        });
                                        break;
                                    case 'giroMorto':
                                        let punteggio = 0,
                                            chiamata = room._chiamata.punti,
                                            massimo = 120 - chiamata,
                                            carteTav = room._carteTavolo;

                                        if (carta % 10 === 0) {
                                            punteggio += 11;
                                        } else if (carta % 10 === 2) {
                                            punteggio += 10;
                                        } else if (carta % 10 === 7) {
                                            punteggio += 2;
                                        } else if (carta % 10 === 8) {
                                            punteggio += 3;
                                        } else if (carta % 10 === 9) {
                                            punteggio += 4;
                                        }

                                        for (let i = 0; i < carteTav.length; i++) {
                                            if (carteTav[i] % 10 === 0) {
                                                punteggio += 11;
                                            } else if (carteTav[i] % 10 === 2) {
                                                punteggio += 10;
                                            } else if (carteTav[i] % 10 === 7) {
                                                punteggio += 2;
                                            } else if (carteTav[i] % 10 === 8) {
                                                punteggio += 3;
                                            } else if (carteTav[i] % 10 === 9) {
                                                punteggio += 4;
                                            }
                                        }
                                        if (punteggio >= massimo) {
                                            alert("You can not throw the card, already there are 120 points with the call");
                                        } else {
                                            socket.emit('clickCard', {
                                                roomId: room._id,
                                                carta: carta,
                                                giocatore: window.user.username
                                            });
                                        }
                                        break;
                                }
                            }
                        ;
                        this.render_Cards('my-cards', carta, 102, 162, onclick);
                    }
                }
            }
        }

    }

    sendCall() {
        let value = parseInt(document.getElementById('calling-input').value);

        if (value > this.state.room._chiamata.punti) {
            let data = {
                id: this.state.room._id,
                value: value,
                user: window.user.username
            };
            document.getElementById('myModal').style.display = "none";
            socket.emit('newCallScore', data);
        }
    }

    giveUp() {
        document.getElementById('myModal').style.display = "none";
        socket.emit('passTheCall', this.state.room._id);
    }

    giveUpMatch() {
        let risultato = confirm("Confirm the abandonment of the game?");
        if (risultato === true) {
            socket.emit('give-up', this.state.room._id);
        }
    }

    startTimer() {
        if (this.state.room._gamePhase === 'gioco') {
            socket.emit('timer', this.state.room._id);
        } else {
            alert('It is not a phase of play');
        }
    }
}

/**
 * Useless currently
 * Bar animation for disconnection
 */

function move() {
    document.getElementById('discModal').style.display = "block";
    var elem = document.getElementById("myBar");
    var width = 90;
    var w = 30;
    var id = setInterval(frame, 1000);

    function frame() {
        if (width == 0) {
            clearInterval(id);
        } else {
            width -= 3;
            w--;
            elem.style.width = width + '%';
            elem.innerHTML = w * 1 + 's';
        }
    }
}

let game = new GameManager(socket);

socket.on('update-game-state', (data) => {
    localStorage.setItem('roomData', JSON.stringify(data));
    localStorage.setItem('roomId', data._id);
    game.setState({room: data});
});
