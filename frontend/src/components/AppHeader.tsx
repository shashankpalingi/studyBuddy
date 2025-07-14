import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LogOut, 
  Settings,
  Search,
  User
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';

interface AppHeaderProps {
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  handleSearch?: () => void;
  joinCode?: string;
  setJoinCode?: (code: string) => void;
  handleJoinByCode?: () => void;
  isJoining?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  searchTerm = '',
  setSearchTerm = () => {},
  handleSearch = () => {},
  joinCode = '',
  setJoinCode = () => {},
  handleJoinByCode = () => {},
  isJoining = false
}) => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isStudyRoomsPage = location.pathname === '/study-rooms';

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 backdrop-blur-md bg-white/70 border-b border-white/20 text-gray-900 h-16 flex items-center justify-between px-6 z-40 shadow-sm">
      {/* Logo */}
      <div className="flex items-center">
        <Link to="/" className="cursor-pointer">
          <img 
            src="/studybuddylogo.png" 
            alt="StudyBuddy" 
            className="h-8"
          />
        </Link>
      </div>

      {/* Search Bars - Only show on Study Rooms page */}
      {isStudyRoomsPage && (
        <div className="hidden md:flex flex-1 justify-center mx-6 space-x-6">
          {/* Join by Code */}
          <div className="w-2/5 max-w-xs">
            <div className="flex relative group">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-l-xl bg-white/80 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm shadow-sm transition-all group-hover:shadow-md"
              />
              <button
                onClick={handleJoinByCode}
                disabled={isJoining || !joinCode.trim()}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-r-xl text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:hover:shadow-none flex items-center justify-center min-w-[80px]"
              >
                {isJoining ? 'Joining...' : 'Join'}
              </button>
            </div>
          </div>
          
          {/* Search */}
          <div className="w-2/5 max-w-xs">
            <div className="flex relative group">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by subject, name, or tag"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-l-xl bg-white/80 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm shadow-sm transition-all group-hover:shadow-md"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-r-xl text-sm hover:shadow-lg transition-all flex items-center justify-center min-w-[50px]"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu - Simplified */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-lg hover:bg-blue-50/50 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white/90 backdrop-blur-md border-gray-200 text-gray-900 shadow-lg rounded-lg mt-2">
            {/* Mobile search fields - Only on Study Rooms page */}
            {isStudyRoomsPage && (
              <>
                <div className="px-2 py-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter room code"
                    className="w-full px-3 py-1 border border-gray-300 rounded-lg mb-2 text-sm"
                  />
                  <button
                    onClick={handleJoinByCode}
                    disabled={isJoining || !joinCode.trim()}
                    className="w-full px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm mb-2"
                  >
                    {isJoining ? 'Joining...' : 'Join by Code'}
                  </button>
                </div>
                <div className="px-2 py-2 border-t border-gray-200">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search rooms"
                    className="w-full px-3 py-1 border border-gray-300 rounded-lg mb-2 text-sm"
                  />
                  <button
                    onClick={handleSearch}
                    className="w-full px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" /> Search
                  </button>
                </div>
                <DropdownMenuSeparator className="bg-gray-200/50" />
              </>
            )}
            <DropdownMenuItem
              className="hover:bg-blue-50/50"
              onClick={() => navigate('/profile')}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* User Profile - Unchanged */}
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 p-1 rounded-full hover:bg-white/50 transition-colors"
            >
              <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-blue-500">
                <img 
                  src={userProfile?.photoURL || '/placeholder.svg'} 
                  alt="Profile" 
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="hidden md:inline text-sm font-medium text-gray-900">
                {userProfile?.displayName?.split(' ')[0] || 'User'}
              </span>
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white/90 backdrop-blur-md border-gray-200 text-gray-900 shadow-lg rounded-lg">
            <div className="flex items-center p-2 border-b border-gray-200/50">
              <div className="h-10 w-10 rounded-full overflow-hidden mr-2">
                <img 
                  src={userProfile?.photoURL || '/placeholder.svg'} 
                  alt="Profile" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{userProfile?.displayName || 'User'}</p>
                <p className="text-xs text-gray-500">{currentUser?.email}</p>
              </div>
            </div>
            <DropdownMenuItem 
              className="hover:bg-blue-50/50" 
              onClick={() => navigate('/profile')}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200/50" />
            <DropdownMenuItem 
              className="hover:bg-red-50/50 text-red-600 hover:text-red-700" 
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AppHeader; 