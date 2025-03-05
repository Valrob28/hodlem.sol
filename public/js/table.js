class PokerTable {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('poker-table'),
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x1a472a); // Vert foncé pour le feutre
        this.renderer.shadowMap.enabled = true;

        this.table = null;
        this.seats = [];
        this.cards = [];
        this.chips = [];
        this.players = new Map();
        this.playerTokens = new Map();
        this.cardMeshes = new Map();

        // Agrandir la table
        this.tableRadius = 5; // Augmenté de 3 à 5
        this.tableHeight = 0.5;
        this.createTable();
        this.createSeats();
        this.setupLights();
        this.setupCamera();
        this.animate();
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
        const tableGeometry = new THREE.CylinderGeometry(this.tableRadius, this.tableRadius, this.tableHeight, 32);
        const tableMaterial = new THREE.MeshPhongMaterial({
            color: 0x006400,
            specular: 0x111111
        });
        this.table = new THREE.Mesh(tableGeometry, tableMaterial);
        this.table.receiveShadow = true;
        this.scene.add(this.table);

        // Bordure de la table
        const borderGeometry = new THREE.TorusGeometry(this.tableRadius, 0.1, 16, 100);
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
            const x = Math.cos(angle) * (this.tableRadius + 1);
            const z = Math.sin(angle) * (this.tableRadius + 1);

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
        const angle = (position / 8) * Math.PI * 2;
        const x = Math.cos(angle) * (this.tableRadius + 1);
        const z = Math.sin(angle) * (this.tableRadius + 1);
        
        // Créer un avatar pour le joueur
        const geometry = new THREE.BoxGeometry(0.5, 1, 0.5);
        const material = new THREE.MeshPhongMaterial({ color: 0x808080 });
        const avatar = new THREE.Mesh(geometry, material);
        avatar.position.set(x, 0.5, z);
        avatar.rotation.y = -angle;
        this.scene.add(avatar);

        // Ajouter le nom du joueur
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        context.fillStyle = 'white';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.fillText(playerId, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const nameGeometry = new THREE.PlaneGeometry(2, 0.5);
        const nameMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const nameMesh = new THREE.Mesh(nameGeometry, nameMaterial);
        nameMesh.position.set(x, 2, z);
        nameMesh.rotation.y = -angle;
        this.scene.add(nameMesh);

        this.players.set(playerId, { avatar, nameMesh });
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

    createChips() {
        // Création des jetons de poker
        const chipGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
        const chipMaterials = {
            white: new THREE.MeshPhongMaterial({ color: 0xFFFFFF }),
            red: new THREE.MeshPhongMaterial({ color: 0xFF0000 }),
            blue: new THREE.MeshPhongMaterial({ color: 0x0000FF }),
            green: new THREE.MeshPhongMaterial({ color: 0x00FF00 }),
            black: new THREE.MeshPhongMaterial({ color: 0x000000 })
        };

        // Créer un ensemble de jetons pour chaque valeur
        const chipValues = [
            { value: 1, material: chipMaterials.white },
            { value: 5, material: chipMaterials.red },
            { value: 25, material: chipMaterials.blue },
            { value: 100, material: chipMaterials.green },
            { value: 500, material: chipMaterials.black }
        ];

        chipValues.forEach(({ value, material }) => {
            const chip = new THREE.Mesh(chipGeometry, material);
            chip.castShadow = true;
            chip.receiveShadow = true;
            this.chips.push({ mesh: chip, value });
        });
    }

    setupLights() {
        // Lumière ambiante
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Lumière directionnelle principale
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(5, 5, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 50;
        mainLight.shadow.camera.left = -10;
        mainLight.shadow.camera.right = 10;
        mainLight.shadow.camera.top = 10;
        mainLight.shadow.camera.bottom = -10;
        this.scene.add(mainLight);

        // Lumière directionnelle secondaire (pour le remplissage)
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
        fillLight.position.set(-5, 3, -5);
        this.scene.add(fillLight);
    }

    setupCamera() {
        // Position de la caméra
        this.camera.position.set(0, 8, 12);
        this.camera.lookAt(0, 0, 0);

        // Ajouter des contrôles de caméra
        const controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 8;
        controls.maxDistance = 20;
        controls.maxPolarAngle = Math.PI / 2;
        controls.target.set(0, 0, 0);
        controls.update();
    }
} 