// Sound Manager using Web Audio API
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.muted = false;
        this.volume = 0.3;
        this.init();
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    playSound(frequency, duration, type = 'sine') {
        if (this.muted || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playMove() {
        this.playSound(400, 0.05);
    }

    playRotate() {
        this.playSound(600, 0.08);
    }

    playLineClear() {
        // Ascending tone
        const startFreq = 300;
        const endFreq = 800;
        const duration = 0.3;
        const steps = 5;
        
        for (let i = 0; i < steps; i++) {
            const freq = startFreq + (endFreq - startFreq) * (i / steps);
            setTimeout(() => {
                this.playSound(freq, 0.1);
            }, i * 50);
        }
    }

    playGameOver() {
        // Descending tone
        const startFreq = 800;
        const endFreq = 200;
        const duration = 0.5;
        const steps = 10;
        
        for (let i = 0; i < steps; i++) {
            const freq = startFreq + (endFreq - startFreq) * (i / steps);
            setTimeout(() => {
                this.playSound(freq, 0.15);
            }, i * 30);
        }
    }

    playPause() {
        this.playSound(200, 0.1);
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }
}

// Create global sound manager instance
const soundManager = new SoundManager();

