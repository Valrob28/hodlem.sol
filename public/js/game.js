class PokerGame {
    constructor() {
        this.ws = null;
        this.soundManager = new SoundManager();
        this.animationManager = new AnimationManager();
        this.stats = {
            handsWon: 0,
            bestHand: null,
            bestHandRank: 0
        };
        
        this.connect();
        this.setupEventListeners();
        this.loadStats();
    }

    connect() {
        this.ws = new WebSocket(`ws://${window.location.host}`);

        this.ws.onopen = () => {
            console.log('Connexion WebSocket établie');
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };

        this.ws.onclose = () => {
            console.log('Connexion WebSocket fermée');
        };
    }

    setupEventListeners() {
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        document.getElementById('fold').addEventListener('click', () => this.fold());
        document.getElementById('place-bet').addEventListener('click', () => this.placeBet());
        document.getElementById('bet-slider').addEventListener('input', (e) => this.updateBetAmount(e.target.value));
        document.getElementById('toggle-sound').addEventListener('click', () => this.toggleSound());
    }

    toggleSound() {
        const isMuted = this.soundManager.toggleMute();
        document.getElementById('toggle-sound').textContent = isMuted ? '🔇' : '🔊';
    }

    startGame() {
        this.soundManager.play('cardDeal');
        this.ws.send(JSON.stringify({
            type: 'START_GAME'
        }));
    }

    fold() {
        this.soundManager.play('fold');
        this.ws.send(JSON.stringify({
            type: 'FOLD'
        }));
    }

    placeBet() {
        const amount = parseInt(document.getElementById('bet-slider').value);
        this.soundManager.play('chipStack');
        this.ws.send(JSON.stringify({
            type: 'PLACE_BET',
            amount
        }));
    }

    updateBetAmount(value) {
        const maxBet = parseInt(document.getElementById('player-chips').textContent);
        const slider = document.getElementById('bet-slider');
        slider.max = maxBet;
        slider.value = Math.min(value, maxBet);
    }

    handleMessage(data) {
        switch (data.type) {
            case 'GAME_START':
                this.handleGameStart(data);
                break;
            case 'BET_PLACED':
                this.handleBetPlaced(data);
                break;
            case 'GAME_OVER':
                this.handleGameOver(data);
                break;
            case 'ERROR':
                this.handleError(data);
                break;
        }
    }

    handleGameStart(data) {
        // Afficher les cartes du joueur avec animation
        const playerCards = document.getElementById('player-cards');
        playerCards.innerHTML = data.playerCards.map((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = `card ${card.suit === '♥' || card.suit === '♦' ? 'red' : ''}`;
            cardElement.textContent = `${card.suit}${card.value}`;
            playerCards.appendChild(cardElement);

            // Animer la distribution des cartes
            this.animationManager.dealCard(
                cardElement,
                { x: -100, y: -100 },
                { x: index * 80, y: 0 }
            );

            return cardElement;
        }).join('');

        // Afficher les cartes du dealer avec animation
        const dealerCards = document.getElementById('dealer-cards');
        dealerCards.innerHTML = data.dealerCards.map((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = `card ${card.value === '?' ? 'hidden' : ''} ${card.suit === '♥' || card.suit === '♦' ? 'red' : ''}`;
            cardElement.textContent = `${card.suit}${card.value}`;
            dealerCards.appendChild(cardElement);

            // Animer la distribution des cartes
            this.animationManager.dealCard(
                cardElement,
                { x: -100, y: -100 },
                { x: index * 80, y: 0 }
            );

            return cardElement;
        }).join('');

        // Mettre à jour les jetons
        this.updateChips(data.chips);

        // Désactiver le bouton de démarrage
        document.getElementById('start-game').disabled = true;

        // Réinitialiser les résultats
        document.getElementById('hand-result').textContent = '';
        document.getElementById('dealer-hand').textContent = '';
    }

    handleBetPlaced(data) {
        this.updateChips(data.chips);
        document.getElementById('pot-amount').textContent = data.pot;
        document.getElementById('current-bet').textContent = data.currentBet;

        // Animer le pot
        const potElement = document.getElementById('pot-amount');
        this.animationManager.updateChips(potElement, data.pot);
    }

    handleGameOver(data) {
        // Révéler les cartes du dealer
        const dealerCards = document.getElementById('dealer-cards');
        const dealerCardElements = dealerCards.children;
        Array.from(dealerCardElements).forEach(card => {
            this.animationManager.revealCard(card);
        });

        // Évaluer les mains
        const playerHand = PokerEvaluator.evaluateHand(data.playerCards);
        const dealerHand = PokerEvaluator.evaluateHand(data.dealerCards);
        const result = PokerEvaluator.compareHands(data.playerCards, data.dealerCards);

        // Afficher les résultats
        const resultElement = document.getElementById('hand-result');
        const dealerHandElement = document.getElementById('dealer-hand');
        
        dealerHandElement.textContent = `Main du dealer: ${dealerHand.name}`;
        dealerHandElement.style.opacity = '1';

        if (result > 0) {
            this.stats.handsWon++;
            resultElement.textContent = `Vous gagnez avec ${playerHand.name}!`;
            resultElement.className = 'hand-result win';
            this.soundManager.play('win');
            
            // Mettre à jour la meilleure main
            if (playerHand.rank > this.stats.bestHandRank) {
                this.stats.bestHand = playerHand.name;
                this.stats.bestHandRank = playerHand.rank;
                document.getElementById('best-hand').textContent = playerHand.name;
            }
        } else if (result < 0) {
            resultElement.textContent = `Vous perdez contre ${dealerHand.name}`;
            resultElement.className = 'hand-result lose';
            this.soundManager.play('lose');
        } else {
            resultElement.textContent = 'Égalité!';
            resultElement.className = 'hand-result';
        }

        resultElement.style.opacity = '1';
        this.animationManager.showHandResult(resultElement, result > 0);

        // Mettre à jour les statistiques
        document.getElementById('hands-won').textContent = this.stats.handsWon;
        this.saveStats();

        // Réactiver le bouton de démarrage
        document.getElementById('start-game').disabled = false;

        // Réinitialiser le pot et la mise
        document.getElementById('pot-amount').textContent = '0';
        document.getElementById('current-bet').textContent = '0';
        document.getElementById('bet-slider').value = '0';
    }

    handleError(data) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = data.message;
        document.body.appendChild(errorElement);

        this.animationManager.fadeIn(errorElement);
        setTimeout(() => {
            this.animationManager.fadeOut(errorElement);
            setTimeout(() => errorElement.remove(), 300);
        }, 3000);
    }

    updateChips(amount) {
        const chipsElement = document.getElementById('player-chips');
        chipsElement.textContent = amount;
        this.animationManager.updateChips(chipsElement, amount);
    }

    loadStats() {
        const savedStats = localStorage.getItem('pokerStats');
        if (savedStats) {
            this.stats = JSON.parse(savedStats);
            document.getElementById('hands-won').textContent = this.stats.handsWon;
            document.getElementById('best-hand').textContent = this.stats.bestHand || '-';
        }
    }

    saveStats() {
        localStorage.setItem('pokerStats', JSON.stringify(this.stats));
    }
}

// Initialiser le jeu
const game = new PokerGame(); 