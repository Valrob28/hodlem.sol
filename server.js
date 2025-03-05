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
            console.log('Message reçu:', data);
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
    console.log('Traitement du message de type:', data.type);
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
    console.log('Tentative de rejoindre la table:', tableId, 'par:', playerName);
    
    const table = gameState.tables.get(tableId);
    
    if (!table) {
        console.log('Table non trouvée:', tableId);
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Table non trouvée'
        }));
        return;
    }

    if (table.players.length >= 8) {
        console.log('Table pleine:', tableId);
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
    console.log('Joueur ajouté à la table:', player);
    broadcastTableState(tableId);
}

function handleCreateTable(ws, data) {
    console.log('Création d\'une nouvelle table');
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
    console.log('Table créée avec ID:', tableId);
    
    // Ajouter le créateur comme premier joueur
    const player = {
        id: Date.now().toString(),
        name: 'Host',
        ws,
        chips: 1000,
        position: 0
    };
    table.players.push(player);
    
    ws.send(JSON.stringify({
        type: 'TABLE_CREATED',
        tableId,
        playerId: player.id
    }));
    
    broadcastTableState(tableId);
}

function handlePlaceBet(ws, data) {
    const { tableId, amount } = data;
    console.log('Tentative de mise:', amount, 'sur la table:', tableId);
    
    const table = gameState.tables.get(tableId);
    
    if (!table) {
        console.log('Table non trouvée pour la mise:', tableId);
        return;
    }

    const player = table.players.find(p => p.ws === ws);
    if (!player || player.chips < amount) {
        console.log('Mise invalide:', player ? 'insuffisante' : 'joueur non trouvé');
        return;
    }

    player.chips -= amount;
    table.pot += amount;
    table.currentBet = Math.max(table.currentBet, amount);

    console.log('Mise acceptée:', amount, 'par:', player.name);
    broadcastTableState(tableId);
}

function handleFold(ws, data) {
    const { tableId } = data;
    console.log('Tentative de se coucher sur la table:', tableId);
    
    const table = gameState.tables.get(tableId);
    
    if (!table) {
        console.log('Table non trouvée pour le fold:', tableId);
        return;
    }

    const player = table.players.find(p => p.ws === ws);
    if (!player) {
        console.log('Joueur non trouvé pour le fold');
        return;
    }

    player.folded = true;
    console.log('Joueur couché:', player.name);
    broadcastTableState(tableId);
}

// Fonction de diffusion de l'état de la table
function broadcastTableState(tableId) {
    const table = gameState.tables.get(tableId);
    if (!table) {
        console.log('Table non trouvée pour le broadcast:', tableId);
        return;
    }

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

    console.log('Diffusion de l\'état de la table:', tableId);
    table.players.forEach(player => {
        try {
            player.ws.send(JSON.stringify(state));
        } catch (error) {
            console.error('Erreur lors de l\'envoi à un joueur:', error);
        }
    });
}

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err.stack);
    res.status(500).send('Une erreur est survenue !');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
    console.log('Environnement:', process.env.NODE_ENV);
}); 