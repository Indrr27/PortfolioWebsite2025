// classroom.js - Simplified using common.js
document.addEventListener('DOMContentLoaded', () => {
  class ClassroomRoom extends PortfolioRoom {
    constructor() {
      const config = {
        roomName: 'classroom',
        characterName: 'marty',
        characterPadding: '20px',
        characterZIndex: '2',
        staticSprite: 'sprites/characters/marty.webp',
        walkingSprite: 'gif/characters/martywalk.gif',
        characterAudioVolume: 0.25,
        
        patrol: {
          speedPct: 0.13,
          baseOffsetRatio: 16/176,
          leftBoundaryPct: 0.001,
          rightBoundaryPct: 0.2
        },
        
        characterAudio: {
          m1: 'marty1',
          m2: 'marty2', 
          m3: 'marty3',
          happy: 'martyhappy',
          mad: 'martymad'
        },
        
        characterDialogue: [
          { text: "Hey there, I'm Marty. Welcome to the Classroom of Infinite Knowledge!", audio: 'm1' },
          { text: "Everything Inder has ever learned (and a few things he's Googled) lives in here.", audio: 'm2' },
          { text: "Tell me, am I just a talking pixel, or is Inder a certified genius?", audio: 'm3', choices: ['Genius!', 'Overrated'] }
        ],
        
        navigation: {
          left: 'comms.html',
          right: 'lab.html'
        },
        
        objects: ['bookshelf', 'drawer'],
        
        objectHandlers: {
          bookshelf: function() { this.openBookshelf(); },
          drawer: function() { this.openDrawer(); }
        },
        
        helpMessage: `
          <strong>Welcome to the Classroom of Infinite Knowledge!</strong><br><br>
          Here Inder holds all the things he's learning and learned. 
          Interact with the room to find out more about Inder!<br><br>
          <strong>How to interact:</strong><br>
          • Click on <strong>Marty</strong> to start a conversation<br>
          • Click on <strong>objects</strong> in the room (bookshelf, drawer) to explore<br>
          • Use the <strong>navigation buttons</strong> to move between rooms
        `
      };
      
      super(config);
      this.objectViewer = this.createObjectViewer();
    }

    async runDialogueSequence() {
      // Check if this is first time meeting the character - use specific flag
      console.log('hasMetCharacter:', this.state.hasMetCharacter);
      
      if (!this.state.hasMetCharacter) {
        // First time meeting Marty - ask about music first
        await this.dialogue.showLine("Hey there, I'm Marty. Welcome to the Classroom of Infinite Knowledge!", 'm1');
        
        const musicChoice = await this.dialogue.showChoice(
          "These rooms are kinda quiet... want me to play some background music while you explore?",
          ['Yes, play music!', 'No thanks, keep it quiet'],
          'm1'  // Use same audio file
        );
        
        // Handle music choice
        this.handleMusicChoice(musicChoice === 0);
        
        // Continue with normal dialogue
        await this.dialogue.showLine("Everything Inder has ever learned (and a few things he's Googled) lives in here.", 'm2');
      } else {
        // Returning user - normal dialogue
        await this.dialogue.showLine("Hey there, I'm Marty. Welcome to the Classroom of Infinite Knowledge!", 'm1');
        await this.dialogue.showLine("Everything Inder has ever learned (and a few things he's Googled) lives in here.", 'm2');
      }
      
      // Show choice dialogue (same for both first time and returning users)
      const choice = await this.dialogue.showChoice(
        "Tell me, am I just a talking pixel, or is Inder a certified genius?",
        ['Genius!', 'Overrated'],
        'm3'
      );

      // Show response based on choice
      this.dialogue.clear();
      const response = choice === 0 ? 
        { 
          sprite: 'sprites/characters/martyhappy.webp', 
          audio: 'happy', 
          text: "I'm sooooo happy you think Inder's a genius, I can't even move! (Inder forgot to animate me...)" 
        } : 
        { 
          sprite: 'sprites/characters/martymad.webp', 
          audio: 'mad', 
          text: "I'm sooooo furious you called him overrated, I can't even move! (Inder forgot to animate me...)" 
        };
      
      this.elements.character.src = response.sprite;
      this.dialogue.show(response.text);
      
      const responseAudio = this.elements.characterAudio[response.audio];
      responseAudio.currentTime = 0;
      this.safePlayAudio(responseAudio, `response-${response.audio}`);

      // Wait for exit button
      const exitBtn = document.createElement('button');
      exitBtn.textContent = 'Exit';
      this.elements.dialogueButtons.appendChild(exitBtn);
      
      await new Promise(resolve => {
        exitBtn.addEventListener('click', () => {
          responseAudio.pause();
          this.dialogue.hide();
          resolve();
        }, { once: true });
      });
    }

    openBookshelf() {
      this.objectViewer.open('sprites/objects/classroomobjects/bookshelfclose.webp', this.BOOKSHELF_OBJECTS);
    }

    openDrawer() {
      this.objectViewer.open('sprites/objects/classroomobjects/drawerclose.webp', this.DRAWER_OBJECTS);
    }

    get BOOKSHELF_OBJECTS() {
      return [
        {
          name: 'Book 1:  Foundations of Inder',
          file: 'book1.webp',
          x: 170, y: 31, w: 11, h: 49,
          pages: [
            "A textbook exploring the background, education, and interests of Inder.",
            "Inderpreet Warraich — Software Developer & Systems Builder\nEducation: BSc in Computer Science (Wilfrid Laurier University)\n\nCore Interests:\n  • Systems architecture, digital security, and automation\n  • Low-level tinkering with consoles, embedded systems, and home labs\n  • Focused on building resilient software and infrastructure from the ground up"
          ]
        },
        {
          name: 'Book 2:  Languages, Frameworks & Applied Tooling',
          file: 'book2.webp',
          x: 190, y: 27, w: 15, h: 52,
          pages: [
            "A practical reference guide to the programming languages, libraries, and platforms used by Inder.",
            "Languages:\n  • Python, C++, Java, SQL, HTML/CSS, C#, Lua (Love2D), VBA \n\nFrameworks & Technologies:\n  • Love2D (2D game engine), .NET (Entity Framework), Django\n  • Data: NumPy, pandas, OpenCV, Matplotlib\n  • Infra/DevOps: Git, GitHub Actions, Docker, Azure Pipelines, REST APIs"
          ]
        },
        {
          name: 'Book 3: Hardware Projects & Infrastructure',
          file: 'book3.webp',
          x: 123, y: 115, w: 20, h: 35,
          pages: [
            "A technical volume on real-world experiments in console modding, system-level design, and home server engineering hands-on projects Inder has explored, built, and debugged.",
            "Console Hardware Modding:\n  • PS Vita: Replaced proprietary port with USB-C\n  • Nintendo Switch: Installed Raspberry Pi Pico for persistent CFW\n  • Sega Genesis: Planning Megaswitch HD install (HDMI via FPGA)\n  • Currently working on a hands-on Wii/GameCube project\n\nHome Infrastructure:\n  • Self-hosted server for backup automation & local app hosting\n  • Exploring containerization, VLAN segmentation, remote access hardening"
          ]
        },
        {
          name: 'Book 4: Skyrim Lore I',
          file: 'book4.webp',
          x: 184, y: 106, w: 17, h: 44,
          pages: [
            "A highly abridged selection of personal highlights and reflections from the world of The Elder Scrolls: Skyrim.",
            "• The Nords believe the world was formed when Shor battled Alduin atop the Throat of the World.\n• Dragons don't truly die unless slain by Dragonborn, as their souls are otherwise eternal.\n• The Dwemer vanished after using the Heart of Lorkhan their technology was unmatched.\n• The College of Winterhold teaches magic, but everyone there is suspiciously quiet about it.\n\nThere are over 754 pages of this book\nYou've made it far enough.\nPut the book down."
          ]
        }
      ];
    }

    get DRAWER_OBJECTS() {
      return [
        {
          name: 'Courses & Achievements',
          file: 'paper.webp',
          x: 68, y: 30, w: 98, h: 95,
          pages: [
            "Transcript Excerpt — Honours BSc in Computer Science\nWilfrid Laurier University | GPA: 10.23 / 12.0\n\nSelected Coursework:\n  • Applied Cryptography — A\n  • Data Structures II  — A\n  • Computer Networks — A\n  • Artificial Intelligence — A-\n  • Text Retrieval & Search Engines — A-\n  • Programming Languages & Internet Computing — A+"
          ]
        }
      ];
    }
  }

  // Initialize the classroom
  new ClassroomRoom();
});