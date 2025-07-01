import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useIsMobile } from '../hooks/use-mobile';
import './Navigation.css';

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="navbar-container">
      <nav className="navbar">
        <Link to="/" className="navbar-logo">
          <img src="/favicon.ico" alt="StudyBuddy" />
          StudyBuddy
        </Link>

        {!isMobile && (
          <ul className="navbar-links">
            <li>
              <Link to="/" className="navbar-link">Home</Link>
            </li>
            <li>
              <Link to="/#features" className="navbar-link">Features</Link>
            </li>
            <li>
              <Link to="/#programs" className="navbar-link">Programs</Link>
            </li>
            <li>
              <Link to="/#impact" className="navbar-link">Impact</Link>
            </li>
          </ul>
        )}

        {!isMobile && (
          <div>
            {currentUser ? (
              <div className="flex items-center gap-4">
                <Link to="/dashboard" className="navbar-link">Dashboard</Link>
                <Link to="/study-rooms" className="navbar-link">Study Rooms</Link>
                <Link to="/profile" className="navbar-link">Profile</Link>
                <button onClick={handleLogout} className="auth-button bg-red-600 hover:bg-red-700">
                  Sign Out
                </button>
              </div>
            ) : (
              <Link to="/auth" className="auth-button">
                Sign In
              </Link>
            )}
          </div>
        )}

        {isMobile && (
          <button onClick={toggleMobileMenu} className="menu-button">
            <i className="ri-menu-line"></i>
          </button>
        )}
      </nav>

      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <button onClick={toggleMobileMenu} className="mobile-close">
          <i className="ri-close-line"></i>
        </button>

        <ul className="mobile-links">
          <li>
            <Link to="/" className="mobile-link" onClick={toggleMobileMenu}>Home</Link>
          </li>
          <li>
            <Link to="/#features" className="mobile-link" onClick={toggleMobileMenu}>Features</Link>
          </li>
          <li>
            <Link to="/#programs" className="mobile-link" onClick={toggleMobileMenu}>Programs</Link>
          </li>
          <li>
            <Link to="/#impact" className="mobile-link" onClick={toggleMobileMenu}>Impact</Link>
          </li>
          
          {currentUser ? (
            <>
              <li>
                <Link to="/dashboard" className="mobile-link" onClick={toggleMobileMenu}>Dashboard</Link>
              </li>
              <li>
                <Link to="/study-rooms" className="mobile-link" onClick={toggleMobileMenu}>Study Rooms</Link>
              </li>
              <li>
                <Link to="/profile" className="mobile-link" onClick={toggleMobileMenu}>Profile</Link>
              </li>
              <li>
                <button onClick={() => {handleLogout(); toggleMobileMenu();}} className="mobile-link bg-red-600 w-full text-left p-2 rounded">
                  Sign Out
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link to="/auth" className="mobile-link bg-violet-600 block text-center p-2 rounded" onClick={toggleMobileMenu}>
                Sign In
              </Link>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Navigation;
