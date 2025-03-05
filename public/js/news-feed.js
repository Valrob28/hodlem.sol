class NewsFeed {
    constructor() {
        this.newsContainer = document.createElement('div');
        this.newsContainer.id = 'news-feed';
        this.newsContainer.className = 'news-feed';
        document.body.appendChild(this.newsContainer);
        
        this.cryptoNewsUrl = 'https://api.rss2json.com/v1/api.json?rss_url=https://cointelegraph.com/rss';
        this.twitterFeedUrl = 'https://api.rss2json.com/v1/api.json?rss_url=https://nitter.net/WenTV_io/rss';
        
        this.init();
    }

    async init() {
        await this.loadNews();
        setInterval(() => this.loadNews(), 300000); // Mise à jour toutes les 5 minutes
    }

    async loadNews() {
        try {
            const [cryptoNews, twitterFeed] = await Promise.all([
                this.fetchRSS(this.cryptoNewsUrl),
                this.fetchRSS(this.twitterFeedUrl)
            ]);

            this.displayNews([...cryptoNews, ...twitterFeed]);
        } catch (error) {
            console.error('Erreur lors du chargement des nouvelles:', error);
        }
    }

    async fetchRSS(url) {
        const response = await fetch(url);
        const data = await response.json();
        return data.items.map(item => ({
            title: item.title,
            link: item.link,
            pubDate: new Date(item.pubDate),
            source: item.source || 'Twitter'
        }));
    }

    displayNews(news) {
        this.newsContainer.innerHTML = '';
        
        news.sort((a, b) => b.pubDate - a.pubDate)
            .slice(0, 10)
            .forEach(item => {
                const newsItem = document.createElement('div');
                newsItem.className = 'news-item';
                newsItem.innerHTML = `
                    <span class="news-source">${item.source}</span>
                    <a href="${item.link}" target="_blank">${item.title}</a>
                    <span class="news-date">${this.formatDate(item.pubDate)}</span>
                `;
                this.newsContainer.appendChild(newsItem);
            });
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }
}

// Initialisation du flux d'actualités
document.addEventListener('DOMContentLoaded', () => {
    new NewsFeed();
}); 