class PokerTable {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('poker-table'),
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;

        this.table = null;
        this.seats = [];
        this.cards = [];
        this.chips = [];
        this.players = new Map();

        this.init();
    }

    init() {
        // Configuration de la caméra
        this.camera.position.set(0, 5, 8);
        this.camera.lookAt(0, 0, 0);

        // Ajout de la lumière
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Création de la table
        this.createTable();
        
        // Création des sièges
        this.createSeats();

        // Animation
        this.animate();
    }

    createTable() {
        // Surface de la table
        const tableGeometry = new THREE.CylinderGeometry(3, 3, 0.1, 32);
        const tableMaterial = new THREE.MeshPhongMaterial({
            color: 0x006400,
            specular: 0x111111
        });
        this.table = new THREE.Mesh(tableGeometry, tableMaterial);
        this.table.receiveShadow = true;
        this.scene.add(this.table);

        // Bordure de la table
        const borderGeometry = new THREE.TorusGeometry(3, 0.1, 16, 100);
        const borderMaterial = new THREE.MeshPhongMaterial({
            color: 0x8B4513
        });
        const border = new THREE.Mesh(borderGeometry, borderMaterial);
        border.rotation.x = Math.PI / 2;
        border.receiveShadow = true;
        this.scene.add(border);
    }

    createSeats() {
        const seatGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16);
        const seatMaterial = new THREE.MeshPhongMaterial({
            color: 0x8B4513
        });

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = Math.cos(angle) * 4;
            const z = Math.sin(angle) * 4;

            const seat = new THREE.Mesh(seatGeometry, seatMaterial);
            seat.position.set(x, 0.25, z);
            seat.rotation.y = -angle;
            seat.castShadow = true;
            seat.receiveShadow = true;

            this.seats.push(seat);
            this.scene.add(seat);
        }
    }

    addPlayer(playerId, position) {
        const player = {
            id: playerId,
            position: position,
            chips: 1000,
            cards: [],
            avatar: null
        };

        this.players.set(playerId, player);
        this.updatePlayerDisplay(playerId);
    }

    updatePlayerDisplay(playerId) {
        const player = this.players.get(playerId);
        if (!player) return;

        // Mise à jour de la position des jetons
        const angle = (player.position / 8) * Math.PI * 2;
        const x = Math.cos(angle) * 3.5;
        const z = Math.sin(angle) * 3.5;

        // Création ou mise à jour des jetons
        if (!player.chipsMesh) {
            const chipsGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
            const chipsMaterial = new THREE.MeshPhongMaterial({
                color: 0xFFD700
            });
            player.chipsMesh = new THREE.Mesh(chipsGeometry, chipsMaterial);
            this.scene.add(player.chipsMesh);
        }

        player.chipsMesh.position.set(x, 0.1, z);
    }

    dealCard(playerId, card) {
        const player = this.players.get(playerId);
        if (!player) return;

        const cardMesh = this.createCardMesh(card);
        player.cards.push(cardMesh);
        this.scene.add(cardMesh);

        // Positionnement des cartes
        this.updateCardPositions(playerId);
    }

    createCardMesh(card) {
        const cardGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.05);
        const cardMaterial = new THREE.MeshPhongMaterial({
            color: card.suit === '♥' || card.suit === '♦' ? 0xFF0000 : 0x000000
        });
        const cardMesh = new THREE.Mesh(cardGeometry, cardMaterial);
        cardMesh.castShadow = true;
        cardMesh.receiveShadow = true;
        return cardMesh;
    }

    updateCardPositions(playerId) {
        const player = this.players.get(playerId);
        if (!player) return;

        const angle = (player.position / 8) * Math.PI * 2;
        const x = Math.cos(angle) * 3.5;
        const z = Math.sin(angle) * 3.5;

        player.cards.forEach((card, index) => {
            const offset = (index - (player.cards.length - 1) / 2) * 0.7;
            card.position.set(
                x + Math.cos(angle + Math.PI/2) * offset,
                0.1,
                z + Math.sin(angle + Math.PI/2) * offset
            );
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
} 