// lab.js - Simplified using common.js
document.addEventListener('DOMContentLoaded', () => {
  class LabRoom extends PortfolioRoom {
    constructor() {
      const config = {
        roomName: 'lab',
        characterName: 'tein',
        characterPadding: '1px',
        characterZIndex: '4',
        staticSprite: 'sprites/characters/tein.webp',
        walkingSprite: 'gif/characters/teinwalk.gif',
        characterAudioVolume: 0.65,
        
        patrol: {
          speedPct: 0.13,
          baseOffsetRatio: 16/176,
          leftBoundaryPct: 0.001,
          rightBoundaryPct: 0.2
        },
        
        characterAudio: {
          t1: 'tein1',
          t2: 'tein2',
          t3: 'tein3'
        },
        
        additionalAudio: {
          bob1: 'bob1',
          bob2: 'bob2', 
          bob3: 'bob3',
          glass: 'glass'
        },
        
        additionalAudioVolumes: {
          bob1: 0.3,
          bob2: 0.3,
          bob3: 0.3,
          glass: 0.3
        },
        
        characterDialogue: [
          { text: "Welcome. This is the Projectarium.", audio: 't1' },
          { text: "Each terminal logs a deployed prototype, experiment, or system utility from Inder's active portfolio.", audio: 't2' },
          { text: "Modules update in real-time. You'll find notes, architecture summaries, and source links available at each station.", audio: 't3' }
        ],
        
        navigation: {
          left: 'index.html',
          right: 'office.html'
        },
        
        objects: ['terminal1', 'terminal2'],
        
        objectHandlers: {
          terminal1: function() { this.openTerminal1(); },
          terminal2: function() { this.openTerminal2(); }
        },
        
        helpMessage: `
          <strong>Welcome to the Projectarium!</strong><br><br>
          Here you'll find Inder's deployed projects and experiments. 
          Each terminal contains different prototypes and systems.<br><br>
          <strong>How to interact:</strong><br>
          • Click on <strong>Tein</strong> to learn about the lab<br>
          • Click on <strong>terminals</strong> to explore projects<br>
          • Use the <strong>navigation buttons</strong> to move between rooms
        `,
        
        initialState: {
          bobCurrentPage: 0,
          bobInteracted: false,
          bobInProgress: false,
          bobGlassEndListener: null
        }
      };
      
      super(config);
      this.objectViewer = this.createObjectViewer();
    }

    isAnySpecialInteraction() {
      return this.state.bobInProgress;
    }

    isSpecialOverlayInteraction() {
      return this.state.bobInProgress;
    }

    onOverlayClose() {
      if (this.state.bobInProgress) {
        this.elements.glass.pause();
        this.elements.glass.currentTime = 0;
        
        if (this.state.bobGlassEndListener) {
          this.elements.glass.removeEventListener('ended', this.state.bobGlassEndListener);
          this.state.bobGlassEndListener = null;
        }
        
        [this.elements.bob1, this.elements.bob2, this.elements.bob3].forEach(audio => {
          audio.pause();
          audio.currentTime = 0;
        });
        
        this.state.bobInProgress = false;
        console.log('Bob interaction cleaned up due to overlay close');
      }
    }

    async runDialogueSequence() {
      // Show first two dialogue lines with "Next"
      await this.dialogue.showLine(this.config.characterDialogue[0].text, 't1', 'Next');
      await this.dialogue.showLine(this.config.characterDialogue[1].text, 't2', 'Next');
      
      // Last dialogue line with "Done" - clicking this ends the conversation
      await this.dialogue.showLine(this.config.characterDialogue[2].text, 't3', 'Done');
      
      this.dialogue.hide();
    }

    openTerminal1() {
      this.objectViewer.open('sprites/objects/labobjects/terminal1close.webp', this.TERMINAL1_OBJECTS);
    }

    openTerminal2() {
      this.objectViewer.open('sprites/objects/labobjects/terminal2close.webp', this.TERMINAL2_OBJECTS);
    }

    createHotspot(obj, scale, wrapper) {
      if (obj.type === 'bob') {
        return this.createBobHotspot(obj, scale, wrapper);
      } else {
        return super.createHotspot(obj, scale, wrapper);
      }
    }

    createBobHotspot(obj, scale, wrapper) {
      const hotspot = new Image();
      hotspot.src = `sprites/objects/labobjects/${obj.file}`;
      hotspot.className = 'closeup-object';
      hotspot.dataset.bobSkull = 'true';
      
      // Add onload handler to make BOB visible (critical CSS requirement)
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

      hotspot.addEventListener('mouseenter', () => {
        hotspot.style.animation = 'none';
        hotspot.style.transform = 'scale(1.1)';
      });
      hotspot.addEventListener('mouseleave', () => {
        hotspot.style.transform = '';
        hotspot.style.animation = `book-jiggle 2s ease-in-out infinite ${existingHotspots * 0.3}s`;
      });
      hotspot.addEventListener('click', e => {
        e.stopPropagation();
        this.showBobDialogue(obj, hotspot);
      });

      wrapper.appendChild(hotspot);
      return hotspot;
    }

    showBobDialogue(obj, hotspotImg) {
      if (this.state.bobInProgress) return;
      
      if (this.state.bobInteracted) {
        this.showShortBobMessage(obj);
        return;
      }
      
      this.state.bobInProgress = true;
      
      console.log('Playing glass sound and opening Bob\'s eyes (phase 1)');
      this.elements.glass.currentTime = 0;
      hotspotImg.src = 'sprites/objects/labobjects/skullopen1.webp';
      
      // Ensure the new image is visible
      hotspotImg.onload = () => {
        hotspotImg.classList.add('loaded');
        hotspotImg.style.opacity = '1';
      };
      
      this.elements.glass.play().catch((e) => {
        console.error('Failed to play glass sound:', e);
      });
      
      this.state.bobGlassEndListener = () => {
        console.log('Glass sound finished, starting dialog with skullopen2.webp');
        hotspotImg.src = 'sprites/objects/labobjects/skullopen2.webp';
        
        // Ensure the talking image is visible
        hotspotImg.onload = () => {
          hotspotImg.classList.add('loaded');
          hotspotImg.style.opacity = '1';
        };
        
        this.showFullBobDialogue(obj, hotspotImg);
        this.state.bobGlassEndListener = null;
      };
      
      this.elements.glass.addEventListener('ended', this.state.bobGlassEndListener, { once: true });
    }

    showShortBobMessage(obj) {
      const shortMessage = `>> ENTRY #002: PRC-MGMT-XLSYS\n• NAME: Payroll Management System (VBA)\n• STATUS: DEPLOYED – IN USE\n• TYPE: Business Automation – Excel Macros\n• SUMMARY: A complete biweekly payroll system built for a real daycare. Handles staff, time periods, and outputs a ready-to-send summary sheet.\n• NOTES: Fully macro-driven, no external dependencies, surprisingly robust.\n>> LINK: https://github.com/Indrr27/PayrollVBA`;

      this.dialogue.clear();
      const processedText = this.makeLinksClickable(shortMessage.split('\n').map(line => line.trim()).join('<br>'));
      this.dialogue.show(`<strong>${obj.name}</strong><br>${processedText}`);
      
      const btn = document.createElement('button');
      btn.textContent = 'Close';
      this.elements.dialogueButtons.appendChild(btn);
      
      btn.addEventListener('click', () => {
        this.dialogue.hide();
        this.dialogue.clear();
      }, { once: true });
    }

    showFullBobDialogue(obj, hotspotImg) {
      const pages = obj.pages;
      this.state.bobCurrentPage = 0;
      
      const render = () => {
        this.dialogue.clear();
        const text = pages[this.state.bobCurrentPage]
          .split('\n')
          .map(line => line.trim())
          .join('<br>');
        const processedText = this.makeLinksClickable(text);
        this.dialogue.show(`<strong>${obj.name}</strong><br>${processedText}`);
        
        if (this.state.bobCurrentPage < 3) {
          const audioElement = this.elements[`bob${this.state.bobCurrentPage + 1}`];
          console.log('Playing Bob audio:', `bob${this.state.bobCurrentPage + 1}`);
          audioElement.currentTime = 0;
          audioElement.play().catch((e) => {
            console.error('Failed to play Bob audio:', e);
          });
        }
        
        const btn = document.createElement('button');
        btn.textContent = this.state.bobCurrentPage < pages.length - 1 ? 'Next' : 'Close';
        this.elements.dialogueButtons.appendChild(btn);
        
        btn.addEventListener('click', () => {
          [this.elements.bob1, this.elements.bob2, this.elements.bob3].forEach(audio => audio.pause());
          
          if (this.state.bobCurrentPage < pages.length - 1) {
            this.state.bobCurrentPage++;
            render();
          } else {
            this.dialogue.hide();
            this.dialogue.clear();
            
            // Reset Bob to closed eyes with proper loading
            hotspotImg.src = 'sprites/objects/labobjects/skull.webp';
            hotspotImg.onload = () => {
              hotspotImg.classList.add('loaded');
              hotspotImg.style.opacity = '1';
            };
            
            this.state.bobCurrentPage = 0;
            this.state.bobInteracted = true;
            this.state.bobInProgress = false;
          }
        }, { once: true });
      };
      
      render();
    }

    showObjectDetail(obj) {
      // Close any existing Bob dialogue first
      if (!this.elements.dialogue.classList.contains('hidden')) {
        [this.elements.bob1, this.elements.bob2, this.elements.bob3].forEach(audio => audio.pause());
        this.state.bobInProgress = false;
      }
      
      super.showObjectDetail(obj);
    }

    get TERMINAL1_OBJECTS() {
      return [
        {
          name: 'Project Log: House of Errors',
          file: 'text1.webp',
          x: 64, y: 63, w: 129, h: 52,
          pages: [
            ">> LAB ENTRY: PROJECT_RLS-PIXSPRINT\n• NAME: HouseOfErrors Art Competition – 2D Racing Game\n• STATUS: ARCHIVED – FULL RELEASE\n• TYPE: Game Development – Love2D Engine\n• SUMMARY: Fast-paced cycling meets hand-drawn pixel art. Includes AI opponents, transitions, and a built-in gallery.\n>> LINK: https://github.com/Indrr27/HouseOfErrors-Art-Comp"
          ]
        }
      ];
    }

    get TERMINAL2_OBJECTS() {
      return [
        {
          name: 'BOB (System Monitor)',
          file: 'skull.webp',
          type: 'bob',
          x: 28, y: 63, w: 64, h: 55,
          pages: [
            "OH!! A user! A real user! Someone to actually talk to, YIPPPPYYYYY.",
            "Welcome to Terminal Node 2. I'm BOB. I monitor Tein's workload. He builds things... then forgets they exist.",
            "ANYWAY. You're here, so let's check out one of Inder's more refined creations.",
            ">> ENTRY #002: PRC-MGMT-XLSYS\n• NAME: Payroll Management System (VBA)\n• STATUS: DEPLOYED – IN USE\n• TYPE: Business Automation – Excel Macros\n• SUMMARY: A complete biweekly payroll system built for a real daycare. Handles staff, time periods, and outputs a ready-to-send summary sheet.\n• NOTES: Fully macro-driven, no external dependencies, surprisingly robust.\n>> LINK: https://github.com/Indrr27/PayrollVBA"
          ]
        },
        {
          name: 'Project Log: Image Processing Pipeline',
          file: 'text2.webp',
          x: 129, y: 143, w: 75, h: 16,
          pages: [
            ">> LAB ENTRY: CP467-IMGPROC\n• NAME: Image Processing Pipeline\n• STATUS: COMPLETED – COURSE PROJECT\n• TYPE: Computer Vision – OpenCV (Python)\n• SUMMARY: Built a visual pipeline with object detection, bounding boxes, and stitched panoramas.\n• NOTES: All logic used traditional CV methods — no deep learning. Great intro to real-world image systems.\n>> LINK: https://github.com/Indrr27/image-processing-pipeline-cp467"
          ]
        }
      ];
    }
  }

  // Initialize the lab room
  new LabRoom();
});