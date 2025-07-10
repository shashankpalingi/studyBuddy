import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import studybuddyLogo from '../pages/studybuddylogo.png';
import { 
  Home, 
  Users, 
  User, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight, 
  Bell, 
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';

const AppHeader: React.FC = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const sidebarNavItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Study Rooms', url: '/study-rooms', icon: Users },
    { name: 'Profile', url: '/profile', icon: User },
  ];

  return (
    <>
      {/* Top header for profile and notifications */}
      <header className="fixed top-0 right-0 left-0 backdrop-blur-md bg-white/70 border-b border-white/20 text-gray-900 h-16 flex items-center justify-between px-4 z-40 transition-[margin-left] duration-300 ease-in-out shadow-sm" style={{ marginLeft: `${isCollapsed ? '80px' : '256px'}` }}>
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar} 
            className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications button removed */}
          
          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
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
            <DropdownMenuContent align="end" className="w-56 bg-white border-gray-200 text-gray-900">
              <div className="flex items-center p-2 border-b border-gray-200">
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
                className="hover:bg-gray-100" 
                onClick={() => navigate('/profile')}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-gray-100">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200" />
              <DropdownMenuItem 
                className="hover:bg-gray-100 text-red-600 hover:text-red-700" 
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Sidebar */}
      <AnimatePresence>
        <motion.aside 
          initial={{ width: isCollapsed ? 80 : 256, x: 0 }}
          animate={{ 
            width: isCollapsed ? 80 : 256,
            x: 0,
            transition: { duration: 0.3, ease: "easeInOut" }
          }}
          className="fixed left-0 top-0 h-full bg-white text-gray-900 flex flex-col shadow-lg z-50 overflow-hidden border-r border-gray-200"
        >
          <div className="flex items-center justify-between p-4 h-16 border-b border-gray-200">
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center"
                >
                  <Link to="/" className="cursor-pointer flex items-center">
                    <img src={studybuddyLogo} alt="StudyBuddy Logo" className="h-8 mr-3" />
                    {/* StudyBuddy text removed */}
                  </Link>
                </motion.div>
              )}
              {isCollapsed && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link to="/">
                    <img src={studybuddyLogo} alt="StudyBuddy Logo" className="h-8" />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
            
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleSidebar}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
            </motion.button>
          </div>

          <nav className="flex-grow p-3">
            <ul className="space-y-1">
              {sidebarNavItems.map((item) => (
                <motion.li 
                  key={item.name}
                  whileHover={{ scale: 1.03, x: 3 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Link 
                    to={item.url} 
                    className={`flex items-center p-2 hover:bg-gray-100 rounded-lg transition-colors ${
                      isCollapsed ? 'justify-center' : ''
                    }`}
                  >
                    <item.icon className={`${isCollapsed ? '' : 'mr-3'} w-5 h-5`} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </nav>

          {/* Profile section is only in sidebar when not collapsed */}
          {currentUser && !isCollapsed && (
            <div className="mt-auto p-3">
              <div className="border-t border-gray-200 pt-3">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center p-2 hover:bg-gray-100 rounded-lg transition-colors text-left text-sm text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="mr-3 w-5 h-5" />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </motion.aside>
      </AnimatePresence>
    </>
  );
};

export default AppHeader; 