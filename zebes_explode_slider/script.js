class ZebesExplosionSlider {
    constructor() {
        this.slider = document.getElementById('zebesSlider');
        this.knob = document.querySelector('.slider-knob');
        this.isDragging = false;
        this.currentPosition = 0;
        this.sliderRect = null;
        this.knobWidth = 120;
        this.padding = 30;
        this.explosionTriggered = false;
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateSliderRect();
        this.setPosition(0, false);
        window.addEventListener('resize', () => {
            this.updateSliderRect();
        });
    }
    
    bindEvents() {
        this.knob.addEventListener('mousedown', this.onDragStart.bind(this));
        document.addEventListener('mousemove', this.onDragMove.bind(this));
        document.addEventListener('mouseup', this.onDragEnd.bind(this));
        this.knob.addEventListener('touchstart', this.onDragStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.onDragMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.onDragEnd.bind(this));
        this.slider.addEventListener('click', this.onSliderClick.bind(this));
    }
    
    updateSliderRect() {
        this.sliderRect = this.slider.getBoundingClientRect();
        this.maxPosition = this.sliderRect.width - this.knobWidth - (this.padding * 2) - 20;
    }
    
    onDragStart(e) {
        e.preventDefault();
        this.isDragging = true;
        this.updateSliderRect();
        this.knob.style.cursor = 'grabbing';
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        this.dragStartX = clientX;
        this.dragStartPosition = this.currentPosition;
    }
    
    onDragMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const deltaX = clientX - this.dragStartX;
        const deltaPosition = deltaX / this.maxPosition;
        let newPosition = this.dragStartPosition + deltaPosition;
        newPosition = Math.max(0, Math.min(1, newPosition));
        this.setPosition(newPosition, false);
    }
    
    onDragEnd(e) {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.knob.style.cursor = 'grab';
        if (this.currentPosition > 0.85) {
            this.triggerExplosion();
        } else if (this.currentPosition < 0.3) {
            this.setPosition(0, true);
        }
    }
    
    onSliderClick(e) {
        if (this.isDragging || e.target.closest('.slider-knob')) return;
        this.updateSliderRect();
        const clickX = e.clientX - this.sliderRect.left;
        const clickPosition = (clickX - this.padding - this.knobWidth / 2) / this.maxPosition;
        const targetPosition = Math.max(0, Math.min(1, clickPosition));
        if (targetPosition > 0.85) {
            this.triggerExplosion();
        } else {
            this.setPosition(targetPosition, true);
        }
    }
    
    setPosition(position, animate = true) {
        this.currentPosition = Math.max(0, Math.min(1, position));
        const knobX = this.padding + (this.currentPosition * this.maxPosition);
        
        if (animate) {
            this.knob.style.transition = 'left 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        } else {
            this.knob.style.transition = 'none';
        }
        
        this.knob.style.left = `${knobX}px`;
        this.updateDestructionEffects();
        
        if (!animate) {
            requestAnimationFrame(() => {
                this.knob.style.transition = 'left 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            });
        }
    }
    
    updateDestructionEffects() {
        const position = this.currentPosition;
        
        if (position < 0.3 && this.explosionTriggered) {
            this.resetPlanet();
            return;
        }
        
        const planetOpacity = this.explosionTriggered ? 0 : 1;
        const planetScale = 1;
        
        this.slider.style.setProperty('--planet-opacity', planetOpacity);
        this.slider.style.setProperty('--planet-scale', planetScale);
        this.slider.style.setProperty('--explosion-opacity', 0);
        this.slider.style.setProperty('--explosion-rings-opacity', 0);
        this.slider.style.setProperty('--flash-opacity', 0);
        
        // Small vibration effect
        if (position > 0.6 && !this.explosionTriggered) {
            const vibrateIntensity = (position - 0.6) * 3;
            this.knob.style.transform = `translateY(-50%) translate(${Math.sin(Date.now() * 0.1) * vibrateIntensity}px, ${Math.cos(Date.now() * 0.12) * vibrateIntensity}px)`;
            
            if (!this.vibrateInterval) {
                this.vibrateInterval = setInterval(() => {
                    if (this.currentPosition > 0.6 && !this.explosionTriggered) {
                        const currentVibrate = (this.currentPosition - 0.6) * 3;
                        this.knob.style.transform = `translateY(-50%) translate(${Math.sin(Date.now() * 0.1) * currentVibrate}px, ${Math.cos(Date.now() * 0.12) * currentVibrate}px)`;
                    }
                }, 16);
            }
        } else if (!this.explosionTriggered) {
            if (this.vibrateInterval) {
                clearInterval(this.vibrateInterval);
                this.vibrateInterval = null;
            }
            this.knob.style.transform = 'translateY(-50%)';
        }
    }
    
    triggerExplosion() {
        if (this.explosionTriggered) return;
        this.explosionTriggered = true;
        this.setPosition(1, true);
        
        if (this.vibrateInterval) {
            clearInterval(this.vibrateInterval);
            this.vibrateInterval = null;
        }
        
        this.slider.style.setProperty('--flash-opacity', '1');
        this.slider.style.setProperty('--planet-opacity', '0');
        this.slider.style.setProperty('--explosion-opacity', '1'); // Show explosion particles
        this.slider.style.setProperty('--explosion-rings-opacity', '1'); // Show explosion rings
        
        // Show planet core at current knob position
        const knobX = this.padding + (this.currentPosition * this.maxPosition);
        const knobCenterX = knobX + (this.knobWidth / 2);
        this.slider.style.setProperty('--aftermath-left', `${knobCenterX}px`);
        this.slider.style.setProperty('--aftermath-opacity', '1');
        
        setTimeout(() => {
            this.animateExplosionParticles();
            this.animateExplosionRings();
            document.body.style.animation = 'screen-shake 1s ease-in-out';
        }, 100);
        
        setTimeout(() => {
            this.slider.style.setProperty('--flash-opacity', '0.2');
        }, 2000);
    }
    
    animateExplosionParticles() {
        const particles = document.querySelectorAll('.explosion-particle');
        particles.forEach((particle, index) => {
            setTimeout(() => {
                particle.style.animation = `particle-explode-${(index % 4) + 1} 4s ease-out forwards`;
            }, index * 100);
        });
    }
    
    animateExplosionRings() {
        const rings = document.querySelectorAll('.explosion-ring');
        rings.forEach((ring, index) => {
            setTimeout(() => {
                ring.style.animation = `ring-expand ${2 + index * 0.5}s ease-out forwards`;
            }, index * 400);
        });
        
        const core = document.querySelector('.explosion-core');
        setTimeout(() => {
            core.style.animation = 'core-explode 3s ease-out forwards';
        }, 200);
        
        if (!document.getElementById('explosion-keyframes')) {
            const style = document.createElement('style');
            style.id = 'explosion-keyframes';
            style.textContent = `
                @keyframes particle-explode-1 {
                    0% { opacity: 0; transform: scale(0) translate(0, 0); }
                    50% { opacity: 1; transform: scale(1.5) translate(-100px, -80px); }
                    100% { opacity: 0; transform: scale(0.5) translate(-200px, -160px); }
                }
                @keyframes particle-explode-2 {
                    0% { opacity: 0; transform: scale(0) translate(0, 0); }
                    50% { opacity: 1; transform: scale(1.2) translate(120px, -60px); }
                    100% { opacity: 0; transform: scale(0.3) translate(240px, -120px); }
                }
                @keyframes particle-explode-3 {
                    0% { opacity: 0; transform: scale(0) translate(0, 0); }
                    50% { opacity: 1; transform: scale(1.8) translate(-80px, 100px); }
                    100% { opacity: 0; transform: scale(0.2) translate(-160px, 200px); }
                }
                @keyframes particle-explode-4 {
                    0% { opacity: 0; transform: scale(0) translate(0, 0); }
                    50% { opacity: 1; transform: scale(1.4) translate(90px, 110px); }
                    100% { opacity: 0; transform: scale(0.4) translate(180px, 220px); }
                }
                @keyframes ring-expand {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
                    30% { opacity: 1; }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(3); }
                }
                @keyframes core-explode {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
                    30% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
                }
                @keyframes screen-shake {
                    0%, 100% { transform: translate(0, 0); }
                    10% { transform: translate(-2px, -1px); }
                    20% { transform: translate(2px, 1px); }
                    30% { transform: translate(-1px, 2px); }
                    40% { transform: translate(1px, -2px); }
                    50% { transform: translate(-2px, 1px); }
                    60% { transform: translate(2px, -1px); }
                    70% { transform: translate(-1px, -2px); }
                    80% { transform: translate(1px, 2px); }
                    90% { transform: translate(-2px, -1px); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    resetPlanet() {
        this.explosionTriggered = false;
        this.setPosition(0, true);
        
        this.slider.style.setProperty('--planet-opacity', '1');
        this.slider.style.setProperty('--explosion-opacity', '0');
        this.slider.style.setProperty('--explosion-rings-opacity', '0');
        this.slider.style.setProperty('--flash-opacity', '0');
        this.slider.style.setProperty('--aftermath-opacity', '0');
        
        const particles = document.querySelectorAll('.explosion-particle');
        particles.forEach(particle => {
            particle.style.animation = '';
        });
        
        const rings = document.querySelectorAll('.explosion-ring');
        rings.forEach(ring => {
            ring.style.animation = '';
        });
        
        document.querySelector('.explosion-core').style.animation = '';
        document.body.style.animation = '';
        
        if (this.vibrateInterval) {
            clearInterval(this.vibrateInterval);
            this.vibrateInterval = null;
        }
        this.knob.style.transform = 'translateY(-50%)';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.zebesSlider = new ZebesExplosionSlider();
});

document.addEventListener('dragstart', (e) => {
    e.preventDefault();
});
