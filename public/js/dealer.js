class Dealer {
    constructor() {
        this.deck = [];
        this.communityCards = [];
        this.currentPhase = 'WAITING';
        this.smallBlind = 10;
        this.bigBlind = 20;
        this.currentBet = 0;
        this.pot = 0;
        this.currentPlayerIndex = 0;
        this.players = new Map();
        this.bots = new Map();
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

    dealCard() {
        return this.deck.pop();
    }

    dealInitialCards() {
        this.shuffle();
        this.communityCards = [];
        this.currentPhase = 'PREFLOP';
        this.currentBet = this.bigBlind;
        this.pot = this.smallBlind + this.bigBlind;

        // Distribuer 2 cartes à chaque joueur
        for (const player of this.players.values()) {
            player.cards = [this.dealCard(), this.dealCard()];
            player.currentBet = 0;
            player.folded = false;
        }

        // Distribuer 2 cartes à chaque bot
        for (const bot of this.bots.values()) {
            bot.cards = [this.dealCard(), this.dealCard()];
            bot.currentBet = 0;
            bot.folded = false;
        }
    }

    dealFlop() {
        this.currentPhase = 'FLOP';
        // Brûler une carte
        this.dealCard();
        // Distribuer le flop (3 cartes)
        this.communityCards = [
            this.dealCard(),
            this.dealCard(),
            this.dealCard()
        ];
    }

    dealTurn() {
        this.currentPhase = 'TURN';
        // Brûler une carte
        this.dealCard();
        // Distribuer la turn
        this.communityCards.push(this.dealCard());
    }

    dealRiver() {
        this.currentPhase = 'RIVER';
        // Brûler une carte
        this.dealCard();
        // Distribuer la river
        this.communityCards.push(this.dealCard());
    }

    addPlayer(playerId, playerName, chips = 1000) {
        this.players.set(playerId, {
            id: playerId,
            name: playerName,
            chips,
            cards: [],
            currentBet: 0,
            folded: false
        });
    }

    addBot(botId, botName, difficulty = 'MEDIUM') {
        this.bots.set(botId, {
            id: botId,
            name: botName,
            chips: 1000,
            cards: [],
            currentBet: 0,
            folded: false,
            difficulty
        });
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
    }

    removeBot(botId) {
        this.bots.delete(botId);
    }

    getPlayerState(playerId) {
        return this.players.get(playerId);
    }

    getBotState(botId) {
        return this.bots.get(botId);
    }

    getAllPlayers() {
        return [...this.players.values(), ...this.bots.values()];
    }

    getCurrentPhase() {
        return this.currentPhase;
    }

    getCommunityCards() {
        return this.communityCards;
    }

    getPot() {
        return this.pot;
    }

    getCurrentBet() {
        return this.currentBet;
    }

    // Logique des bots
    botAction(botId) {
        const bot = this.bots.get(botId);
        if (!bot || bot.folded) return null;

        const action = this.calculateBotAction(bot);
        return action;
    }

    calculateBotAction(bot) {
        // Logique simple pour les bots
        const random = Math.random();
        if (random < 0.3) {
            return { type: 'FOLD' };
        } else if (random < 0.6) {
            return { type: 'CALL', amount: this.currentBet - bot.currentBet };
        } else {
            const raiseAmount = Math.min(
                this.currentBet * 2,
                bot.chips
            );
            return { type: 'RAISE', amount: raiseAmount };
        }
    }
}

module.exports = Dealer; 