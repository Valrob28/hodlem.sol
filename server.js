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
    tables: new Map(),
    players: new Map(),
    dealers: new Map()
};

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
        console.log('Nombre de connexions restantes:', wss.clients.size);
        // Nettoyer les données du joueur
        for (const [tableId, table] of gameState.tables) {
            table.players = table.players.filter(p => p.ws !== ws);
        }
    });

    ws.on('error', (error) => {
        console.error('Erreur WebSocket:', error);
    });
});

// Gestion des messages
async function handleMessage(ws, data) {
    console.log('Traitement du message de type:', data.type);
    switch (data.type) {
        case 'JOIN_TABLE':
            await handleJoinTable(ws, data);
            break;
        case 'CREATE_TABLE':
            await handleCreateTable(ws, data);
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
    const { tableId, playerName } = data;
    console.log('Tentative de rejoindre la table:', {
        tableId,
        playerName,
        timestamp: new Date().toISOString()
    });
    
    try {
        // Vérifier si la table existe dans la base de données
        const table = await db.getTable(tableId);
        if (!table) {
            console.log('Table non trouvée:', tableId);
            ws.send(JSON.stringify({
                type: 'ERROR',
                message: 'Table non trouvée'
            }));
            return;
        }

        // Vérifier le nombre de joueurs
        const players = await db.getTablePlayers(tableId);
        if (players.length >= 8) {
            console.log('Table pleine:', tableId);
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
            position: players.length
        };

        console.log('Ajout du joueur à la table:', {
            tableId,
            playerId,
            playerName,
            position: players.length
        });

        // Ajouter le joueur à la base de données
        await db.addPlayerToTable(tableId, playerId, playerName, players.length);

        // Mettre à jour l'état en mémoire
        if (!gameState.tables.has(tableId)) {
            gameState.tables.set(tableId, {
                id: tableId,
                players: [],
                pot: table.pot,
                currentBet: table.current_bet,
                phase: table.phase,
                communityCards: table.community_cards || []
            });
        }
        gameState.tables.get(tableId).players.push(player);

        console.log('Joueur ajouté avec succès:', {
            tableId,
            playerId,
            playerName
        });
        
        broadcastTableState(tableId);
    } catch (error) {
        console.error('Erreur lors de l\'ajout du joueur:', error);
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Erreur lors de l\'ajout du joueur'
        }));
    }
}

async function handleCreateTable(ws, data) {
    console.log('Création d\'une nouvelle table');
    try {
        const playerId = Date.now().toString();
        const playerName = 'Host';

        // Créer la table dans la base de données
        const table = await db.createTable(playerId, playerName);
        console.log('Table créée avec ID:', table.id);

        // Créer le croupier pour cette table
        const dealer = new Dealer();
        gameState.dealers.set(table.id, dealer);

        // Ajouter le créateur comme premier joueur
        await db.addPlayerToTable(table.id, playerId, playerName, 0);
        dealer.addPlayer(playerId, playerName);

        // Ajouter des bots
        const botNames = ['Bot1', 'Bot2', 'Bot3'];
        for (let i = 0; i < botNames.length; i++) {
            const botId = `bot_${table.id}_${i}`;
            dealer.addBot(botId, botNames[i]);
        }

        // Mettre à jour l'état en mémoire
        gameState.tables.set(table.id, {
            id: table.id,
            players: [{
                id: playerId,
                name: playerName,
                ws,
                chips: 1000,
                position: 0
            }],
            pot: 0,
            currentBet: 0,
            phase: 'WAITING',
            communityCards: []
        });
        
        ws.send(JSON.stringify({
            type: 'TABLE_CREATED',
            tableId: table.id,
            playerId: playerId
        }));
        
        broadcastTableState(table.id);
    } catch (error) {
        console.error('Erreur lors de la création de la table:', error);
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Erreur lors de la création de la table'
        }));
    }
}

async function handlePlaceBet(ws, data) {
    const { tableId, amount } = data;
    console.log('Tentative de mise:', amount, 'sur la table:', tableId);
    
    try {
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

        // Mettre à jour l'état en mémoire
        player.chips -= amount;
        table.pot += amount;
        table.currentBet = Math.max(table.currentBet, amount);

        // Mettre à jour la base de données
        await db.updatePlayerState(tableId, player.id, {
            chips: player.chips,
            folded: player.folded,
            currentBet: amount
        });

        await db.updateTableState(tableId, {
            pot: table.pot,
            currentBet: table.currentBet,
            phase: table.phase,
            communityCards: table.communityCards
        });

        console.log('Mise acceptée:', amount, 'par:', player.name);
        broadcastTableState(tableId);
    } catch (error) {
        console.error('Erreur lors de la mise:', error);
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Erreur lors de la mise'
        }));
    }
}

async function handleFold(ws, data) {
    const { tableId } = data;
    console.log('Tentative de se coucher sur la table:', tableId);
    
    try {
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

        // Mettre à jour l'état en mémoire
        player.folded = true;

        // Mettre à jour la base de données
        await db.updatePlayerState(tableId, player.id, {
            chips: player.chips,
            folded: true,
            currentBet: player.currentBet
        });

        console.log('Joueur couché:', player.name);
        broadcastTableState(tableId);
    } catch (error) {
        console.error('Erreur lors du fold:', error);
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Erreur lors du fold'
        }));
    }
}

async function handleStartGame(ws, data) {
    const { tableId } = data;
    console.log('Démarrage de la partie sur la table:', tableId);
    
    try {
        const dealer = gameState.dealers.get(tableId);
        if (!dealer) {
            console.log('Croupier non trouvé pour la table:', tableId);
            return;
        }

        // Distribuer les cartes initiales
        dealer.dealInitialCards();
        
        // Mettre à jour l'état de la table
        const table = gameState.tables.get(tableId);
        if (table) {
            table.phase = dealer.getCurrentPhase();
            table.communityCards = dealer.getCommunityCards();
            table.pot = dealer.getPot();
            table.currentBet = dealer.getCurrentBet();
        }

        // Mettre à jour la base de données
        await db.updateTableState(tableId, {
            pot: dealer.getPot(),
            currentBet: dealer.getCurrentBet(),
            phase: dealer.getCurrentPhase(),
            communityCards: dealer.getCommunityCards()
        });

        // Diffuser l'état mis à jour
        broadcastTableState(tableId);

        // Gérer les actions des bots
        handleBotActions(tableId);
    } catch (error) {
        console.error('Erreur lors du démarrage de la partie:', error);
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Erreur lors du démarrage de la partie'
        }));
    }
}

async function handleBotActions(tableId) {
    const dealer = gameState.dealers.get(tableId);
    if (!dealer) return;

    // Simuler les actions des bots
    for (const [botId, bot] of dealer.bots) {
        const action = dealer.botAction(botId);
        if (action) {
            console.log(`Bot ${bot.name} effectue l'action:`, action);
            // Traiter l'action du bot
            switch (action.type) {
                case 'FOLD':
                    await handleFold(null, { tableId, botId });
                    break;
                case 'CALL':
                    await handlePlaceBet(null, { tableId, amount: action.amount, botId });
                    break;
                case 'RAISE':
                    await handlePlaceBet(null, { tableId, amount: action.amount, botId });
                    break;
            }
        }
    }
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
    console.log('Configuration:', {
        port: PORT,
        env: process.env.NODE_ENV,
        supabase: {
            url: process.env.SUPABASE_URL ? 'Défini' : 'Non défini',
            key: process.env.SUPABASE_ANON_KEY ? 'Défini' : 'Non défini'
        }
    });
}); 