#!/bin/bash

# Créer le dossier des sons s'il n'existe pas
mkdir -p public/assets/sounds

# Télécharger les sons
curl -o public/assets/sounds/card-deal.mp3 https://raw.githubusercontent.com/your-repo/poker-sounds/main/card-deal.mp3
curl -o public/assets/sounds/chip-stack.mp3 https://raw.githubusercontent.com/your-repo/poker-sounds/main/chip-stack.mp3
curl -o public/assets/sounds/win.mp3 https://raw.githubusercontent.com/your-repo/poker-sounds/main/win.mp3
curl -o public/assets/sounds/lose.mp3 https://raw.githubusercontent.com/your-repo/poker-sounds/main/lose.mp3
curl -o public/assets/sounds/fold.mp3 https://raw.githubusercontent.com/your-repo/poker-sounds/main/fold.mp3

# Rendre le script exécutable
chmod +x download-sounds.sh 