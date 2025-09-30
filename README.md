# Study Buddy: Revolutionizing Collaborative Learning 🚀

<div align="center">
  <img src="frontend/public/landingpage.jpeg" alt="Study Buddy Landing Page" width="100%">
  
  [![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-blueviolet?logo=tailwind-css)](https://tailwindcss.com/)
  [![Firebase](https://img.shields.io/badge/Firebase-Authentication-orange?logo=firebase)](https://firebase.google.com/)
  [![Netlify](https://img.shields.io/badge/Netlify-Deploy-blue?logo=netlify)](https://www.netlify.com/)
</div>

## 🌟 Our Vision

**Transforming Learning Together** - Study Buddy is more than just an app; it's a collaborative learning ecosystem designed to make studying engaging, efficient, and enjoyable. From group study sessions to real-time collaboration, we're revolutionizing how students learn and interact.

## 🎯 Key Features

### 🤝 Collaborative Learning
- **Real-time Study Rooms**: Create and join study groups
- **Collaborative Notes**: Shared note-taking with real-time updates
- **Group Discussions**: Chat and communicate while studying

### 🕒 Productivity Tools
- **Study Timer**: Pomodoro-style time management
- **Task Manager**: Track and manage your study tasks
- **Poll System**: Create quick polls for group decision-making

### 🎥 Interactive Features
- **Video Call Integration**: Seamless video communication
- **YouTube Watch Together**: Synchronize video watching
- **Whiteboard**: Collaborative drawing and brainstorming

### 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Firebase Authentication and Firestore
- **Storage**: Supabase Storage (File uploads, whiteboard saves)
- **Deployment**: Netlify
- **State Management**: React Contexts
- **UI Components**: Shadcn/ui

## 🏗️ Project Structure

```
study-buddy/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── services/
├── backend/
│   └── firebase/
└── README.md
```

## 🎮 Quick Start

### Prerequisites
- Node.js (v18+)
- npm or bun
- Firebase Account
- Supabase Account (for file storage)

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/study-buddy.git
cd study-buddy
```

2. Install dependencies
```bash
cd frontend
npm install  # or bun install
```

3. Set up Firebase
- Create a Firebase project
- Add your Firebase configuration to `src/lib/firebase.ts`

4. Set up Supabase Storage
- Create a Supabase project
- Create a storage bucket named `study-buddy-files`
- Make the bucket public
- Set up the following environment variables:
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Run the development server
```bash
npm run dev  # or bun run dev
```

## 🚀 Deployment (Netlify)

For production deployment on Netlify, you'll need to add these environment variables in your Netlify dashboard:

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add the following variables:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - Any Firebase configuration variables you're using

4. Redeploy your site for the changes to take effect

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## 🌐 Contact

Project Link: [https://studybuddy08.netlify.app/](https://studybuddy08.netlify.app/)

---

<div align="center">
  <b>Built with ❤️ by the Study Buddy Team</b><br>
  
</div> 
