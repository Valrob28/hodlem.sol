class PokerGame {
    constructor() {
        this.deck = [];
        this.communityCards = [];
        this.players = new Map();
        this.currentPlayerIndex = 0;
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

    startNewHand() {
        // Réinitialiser le deck
        this.initializeDeck();
        this.shuffle();
        
        // Réinitialiser les cartes communes
        this.communityCards = [];
        
        // Réinitialiser les mises
        this.pot = 0;
        this.currentBet = 0;
        
        // Distribuer les cartes aux joueurs
        for (const [playerId, player] of this.players) {
            if (!player.folded) {
                player.cards = [this.deck.pop(), this.deck.pop()];
            }
        }
        
        // Mettre à jour la position du dealer
        this.dealerPosition = (this.dealerPosition + 1) % this.players.size;
        
        // Définir les blinds
        const smallBlindPos = (this.dealerPosition + 1) % this.players.size;
        const bigBlindPos = (this.dealerPosition + 2) % this.players.size;
        
        // Collecter les blinds
        const smallBlindPlayer = Array.from(this.players.values())[smallBlindPos];
        const bigBlindPlayer = Array.from(this.players.values())[bigBlindPos];
        
        if (smallBlindPlayer.chips >= this.smallBlind) {
            smallBlindPlayer.chips -= this.smallBlind;
            this.pot += this.smallBlind;
        }
        
        if (bigBlindPlayer.chips >= this.bigBlind) {
            bigBlindPlayer.chips -= this.bigBlind;
            this.pot += this.bigBlind;
            this.currentBet = this.bigBlind;
        }
        
        // Le premier à parler est à gauche de la big blind
        this.currentPlayerIndex = (bigBlindPos + 1) % this.players.size;
    }

    dealFlop() {
        // Brûler une carte
        this.deck.pop();
        
        // Distribuer le flop
        for (let i = 0; i < 3; i++) {
            this.communityCards.push(this.deck.pop());
        }
    }

    dealTurn() {
        // Brûler une carte
        this.deck.pop();
        
        // Distribuer la turn
        this.communityCards.push(this.deck.pop());
    }

    dealRiver() {
        // Brûler une carte
        this.deck.pop();
        
        // Distribuer la river
        this.communityCards.push(this.deck.pop());
    }

    addPlayer(playerId, playerName, chips = 1000) {
        this.players.set(playerId, {
            id: playerId,
            name: playerName,
            chips: chips,
            cards: [],
            folded: false,
            currentBet: 0
        });
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
    }

    getPlayer(playerId) {
        return this.players.get(playerId);
    }

    getCurrentPhase() {
        return this.phase;
    }

    getPot() {
        return this.pot;
    }

    getCurrentBet() {
        return this.currentBet;
    }

    getCurrentPlayerIndex() {
        return this.currentPlayerIndex;
    }

    getCommunityCards() {
        return this.communityCards;
    }

    // Méthodes pour la gestion des actions
    fold(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            player.folded = true;
            this.nextPlayer();
        }
    }

    check(playerId) {
        if (this.currentBet === 0) {
            this.nextPlayer();
            return true;
        }
        return false;
    }

    call(playerId) {
        const player = this.players.get(playerId);
        if (player && player.chips >= this.currentBet) {
            const callAmount = this.currentBet - player.currentBet;
            player.chips -= callAmount;
            player.currentBet = this.currentBet;
            this.pot += callAmount;
            this.nextPlayer();
            return true;
        }
        return false;
    }

    raise(playerId, amount) {
        const player = this.players.get(playerId);
        if (player && player.chips >= amount && amount > this.currentBet) {
            player.chips -= amount;
            player.currentBet = amount;
            this.pot += amount;
            this.currentBet = amount;
            this.currentPlayerIndex = (this.currentPlayerIndex - 1 + this.players.size) % this.players.size;
            return true;
        }
        return false;
    }

    nextPlayer() {
        do {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.size;
        } while (Array.from(this.players.values())[this.currentPlayerIndex].folded);
    }

    // Méthodes pour la gestion des phases
    nextPhase() {
        switch (this.phase) {
            case 'PREFLOP':
                this.phase = 'FLOP';
                this.dealFlop();
                break;
            case 'FLOP':
                this.phase = 'TURN';
                this.dealTurn();
                break;
            case 'TURN':
                this.phase = 'RIVER';
                this.dealRiver();
                break;
            case 'RIVER':
                this.phase = 'SHOWDOWN';
                break;
            default:
                this.phase = 'WAITING';
        }
        this.currentBet = 0;
        this.currentPlayerIndex = this.dealerPosition;
        this.nextPlayer();
    }

    // Méthodes pour la gestion des résultats
    evaluateHand(playerId) {
        const player = this.players.get(playerId);
        if (!player || player.folded) return null;

        const allCards = [...player.cards, ...this.communityCards];
        // Implémenter la logique d'évaluation des mains ici
        return {
            rank: 0,
            name: 'High Card',
            cards: []
        };
    }

    determineWinner() {
        let winner = null;
        let bestHand = null;

        for (const [playerId, player] of this.players) {
            if (!player.folded) {
                const hand = this.evaluateHand(playerId);
                if (!bestHand || hand.rank > bestHand.rank) {
                    bestHand = hand;
                    winner = playerId;
                }
            }
        }

        return winner;
    }
} 