class PokerEvaluator {
    static HAND_RANKINGS = {
        ROYAL_FLUSH: 10,
        STRAIGHT_FLUSH: 9,
        FOUR_OF_A_KIND: 8,
        FULL_HOUSE: 7,
        FLUSH: 6,
        STRAIGHT: 5,
        THREE_OF_A_KIND: 4,
        TWO_PAIR: 3,
        ONE_PAIR: 2,
        HIGH_CARD: 1
    };

    static CARD_VALUES = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
        '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };

    static evaluateHand(cards) {
        const allCards = [...cards];
        const suits = allCards.map(card => card.suit);
        const values = allCards.map(card => this.CARD_VALUES[card.value]);
        
        // Trier les valeurs en ordre décroissant
        values.sort((a, b) => b - a);

        // Vérifier les combinaisons
        const isRoyalFlush = this.isRoyalFlush(suits, values);
        if (isRoyalFlush) return { rank: this.HAND_RANKINGS.ROYAL_FLUSH, name: 'Quinte Flush Royale' };

        const isStraightFlush = this.isStraightFlush(suits, values);
        if (isStraightFlush) return { rank: this.HAND_RANKINGS.STRAIGHT_FLUSH, name: 'Quinte Flush' };

        const isFourOfAKind = this.isFourOfAKind(values);
        if (isFourOfAKind) return { rank: this.HAND_RANKINGS.FOUR_OF_A_KIND, name: 'Carré' };

        const isFullHouse = this.isFullHouse(values);
        if (isFullHouse) return { rank: this.HAND_RANKINGS.FULL_HOUSE, name: 'Full' };

        const isFlush = this.isFlush(suits);
        if (isFlush) return { rank: this.HAND_RANKINGS.FLUSH, name: 'Couleur' };

        const isStraight = this.isStraight(values);
        if (isStraight) return { rank: this.HAND_RANKINGS.STRAIGHT, name: 'Quinte' };

        const isThreeOfAKind = this.isThreeOfAKind(values);
        if (isThreeOfAKind) return { rank: this.HAND_RANKINGS.THREE_OF_A_KIND, name: 'Brelan' };

        const isTwoPair = this.isTwoPair(values);
        if (isTwoPair) return { rank: this.HAND_RANKINGS.TWO_PAIR, name: 'Deux Paires' };

        const isOnePair = this.isOnePair(values);
        if (isOnePair) return { rank: this.HAND_RANKINGS.ONE_PAIR, name: 'Paire' };

        return { rank: this.HAND_RANKINGS.HIGH_CARD, name: 'Carte Haute' };
    }

    static isRoyalFlush(suits, values) {
        return this.isStraightFlush(suits, values) && values[0] === 14;
    }

    static isStraightFlush(suits, values) {
        return this.isFlush(suits) && this.isStraight(values);
    }

    static isFourOfAKind(values) {
        for (let i = 0; i <= values.length - 4; i++) {
            if (values[i] === values[i + 3]) return true;
        }
        return false;
    }

    static isFullHouse(values) {
        const threeOfAKind = this.isThreeOfAKind(values);
        if (!threeOfAKind) return false;

        const remainingValues = values.filter(v => v !== values[0]);
        return this.isOnePair(remainingValues);
    }

    static isFlush(suits) {
        return suits.some(suit => suits.filter(s => s === suit).length >= 5);
    }

    static isStraight(values) {
        // Gérer le cas spécial A-2-3-4-5
        if (values.includes(14)) {
            values.push(1);
        }

        for (let i = 0; i <= values.length - 5; i++) {
            if (values[i] - values[i + 4] === 4) return true;
        }
        return false;
    }

    static isThreeOfAKind(values) {
        for (let i = 0; i <= values.length - 3; i++) {
            if (values[i] === values[i + 2]) return true;
        }
        return false;
    }

    static isTwoPair(values) {
        let pairs = 0;
        for (let i = 0; i < values.length - 1; i++) {
            if (values[i] === values[i + 1]) {
                pairs++;
                i++; // Skip the next value
            }
        }
        return pairs >= 2;
    }

    static isOnePair(values) {
        for (let i = 0; i < values.length - 1; i++) {
            if (values[i] === values[i + 1]) return true;
        }
        return false;
    }

    static compareHands(hand1, hand2) {
        const evaluation1 = this.evaluateHand(hand1);
        const evaluation2 = this.evaluateHand(hand2);

        if (evaluation1.rank !== evaluation2.rank) {
            return evaluation1.rank - evaluation2.rank;
        }

        // Si même rang, comparer les valeurs des cartes
        const values1 = hand1.map(card => this.CARD_VALUES[card.value]);
        const values2 = hand2.map(card => this.CARD_VALUES[card.value]);
        values1.sort((a, b) => b - a);
        values2.sort((a, b) => b - a);

        for (let i = 0; i < values1.length; i++) {
            if (values1[i] !== values2[i]) {
                return values1[i] - values2[i];
            }
        }

        return 0;
    }
} 