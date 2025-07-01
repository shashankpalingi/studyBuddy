import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import './Auth.css';
import studybuddyLogo from './studybuddylogo.png';

const Auth = () => {
  const { login, register, loginWithGoogle, loginWithGithub, currentUser, error, clearError } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  // Show toast for auth errors
  useEffect(() => {
    if (error) {
      toast({
        title: 'Authentication Error',
        description: error,
        variant: 'destructive',
      });
      clearError();
    }
  }, [error, toast, clearError]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        await login(email, password);
        toast({
          title: 'Welcome back!',
          description: 'You have been successfully logged in.',
        });
      } else {
        // Register
        await register(email, password, displayName);
        toast({
          title: 'Account created!',
          description: 'Your account has been successfully created.',
        });
      }
      // Navigation will happen automatically via the useEffect
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast({
        title: 'Authentication error',
        description: error.message || 'Failed to authenticate',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      toast({
        title: 'Google Sign-in Successful',
        description: 'You have been successfully logged in with Google.',
      });
      // Navigation will happen automatically via the useEffect
    } catch (error: any) {
      console.error('Google authentication error:', error);
      toast({
        title: 'Google Sign-in Failed',
        description: error.message || 'Failed to sign in with Google',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      setLoading(true);
      await loginWithGithub();
      toast({
        title: 'GitHub Sign-in Successful',
        description: 'You have been successfully logged in with GitHub.',
      });
      // Navigation will happen automatically via the useEffect
    } catch (error: any) {
      console.error('GitHub authentication error:', error);
      toast({
        title: 'GitHub Sign-in Failed',
        description: error.message || 'Failed to sign in with GitHub',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <div className="auth-logo">
          <img src={studybuddyLogo} alt="StudyBuddy Logo" />
        </div>

        <h2 className="auth-title">{isLogin ? 'Sign In' : 'Create Account'}</h2>
        
        <div className="social-auth-buttons">
          <button 
            className="google-auth-btn" 
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <i className="fab fa-google"></i>
            Continue with Google
          </button>
          
          <button 
            className="github-auth-btn" 
            onClick={handleGithubSignIn}
            disabled={loading}
          >
            <i className="fab fa-github"></i>
            Continue with GitHub
          </button>
        </div>
        
        <div className="auth-divider">
          <span>or</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="displayName">Name</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                required={!isLogin}
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        
        <div className="auth-switch">
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <button 
                className="auth-switch-btn" 
                onClick={() => setIsLogin(false)}
                disabled={loading}
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button 
                className="auth-switch-btn" 
                onClick={() => setIsLogin(true)}
                disabled={loading}
              >
                Sign In
              </button>
            </>
          )}
        </div>
        
        {isLogin && (
          <div className="auth-forgot-password">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth; 