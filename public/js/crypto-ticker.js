class CryptoTicker {
    constructor() {
        this.tickerElement = document.querySelector('.ticker-content');
        this.cryptoData = [];
        this.currentIndex = 0;
        this.updateInterval = 180000; // 3 minutes en millisecondes
        this.apiUrl = 'https://api.coingecko.com/api/v3';
        this.init();
    }

    init() {
        this.fetchCryptoData();
        setInterval(() => this.fetchCryptoData(), this.updateInterval);
    }

    async fetchCryptoData() {
        try {
            const response = await fetch(`${this.apiUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&sparkline=false`);
            this.cryptoData = await response.json();
            this.updateTicker();
        } catch (error) {
            console.error('Erreur lors de la récupération des données crypto:', error);
        }
    }

    updateTicker() {
        if (!this.cryptoData.length) return;

        const tickerContent = this.cryptoData
            .map(crypto => {
                const priceChange = crypto.price_change_percentage_24h;
                const priceChangeColor = priceChange >= 0 ? '#00ff00' : '#ff0000';
                const priceChangeSymbol = priceChange >= 0 ? '↑' : '↓';
                const formattedPrice = this.formatNumber(crypto.current_price);
                const formattedChange = Math.abs(priceChange).toFixed(2);

                return `
                    <span class="crypto-item">
                        ${crypto.symbol.toUpperCase()}: 
                        $${formattedPrice} 
                        <span style="color: ${priceChangeColor}; font-weight: bold; margin-left: 5px;">
                            ${priceChangeSymbol} ${formattedChange}%
                        </span>
                    </span>
                `;
            })
            .join(' | ');

        this.tickerElement.innerHTML = tickerContent;
    }

    // Méthode pour formater les nombres
    formatNumber(number) {
        if (number >= 1000) {
            return (number / 1000).toFixed(2) + 'K';
        }
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(number);
    }

    // Méthode pour obtenir les données d'une crypto spécifique
    getCryptoData(symbol) {
        return this.cryptoData.find(crypto => 
            crypto.symbol.toLowerCase() === symbol.toLowerCase()
        );
    }

    // Méthode pour mettre à jour manuellement les données
    updateData(newData) {
        this.cryptoData = newData;
        this.updateTicker();
    }
}

// Initialisation du ticker
document.addEventListener('DOMContentLoaded', () => {
    const ticker = new CryptoTicker();
}); 