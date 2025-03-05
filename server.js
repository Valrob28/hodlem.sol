const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// État du jeu
const gameState = {
    tables: new Map(),
    players: new Map()
};

// Gestion des connexions WebSocket
wss.on('connection', (ws) => {
    console.log('Nouvelle connexion établie');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, data);
        } catch (error) {
            console.error('Erreur lors du traitement du message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client déconnecté');
        // Nettoyer les données du joueur
        for (const [tableId, table] of gameState.tables) {
            table.players = table.players.filter(p => p.ws !== ws);
        }
    });
});

// Gestion des messages
function handleMessage(ws, data) {
    switch (data.type) {
        case 'JOIN_TABLE':
            handleJoinTable(ws, data);
            break;
        case 'CREATE_TABLE':
            handleCreateTable(ws, data);
            break;
        case 'PLACE_BET':
            handlePlaceBet(ws, data);
            break;
        case 'FOLD':
            handleFold(ws, data);
            break;
        default:
            console.warn('Type de message non reconnu:', data.type);
    }
}

// Fonctions de gestion des actions
function handleJoinTable(ws, data) {
    const { tableId, playerName } = data;
    const table = gameState.tables.get(tableId);
    
    if (!table) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Table non trouvée'
        }));
        return;
    }

    if (table.players.length >= 8) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Table pleine'
        }));
        return;
    }

    const player = {
        id: Date.now().toString(),
        name: playerName,
        ws,
        chips: 1000,
        position: table.players.length
    };

    table.players.push(player);
    broadcastTableState(tableId);
}

function handleCreateTable(ws, data) {
    const tableId = Date.now().toString();
    const table = {
        id: tableId,
        players: [],
        pot: 0,
        currentBet: 0,
        currentPlayer: 0,
        phase: 'WAITING',
        deck: [],
        communityCards: []
    };

    gameState.tables.set(tableId, table);
    ws.send(JSON.stringify({
        type: 'TABLE_CREATED',
        tableId
    }));
}

function handlePlaceBet(ws, data) {
    const { tableId, amount } = data;
    const table = gameState.tables.get(tableId);
    
    if (!table) return;

    const player = table.players.find(p => p.ws === ws);
    if (!player || player.chips < amount) return;

    player.chips -= amount;
    table.pot += amount;
    table.currentBet = Math.max(table.currentBet, amount);

    broadcastTableState(tableId);
}

function handleFold(ws, data) {
    const { tableId } = data;
    const table = gameState.tables.get(tableId);
    
    if (!table) return;

    const player = table.players.find(p => p.ws === ws);
    if (!player) return;

    player.folded = true;
    broadcastTableState(tableId);
}

// Fonction de diffusion de l'état de la table
function broadcastTableState(tableId) {
    const table = gameState.tables.get(tableId);
    if (!table) return;

    const state = {
        type: 'TABLE_STATE',
        tableId,
        players: table.players.map(p => ({
            id: p.id,
            name: p.name,
            chips: p.chips,
            position: p.position,
            folded: p.folded
        })),
        pot: table.pot,
        currentBet: table.currentBet,
        currentPlayer: table.currentPlayer,
        phase: table.phase,
        communityCards: table.communityCards
    };

    table.players.forEach(player => {
        player.ws.send(JSON.stringify(state));
    });
}

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Une erreur est survenue !');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
}); 