class LobbyManager {

    constructor() {
        this.state = {
            rooms: {}
        };
        this.roomStateListener();
    }

    setState(state) {
        Object.assign(this.state, state);
        this.render();
    }

    roomStateListener() {
        let self = this;
        socket.on('update-room-status', (data) => {
            if(document.getElementById('rooms-area') !== null){
                self.setState({rooms: data});
            }
        })
    }

    createRoom() {
        let name = document.getElementById('room-name').value,
            giro = document.getElementById('room-giro').checked,
            carte = document.getElementById('room-card-type').value;
        let data = {
            name: name,
            rules: {
                giro: giro,
                carte: carte
            },
            creator: window.user
        };
        socket.emit('create-room', data);
    }

    render() {
        document.getElementById('rooms-area').innerHTML = '';
        let div = '';
        let rooms = this.state.rooms;

        for (let roomId in rooms) {
            let room = rooms[roomId];
            let tableInner = '';
            let giroMorto = room._rules.giro ? "'Giro Morto'" : "No 'Giro Morto'";
            let carte = room._rules.carte;
            room._playerInside.map((player, i) => {
                tableInner += `<tr><td>${player.player.username}</td></tr>`
            });
            if (room._gamePhase === 'idle') {
                div += `       
                <div class="col-lg-3 col-md-6 col-sm-12">
                    <div class="card" style="width: 18rem;">
                        <div class="card-body">
                            <h5 class="card-title">${room._name}</h5>
                            <h6 class="card-rules">${giroMorto}</h6>
                            <h6 class="card-rules">Carte: ${carte}</h6>
                            <table class="table" id="${room._id}-table">
                                ${tableInner}
                            </table>
                            <button class="btn btn-login btn-block" onclick="sendToServer.joinRoom('${room._id}')">Siediti</button>
                        </div>
                    </div>
                </div>
            `
            }
        }
        document.getElementById('rooms-area').innerHTML = div;
    }
}

const lobby = new LobbyManager();