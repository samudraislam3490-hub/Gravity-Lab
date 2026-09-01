(function() {
  // ==========================================================================
  // 1. CONSTANTS & CONFIG
  // ==========================================================================
  const PX_PER_METER = 60;
  const DEFAULT_GRAVITY = 9.81;
  const PLAYER_RADIUS = 18;
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
  const MOBILE_MAX_PARTICLES = 30;
  const MOBILE_TRAIL_LENGTH = 10;

  const GRAVITY_MODES = [
    { name: 'Earth Gravity', value: 9.81, color: '#3b82f6' },
    { name: 'Moon Gravity', value: 1.62, color: '#9ca3af' },
    { name: 'Mars Gravity', value: 3.72, color: '#ef4444' },
    { name: 'Zero Gravity', value: 0.001, color: '#06b6d4' },
    { name: 'Reverse Gravity', value: -9.81, color: '#ec4899' }
  ];
  const GRAVITY_SHIFT_MIN = 20; // seconds
  const GRAVITY_SHIFT_MAX = 30;
  const GRAVITY_WARNING_TIME = 3; // seconds before shift

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

  const SPACE_FACTS = [
    "A teaspoon of neutron star weighs about 6 billion tons.",
    "There are more stars in the universe than grains of sand on Earth.",
    "Light from the Sun takes about 8 minutes to reach Earth.",
    "The International Space Station orbits Earth every 90 minutes.",
    "Venus rotates so slowly that a day on Venus is longer than its year.",
    "Saturn could float in water because it is mostly made of gas.",
    "The footprints on the Moon will be there for 100 million years.",
    "Space is completely silent because there is no air to carry sound."
  ];

  const SHAHRIAR_FACTS = [
    "Random Fact: Shahriar ekjon bhalo chele, ar or kono girlfriend nai :')",
    "Shahriar er most favourite dessert dish Custard",
    "Shahriar er best friends holo AJFS",
    "Shahriar ei game ta hudai banaise"
  ];

  const THEMES = {
    'deep-space': {
      bg: '#07090e', stars: '#ffffff', nebula1: 'rgba(0, 100, 255, 0.06)', nebula2: 'rgba(150, 0, 255, 0.05)', nebula3: 'rgba(0, 200, 200, 0.04)',
      grid: 'rgba(0, 243, 255, 0.05)', planet1: '#3b82f6', planet2: '#9333ea', shootingStar: '#00f3ff'
    },
    'bright-sky': {
      bg: '#0a1628', stars: '#e0e8ff', nebula1: 'rgba(100, 180, 255, 0.08)', nebula2: 'rgba(200, 220, 255, 0.06)', nebula3: 'rgba(150, 200, 255, 0.05)',
      grid: 'rgba(100, 180, 255, 0.05)', planet1: '#60a5fa', planet2: '#93c5fd', shootingStar: '#bfdbfe'
    },
    'sunset': {
      bg: '#1a0a0a', stars: '#ffd4a8', nebula1: 'rgba(255, 100, 50, 0.08)', nebula2: 'rgba(200, 50, 100, 0.06)', nebula3: 'rgba(255, 150, 50, 0.05)',
      grid: 'rgba(255, 100, 50, 0.04)', planet1: '#f97316', planet2: '#dc2626', shootingStar: '#fbbf24'
    },
    'galaxy': {
      bg: '#0a0520', stars: '#e8d5ff', nebula1: 'rgba(100, 0, 200, 0.08)', nebula2: 'rgba(50, 0, 150, 0.06)', nebula3: 'rgba(150, 50, 255, 0.05)',
      grid: 'rgba(150, 50, 255, 0.04)', planet1: '#8b5cf6', planet2: '#6d28d9', shootingStar: '#c084fc'
    },
    'nebula': {
      bg: '#0a0a1a', stars: '#d4f0ff', nebula1: 'rgba(80, 0, 150, 0.1)', nebula2: 'rgba(0, 150, 150, 0.07)', nebula3: 'rgba(200, 50, 150, 0.06)',
      grid: 'rgba(0, 200, 200, 0.04)', planet1: '#0891b2', planet2: '#a21caf', shootingStar: '#5eead4'
    },
    'dark-laboratory': {
      bg: '#050a05', stars: '#a8d4a8', nebula1: 'rgba(0, 100, 0, 0.06)', nebula2: 'rgba(0, 60, 30, 0.04)', nebula3: 'rgba(50, 150, 50, 0.03)',
      grid: 'rgba(0, 200, 0, 0.04)', planet1: '#22c55e', planet2: '#166534', shootingStar: '#4ade80'
    }
  };

  const IS_TOUCH_DEVICE = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

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
  // 2. SETTINGS MANAGER
  // ==========================================================================
  const SettingsManager = {
    defaults: {
      deviceMode: null,  // 'pc' or 'android', null means not selected
      musicVolume: 25,
      sfxVolume: 50,
      ballColor: '#00f3ff',
      theme: 'deep-space',
      highScores: []  // array of {score, date} objects, max 10
    },
    settings: {},
    init() {
      const saved = localStorage.getItem('gravitylab-settings');
      this.settings = saved ? { ...this.defaults, ...JSON.parse(saved) } : { ...this.defaults };
      // Also load legacy high score
      const legacyHS = parseInt(localStorage.getItem('gravitylab-highscore')) || 0;
      if (legacyHS > 0 && this.settings.highScores.length === 0) {
        this.settings.highScores.push({ score: legacyHS, date: 'Legacy' });
      }
    },
    save() { localStorage.setItem('gravitylab-settings', JSON.stringify(this.settings)); },
    get(key) { return this.settings[key]; },
    set(key, value) { this.settings[key] = value; this.save(); },
    getHighScore() { return this.settings.highScores.length > 0 ? this.settings.highScores[0].score : 0; },
    addHighScore(score) {
      const date = new Date().toLocaleDateString();
      this.settings.highScores.push({ score, date });
      this.settings.highScores.sort((a, b) => b.score - a.score);
      this.settings.highScores = this.settings.highScores.slice(0, 10);
      this.save();
    }
  };

  // ==========================================================================
  // 3. MUSIC MANAGER (Procedural BGM)
  // ==========================================================================
  const MusicManager = {
    ctx: null,
    gainNode: null,
    filterNode: null,
    oscillators: [],
    lfo: null,
    isPlaying: false,
    
    init() {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.gainNode = this.ctx.createGain();
        this.filterNode = this.ctx.createBiquadFilter();
        
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.value = 300;
        this.filterNode.Q.value = 1;
        
        this.gainNode.gain.value = 0;
        this.filterNode.connect(this.gainNode);
        this.gainNode.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    
    setVolume(vol) {
      if (!this.gainNode) return;
      // map 0-100 to 0-0.15
      const mappedVol = (vol / 100) * 0.15;
      this.gainNode.gain.setTargetAtTime(mappedVol, this.ctx.currentTime, 0.1);
    },
    
    startMusic(isMenu = false) {
      this.init();
      if (this.isPlaying) this.stopMusic(true);
      this.isPlaying = true;
      
      const freqs = [65.41, 65.41 * 1.5, 65.41 * 2]; // C2, G2, C3 roughly
      freqs.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq + (i * 0.5); // slight detune
        osc.connect(this.filterNode);
        osc.start();
        this.oscillators.push(osc);
      });
      
      this.lfo = this.ctx.createOscillator();
      this.lfo.type = 'sine';
      this.lfo.frequency.value = 0.1; // 10 seconds per cycle
      
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 100;
      this.lfo.connect(lfoGain);
      lfoGain.connect(this.filterNode.frequency);
      this.lfo.start();
      
      const targetVol = isMenu ? (SettingsManager.get('musicVolume') / 100) * 0.05 : (SettingsManager.get('musicVolume') / 100) * 0.15;
      this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + 2);
    },
    
    startMenuMusic() {
      this.startMusic(true);
    },
    
    startGameMusic() {
      this.startMusic(false);
    },
    
    stopMusic(immediate = false) {
      if (!this.isPlaying) return;
      this.isPlaying = false;
      
      if (!this.gainNode) return;
      
      this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
      if (immediate) {
        this.gainNode.gain.value = 0;
        this.cleanupOscillators();
      } else {
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.ctx.currentTime);
        this.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
        setTimeout(() => this.cleanupOscillators(), 1000);
      }
    },
    
    cleanupOscillators() {
      this.oscillators.forEach(osc => {
        try { osc.stop(); osc.disconnect(); } catch(e) {}
      });
      this.oscillators = [];
      if (this.lfo) {
        try { this.lfo.stop(); this.lfo.disconnect(); } catch(e) {}
        this.lfo = null;
      }
    }
  };

  // ==========================================================================
  // 4. AUDIO MANAGER (Enhanced)
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
      MusicManager.init();
    },
    getSfxVol() {
      return SettingsManager.get('sfxVolume') / 100;
    },
    playOscillator(type, freqStart, freqEnd, duration, volume = 0.1) {
      if (!this.ctx) return;
      const sfxVol = this.getSfxVol();
      if (sfxVol === 0) return;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, this.ctx.currentTime);
      if (freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + duration);
      }
      gain.gain.setValueAtTime(volume * sfxVol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    },
    playClick() { this.playOscillator('square', 800, null, 0.08, 0.05); },
    playCrystal() { this.playOscillator('sine', 400, 800, 0.15, 0.1); },
    playCollision() { this.playOscillator('sawtooth', 100, 50, 0.3, 0.2); },
    playReverse() { 
      if (!this.ctx) return;
      const sfxVol = this.getSfxVol();
      if (sfxVol === 0) return;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15 * sfxVol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    },
    playCountdown() { this.playOscillator('square', 600, null, 0.1, 0.1); },
    playGameStart() {
      if (!this.ctx) return;
      const sfxVol = this.getSfxVol();
      if (sfxVol === 0) return;
      const playFreq = (f, t) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.1 * sfxVol, this.ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + t + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + t);
        osc.stop(this.ctx.currentTime + t + 0.3);
      };
      playFreq(400, 0);
      playFreq(500, 0.1);
      playFreq(600, 0.2);
    },
    playGameOver() {
      if (!this.ctx) return;
      const sfxVol = this.getSfxVol();
      if (sfxVol === 0) return;
      
      const t0 = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      
      osc.frequency.setValueAtTime(400, t0);
      osc.frequency.linearRampToValueAtTime(350, t0 + 0.3);
      osc.frequency.linearRampToValueAtTime(350, t0 + 0.31);
      osc.frequency.linearRampToValueAtTime(300, t0 + 0.6);
      osc.frequency.linearRampToValueAtTime(300, t0 + 0.61);
      osc.frequency.linearRampToValueAtTime(250, t0 + 0.9);
      osc.frequency.linearRampToValueAtTime(250, t0 + 0.91);
      osc.frequency.linearRampToValueAtTime(150, t0 + 1.2);
      
      gain.gain.setValueAtTime(0.15 * sfxVol, t0);
      gain.gain.linearRampToValueAtTime(0, t0 + 1.2);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(t0 + 1.2);
    },
    playHighScore() {
      if (!this.ctx) return;
      const sfxVol = this.getSfxVol();
      if (sfxVol === 0) return;
      
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const t0 = this.ctx.currentTime;
      
      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        
        gain.gain.setValueAtTime(0, t0 + i*0.1);
        gain.gain.linearRampToValueAtTime(0.15 * sfxVol, t0 + i*0.1 + 0.05);
        gain.gain.linearRampToValueAtTime(0, t0 + i*0.1 + 0.2);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t0 + i*0.1);
        osc.stop(t0 + i*0.1 + 0.2);
      });
    },
    playLaserWarning() {
      this.playOscillator('square', 900, null, 0.05, 0.05);
    }
  };

  // ==========================================================================
  // 5. PARTICLE SYSTEM
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
      if (particles.length >= (DeviceManager.isAndroid() ? MOBILE_MAX_PARTICLES : MAX_PARTICLES)) particles.shift();
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
  // 6. PLAYER CLASS
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
        if (this.trail.length > (DeviceManager.isAndroid() ? MOBILE_TRAIL_LENGTH : TRAIL_MAX_LENGTH)) {
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
  // 7. OBSTACLE SYSTEM
  // ==========================================================================
  let obstacles = [];
  class Obstacle {
    constructor(x, y, width, height, speed, type) {
      this.x = x; this.y = y; this.width = width; this.height = height;
      this.speed = speed; this.type = type;
      this.warningTimer = type === 'laser' ? 1.2 : 0;
      this.active = type !== 'laser';
      this.warningPlayed = false;
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
          if (!obs.warningPlayed) {
            AudioManager.playLaserWarning();
            obs.warningPlayed = true;
          }
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
    const width = GameManager.canvas.width;
    obstacles.forEach(obs => {
      if (obs.type === 'laser') {
        if (obs.warningTimer > 0) {
          if (Math.floor(obs.warningTimer * 6) % 2 === 0) {
            ctx.strokeStyle = '#ff007c';
            ctx.setLineDash([10, 10]);
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ff007c';
            ctx.beginPath();
            ctx.moveTo(0, obs.y + obs.height/2);
            ctx.lineTo(width, obs.y + obs.height/2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.shadowBlur = 0;
            
            // Draw small arrows at edges
            ctx.fillStyle = '#ff007c';
            ctx.beginPath();
            ctx.moveTo(0, obs.y);
            ctx.lineTo(10, obs.y + obs.height/2);
            ctx.lineTo(0, obs.y + obs.height);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(width, obs.y);
            ctx.lineTo(width - 10, obs.y + obs.height/2);
            ctx.lineTo(width, obs.y + obs.height);
            ctx.fill();
          }
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
  // 8. CRYSTAL SYSTEM
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
  // 9. SCORE MANAGER
  // ==========================================================================
  const ScoreManager = {
    score: 0,
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
      if (this.score > SettingsManager.getHighScore()) {
        this.isNewHighScore = true;
      }
    },
    saveHighScore() {
      if (this.isNewHighScore) {
        SettingsManager.addHighScore(this.score);
      }
    },
    reset() {
      this.score = 0;
      this.timeSurvived = 0;
      this.scoreTimer = 0;
      this.isNewHighScore = false;
    },
    getRandomFact() {
      const allFacts = [...GRAVITY_FACTS, ...SPACE_FACTS];
      return allFacts[Math.floor(Math.random() * allFacts.length)];
    }
  };

  // ==========================================================================
  // 10. SPACE RENDERER
  // ==========================================================================
  const SpaceRenderer = {
    stars: [],
    nebulae: [],
    planets: [],
    shootingStars: [],
    dustParticles: [],
    theme: THEMES['deep-space'],

    init(width, height) {
      this.stars = [];
      this.nebulae = [];
      this.planets = [];
      this.shootingStars = [];
      this.dustParticles = [];
      
      const starCount = DeviceManager.isAndroid() ? 120 : 200;
      for (let i = 0; i < starCount; i++) {
        this.stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 0.5 + Math.random() * 2,
          speed: 5 + Math.random() * 20,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 1 + Math.random() * 3,
          layer: Math.floor(Math.random() * 3)
        });
      }
      
      for (let i = 0; i < 4; i++) {
        this.nebulae.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 100 + Math.random() * 150,
          colorIndex: Math.floor(Math.random() * 3) + 1,
          driftVx: (Math.random() - 0.5) * 5,
          driftVy: (Math.random() - 0.5) * 5
        });
      }
      
      this.planets.push({
        x: width * 0.1, y: height * 0.2, radius: 25, colorKey: 'planet1', orbitSpeed: 0.05, angle: 0
      });
      this.planets.push({
        x: width * 0.85, y: height * 0.7, radius: 40, colorKey: 'planet2', orbitSpeed: 0.03, angle: Math.PI
      });
      
      for (let i = 0; i < 15; i++) {
        this.dustParticles.push({
          x: Math.random() * width, y: Math.random() * height,
          vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
          size: 1 + Math.random() * 1.5, alpha: Math.random() * 0.5
        });
      }
    },

    setTheme(themeName) {
      this.theme = THEMES[themeName] || THEMES['deep-space'];
    },

    update(dt, width, height) {
      this.stars.forEach(star => {
        star.x -= star.speed * (star.layer * 0.5 + 0.5) * dt;
        if (star.x < 0) {
          star.x = width;
          star.y = Math.random() * height;
        }
        star.twinklePhase += star.twinkleSpeed * dt;
      });
      
      this.nebulae.forEach(nebula => {
        nebula.x += nebula.driftVx * dt;
        nebula.y += nebula.driftVy * dt;
        if (nebula.x < -nebula.radius) nebula.x = width + nebula.radius;
        if (nebula.x > width + nebula.radius) nebula.x = -nebula.radius;
        if (nebula.y < -nebula.radius) nebula.y = height + nebula.radius;
        if (nebula.y > height + nebula.radius) nebula.y = -nebula.radius;
      });
      
      this.planets.forEach(planet => {
        planet.angle += planet.orbitSpeed * dt;
      });
      
      for (let i = this.shootingStars.length - 1; i >= 0; i--) {
        let ss = this.shootingStars[i];
        ss.x += ss.vx * dt;
        ss.y += ss.vy * dt;
        ss.life -= dt;
        if (ss.life <= 0) this.shootingStars.splice(i, 1);
      }
      
      if (Math.random() < dt * 0.2) {
        this.shootingStars.push({
          x: Math.random() * width * 1.5,
          y: -50,
          vx: -200 - Math.random() * 300,
          vy: 200 + Math.random() * 300,
          life: 1.5,
          maxLife: 1.5,
          length: 50 + Math.random() * 100
        });
      }
      
      this.dustParticles.forEach(dust => {
        dust.x += dust.vx * dt;
        dust.y += dust.vy * dt;
        if (dust.x < 0) dust.x = width;
        if (dust.x > width) dust.x = 0;
        if (dust.y < 0) dust.y = height;
        if (dust.y > height) dust.y = 0;
      });
    },

    render(ctx, width, height) {
      ctx.fillStyle = this.theme.bg;
      ctx.fillRect(0, 0, width, height);
      
      this.nebulae.forEach(nebula => {
        const grad = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.radius);
        grad.addColorStop(0, this.theme[`nebula${nebula.colorIndex}`]);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      
      this.stars.forEach(star => {
        ctx.fillStyle = this.theme.stars;
        ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(star.twinklePhase));
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });
      ctx.globalAlpha = 1.0;
      
      this.planets.forEach(planet => {
        const dx = Math.cos(planet.angle) * 10;
        const dy = Math.sin(planet.angle) * 10;
        
        const grad = ctx.createRadialGradient(planet.x + dx - planet.radius*0.3, planet.y + dy - planet.radius*0.3, planet.radius*0.1, planet.x + dx, planet.y + dy, planet.radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.2, this.theme[planet.colorKey]);
        grad.addColorStop(1, darkenColor(this.theme[planet.colorKey], 60));
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(planet.x + dx, planet.y + dy, planet.radius, 0, Math.PI*2);
        ctx.fill();
      });
      
      this.shootingStars.forEach(ss => {
        ctx.globalAlpha = ss.life / ss.maxLife;
        const grad = ctx.createLinearGradient(ss.x, ss.y, ss.x - (ss.vx/Math.abs(ss.vx))*ss.length, ss.y - (ss.vy/Math.abs(ss.vy))*ss.length);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, this.theme.shootingStar);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - (ss.vx/Math.abs(ss.vx))*ss.length, ss.y - (ss.vy/Math.abs(ss.vy))*ss.length);
        ctx.stroke();
      });
      ctx.globalAlpha = 1.0;
      
      this.dustParticles.forEach(dust => {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = dust.alpha;
        ctx.fillRect(dust.x, dust.y, dust.size, dust.size);
      });
      ctx.globalAlpha = 1.0;
    },

    renderGameplay(ctx, width, height, player, dt) {
      this.render(ctx, width, height);
      
      const gridSpacing = 40;
      ctx.strokeStyle = this.theme.grid;
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
  };

  // ==========================================================================
  // 11. UI MANAGER
  // ==========================================================================
  const UIManager = {
    screens: {
      device: document.getElementById('screen-device'),
      menu: document.getElementById('screen-menu'),
      instructions: document.getElementById('screen-instructions'),
      settings: document.getElementById('screen-settings'),
      highscores: document.getElementById('screen-highscores'),
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
      scorePopups: document.getElementById('score-popups'),
      gravityNotification: document.getElementById('gravity-notification'),
      gravityNotifText: document.getElementById('gravity-notif-text'),
      menuFactText: document.getElementById('menu-fact-text'),
      menuShahriarFact: document.getElementById('menu-shahriar-fact'),
      settingsMusicVolume: document.getElementById('settings-music-volume'),
      settingsSfxVolume: document.getElementById('settings-sfx-volume'),
      settingsMusicValue: document.getElementById('settings-music-value'),
      settingsSfxValue: document.getElementById('settings-sfx-value'),
      settingsBallColor: document.getElementById('settings-ball-color'),
      colorPreview: document.getElementById('color-preview'),
      themeGrid: document.getElementById('theme-grid'),
      highscoresList: document.getElementById('screen-highscores').querySelector('.highscores-list') || document.getElementById('screen-highscores'),
      appHeader: document.getElementById('app-header')
    },
    notifTimeout: null,
    
    hideAllScreens() {
      Object.values(this.screens).forEach(el => {
        if(el) el.classList.add('hidden');
      });
      stopMenuAnimation();
    },
    showScreen(id) {
      this.hideAllScreens();
      if (this.screens[id]) {
        this.screens[id].classList.remove('hidden');
      }
      if (id === 'menu' || id === 'settings' || id === 'highscores' || id === 'instructions') {
        startMenuAnimation();
      }
    },
    updateScore(score) {
      this.els.headerScore.textContent = score;
      if (this.els.hudScore) this.els.hudScore.textContent = score;
    },
    updateHighScore(hs) {
      this.els.headerHighScore.textContent = hs;
      if (this.els.hudHighScore) this.els.hudHighScore.textContent = hs;
    },
    updateGravityIndicator(g, modeName) {
      if (this.els.gravityLabel) {
        this.els.gravityLabel.textContent = modeName || `${Math.abs(g).toFixed(1)} m/s²`;
      }
      if (this.els.gravityArrow) {
        this.els.gravityArrow.style.transform = g > 0 ? 'rotate(0deg)' : 'rotate(180deg)';
        const currentMode = GRAVITY_MODES.find(m => Math.abs(m.value - g) < 0.1);
        this.els.gravityArrow.style.color = currentMode ? currentMode.color : (g > 0 ? 'var(--neon-cyan)' : 'var(--neon-pink)');
      }
    },
    showGravityNotification(text) {
      if (!this.els.gravityNotification) return;
      this.els.gravityNotifText.textContent = text;
      this.els.gravityNotification.classList.add('show');
      if (this.notifTimeout) clearTimeout(this.notifTimeout);
      this.notifTimeout = setTimeout(() => {
        this.els.gravityNotification.classList.remove('show');
      }, 2500);
    },
    updateFPS(fps) {
      if (this.els.hudFps) this.els.hudFps.textContent = fps;
    },
    showGameOver(score, hs, time, isNew) {
      if(this.els.goScore) this.els.goScore.textContent = score;
      if(this.els.goHighScore) this.els.goHighScore.textContent = hs;
      if(this.els.goTime) this.els.goTime.textContent = `${Math.floor(time)}s`;
      if(this.els.goFact) this.els.goFact.textContent = ScoreManager.getRandomFact();
      if (isNew && this.els.goNewHs) this.els.goNewHs.classList.remove('hidden');
      else if (this.els.goNewHs) this.els.goNewHs.classList.add('hidden');
      this.showScreen('gameover');
      drawFunnyFace();
      if (isNew) AudioManager.playHighScore();
      else AudioManager.playGameOver();
    },
    showCountdown(num) {
      if (!this.els.countdownNum) return;
      this.els.countdownNum.textContent = num;
      this.els.countdownNum.style.animation = 'none';
      void this.els.countdownNum.offsetWidth;
      this.els.countdownNum.style.animation = 'pulse 1s infinite';
    },
    spawnScorePopup(x, y, text) {
      if (!this.els.scorePopups) return;
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
    },
    populateHighScores() {
      const container = this.screens.highscores.querySelector('.highscores-list');
      if (!container) return;
      container.innerHTML = '';
      const scores = SettingsManager.get('highScores');
      if (scores.length === 0) {
        container.innerHTML = '<div class="highscore-empty">No high scores yet!</div>';
        return;
      }
      scores.forEach((hs, index) => {
        const row = document.createElement('div');
        row.className = 'highscore-entry';
        row.innerHTML = `
          <span class="highscore-rank">#${index + 1}</span>
          <span class="highscore-score font-mono">${hs.score}</span>
          <span class="highscore-date">${hs.date}</span>
        `;
        container.appendChild(row);
      });
    },
    updateSettingsUI() {
      if (this.els.settingsMusicVolume) {
        this.els.settingsMusicVolume.value = SettingsManager.get('musicVolume');
        if (this.els.settingsMusicValue) this.els.settingsMusicValue.textContent = this.els.settingsMusicVolume.value;
      }
      if (this.els.settingsSfxVolume) {
        this.els.settingsSfxVolume.value = SettingsManager.get('sfxVolume');
        if (this.els.settingsSfxValue) this.els.settingsSfxValue.textContent = this.els.settingsSfxVolume.value;
      }
      if (this.els.settingsBallColor) {
        this.els.settingsBallColor.value = SettingsManager.get('ballColor');
        if (this.els.colorPreview) this.els.colorPreview.style.backgroundColor = SettingsManager.get('ballColor');
      }
      
      if (this.els.themeGrid) {
        const themeBtns = this.els.themeGrid.querySelectorAll('.theme-option');
        const currentTheme = SettingsManager.get('theme');
        themeBtns.forEach(btn => {
          if (btn.dataset.theme === currentTheme) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });
      }
    },
    updateMenuFacts() {
      if (this.els.menuFactText) {
        const allFacts = [...GRAVITY_FACTS, ...SPACE_FACTS];
        this.els.menuFactText.textContent = allFacts[Math.floor(Math.random() * allFacts.length)];
      }
      if (this.els.menuShahriarFact) {
        this.els.menuShahriarFact.textContent = SHAHRIAR_FACTS[Math.floor(Math.random() * SHAHRIAR_FACTS.length)];
      }
    }
  };

  // ==========================================================================
  // 12. FUNNY FACE RENDERER
  // ==========================================================================
  function drawFunnyFace() {
    const canvas = document.getElementById('gameover-face-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const cx = w/2, cy = h/2, r = w * 0.4;
    ctx.clearRect(0, 0, w, h);

    const faceGrad = ctx.createRadialGradient(cx-r*0.2, cy-r*0.2, r*0.1, cx, cy, r);
    faceGrad.addColorStop(0, '#ffe066');
    faceGrad.addColorStop(1, '#ffcc00');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = faceGrad;
    ctx.fill();
    ctx.strokeStyle = '#e6a800';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx - r*0.3, cy - r*0.15, r*0.18, r*0.22, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#cc8800';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(cx - r*0.22, cy - r*0.12, r*0.08, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - r*0.25, cy - r*0.17, r*0.03, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx + r*0.3, cy - r*0.15, r*0.18, r*0.22, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#cc8800';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(cx + r*0.38, cy - r*0.12, r*0.08, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx + r*0.35, cy - r*0.17, r*0.03, 0, Math.PI*2);
    ctx.fill();

    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - r*0.5, cy - r*0.4);
    ctx.quadraticCurveTo(cx - r*0.3, cy - r*0.55, cx - r*0.1, cy - r*0.38);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + r*0.5, cy - r*0.4);
    ctx.quadraticCurveTo(cx + r*0.3, cy - r*0.55, cx + r*0.1, cy - r*0.38);
    ctx.stroke();

    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.ellipse(cx, cy + r*0.3, r*0.45, r*0.3, 0, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#660000';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    const teethY = cy + r*0.3;
    const toothW = r*0.12;
    const toothH = r*0.12;
    const teethStart = cx - r*0.35;
    for (let i = 0; i < 6; i++) {
      if (i === 2) continue;
      const tx = teethStart + i * (toothW + 2);
      ctx.beginPath();
      ctx.roundRect(tx, teethY - toothH*0.2, toothW, toothH, 2);
      ctx.fill();
    }
    
    ctx.fillStyle = '#4a0000';
    const gapX = teethStart + 2 * (toothW + 2);
    ctx.fillRect(gapX, teethY - toothH*0.2, toothW, toothH);

    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.ellipse(cx + r*0.05, cy + r*0.5, r*0.15, r*0.1, 0, 0, Math.PI);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
    ctx.beginPath();
    ctx.arc(cx - r*0.55, cy + r*0.1, r*0.12, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r*0.55, cy + r*0.1, r*0.12, 0, Math.PI*2);
    ctx.fill();
  }

  // ==========================================================================
  // 13. DYNAMIC GRAVITY SYSTEM
  // ==========================================================================
  const DynamicGravity = {
    timer: 0,
    nextShiftTime: 0,
    warningShown: false,
    currentModeIndex: 0,

    reset() {
      this.timer = 0;
      this.nextShiftTime = GRAVITY_SHIFT_MIN + Math.random() * (GRAVITY_SHIFT_MAX - GRAVITY_SHIFT_MIN);
      this.warningShown = false;
      this.currentModeIndex = 0;
      GameManager.gravity = GRAVITY_MODES[0].value;
      UIManager.updateGravityIndicator(GameManager.gravity, GRAVITY_MODES[0].name);
    },

    update(dt) {
      if (GameManager.state !== 'PLAYING') return;
      this.timer += dt;

      if (!this.warningShown && this.timer >= this.nextShiftTime - GRAVITY_WARNING_TIME) {
        this.warningShown = true;
        UIManager.showGravityNotification('⚡ Gravity Shift Incoming...');
      }

      if (this.timer >= this.nextShiftTime) {
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * GRAVITY_MODES.length);
        } while (newIndex === this.currentModeIndex && GRAVITY_MODES.length > 1);

        this.currentModeIndex = newIndex;
        const mode = GRAVITY_MODES[newIndex];
        GameManager.gravity = mode.value;
        UIManager.updateGravityIndicator(mode.value, mode.name);
        UIManager.showGravityNotification(`${mode.name} Activated`);
        AudioManager.playReverse();
        if (GameManager.player) {
          spawnParticles(GameManager.player.x, GameManager.player.y, 20, mode.color, 60);
        }

        this.timer = 0;
        this.nextShiftTime = GRAVITY_SHIFT_MIN + Math.random() * (GRAVITY_SHIFT_MAX - GRAVITY_SHIFT_MIN);
        this.warningShown = false;
      }
    }
  };

  // ==========================================================================
  // 14. DEVICE MANAGER
  // ==========================================================================
  const DeviceManager = {
    mode: null,
    
    init() {
      this.mode = SettingsManager.get('deviceMode');
      if (this.mode) {
        this.applyMode(this.mode);
        return true;
      }
      return false;
    },

    selectMode(mode) {
      this.mode = mode;
      SettingsManager.set('deviceMode', mode);
      this.applyMode(mode);
    },

    applyMode(mode) {
      document.body.classList.remove('device-pc', 'device-android');
      document.body.classList.add(`device-${mode}`);
    },

    isPC() { return this.mode === 'pc'; },
    isAndroid() { return this.mode === 'android'; }
  };

  // ==========================================================================
  // 15. GAME MANAGER
  // ==========================================================================
  const GameManager = {
    state: 'DEVICE_SELECT',
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
      
      if (!DeviceManager.init()) {
        this.state = 'DEVICE_SELECT';
        UIManager.showScreen('device');
      } else {
        this.returnToMenu();
      }
    },
    startGame() {
      this.state = 'COUNTDOWN';
      UIManager.showScreen('countdown');
      ScoreManager.reset();
      
      const ballColor = SettingsManager.get('ballColor');
      this.player = new Player(this.canvas.width/4, this.canvas.height/2, PLAYER_RADIUS, ballColor, PLAYER_RESTITUTION);
      DynamicGravity.reset();
      
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
          if (DeviceManager.isAndroid()) {
            mobileReverseBtn.style.display = 'flex';
            mobilePauseBtn.style.display = 'flex';
          }
          AudioManager.playGameStart();
          MusicManager.startGameMusic();
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
      MusicManager.stopMusic();
      if (DeviceManager.isAndroid()) {
        mobileReverseBtn.style.display = 'none';
        mobilePauseBtn.style.display = 'none';
      }
      UIManager.triggerScreenShake();
      ScoreManager.saveHighScore();
      setTimeout(() => {
        UIManager.showGameOver(ScoreManager.score, SettingsManager.getHighScore(), ScoreManager.timeSurvived, ScoreManager.isNewHighScore);
      }, 1000);
    },
    returnToMenu() {
      this.state = 'MENU';
      UIManager.showScreen('menu');
      UIManager.updateMenuFacts();
      if (DeviceManager.isAndroid()) {
        mobileReverseBtn.style.display = 'none';
        mobilePauseBtn.style.display = 'none';
      }
      UIManager.updateScore(0);
      UIManager.updateHighScore(SettingsManager.getHighScore());
      MusicManager.startMenuMusic();
    },
    getDifficultyMultiplier() {
      return 1 + (this.difficultyTimer / DIFFICULTY_INTERVAL) * 0.5;
    },
    getSpawnInterval() {
      return BASE_SPAWN_INTERVAL / this.getDifficultyMultiplier();
    },
    reverseGravity() {
      this.gravity = -this.gravity;
      UIManager.updateGravityIndicator(this.gravity, 'Manual Reverse');
      AudioManager.playReverse();
      if (this.player) {
        spawnParticles(this.player.x, this.player.y, 20, '#00f3ff', 50);
      }
      DynamicGravity.timer = 0;
    },
    update(dt) {
      this.difficultyTimer += dt;
      this.obstacleSpawnTimer += dt * 1000;
      this.crystalSpawnTimer += dt * 1000;
      
      DynamicGravity.update(dt);
      SpaceRenderer.update(dt, this.canvas.clientWidth, this.canvas.clientHeight);
      
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
            this.gameOver();
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
      SpaceRenderer.renderGameplay(ctx, w, h, this.player, dt);
      if (this.state === 'PLAYING' || this.state === 'PAUSED' || this.state === 'GAME_OVER') {
        renderCrystals(ctx);
        renderObstacles(ctx);
        if (this.player) this.player.draw(ctx);
        renderParticles(ctx);
      }
    }
  };

  // ==========================================================================
  // 16. MENU CANVAS ANIMATION
  // ==========================================================================
  let menuAnimationId = null;
  let menuFactInterval = null;
  function startMenuAnimation() {
    const menuCanvas = document.getElementById('menu-canvas');
    if (!menuCanvas) return;
    const ctx = menuCanvas.getContext('2d');
    
    function resizeMenuCanvas() {
      if(menuCanvas.parentElement) {
        menuCanvas.width = menuCanvas.parentElement.clientWidth;
        menuCanvas.height = menuCanvas.parentElement.clientHeight;
      }
    }
    resizeMenuCanvas();
    SpaceRenderer.init(menuCanvas.width, menuCanvas.height);
    
    UIManager.updateMenuFacts();
    if (!menuFactInterval) {
      menuFactInterval = setInterval(() => {
        UIManager.updateMenuFacts();
      }, 7000);
    }
    
    let lastTime = performance.now();
    function menuLoop(time) {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      if (dt > 0.1) { menuAnimationId = requestAnimationFrame(menuLoop); return; }
      ctx.clearRect(0, 0, menuCanvas.width, menuCanvas.height);
      SpaceRenderer.update(dt, menuCanvas.width, menuCanvas.height);
      SpaceRenderer.render(ctx, menuCanvas.width, menuCanvas.height);
      menuAnimationId = requestAnimationFrame(menuLoop);
    }
    if (!menuAnimationId) menuAnimationId = requestAnimationFrame(menuLoop);
  }
  function stopMenuAnimation() {
    if (menuAnimationId) {
      cancelAnimationFrame(menuAnimationId);
      menuAnimationId = null;
    }
    if (menuFactInterval) {
      clearInterval(menuFactInterval);
      menuFactInterval = null;
    }
  }

  // ==========================================================================
  // 17. INPUT HANDLER
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
  // 18. MAIN LOOP
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
    
    if (GameManager.state === 'PLAYING' || GameManager.state === 'PAUSED' || GameManager.state === 'GAME_OVER' || GameManager.state === 'COUNTDOWN') {
      GameManager.ctx.clearRect(0, 0, GameManager.canvas.width, GameManager.canvas.height);
      GameManager.render(GameManager.ctx, GameManager.canvas.width, GameManager.canvas.height, dt);
    }
    
    if (GameManager.state === 'PLAYING') {
      GameManager.update(dt);
    }
    
    requestAnimationFrame(loop);
  }

  // ==========================================================================
  // 19. BUTTON EVENT LISTENERS
  // ==========================================================================
  function safeAddListener(id, event, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  }

  safeAddListener('btn-device-pc', 'click', () => {
    AudioManager.init();
    AudioManager.playClick();
    DeviceManager.selectMode('pc');
    GameManager.returnToMenu();
  });
  
  safeAddListener('btn-device-android', 'click', () => {
    AudioManager.init();
    AudioManager.playClick();
    DeviceManager.selectMode('android');
    GameManager.returnToMenu();
  });

  safeAddListener('btn-change-device', 'click', () => {
    AudioManager.playClick();
    GameManager.state = 'DEVICE_SELECT';
    UIManager.showScreen('device');
  });

  safeAddListener('btn-play', 'click', () => {
    AudioManager.init();
    AudioManager.playClick();
    GameManager.startGame();
  });
  
  safeAddListener('btn-menu-instructions', 'click', () => {
    AudioManager.init();
    AudioManager.playClick();
    UIManager.showScreen('instructions');
  });
  
  safeAddListener('btn-menu-settings', 'click', () => {
    AudioManager.init();
    AudioManager.playClick();
    UIManager.showScreen('settings');
    UIManager.updateSettingsUI();
  });
  
  safeAddListener('btn-menu-highscores', 'click', () => {
    AudioManager.init();
    AudioManager.playClick();
    UIManager.showScreen('highscores');
    UIManager.populateHighScores();
  });
  
  safeAddListener('btn-close-instructions', 'click', () => {
    AudioManager.playClick();
    GameManager.returnToMenu();
  });
  safeAddListener('btn-instructions-back', 'click', () => {
    AudioManager.playClick();
    GameManager.returnToMenu();
  });
  
  safeAddListener('btn-close-settings', 'click', () => {
    AudioManager.playClick();
    GameManager.returnToMenu();
  });
  safeAddListener('btn-settings-back', 'click', () => {
    AudioManager.playClick();
    GameManager.returnToMenu();
  });
  
  safeAddListener('btn-close-highscores', 'click', () => {
    AudioManager.playClick();
    GameManager.returnToMenu();
  });
  safeAddListener('btn-highscores-back', 'click', () => {
    AudioManager.playClick();
    GameManager.returnToMenu();
  });
  
  safeAddListener('btn-resume', 'click', () => {
    AudioManager.playClick();
    GameManager.resumeGame();
  });
  safeAddListener('btn-pause-settings', 'click', () => {
    AudioManager.playClick();
    UIManager.showScreen('settings');
    UIManager.updateSettingsUI();
  });
  safeAddListener('btn-pause-menu', 'click', () => {
    AudioManager.playClick();
    GameManager.returnToMenu();
  });
  
  safeAddListener('btn-play-again', 'click', () => {
    AudioManager.playClick();
    GameManager.startGame();
  });
  safeAddListener('btn-gameover-menu', 'click', () => {
    AudioManager.playClick();
    GameManager.returnToMenu();
  });

  // Settings Events
  const musicSlider = document.getElementById('settings-music-volume');
  if (musicSlider) {
    musicSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      SettingsManager.set('musicVolume', val);
      MusicManager.setVolume(val);
      if (UIManager.els.settingsMusicValue) UIManager.els.settingsMusicValue.textContent = val;
    });
  }

  const sfxSlider = document.getElementById('settings-sfx-volume');
  if (sfxSlider) {
    sfxSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      SettingsManager.set('sfxVolume', val);
      if (UIManager.els.settingsSfxValue) UIManager.els.settingsSfxValue.textContent = val;
    });
    sfxSlider.addEventListener('change', () => {
      AudioManager.playClick();
    });
  }

  const ballColorInput = document.getElementById('settings-ball-color');
  if (ballColorInput) {
    ballColorInput.addEventListener('input', (e) => {
      const val = e.target.value;
      SettingsManager.set('ballColor', val);
      if (UIManager.els.colorPreview) UIManager.els.colorPreview.style.backgroundColor = val;
    });
  }

  const themeGrid = document.getElementById('theme-grid');
  if (themeGrid) {
    themeGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.theme-btn');
      if (btn) {
        AudioManager.playClick();
        const theme = btn.dataset.theme;
        SettingsManager.set('theme', theme);
        SpaceRenderer.setTheme(theme);
        UIManager.updateSettingsUI();
      }
    });
  }

  // ==========================================================================
  // 20. MOBILE CONTROLS & TOUCH HANDLING
  // ==========================================================================
  const mobileReverseBtn = document.getElementById('btn-reverse-gravity');
  const mobilePauseBtn = document.getElementById('btn-mobile-pause');
  const orientationHint = document.getElementById('orientation-hint');
  const orientationDismiss = document.getElementById('orientation-dismiss');

  if (mobileReverseBtn) {
    mobileReverseBtn.addEventListener('touchstart', function(e) {
      e.preventDefault(); e.stopPropagation();
      if (GameManager.state === 'PLAYING') {
        AudioManager.init(); GameManager.reverseGravity();
      }
    }, { passive: false });

    mobileReverseBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (GameManager.state === 'PLAYING') {
        AudioManager.init(); GameManager.reverseGravity();
      }
    });
  }

  if (mobilePauseBtn) {
    mobilePauseBtn.addEventListener('touchstart', function(e) {
      e.preventDefault(); e.stopPropagation();
      AudioManager.init(); AudioManager.playClick();
      if (GameManager.state === 'PLAYING') GameManager.pauseGame();
      else if (GameManager.state === 'PAUSED') GameManager.resumeGame();
    }, { passive: false });

    mobilePauseBtn.addEventListener('click', function(e) {
      e.preventDefault();
      AudioManager.init(); AudioManager.playClick();
      if (GameManager.state === 'PLAYING') GameManager.pauseGame();
      else if (GameManager.state === 'PAUSED') GameManager.resumeGame();
    });
  }

  let activeTouches = {};
  function getTouchAction(touch) {
    const x = touch.clientX;
    const y = touch.clientY;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const thirdW = w / 3;

    if (x > w - 100 && y > h - 100) return null;
    if (x > w - 70 && y < 120) return null;

    if (x < thirdW) return 'left';
    if (x > thirdW * 2) return 'right';
    return 'jump';
  }

  function updateTouchKeys() {
    keys['TouchLeft'] = false;
    keys['TouchRight'] = false;
    keys['TouchJump'] = false;

    if (!DeviceManager.isAndroid()) return;

    for (const id in activeTouches) {
      const action = activeTouches[id];
      if (action === 'left') keys['TouchLeft'] = true;
      if (action === 'right') keys['TouchRight'] = true;
      if (action === 'jump') keys['TouchJump'] = true;
    }
  }

  const gameViewport = document.querySelector('.game-viewport');
  if (gameViewport && IS_TOUCH_DEVICE) {
    gameViewport.addEventListener('touchstart', function(e) {
      if (GameManager.state !== 'PLAYING') return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const action = getTouchAction(touch);
        if (action) activeTouches[touch.identifier] = action;
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
  // 21. ORIENTATION HINT
  // ==========================================================================
  let orientationDismissed = false;
  function checkOrientation() {
    if (!DeviceManager.isAndroid() || orientationDismissed || !orientationHint) return;
    const isPortrait = window.innerHeight > window.innerWidth && window.innerWidth <= 768;
    if (isPortrait) orientationHint.classList.add('visible');
    else orientationHint.classList.remove('visible');
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

  document.addEventListener('touchmove', function(e) {
    if (GameManager.state === 'PLAYING') e.preventDefault();
  }, { passive: false });

  document.addEventListener('contextmenu', function(e) {
    if (GameManager.state === 'PLAYING') e.preventDefault();
  });

  let lastTouchEnd = 0;
  document.addEventListener('touchend', function(e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });

  // ==========================================================================
  // 22. CANVAS RESIZE
  // ==========================================================================
  function resizeCanvas() {
    if (!GameManager.canvas.parentElement) return;
    const dpr = window.devicePixelRatio || 1;
    const w = GameManager.canvas.parentElement.clientWidth;
    const h = GameManager.canvas.parentElement.clientHeight;
    GameManager.canvas.width = w * dpr;
    GameManager.canvas.height = h * dpr;
    GameManager.ctx.scale(dpr, dpr);
    GameManager.canvas.style.width = w + 'px';
    GameManager.canvas.style.height = h + 'px';
    Object.defineProperty(GameManager.canvas, 'clientWidth', { value: w, configurable: true });
    Object.defineProperty(GameManager.canvas, 'clientHeight', { value: h, configurable: true });
  }

  // ==========================================================================
  // 23. INITIALIZATION ORDER
  // ==========================================================================
  SettingsManager.init();
  SpaceRenderer.setTheme(SettingsManager.get('theme'));
  GameManager.init();
  lastTime = performance.now();
  fpsLastTime = lastTime;
  requestAnimationFrame(loop);

})();
