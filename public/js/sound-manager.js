class SoundManager {
    constructor() {
        this.sounds = {
            cardDeal: new Howl({
                src: ['assets/sounds/card-deal.mp3'],
                volume: 0.5
            }),
            chipStack: new Howl({
                src: ['assets/sounds/chip-stack.mp3'],
                volume: 0.5
            }),
            win: new Howl({
                src: ['assets/sounds/win.mp3'],
                volume: 0.7
            }),
            lose: new Howl({
                src: ['assets/sounds/lose.mp3'],
                volume: 0.7
            }),
            fold: new Howl({
                src: ['assets/sounds/fold.mp3'],
                volume: 0.5
            })
        };

        this.isMuted = false;
    }

    play(soundName) {
        if (!this.isMuted && this.sounds[soundName]) {
            this.sounds[soundName].play();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }
} 