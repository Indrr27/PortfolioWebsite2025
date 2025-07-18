// office.js - Simplified using common.js
document.addEventListener('DOMContentLoaded', () => {
  class OfficeRoom extends PortfolioRoom {
    constructor() {
      const config = {
        roomName: 'office',
        characterName: 'lobbie',
        characterPadding: '8px',
        characterZIndex: '4',
        staticSprite: 'sprites/characters/lobbie.webp',
        walkingSprite: 'gif/characters/lobbiewalk.gif',
        characterAudioVolume: 0.25,
        
        patrol: {
          speedPct: 0.13,
          baseOffsetRatio: 16/176,
          leftBoundaryPct: 0.001,
          rightBoundaryPct: 0.2
        },
        
        characterAudio: {
          l1: 'lobbie1',
          l2: 'lobbie2',
          l3: 'lobbie3',
          l4: 'lobbie4',
          l5: 'lobbie5'
        },
        
        characterDialogue: [
          { text: "Oh, uh... welcome to the Archive Room.", audio: 'l1' },
          { text: "My name is Lobbie. I handle document storage... kinda. I mostly just sit around.", audio: 'l2' },
          { text: "This room is supposed to hold Inder's resume. But I forgot to organize the filing cabinets.", audio: 'l3' },
          { text: "Look, if you're here to learn about Inder's professional experience, there are like four filing cabinets with ripped-up pages of his resume, feel free to dig around. I won't stop you.", audio: 'l4' },
          { text: "Anyway… good luck. Hope you find what you're looking for.", audio: 'l5' }
        ],
        
        navigation: {
          left: 'lab.html',
          right: 'comms.html'
        },
        
        objects: ['file', 'paperstack'],
        
        objectHandlers: {
          file: function() { this.openFilingCabinet(); },
          paperstack: function() { this.showPaperstackDialogue(); }
        },
        
        helpMessage: `
          <strong>Welcome to the Archive Room!</strong><br><br>
          Here you'll find Inder's professional documents and resume. 
          The filing cabinets contain his work history.<br><br>
          <strong>How to interact:</strong><br>
          • Click on <strong>Lobbie</strong> to hear about the room<br>
          • Click on the <strong>filing cabinet</strong> to explore resume pages<br>
          • Click on the <strong>paper stack</strong> for... other documents<br>
          • Use the <strong>navigation buttons</strong> to move between rooms
        `,
        
        initialState: {
          paperstackInteracting: false
        }
      };
      
      super(config);
      this.objectViewer = this.createObjectViewer();
    }

    isAnySpecialInteraction() {
      return this.state.paperstackInteracting;
    }

    async runDialogueSequence() {
      // Show all 5 dialogue lines
      for (let i = 0; i < this.config.characterDialogue.length - 1; i++) {
        await this.dialogue.showLine(this.config.characterDialogue[i].text, this.config.characterDialogue[i].audio);
      }
      
      // Last line shows Exit button
      await this.dialogue.showLine(
        this.config.characterDialogue[this.config.characterDialogue.length - 1].text, 
        'l5', 
        'Exit'
      );
      
      this.dialogue.hide();
    }

    openFilingCabinet() {
      this.objectViewer.open('sprites/objects/fileroomobjects/fileclose.webp', this.FILING_CABINET_OBJECTS);
    }

    showPaperstackDialogue() {
      this.state.paperstackInteracting = true;
      let currentPage = 0;
      
      const render = () => {
        this.dialogue.clear();
        const text = this.PAPERSTACK_PAGES[currentPage]
          .split('\n')
          .map(line => line.trim())
          .join('<br>');
        this.dialogue.show(`<strong>Loose Papers</strong><br>${text}`);
        
        const btn = document.createElement('button');
        btn.textContent = currentPage < this.PAPERSTACK_PAGES.length - 1 ? 'Next' : 'Close';
        this.elements.dialogueButtons.appendChild(btn);
        
        btn.addEventListener('click', () => {
          if (currentPage < this.PAPERSTACK_PAGES.length - 1) {
            currentPage++;
            render();
          } else {
            this.dialogue.hide();
            this.dialogue.clear();
            this.state.paperstackInteracting = false;
          }
        }, { once: true });
      };
      
      render();
    }

    getHotspotImagePath(obj) {
      return `sprites/objects/fileroomobjects/${obj.file}`;
    }

    setupHotspotEffects(hotspot, obj, existingHotspots) {
      hotspot.className = 'filing-cabinet-object';
      
      // No animation for filing cabinets
      hotspot.addEventListener('mouseenter', () => {
        hotspot.style.filter = 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.5)) brightness(1.1)';
      });
      hotspot.addEventListener('mouseleave', () => {
        hotspot.style.filter = '';
      });
      hotspot.addEventListener('click', e => {
        e.stopPropagation();
        this.showObjectDetail(obj);
      });
    }

    get FILING_CABINET_OBJECTS() {
      return [
        {
          name: 'File 1: Academic Background',
          file: 'file1.webp',
          x: 37, y: 49, w: 118, h: 58,
          pages: [
            "> A slightly folded sheet marked 'Academic Stuff'. It looks like Inder's educational trail.",
            "GPA: 10.23 / 12.00 — Honours BSc in Computer Science\nWilfrid Laurier University\n\nRelevant Courses:\n  • Object-Oriented Programming\n  • Software Engineering\n  • Applied Cryptography\n  • Artificial Intelligence\n  • Computer Networks\n  • Text Retrieval and Search Engines"
          ]
        },
        {
          name: 'File 2: Work Experience',
          file: 'file2.webp',
          x: 178, y: 59, w: 90, h: 46,
          pages: [
            "> A heavily highlighted resume page with job titles and bullet points. Someone scribbled 'Inder did what?!' in the corner.",
            "Varix Solutions — Founder & Tech Consultant (Apr 2025 – Present)\n  • Launched solo consulting to modernize small businesses' digital tools and security\n  • Delivered full digital overhaul for a local pizzeria with Azure ERP, cloud POS, payroll, banking\n  • Achieved 50% faster financial reporting and smoother daily operations\n  • Performed security reviews and implemented automated controls to protect sensitive data\n  • Built secure APIs connecting Zoho ERP, QuickBooks, and delivery platforms to reduce manual errors\n  • Created SOPs and onboarding materials, cutting training time by 40%\n  • Collaborated closely with business owner to align solutions with operational goals",
            "Roots Corporation — Database Development Intern (Oct 2024 – Apr 2025)\n  • Improved data retrieval speed by 6% via schema design and normalization\n  • Automated inventory and order systems using advanced SQL procedures and triggers\n  • Built Python ETL pipelines consolidating sales and product data, reducing reconciliation time by 10%\n  • Worked cross-functionally to deliver scalable, requirement-driven database solutions",
            "Centum Mortgage Smart Inc. — Cloud Database Intern (May 2021 – Aug 2021)\n  • Optimized PostgreSQL performance with backups, access controls, and tuning, improving speed by 13%\n  • Developed Python pipelines for mortgage data cleaning, cutting processing time by 30%\n  • Supported cloud migration ensuring secure, high-availability data access\n  • Designed Excel + Python dashboards for loan approval trend analysis\n  • Executed access audits and aligned logging for compliance with security best practices"
          ]
        },
        {
          name: 'File 3: Technical Skills',
          file: 'file3.webp',
          x: 37, y: 114, w: 117, h: 61,
          pages: [
            "> A densely typed tech sheet with the words 'NERD STUFF' underlined three times. It lists more acronyms than a startup brochure.",
            "Languages:\n  • Python, C++, Java, SQL, C#, Lua, VBA, HTML, CSS\n\nFrameworks & Libraries:\n  • OpenCV, OpenGL, Stable Baselines3\n  • NumPy, pandas, Matplotlib, Love2D\n\nTools:\n  • Git, GitHub, Jupyter Notebook\n  • Excel (Advanced), VSCode, bash scripting, love.js"
          ]
        },
        {
          name: 'File 4: Professional Development',
          file: 'file4.webp',
          x: 178, y: 112, w: 90, h: 51,
          pages: [
            "> A wrinkled folder labeled 'Professional Development'. Inside? A page entirely about the boxing anime Hajime no Ippo.",
            "Lobbie's Personal Analysis: Hajime no Ippo (Ongoing Study)\n  • Ippo's Dempsey Roll is peak software design: simple, efficient, devastating.\n  • Takamura's multi-division dominance == full-stack development.\nConclusion:\n  • Watching this series increases productivity by 18%.\n  • Emotional growth? YUP \n  • Technical relevance? Debatable.\nStatus: Rewatching for the 6th time. Still crying at the Date fight."
          ]
        }
      ];
    }

    get PAPERSTACK_PAGES() {
      return [
        "A note scribbled in all caps:\n\n\"CRITICAL INFO: MUST FILE THIS.\"\n\nYou keep reading...",
        "Inder's Password List (Do NOT share):\"\n  - ILOVERAINBOWSIXSIEGE!<3\n  - inder12345\n  - password123 (circled and underlined for some reason)",
        "You flip the page.\n\nIt's titled:\n\"SKYRIM LORE II NOTES\"\n\nSomeone's underlined 'Talos is real' about 14 times.",
        "Another sheet falls out:\n\n\"Why Goku Solos Every Verse\"\n\nIncludes diagrams, and power scaling math",
        "The last paper reads:\n\n\"To-Do List for Filing Cabinet Organization\"\n  - [ ] File resume bits\n - [ ] File this stack"
      ];
    }
  }

  // Initialize the office room
  new OfficeRoom();
});