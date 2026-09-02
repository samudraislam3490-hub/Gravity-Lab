(function() {
  // ==========================================================================
  // 1. CONSTANTS & FIXED LOGICAL GAME WORLD COORDINATES
  // ==========================================================================
  const GAME_WIDTH = 1000;
  const GAME_HEIGHT = 550;
  const GAME_ASPECT_RATIO = GAME_WIDTH / GAME_HEIGHT; // ~1.818

  const PX_PER_METER = 60;
  const DEFAULT_GRAVITY = 9.81;
  const PLAYER_RADIUS = 16;
  const PLAYER_RESTITUTION = 0.65;
  const PLAYER_MOVE_SPEED = 340;
  const PLAYER_JUMP_FORCE = -420;
  const PLAYER_DOWN_FORCE = 300;
  const CRYSTAL_RADIUS = 11;
  const CRYSTAL_SCORE = 10;
  
  // Relaxed obstacle speeds and generous spawn intervals
  const OBSTACLE_BASE_SPEED = 120;
  const BASE_SPAWN_INTERVAL = 4200;
  const MAX_PARTICLES = 50;
  const TRAIL_MAX_LENGTH = 18;
  const MOBILE_MAX_PARTICLES = 25;
  const MOBILE_TRAIL_LENGTH = 8;

  // Dynamic Gravity Modes
  const GRAVITY_MODES = [
    { name: 'Earth Gravity', value: 9.81, color: '#3b82f6' },
    { name: 'Moon Gravity', value: 1.62, color: '#9ca3af' },
    { name: 'Mars Gravity', value: 3.72, color: '#ef4444' },
    { name: 'Zero Gravity', value: 0.001, color: '#06b6d4' },
    { name: 'Reverse Gravity', value: -9.81, color: '#ec4899' }
  ];
  const GRAVITY_SHIFT_MIN = 24;
  const GRAVITY_SHIFT_MAX = 34;
  const GRAVITY_WARNING_TIME = 3;

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
      bg: '#05070c', stars: '#ffffff', nebula1: 'rgba(0, 100, 255, 0.06)', nebula2: 'rgba(150, 0, 255, 0.05)', nebula3: 'rgba(0, 200, 200, 0.04)',
      grid: 'rgba(0, 243, 255, 0.05)', planet1: '#3b82f6', planet2: '#9333ea', shootingStar: '#00f3ff'
    },
    'bright-sky': {
      bg: '#081424', stars: '#e0e8ff', nebula1: 'rgba(100, 180, 255, 0.08)', nebula2: 'rgba(200, 220, 255, 0.06)', nebula3: 'rgba(150, 200, 255, 0.05)',
      grid: 'rgba(100, 180, 255, 0.05)', planet1: '#60a5fa', planet2: '#93c5fd', shootingStar: '#bfdbfe'
    },
    'sunset': {
      bg: '#140608', stars: '#ffd4a8', nebula1: 'rgba(255, 100, 50, 0.08)', nebula2: 'rgba(200, 50, 100, 0.06)', nebula3: 'rgba(255, 150, 50, 0.05)',
      grid: 'rgba(255, 100, 50, 0.04)', planet1: '#f97316', planet2: '#dc2626', shootingStar: '#fbbf24'
    },
    'galaxy': {
      bg: '#08031a', stars: '#e8d5ff', nebula1: 'rgba(100, 0, 200, 0.08)', nebula2: 'rgba(50, 0, 150, 0.06)', nebula3: 'rgba(150, 50, 255, 0.05)',
      grid: 'rgba(150, 50, 255, 0.04)', planet1: '#8b5cf6', planet2: '#6d28d9', shootingStar: '#c084fc'
    },
    'nebula': {
      bg: '#080816', stars: '#d4f0ff', nebula1: 'rgba(80, 0, 150, 0.1)', nebula2: 'rgba(0, 150, 150, 0.07)', nebula3: 'rgba(200, 50, 150, 0.06)',
      grid: 'rgba(0, 200, 200, 0.04)', planet1: '#0891b2', planet2: '#a21caf', shootingStar: '#5eead4'
    },
    'dark-laboratory': {
      bg: '#040804', stars: '#a8d4a8', nebula1: 'rgba(0, 100, 0, 0.06)', nebula2: 'rgba(0, 60, 30, 0.04)', nebula3: 'rgba(50, 150, 50, 0.03)',
      grid: 'rgba(0, 200, 0, 0.04)', planet1: '#22c55e', planet2: '#166534', shootingStar: '#4ade80'
    }
  };

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
      deviceMode: null,
      musicEnabled: true,
      musicVolume: 25,
      sfxVolume: 50,
      ballColor: '#00f3ff',
      theme: 'deep-space',
      highScores: []
    },
    settings: {},
    init() {
      const saved = localStorage.getItem('gravitylab-settings');
      this.settings = saved ? { ...this.defaults, ...JSON.parse(saved) } : { ...this.defaults };
      const legacyHS = parseInt(localStorage.getItem('gravitylab-highscore')) || 0;
      if (legacyHS > 0 && this.settings.highScores.length === 0) {
        this.settings.highScores.push({ score: legacyHS, date: 'Best' });
      }
    },
    save() {
      try { localStorage.setItem('gravitylab-settings', JSON.stringify(this.settings)); } catch(e) {}
    },
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
  // 3. CONTINUOUS APPLICATION-WIDE BACKGROUND MUSIC (ONE PERSISTENT INSTANCE)
  // ==========================================================================
  const MusicManager = {
    ctx: null,
    masterGain: null,
    filterNode: null,
    oscillators: [],
    lfo: null,
    isInitialized: false,
    isPlaying: false,
    
    init() {
      if (this.isInitialized) {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        return;
      }

      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
        
        this.masterGain = this.ctx.createGain();
        this.filterNode = this.ctx.createBiquadFilter();
        
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.value = 280;
        this.filterNode.Q.value = 0.8;
        
        this.masterGain.gain.value = 0;
        this.filterNode.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        // Soft, ambient space harmonics
        const freqs = [65.41, 98.0, 130.81]; // C2, G2, C3
        freqs.forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq + (i * 0.35);
          osc.connect(this.filterNode);
          osc.start();
          this.oscillators.push(osc);
        });
        
        // Gentle evolving LFO
        this.lfo = this.ctx.createOscillator();
        this.lfo.type = 'sine';
        this.lfo.frequency.value = 0.07;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 75;
        this.lfo.connect(lfoGain);
        lfoGain.connect(this.filterNode.frequency);
        this.lfo.start();
        
        this.isInitialized = true;
        this.updateVolume();
      } catch(e) {}
    },

    updateVolume() {
      if (!this.masterGain || !this.ctx) return;
      const isEnabled = SettingsManager.get('musicEnabled') !== false;
      const volSetting = SettingsManager.get('musicVolume') !== undefined ? SettingsManager.get('musicVolume') : 25;
      
      let targetGain = 0;
      if (isEnabled && volSetting > 0) {
        targetGain = (volSetting / 100) * 0.12;
      }
      
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
      this.isPlaying = targetGain > 0;
    },

    start() {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => this.updateVolume()).catch(() => {});
      } else {
        this.updateVolume();
      }
    },

    setVolume(vol) {
      SettingsManager.set('musicVolume', vol);
      this.updateVolume();
    },

    toggle() {
      const current = SettingsManager.get('musicEnabled') !== false;
      SettingsManager.set('musicEnabled', !current);
      this.updateVolume();
      return !current;
    }
  };

  // Start continuous music upon first user interaction
  const triggerAudioStart = () => {
    AudioManager.init();
    MusicManager.start();
    window.removeEventListener('click', triggerAudioStart);
    window.removeEventListener('keydown', triggerAudioStart);
    window.removeEventListener('touchstart', triggerAudioStart);
  };
  window.addEventListener('click', triggerAudioStart, { once: false });
  window.addEventListener('keydown', triggerAudioStart, { once: false });
  window.addEventListener('touchstart', triggerAudioStart, { once: false, passive: true });

  // ==========================================================================
  // 4. AUDIO MANAGER (Procedural Sound FX with SFX Volume)
  // ==========================================================================
  const AudioManager = {
    ctx: null,
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    },
    getSFXVolume() {
      return (SettingsManager.get('sfxVolume') !== undefined ? SettingsManager.get('sfxVolume') : 50) / 100;
    },
    playOscillator(type, freqStart, freqEnd, duration, volume = 0.1) {
      if (!this.ctx) return;
      const sfxVol = this.getSFXVolume();
      if (sfxVol <= 0) return;
      
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freqStart, this.ctx.currentTime);
        if (freqEnd) {
          osc.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + duration);
        }
        const effectiveVol = volume * sfxVol;
        gain.gain.setValueAtTime(effectiveVol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch(e) {}
    },
    playClick() { this.playOscillator('sine', 600, 900, 0.05, 0.08); },
    playCrystal() { this.playOscillator('sine', 523, 1046, 0.16, 0.12); },
    playCollision() { this.playOscillator('sawtooth', 120, 40, 0.3, 0.2); },
    playReverse() { this.playOscillator('sine', 240, 680, 0.18, 0.12); },
    playCountdown() { this.playOscillator('square', 500, null, 0.08, 0.08); },
    playLaserWarning() { this.playOscillator('square', 880, 440, 0.1, 0.06); },
    playGameStart() {
      if (!this.ctx || this.getSFXVolume() <= 0) return;
      [400, 520, 650].forEach((f, i) => {
        setTimeout(() => this.playOscillator('sine', f, f + 100, 0.12, 0.1), i * 80);
      });
    },
    playGameOver() {
      if (!this.ctx || this.getSFXVolume() <= 0) return;
      const notes = [320, 300, 280, 240];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playOscillator('sawtooth', freq, freq - 20, idx === 3 ? 0.45 : 0.18, 0.12);
        }, idx * 180);
      });
    },
    playHighScore() {
      if (!this.ctx || this.getSFXVolume() <= 0) return;
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => {
        setTimeout(() => this.playOscillator('sine', f, f + 50, 0.14, 0.12), i * 90);
      });
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
  function spawnParticles(x, y, count, color, spread = 80) {
    const maxP = DeviceManager.isAndroid() ? MOBILE_MAX_PARTICLES : MAX_PARTICLES;
    for (let i = 0; i < count; i++) {
      if (particles.length >= maxP) particles.shift();
      const vx = (Math.random() - 0.5) * spread;
      const vy = (Math.random() - 0.5) * spread;
      const life = 0.4 + Math.random() * 0.4;
      const size = 1.5 + Math.random() * 2.5;
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
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  }

  // ==========================================================================
  // 6. PLAYER CLASS (STRICT BOUNDARIES CLAMPED IN LOGICAL WORLD)
  // ==========================================================================
  class Player {
    constructor(x, y, radius, color, restitution) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color || '#00f3ff';
      this.restitution = restitution;
      this.vx = 0;
      this.vy = 0;
      this.trail = [];
      this.trailCounter = 0;
      this.isAlive = true;
      this.isGrounded = false;
    }

    update(dt, width, height, gravity, inputX, inputY) {
      if (!this.isAlive) return;
      
      const gravityAcc = gravity * PX_PER_METER;
      this.vy += gravityAcc * dt;
      
      // Horizontal movement
      this.vx += inputX * PLAYER_MOVE_SPEED * dt;
      this.vx *= 0.92;
      
      // Downward direct movement (Down Arrow / S / Mobile Down)
      if (inputY > 0) {
        this.vy += inputY * PLAYER_DOWN_FORCE * dt;
      }
      
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      
      this.trailCounter++;
      if (this.trailCounter % 2 === 0) {
        this.trail.push({ x: this.x, y: this.y });
        const maxTrail = DeviceManager.isAndroid() ? MOBILE_TRAIL_LENGTH : TRAIL_MAX_LENGTH;
        if (this.trail.length > maxTrail) {
          this.trail.shift();
        }
      }
      
      const bounceFriction = 0.992;
      this.isGrounded = false;
      
      // Floor collision & hard clamping
      if (this.y + this.radius >= height) {
        this.y = height - this.radius;
        this.vy = -this.vy * this.restitution;
        this.vx *= bounceFriction;
        if (Math.abs(this.vy) < 15 && gravity >= 0) {
          this.vy = 0;
          this.isGrounded = true;
        }
      }
      
      // Ceiling collision & hard clamping
      if (this.y - this.radius <= 0) {
        this.y = this.radius;
        this.vy = -this.vy * this.restitution;
        this.vx *= bounceFriction;
        if (Math.abs(this.vy) < 15 && gravity < 0) {
          this.vy = 0;
          this.isGrounded = true;
        }
      }
      
      // Left and right hard boundaries (BALL CAN NEVER LEAVE PLAYABLE AREA)
      if (this.x - this.radius < 0) {
        this.x = this.radius;
        this.vx = -this.vx * this.restitution;
      }
      if (this.x + this.radius > width) {
        this.x = width - this.radius;
        this.vx = -this.vx * this.restitution;
      }
    }

    draw(ctx) {
      if (!this.isAlive) return;
      
      // Trail
      if (this.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
          ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = 0.22;
        ctx.lineWidth = this.radius * 0.35;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
      
      // Outer aura ring
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Sphere body
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
      grad.addColorStop(0.25, this.color);
      grad.addColorStop(0.85, darkenColor(this.color, 40));
      grad.addColorStop(1, darkenColor(this.color, 70));
      
      ctx.fillStyle = grad;
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // ==========================================================================
  // 7. OBSTACLE SYSTEM (FAIR, CALM & CLEAR WARNINGS)
  // ==========================================================================
  let obstacles = [];
  let lastLaserTime = -99999;
  let safeSpawnGraceTimer = 0;

  class Obstacle {
    constructor(x, y, width, height, speed, type, onFloor = true) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.speed = speed;
      this.type = type;
      this.onFloor = onFloor;
      this.warningTimer = (type === 'laser') ? 1.8 : 0;
      this.active = (type !== 'laser');
      this.warningPlayed = false;
    }
  }

  function spawnObstacle(canvasWidth, canvasHeight, multiplier) {
    if (safeSpawnGraceTimer > 0) return;

    const now = performance.now();
    const timeSurvived = GameManager.difficultyTimer;

    const canSpawnLaser = (timeSurvived >= 35) && (now - lastLaserTime > 16000);
    
    let type;
    if (canSpawnLaser && Math.random() < 0.26) {
      type = 'laser';
      lastLaserTime = now;
      safeSpawnGraceTimer = 2.4;
    } else {
      type = (Math.random() < 0.55) ? 'spike' : 'block';
    }

    const speed = OBSTACLE_BASE_SPEED * multiplier;

    if (type === 'laser') {
      const y = 60 + Math.random() * (canvasHeight - 130);
      obstacles.push(new Obstacle(0, y, canvasWidth, 12, 0, 'laser'));
    } else if (type === 'spike') {
      const onFloor = Math.random() < 0.55;
      const spikeHeight = 32;
      const spikeWidth = 26;
      const y = onFloor ? (canvasHeight - spikeHeight) : 0;
      obstacles.push(new Obstacle(canvasWidth + 15, y, spikeWidth, spikeHeight, speed, 'spike', onFloor));
    } else if (type === 'block') {
      const loc = Math.random();
      const blockH = 32;
      const blockW = 32;
      let y;
      if (loc < 0.45) y = canvasHeight - blockH;
      else if (loc < 0.85) y = 0;
      else y = canvasHeight / 2 - blockH / 2;
      obstacles.push(new Obstacle(canvasWidth + 15, y, blockW, blockH, speed, 'block'));
    }
  }

  function updateObstacles(dt) {
    if (safeSpawnGraceTimer > 0) {
      safeSpawnGraceTimer -= dt;
    }
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
          if (obs.warningTimer < -1.1) obstacles.splice(i, 1);
        }
      } else {
        obs.x -= obs.speed * dt;
        if (obs.x + obs.width < -40) obstacles.splice(i, 1);
      }
    }
  }

  function renderObstacles(ctx, width) {
    obstacles.forEach(obs => {
      if (obs.type === 'laser') {
        if (obs.warningTimer > 0) {
          if (Math.floor(obs.warningTimer * 5) % 2 === 0) {
            ctx.strokeStyle = '#ff007c';
            ctx.setLineDash([8, 8]);
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff007c';
            ctx.beginPath();
            ctx.moveTo(0, obs.y + obs.height/2);
            ctx.lineTo(width, obs.y + obs.height/2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.shadowBlur = 0;
            
            // Left & Right warning indicators
            ctx.fillStyle = '#ff007c';
            ctx.beginPath();
            ctx.moveTo(0, obs.y);
            ctx.lineTo(12, obs.y + obs.height/2);
            ctx.lineTo(0, obs.y + obs.height);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(width, obs.y);
            ctx.lineTo(width - 12, obs.y + obs.height/2);
            ctx.lineTo(width, obs.y + obs.height);
            ctx.fill();
          }
        } else if (obs.active) {
          ctx.fillStyle = '#ff007c';
          ctx.shadowBlur = 16;
          ctx.shadowColor = '#ff007c';
          ctx.fillRect(0, obs.y, width, obs.height);
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, obs.y + 3, width, obs.height - 6);
        }
      } else if (obs.type === 'spike') {
        ctx.fillStyle = '#ff007c';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ff007c';
        ctx.beginPath();
        if (obs.onFloor) {
          ctx.moveTo(obs.x, obs.y + obs.height);
          ctx.lineTo(obs.x + obs.width / 2, obs.y);
          ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        } else {
          ctx.moveTo(obs.x, obs.y);
          ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height);
          ctx.lineTo(obs.x + obs.width, obs.y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (obs.type === 'block') {
        const grad = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.height);
        grad.addColorStop(0, '#ff007c');
        grad.addColorStop(1, '#990044');
        ctx.fillStyle = grad;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ff007c';
        ctx.beginPath();
        ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 6);
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
    const y = 40 + Math.random() * (height - 80);
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
      const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.radius + 4 + glow * 4);
      grad.addColorStop(0, 'rgba(0, 243, 255, 0.95)');
      grad.addColorStop(0.5, 'rgba(0, 243, 255, 0.45)');
      grad.addColorStop(1, 'rgba(0, 243, 255, 0)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius + 4 + glow * 4, 0, Math.PI * 2);
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
  // 10. SPACE RENDERER (Animated Living Space Scene)
  // ==========================================================================
  const SpaceRenderer = {
    stars: [],
    nebulae: [],
    planets: [],
    shootingStars: [],
    theme: THEMES['deep-space'],

    init(width, height) {
      this.stars = [];
      this.nebulae = [];
      this.planets = [];
      this.shootingStars = [];
      
      const starCount = 100;
      for (let i = 0; i < starCount; i++) {
        this.stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 0.6 + Math.random() * 1.8,
          speed: 4 + Math.random() * 14,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 1 + Math.random() * 2
        });
      }
      
      for (let i = 0; i < 3; i++) {
        this.nebulae.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 90 + Math.random() * 120,
          colorIdx: i % 3,
          driftVx: (Math.random() - 0.5) * 2,
          driftVy: (Math.random() - 0.5) * 2
        });
      }
      
      this.planets.push({
        x: width * 0.82,
        y: height * 0.28,
        radius: 22,
        color: this.theme.planet1
      });
    },

    setTheme(themeName) {
      this.theme = THEMES[themeName] || THEMES['deep-space'];
      if (this.planets.length > 0) this.planets[0].color = this.theme.planet1;
    },

    update(dt, width, height) {
      this.stars.forEach(star => {
        star.x -= star.speed * dt;
        if (star.x < 0) {
          star.x = width;
          star.y = Math.random() * height;
        }
        star.twinklePhase += star.twinkleSpeed * dt;
      });

      this.nebulae.forEach(neb => {
        neb.x += neb.driftVx * dt;
        neb.y += neb.driftVy * dt;
        if (neb.x < -neb.radius) neb.x = width + neb.radius;
        if (neb.x > width + neb.radius) neb.x = -neb.radius;
      });

      if (Math.random() < 0.008 && this.shootingStars.length < 2) {
        this.shootingStars.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.4),
          vx: -180 - Math.random() * 120,
          vy: 80 + Math.random() * 60,
          life: 0.8,
          maxLife: 0.8,
          length: 40 + Math.random() * 30
        });
      }

      for (let i = this.shootingStars.length - 1; i >= 0; i--) {
        let s = this.shootingStars[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt;
        if (s.life <= 0) this.shootingStars.splice(i, 1);
      }
    },

    render(ctx, width, height) {
      ctx.fillStyle = this.theme.bg;
      ctx.fillRect(0, 0, width, height);

      // Nebulae
      this.nebulae.forEach(neb => {
        const color = neb.colorIdx === 0 ? this.theme.nebula1 : (neb.colorIdx === 1 ? this.theme.nebula2 : this.theme.nebula3);
        const grad = ctx.createRadialGradient(neb.x, neb.y, 0, neb.x, neb.y, neb.radius);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(neb.x, neb.y, neb.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Planet
      this.planets.forEach(p => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.globalAlpha = 0.65;
        ctx.fill();
        ctx.restore();
      });

      // Stars
      this.stars.forEach(star => {
        const alpha = 0.35 + 0.65 * Math.abs(Math.sin(star.twinklePhase));
        ctx.fillStyle = this.theme.stars;
        ctx.globalAlpha = alpha;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });
      ctx.globalAlpha = 1.0;

      // Shooting stars
      this.shootingStars.forEach(s => {
        const alpha = Math.max(0, s.life / s.maxLife);
        ctx.strokeStyle = this.theme.shootingStar;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - (s.vx / 180) * s.length, s.y - (s.vy / 180) * s.length);
        ctx.stroke();
      });
      ctx.globalAlpha = 1.0;
    },

    renderGameplay(ctx, width, height, player, dt) {
      this.render(ctx, width, height);

      // Subtle dynamic warped grid
      const gridSpacing = 40;
      ctx.strokeStyle = this.theme.grid;
      ctx.lineWidth = 1;
      
      for (let y = 0; y < height; y += gridSpacing) {
        ctx.beginPath();
        for (let x = 0; x < width; x += 15) {
          let dx = x, dy = y;
          if (player) {
            const diffX = player.x - x;
            const diffY = player.y - y;
            const distSq = diffX * diffX + diffY * diffY;
            const warpR = player.radius * 3.2;
            if (distSq < warpR * warpR) {
              const dist = Math.sqrt(distSq);
              const force = (warpR - dist) / warpR;
              const disp = force * (player.radius * 0.22);
              dx += (diffX / (dist || 1)) * disp;
              dy += (diffY / (dist || 1)) * disp;
            }
          }
          if (x === 0) ctx.moveTo(dx, dy);
          else ctx.lineTo(dx, dy);
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
      gravityNotification: document.getElementById('gravity-notification'),
      gravityNotifText: document.getElementById('gravity-notif-text'),
      countdownNum: document.getElementById('countdown-number'),
      goScore: document.getElementById('gameover-score'),
      goHighScore: document.getElementById('gameover-highscore'),
      goTime: document.getElementById('gameover-time'),
      goFact: document.getElementById('gameover-fact-text'),
      goNewHs: document.getElementById('gameover-new-hs'),
      scorePopups: document.getElementById('score-popups'),
      menuFactText: document.getElementById('menu-fact-text'),
      menuShahriarFact: document.getElementById('menu-shahriar-fact'),
      settingsMusicVolume: document.getElementById('settings-music-volume'),
      settingsSfxVolume: document.getElementById('settings-sfx-volume'),
      settingsMusicValue: document.getElementById('settings-music-value'),
      settingsSfxValue: document.getElementById('settings-sfx-value'),
      settingsBallColor: document.getElementById('settings-ball-color'),
      colorPreview: document.getElementById('color-preview'),
      themeGrid: document.getElementById('theme-grid'),
      highscoresList: document.getElementById('highscores-list'),
      appHeader: document.getElementById('app-header'),
      musicToggleBtn: document.getElementById('btn-toggle-music'),
      musicToggleIcon: document.getElementById('music-toggle-icon'),
      musicToggleText: document.getElementById('music-toggle-text')
    },
    notifTimeout: null,

    hideAllScreens() {
      Object.values(this.screens).forEach(el => {
        if (el) el.classList.add('hidden');
      });
      stopMenuAnimation();
    },
    showScreen(id) {
      this.hideAllScreens();
      if (this.screens[id]) {
        this.screens[id].classList.remove('hidden');
        if (id === 'menu') startMenuAnimation();
      }
    },
    updateScore(score) {
      if (this.els.headerScore) this.els.headerScore.textContent = score;
      if (this.els.hudScore) this.els.hudScore.textContent = score;
    },
    updateHighScore(hs) {
      if (this.els.headerHighScore) this.els.headerHighScore.textContent = hs;
      if (this.els.hudHighScore) this.els.hudHighScore.textContent = hs;
    },
    updateGravityIndicator(g, modeName) {
      if (!this.els.gravityLabel || !this.els.gravityArrow) return;
      this.els.gravityLabel.textContent = `${Math.abs(g).toFixed(1)} m/s²`;
      this.els.gravityArrow.style.transform = g > 0 ? 'rotate(0deg)' : 'rotate(180deg)';
      const currentMode = GRAVITY_MODES.find(m => Math.abs(m.value - g) < 0.1);
      this.els.gravityArrow.style.color = currentMode ? currentMode.color : (g > 0 ? 'var(--neon-cyan)' : 'var(--neon-pink)');
    },
    showGravityNotification(text) {
      if (!this.els.gravityNotification || !this.els.gravityNotifText) return;
      this.els.gravityNotifText.textContent = text;
      this.els.gravityNotification.classList.add('show');
      if (this.notifTimeout) clearTimeout(this.notifTimeout);
      this.notifTimeout = setTimeout(() => {
        this.els.gravityNotification.classList.remove('show');
      }, 2200);
    },
    updateFPS(fps) {
      if (this.els.hudFps) this.els.hudFps.textContent = fps;
    },
    showGameOver(score, hs, time, isNew) {
      if (this.els.goScore) this.els.goScore.textContent = score;
      if (this.els.goHighScore) this.els.goHighScore.textContent = hs;
      if (this.els.goTime) this.els.goTime.textContent = `${Math.floor(time)}s`;
      if (this.els.goFact) this.els.goFact.textContent = ScoreManager.getRandomFact();
      
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
      this.els.countdownNum.style.animation = 'countdownPulse 0.8s ease-out forwards';
    },
    spawnScorePopup(x, y, text) {
      if (!this.els.scorePopups) return;
      const el = document.createElement('div');
      el.className = 'score-popup font-mono text-cyan';
      el.textContent = text;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      this.els.scorePopups.appendChild(el);
      setTimeout(() => el.remove(), 900);
    },
    triggerScreenShake() {
      const vp = document.querySelector('.game-viewport');
      if (vp) {
        vp.classList.add('shake');
        setTimeout(() => vp.classList.remove('shake'), 300);
      }
    },
    populateHighScores() {
      const container = this.els.highscoresList;
      if (!container) return;
      container.innerHTML = '';
      const scores = SettingsManager.get('highScores') || [];
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
        const mVol = SettingsManager.get('musicVolume') !== undefined ? SettingsManager.get('musicVolume') : 25;
        this.els.settingsMusicVolume.value = mVol;
        if (this.els.settingsMusicValue) this.els.settingsMusicValue.textContent = `${mVol}%`;
      }
      if (this.els.musicToggleBtn) {
        const isEnabled = SettingsManager.get('musicEnabled') !== false;
        if (this.els.musicToggleIcon) {
          this.els.musicToggleIcon.className = isEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
        }
        if (this.els.musicToggleText) {
          this.els.musicToggleText.textContent = isEnabled ? 'Music: ON' : 'Music: OFF';
        }
      }
      if (this.els.settingsSfxVolume) {
        const sVol = SettingsManager.get('sfxVolume') !== undefined ? SettingsManager.get('sfxVolume') : 50;
        this.els.settingsSfxVolume.value = sVol;
        if (this.els.settingsSfxValue) this.els.settingsSfxValue.textContent = `${sVol}%`;
      }
      if (this.els.settingsBallColor) {
        const bColor = SettingsManager.get('ballColor') || '#00f3ff';
        this.els.settingsBallColor.value = bColor;
        if (this.els.colorPreview) this.els.colorPreview.style.backgroundColor = bColor;
      }
      if (this.els.themeGrid) {
        const themeBtns = this.els.themeGrid.querySelectorAll('.theme-option');
        const currentTheme = SettingsManager.get('theme') || 'deep-space';
        themeBtns.forEach(btn => {
          if (btn.dataset.theme === currentTheme) btn.classList.add('active');
          else btn.classList.remove('active');
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
  // 12. FUNNY FACE RENDERER (Humorous Cartoon Face with Missing Tooth)
  // ==========================================================================
  function drawFunnyFace() {
    const canvas = document.getElementById('gameover-face-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const cx = w/2, cy = h/2, r = w * 0.42;
    ctx.clearRect(0, 0, w, h);

    // Face
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

    // Eyes
    ctx.strokeStyle = '#664400';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.arc(cx - r*0.35, cy - r*0.1, r*0.18, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx + r*0.35, cy - r*0.1, r*0.18, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    // Eyebrows
    ctx.beginPath();
    ctx.moveTo(cx - r*0.5, cy - r*0.35);
    ctx.quadraticCurveTo(cx - r*0.35, cy - r*0.48, cx - r*0.18, cy - r*0.32);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(cx + r*0.5, cy - r*0.35);
    ctx.quadraticCurveTo(cx + r*0.35, cy - r*0.48, cx + r*0.18, cy - r*0.32);
    ctx.stroke();

    // Mouth
    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.arc(cx, cy + r*0.1, r*0.55, 0.1 * Math.PI, 0.9 * Math.PI, false);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#660000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Teeth with missing tooth!
    ctx.fillStyle = '#ffffff';
    const teethY = cy + r*0.12;
    const toothW = r * 0.18;
    const toothH = r * 0.16;
    
    ctx.beginPath();
    ctx.roundRect(cx - toothW * 1.1, teethY, toothW, toothH, 2);
    ctx.fill();

    ctx.beginPath();
    ctx.roundRect(cx + toothW * 0.5, teethY, toothW, toothH, 2);
    ctx.fill();

    // Tongue
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(cx, cy + r*0.48, r*0.2, 0, Math.PI, false);
    ctx.fill();

    // Cheeks
    ctx.fillStyle = 'rgba(255, 90, 90, 0.35)';
    ctx.beginPath();
    ctx.arc(cx - r*0.55, cy + r*0.12, r*0.12, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r*0.55, cy + r*0.12, r*0.12, 0, Math.PI*2);
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
        UIManager.showGravityNotification(`${mode.name.toUpperCase()} ACTIVATED`);
        AudioManager.playReverse();
        
        safeSpawnGraceTimer = 2.0;

        if (GameManager.player) {
          spawnParticles(GameManager.player.x, GameManager.player.y, 16, mode.color, 50);
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
      resizeCanvas();
    },

    applyMode(mode) {
      document.body.classList.remove('device-pc', 'device-android');
      document.body.classList.add(`device-${mode}`);
      
      const controlsPanel = document.getElementById('mobile-controls-panel');
      const pauseBtn = document.getElementById('btn-mobile-pause');
      if (mode === 'android') {
        if (controlsPanel) controlsPanel.style.display = 'flex';
        if (pauseBtn) pauseBtn.style.display = 'inline-flex';
      } else {
        if (controlsPanel) controlsPanel.style.display = 'none';
        if (pauseBtn) pauseBtn.style.display = 'none';
      }
    },

    isPC() { return this.mode === 'pc'; },
    isAndroid() { return this.mode === 'android'; }
  };

  // ==========================================================================
  // 15. GAME MANAGER (PROPORTIONAL SCALING & LOGICAL WORLD)
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
    
    // Fixed logical game world resolution (NEVER CROPPED)
    worldWidth: GAME_WIDTH,
    worldHeight: GAME_HEIGHT,
    
    init() {
      this.ctx = this.canvas.getContext('2d');
      window.addEventListener('resize', resizeCanvas);
      
      SpaceRenderer.init(this.worldWidth, this.worldHeight);
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
      
      const ballColor = SettingsManager.get('ballColor') || '#00f3ff';
      this.player = new Player(this.worldWidth * 0.25, this.worldHeight * 0.5, PLAYER_RADIUS, ballColor, PLAYER_RESTITUTION);
      DynamicGravity.reset();
      
      obstacles = [];
      crystals = [];
      particles = [];
      lastLaserTime = -99999;
      safeSpawnGraceTimer = 1.0;
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
      if (this.player) this.player.isAlive = false;
      spawnParticles(this.player ? this.player.x : this.worldWidth/2, this.player ? this.player.y : this.worldHeight/2, 35, '#ff007c', 160);
      AudioManager.playCollision();
      
      UIManager.triggerScreenShake();
      ScoreManager.saveHighScore();
      setTimeout(() => {
        UIManager.showGameOver(ScoreManager.score, SettingsManager.getHighScore(), ScoreManager.timeSurvived, ScoreManager.isNewHighScore);
      }, 750);
    },
    
    returnToMenu() {
      this.state = 'MENU';
      UIManager.showScreen('menu');
      UIManager.updateMenuFacts();
      
      UIManager.updateScore(0);
      UIManager.updateHighScore(SettingsManager.getHighScore());
    },
    
    getDifficultyMultiplier() {
      if (this.difficultyTimer < 20) return 1.0;
      if (this.difficultyTimer < 40) return 1.0 + (this.difficultyTimer - 20) * 0.006;
      if (this.difficultyTimer < 60) return 1.12 + (this.difficultyTimer - 40) * 0.0065;
      const overtime = this.difficultyTimer - 60;
      return Math.min(1.45, 1.25 + overtime * 0.003);
    },
    
    getSpawnInterval() {
      return BASE_SPAWN_INTERVAL / this.getDifficultyMultiplier();
    },
    
    reverseGravity() {
      this.gravity = -this.gravity;
      UIManager.updateGravityIndicator(this.gravity, 'Manual Reverse');
      AudioManager.playReverse();
      if (this.player) {
        spawnParticles(this.player.x, this.player.y, 16, '#00f3ff', 40);
      }
      DynamicGravity.timer = 0;
    },
    
    update(dt) {
      this.difficultyTimer += dt;
      this.obstacleSpawnTimer += dt * 1000;
      this.crystalSpawnTimer += dt * 1000;
      
      DynamicGravity.update(dt);
      SpaceRenderer.update(dt, this.worldWidth, this.worldHeight);
      
      // Compute input direction from keys and mobile touch states
      let inputX = 0;
      if (keys['ArrowLeft'] || keys['KeyA'] || keys['TouchLeft']) inputX -= 1;
      if (keys['ArrowRight'] || keys['KeyD'] || keys['TouchRight']) inputX += 1;
      
      let inputY = 0;
      if (keys['ArrowDown'] || keys['KeyS'] || keys['TouchDown']) inputY += 1;
      
      // Jump action
      if ((keys['ArrowUp'] || keys['KeyW'] || keys['TouchUp']) && this.player && this.player.isGrounded) {
        this.player.vy = (this.gravity > 0) ? PLAYER_JUMP_FORCE : -PLAYER_JUMP_FORCE;
        this.player.isGrounded = false;
      }
      
      if (this.player) {
        this.player.update(dt, this.worldWidth, this.worldHeight, this.gravity, inputX, inputY);
      }
      
      if (this.obstacleSpawnTimer >= this.getSpawnInterval()) {
        this.obstacleSpawnTimer = 0;
        spawnObstacle(this.worldWidth, this.worldHeight, this.getDifficultyMultiplier());
      }
      if (this.crystalSpawnTimer >= 3500) {
        this.crystalSpawnTimer = 0;
        spawnCrystal(this.worldWidth, this.worldHeight);
      }
      
      updateObstacles(dt);
      updateCrystals(dt);
      updateParticles(dt);
      ScoreManager.update(dt);
      UIManager.updateScore(ScoreManager.score);
      
      // Collision detection (Fair bounding checks in logical world)
      if (this.player && this.player.isAlive) {
        obstacles.forEach(obs => {
          if (!obs.active) return;
          if (obs.type === 'laser') {
            if (this.player.y + this.player.radius > obs.y && this.player.y - this.player.radius < obs.y + obs.height) {
              this.gameOver();
            }
          } else {
            const px = Math.max(obs.x, Math.min(this.player.x, obs.x + obs.width));
            const py = Math.max(obs.y, Math.min(this.player.y, obs.y + obs.height));
            const dist = Math.hypot(this.player.x - px, this.player.y - py);
            if (dist < this.player.radius * 0.85) {
              this.gameOver();
            }
          }
        });
        
        crystals.forEach(c => {
          if (!c.collected) {
            const dist = Math.hypot(this.player.x - c.x, this.player.y - c.y);
            if (dist < this.player.radius + c.radius) {
              c.collected = true;
              ScoreManager.addPoints(CRYSTAL_SCORE, c.x, c.y);
              AudioManager.playCrystal();
              spawnParticles(c.x, c.y, 12, '#00f3ff', 60);
            }
          }
        });
      }
    },
    
    render(ctx, dt) {
      SpaceRenderer.renderGameplay(ctx, this.worldWidth, this.worldHeight, this.player, dt);
      if (this.state === 'PLAYING' || this.state === 'PAUSED' || this.state === 'GAME_OVER') {
        renderCrystals(ctx);
        renderObstacles(ctx, this.worldWidth);
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
      if (menuCanvas.parentElement) {
        menuCanvas.width = menuCanvas.parentElement.clientWidth;
        menuCanvas.height = menuCanvas.parentElement.clientHeight;
      }
    }
    resizeMenuCanvas();
    
    UIManager.updateMenuFacts();
    if (!menuFactInterval) {
      menuFactInterval = setInterval(() => {
        UIManager.updateMenuFacts();
      }, 7500);
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
  // 17. INPUT HANDLER (KEYBOARD PC CONTROLS)
  // ==========================================================================
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') {
      if (GameManager.state === 'PLAYING') {
        GameManager.reverseGravity();
      } else if (GameManager.state === 'MENU') {
        AudioManager.init();
        GameManager.startGame();
      }
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
    
    if (GameManager.ctx) {
      GameManager.ctx.clearRect(0, 0, GameManager.worldWidth, GameManager.worldHeight);
      GameManager.render(GameManager.ctx, dt);
      
      if (GameManager.state === 'PLAYING') {
        GameManager.update(dt);
      }
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

  // Music ON/OFF Button Toggle
  safeAddListener('btn-toggle-music', 'click', () => {
    AudioManager.init();
    AudioManager.playClick();
    MusicManager.toggle();
    UIManager.updateSettingsUI();
  });

  // Settings Volume Sliders
  const musicSlider = document.getElementById('settings-music-volume');
  if (musicSlider) {
    musicSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      MusicManager.setVolume(val);
      const valDisplay = document.getElementById('settings-music-value');
      if (valDisplay) valDisplay.textContent = `${val}%`;
    });
  }

  const sfxSlider = document.getElementById('settings-sfx-volume');
  if (sfxSlider) {
    sfxSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      SettingsManager.set('sfxVolume', val);
      const valDisplay = document.getElementById('settings-sfx-value');
      if (valDisplay) valDisplay.textContent = `${val}%`;
    });
    sfxSlider.addEventListener('change', () => {
      AudioManager.init();
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
      const btn = e.target.closest('.theme-option');
      if (!btn) return;
      AudioManager.init();
      AudioManager.playClick();
      const theme = btn.dataset.theme;
      SettingsManager.set('theme', theme);
      SpaceRenderer.setTheme(theme);
      UIManager.updateSettingsUI();
    });
  }

  // ==========================================================================
  // 20. MOBILE VIRTUAL GAMEPAD (COMPLETE TOUCH CONTROLS WITH CONTINUOUS HOLD)
  // ==========================================================================
  function bindTouchButton(elementId, keyName, isAction = false, actionCallback = null) {
    const btn = document.getElementById(elementId);
    if (!btn) return;

    const startHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.add('active');
      AudioManager.init();
      MusicManager.init();

      if (isAction && actionCallback) {
        actionCallback();
      } else if (keyName) {
        keys[keyName] = true;
      }
    };

    const endHandler = (e) => {
      e.preventDefault();
      btn.classList.remove('active');
      if (keyName) {
        keys[keyName] = false;
      }
    };

    btn.addEventListener('touchstart', startHandler, { passive: false });
    btn.addEventListener('touchend', endHandler, { passive: false });
    btn.addEventListener('touchcancel', endHandler, { passive: false });
    
    // Mouse fallbacks for desktop testing
    btn.addEventListener('mousedown', startHandler);
    btn.addEventListener('mouseup', endHandler);
    btn.addEventListener('mouseleave', endHandler);
  }

  // Directional D-Pad buttons
  bindTouchButton('btn-mobile-left', 'TouchLeft');
  bindTouchButton('btn-mobile-right', 'TouchRight');
  bindTouchButton('btn-mobile-up', 'TouchUp');
  bindTouchButton('btn-mobile-down', 'TouchDown');

  // Main Reverse Gravity button
  bindTouchButton('btn-reverse-gravity', null, true, () => {
    if (GameManager.state === 'PLAYING') {
      GameManager.reverseGravity();
    }
  });

  // Mobile pause button
  const mobilePauseBtn = document.getElementById('btn-mobile-pause');
  if (mobilePauseBtn) {
    mobilePauseBtn.addEventListener('touchstart', function(e) {
      e.preventDefault();
      e.stopPropagation();
      AudioManager.init();
      AudioManager.playClick();
      if (GameManager.state === 'PLAYING') GameManager.pauseGame();
      else if (GameManager.state === 'PAUSED') GameManager.resumeGame();
    }, { passive: false });
    
    mobilePauseBtn.addEventListener('click', function(e) {
      e.preventDefault();
      AudioManager.init();
      AudioManager.playClick();
      if (GameManager.state === 'PLAYING') GameManager.pauseGame();
      else if (GameManager.state === 'PAUSED') GameManager.resumeGame();
    });
  }

  // Tap-on-canvas also flips gravity on mobile if in playing state
  const gameViewport = document.getElementById('game-viewport');
  if (gameViewport) {
    gameViewport.addEventListener('touchstart', function(e) {
      if (GameManager.state !== 'PLAYING') return;
      // If touch is not inside a button
      if (e.target.closest('button')) return;
      AudioManager.init();
      GameManager.reverseGravity();
    }, { passive: true });
  }

  // ==========================================================================
  // 21. ORIENTATION HINT
  // ==========================================================================
  let orientationDismissed = false;
  const orientationHint = document.getElementById('orientation-hint');
  const orientationDismiss = document.getElementById('orientation-dismiss');

  function checkOrientation() {
    if (!DeviceManager.isAndroid() || orientationDismissed || !orientationHint) return;
    const isPortrait = window.innerHeight > window.innerWidth && window.innerWidth <= 768;
    if (isPortrait) orientationHint.classList.add('visible');
    else orientationHint.classList.remove('visible');
  }

  if (orientationDismiss) {
    orientationDismiss.addEventListener('click', function() {
      orientationDismissed = true;
      if (orientationHint) {
        orientationHint.classList.add('dismissed');
        orientationHint.classList.remove('visible');
      }
    });
    orientationDismiss.addEventListener('touchstart', function(e) {
      e.preventDefault();
      orientationDismissed = true;
      if (orientationHint) {
        orientationHint.classList.add('dismissed');
        orientationHint.classList.remove('visible');
      }
    }, { passive: false });
  }

  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', function() {
    setTimeout(checkOrientation, 150);
  });

  document.addEventListener('touchmove', function(e) {
    if (GameManager.state === 'PLAYING') e.preventDefault();
  }, { passive: false });

  document.addEventListener('contextmenu', function(e) {
    if (GameManager.state === 'PLAYING') e.preventDefault();
  });

  // ==========================================================================
  // 22. PROPORTIONAL ASPECT-RATIO RESIZE (FIXES PC & MOBILE CROPPING COMPLETELY)
  // ==========================================================================
  function resizeCanvas() {
    const container = document.getElementById('game-viewport-container');
    const viewport = document.getElementById('game-viewport');
    if (!container || !viewport || !GameManager.canvas) return;

    // Available space inside main container
    const availWidth = container.clientWidth || window.innerWidth;
    const availHeight = container.clientHeight || (window.innerHeight - 80);

    // Calculate display scale preserving 1000:550 aspect ratio without clipping
    let targetWidth, targetHeight;

    if (DeviceManager.isAndroid()) {
      // Android mobile viewport constrained proportionally
      const maxW = Math.min(availWidth - 12, 650);
      const maxH = Math.min(availHeight - 80, 360);
      const scale = Math.min(maxW / GAME_WIDTH, maxH / GAME_HEIGHT);
      targetWidth = Math.round(GAME_WIDTH * scale);
      targetHeight = Math.round(GAME_HEIGHT * scale);
    } else {
      // PC arcade viewport constrained proportionally up to 960x528
      const maxW = Math.min(availWidth - 32, 960);
      const maxH = Math.min(availHeight - 32, 528);
      const scale = Math.min(maxW / GAME_WIDTH, maxH / GAME_HEIGHT);
      targetWidth = Math.round(GAME_WIDTH * scale);
      targetHeight = Math.round(GAME_HEIGHT * scale);
    }

    // Set CSS display dimensions on viewport
    viewport.style.width = targetWidth + 'px';
    viewport.style.height = targetHeight + 'px';

    // Canvas internal buffer matches fixed logical world resolution (with DPR sharpness)
    const dpr = window.devicePixelRatio || 1;
    GameManager.canvas.width = Math.round(GAME_WIDTH * dpr);
    GameManager.canvas.height = Math.round(GAME_HEIGHT * dpr);
    GameManager.canvas.style.width = targetWidth + 'px';
    GameManager.canvas.style.height = targetHeight + 'px';

    // Scale canvas context to map logical 1000x550 coordinates to high-DPI buffer
    GameManager.ctx.setTransform(1, 0, 0, 1, 0, 0);
    GameManager.ctx.scale(dpr, dpr);
  }

  // ==========================================================================
  // 23. INITIALIZATION ORDER
  // ==========================================================================
  SettingsManager.init();
  SpaceRenderer.setTheme(SettingsManager.get('theme') || 'deep-space');
  GameManager.init();
  lastTime = performance.now();
  fpsLastTime = lastTime;
  requestAnimationFrame(loop);

})();
