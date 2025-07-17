import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { NavBar } from './ui/tubelight-navbar';
import { Home, BookOpen, Users, User } from 'lucide-react';

const Navigation = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleSectionScroll = (sectionId: string) => {
    // Check if we're on the home page
    if (window.location.pathname === '/') {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // If not on home page, navigate to home page with section hash
      navigate(`/#${sectionId}`);
    }
  };

  const navItems = [
    { 
      name: 'Home', 
      url: '/', 
      icon: Home,
      onClick: () => handleSectionScroll('hero')
    },
    { 
      name: 'Programs', 
      url: '/#programs', 
      icon: Users,
      onClick: () => handleSectionScroll('programs')
    },
    { 
      name: 'Features', 
      url: '/#features', 
      icon: BookOpen,
      onClick: () => handleSectionScroll('features')
    },
    { 
      name: 'Sign In', 
      url: '/auth', 
      icon: User,
      onClick: () => navigate('/auth')
    },
  ];

  return (
    <NavBar 
      items={navItems} 
      className="bg-transparent"
    />
  );
};

export default Navigation;
