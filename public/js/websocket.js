class WebSocketManager {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.messageHandlers = new Map();
        this.setupMessageHandlers();
    }

    connect() {
        // Utiliser wss:// pour les connexions sécurisées sur Render
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log('Connexion WebSocket établie');
            this.connected = true;
            this.reconnectAttempts = 0;
        };

        this.socket.onclose = () => {
            console.log('Connexion WebSocket fermée');
            this.connected = false;
            this.attemptReconnect();
        };

        this.socket.onerror = (error) => {
            console.error('Erreur WebSocket:', error);
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                console.error('Erreur lors du traitement du message:', error);
            }
        };
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.error('Impossible de se reconnecter après plusieurs tentatives');
        }
    }

    setupMessageHandlers() {
        this.messageHandlers.set('TABLE_STATE', this.handleTableState.bind(this));
        this.messageHandlers.set('PLAYER_JOINED', this.handlePlayerJoined.bind(this));
        this.messageHandlers.set('PLAYER_LEFT', this.handlePlayerLeft.bind(this));
        this.messageHandlers.set('GAME_START', this.handleGameStart.bind(this));
        this.messageHandlers.set('ERROR', this.handleError.bind(this));
        this.messageHandlers.set('TABLE_CREATED', this.handleTableCreated.bind(this));
    }

    handleMessage(data) {
        const handler = this.messageHandlers.get(data.type);
        if (handler) {
            handler(data);
        } else {
            console.warn('Type de message non géré:', data.type);
        }
    }

    handleTableState(data) {
        // Émettre un événement personnalisé pour la mise à jour de l'état de la table
        const event = new CustomEvent('tableStateUpdate', { detail: data });
        window.dispatchEvent(event);
    }

    handleTableCreated(data) {
        // Émettre un événement personnalisé pour la création de table
        const event = new CustomEvent('tableCreated', { detail: data });
        window.dispatchEvent(event);
    }

    handlePlayerJoined(data) {
        const event = new CustomEvent('playerJoined', { detail: data });
        window.dispatchEvent(event);
    }

    handlePlayerLeft(data) {
        const event = new CustomEvent('playerLeft', { detail: data });
        window.dispatchEvent(event);
    }

    handleGameStart(data) {
        const event = new CustomEvent('gameStart', { detail: data });
        window.dispatchEvent(event);
    }

    handleError(data) {
        console.error('Erreur du serveur:', data.message);
        // Afficher l'erreur à l'utilisateur
        const event = new CustomEvent('serverError', { detail: data });
        window.dispatchEvent(event);
    }

    send(message) {
        if (this.connected) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.error('Impossible d\'envoyer le message: WebSocket non connecté');
        }
    }

    // Méthodes pour les actions du jeu
    joinTable(tableId, playerName) {
        this.send({
            type: 'JOIN_TABLE',
            tableId,
            playerName
        });
    }

    createTable() {
        this.send({
            type: 'CREATE_TABLE'
        });
    }

    placeBet(tableId, amount) {
        this.send({
            type: 'PLACE_BET',
            tableId,
            amount
        });
    }

    fold(tableId) {
        this.send({
            type: 'FOLD',
            tableId
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.connected = false;
        }
    }
} 