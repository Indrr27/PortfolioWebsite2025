# Pixel Portfolio Website

A retro-style pixel art portfolio showcasing professional experience through an interactive 2D environment. Navigate through different themed rooms, interact with characters, and explore projects in a unique gaming-inspired format.

## 🎮 Live Demo

[Visit the Portfolio](https://portfolio-website-inderpreet.netlify.app/)

## ✨ Features

### Interactive Rooms
- **Classroom** - Educational background and achievements
- **Lab** - Active projects and technical experiments  
- **Office** - Professional experience and resume
- **Communications** - Contact information and social links

### Interactive Elements
- **Animated Characters** - Each room features a unique character with dialogue
- **Object Interactions** - Click on objects to explore detailed information
- **Background Music** - Optional ambient audio with user controls
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices

### Technical Highlights
- **JavaScript** - No frameworks, optimized performance
- **CSS Animations** - Smooth character movement and UI transitions
- **WebP Images** - Optimized graphics with fallbacks
- **Pixel-Perfect Scaling** - Maintains crisp pixel art across all screen sizes

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Graphics**: WebP images, animated GIFs
- **Audio**: MP3 files with HTML5 Audio API
- **Deployment**: Netlify with custom configuration
- **Performance**: Service Worker caching, optimized assets

## 🚀 Getting Started

### Prerequisites
- Modern web browser with JavaScript enabled
- Web server (for local development)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pixel-portfolio.git
   cd pixel-portfolio
   ```

2. **Serve locally**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Or any local web server
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

## 📁 Project Structure

```
├── index.html              # Classroom (main page)
├── lab.html               # Lab room
├── office.html            # Office room
├── comms.html             # Communications room
├── style.css              # Global styles and animations
├── scripts/
│   ├── common.js          # Shared room functionality
│   ├── classroom.js       # Classroom-specific logic
│   ├── lab.js            # Lab-specific logic
│   ├── office.js         # Office-specific logic
│   └── comms.js          # Communications-specific logic
├── sprites/               # Image assets
├── gif/                  # Character animations
├── sound/                # Audio files
├── service_worker_cache.js # Offline functionality
└── netlify.toml          # Deployment configuration
```

## 🎨 Room Guide

| Room | Character | Focus Area | Interactive Objects |
|------|-----------|------------|-------------------|
| **Classroom** | Marty | Education & Learning | Bookshelf, Drawer |
| **Lab** | Tein | Projects & Experiments | Terminals, BOB (AI) |
| **Office** | Lobbie | Work Experience | Filing Cabinets, Documents |
| **Communications** | Mater | Contact & Social Links | Communication Terminals |

## 🔧 Configuration

### Audio Settings
- Background music is opt-in via character dialogue
- Individual volume controls for music and effects
- User preferences persist across sessions

### Performance Optimization
- Service worker caches critical assets
- Lazy loading for non-essential resources
- Optimized image formats (WebP with fallbacks)
- Responsive asset delivery

## 📱 Browser Support

- **Chrome/Chromium**: Full support
- **Firefox**: Full support  
- **Safari**: Full support
- **Edge**: Full support
- **Mobile Browsers**: Optimized touch controls

