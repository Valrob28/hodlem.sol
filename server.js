require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const db = require('./services/database');
const Dealer = require('./public/js/dealer');

console.log('Démarrage du serveur...');
console.log('Variables d\'environnement:', {
    SUPABASE_URL: process.env.SUPABASE_URL ? 'Défini' : 'Non défini',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'Défini' : 'Non défini'
});

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Route principale
app.get('/', (req, res) => {
    console.log('Requête GET reçue sur la route principale');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// État du jeu
const gameState = {
    table: {
        id: 'default-table',
        players: [],
        pot: 0,
        currentBet: 0,
        phase: 'WAITING',
        communityCards: []
    },
    dealer: null
};

// Initialiser la table par défaut
async function initializeDefaultTable() {
    try {
        const table = await db.getTable('default-table');
        if (!table) {
            await db.createTable('default-table', 'System', 1000, 10000, 10, 20);
            console.log('Table par défaut créée');
        } else {
            console.log('Table par défaut trouvée');
        }
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de la table:', error);
    }
}

// Gestion des connexions WebSocket
wss.on('connection', (ws) => {
    console.log('Nouvelle connexion WebSocket établie');
    console.log('Nombre de connexions actives:', wss.clients.size);

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Message WebSocket reçu:', {
                type: data.type,
                tableId: data.tableId,
                playerName: data.playerName,
                timestamp: new Date().toISOString()
            });
            await handleMessage(ws, data);
        } catch (error) {
            console.error('Erreur lors du traitement du message:', error);
            ws.send(JSON.stringify({
                type: 'ERROR',
                message: 'Une erreur est survenue'
            }));
        }
    });

    ws.on('close', () => {
        console.log('Client WebSocket déconnecté');
        handlePlayerDisconnect(ws);
    });

    ws.on('error', (error) => {
        console.error('Erreur WebSocket:', error);
        handlePlayerDisconnect(ws);
    });
});

// Gestion de la déconnexion des joueurs
async function handlePlayerDisconnect(ws) {
    console.log('Gestion de la déconnexion du joueur');
    
    const player = gameState.table.players.find(p => p.ws === ws);
    if (player) {
        console.log(`Joueur ${player.name} déconnecté`);
        
        // Si la partie est en cours, gérer le fold automatique
        if (gameState.table.phase !== 'WAITING') {
            await handleFold(ws, { tableId: gameState.table.id });
        }
        
        // Retirer le joueur de la table
        gameState.table.players = gameState.table.players.filter(p => p.ws !== ws);
        
        // Mettre à jour la base de données
        try {
            await db.removePlayerFromTable(gameState.table.id, player.id);
        } catch (error) {
            console.error('Erreur lors de la suppression du joueur:', error);
        }
        
        // Diffuser l'état mis à jour aux autres joueurs
        broadcastTableState();
    }
}

// Gestion des messages
async function handleMessage(ws, data) {
    console.log('Traitement du message de type:', data.type);
    switch (data.type) {
        case 'JOIN_TABLE':
            await handleJoinTable(ws, data);
            break;
        case 'PLACE_BET':
            await handlePlaceBet(ws, data);
            break;
        case 'FOLD':
            await handleFold(ws, data);
            break;
        case 'START_GAME':
            await handleStartGame(ws, data);
            break;
        default:
            console.warn('Type de message non reconnu:', data.type);
    }
}

// Fonctions de gestion des actions
async function handleJoinTable(ws, data) {
    const { playerName } = data;
    console.log('Tentative de rejoindre la table:', {
        playerName,
        timestamp: new Date().toISOString()
    });
    
    try {
        // Vérifier le nombre de joueurs
        if (gameState.table.players.length >= 8) {
            console.log('Table pleine');
            ws.send(JSON.stringify({
                type: 'ERROR',
                message: 'Table pleine'
            }));
            return;
        }

        const playerId = Date.now().toString();
        const player = {
            id: playerId,
            name: playerName,
            ws,
            chips: 1000,
            position: gameState.table.players.length
        };

        console.log('Ajout du joueur à la table:', {
            playerId,
            playerName,
            position: gameState.table.players.length
        });

        // Ajouter le joueur à la base de données
        await db.addPlayerToTable(gameState.table.id, playerId, playerName, gameState.table.players.length);

        // Mettre à jour l'état en mémoire
        gameState.table.players.push(player);

        console.log('Joueur ajouté avec succès:', {
            playerId,
            playerName
        });
        
        broadcastTableState();
    } catch (error) {
        console.error('Erreur lors de l\'ajout du joueur:', error);
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Erreur lors de l\'ajout du joueur'
        }));
    }
}

async function handlePlaceBet(ws, data) {
    const { amount } = data;
    const player = gameState.table.players.find(p => p.ws === ws);
    
    if (!player) {
        console.log('Joueur non trouvé');
        return;
    }

    if (amount > player.chips) {
        console.log('Mise trop élevée');
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Mise trop élevée'
        }));
        return;
    }

    player.chips -= amount;
    player.currentBet += amount;
    gameState.table.pot += amount;
    gameState.table.currentBet = Math.max(gameState.table.currentBet, amount);

    await db.updateTableState(gameState.table.id, {
        pot: gameState.table.pot,
        current_bet: gameState.table.currentBet
    });

    await db.updatePlayerState(gameState.table.id, player.id, {
        chips: player.chips,
        current_bet: player.currentBet
    });

    broadcastTableState();
}

async function handleFold(ws, data) {
    const player = gameState.table.players.find(p => p.ws === ws);
    
    if (!player) {
        console.log('Joueur non trouvé');
        return;
    }

    console.log('Joueur couché:', player.name);
    player.folded = true;

    await db.updatePlayerState(gameState.table.id, player.id, {
        folded: true
    });

    broadcastTableState();
}

async function handleStartGame(ws, data) {
    const player = gameState.table.players.find(p => p.ws === ws);
    
    if (!player) {
        console.log('Joueur non trouvé');
        return;
    }

    if (gameState.table.players.length < 2) {
        console.log('Pas assez de joueurs pour démarrer');
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Il faut au moins 2 joueurs pour démarrer'
        }));
        return;
    }

    console.log('Démarrage de la partie');
    gameState.table.phase = 'DEALING';
    
    // Créer un nouveau dealer si nécessaire
    if (!gameState.dealer) {
        gameState.dealer = new Dealer();
    }

    // Distribuer les cartes
    const cards = gameState.dealer.dealCards(gameState.table.players.length);
    
    // Mettre à jour les cartes des joueurs
    for (let i = 0; i < gameState.table.players.length; i++) {
        const player = gameState.table.players[i];
        player.cards = cards[i];
        await db.updatePlayerCards(gameState.table.id, player.id, cards[i]);
    }

    gameState.table.phase = 'PREFLOP';
    broadcastTableState();
}

// Fonction pour diffuser l'état de la table
function broadcastTableState() {
    const state = {
        type: 'TABLE_STATE',
        players: gameState.table.players.map(p => ({
            id: p.id,
            name: p.name,
            position: p.position,
            chips: p.chips,
            currentBet: p.currentBet,
            folded: p.folded,
            cards: p.cards
        })),
        pot: gameState.table.pot,
        currentBet: gameState.table.currentBet,
        phase: gameState.table.phase,
        communityCards: gameState.table.communityCards
    };

    const message = JSON.stringify(state);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
    await initializeDefaultTable();
}); 