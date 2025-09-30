# Changelog

All notable changes to Study Buddy will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-12-19

### 🚀 Major Changes
- **BREAKING**: Migrated from Cloudinary to Supabase for file storage
- Implemented hybrid architecture: Firebase (auth/database) + Supabase (storage)
- Enhanced file upload/download performance with Supabase CDN

### ✨ Added
- **Supabase Storage Integration**
  - Cost-effective file storage with generous free tier
  - Direct upload to storage buckets
  - Automatic CDN delivery for faster file access
  - Support for all file types up to 10MB

- **Backend Architecture**
  - Added `backend/supabase/` folder with configuration
  - Storage policies and security rules
  - Database maintenance functions
  - Environment variable templates

- **Enhanced Documentation**
  - Comprehensive README with setup instructions
  - Supabase configuration guide
  - Architecture diagrams and explanations
  - Troubleshooting guides

### 🔄 Changed
- **File Storage System**
  - Replaced Cloudinary APIs with Supabase storage APIs
  - Updated file reference structure in Firestore
  - Improved error handling and user feedback
  - Better file organization in storage buckets

- **Component Updates**
  - `FileSharing.tsx`: Now uses Supabase for file operations
  - `Whiteboard.tsx`: Whiteboard saves now stored in Supabase
  - `UserService.ts`: Profile pictures uploaded to Supabase
  - Backwards compatibility with existing Cloudinary files

### 🗑️ Removed
- Cloudinary React SDK dependency
- Cloudinary configuration files
- Legacy upload presets and signed URLs
- Unused Cloudinary environment variables

### 🔧 Technical Improvements
- **Storage Policies**: Flexible RLS policies for Firebase Auth integration
- **Error Messages**: More descriptive error handling
- **File Metadata**: Enhanced file tracking with upload metadata
- **Security**: Proper bucket permissions and access controls

### 🐛 Fixed
- File upload timeout issues with large files
- Storage access denied errors with proper RLS configuration
- Memory leaks in file upload components
- Inconsistent file URL generation

### 📚 Documentation
- Updated README with hybrid architecture explanation
- Added Supabase setup and configuration guide
- Created troubleshooting section
- Enhanced project structure documentation

### 🔐 Security
- Implemented proper storage bucket policies
- Added file type validation
- Enhanced upload metadata tracking
- Secure file deletion with user verification

## [1.5.0] - 2024-11-15

### ✨ Added
- YouTube Watch Together feature
- Enhanced video call functionality
- Poll system for group decision making
- Study timer with Pomodoro technique

### 🔄 Changed
- Improved UI/UX across all components
- Enhanced real-time synchronization
- Better mobile responsiveness

### 🐛 Fixed
- Various bug fixes and performance improvements
- Authentication flow improvements
- Database query optimizations

## [1.4.0] - 2024-10-20

### ✨ Added
- Collaborative whiteboard functionality
- Real-time drawing synchronization
- File sharing in study rooms
- Profile picture uploads

### 🔄 Changed
- Updated to React 19
- Improved component architecture
- Enhanced TypeScript usage

## [1.3.0] - 2024-09-10

### ✨ Added
- Video call integration with PeerJS
- Screen sharing capabilities
- Chat with image support
- User presence indicators

### 🔄 Changed
- Migrated to Vite from Create React App
- Updated dependencies
- Improved build performance

## [1.2.0] - 2024-08-05

### ✨ Added
- Collaborative notes feature
- Real-time text editing
- Task management system
- Study room creation and joining

### 🔄 Changed
- Enhanced Firebase integration
- Improved authentication flow
- Better error handling

## [1.1.0] - 2024-07-01

### ✨ Added
- Firebase Authentication integration
- Google Sign-In support
- User profile management
- Basic study room functionality

### 🔄 Changed
- Migrated from local storage to Firebase Firestore
- Improved security with authentication
- Enhanced user experience

## [1.0.0] - 2024-06-01

### 🎉 Initial Release
- Basic study buddy application
- Local data storage
- Simple UI with Tailwind CSS
- React-based frontend architecture

---

## Migration Notes

### From Cloudinary to Supabase (v2.0.0)
If you're upgrading from v1.x, please note:

1. **Environment Variables**: Update your `.env` file with Supabase credentials
2. **Existing Files**: Old Cloudinary files remain accessible via their original URLs
3. **New Uploads**: All new file uploads will use Supabase storage
4. **Performance**: Expect improved upload speeds and reduced costs

### Backwards Compatibility
- Existing Cloudinary file references in Firestore remain functional
- New file uploads automatically use Supabase
- No user data loss during migration
- Seamless transition for end users

---

## Upcoming Features

### v2.1.0 (Planned)
- Mobile app development (React Native)
- AI study assistant integration
- Advanced analytics and progress tracking
- Calendar integration

### v2.2.0 (Planned)
- Offline mode support (PWA)
- Study group marketplace
- Enhanced gamification features
- University course integration

---

For more details about any release, please check the [GitHub releases page](https://github.com/your-username/study-buddy/releases).