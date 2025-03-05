class AnimationManager {
    constructor() {
        this.timeline = gsap.timeline();
    }

    dealCard(cardElement, fromPosition, toPosition) {
        return gsap.fromTo(cardElement,
            {
                x: fromPosition.x,
                y: fromPosition.y,
                rotation: 180,
                scale: 0.5,
                opacity: 0
            },
            {
                x: toPosition.x,
                y: toPosition.y,
                rotation: 0,
                scale: 1,
                opacity: 1,
                duration: 0.5,
                ease: "back.out(1.7)"
            }
        );
    }

    placeBet(chipElement, fromPosition, toPosition) {
        return gsap.fromTo(chipElement,
            {
                x: fromPosition.x,
                y: fromPosition.y,
                scale: 0.5,
                opacity: 0
            },
            {
                x: toPosition.x,
                y: toPosition.y,
                scale: 1,
                opacity: 1,
                duration: 0.3,
                ease: "power2.out"
            }
        );
    }

    revealCard(cardElement) {
        return gsap.to(cardElement,
            {
                rotationY: 180,
                duration: 0.5,
                ease: "power2.inOut"
            }
        );
    }

    showHandResult(resultElement, isWin) {
        return gsap.fromTo(resultElement,
            {
                scale: 0,
                opacity: 0
            },
            {
                scale: 1,
                opacity: 1,
                duration: 0.5,
                ease: "back.out(1.7)"
            }
        );
    }

    updateChips(chipElement, amount) {
        return gsap.to(chipElement,
            {
                scale: 1.2,
                duration: 0.2,
                yoyo: true,
                repeat: 1,
                ease: "power1.inOut"
            }
        );
    }

    shakeElement(element) {
        return gsap.to(element,
            {
                x: "+=10",
                duration: 0.1,
                yoyo: true,
                repeat: 2,
                ease: "none"
            }
        );
    }

    fadeIn(element) {
        return gsap.fromTo(element,
            {
                opacity: 0
            },
            {
                opacity: 1,
                duration: 0.3,
                ease: "power2.out"
            }
        );
    }

    fadeOut(element) {
        return gsap.to(element,
            {
                opacity: 0,
                duration: 0.3,
                ease: "power2.in"
            }
        );
    }
} 