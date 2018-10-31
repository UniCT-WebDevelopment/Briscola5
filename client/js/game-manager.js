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

    init(data) {
        socket.emit('request-game-state', window.registeredRoom);
    }

    render_Carte(target, carta, w, h, onclick = null, zoom = true) {
        console.log(target)
        let cartaImg = document.createElement('canvas');
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

    render_GameStatus() {
        let room = this.state.room;
        let target = document.getElementById('game-status'),
            html = '';
        let id = room._chiamante;
        if (room._gamePhase !== 'disconnessione') {
            document.getElementById('disconnessioneModal').style.display = "none";
        }
        switch (room._gamePhase) {
            case 'idle':
                html = '<h5>In attesa di giocatori...</h5>';
                break;
            case 'chiamata':
                if (room._playerInside[id].player.username === window.user.username) {
                    document.getElementById('chiamata-input').value = this.state.room._chiamata.punti + 1;
                    document.getElementById('myModal').style.display = "block";
                }
                break;
            case 'scegliCarta':
                if (room._playerInside[id].player.username === window.user.username) {
                    document.getElementById('chiamaCartaModal').style.display = "block";
                    let scegliCartaDiv = document.createElement('div');
                    scegliCartaDiv.setAttribute("id", "scegli");
                    for (let c = 0; c < 40; c++) {
                        let cartaImg = document.createElement('canvas');
                        cartaImg.className = "zoom";
                        cartaImg.onclick = () => {
                            socket.emit('cartaCompagno', {
                                roomId: room._id,
                                carta: c
                            });
                            document.getElementById('chiamaCartaModal').style.display = "none";
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
                    document.getElementById('chiamaCarta').appendChild(scegliCartaDiv);
                }
                break;
            case 'giroMorto':
                html = 'Giro Morto!';
                break;
            case 'gioco':
                html = 'Si Gioca';
                let carta = room._cartaChiamata;
                document.getElementById('carta-chiamata').innerHTML = "";
                this.render_Carte('carta-chiamata', carta, 102, 162, null, false);
                let valore = 0;
                for (let i = 0; i < room._playerInside.length; i++) {
                    let user = room._playerInside[i].player;
                    document.getElementById('terreno' + i).innerHTML = "";
                    if (user.username === window.user.username) {
                        valore = i;
                    }
                }
                let mano = room._giocatorePrimo;
                for (let i = 0; i < room._carteTavolo.length; i++) {
                    let carta = room._carteTavolo[i];
                    let ap = (4 - valore + i + mano) % 5;
                    this.render_Carte('terreno' + ap, carta, 81, 129);
                    console.log("Mano :" + mano);
                    console.log("Giocatore Primo: " + room._giocatorePrimo);
                }
                break;
            case 'disconnessione':
                move();
                break;
            case 'chiusura':
                document.getElementById('gameoverModal').style.display = "block";
                document.getElementById('match-result').innerText = room._risultato.indexOf(window.user.username) > -1 ? "VINTO!" : "PERSO!";
                $('.end-right').css('left', '-10%');
                $('.end-left').css('left', '110%');
                $('.end-right').velocity({left: '45%'}, 'easeOutExpo', 1200);
                $('.end-left').velocity({left: '52%'}, 'easeOutExpo', 1200);
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
                    document.getElementById('gameoverModal').style.display = "none";
                    socket.emit('return-lobby', window.user.username);
                }, 5000);
                break;
            default:
                break;
        }
        target.innerHTML = html;
    }


    render() {
        let room = this.state.room;
        if (room._rules.carte === 'siciliane') {
            this._img.src = 'assets/images/carte_sic.png';
        } else {
            this._img.src = 'assets/images/carte.png';
        }
        console.log(room);
        this._img.onload = () => {
            this.render_GameStatus();
            let valore = 0;
            for (let i = 0; i < room._playerInside.length; i++) {
                let user = room._playerInside[i].player;
                if (user.username === window.user.username) {
                    valore = i;
                }
            }
            let mano = room._giocatorePrimo;
            let val = (4 - valore + mano) % 5;
            for (let i = 0; i < room._playerInside.length; i++) {
                let ci = document.getElementById('player' + i);
                ci.classList.remove("inizio");
            }
            for (let i = 0; i < room._playerInside.length; i++) {
                document.getElementById('player' + i).innerHTML = '';
                let pii = i + 1;
                let pi = (pii + valore) % 5;
                let ci = document.getElementById('player' + val);
                ci.classList.remove("inizio");
                ci.classList.add("inizio");
                let cardsLength = room._playerInside[valore].cards.length;
                let user = room._playerInside[pi].player;
                let username = user.username;
                let node = document.createElement("LI");
                let textnode = document.createTextNode(username);
                node.appendChild(textnode);
                document.getElementById('player' + i).appendChild(node);
                if (window.user.username === user.username) {
                    document.getElementById('mie-carte').innerHTML = '';
                    room._playerInside[valore].cards.sort((a, b) => {
                        return a > b ? 1 : -1;
                    })
                    /* LE MIE CARTE*/
                    for (let c = 0; c < cardsLength; c++) {
                        let carta = room._playerInside[valore].cards[c];
                        const onclick = () => {
                            switch (room._gamePhase) {
                                case 'gioco':
                                    socket.emit('clickCarta', {
                                        roomId: room._id,
                                        carta: carta,
                                        giocatore: window.user.username
                                    });
                                    break;
                                case 'giroMorto':
                                    socket.emit('clickCarta', {
                                        roomId: room._id,
                                        carta: carta,
                                        giocatore: window.user.username
                                    });
                                    break;
                            }
                        };
                        this.render_Carte('mie-carte', carta, 102, 162, onclick);
                    }
                }
            }
        }
    }

    inviaChiamata() {
        let value = parseInt(document.getElementById('chiamata-input').value);

        console.log(typeof value);
        console.log(typeof this.state.room._chiamata.punti);

        if (value > this.state.room._chiamata.punti) {
            let data = {
                id: this.state.room._id,
                value: value
            };
            document.getElementById('myModal').style.display = "none";
            socket.emit('newChiamataScore', data);
        }
    }

    passaChiamata() {
        document.getElementById('myModal').style.display = "none";
        socket.emit('passaChiamata', this.state.room._id);
    }
}

function move() {
    document.getElementById('disconnessioneModal').style.display = "block";
    var elem = document.getElementById("myBar");
    var width = 90;
    var w = 30;
    var id = setInterval(frame, 1000);

    function frame() {
        if (width == 0) {
            clearInterval(id);
        } else {
            width-=3;
            w--;
            elem.style.width = width + '%';
            elem.innerHTML = w * 1 + 's';
        }
    }
}

let game = new GameManager(socket);

socket.on('update-game-state', (data) => {
    console.log(data);
    game.setState({room: data});
});

