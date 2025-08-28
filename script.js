class DayNightSlider {
    constructor() {
        this.slider = document.getElementById('dayNightSlider');
        this.knob = document.getElementById('sliderKnob');
        this.isDragging = false;
        this.currentPosition = 0; // 0 = day, 1 = night
        this.sliderRect = null;
        this.knobWidth = 90;
        this.padding = 20;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateSliderRect();
        
        // Set initial position (day mode)
        this.setPosition(0, false);
        
        // Update slider rect on window resize
        window.addEventListener('resize', () => {
            this.updateSliderRect();
        });
    }
    
    bindEvents() {
        // Mouse events
        this.knob.addEventListener('mousedown', this.onDragStart.bind(this));
        document.addEventListener('mousemove', this.onDragMove.bind(this));
        document.addEventListener('mouseup', this.onDragEnd.bind(this));
        
        // Touch events for mobile
        this.knob.addEventListener('touchstart', this.onDragStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.onDragMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.onDragEnd.bind(this));
        
        // Click on slider track
        this.slider.addEventListener('click', this.onSliderClick.bind(this));
        
        // Keyboard accessibility
        this.knob.addEventListener('keydown', this.onKeyDown.bind(this));
        this.knob.setAttribute('tabindex', '0');
        this.knob.setAttribute('role', 'slider');
        this.knob.setAttribute('aria-label', 'Day/Night toggle slider');
        this.knob.setAttribute('aria-valuemin', '0');
        this.knob.setAttribute('aria-valuemax', '1');
    }
    
    updateSliderRect() {
        this.sliderRect = this.slider.getBoundingClientRect();
        this.maxPosition = this.sliderRect.width - this.knobWidth - (this.padding * 2) - 20; // Extra 20px padding on right
    }
    
    onDragStart(e) {
        e.preventDefault();
        this.isDragging = true;
        this.updateSliderRect();
        
        // Add visual feedback
        this.knob.style.cursor = 'grabbing';
        this.slider.style.transform = 'scale(1.02)';
        
        // Get initial position
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
        
        // Remove visual feedback
        this.knob.style.cursor = 'grab';
        this.slider.style.transform = 'scale(1)';
        
        // Snap to nearest position (0 or 1)
        const finalPosition = this.currentPosition > 0.5 ? 1 : 0;
        this.setPosition(finalPosition, true);
    }
    
    onSliderClick(e) {
        if (this.isDragging || e.target === this.knob) return;
        
        this.updateSliderRect();
        const clickX = e.clientX - this.sliderRect.left;
        const clickPosition = (clickX - this.padding - this.knobWidth / 2) / this.maxPosition;
        const targetPosition = clickPosition > 0.5 ? 1 : 0;
        
        this.setPosition(targetPosition, true);
    }
    
    onKeyDown(e) {
        switch(e.key) {
            case 'ArrowLeft':
            case 'ArrowDown':
                e.preventDefault();
                this.setPosition(0, true);
                break;
            case 'ArrowRight':
            case 'ArrowUp':
                e.preventDefault();
                this.setPosition(1, true);
                break;
            case ' ':
            case 'Enter':
                e.preventDefault();
                this.setPosition(this.currentPosition === 0 ? 1 : 0, true);
                break;
        }
    }
    
    setPosition(position, animate = true) {
        this.currentPosition = Math.max(0, Math.min(1, position));
        
        // Update knob position
        const knobX = this.padding + (this.currentPosition * this.maxPosition);
        
        if (animate) {
            this.knob.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        } else {
            this.knob.style.transition = 'none';
        }
        
        this.knob.style.left = `${knobX}px`;
        
        // Update CSS custom properties for smooth transitions
        this.updateThemeVariables();
        
        // Update slider appearance (still need classes for some styles)
        const isNightMode = this.currentPosition > 0.5;
        
        if (isNightMode) {
            this.slider.classList.add('night-mode');
            this.knob.classList.add('night-mode');
        } else {
            this.slider.classList.remove('night-mode');
            this.knob.classList.remove('night-mode');
        }
        
        // Update accessibility
        this.knob.setAttribute('aria-valuenow', this.currentPosition);
        this.knob.setAttribute('aria-valuetext', isNightMode ? 'Night mode' : 'Day mode');
        
        // Restore transition after position update
        if (!animate) {
            requestAnimationFrame(() => {
                this.knob.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            });
        }
        
        // Trigger custom event
        this.slider.dispatchEvent(new CustomEvent('positionChange', {
            detail: {
                position: this.currentPosition,
                isNightMode: isNightMode
            }
        }));
    }
    
    updateThemeVariables() {
        const position = this.currentPosition;
        
        // Calculate interpolated values
        const sunOpacity = Math.max(0, 1 - (position * 2)); // Fade out sun as we move right
        const moonOpacity = Math.max(0, (position * 2) - 1); // Fade in moon as we move right
        const cloudOpacity = Math.max(0, 1 - (position * 1.5)); // Fade out clouds
        const starOpacity = Math.max(0, (position * 1.5) - 0.5); // Fade in stars
        
        // Background color interpolation
        const dayColor = { r: 168, g: 216, b: 234 }; // #A8D8EA
        const nightColor = { r: 26, g: 26, b: 26 }; // #1a1a1a
        
        const bgR = Math.round(dayColor.r + (nightColor.r - dayColor.r) * position);
        const bgG = Math.round(dayColor.g + (nightColor.g - dayColor.g) * position);
        const bgB = Math.round(dayColor.b + (nightColor.b - dayColor.b) * position);
        
        // Knob color interpolation
        const sunColor = { r: 255, g: 215, b: 0 }; // #FFD700
        const moonColor = { r: 192, g: 192, b: 192 }; // #C0C0C0
        
        const knobR = Math.round(sunColor.r + (moonColor.r - sunColor.r) * position);
        const knobG = Math.round(sunColor.g + (moonColor.g - sunColor.g) * position);
        const knobB = Math.round(sunColor.b + (moonColor.b - sunColor.b) * position);
        
        // Set CSS custom properties
        this.slider.style.setProperty('--slider-position', position);
        this.slider.style.setProperty('--sun-opacity', sunOpacity);
        this.slider.style.setProperty('--moon-opacity', moonOpacity);
        this.slider.style.setProperty('--cloud-opacity', cloudOpacity);
        this.slider.style.setProperty('--star-opacity', starOpacity);
        this.slider.style.setProperty('--bg-color', `rgb(${bgR}, ${bgG}, ${bgB})`);
        this.slider.style.setProperty('--knob-color', `rgb(${knobR}, ${knobG}, ${knobB})`);
        
        // Gradient layer positions and colors
        const dayGradientPos = Math.max(10, 25 - (position * 15)); // Move left as we go to night
        const nightGradientPos = Math.min(90, 75 + (position * 15)); // Move right as we go to night
        
        this.slider.style.setProperty('--day-gradient-pos', `${dayGradientPos}%`);
        this.slider.style.setProperty('--night-gradient-pos', `${nightGradientPos}%`);
    }
    
    // Public API methods
    toggle() {
        this.setPosition(this.currentPosition === 0 ? 1 : 0, true);
    }
    
    setDay() {
        this.setPosition(0, true);
    }
    
    setNight() {
        this.setPosition(1, true);
    }
    
    getPosition() {
        return this.currentPosition;
    }
    
    isNightMode() {
        return this.currentPosition > 0.5;
    }
}

// Initialize the slider when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dayNightSlider = new DayNightSlider();
    
    // Example of listening to position changes
    document.getElementById('dayNightSlider').addEventListener('positionChange', (e) => {
        console.log('Slider position changed:', e.detail);
    });
    
    // Add some demo buttons for testing (optional)
    if (window.location.search.includes('debug')) {
        const debugDiv = document.createElement('div');
        debugDiv.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 1000;';
        debugDiv.innerHTML = `
            <button onclick="dayNightSlider.setDay()" style="margin: 5px; padding: 10px;">Day</button>
            <button onclick="dayNightSlider.setNight()" style="margin: 5px; padding: 10px;">Night</button>
            <button onclick="dayNightSlider.toggle()" style="margin: 5px; padding: 10px;">Toggle</button>
        `;
        document.body.appendChild(debugDiv);
    }
});

// Prevent default drag behavior on images and other elements
document.addEventListener('dragstart', (e) => {
    e.preventDefault();
});
