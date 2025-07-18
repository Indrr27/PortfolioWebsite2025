// common.js - Shared functionality for pixel portfolio rooms
class PortfolioRoom {
  constructor(config) {
    this.config = config;
    this.elements = {};
    this.clickHandlers = new Map(); // Track click handlers to prevent duplicates
    this.assetsLoaded = false;
    this.state = {
      characterInteracting: false,
      currentOverlay: null,
      helpDialogueOpen: false,
      bgmMuted: this.loadAudioPreference('bgmMuted', true), // Default to muted for new users
      bgmStarted: false,
      hasEverInteracted: this.loadAudioPreference('hasEverInteracted', false),
      hasMetCharacter: this.loadAudioPreference('hasMetCharacter', false), // New flag for character meeting
      currentAudio: null,
      patrol: {
        active: true,
        frameId: null,
        x: 0,
        dir: 1,
        posRatio: 0,
        saved: { x: 0, dir: 1, posRatio: 0 }
      },
      ...config.initialState
    };
    
    this.init();
  }

  // Audio preference persistence
  loadAudioPreference(key, defaultValue) {
    try {
      const saved = localStorage.getItem(`pixelPortfolio_${key}`);
      return saved !== null ? JSON.parse(saved) : defaultValue;
    } catch (e) {
      console.warn('Could not load audio preference:', e);
      return defaultValue;
    }
  }

