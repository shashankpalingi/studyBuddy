import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import studybuddyLogo from '../pages/studybuddylogo.png';

const AppHeader: React.FC = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <header className="bg-gray-900 text-white py-4 px-6 flex items-center justify-between shadow-md">
      <div className="flex items-center space-x-4">
        <Link to="/" className="cursor-pointer flex items-center">
          <img src={studybuddyLogo} alt="StudyBuddy Logo" className="h-8" />
          <span className="ml-2 text-lg font-bold">StudyBuddy</span>
        </Link>
        <div className="hidden md:flex space-x-6">
          <Link to="/" className="hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link to="#" className="hover:text-primary transition-colors">
            Study Rooms
          </Link>
          <Link to="#" className="hover:text-primary transition-colors">
            Resources
          </Link>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {currentUser && (
          <>
            <Link to="/profile" className="flex items-center hover:bg-gray-800 p-2 rounded-full transition-colors">
              <div className="h-8 w-8 rounded-full overflow-hidden mr-2">
                <img 
                  src={userProfile?.photoURL || '/placeholder.svg'} 
                  alt="Profile" 
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="hidden md:inline">{userProfile?.displayName || 'Profile'}</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Log Out
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default AppHeader; 