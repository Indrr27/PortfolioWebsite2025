// comms.js - Simplified using common.js
document.addEventListener('DOMContentLoaded', () => {
  class CommsRoom extends PortfolioRoom {
    constructor() {
      const config = {
        roomName: 'comms',
        characterName: 'mater',
        characterPadding: '1px',
        characterZIndex: '10',
        staticSprite: 'sprites/characters/mater.webp',
        walkingSprite: 'gif/characters/materwalk.gif',
        characterAudioVolume: .7,
        
        patrol: {
          speedPct: 0.13,
          baseOffsetRatio: 16/176,
          leftBoundaryPct: 0.001,
          rightBoundaryPct: 0.25
        },
        
        characterAudio: {
          m1: 'mater1',
          m2: 'mater2',
          m3: 'mater3',
          m4: 'mater4'
        },
        
        characterDialogue: [
          { text: "⊠҂⨀⧩ Gr'nakk faloo! Vree-nah klik'tok zaa... ", audio: 'm1' },
          { text: "Oh, sorry. Wrong dialect. Ahem. Welcome, visitor. I am Mater, Communications Liaison of this facility.", audio: 'm2' },
          { text: "This room connects you to Inder. You'll find three terminals:<br>   • Direct Message Beacon (Email)<br>   • Professional Profile Archive (LinkedIn)<br>   • Open-Source Relic Repository (GitHub)", audio: 'm3' },
          { text: "Reach out through the proper channel. Results may vary, side effects include networking.", audio: 'm4' }
        ],
        
        navigation: {
          left: 'office.html',
          right: 'index.html'
        },
        
        objects: ['screen1', 'screen2', 'screen3'],
        
        objectHandlers: {
          screen1: function() { this.openLinkedIn(); },
          screen2: function() { this.openEmail(); },
          screen3: function() { this.openGitHub(); }
        },
        
        helpMessage: `
          <strong>Welcome to the Communications Hub!</strong><br><br>
          This room connects you directly to Inder through various channels. 
          Click on the terminals to access different ways to reach out!<br><br>
          <strong>How to interact:</strong><br>
          • Click on <strong>Mater</strong> to start a conversation<br>
          • Click on <strong>terminals</strong> to access external links<br>
          • Use the <strong>navigation buttons</strong> to move between rooms
        `
      };
      
      super(config);
    }

    async runDialogueSequence() {
      // Show all dialogue lines
      for (let i = 0; i < this.config.characterDialogue.length - 1; i++) {
        await this.dialogue.showLine(this.config.characterDialogue[i].text, this.config.characterDialogue[i].audio);
      }
      
      // Last dialogue with Exit button
      await this.dialogue.showLine(
        this.config.characterDialogue[this.config.characterDialogue.length - 1].text, 
        'm4', 
        'Exit'
      );
      
      this.dialogue.hide();
    }

    async openLinkedIn() {
      const choice = await this.dialogue.showChoice(
        "Open Inder's LinkedIn profile?", 
        ['Yes', 'No']
      );
      
      if (choice === 0) {
        window.open('https://www.linkedin.com/in/inderpreet-warraich-29b0042a8/', '_blank');
      }
      
      this.dialogue.hide();
    }

    async openEmail() {
      const choice = await this.dialogue.showChoice(
        "Send an email to Inder (inderpreet.s.warraich@gmail.com)?", 
        ['Yes', 'No']
      );
      
      if (choice === 0) {
        window.open('mailto:inderpreet.s.warraich@gmail.com', '_blank');
      }
      
      this.dialogue.hide();
    }

    async openGitHub() {
      const choice = await this.dialogue.showChoice(
        "Visit Inder's GitHub page?", 
        ['Yes', 'No']
      );
      
      if (choice === 0) {
        window.open('https://github.com/Indrr27', '_blank');
      }
      
      this.dialogue.hide();
    }
  }

  // Initialize the comms room
  new CommsRoom();
});