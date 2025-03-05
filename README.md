# Hodlem Poker - Table de Poker 3D

Une application de poker en ligne avec une table de poker 3D interactive, utilisant Three.js pour le rendu et WebSocket pour la communication en temps réel.

## Fonctionnalités

- Table de poker 3D avec 8 joueurs maximum
- Communication en temps réel via WebSocket
- Gestion complète des règles du Texas Hold'em
- Affichage des prix des cryptos en temps réel
- Mode spectateur
- Interface utilisateur intuitive
- Bannières publicitaires dynamiques

## Prérequis

- Node.js (v14 ou supérieur)
- npm (v6 ou supérieur)

## Installation

1. Clonez le dépôt :
```bash
git clone https://github.com/votre-username/hodlem-poker.git
cd hodlem-poker
```

2. Installez les dépendances :
```bash
npm install
```

## Démarrage

1. Démarrez le serveur :
```bash
npm start
```

2. Ouvrez votre navigateur et accédez à :
```
http://localhost:3000
```

## Structure du projet

```
hodlem-poker/
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── table.js
│   │   ├── game.js
│   │   ├── websocket.js
│   │   ├── crypto-ticker.js
│   │   └── main.js
│   └── index.html
├── server.js
├── package.json
└── README.md
```

## Utilisation

1. Créez une nouvelle table ou rejoignez une table existante
2. Invitez d'autres joueurs en partageant l'ID de la table
3. Commencez à jouer au Texas Hold'em !

## Technologies utilisées

- Three.js pour le rendu 3D
- WebSocket pour la communication en temps réel
- Express.js pour le serveur
- CoinGecko API pour les données crypto

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.