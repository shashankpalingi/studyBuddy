import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile, uploadProfilePicture } from '../services/userService';
import './Profile.css';

const Profile: React.FC = () => {
  const { currentUser, userProfile, refreshUserProfile, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [major, setMajor] = useState('');
  const [interests, setInterests] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setBio(userProfile.bio || '');
      setMajor(userProfile.major || '');
      setInterests(userProfile.interests?.join(', ') || '');
    }
  }, [userProfile]);
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };
  
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Process interests into an array
      const interestsArray = interests
        .split(',')
        .map(item => item.trim())
        .filter(item => item !== '');
      
      // Upload profile picture if changed
      if (profileImage) {
        await uploadProfilePicture(currentUser.uid, profileImage);
      }
      
      // Update profile information
      await updateUserProfile(currentUser.uid, {
        displayName,
        bio,
        major,
        interests: interestsArray
      });
      
      // Refresh user profile
      await refreshUserProfile();
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!currentUser || !userProfile) {
    return (
      <div className="min-h-screen">
        <div className="profile-container">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen">
      <div className="profile-container">
        <div className="profile-header">
          <h1>Your Profile</h1>
          <div className="profile-actions">
            {!isEditing && (
              <button 
                className="edit-btn"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            )}
            <button 
              className="logout-btn"
              onClick={handleLogout}
            >
              Log Out
            </button>
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        {isEditing ? (
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="profile-image-container">
              <div className="profile-image-wrapper">
                <img 
                  src={imagePreview || userProfile.photoURL || '/placeholder.svg'} 
                  alt="Profile" 
                  className="profile-image"
                />
                <label className="change-photo-btn">
                  Change Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Tell us about yourself..."
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="major">Major/Field of Study</label>
              <input
                id="major"
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="e.g. Computer Science"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="interests">Interests (comma separated)</label>
              <input
                id="interests"
                type="text"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="e.g. AI, Web Development, Math"
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => {
                  setIsEditing(false);
                  // Reset form
                  if (userProfile) {
                    setDisplayName(userProfile.displayName || '');
                    setBio(userProfile.bio || '');
                    setMajor(userProfile.major || '');
                    setInterests(userProfile.interests?.join(', ') || '');
                  }
                  setImagePreview(null);
                  setProfileImage(null);
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="save-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-view">
            <div className="profile-image-container">
              <img 
                src={userProfile.photoURL || '/placeholder.svg'} 
                alt="Profile" 
                className="profile-image"
              />
            </div>
            
            <div className="profile-details">
              <h2>{userProfile.displayName || 'Anonymous User'}</h2>
              <p className="profile-email">{userProfile.email}</p>
              
              {userProfile.bio && (
                <div className="profile-section">
                  <h3>Bio</h3>
                  <p>{userProfile.bio}</p>
                </div>
              )}
              
              {userProfile.major && (
                <div className="profile-section">
                  <h3>Major/Field of Study</h3>
                  <p>{userProfile.major}</p>
                </div>
              )}
              
              {userProfile.interests && userProfile.interests.length > 0 && (
                <div className="profile-section">
                  <h3>Interests</h3>
                  <div className="interests-list">
                    {userProfile.interests.map((interest, index) => (
                      <span key={index} className="interest-tag">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 