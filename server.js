require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// État du jeu
const gameState = {
    player: null,
    dealer: null,
    deck: [],
    pot: 0,
    currentBet: 0,
    phase: 'WAITING' // WAITING, DEALING, PLAYER_TURN, DEALER_TURN, SHOWDOWN
};

// Initialiser le deck
function initializeDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    
    gameState.deck = [];
    for (const suit of suits) {
        for (const value of values) {
            gameState.deck.push({ suit, value });
        }
    }
}

// Mélanger le deck
function shuffle() {
    for (let i = gameState.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameState.deck[i], gameState.deck[j]] = [gameState.deck[j], gameState.deck[i]];
    }
}

// Distribuer une carte
function dealCard() {
    return gameState.deck.pop();
}

// Gestion des connexions WebSocket
wss.on('connection', (ws) => {
    console.log('Nouvelle connexion WebSocket établie');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, data);
        } catch (error) {
            console.error('Erreur lors du traitement du message:', error);
            ws.send(JSON.stringify({
                type: 'ERROR',
                message: 'Une erreur est survenue'
            }));
        }
    });

    ws.on('close', () => {
        console.log('Client déconnecté');
        gameState.player = null;
    });
});

// Gestion des messages
function handleMessage(ws, data) {
    switch (data.type) {
        case 'START_GAME':
            handleStartGame(ws);
            break;
        case 'PLACE_BET':
            handlePlaceBet(ws, data);
            break;
        case 'FOLD':
            handleFold(ws);
            break;
        default:
            console.warn('Type de message non reconnu:', data.type);
    }
}

// Démarrer une nouvelle partie
function handleStartGame(ws) {
    if (gameState.player) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Une partie est déjà en cours'
        }));
        return;
    }

    gameState.player = {
        ws,
        chips: 1000,
        cards: [],
        currentBet: 0
    };

    initializeDeck();
    shuffle();

    // Distribuer les cartes
    gameState.player.cards = [dealCard(), dealCard()];
    gameState.dealer = {
        cards: [dealCard(), dealCard()]
    };

    gameState.phase = 'PLAYER_TURN';
    gameState.pot = 0;
    gameState.currentBet = 0;

    ws.send(JSON.stringify({
        type: 'GAME_START',
        playerCards: gameState.player.cards,
        dealerCards: [gameState.dealer.cards[0], { suit: '?', value: '?' }],
        chips: gameState.player.chips
    }));
}

// Gérer une mise
function handlePlaceBet(ws, data) {
    if (!gameState.player || gameState.player.ws !== ws) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Aucune partie en cours'
        }));
        return;
    }

    const { amount } = data;
    if (amount > gameState.player.chips) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Mise trop élevée'
        }));
        return;
    }

    gameState.player.chips -= amount;
    gameState.player.currentBet += amount;
    gameState.pot += amount;
    gameState.currentBet = Math.max(gameState.currentBet, amount);

    ws.send(JSON.stringify({
        type: 'BET_PLACED',
        chips: gameState.player.chips,
        pot: gameState.pot,
        currentBet: gameState.currentBet
    }));
}

// Gérer un fold
function handleFold(ws) {
    if (!gameState.player || gameState.player.ws !== ws) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Aucune partie en cours'
        }));
        return;
    }

    gameState.phase = 'SHOWDOWN';
    ws.send(JSON.stringify({
        type: 'GAME_OVER',
        dealerCards: gameState.dealer.cards,
        pot: gameState.pot,
        chips: gameState.player.chips
    }));

    // Réinitialiser la partie
    gameState.player = null;
    gameState.dealer = null;
    gameState.pot = 0;
    gameState.currentBet = 0;
    gameState.phase = 'WAITING';
}

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
}); 