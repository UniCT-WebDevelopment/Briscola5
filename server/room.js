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

    get timerGame() {
        return this._timerGame;
    }

    set timerGame(value) {
        this._timerGame = value;
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

    get punteggio() {
        return this._punteggio;
    }

    set punteggio(value) {
        this._punteggio = value;
    }

    get abbandono() {
        return this._abbandono;
    }

    set abbandono(value) {
        this._abbandono = value;
    }

    get nome() {
        return this._nome;
    }

    set nome(value) {
        this._nome = value;
    }

    get carteTavoloGiroMorto() {
        return this._carteTavoloGiroMorto;
    }

    set carteTavoloGiroMorto(value) {
        this._carteTavoloGiroMorto = value;
    }

    get callTimer() {
        return this._callTimer;
    }

    set callTimer(value) {
        this._callTimer = value;
    }

    constructor() {
        this._id = Date.now() + Math.floor(Math.random() * 1000000000);
        this._playerInside = [];
        this._roomStatus = 'open';
        this._gamePhase = 'idle';
        this._oldGamePhase = this._gamePhase;
        this._rules = {};
        this._name = '';
        this._deck = [];
        this._chiamante = -1;
        this._chiamata = {
            punti: 80,
            carta: -1
        };
        this._hand = 0;
        this._punteggio = 0;
        this._compagno;
        this._disconnesso = [];
        this._callTimer = 0;
        this._disc;
        this._time;
        this._timerGame;
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
        this._abbandono = 0;
        this._ordine = [1, 3, 4, 5, 6, 7, 8, 9, 2, 0];
        this._risultato = [];
        this._levelup = [];
        this._carteTavoloGiroMorto = [];
        this._nome = "";
        this._mazzoDiCarte = ["Asso di Coppe","Due di Coppe","Tre di Coppe","Quattro di Coppe","Cinque di Coppe","Sei di Coppe","Sette di Coppe","Donna di Coppe","Cavallo di Coppe","Re di Coppe",
            "Asso di Oro","Due di Oro","Tre di Oro","Quattro di Oro","Cinque di Oro","Sei di Oro","Sette di Oro","Donna di Oro","Cavallo di Oro","Re di Oro",
            "Asso di Bastoni","Due di Bastoni","Tre di Bastoni","Quattro di Bastoni","Cinque di Bastoni","Sei di Bastoni","Sette di Bastoni","Donna di Bastoni","Cavallo di Bastoni","Re di Bastoni",
            "Asso di Spade","Due di Spade","Tre di Spade","Quattro di Spade","Cinque di Spade","Sei di Spade","Sette di Spade","Donna di Spade","Cavallo di Spade","Re di Spade"];
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
        this._oldGamePhase = this._gamePhase;
    }

}

module.exports = Room;