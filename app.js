/**
 * Gravity Lab - Interactive Physics Simulator
 * Core Engine & Interactive Code
 */

(function () {
  // Canvas & Context
  const canvas = document.getElementById('physics-canvas');
  const ctx = canvas.getContext('2d');
  
  // UI Elements
  const btnPlayPause = document.getElementById('btn-play-pause');
  const txtPlayPause = document.getElementById('txt-play-pause');
  const btnReset = document.getElementById('btn-reset');
  const btnClear = document.getElementById('btn-clear');
  const btnPresentation = document.getElementById('btn-presentation');
  
  const sliderGravity = document.getElementById('slider-gravity');
  const valGravityReadout = document.getElementById('val-gravity-readout');
  
  const presetEarth = document.getElementById('preset-earth');
  const presetMoon = document.getElementById('preset-moon');
  const presetMars = document.getElementById('preset-mars');
  const presetZero = document.getElementById('preset-zero');
  const presetReverse = document.getElementById('preset-reverse');
  
  const colorSwatches = document.getElementById('color-swatches');
  const pickerColor = document.getElementById('picker-color');
  const sliderRadius = document.getElementById('slider-radius');
  const valRadius = document.getElementById('val-radius');
  const sliderBounce = document.getElementById('slider-bounce');
  const valBounce = document.getElementById('val-bounce');
  
  const toggleGrid = document.getElementById('toggle-grid');
  const toggleTrails = document.getElementById('toggle-trails');
  const toggleVectors = document.getElementById('toggle-vectors');
  const toggleCollisions = document.getElementById('toggle-collisions');
  
  // HUD Elements
  const hudGravityVal = document.getElementById('hud-gravity-val');
  const gravityMeterBar = document.getElementById('gravity-meter-bar');
  const hudBallsVal = document.getElementById('hud-balls-val');
  const hudSpeedVal = document.getElementById('hud-speed-val');
  const hudFpsVal = document.getElementById('hud-fps-val');
  
  // Drag Helper Elements
  const dragHelper = document.getElementById('drag-helper');
  const dragLine = document.getElementById('drag-line');
  const dragCircle = document.getElementById('drag-circle');
  
  // Presentation Modal Elements
  const modalPresentation = document.getElementById('modal-presentation');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCloseModalFooter = document.getElementById('btn-close-modal-footer');
  const btnCopyScript = document.getElementById('btn-copy-script');

  // Simulation Constants & Scaling
  const PX_PER_METER = 60; // 60 pixels represent 1 meter
  const DEFAULT_GRAVITY = 9.81; // Earth gravity (m/s^2)
  const TIME_SPEED = 1.0; // Speed multiplier for time delta
  
  // Simulation State
  let isRunning = true;
  let gravity = DEFAULT_GRAVITY; // m/s^2
  let balls = [];
  let lastTime = 0;
  let fps = 60;
  let frameCount = 0;
  let fpsLastTime = 0;
  
  // Drag-to-Launch State
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let dragCurrent = { x: 0, y: 0 };
  
  // Ball custom properties (from sidebar)
  let selectedColor = '#00f3ff';
  let spawnRadius = 20;
  let spawnRestitution = 0.8;

  // ==========================================================================
  // INITIALIZATION & RESIZING
  // ==========================================================================
  
  function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    setupEventListeners();
    
    // Set initial preset status
    updateActivePresetClass(gravity);
    updateGravityHUD();
    
    // Spawn a couple of default balls to start with
    spawnInitialBalls();
    
    // Start physics loop
    lastTime = performance.now();
    fpsLastTime = lastTime;
    requestAnimationFrame(loop);
  }

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight;
    
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
  }

  function spawnInitialBalls() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    
    // Spawn one bouncing ball in the center-top area
    balls.push(new Ball(w * 0.5, h * 0.3, 22, '#00f3ff', 0.8, 150, -50));
  }

  // ==========================================================================
  // BALL CLASS DEFINITION
  // ==========================================================================
  
  class Ball {
    constructor(x, y, radius, color, restitution, vx = 0, vy = 0) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      this.restitution = restitution; // Bounciness coefficient (0 - 1)
      this.vx = vx; // Velocity X (px/s)
      this.vy = vy; // Velocity Y (px/s)
      this.mass = Math.PI * radius * radius; // Mass proportional to area
      this.trail = [];
      this.trailMaxLength = 24;
      this.trailCounter = 0;
    }

    update(dt, width, height) {
      // Apply gravity (acceleration Y = gravity in m/s^2 * PX_PER_METER)
      const gravityAcc = gravity * PX_PER_METER;
      this.vy += gravityAcc * dt;
      
      // Update position
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      
      // Save trail history
      this.trailCounter++;
      if (this.trailCounter % 2 === 0) { // Throttle trail recording
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.trailMaxLength) {
          this.trail.shift();
        }
      }
      
      // Collision with environment boundaries
      const bounceFriction = 0.995; // Minor horizontal air friction on wall impact
      
      // Floor collision
      if (this.y + this.radius > height) {
        this.y = height - this.radius;
        this.vy = -this.vy * this.restitution;
        this.vx *= bounceFriction;
        
        // Prevent sticking to floor due to float precision
        if (Math.abs(this.vy) < 15 && gravity >= 0) {
          this.vy = 0;
        }
      }
      
      // Ceiling collision
      if (this.y - this.radius < 0) {
        this.y = this.radius;
        this.vy = -this.vy * this.restitution;
        this.vx *= bounceFriction;
        
        if (Math.abs(this.vy) < 15 && gravity < 0) {
          this.vy = 0;
        }
      }
      
      // Left Wall collision
      if (this.x - this.radius < 0) {
        this.x = this.radius;
        this.vx = -this.vx * this.restitution;
      }
      
      // Right Wall collision
      if (this.x + this.radius > width) {
        this.x = width - this.radius;
        this.vx = -this.vx * this.restitution;
      }
    }

    draw(ctx) {
      const showTrails = toggleTrails.checked;
      const showVectors = toggleVectors.checked;
      
      // 1. Draw trail
      if (showTrails && this.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
          ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        
        // Create dynamic gradient for fading tail
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = this.radius * 0.3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        
        // Fading inner line
        ctx.globalAlpha = 0.12;
        ctx.lineWidth = this.radius * 0.8;
        ctx.stroke();
        
        ctx.globalAlpha = 1.0; // Reset
      }
      
      // 2. Draw Ball (Gradient Spherical rendering)
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      
      // 3D Sphere gradient overlay
      const grad = ctx.createRadialGradient(
        this.x - this.radius * 0.3, 
        this.y - this.radius * 0.3, 
        this.radius * 0.05,
        this.x, 
        this.y, 
        this.radius
      );
      
      // Lighten the highlight center, darken outer edges
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.2, this.color);
      grad.addColorStop(0.85, darkenColor(this.color, 40));
      grad.addColorStop(1, darkenColor(this.color, 70));
      
      ctx.fillStyle = grad;
      ctx.shadowBlur = 12;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.shadowBlur = 0; // Reset shadow
      
      // Outline/Border
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.stroke();
      
      // 3. Draw Velocity Vector Arrow
      if (showVectors) {
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 5) {
          const arrowScale = 0.12; // Length multiplier
          const maxArrowLength = 120;
          let arrowLength = speed * arrowScale;
          if (arrowLength > maxArrowLength) arrowLength = maxArrowLength;
          
          const angle = Math.atan2(this.vy, this.vx);
          const endX = this.x + Math.cos(angle) * arrowLength;
          const endY = this.y + Math.sin(angle) * arrowLength;
          
          // Draw line
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          
          // Draw arrow head
          const headLength = 8;
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - headLength * Math.cos(angle - Math.PI / 6),
            endY - headLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            endX - headLength * Math.cos(angle + Math.PI / 6),
            endY - headLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      }
    }
  }

  // Helper utility to darken hex colors
  function darkenColor(hex, percent) {
    let num = parseInt(hex.replace('#',''), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) - amt,
        G = (num >> 8 & 0x00FF) - amt,
        B = (num & 0x0000FF) - amt;
    return "#" + (
      0x1000000 + 
      (R < 0 ? 0 : R > 255 ? 255 : R) * 0x10000 + 
      (G < 0 ? 0 : G > 255 ? 255 : G) * 0x100 + 
      (B < 0 ? 0 : B > 255 ? 255 : B)
    ).toString(16).slice(1);
  }

  // ==========================================================================
  // PHYSICS ENGINE & COLLISION RESOLUTION
  // ==========================================================================
  
  function resolveCollisions() {
    if (!toggleCollisions.checked || balls.length < 2) return;
    
    // Double loop to check collisions between every ball pair
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const b1 = balls[i];
        const b2 = balls[j];
        
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = b1.radius + b2.radius;
        
        if (dist < minDist) {
          // Prevent overlapping objects (positional correction)
          const overlap = minDist - dist;
          
          // Collision normal vector
          // If balls overlap exactly, handle division by zero
          const nx = dist === 0 ? 1 : dx / dist;
          const ny = dist === 0 ? 0 : dy / dist;
          
          // Distribute positional correction based on mass proportions
          const totalMass = b1.mass + b2.mass;
          const correctionScalar = overlap / totalMass;
          
          b1.x -= nx * (correctionScalar * b2.mass);
          b1.y -= ny * (correctionScalar * b2.mass);
          b2.x += nx * (correctionScalar * b1.mass);
          b2.y += ny * (correctionScalar * b1.mass);
          
          // Elastic Collision Physics (Impulse Resolution)
          // Relative velocity vector
          const rvx = b2.vx - b1.vx;
          const rvy = b2.vy - b1.vy;
          
          // Relative velocity along normal direction
          const velAlongNormal = rvx * nx + rvy * ny;
          
          // Do not resolve if velocities are already moving apart
          if (velAlongNormal < 0) {
            // Restitution factor (average bounciness)
            const restitution = (b1.restitution + b2.restitution) / 2;
            
            // Calculate impulse scalar
            let impulseScalar = -(1 + restitution) * velAlongNormal;
            impulseScalar /= (1 / b1.mass + 1 / b2.mass);
            
            // Apply impulse to each ball
            b1.vx -= (impulseScalar / b1.mass) * nx;
            b1.vy -= (impulseScalar / b1.mass) * ny;
            b2.vx += (impulseScalar / b2.mass) * nx;
            b2.vy += (impulseScalar / b2.mass) * ny;
          }
        }
      }
    }
  }

  // ==========================================================================
  // BACKGROUND GRID RENDERING (WITH WARPING GRAVITY WELLS)
  // ==========================================================================
  
  function drawBackgroundGrid(width, height) {
    if (!toggleGrid.checked) return;
    
    const gridSpacing = 40;
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
    ctx.lineWidth = 1;
    
    // Grid horizontal lines
    for (let y = 0; y < height; y += gridSpacing) {
      ctx.beginPath();
      for (let x = 0; x < width; x += 10) {
        let displayX = x;
        let displayY = y;
        
        // Gravity warping physics effect: Pull grid intersection lines towards massive bodies!
        balls.forEach(ball => {
          const dx = ball.x - x;
          const dy = ball.y - y;
          const dist2 = dx * dx + dy * dy;
          const warpRadius = ball.radius * 3.5;
          
          if (dist2 < warpRadius * warpRadius) {
            const dist = Math.sqrt(dist2);
            // Stronger pull when closer, fading at edge
            const force = (warpRadius - dist) / warpRadius;
            const displacement = force * (ball.radius * 0.28);
            
            displayX += (dx / (dist || 1)) * displacement;
            displayY += (dy / (dist || 1)) * displacement;
          }
        });
        
        if (x === 0) ctx.moveTo(displayX, displayY);
        else ctx.lineTo(displayX, displayY);
      }
      ctx.stroke();
    }
    
    // Grid vertical lines
    for (let x = 0; x < width; x += gridSpacing) {
      ctx.beginPath();
      for (let y = 0; y < height; y += 10) {
        let displayX = x;
        let displayY = y;
        
        balls.forEach(ball => {
          const dx = ball.x - x;
          const dy = ball.y - y;
          const dist2 = dx * dx + dy * dy;
          const warpRadius = ball.radius * 3.5;
          
          if (dist2 < warpRadius * warpRadius) {
            const dist = Math.sqrt(dist2);
            const force = (warpRadius - dist) / warpRadius;
            const displacement = force * (ball.radius * 0.28);
            
            displayX += (dx / (dist || 1)) * displacement;
            displayY += (dy / (dist || 1)) * displacement;
          }
        });
        
        if (y === 0) ctx.moveTo(displayX, displayY);
        else ctx.lineTo(displayX, displayY);
      }
      ctx.stroke();
    }
  }

  // ==========================================================================
  // PHYSICS LOOP
  // ==========================================================================
  
  function loop(currentTime) {
    // 1. Manage Delta Time (Cap delta to prevent tunneling during lag spikes)
    let dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    if (dt > 0.1) dt = 0.1; // Maximum dt threshold (10fps min)
    dt *= TIME_SPEED;
    
    // 2. Manage FPS Statistics
    frameCount++;
    if (currentTime - fpsLastTime >= 1000) {
      fps = Math.round((frameCount * 1000) / (currentTime - fpsLastTime));
      hudFpsVal.textContent = fps;
      
      // Color code FPS to indicate performance
      if (fps >= 55) {
        hudFpsVal.className = 'hud-card-value font-mono text-green';
      } else if (fps >= 30) {
        hudFpsVal.className = 'hud-card-value font-mono text-cyan';
      } else {
        hudFpsVal.className = 'hud-card-value font-mono text-red';
      }
      
      frameCount = 0;
      fpsLastTime = currentTime;
    }
    
    // Get Dimensions
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    
    // Clear viewport canvas
    ctx.clearRect(0, 0, w, h);
    
    // Draw background elements
    drawBackgroundGrid(w, h);
    
    // 3. Update & Draw Balls
    let maxSpeed = 0;
    
    if (isRunning) {
      // Update state
      balls.forEach(ball => ball.update(dt, w, h));
      resolveCollisions();
    }
    
    // Render state
    balls.forEach(ball => {
      ball.draw(ctx);
      
      // Track peak speed
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      if (speed > maxSpeed) maxSpeed = speed;
    });
    
    // 4. Update HUD Statistics
    hudBallsVal.textContent = balls.length;
    hudSpeedVal.innerHTML = `${(maxSpeed / PX_PER_METER).toFixed(1)}<span class="hud-card-unit"> m/s</span>`;
    
    requestAnimationFrame(loop);
  }

  // ==========================================================================
  // HUD GAUGE & UI UPDATERS
  // ==========================================================================
  
  function updateGravityHUD() {
    // Update labels and values
    valGravityReadout.innerHTML = `${gravity.toFixed(2)}<span class="unit"> m/s²</span>`;
    hudGravityVal.textContent = `${gravity.toFixed(2)} m/s²`;
    
    // Update graphic bar. Gravity slider is -20 to 20.
    // Map -20..20 to -50%..50% of meter bar width
    const percentage = (gravity / 20) * 50; // Ranges from -50% to 50%
    
    if (percentage >= 0) {
      gravityMeterBar.style.left = '50%';
      gravityMeterBar.style.width = percentage + '%';
      gravityMeterBar.style.backgroundColor = 'var(--neon-cyan)';
    } else {
      // Negative gravity (Reverse)
      gravityMeterBar.style.left = (50 + percentage) + '%';
      gravityMeterBar.style.width = Math.abs(percentage) + '%';
      gravityMeterBar.style.backgroundColor = 'var(--neon-pink)';
    }
  }
  
  function updateActivePresetClass(currentG) {
    // Highlight presets depending on exact slider value match
    const presets = [presetEarth, presetMoon, presetMars, presetZero, presetReverse];
    presets.forEach(p => p.classList.remove('active'));
    
    if (Math.abs(currentG - 9.81) < 0.05) presetEarth.classList.add('active');
    else if (Math.abs(currentG - 1.62) < 0.05) presetMoon.classList.add('active');
    else if (Math.abs(currentG - 3.71) < 0.05) presetMars.classList.add('active');
    else if (Math.abs(currentG - 0.00) < 0.05) presetZero.classList.add('active');
    else if (Math.abs(currentG - (-9.81)) < 0.05) presetReverse.classList.add('active');
  }

  // ==========================================================================
  // EVENT LISTENERS & USER INPUTS
  // ==========================================================================
  
  function setupEventListeners() {
    
    // Play/Pause Playback
    btnPlayPause.addEventListener('click', () => {
      isRunning = !isRunning;
      if (isRunning) {
        btnPlayPause.className = 'btn btn-primary';
        btnPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i> <span id="txt-play-pause">Pause</span>';
      } else {
        btnPlayPause.className = 'btn btn-secondary';
        btnPlayPause.innerHTML = '<i class="fa-solid fa-play"></i> <span id="txt-play-pause">Play</span>';
        
        // Add styling indicator
        btnPlayPause.style.borderColor = 'var(--neon-yellow)';
      }
    });

    // Reset Simulation parameters
    btnReset.addEventListener('click', () => {
      gravity = DEFAULT_GRAVITY;
      sliderGravity.value = DEFAULT_GRAVITY;
      updateActivePresetClass(gravity);
      updateGravityHUD();
      
      // Reset spawner settings
      selectedColor = '#00f3ff';
      spawnRadius = 20;
      spawnRestitution = 0.8;
      
      // Update sliders and text values
      sliderRadius.value = 20;
      valRadius.textContent = '20 px';
      sliderBounce.value = 0.8;
      valBounce.textContent = '0.80';
      
      // Reset color swatches active state
      const swatches = colorSwatches.querySelectorAll('.swatch');
      swatches.forEach(s => s.classList.remove('active'));
      swatches[0].classList.add('active');
      pickerColor.value = '#00f3ff';
      
      // Clear and respawn default balls
      balls = [];
      spawnInitialBalls();
      
      // Ensure running
      if (!isRunning) {
        btnPlayPause.click();
      }
    });

    // Clear Screen
    btnClear.addEventListener('click', () => {
      balls = [];
    });

    // Gravity Slider events
    sliderGravity.addEventListener('input', (e) => {
      gravity = parseFloat(e.target.value);
      updateActivePresetClass(gravity);
      updateGravityHUD();
    });

    // Preset buttons clicks
    const presetButtons = [presetEarth, presetMoon, presetMars, presetZero, presetReverse];
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseFloat(btn.getAttribute('data-g'));
        gravity = val;
        sliderGravity.value = val;
        updateActivePresetClass(val);
        updateGravityHUD();
      });
    });

    // Radius Custom Slider
    sliderRadius.addEventListener('input', (e) => {
      spawnRadius = parseInt(e.target.value);
      valRadius.textContent = spawnRadius + ' px';
    });

    // Bounciness (Elasticity) Slider
    sliderBounce.addEventListener('input', (e) => {
      spawnRestitution = parseFloat(e.target.value);
      valBounce.textContent = spawnRestitution.toFixed(2);
    });

    // Color Swatch Selection
    colorSwatches.addEventListener('click', (e) => {
      const swatch = e.target.closest('.swatch');
      if (swatch) {
        colorSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        selectedColor = swatch.getAttribute('data-color');
        pickerColor.value = selectedColor;
      }
    });

    // Color Picker Event
    pickerColor.addEventListener('input', (e) => {
      selectedColor = e.target.value;
      // Remove active classes on pre-selected color swatches
      colorSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    });

    // ==========================================================================
    // CLICK / DRAG SPING BALL CONTROLLER (SLINGSHOT MECHANICS)
    // ==========================================================================
    
    function getCanvasCoordinates(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    function handleStart(e) {
      const coords = getCanvasCoordinates(e);
      isDragging = true;
      dragStart = { ...coords };
      dragCurrent = { ...coords };
      
      // Setup helper UI
      dragCircle.setAttribute('cx', dragStart.x);
      dragCircle.setAttribute('cy', dragStart.y);
      dragCircle.setAttribute('r', spawnRadius);
      dragCircle.setAttribute('stroke', selectedColor);
      
      dragLine.setAttribute('x1', dragStart.x);
      dragLine.setAttribute('y1', dragStart.y);
      dragLine.setAttribute('x2', dragStart.x);
      dragLine.setAttribute('y2', dragStart.y);
      dragLine.setAttribute('stroke', selectedColor);
      
      dragHelper.style.display = 'block';
    }

    function handleMove(e) {
      if (!isDragging) return;
      
      const coords = getCanvasCoordinates(e);
      dragCurrent = { ...coords };
      
      // Update line pointing opposite direction for slingshot release (or direct pull)
      // We will make it pull back slingshot style!
      dragLine.setAttribute('x2', dragCurrent.x);
      dragLine.setAttribute('y2', dragCurrent.y);
    }

    function handleEnd() {
      if (!isDragging) return;
      isDragging = false;
      dragHelper.style.display = 'none';
      
      const dx = dragStart.x - dragCurrent.x;
      const dy = dragStart.y - dragCurrent.y;
      const dragDistance = Math.sqrt(dx * dx + dy * dy);
      
      let initVx = 0;
      let initVy = 0;
      
      // If drag distance is very small, treat as a single click and apply small random velocity
      if (dragDistance < 6) {
        initVx = (Math.random() - 0.5) * 120;
        initVy = (Math.random() - 0.5) * 120;
      } else {
        // Slingshot: Ball shoots in direction of pull vector.
        // Scale the drag vector to represent launch velocity in pixels/second.
        const speedScale = 2.8; 
        initVx = dx * speedScale;
        initVy = dy * speedScale;
      }
      
      // Spawn new Ball
      balls.push(new Ball(
        dragStart.x, 
        dragStart.y, 
        spawnRadius, 
        selectedColor, 
        spawnRestitution, 
        initVx, 
        initVy
      ));
    }

    // Canvas Mouse listeners
    canvas.addEventListener('mousedown', handleStart);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    
    // Canvas Touch listeners (Mobile support)
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Stop scrolling when dragging on canvas
      handleStart(e);
    }, { passive: false });
    
    window.addEventListener('touchmove', (e) => {
      if (isDragging) e.preventDefault();
      handleMove(e);
    }, { passive: false });
    
    window.addEventListener('touchend', handleEnd);

    // ==========================================================================
    // PRESENTATION MODAL LOGIC
    // ==========================================================================
    
    btnPresentation.addEventListener('click', () => {
      modalPresentation.classList.add('open');
    });

    const closeModalFunc = () => {
      modalPresentation.classList.remove('open');
    };

    btnCloseModal.addEventListener('click', closeModalFunc);
    btnCloseModalFooter.addEventListener('click', closeModalFunc);
    
    // Close on clicking overlay background
    modalPresentation.addEventListener('click', (e) => {
      if (e.target === modalPresentation) closeModalFunc();
    });

    // Copy script to clipboard
    btnCopyScript.addEventListener('click', () => {
      const text = document.querySelector('.presentation-script').textContent.trim();
      navigator.clipboard.writeText(text).then(() => {
        const originalText = btnCopyScript.innerHTML;
        btnCopyScript.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        btnCopyScript.style.backgroundColor = 'var(--neon-green)';
        btnCopyScript.style.color = '#000';
        
        setTimeout(() => {
          btnCopyScript.innerHTML = originalText;
          btnCopyScript.style.backgroundColor = '';
          btnCopyScript.style.color = '';
        }, 1500);
      });
    });

    // ==========================================================================
    // GEMINI CHAT COPILOT LOGIC (READY FOR CLOUD API UPGRADES)
    // ==========================================================================
    const geminiToggle = document.getElementById('gemini-toggle');
    const geminiChatWindow = document.getElementById('gemini-chat-window');
    const geminiClose = document.getElementById('gemini-close');
    const geminiInput = document.getElementById('gemini-input');
    const geminiSendBtn = document.getElementById('gemini-send-btn');
    const geminiMessages = document.getElementById('gemini-messages');

    geminiToggle.addEventListener('click', () => {
      geminiChatWindow.classList.toggle('open');
      if (geminiChatWindow.classList.contains('open')) {
        geminiToggle.style.display = 'none';
        geminiInput.focus();
      }
    });

    geminiClose.addEventListener('click', () => {
      geminiChatWindow.classList.remove('open');
      geminiToggle.style.display = 'flex';
    });

    const addMessage = (sender, text, type = 'ai') => {
      const msgDiv = document.createElement('div');
      msgDiv.className = `message ${type}`;
      
      const avatarIcon = type === 'user' ? 'fa-user' : (type === 'system' ? 'fa-robot' : 'fa-wand-magic-sparkles');
      
      msgDiv.innerHTML = `
        <div class="msg-avatar"><i class="fa-solid ${avatarIcon}"></i></div>
        <div class="msg-text">${text}</div>
      `;
      
      geminiMessages.appendChild(msgDiv);
      geminiMessages.scrollTop = geminiMessages.scrollHeight;
    };

    const processCommand = (query) => {
      const q = query.toLowerCase().trim();
      
      // 1. Set gravity preset
      if (q.includes('set gravity to') || q.includes('change gravity to') || q.includes('gravity =')) {
        let value = 0;
        let name = '';
        if (q.includes('earth')) { value = 9.81; name = 'Earth'; }
        else if (q.includes('moon')) { value = 1.62; name = 'Moon'; }
        else if (q.includes('mars')) { value = 3.71; name = 'Mars'; }
        else if (q.includes('zero') || q.includes('no gravity')) { value = 0.00; name = 'Zero-G'; }
        else if (q.includes('reverse')) { value = -9.81; name = 'Reverse Gravity'; }
        else {
          const match = q.match(/[-+]?[0-9]*\.?[0-9]+/);
          if (match) {
            value = parseFloat(match[0]);
            if (value < -20) value = -20;
            if (value > 20) value = 20;
            name = `${value.toFixed(2)} m/s²`;
          } else {
            return "I couldn't parse the gravity value. Try typing 'set gravity to 12.5' or 'set gravity to earth'.";
          }
        }
        
        gravity = value;
        sliderGravity.value = value;
        updateActivePresetClass(value);
        updateGravityHUD();
        return `Successfully adjusted simulator gravity to **${name}** (${value} m/s²).`;
      }
      
      // 2. Spawn balls
      if (q.includes('spawn') || q.includes('add ball') || q.includes('create ball')) {
        let count = 1;
        const countMatch = q.match(/\d+/);
        if (countMatch) count = parseInt(countMatch[0]);
        if (count > 25) count = 25; // Safety cap
        
        let color = selectedColor;
        if (q.includes('red')) color = '#ef4444';
        else if (q.includes('blue')) color = '#3b82f6';
        else if (q.includes('green')) color = '#00ff66';
        else if (q.includes('purple') || q.includes('violet')) color = '#bd00ff';
        else if (q.includes('pink')) color = '#ff007c';
        else if (q.includes('yellow') || q.includes('orange')) color = '#ffaa00';
        else if (q.includes('cyan')) color = '#00f3ff';
        
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        for (let i = 0; i < count; i++) {
          const rx = w * 0.2 + Math.random() * (w * 0.6);
          const ry = h * 0.2 + Math.random() * (h * 0.3);
          const vx = (Math.random() - 0.5) * 300;
          const vy = (Math.random() - 0.5) * 200;
          balls.push(new Ball(rx, ry, spawnRadius, color, spawnRestitution, vx, vy));
        }
        return `Spawned **${count}** ball(s) with color <span style="color:${color}">${color}</span> into the simulation!`;
      }
      
      // 3. Reset/Clear simulation
      if (q.includes('reset') || q.includes('restart')) {
        btnReset.click();
        return "Simulation parameters and ball configurations have been reset to default values.";
      }
      if (q.includes('clear') || q.includes('delete all')) {
        btnClear.click();
        return "Cleared all active balls from the viewport.";
      }
      
      // 4. Educational physics questions
      if (q.includes('gravity') || q.includes('what is') || q.includes('explain') || q.includes('why')) {
        return `**Physics Explainer:** Gravity is the force by which a planet or other body draws objects toward its center. On Earth, gravity accelerates falling objects at roughly **9.81 m/s²**. 
        <br><br>
        In this simulator, if you decrease gravity (e.g. Moon mode at 1.62 m/s²), the downward acceleration decreases, meaning balls fall slower and bounce higher. In Zero-G, there is no downward force, so balls continue moving in straight paths at constant speeds.`;
      }
      
      // Default info message
      return `I received your message! To make this fully generative, connect a server-side Gemini API route. 
      <br><br>
      *Current client-side automation commands:*
      - **set gravity to [earth/moon/mars/zero/reverse/number]**
      - **spawn [number] [color] balls**
      - **clear** or **reset**
      - **explain gravity**`;
    };

    const handleSendMessage = () => {
      const text = geminiInput.value.trim();
      if (!text) return;
      
      addMessage('User', text, 'user');
      geminiInput.value = '';
      
      // Mock loading state
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'message ai';
      loadingDiv.innerHTML = `
        <div class="msg-avatar"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
        <div class="msg-text">Gemini is writing code...</div>
      `;
      geminiMessages.appendChild(loadingDiv);
      geminiMessages.scrollTop = geminiMessages.scrollHeight;
      
      setTimeout(() => {
        geminiMessages.removeChild(loadingDiv);
        const responseText = processCommand(text);
        addMessage('Gemini AI', responseText, 'ai');
      }, 700);
    };

    geminiSendBtn.addEventListener('click', handleSendMessage);
    geminiInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSendMessage();
    });
  }

  // Run initialization
  window.addEventListener('DOMContentLoaded', init);
})();
