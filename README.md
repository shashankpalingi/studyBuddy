# Study Buddy: Revolutionizing Collaborative Learning 🚀

<div align="center">
  <img src="frontend/public/landingpage.jpeg" alt="Study Buddy Landing Page" width="100%">
  
  [![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-blueviolet?logo=tailwind-css)](https://tailwindcss.com/)
  [![Firebase](https://img.shields.io/badge/Firebase-Database%20%26%20Auth-orange?logo=firebase)](https://firebase.google.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-Storage-green?logo=supabase)](https://supabase.com/)
  [![Netlify](https://img.shields.io/badge/Netlify-Deploy-blue?logo=netlify)](https://www.netlify.com/)
</div>

## 🌟 Our Vision

**Transforming Learning Together** - Study Buddy is more than just an app; it's a collaborative learning ecosystem designed to make studying engaging, efficient, and enjoyable. From group study sessions to real-time collaboration, we're revolutionizing how students learn and interact.

## 🎯 Key Features

### 🤝 Collaborative Learning
- **Real-time Study Rooms**: Create and join study groups with instant synchronization
- **Collaborative Notes**: Shared note-taking with real-time updates across all participants
- **Group Discussions**: Chat and communicate seamlessly while studying
- **File Sharing**: Upload, share, and download study materials with your group

### 🎨 Interactive Tools
- **Collaborative Whiteboard**: Draw, sketch, and brainstorm together in real-time
- **YouTube Watch Together**: Synchronize video watching for educational content
- **Poll System**: Create quick polls for group decision-making and feedback

### 🕒 Productivity Features
- **Smart Study Timer**: Pomodoro-style time management with group synchronization
- **Task Manager**: Track and manage your study tasks with progress tracking
- **Profile Management**: Customize your study profile with pictures and preferences

### 🎥 Communication
- **Integrated Video Calls**: Seamless video communication within study rooms
- **Real-time Chat**: Instant messaging with image sharing capabilities
- **User Presence**: See who's online and active in your study sessions

## 🏗️ Architecture

Study Buddy uses a **hybrid cloud architecture** for optimal performance and cost-effectiveness:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│    Firebase     │    │   Supabase      │    │    Frontend     │
│                 │    │                 │    │                 │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Authentication│    │ • File Storage  │    │ • React 19      │
│ • Firestore DB  │    │ • Image Hosting │    │ • TypeScript    │
│ • Real-time     │    │ • Static Assets │    │ • Tailwind CSS  │
│ • User Mgmt     │    │ • CDN Delivery  │    │ • Vite          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Why This Architecture?

- **Firebase**: Excels at real-time features, authentication, and instant data synchronization
- **Supabase**: Provides cost-effective file storage with generous free tiers
- **Best of Both Worlds**: Combines Firebase's real-time capabilities with Supabase's storage efficiency

## 🚀 Tech Stack

### Frontend
- **React 19** with TypeScript for type-safe development
- **Tailwind CSS** for responsive, utility-first styling
- **Shadcn/ui** for consistent, accessible UI components
- **Vite** for fast development and optimized builds

### Backend Services
- **Firebase Authentication** for secure user management
- **Firestore** for real-time database operations
- **Supabase Storage** for file uploads and media management

### Development Tools
- **ESLint & Prettier** for code quality
- **Git** for version control
- **Netlify** for deployment and hosting

## 🏗️ Project Structure

```
study-buddy/
├── 📁 frontend/                  # React application
│   ├── 📁 public/               # Static assets
│   ├── 📁 src/
│   │   ├── 📁 components/       # React components
│   │   │   ├── 📁 VideoCall/    # Video calling feature
│   │   │   ├── 📁 YoutubeWatchTogether/
│   │   │   └── 📄 *.tsx         # Individual components
│   │   ├── 📁 contexts/         # React contexts (Auth, etc.)
│   │   ├── 📁 hooks/            # Custom React hooks
│   │   ├── 📁 lib/              # Utility libraries
│   │   │   ├── 📄 firebase.ts   # Firebase configuration
│   │   │   ├── 📄 supabase-storage.ts # Supabase storage
│   │   │   └── 📄 utils.ts      # Helper functions
│   │   ├── 📁 pages/            # Page components
│   │   ├── 📁 services/         # API services
│   │   └── 📄 main.tsx          # App entry point
│   ├── 📄 package.json
│   └── 📄 vite.config.ts
├── 📁 backend/                   # Backend configurations
│   ├── 📁 firebase/             # Firebase setup
│   │   ├── 📄 firebase.json     # Firebase configuration
│   │   ├── 📄 firestore.rules   # Database security rules
│   │   ├── 📄 firestore.indexes.json
│   │   └── 📄 storage.rules     # Storage security rules
│   ├── 📁 supabase/             # Supabase setup
│   │   ├── 📄 README.md         # Supabase documentation
│   │   ├── 📄 storage-config.sql # Storage policies
│   │   └── 📄 .env.example      # Environment template
│   └── 📄 package.json
├── 📄 README.md                 # This file
├── 📄 package.json              # Root package configuration
└── 📄 netlify.toml             # Deployment configuration
```

## 🎮 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **bun** package manager
- **Firebase Account** (free tier available)
- **Supabase Account** (free tier available)

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-username/study-buddy.git
cd study-buddy

# Install frontend dependencies
cd frontend
npm install  # or: bun install

# Install backend dependencies (optional)
cd ../backend
npm install
```

### 2. Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Follow the setup wizard

2. **Enable Authentication**
   - Navigate to Authentication → Sign-in method
   - Enable Email/Password and Google providers

3. **Create Firestore Database**
   - Go to Firestore Database → Create database
   - Choose "Start in test mode" for development

4. **Get Firebase Config**
   - Go to Project Settings → Your apps
   - Copy the Firebase configuration object

5. **Configure Firebase**
   - Update `frontend/src/lib/firebase.ts` with your config

### 3. Supabase Setup

1. **Create Supabase Project**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Create a new project

2. **Set Up Storage**
   - Navigate to Storage → Create bucket
   - Name: `study-buddy-files`
   - Make it public ✅

3. **Configure Policies**
   - Go to SQL Editor
   - Run the commands from `backend/supabase/storage-config.sql`

4. **Get Supabase Credentials**
   - Go to Settings → API
   - Copy URL and anon key

### 4. Environment Variables

Create `frontend/.env` with:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Gemini AI for enhanced features
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 5. Run the Application

```bash
# Start development server
cd frontend
npm run dev  # or: bun run dev

# Visit http://localhost:5173
```

## 🚀 Deployment

### Automatic Deployment (Recommended)
The app is configured for automatic deployment to Netlify:

1. **Fork this repository**
2. **Connect to Netlify**
   - Import your forked repo to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
3. **Add environment variables** in Netlify dashboard
4. **Deploy automatically** on every push to main branch

### Manual Deployment
```bash
# Build for production
cd frontend
npm run build

# Deploy the dist/ folder to your hosting provider
```

## 🧪 Development Scripts

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend
```bash
npm run deploy:firebase     # Deploy Firebase rules
npm run deploy:all         # Deploy everything
npm run setup:supabase     # Setup instructions
```

## 🔧 Configuration

### Firebase Security Rules
Located in `backend/firebase/`:
- `firestore.rules` - Database security
- `storage.rules` - Firebase storage (legacy)
- `firestore.indexes.json` - Database indexes

### Supabase Storage
Located in `backend/supabase/`:
- `storage-config.sql` - Storage policies and setup
- `README.md` - Detailed Supabase documentation

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Follow our coding standards
   - Add tests if applicable
   - Update documentation
4. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
5. **Push and create PR**
   ```bash
   git push origin feature/amazing-feature
   ```

### Development Guidelines
- Use TypeScript for type safety
- Follow React best practices
- Write clear commit messages
- Update documentation as needed
- Test your changes thoroughly

## 📈 Roadmap

### 🚧 Upcoming Features
- **Mobile App** (React Native)
- **AI Study Assistant** (Enhanced Gemini integration)
- **Study Analytics** (Progress tracking)
- **Calendar Integration** (Google Calendar sync)
- **Offline Mode** (PWA capabilities)

### 🎯 Long-term Vision
- **University Partnerships** (Course integration)
- **Study Groups Marketplace** (Find study partners)
- **Gamification** (Points, badges, leaderboards)
- **Advanced Analytics** (Learning insights)

## 🐛 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Firebase Connection Issues
- Verify environment variables are correct
- Check Firebase project settings
- Ensure authentication providers are enabled

#### Supabase Storage Issues
- Verify bucket is public
- Check RLS policies are configured
- Confirm environment variables are set

### Getting Help
- **Issues**: Create a GitHub issue for bugs
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact us for urgent matters

## 📊 Performance

### Metrics
- **Initial Load**: ~2.5s (with caching)
- **Real-time Updates**: <100ms latency
- **File Upload**: Supports up to 10MB files
- **Concurrent Users**: Tested with 50+ users per room

### Optimization
- **Code Splitting**: Automatic with Vite
- **Image Optimization**: WebP format support
- **CDN**: Supabase CDN for fast file delivery
- **Caching**: Aggressive caching strategy

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌐 Links

- **Live Demo**: [https://studybuddy08.netlify.app/](https://studybuddy08.netlify.app/)
- **Documentation**: [See Wiki](https://github.com/your-username/study-buddy/wiki)
- **API Docs**: [Firebase](https://firebase.google.com/docs) | [Supabase](https://supabase.com/docs)

---

<div align="center">
  <p><strong>Built with ❤️ for students, by students</strong></p>
  <p>
    <a href="https://react.dev/">React</a> •
    <a href="https://firebase.google.com/">Firebase</a> •
    <a href="https://supabase.com/">Supabase</a> •
    <a href="https://tailwindcss.com/">Tailwind</a>
  </p>
  
  ⭐ **Star this repo if you find it helpful!** ⭐
</div>