  saveAudioPreference(key, value) {
    try {
      localStorage.setItem(`pixelPortfolio_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn('Could not save audio preference:', e);
    }
  }

  // Music choice handling for first-time users
  handleMusicChoice(wantsMusic) {
    this.state.hasEverInteracted = true;
    this.state.hasMetCharacter = true; // Mark that they've met the character
    this.saveAudioPreference('hasEverInteracted', true);
    this.saveAudioPreference('hasMetCharacter', true);
    
    if (wantsMusic) {
      this.state.bgmMuted = false;
      this.saveAudioPreference('bgmMuted', false);
      this.elements.bgm.muted = false;
      this.elements.controls.volume.classList.remove('muted');
      
      // Start playing BGM now that user has explicitly chosen to enable it
      this.safePlayAudio(this.elements.bgm, 'user-music-choice').then(() => {
        this.state.bgmStarted = true;
        console.log('BGM started after user chose to enable music');
      });
    } else {
      this.state.bgmMuted = true;
      this.saveAudioPreference('bgmMuted', true);
      this.elements.bgm.muted = true;
      this.elements.controls.volume.classList.add('muted');
      console.log('User chose to keep music muted');
    }
  }

  // Handle user interaction for BGM unmuting - simplified
  handleUserInteraction() {
    // This is now just a placeholder - BGM control happens through explicit choice
    // in character dialogue rather than automatic detection
  }

  removeBGMListeners() {
    // No longer needed - kept for compatibility
  }

  // Utility methods for better click handling
  safePlayAudio(audioElement, context = 'unknown') {
    if (!audioElement) return Promise.resolve();
    
    return audioElement.play().catch(error => {
      console.log(`Audio play blocked (${context}):`, error.message);
      return Promise.resolve(); // Return resolved promise to avoid uncaught rejections
    });
  }

  addClickHandler(element, handler, options = {}) {
    if (!element) return;
    
    const key = element.id || element.className || Math.random().toString(36);
    
    // Remove existing handler if present
    if (this.clickHandlers.has(key)) {
      element.removeEventListener('click', this.clickHandlers.get(key));
    }
    
    // Simple handler without debouncing for better responsiveness
    const clickHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Trigger BGM unmute on any click (for classroom first interaction)
      this.handleUserInteraction();
      
      // Simple double-click prevention using timestamps
      const now = Date.now();
      const lastClick = element._lastClick || 0;
      
      // Only prevent if clicks are within 50ms (very fast double clicks)
      if (now - lastClick < 50) {
        return;
      }
      
      element._lastClick = now;
      handler(e);
    };
    
    // Store and add new handler
    this.clickHandlers.set(key, clickHandler);
    element.addEventListener('click', clickHandler, { 
      passive: false,
      ...options 
    });
  }

  init() {
    this.cacheElements();
    this.hideRoomUntilLoaded();
    // Set character to static sprite and hide it completely
    if (this.elements.character) {
      this.elements.character.src = this.config.staticSprite;
      this.elements.character.style.opacity = '0';
    }
    this.preloadCriticalAssets().then(() => {
      this.showRoom();
      this.createCharacterContainer();
      // Initialize interactions immediately for better responsiveness
      this.initAudio();
      this.initControls();
      this.initObjects();
      this.initResize();
      
      // Character interaction can wait until character is visible
      setTimeout(() => {
        this.initCharacterInteraction();
        this.showCharacterAndStartPatrol();
      }, 50);
    });
  }

  hideRoomUntilLoaded() {
    // Hide the main room content until assets are loaded
    if (this.elements.view) {
      this.elements.view.style.opacity = '0';
      this.elements.view.style.transition = 'opacity 0.2s ease-out'; // Faster room transition
    }
  }

  showRoom() {
    // Show the room with a smooth fade-in
    if (this.elements.view) {
      this.elements.view.style.opacity = '1';
    }
    
    this.assetsLoaded = true;
  }

  showCharacterAndStartPatrol() {
    // Position character correctly BEFORE making it visible
    this.positionCharacterInitially();
    
    // Switch to walking sprite immediately (no static appearance)
    if (this.elements.character) {
      this.elements.character.src = this.config.walkingSprite;
      this.elements.character.style.transition = 'opacity 0.15s ease-out';
      this.elements.character.style.opacity = '1';
    }
    
    // Make character container visible
    if (this.characterContainer) {
      this.characterContainer.style.opacity = '1';
    }
    
    // Start patrol immediately (character is already walking)
    this.initPatrol();
  }

  showCharacter() {
    // Keep this method for other uses, but make it consistent
    this.positionCharacterInitially();
    
    if (this.elements.character) {
      this.elements.character.style.transition = 'opacity 0.15s ease-out';
      this.elements.character.style.opacity = '1';
    }
    
    if (this.characterContainer) {
      this.characterContainer.style.opacity = '1';
    }
  }

  positionCharacterInitially() {
    if (!this.characterContainer || !this.elements.view) return;
    
    const rect = this.elements.view.getBoundingClientRect();
    const containerWidth = this.characterContainer.offsetWidth;
    const maxX = rect.width - containerWidth;
    const leftBound = rect.width * this.config.patrol.leftBoundaryPct;
    const bottomOffset = rect.height * this.config.patrol.baseOffsetRatio;
    
    // Start character at left boundary of patrol area
    const initialX = leftBound;
    this.state.patrol.x = initialX;
    this.state.patrol.posRatio = initialX / maxX;
    this.state.patrol.dir = 1; // Start moving right
    
    // Set initial position immediately
    this.characterContainer.style.left = initialX + 'px';
    this.characterContainer.style.bottom = bottomOffset + 'px';
    this.elements.character.style.transform = 'scaleX(1)'; // Facing right
  }

  preloadCriticalAssets() {
    return new Promise((resolve) => {
      const imagesToPreload = [
        this.config.staticSprite,
        this.config.walkingSprite
      ];

      // Add room-specific background if it exists
      const sceneElement = document.getElementById(`${this.config.roomName}-scene`);
      if (sceneElement && sceneElement.src) {
        imagesToPreload.push(sceneElement.src);
      }

      // Find and add any background images from CSS
      if (this.elements.view) {
        const computedStyle = window.getComputedStyle(this.elements.view);
        const bgImage = computedStyle.backgroundImage;
        if (bgImage && bgImage !== 'none') {
          const urlMatch = bgImage.match(/url\(["']?([^"']+)["']?\)/);
          if (urlMatch) {
            imagesToPreload.push(urlMatch[1]);
          }
        }
      }

      let loadedCount = 0;
      const totalImages = imagesToPreload.length;

      if (totalImages === 0) {
        resolve();
        return;
      }

      // Shorter timeout for faster response - don't wait too long
      const timeout = setTimeout(() => {
        console.log('Asset loading timeout, showing room anyway');
        resolve();
      }, 1500); // Reduced from 2000ms to 1500ms

      const checkComplete = () => {
        loadedCount++;
        if (loadedCount >= totalImages) {
          clearTimeout(timeout);
          // Immediate resolve for faster response
          resolve();
        }
      };

      imagesToPreload.forEach(src => {
        if (!src) {
          checkComplete();
          return;
        }

        const img = new Image();
        img.onload = checkComplete;
        img.onerror = checkComplete; // Continue even if an image fails
        img.src = src;
      });
    });
  }

  cacheElements() {
    const { roomName, characterName } = this.config;
    
    // Audio
    this.elements.bgm = document.getElementById('bgm');
    this.elements.characterAudio = {};
    
    // Cache character-specific audio
    Object.keys(this.config.characterAudio || {}).forEach(key => {
      this.elements.characterAudio[key] = document.getElementById(this.config.characterAudio[key]);
    });

    // Characters and scene
    this.elements.character = document.getElementById(characterName);
    this.elements.view = document.getElementById(`${roomName}-view`);
    
    // UI elements
    this.elements.dialogue = document.getElementById('dialogue');
    this.elements.dialogueText = document.getElementById('dialogue-text');
    this.elements.dialogueButtons = document.getElementById('dialogue-buttons');
    
    // Controls
    this.elements.controls = {
      help: document.getElementById('help'),
      left: document.getElementById('left'),
      right: document.getElementById('right'),
      volume: document.getElementById('volume')
    };

    // Objects
    this.elements.objects = {};
    (this.config.objects || []).forEach(objId => {
      this.elements.objects[objId] = document.getElementById(objId);
    });

    // Room-specific audio
    if (this.config.additionalAudio) {
      Object.keys(this.config.additionalAudio).forEach(key => {
        this.elements[key] = document.getElementById(this.config.additionalAudio[key]);
      });
    }
  }

  createCharacterContainer() {
    const { characterName } = this.config;
    const character = this.elements.character;
    
    const container = document.createElement('div');
    container.id = `${characterName}-container`;
    Object.assign(container.style, {
      position: 'absolute',
      bottom: '0',
      left: character.style.left || '20%',
      pointerEvents: 'auto',
      transformOrigin: 'center bottom',
      padding: this.config.characterPadding || '8px',
      zIndex: this.config.characterZIndex || '2',
      cursor: 'pointer',
      transition: 'transform 0.1s ease-out, opacity 0.15s ease-out', // Faster, smoother transition
      opacity: '0' // Start hidden
    });
    
    character.parentNode.insertBefore(container, character);
    container.appendChild(character);
    
    // Improved hover effects with better click handling
    let isMouseOver = false;
    let hoverTimeout = null;
    
    container.addEventListener('mouseenter', () => {
      isMouseOver = true;
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        if (isMouseOver) {
          container.style.transform = 'scale(1.1)';
        }
      }, 20); // Much faster hover response
    });
    
    container.addEventListener('mouseleave', () => {
      isMouseOver = false;
      clearTimeout(hoverTimeout);
      container.style.transform = '';
    });
    
    // Ensure click always works even during hover animations
    container.addEventListener('mousedown', () => {
      container.style.pointerEvents = 'auto';
    });
    
    container.isMouseOver = () => isMouseOver;
    this.characterContainer = container;
  }

  initAudio() {
    // BGM setup
    this.elements.bgm.volume = 0.05;
    this.elements.bgm.loop = true;
    this.elements.bgm.muted = this.state.bgmMuted;
    
    // Don't attempt to play BGM until user has interacted
    // Only play if they've already made a choice (returning user)
    if (this.state.hasEverInteracted && !this.state.bgmMuted) {
      this.safePlayAudio(this.elements.bgm, `${this.config.roomName}-returning-user`);
    }
    // For new users, BGM will start when they make their choice in handleMusicChoice()
    
    // Set character audio volumes
    Object.values(this.elements.characterAudio).forEach(audio => {
      audio.volume = this.config.characterAudioVolume || 0.7;
      if (audio.load) audio.load();
    });

    // Set additional audio volumes
    if (this.config.additionalAudioVolumes) {
      Object.keys(this.config.additionalAudioVolumes).forEach(key => {
        if (this.elements[key]) {
          this.elements[key].volume = this.config.additionalAudioVolumes[key];
        }
      });
    }

    // Update volume button appearance based on saved state
    this.elements.controls.volume.classList.toggle('muted', this.state.bgmMuted);
  }

  setupBGMUnmute() {
    this.bgmUnmuteHandler = () => {
      if (!this.state.bgmStarted && !this.state.bgmMuted) {
        this.elements.bgm.muted = false;
        this.elements.bgm.volume = 0.05;
        this.state.bgmStarted = true;
        this.state.hasEverInteracted = true;
        this.saveAudioPreference('hasEverInteracted', true);
        console.log('BGM unmuted after user interaction (document level)');
        
        this.removeBGMListeners();
      }
    };
    
    document.addEventListener('click', this.bgmUnmuteHandler);
    document.addEventListener('keydown', this.bgmUnmuteHandler);
    document.addEventListener('touchstart', this.bgmUnmuteHandler);
  }

  setupBGMStart() {
    this.bgmStartHandler = () => {
      if (!this.state.bgmStarted && !this.state.bgmMuted) {
        this.elements.bgm.muted = false;
        this.elements.bgm.volume = 0.1;
        this.elements.bgm.loop = true;
        this.safePlayAudio(this.elements.bgm, 'user-interaction').then(() => {
          this.state.bgmStarted = true;
          this.state.hasEverInteracted = true;
          this.saveAudioPreference('hasEverInteracted', true);
          console.log('BGM started after user interaction (document level)');
          
          this.removeBGMListeners();
        });
      }
    };
    
    document.addEventListener('click', this.bgmStartHandler);
    document.addEventListener('keydown', this.bgmStartHandler);
    document.addEventListener('touchstart', this.bgmStartHandler);
  }

  initControls() {
    // Volume toggle - controls BGM only
    this.addClickHandler(this.elements.controls.volume, () => {
      this.state.bgmMuted = !this.state.bgmMuted;
      this.state.hasEverInteracted = true;
      this.saveAudioPreference('bgmMuted', this.state.bgmMuted);
      this.saveAudioPreference('hasEverInteracted', true);
      
      // Simple BGM mute control
      this.elements.bgm.muted = this.state.bgmMuted;
      this.elements.controls.volume.classList.toggle('muted', this.state.bgmMuted);
      
      // If unmuting and BGM isn't playing, try to start it
      if (!this.state.bgmMuted && !this.state.bgmStarted) {
        this.safePlayAudio(this.elements.bgm, 'volume-toggle').then(() => {
          this.state.bgmStarted = true;
        });
      }
    });

    // Help button
    this.addClickHandler(this.elements.controls.help, () => {
      if (this.state.characterInteracting || this.state.helpDialogueOpen || this.isAnySpecialInteraction()) return;
      this.showHelpDialogue();
    });

    // Navigation buttons
    this.addClickHandler(this.elements.controls.left, () => {
      window.location.href = this.config.navigation.left;
    });

    this.addClickHandler(this.elements.controls.right, () => {
      window.location.href = this.config.navigation.right;
    });
  }

  isAnySpecialInteraction() {
    // Override in subclasses for room-specific interaction checks
    return false;
  }

  showHelpDialogue() {
    this.state.helpDialogueOpen = true;
    this.dialogue.clear();
    this.dialogue.show(this.config.helpMessage);
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Got it!';
    this.elements.dialogueButtons.appendChild(closeBtn);
    
    this.addClickHandler(closeBtn, () => {
      this.dialogue.hide();
      this.dialogue.clear();
      this.state.helpDialogueOpen = false;
    });
  }

  stopCurrentAudio() {
    if (this.state.currentAudio) {
      try {
        this.state.currentAudio.pause();
        this.state.currentAudio.currentTime = 0;
      } catch (error) {
        console.log('Error stopping audio:', error.message);
      }
      this.state.currentAudio = null;
    }
  }

  // Dialogue system
  get dialogue() {
    return {
      clear: () => {
        this.elements.dialogueButtons.innerHTML = '';
      },
      
      show: (html) => {
        this.elements.dialogueText.innerHTML = html;
        this.elements.dialogue.classList.remove('hidden');
      },
      
      hide: () => {
        this.elements.dialogue.classList.add('hidden');
      },
      
      showLine: async (text, audioKey, buttonText = 'Next') => {
        return new Promise(resolve => {
          this.stopCurrentAudio();
          
          this.dialogue.clear();
          this.dialogue.show(text);
          
          const nextBtn = document.createElement('button');
          nextBtn.textContent = buttonText;
          this.elements.dialogueButtons.appendChild(nextBtn);
          
          if (audioKey && this.elements.characterAudio[audioKey]) {
            const audio = this.elements.characterAudio[audioKey];
            audio.currentTime = 0;
            this.state.currentAudio = audio;
            this.safePlayAudio(audio, `dialogue-${audioKey}`);
          }
          
          this.addClickHandler(nextBtn, () => {
            if (this.state.currentAudio) {
              this.state.currentAudio.pause();
              this.state.currentAudio.currentTime = 0;
              this.state.currentAudio = null;
            }
            resolve();
          });
        });
      },
      
      showChoice: async (text, options, audioKey = null) => {
        return new Promise(resolve => {
          this.stopCurrentAudio();
          
          this.dialogue.clear();
          this.dialogue.show(text);
          
          if (audioKey && this.elements.characterAudio[audioKey]) {
            const audio = this.elements.characterAudio[audioKey];
            audio.currentTime = 0;
            this.state.currentAudio = audio;
            this.safePlayAudio(audio, `choice-${audioKey}`);
          }
          
          options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.textContent = opt;
            this.elements.dialogueButtons.appendChild(btn);
            this.addClickHandler(btn, () => {
              if (this.state.currentAudio) {
                this.state.currentAudio.pause();
                this.state.currentAudio.currentTime = 0;
                this.state.currentAudio = null;
              }
              resolve(index);
            });
          });
        });
      }
    };
  }

  initCharacterInteraction() {
    this.addClickHandler(this.characterContainer, () => {
      if (!this.state.characterInteracting && !this.state.helpDialogueOpen && !this.isAnySpecialInteraction()) {
        this.startCharacterConversation();
      }
    });
  }

  async startCharacterConversation() {
    this.state.characterInteracting = true;
    
    // Save patrol state
    this.state.patrol.saved = {
      x: this.state.patrol.x,
      dir: this.state.patrol.dir,
      posRatio: this.state.patrol.posRatio
    };
    this.stopPatrol(); // This will switch to static sprite

    // Run dialogue sequence
    await this.runDialogueSequence();

    // Restore patrol
    Object.assign(this.state.patrol, this.state.patrol.saved);
    this.startPatrol(); // This will switch back to walking sprite
    this.state.characterInteracting = false;
  }

  async runDialogueSequence() {
    // Override in room-specific implementations
    const dialogues = this.config.characterDialogue;
    for (let i = 0; i < dialogues.length; i++) {
      const isLast = i === dialogues.length - 1;
      await this.dialogue.showLine(
        dialogues[i].text, 
        dialogues[i].audio, 
        isLast ? 'Exit' : 'Next'
      );
    }
    
    this.dialogue.hide();
  }

  initObjects() {
    Object.keys(this.elements.objects).forEach(objId => {
      const element = this.elements.objects[objId];
      const handler = this.config.objectHandlers[objId];
      
      if (element && handler) {
        this.addClickHandler(element, () => {
          if (this.state.characterInteracting || this.state.helpDialogueOpen || this.isAnySpecialInteraction()) return;
          handler.call(this);
        });
      }
    });
  }

  // Patrol system
  initPatrol() {
    // Only start patrol if assets are loaded
    if (this.assetsLoaded) {
      this.startPatrol();
    }
  }

  startPatrol() {
    // Double-check assets are loaded before starting patrol
    if (!this.assetsLoaded) {
      setTimeout(() => this.startPatrol(), 50);
      return;
    }

    this.state.patrol.active = true;
    
    // Only set walking sprite if not already set (prevents duplicate switching)
    if (this.elements.character && this.elements.character.src !== this.config.walkingSprite) {
      this.elements.character.src = this.config.walkingSprite;
    }
    
    const rect = this.elements.view.getBoundingClientRect();
    const containerWidth = this.characterContainer.offsetWidth;
    const maxX = rect.width - containerWidth;
    const leftBound = rect.width * this.config.patrol.leftBoundaryPct;
    const rightBound = rect.width * this.config.patrol.rightBoundaryPct;
    
    this.state.patrol.x = this.state.patrol.x || (this.state.patrol.posRatio * maxX);
    this.state.patrol.x = Math.max(leftBound, Math.min(this.state.patrol.x, maxX - rightBound));

    let lastTime = performance.now();
    cancelAnimationFrame(this.state.patrol.frameId);

    const animate = (now) => {
      if (!this.state.patrol.active) return;
      
      if (this.characterContainer.isMouseOver()) {
        lastTime = now;
        this.state.patrol.frameId = requestAnimationFrame(animate);
        return;
      }
      
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;
      
      this.updatePatrolPosition(deltaTime);
      this.state.patrol.frameId = requestAnimationFrame(animate);
    };

    this.state.patrol.frameId = requestAnimationFrame(animate);
  }

  stopPatrol() {
    this.state.patrol.active = false;
    cancelAnimationFrame(this.state.patrol.frameId);
    // Switch back to static sprite when stopping patrol
    if (this.elements.character) {
      this.elements.character.src = this.config.staticSprite;
    }
  }

  updatePatrolPosition(deltaTime) {
    const rect = this.elements.view.getBoundingClientRect();
    const containerWidth = this.characterContainer.offsetWidth;
    const maxX = rect.width - containerWidth;
    const leftBound = rect.width * this.config.patrol.leftBoundaryPct;
    const rightBound = rect.width * this.config.patrol.rightBoundaryPct;
    const bottomOffset = rect.height * this.config.patrol.baseOffsetRatio;

    // Update position
    this.state.patrol.x += this.state.patrol.dir * (rect.width * this.config.patrol.speedPct) * deltaTime;
    
    // Boundary check
    if (this.state.patrol.x >= maxX - rightBound) {
      this.state.patrol.x = maxX - rightBound;
      this.state.patrol.dir = -1;
    } else if (this.state.patrol.x <= leftBound) {
      this.state.patrol.x = leftBound;
      this.state.patrol.dir = 1;
    }

    this.state.patrol.posRatio = this.state.patrol.x / maxX;
    
    // Apply position
    this.characterContainer.style.left = this.state.patrol.x + 'px';
    this.characterContainer.style.bottom = bottomOffset + 'px';
    this.elements.character.style.transform = this.state.patrol.dir === 1 ? 'scaleX(1)' : 'scaleX(-1)';
  }

  initResize() {
    window.addEventListener('resize', () => {
      this.handleCharacterResize();
      this.handleOverlayResize();
    });
  }

  handleCharacterResize() {
    const rect = this.elements.view.getBoundingClientRect();
    const bottom = rect.height * this.config.patrol.baseOffsetRatio;
    
    if (this.state.patrol.active) {
      this.startPatrol();
    } else {
      const containerWidth = this.characterContainer.offsetWidth;
      const maxX = rect.width - containerWidth;
      const leftBound = rect.width * this.config.patrol.leftBoundaryPct;
      const rightBound = rect.width * this.config.patrol.rightBoundaryPct;
      const x = Math.max(leftBound, Math.min(this.state.patrol.posRatio * maxX, maxX - rightBound));
      
      this.characterContainer.style.left = x + 'px';
      this.characterContainer.style.bottom = bottom + 'px';
    }
  }

  handleOverlayResize() {
    if (!this.state.currentOverlay) return;
    
    const { baseW, baseH, objects, imgs, zoomFactor } = this.state.currentOverlay;
    const rect = this.elements.view.getBoundingClientRect();
    
    // Use the same scaling logic as loadCloseup
    const maxWidth = rect.width * zoomFactor;
    const maxHeight = rect.height * zoomFactor;
    const scaleX = maxWidth / baseW;
    const scaleY = maxHeight / baseH;
    const scale = Math.min(scaleX, scaleY);
    
    const finalWidth = baseW * scale;
    const finalHeight = baseH * scale;
    
    const container = document.getElementById('object-close-container')?.querySelector('div:nth-child(2)');
    if (!container) return;
    
    // Update wrapper size
    Object.assign(container.style, {
      width: `${finalWidth}px`,
      height: `${finalHeight}px`
    });
    
    // Update background image size
    const bgImg = container.querySelector('img');
    if (bgImg) {
      Object.assign(bgImg.style, {
        width: `${finalWidth}px`,
        height: `${finalHeight}px`
      });
    }

    // Update hotspot positions
    imgs.forEach((img, index) => {
      const obj = objects[index];
      img.style.left = `${obj.x * scale}px`;
      img.style.top = `${obj.y * scale}px`;
      img.style.width = `${obj.w * scale}px`;
      img.style.height = `${obj.h * scale}px`;
    });
  }

  // Object viewer utility (for rooms that need it)
  createObjectViewer() {
    const self = this; // Store reference to maintain context
    return {
      open: (backgroundSrc, objects) => {
        if (document.getElementById('object-close-container')) return;
        
        self.blurScene();
        const container = self.createOverlayContainer();
        const backdrop = self.createBackdrop();
        const wrapper = self.createWrapper();
        
        container.appendChild(backdrop);
        container.appendChild(wrapper);
        self.elements.view.appendChild(container);
        
        self.loadCloseup(wrapper, backgroundSrc, objects);
      },
      
      close: () => {
        const container = document.getElementById('object-close-container');
        if (container) container.remove();
        
        self.unblurScene();
        self.dialogue.hide();
        self.state.currentOverlay = null;
        
        // Room-specific cleanup
        self.onOverlayClose();
      }
    };
  }

  blurScene() {
    const elementsToBlur = [
      `${this.config.roomName}-scene`,
      this.config.characterName,
      ...this.config.objects
    ];
    
    elementsToBlur.forEach(id => {
      const element = document.getElementById(id);
      if (element) element.style.filter = 'blur(4px) brightness(0.6)';
    });
  }

  unblurScene() {
    const elementsToBlur = [
      `${this.config.roomName}-scene`,
      this.config.characterName,
      ...this.config.objects
    ];
    
    elementsToBlur.forEach(id => {
      const element = document.getElementById(id);
      if (element) element.style.filter = '';
    });
  }

  createOverlayContainer() {
    const container = document.createElement('div');
    container.id = 'object-close-container';
    Object.assign(container.style, {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 20
    });
    return container;
  }

  createBackdrop() {
    const backdrop = document.createElement('div');
    Object.assign(backdrop.style, {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.5)',
      pointerEvents: 'auto'
    });
    
    this.addClickHandler(backdrop, () => {
      if (this.elements.dialogue.classList.contains('hidden') && !this.isSpecialOverlayInteraction()) {
        // Close the overlay by calling the close method directly
        const container = document.getElementById('object-close-container');
        if (container) container.remove();
        
        this.unblurScene();
        this.dialogue.hide();
        this.state.currentOverlay = null;
        this.onOverlayClose();
      }
    });
    
    return backdrop;
  }

  createWrapper() {
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%,-50%)',
      pointerEvents: 'auto'
    });
    return wrapper;
  }

  loadCloseup(wrapper, src, objects) {
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      // Calculate proper scaling to fit within viewport
      const rect = this.elements.view.getBoundingClientRect();
      const zoomFactor = 0.7;
      const maxWidth = rect.width * zoomFactor;
      const maxHeight = rect.height * zoomFactor;
      
      const scaleX = maxWidth / img.naturalWidth;
      const scaleY = maxHeight / img.naturalHeight;
      const scale = Math.min(scaleX, scaleY);
      
      const finalWidth = img.naturalWidth * scale;
      const finalHeight = img.naturalHeight * scale;
      
      // Set image to exact calculated size (no maxWidth/maxHeight)
      Object.assign(img.style, {
        display: 'block',
        width: `${finalWidth}px`,
        height: `${finalHeight}px`,
        imageRendering: 'pixelated',
        opacity: '1'
      });
      
      // Set wrapper to match image size
      wrapper.style.width = `${finalWidth}px`;
      wrapper.style.height = `${finalHeight}px`;
      
      img.classList.add('loaded');
      wrapper.appendChild(img);
      
      // Pass the calculated scale to setupHotspots
      this.setupHotspots(wrapper, img, objects, scale);
    };
    
    img.onerror = () => {
      console.error('Failed to load close-up image:', src);
    };
  }

  setupHotspots(wrapper, bgImage, objects, scale) {
    // Use the scale passed from loadCloseup instead of calculating our own
    const hotspots = objects.map(obj => this.createHotspot(obj, scale, wrapper));
    
    this.state.currentOverlay = {
      baseW: bgImage.naturalWidth,
      baseH: bgImage.naturalHeight,
      objects,
      imgs: hotspots,
      zoomFactor: 0.7 // Keep for resize handling
    };
  }

  createHotspot(obj, scale, wrapper) {
    const hotspot = new Image();
    hotspot.src = this.getHotspotImagePath(obj);
    hotspot.className = 'closeup-object';
    
    // Add onload handler to make hotspots visible (critical CSS requirement)
    hotspot.onload = () => {
      hotspot.classList.add('loaded');
    };
    
    Object.assign(hotspot.style, {
      position: 'absolute',
      left: `${obj.x * scale}px`,
      top: `${obj.y * scale}px`,
      width: `${obj.w * scale}px`,
      height: `${obj.h * scale}px`,
      imageRendering: 'pixelated',
      cursor: 'pointer',
      transition: 'transform 0.2s',
      zIndex: 25,
      pointerEvents: 'auto',
      opacity: '1' // Override critical CSS
    });
    
    const existingHotspots = wrapper.querySelectorAll('img').length;
    hotspot.style.animationDelay = `${existingHotspots * 0.5}s`;
    
    this.setupHotspotEffects(hotspot, obj, existingHotspots);
    wrapper.appendChild(hotspot);
    
    return hotspot;
  }

  getHotspotImagePath(obj) {
    // Default implementation - override in room-specific classes
    return `sprites/objects/${this.config.roomName}objects/${obj.file}`;
  }

  setupHotspotEffects(hotspot, obj, existingHotspots) {
    let hoverTimeout = null;
    
    hotspot.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimeout);
      hotspot.style.animation = 'none';
      hotspot.style.transform = 'scale(1.1)';
    });
    
    hotspot.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimeout);
      hotspot.style.transform = '';
      hoverTimeout = setTimeout(() => {
        hotspot.style.animation = `book-jiggle 2s ease-in-out infinite ${existingHotspots * 0.3}s`;
      }, 50); // Faster animation restart
    });
    
    // Ensure click works even during animations
    hotspot.addEventListener('mousedown', () => {
      hotspot.style.pointerEvents = 'auto';
    });
    
    this.addClickHandler(hotspot, () => {
      this.showObjectDetail(obj);
    });
  }

  showObjectDetail(obj) {
    let currentPage = 0;
    
    const render = () => {
      this.dialogue.clear();
      const text = obj.pages[currentPage]
        .split('\n')
        .map(line => line.trim())
        .join('<br>');
      this.dialogue.show(`<strong>${obj.name}</strong><br>${text}`);
      
      const btn = document.createElement('button');
      btn.textContent = currentPage < obj.pages.length - 1 ? 'Next' : 'Close';
      this.elements.dialogueButtons.appendChild(btn);
      
      this.addClickHandler(btn, () => {
        if (currentPage < obj.pages.length - 1) {
          currentPage++;
          render();
        } else {
          this.dialogue.hide();
          this.dialogue.clear();
        }
      });
    };
    
    render();
  }

  // Override hooks for room-specific behavior
  isSpecialOverlayInteraction() { return false; }
  onOverlayClose() {}

  // Utility to make links clickable
  makeLinksClickable(text) {
    return text.replace(
      /(https:\/\/github\.com\/[^\s<]+)/g,
      '<a href="$1" target="_blank" style="color: #00CED1; text-decoration: underline; cursor: pointer;">$1</a>'
    );
  }
}

// Export for use in other files
window.PortfolioRoom = PortfolioRoom;