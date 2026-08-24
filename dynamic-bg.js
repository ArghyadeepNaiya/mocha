(function() {
    function initDynamicBg() {
        // Prevent multiple initializations
        if (document.getElementById("mocha-dynamic-bg")) return;

        const bgContainer = document.createElement("div");
        bgContainer.id = "mocha-dynamic-bg";
        bgContainer.style.position = "fixed";
        bgContainer.style.top = "0";
        bgContainer.style.left = "0";
        bgContainer.style.width = "100%";
        bgContainer.style.height = "100%";
        bgContainer.style.pointerEvents = "none";
        bgContainer.style.zIndex = "-1";
        bgContainer.style.overflow = "hidden";
        
        // Abstract shapes for a modern cafe/restaurant vibe
        const svgTemplates = [
            // Coffee Bean
            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v2M14 2v2M16 8a6 6 0 0 1 6 6v4a2 2 0 0 1-2 2h-4c-3.3 0-6-2.7-6-6V8c0-3.3 2.7-6 6-6h4a2 2 0 0 1 2 2v4a6 6 0 0 1-6 6M2 12a6 6 0 0 1 6-6V2a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v4a6 6 0 0 0 6 6"/></svg>`,
            // Leaf
            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
            // Star / Sparkle
            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
            // Circle / Plate
            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/></svg>`,
            // Coffee Cup
            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`
        ];

        const numShapes = 12; // Number of floating SVGs
        const shapes = [];

        const style = document.createElement("style");
        style.innerHTML = `
            .dynamic-bg-svg {
                position: absolute;
                top: 0; left: 0;
                opacity: 0.25;
                color: var(--brand-color, #78350f);
                will-change: transform;
            }
            .dynamic-bg-svg svg {
                width: 100%;
                height: 100%;
                display: block;
            }
        `;
        document.head.appendChild(style);

        // Initialize shapes
        for (let i = 0; i < numShapes; i++) {
            const el = document.createElement("div");
            el.classList.add("dynamic-bg-svg");
            el.innerHTML = svgTemplates[Math.floor(Math.random() * svgTemplates.length)];
            
            const size = Math.random() * 60 + 40; // 40px to 100px
            const radius = size / 2;
            el.style.width = size + "px";
            el.style.height = size + "px";
            
            bgContainer.appendChild(el);
            
            // Random starting position (ensure fully inside viewport)
            const x = Math.random() * (Math.max(window.innerWidth - size, 1));
            const y = Math.random() * (Math.max(window.innerHeight - size, 1));
            
            // Random velocity (slowed down as requested)
            let vx = (Math.random() - 0.5) * 1.5;
            let vy = (Math.random() - 0.5) * 1.5;
            
            // Ensure they are moving at least a tiny bit
            if (Math.abs(vx) < 0.2) vx = (vx < 0 ? -0.2 : 0.2);
            if (Math.abs(vy) < 0.2) vy = (vy < 0 ? -0.2 : 0.2);
            
            shapes.push({
                el: el,
                x: x,
                y: y,
                vx: vx,
                vy: vy,
                radius: radius,
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 1 // Slower rotation
            });
        }
        
        document.body.appendChild(bgContainer);

        function updatePhysics() {
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Move and collide with walls
            for (let i = 0; i < shapes.length; i++) {
                const s = shapes[i];
                
                s.x += s.vx;
                s.y += s.vy;
                s.rotation += s.rotSpeed;

                // Wall collisions (left/right)
                if (s.x <= 0) {
                    s.x = 0;
                    s.vx *= -1;
                } else if (s.x + s.radius * 2 >= width) {
                    s.x = width - s.radius * 2;
                    s.vx *= -1;
                }

                // Wall collisions (top/bottom)
                if (s.y <= 0) {
                    s.y = 0;
                    s.vy *= -1;
                } else if (s.y + s.radius * 2 >= height) {
                    s.y = height - s.radius * 2;
                    s.vy *= -1;
                }
            }

            // Object collisions (Circle to Circle)
            for (let i = 0; i < shapes.length; i++) {
                for (let j = i + 1; j < shapes.length; j++) {
                    const s1 = shapes[i];
                    const s2 = shapes[j];
                    
                    // Centers
                    const c1x = s1.x + s1.radius;
                    const c1y = s1.y + s1.radius;
                    const c2x = s2.x + s2.radius;
                    const c2y = s2.y + s2.radius;

                    const dx = c2x - c1x;
                    const dy = c2y - c1y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const minDist = s1.radius + s2.radius;

                    if (distance < minDist) {
                        // Normalize collision vector
                        const nx = dx / distance;
                        const ny = dy / distance;

                        // Relative velocity
                        const dvx = s1.vx - s2.vx;
                        const dvy = s1.vy - s2.vy;
                        
                        // Relative velocity along the normal
                        const velAlongNormal = dvx * nx + dvy * ny;

                        // Do not resolve if velocities are separating
                        if (velAlongNormal > 0) {
                            const impulse = velAlongNormal; 
                            
                            s1.vx -= impulse * nx;
                            s1.vy -= impulse * ny;
                            s2.vx += impulse * nx;
                            s2.vy += impulse * ny;
                            
                            // Push them apart slightly to prevent sticking
                            const overlap = minDist - distance;
                            s1.x -= (overlap / 2) * nx;
                            s1.y -= (overlap / 2) * ny;
                            s2.x += (overlap / 2) * nx;
                            s2.y += (overlap / 2) * ny;
                        }
                    }
                }
            }

            // Apply transforms
            for (let i = 0; i < shapes.length; i++) {
                const s = shapes[i];
                s.el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotate(${s.rotation}deg)`;
            }

            requestAnimationFrame(updatePhysics);
        }

        requestAnimationFrame(updatePhysics);
    }

    // Ensure it runs safely after everything is loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initDynamicBg();
    } else {
        window.addEventListener('DOMContentLoaded', initDynamicBg);
    }
})();
