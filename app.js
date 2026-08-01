(function() {
  // ==========================================================================
  // 1. CONSTANTS & CONFIG
  // ==========================================================================
  const PX_PER_METER = 60;
  const DEFAULT_GRAVITY = 9.81;
  const PLAYER_RADIUS = 18;
  const PLAYER_COLOR = '#00f3ff';
  const PLAYER_RESTITUTION = 0.7;
  const PLAYER_MOVE_SPEED = 350;
  const PLAYER_JUMP_FORCE = -450;
  const CRYSTAL_RADIUS = 12;
  const CRYSTAL_SCORE = 10;
  const OBSTACLE_BASE_SPEED = 200;
  const BASE_SPAWN_INTERVAL = 2500;
  const DIFFICULTY_INTERVAL = 20;
  const MAX_PARTICLES = 60;
  const TRAIL_MAX_LENGTH = 20;
  const GRAVITY_FACTS = [
    "The Moon's gravity is only about 1/6 of Earth's.",
    "Jupiter has the strongest gravity of any planet in our solar system.",
    "Black holes have gravity so strong that even light cannot escape.",
    "Without gravity, the Earth would fly off into space.",
    "Gravity is what keeps the Earth in orbit around the Sun.",
    "The force of gravity gets weaker the farther apart two objects are.",
    "Isaac Newton was the first to formulate a law of universal gravitation.",
    "Albert Einstein's general theory of relativity describes gravity as a curve in spacetime.",
    "You would weigh less on Mars because it has less mass than Earth.",
    "Gravity is responsible for the ocean tides.",
    "Gravity travels at the speed of light.",
    "Microgravity in space makes astronauts float, but they are actually in continuous freefall."
  ];

  // Mobile detection
  const IS_TOUCH_DEVICE = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const MOBILE_MAX_PARTICLES = 30;
  const MOBILE_TRAIL_LENGTH = 10;
  const MOBILE_STAR_COUNT = 50;

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
  // 2. AUDIO MANAGER
  // ==========================================================================
  const AudioManager = {
    ctx: null,
    init() {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },
    playOscillator(type, freqStart, freqEnd, duration, volume = 0.1) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, this.ctx.currentTime);
      if (freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + duration);
      }
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    },
    playClick() { this.playOscillator('square', 800, null, 0.08, 0.05); },
    playCrystal() { this.playOscillator('sine', 400, 800, 0.15, 0.1); },
    playCollision() { this.playOscillator('sawtooth', 100, 50, 0.3, 0.2); },
    playReverse() { this.playOscillator('sine', 200, 600, 0.2, 0.1); },
    playCountdown() { this.playOscillator('square', 600, null, 0.1, 0.1); },
    playGameStart() {
      if (!this.ctx) return;
      const playFreq = (f, t) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + t + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + t);
        osc.stop(this.ctx.currentTime + t + 0.3);
      };
      playFreq(400, 0);
      playFreq(500, 0.1);
      playFreq(600, 0.2);
    }
  };

  // ==========================================================================
  // 3. PARTICLE SYSTEM
  // ==========================================================================
  let particles = [];
  class Particle {
    constructor(x, y, vx, vy, life, color, size) {
      this.x = x; this.y = y; this.vx = vx; this.vy = vy;
      this.life = life; this.maxLife = life; this.color = color; this.size = size;
    }
  }
  function spawnParticles(x, y, count, color, spread = 100) {
    for (let i = 0; i < count; i++) {
      if (particles.length >= (IS_TOUCH_DEVICE ? MOBILE_MAX_PARTICLES : MAX_PARTICLES)) particles.shift();
      const vx = (Math.random() - 0.5) * spread;
      const vy = (Math.random() - 0.5) * spread;
      const life = 0.5 + Math.random() * 0.5;
      const size = 2 + Math.random() * 3;
      particles.push(new Particle(x, y, vx, vy, life, color, size));
    }
  }
  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      let p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }
  function renderParticles(ctx) {
    particles.forEach(p => {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  }

  // ==========================================================================
  // 4. PLAYER CLASS
  // ==========================================================================
  class Player {
    constructor(x, y, radius, color, restitution) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      this.restitution = restitution;
      this.vx = 0;
      this.vy = 0;
      this.trail = [];
      this.trailCounter = 0;
      this.isAlive = true;
      this.invincibleTimer = 0;
      this.isGrounded = false;
    }

    update(dt, width, height, gravity, inputDirection) {
      if (!this.isAlive) return;
      
      const gravityAcc = gravity * PX_PER_METER;
      this.vy += gravityAcc * dt;
      
      this.vx += inputDirection * PLAYER_MOVE_SPEED * dt;
      this.vx *= 0.92;
      
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      
      this.trailCounter++;
      if (this.trailCounter % 2 === 0) {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > (IS_TOUCH_DEVICE ? MOBILE_TRAIL_LENGTH : TRAIL_MAX_LENGTH)) {
          this.trail.shift();
        }
      }
      
      const bounceFriction = 0.995;
      this.isGrounded = false;
      
      if (this.y + this.radius > height) {
        this.y = height - this.radius;
        this.vy = -this.vy * this.restitution;
        this.vx *= bounceFriction;
        if (Math.abs(this.vy) < 15 && gravity >= 0) {
          this.vy = 0;
          this.isGrounded = true;
        }
      }
      
      if (this.y - this.radius < 0) {
        this.y = this.radius;
        this.vy = -this.vy * this.restitution;
        this.vx *= bounceFriction;
        if (Math.abs(this.vy) < 15 && gravity < 0) {
          this.vy = 0;
          this.isGrounded = true;
        }
      }
      
      if (this.x - this.radius < 0) {
        this.x = this.radius;
        this.vx = -this.vx * this.restitution;
      }
      
      if (this.x + this.radius > width) {
        this.x = width - this.radius;
        this.vx = -this.vx * this.restitution;
      }
      
      if (this.invincibleTimer > 0) {
        this.invincibleTimer -= dt;
      }
      
      if (this.y < -this.radius * 2 || this.y > height + this.radius * 2) {
        GameManager.gameOver();
      }
    }

    draw(ctx) {
      if (!this.isAlive) return;
      
      if (this.invincibleTimer > 0) {
        if (Math.floor(this.invincibleTimer * 10) % 2 === 0) return;
      }
      
      if (this.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
          ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = this.radius * 0.3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        
        ctx.globalAlpha = 0.12;
        ctx.lineWidth = this.radius * 0.8;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      
      const grad = ctx.createRadialGradient(
        this.x - this.radius * 0.3, 
        this.y - this.radius * 0.3, 
        this.radius * 0.05,
        this.x, 
        this.y, 
        this.radius
      );
      
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.2, this.color);
      grad.addColorStop(0.85, darkenColor(this.color, 40));
      grad.addColorStop(1, darkenColor(this.color, 70));
      
      ctx.fillStyle = grad;
      ctx.shadowBlur = 12;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.stroke();
    }
  }

  // ==========================================================================
  // 5. OBSTACLE SYSTEM
  // ==========================================================================
  let obstacles = [];
  class Obstacle {
    constructor(x, y, width, height, speed, type) {
      this.x = x; this.y = y; this.width = width; this.height = height;
      this.speed = speed; this.type = type;
      this.warningTimer = type === 'laser' ? 1.0 : 0;
      this.active = type !== 'laser';
    }
  }
  function spawnObstacle(canvasWidth, canvasHeight, multiplier) {
    const types = ['spike', 'block', 'laser'];
    const type = types[Math.floor(Math.random() * types.length)];
    const speed = OBSTACLE_BASE_SPEED * multiplier;
    let y = Math.random() * (canvasHeight - 100) + 50;
    
    if (type === 'laser') {
      obstacles.push(new Obstacle(0, y, canvasWidth, 10, 0, 'laser'));
    } else {
      let width = type === 'spike' ? 30 : 40 + Math.random() * 40;
      let height = type === 'spike' ? 40 : 40 + Math.random() * 40;
      obstacles.push(new Obstacle(canvasWidth + 50, y, width, height, speed, type));
    }
  }
  function updateObstacles(dt) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      let obs = obstacles[i];
      if (obs.type === 'laser') {
        if (obs.warningTimer > 0) {
          obs.warningTimer -= dt;
          if (obs.warningTimer <= 0) obs.active = true;
        } else {
          obs.warningTimer -= dt;
          if (obs.warningTimer < -1.5) obstacles.splice(i, 1);
        }
      } else {
        obs.x -= obs.speed * dt;
        if (obs.x + obs.width < -50) obstacles.splice(i, 1);
      }
    }
  }
  function renderObstacles(ctx) {
    obstacles.forEach(obs => {
      if (obs.type === 'laser') {
        if (obs.warningTimer > 0) {
          ctx.fillStyle = (Math.floor(obs.warningTimer * 10) % 2 === 0) ? 'rgba(255, 0, 124, 0.5)' : 'transparent';
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        } else if (obs.active) {
          ctx.fillStyle = '#ff007c';
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#ff007c';
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(obs.x, obs.y + 3, obs.width, 4);
        }
      } else if (obs.type === 'spike') {
        ctx.fillStyle = '#ff007c';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff007c';
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height/2);
        ctx.lineTo(obs.x + obs.width, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (obs.type === 'block') {
        const grad = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.height);
        grad.addColorStop(0, '#ff007c');
        grad.addColorStop(1, '#aa0055');
        ctx.fillStyle = grad;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff007c';
        ctx.beginPath();
        ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 8);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
  }

  // ==========================================================================
  // 6. CRYSTAL SYSTEM
  // ==========================================================================
  let crystals = [];
  class Crystal {
    constructor(x, y) {
      this.x = x; this.y = y; this.radius = CRYSTAL_RADIUS;
      this.glowPhase = Math.random() * Math.PI * 2;
      this.collected = false;
    }
  }
  function spawnCrystal(width, height) {
    if (crystals.length >= 3) return;
    const x = 50 + Math.random() * (width - 100);
    const y = 50 + Math.random() * (height - 100);
    crystals.push(new Crystal(x, y));
  }
  function updateCrystals(dt) {
    for (let i = crystals.length - 1; i >= 0; i--) {
      let c = crystals[i];
      c.glowPhase += dt * 3;
      if (c.collected) crystals.splice(i, 1);
    }
  }
  function renderCrystals(ctx) {
    crystals.forEach(c => {
      const glow = Math.abs(Math.sin(c.glowPhase));
      const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.radius + 5 + glow * 5);
      grad.addColorStop(0, 'rgba(0, 243, 255, 1)');
      grad.addColorStop(0.5, 'rgba(0, 243, 255, 0.5)');
      grad.addColorStop(1, 'rgba(0, 243, 255, 0)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius + 5 + glow * 5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(c.x, c.y - c.radius);
      ctx.lineTo(c.x + c.radius, c.y);
      ctx.lineTo(c.x, c.y + c.radius);
      ctx.lineTo(c.x - c.radius, c.y);
      ctx.closePath();
      ctx.fill();
    });
  }

  // ==========================================================================
  // 7. SCORE MANAGER
  // ==========================================================================
  const ScoreManager = {
    score: 0,
    highScore: parseInt(localStorage.getItem('gravitylab-highscore')) || 0,
    timeSurvived: 0,
    scoreTimer: 0,
    isNewHighScore: false,
    
    update(dt) {
      this.scoreTimer += dt;
      this.timeSurvived += dt;
      if (this.scoreTimer >= 1.0) {
        this.score += 1;
        this.scoreTimer -= 1.0;
        this.checkHighScore();
      }
    },
    addPoints(amount, x, y) {
      this.score += amount;
      this.checkHighScore();
      UIManager.spawnScorePopup(x, y, `+${amount}`);
    },
    checkHighScore() {
      if (this.score > this.highScore) {
        this.highScore = this.score;
        this.isNewHighScore = true;
      }
    },
    saveHighScore() {
      if (this.isNewHighScore) {
        localStorage.setItem('gravitylab-highscore', this.highScore);
      }
    },
    reset() {
      this.score = 0;
      this.timeSurvived = 0;
      this.scoreTimer = 0;
      this.isNewHighScore = false;
    },
    getRandomFact() {
      return GRAVITY_FACTS[Math.floor(Math.random() * GRAVITY_FACTS.length)];
    }
  };

  // ==========================================================================
  // 8. UI MANAGER
  // ==========================================================================
  const UIManager = {
    screens: {
      menu: document.getElementById('screen-menu'),
      instructions: document.getElementById('screen-instructions'),
      countdown: document.getElementById('screen-countdown'),
      pause: document.getElementById('screen-pause'),
      gameover: document.getElementById('screen-gameover')
    },
    els: {
      headerScore: document.getElementById('header-score'),
      headerHighScore: document.getElementById('header-highscore'),
      hudScore: document.getElementById('hud-score'),
      hudHighScore: document.getElementById('hud-highscore'),
      gravityLabel: document.getElementById('gravity-label'),
      gravityArrow: document.getElementById('gravity-arrow'),
      hudFps: document.getElementById('hud-fps'),
      countdownNum: document.getElementById('countdown-number'),
      goScore: document.getElementById('gameover-score'),
      goHighScore: document.getElementById('gameover-highscore'),
      goTime: document.getElementById('gameover-time'),
      goFact: document.getElementById('gameover-fact-text'),
      goNewHs: document.getElementById('gameover-new-hs'),
      scorePopups: document.getElementById('score-popups')
    },
    hideAllScreens() {
      Object.values(this.screens).forEach(el => el.classList.add('hidden'));
    },
    showScreen(id) {
      this.hideAllScreens();
      if (this.screens[id]) this.screens[id].classList.remove('hidden');
    },
    updateScore(score) {
      this.els.headerScore.textContent = score;
      this.els.hudScore.textContent = score;
    },
    updateHighScore(hs) {
      this.els.headerHighScore.textContent = hs;
      this.els.hudHighScore.textContent = hs;
    },
    updateGravityIndicator(g) {
      this.els.gravityLabel.textContent = `${Math.abs(g).toFixed(1)} m/s²`;
      this.els.gravityArrow.style.transform = g > 0 ? 'rotate(0deg)' : 'rotate(180deg)';
      this.els.gravityArrow.style.color = g > 0 ? 'var(--neon-cyan)' : 'var(--neon-pink)';
    },
    updateFPS(fps) {
      this.els.hudFps.textContent = fps;
    },
    showGameOver(score, hs, time, isNew) {
      this.els.goScore.textContent = score;
      this.els.goHighScore.textContent = hs;
      this.els.goTime.textContent = `${Math.floor(time)}s`;
      this.els.goFact.textContent = ScoreManager.getRandomFact();
      if (isNew) this.els.goNewHs.classList.remove('hidden');
      else this.els.goNewHs.classList.add('hidden');
      this.showScreen('gameover');
    },
    showCountdown(num) {
      this.els.countdownNum.textContent = num;
      this.els.countdownNum.style.animation = 'none';
      void this.els.countdownNum.offsetWidth;
      this.els.countdownNum.style.animation = 'pulse 1s infinite';
    },
    spawnScorePopup(x, y, text) {
      const el = document.createElement('div');
      el.className = 'score-popup font-mono text-cyan';
      el.textContent = text;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      this.els.scorePopups.appendChild(el);
      setTimeout(() => el.remove(), 1000);
    },
    triggerScreenShake() {
      document.body.classList.add('shake');
      setTimeout(() => document.body.classList.remove('shake'), 300);
    }
  };

  // ==========================================================================
  // 9. BACKGROUND RENDERER
  // ==========================================================================
  let stars = [];
  const STAR_COUNT = IS_TOUCH_DEVICE ? MOBILE_STAR_COUNT : 100;
  for(let i=0; i<STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2,
      speed: 10 + Math.random() * 30
    });
  }
  function drawBackground(ctx, width, height, player, dt) {
    stars.forEach(star => {
      star.x -= star.speed * dt;
      if (star.x < 0) {
        star.x = width;
        star.y = Math.random() * height;
      }
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    const gridSpacing = 40;
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
    ctx.lineWidth = 1;
    
    for (let y = 0; y < height; y += gridSpacing) {
      ctx.beginPath();
      for (let x = 0; x < width; x += 10) {
        let displayX = x;
        let displayY = y;
        
        if (player) {
          const dx = player.x - x;
          const dy = player.y - y;
          const dist2 = dx * dx + dy * dy;
          const warpRadius = player.radius * 3.5;
          if (dist2 < warpRadius * warpRadius) {
            const dist = Math.sqrt(dist2);
            const force = (warpRadius - dist) / warpRadius;
            const displacement = force * (player.radius * 0.28);
            displayX += (dx / (dist || 1)) * displacement;
            displayY += (dy / (dist || 1)) * displacement;
          }
        }
        
        if (x === 0) ctx.moveTo(displayX, displayY);
        else ctx.lineTo(displayX, displayY);
      }
      ctx.stroke();
    }
    
    for (let x = 0; x < width; x += gridSpacing) {
      ctx.beginPath();
      for (let y = 0; y < height; y += 10) {
        let displayX = x;
        let displayY = y;
        
        if (player) {
          const dx = player.x - x;
          const dy = player.y - y;
          const dist2 = dx * dx + dy * dy;
          const warpRadius = player.radius * 3.5;
          if (dist2 < warpRadius * warpRadius) {
            const dist = Math.sqrt(dist2);
            const force = (warpRadius - dist) / warpRadius;
            const displacement = force * (player.radius * 0.28);
            displayX += (dx / (dist || 1)) * displacement;
            displayY += (dy / (dist || 1)) * displacement;
          }
        }
        
        if (y === 0) ctx.moveTo(displayX, displayY);
        else ctx.lineTo(displayX, displayY);
      }
      ctx.stroke();
    }
  }

  // ==========================================================================
  // 10. GAME MANAGER (State Machine)
  // ==========================================================================
  const GameManager = {
    state: 'MENU',
    player: null,
    difficultyTimer: 0,
    obstacleSpawnTimer: 0,
    crystalSpawnTimer: 0,
    gravity: DEFAULT_GRAVITY,
    canvas: document.getElementById('game-canvas'),
    ctx: null,
    
    init() {
      this.ctx = this.canvas.getContext('2d');
      window.addEventListener('resize', resizeCanvas);
      resizeCanvas();
      UIManager.updateHighScore(ScoreManager.highScore);
      this.returnToMenu();
    },
    startGame() {
      this.state = 'COUNTDOWN';
      UIManager.showScreen('countdown');
      ScoreManager.reset();
      this.player = new Player(this.canvas.width/4, this.canvas.height/2, PLAYER_RADIUS, PLAYER_COLOR, PLAYER_RESTITUTION);
      this.gravity = DEFAULT_GRAVITY;
      UIManager.updateGravityIndicator(this.gravity);
      obstacles = [];
      crystals = [];
      particles = [];
      this.difficultyTimer = 0;
      this.obstacleSpawnTimer = 0;
      this.crystalSpawnTimer = 0;
      
      let count = 3;
      UIManager.showCountdown(count);
      AudioManager.playCountdown();
      
      const countInt = setInterval(() => {
        count--;
        if (count > 0) {
          UIManager.showCountdown(count);
          AudioManager.playCountdown();
        } else {
          clearInterval(countInt);
          this.state = 'PLAYING';
          UIManager.hideAllScreens();
          if (IS_TOUCH_DEVICE) {
            mobileReverseBtn.style.display = 'flex';
            mobilePauseBtn.style.display = 'flex';
          }
          AudioManager.playGameStart();
        }
      }, 1000);
    },
    pauseGame() {
      if (this.state === 'PLAYING') {
        this.state = 'PAUSED';
        UIManager.showScreen('pause');
      }
    },
    resumeGame() {
      if (this.state === 'PAUSED') {
        this.state = 'PLAYING';
        UIManager.hideAllScreens();
      }
    },
    gameOver() {
      this.state = 'GAME_OVER';
      this.player.isAlive = false;
      spawnParticles(this.player.x, this.player.y, 40, '#ff007c', 200);
      AudioManager.playCollision();
      if (IS_TOUCH_DEVICE) {
        mobileReverseBtn.style.display = 'none';
        mobilePauseBtn.style.display = 'none';
      }
      UIManager.triggerScreenShake();
      ScoreManager.saveHighScore();
      setTimeout(() => {
        UIManager.showGameOver(ScoreManager.score, ScoreManager.highScore, ScoreManager.timeSurvived, ScoreManager.isNewHighScore);
      }, 1000);
    },
    returnToMenu() {
      this.state = 'MENU';
      UIManager.showScreen('menu');
      if (IS_TOUCH_DEVICE) {
        mobileReverseBtn.style.display = 'none';
        mobilePauseBtn.style.display = 'none';
      }
      UIManager.updateScore(0);
      UIManager.updateHighScore(ScoreManager.highScore);
    },
    getDifficultyMultiplier() {
      return 1 + (this.difficultyTimer / DIFFICULTY_INTERVAL) * 0.5;
    },
    getSpawnInterval() {
      return BASE_SPAWN_INTERVAL / this.getDifficultyMultiplier();
    },
    reverseGravity() {
      this.gravity = -this.gravity;
      UIManager.updateGravityIndicator(this.gravity);
      AudioManager.playReverse();
      if (this.player) {
        spawnParticles(this.player.x, this.player.y, 20, '#00f3ff', 50);
      }
    },
    update(dt) {
      this.difficultyTimer += dt;
      this.obstacleSpawnTimer += dt * 1000;
      this.crystalSpawnTimer += dt * 1000;
      
      let inputDir = 0;
      if (keys['ArrowLeft'] || keys['KeyA'] || keys['TouchLeft']) inputDir -= 1;
      if (keys['ArrowRight'] || keys['KeyD'] || keys['TouchRight']) inputDir += 1;
      
      if ((keys['ArrowUp'] || keys['KeyW'] || keys['TouchJump']) && this.player.isGrounded) {
        this.player.vy = (this.gravity > 0) ? PLAYER_JUMP_FORCE : -PLAYER_JUMP_FORCE;
        this.player.isGrounded = false;
      }
      
      this.player.update(dt, this.canvas.clientWidth, this.canvas.clientHeight, this.gravity, inputDir);
      
      if (this.obstacleSpawnTimer >= this.getSpawnInterval()) {
        this.obstacleSpawnTimer = 0;
        spawnObstacle(this.canvas.clientWidth, this.canvas.clientHeight, this.getDifficultyMultiplier());
      }
      if (this.crystalSpawnTimer >= 3000) {
        this.crystalSpawnTimer = 0;
        spawnCrystal(this.canvas.clientWidth, this.canvas.clientHeight);
      }
      
      updateObstacles(dt);
      updateCrystals(dt);
      updateParticles(dt);
      ScoreManager.update(dt);
      UIManager.updateScore(ScoreManager.score);
      
      // Collisions
      obstacles.forEach(obs => {
        if (!obs.active) return;
        if (obs.type === 'laser') {
          if (this.player.y + this.player.radius > obs.y && this.player.y - this.player.radius < obs.y + obs.height) {
            this.gameOver();
          }
        } else {
          let px = Math.max(obs.x, Math.min(this.player.x, obs.x + obs.width));
          let py = Math.max(obs.y, Math.min(this.player.y, obs.y + obs.height));
          let dist = Math.sqrt((this.player.x - px)**2 + (this.player.y - py)**2);
          if (dist < this.player.radius) {
            if (obs.type === 'spike') {
              // crude triangle check, treat as rect for simplicity for now
              this.gameOver();
            } else {
              this.gameOver();
            }
          }
        }
      });
      
      crystals.forEach(c => {
        if (!c.collected) {
          let dist = Math.sqrt((this.player.x - c.x)**2 + (this.player.y - c.y)**2);
          if (dist < this.player.radius + c.radius) {
            c.collected = true;
            ScoreManager.addPoints(CRYSTAL_SCORE, c.x, c.y);
            AudioManager.playCrystal();
            spawnParticles(c.x, c.y, 15, '#00f3ff', 80);
          }
        }
      });
    },
    render(ctx, w, h, dt) {
      drawBackground(ctx, w, h, this.player, dt);
      if (this.state === 'PLAYING' || this.state === 'PAUSED' || this.state === 'GAME_OVER') {
        renderCrystals(ctx);
        renderObstacles(ctx);
        if (this.player) this.player.draw(ctx);
        renderParticles(ctx);
      }
    }
  };

  // ==========================================================================
  // 11. INPUT HANDLER
  // ==========================================================================
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space' && GameManager.state === 'PLAYING') {
      GameManager.reverseGravity();
      e.preventDefault();
    }
    if (e.code === 'Escape') {
      if (GameManager.state === 'PLAYING') GameManager.pauseGame();
      else if (GameManager.state === 'PAUSED') GameManager.resumeGame();
    }
    if (e.code === 'Enter' && GameManager.state === 'MENU') {
      AudioManager.init();
      GameManager.startGame();
    }
  });
  window.addEventListener('keyup', e => {
    keys[e.code] = false;
  });

  // ==========================================================================
  // 12. MAIN LOOP
  // ==========================================================================
  let lastTime = 0;
  let fps = 60;
  let frameCount = 0;
  let fpsLastTime = 0;
  
  function loop(currentTime) {
    let dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    if (dt > 0.1) dt = 0.1;
    
    frameCount++;
    if (currentTime - fpsLastTime >= 1000) {
      fps = Math.round((frameCount * 1000) / (currentTime - fpsLastTime));
      UIManager.updateFPS(fps);
      frameCount = 0;
      fpsLastTime = currentTime;
    }
    
    GameManager.ctx.clearRect(0, 0, GameManager.canvas.width, GameManager.canvas.height);
    GameManager.render(GameManager.ctx, GameManager.canvas.width, GameManager.canvas.height, dt);
    
    if (GameManager.state === 'PLAYING') {
      GameManager.update(dt);
    }
    
    requestAnimationFrame(loop);
  }

  // ==========================================================================
  // 13. BUTTON EVENT LISTENERS
  // ==========================================================================
  document.getElementById('btn-play').addEventListener('click', () => {
    AudioManager.init();
    AudioManager.playClick();
    GameManager.startGame();
  });
  document.getElementById('btn-menu-instructions').addEventListener('click', () => {
    AudioManager.init();
    AudioManager.playClick();
    UIManager.showScreen('instructions');
  });
  document.getElementById('btn-close-instructions').addEventListener('click', () => {
    AudioManager.playClick();
    GameManager.returnToMenu();
  });
  document.getElementById('btn-instructions-back').addEventListener('click', () => {
    AudioManager.playClick();
    GameManager.returnToMenu();
  });
  document.getElementById('btn-resume').addEventListener('click', () => {
    AudioManager.playClick();
    GameManager.resumeGame();
  });
  document.getElementById('btn-pause-menu').addEventListener('click', () => {
    AudioManager.playClick();
    GameManager.returnToMenu();
  });
  document.getElementById('btn-play-again').addEventListener('click', () => {
    AudioManager.playClick();
    GameManager.startGame();
  });
  document.getElementById('btn-gameover-menu').addEventListener('click', () => {
    AudioManager.playClick();
    GameManager.returnToMenu();
  });

  // ==========================================================================
  // MOBILE CONTROLS & TOUCH HANDLING
  // ==========================================================================
  const mobileReverseBtn = document.getElementById('btn-reverse-gravity');
  const mobilePauseBtn = document.getElementById('btn-mobile-pause');
  const orientationHint = document.getElementById('orientation-hint');
  const orientationDismiss = document.getElementById('orientation-dismiss');

  // Show mobile buttons on touch devices
  if (IS_TOUCH_DEVICE) {
    mobileReverseBtn.style.display = 'flex';
    mobileReverseBtn.style.alignItems = 'center';
    mobileReverseBtn.style.justifyContent = 'center';
    mobilePauseBtn.style.display = 'flex';
    mobilePauseBtn.style.alignItems = 'center';
    mobilePauseBtn.style.justifyContent = 'center';
  }

  // Reverse gravity button — touch with no delay
  if (mobileReverseBtn) {
    mobileReverseBtn.addEventListener('touchstart', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (GameManager.state === 'PLAYING') {
        AudioManager.init();
        GameManager.reverseGravity();
      }
    }, { passive: false });

    mobileReverseBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (GameManager.state === 'PLAYING') {
        AudioManager.init();
        GameManager.reverseGravity();
      }
    });
  }

  // Mobile pause button
  if (mobilePauseBtn) {
    mobilePauseBtn.addEventListener('touchstart', function(e) {
      e.preventDefault();
      e.stopPropagation();
      AudioManager.init();
      AudioManager.playClick();
      if (GameManager.state === 'PLAYING') {
        GameManager.pauseGame();
      } else if (GameManager.state === 'PAUSED') {
        GameManager.resumeGame();
      }
    }, { passive: false });

    mobilePauseBtn.addEventListener('click', function(e) {
      e.preventDefault();
      AudioManager.init();
      AudioManager.playClick();
      if (GameManager.state === 'PLAYING') {
        GameManager.pauseGame();
      } else if (GameManager.state === 'PAUSED') {
        GameManager.resumeGame();
      }
    });
  }

  // ==========================================================================
  // TOUCH MOVEMENT (left/right/jump by tapping screen regions)
  // ==========================================================================
  let activeTouches = {};

  function getTouchAction(touch) {
    const x = touch.clientX;
    const y = touch.clientY;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const thirdW = w / 3;

    // Ignore touches on the reverse gravity button area (bottom-right corner)
    if (x > w - 100 && y > h - 100) return null;
    // Ignore touches on the mobile pause button area (top-right)
    if (x > w - 70 && y < 120) return null;

    if (x < thirdW) return 'left';
    if (x > thirdW * 2) return 'right';
    return 'jump';
  }

  function updateTouchKeys() {
    // Reset touch-based keys
    keys['TouchLeft'] = false;
    keys['TouchRight'] = false;
    keys['TouchJump'] = false;

    for (const id in activeTouches) {
      const action = activeTouches[id];
      if (action === 'left') keys['TouchLeft'] = true;
      if (action === 'right') keys['TouchRight'] = true;
      if (action === 'jump') keys['TouchJump'] = true;
    }
  }

  if (IS_TOUCH_DEVICE) {
    const gameViewport = document.querySelector('.game-viewport');

    gameViewport.addEventListener('touchstart', function(e) {
      if (GameManager.state !== 'PLAYING') return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const action = getTouchAction(touch);
        if (action) {
          activeTouches[touch.identifier] = action;
        }
      }
      updateTouchKeys();
    }, { passive: true });

    gameViewport.addEventListener('touchend', function(e) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        delete activeTouches[e.changedTouches[i].identifier];
      }
      updateTouchKeys();
    }, { passive: true });

    gameViewport.addEventListener('touchcancel', function(e) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        delete activeTouches[e.changedTouches[i].identifier];
      }
      updateTouchKeys();
    }, { passive: true });
  }

  // ==========================================================================
  // ORIENTATION HINT
  // ==========================================================================
  let orientationDismissed = false;

  function checkOrientation() {
    if (!IS_TOUCH_DEVICE || orientationDismissed) return;
    const isPortrait = window.innerHeight > window.innerWidth && window.innerWidth <= 768;
    if (isPortrait) {
      orientationHint.classList.add('visible');
    } else {
      orientationHint.classList.remove('visible');
    }
  }

  if (orientationDismiss) {
    orientationDismiss.addEventListener('click', function() {
      orientationDismissed = true;
      orientationHint.classList.add('dismissed');
      orientationHint.classList.remove('visible');
    });
    orientationDismiss.addEventListener('touchstart', function(e) {
      e.preventDefault();
      orientationDismissed = true;
      orientationHint.classList.add('dismissed');
      orientationHint.classList.remove('visible');
    }, { passive: false });
  }

  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', function() {
    setTimeout(checkOrientation, 100);
  });
  checkOrientation();

  // ==========================================================================
  // SCROLL & ZOOM PREVENTION
  // ==========================================================================
  document.addEventListener('touchmove', function(e) {
    if (GameManager.state === 'PLAYING') {
      e.preventDefault();
    }
  }, { passive: false });

  document.addEventListener('contextmenu', function(e) {
    if (GameManager.state === 'PLAYING') {
      e.preventDefault();
    }
  });

  // Prevent double-tap zoom
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function(e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });

  // ==========================================================================
  // 14. CANVAS RESIZE
  // ==========================================================================
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const w = GameManager.canvas.parentElement.clientWidth;
    const h = GameManager.canvas.parentElement.clientHeight;
    GameManager.canvas.width = w * dpr;
    GameManager.canvas.height = h * dpr;
    GameManager.ctx.scale(dpr, dpr);
    // Needed to map logical pixels in our game logic to the context
    GameManager.canvas.style.width = w + 'px';
    GameManager.canvas.style.height = h + 'px';
    // Update internal resolution for logic bounds
    Object.defineProperty(GameManager.canvas, 'clientWidth', { value: w, configurable: true });
    Object.defineProperty(GameManager.canvas, 'clientHeight', { value: h, configurable: true });

    // Reposition stars that are outside new bounds
    stars.forEach(star => {
      if (star.x > w) star.x = Math.random() * w;
      if (star.y > h) star.y = Math.random() * h;
    });
  }

  // ==========================================================================
  // 15. INITIALIZATION
  // ==========================================================================
  GameManager.init();
  lastTime = performance.now();
  fpsLastTime = lastTime;
  requestAnimationFrame(loop);
})();
