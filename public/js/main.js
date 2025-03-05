class PokerApp {
    constructor() {
        this.table = new PokerTable();
        this.game = new PokerGame();
        this.websocket = new WebSocketManager();
        
        this.currentTableId = 'default-table';
        this.playerId = null;
        this.playerName = null;
        this.isHost = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupWebSocketEvents();
        this.showLoginModal();
        this.websocket.connect();
    }

    showLoginModal() {
        const modal = document.getElementById('login-modal');
        modal.style.display = 'flex';
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-ui').classList.add('hidden');
    }

    hideLoginModal() {
        const modal = document.getElementById('login-modal');
        modal.style.display = 'none';
    }

    showGameUI() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        document.getElementById('start-game').style.display = this.isHost ? 'block' : 'none';
    }

    setupEventListeners() {
        // Gestionnaires pour le formulaire de connexion
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const playerNameInput = document.getElementById('player-name-input');
            this.playerName = playerNameInput.value.trim();
            if (this.playerName) {
                this.hideLoginModal();
                this.websocket.joinTable(this.currentTableId, this.playerName);
            }
        });

        document.getElementById('join-spectator-submit').addEventListener('click', () => {
            this.playerName = 'Spectateur';
            this.hideLoginModal();
            this.websocket.joinTable(this.currentTableId, this.playerName);
        });

        // Gestionnaires pour les contrôles de jeu
        document.getElementById('fold').addEventListener('click', () => this.fold());
        document.getElementById('check').addEventListener('click', () => this.check());
        document.getElementById('call').addEventListener('click', () => this.call());
        document.getElementById('raise').addEventListener('click', () => this.raise());
        document.getElementById('bet-slider').addEventListener('input', (e) => this.updateBetAmount(e.target.value));
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
    }

    setupWebSocketEvents() {
        // Gestionnaire pour les mises à jour de l'état de la table
        window.addEventListener('tableStateUpdate', (event) => {
            this.updateTableState(event.detail);
        });

        // Gestionnaire pour les nouveaux joueurs
        window.addEventListener('playerJoined', (event) => {
            this.handlePlayerJoined(event.detail);
        });

        // Gestionnaire pour les joueurs qui quittent
        window.addEventListener('playerLeft', (event) => {
            this.handlePlayerLeft(event.detail);
        });

        // Gestionnaire pour le début de partie
        window.addEventListener('gameStart', (event) => {
            this.handleGameStart(event.detail);
        });

        // Gestionnaire pour les erreurs du serveur
        window.addEventListener('serverError', (event) => {
            this.handleServerError(event.detail);
        });
    }

    updateTableState(state) {
        console.log('Mise à jour de l\'état de la table:', state);
        // Mettre à jour l'état du jeu
        this.game.players = new Map(state.players);
        this.game.pot = state.pot;
        this.game.currentBet = state.currentBet;
        this.game.phase = state.phase;
        this.game.communityCards = state.communityCards;

        // Mettre à jour l'affichage 3D
        this.updateTableDisplay();
    }

    updateTableDisplay() {
        // Mettre à jour les positions des joueurs
        for (const [playerId, player] of this.game.players) {
            this.table.addPlayer(playerId, player.position);
            if (player.cards) {
                player.cards.forEach(card => {
                    this.table.dealCard(playerId, card);
                });
            }
        }

        // Mettre à jour les cartes communes
        this.table.updateCommunityCards(this.game.communityCards);
    }

    handlePlayerJoined(data) {
        console.log('Nouveau joueur rejoint:', data);
        const { playerId, playerName, position, isHost } = data;
        this.game.addPlayer(playerId, playerName);
        this.table.addPlayer(playerId, position);
        
        if (playerName === this.playerName) {
            this.playerId = playerId;
            this.isHost = isHost;
            this.showGameUI();
        }
    }

    handlePlayerLeft(data) {
        console.log('Joueur quitté:', data);
        const { playerId } = data;
        this.game.players.delete(playerId);
        this.table.removePlayer(playerId);
    }

    handleGameStart(data) {
        console.log('Début de partie:', data);
        this.game.startNewHand();
        this.updateTableDisplay();
    }

    handleServerError(data) {
        console.error('Erreur serveur:', data);
        alert(`Erreur : ${data.message}`);
    }

    // Actions de jeu
    fold() {
        if (this.currentTableId) {
            console.log('Se coucher');
            this.websocket.fold(this.currentTableId);
        }
    }

    check() {
        if (this.currentTableId && this.game.currentBet === 0) {
            console.log('Parole');
            this.websocket.check(this.currentTableId);
        }
    }

    call() {
        if (this.currentTableId) {
            const callAmount = this.game.currentBet;
            console.log('Suivre:', callAmount);
            this.websocket.placeBet(this.currentTableId, callAmount);
        }
    }

    raise() {
        if (this.currentTableId) {
            const raiseAmount = parseInt(document.getElementById('bet-slider').value);
            console.log('Relancer:', raiseAmount);
            this.websocket.placeBet(this.currentTableId, raiseAmount);
        }
    }

    updateBetAmount(value) {
        const slider = document.getElementById('bet-slider');
        const maxBet = this.game.players.get(this.playerId)?.chips || 0;
        slider.max = maxBet;
        slider.value = Math.min(value, maxBet);
    }

    startGame() {
        if (this.currentTableId && this.playerName) {
            console.log('Démarrage de la partie');
            this.websocket.send({
                type: 'START_GAME',
                tableId: this.currentTableId,
                playerName: this.playerName
            });
        }
    }
}

// Initialiser l'application
const app = new PokerApp(); 