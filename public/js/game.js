class PokerGame {
    constructor() {
        this.deck = [];
        this.communityCards = [];
        this.players = new Map();
        this.currentPlayer = 0;
        this.pot = 0;
        this.currentBet = 0;
        this.phase = 'WAITING'; // WAITING, PREFLOP, FLOP, TURN, RIVER, SHOWDOWN
        this.smallBlind = 10;
        this.bigBlind = 20;
        this.dealerPosition = 0;
        this.initializeDeck();
    }

    initializeDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        
        this.deck = [];
        for (const suit of suits) {
            for (const value of values) {
                this.deck.push({ suit, value });
            }
        }
    }

    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    addPlayer(playerId, name) {
        this.players.set(playerId, {
            id: playerId,
            name,
            chips: 1000,
            cards: [],
            position: this.players.size,
            folded: false,
            currentBet: 0
        });
    }

    startNewHand() {
        this.shuffle();
        this.communityCards = [];
        this.pot = 0;
        this.currentBet = 0;
        this.phase = 'PREFLOP';

        // Réinitialiser les mains des joueurs
        for (const player of this.players.values()) {
            player.cards = [];
            player.folded = false;
            player.currentBet = 0;
        }

        // Distribuer les cartes
        this.dealCards();
        
        // Collecter les blinds
        this.collectBlinds();
    }

    dealCards() {
        // Distribuer 2 cartes à chaque joueur
        for (let i = 0; i < 2; i++) {
            for (const player of this.players.values()) {
                if (this.deck.length > 0) {
                    player.cards.push(this.deck.pop());
                }
            }
        }
    }

    collectBlinds() {
        const players = Array.from(this.players.values());
        const smallBlindPlayer = players[this.dealerPosition];
        const bigBlindPlayer = players[(this.dealerPosition + 1) % players.length];

        // Collecter la petite blinde
        if (smallBlindPlayer.chips >= this.smallBlind) {
            smallBlindPlayer.chips -= this.smallBlind;
            smallBlindPlayer.currentBet = this.smallBlind;
            this.pot += this.smallBlind;
        }

        // Collecter la grande blinde
        if (bigBlindPlayer.chips >= this.bigBlind) {
            bigBlindPlayer.chips -= this.bigBlind;
            bigBlindPlayer.currentBet = this.bigBlind;
            this.pot += this.bigBlind;
        }

        this.currentBet = this.bigBlind;
    }

    dealFlop() {
        // Brûler une carte
        this.deck.pop();
        
        // Distribuer 3 cartes communes
        for (let i = 0; i < 3; i++) {
            this.communityCards.push(this.deck.pop());
        }
        
        this.phase = 'FLOP';
        this.currentBet = 0;
        this.resetPlayerBets();
    }

    dealTurn() {
        // Brûler une carte
        this.deck.pop();
        
        // Distribuer la turn
        this.communityCards.push(this.deck.pop());
        
        this.phase = 'TURN';
        this.currentBet = 0;
        this.resetPlayerBets();
    }

    dealRiver() {
        // Brûler une carte
        this.deck.pop();
        
        // Distribuer la river
        this.communityCards.push(this.deck.pop());
        
        this.phase = 'RIVER';
        this.currentBet = 0;
        this.resetPlayerBets();
    }

    resetPlayerBets() {
        for (const player of this.players.values()) {
            player.currentBet = 0;
        }
    }

    placeBet(playerId, amount) {
        const player = this.players.get(playerId);
        if (!player || player.folded || amount > player.chips) return false;

        player.chips -= amount;
        player.currentBet += amount;
        this.pot += amount;

        if (amount > this.currentBet) {
            this.currentBet = amount;
        }

        return true;
    }

    fold(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            player.folded = true;
            return true;
        }
        return false;
    }

    getActivePlayers() {
        return Array.from(this.players.values()).filter(p => !p.folded);
    }

    moveDealer() {
        this.dealerPosition = (this.dealerPosition + 1) % this.players.size;
    }

    evaluateHand(playerId) {
        const player = this.players.get(playerId);
        if (!player) return null;

        const allCards = [...player.cards, ...this.communityCards];
        return this.calculateHandRank(allCards);
    }

    calculateHandRank(cards) {
        // Implémentation simplifiée de l'évaluation des mains
        // À compléter avec une logique plus sophistiquée
        return {
            rank: 1,
            name: 'High Card',
            value: Math.max(...cards.map(card => this.getCardValue(card.value)))
        };
    }

    getCardValue(value) {
        const values = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
            '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };
        return values[value] || 0;
    }
} 