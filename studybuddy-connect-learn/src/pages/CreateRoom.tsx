import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppHeader from '../components/AppHeader';
import { createStudyRoom } from '../services/studyRoomService';
import './CreateRoom.css';

const CreateRoom: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Generate a join code when switching to private mode
  useEffect(() => {
    if (isPrivate && !joinCode) {
      generateJoinCode();
    }
  }, [isPrivate]);
  
  const generateJoinCode = () => {
    // Generate a random 6-character code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setJoinCode(code);
  };
  
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    // Add tag if it's not already added
    if (!tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
    }
    
    setTagInput('');
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !userProfile) return;
    
    // Validate the form
    if (!name.trim()) {
      setError('Room name is required');
      return;
    }
    
    if (!subject.trim()) {
      setError('Subject is required');
      return;
    }
    
    if (isPrivate && !joinCode.trim()) {
      setError('Join code is required for private rooms');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      const roomData = {
        name,
        subject,
        description,
        maxParticipants,
        tags,
        isPrivate,
        joinCode: isPrivate ? joinCode : null, // Use null instead of undefined
        status: 'active' as const,
      };
      
      const newRoom = await createStudyRoom(
        roomData,
        currentUser.uid,
        userProfile.displayName || 'Anonymous'
      );
      
      // Redirect to the newly created room
      navigate(`/study-room/${newRoom.id}`);
    } catch (error: any) {
      console.error('Error creating room:', error);
      setError(error.message || 'Failed to create study room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="create-room-container">
      <AppHeader />
      
      <div className="create-room-content">
        <div className="create-room-header">
          <h1>Create a Study Room</h1>
          <button 
            className="cancel-btn"
            onClick={() => navigate('/study-rooms')}
          >
            Cancel
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form className="create-room-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Room Name*</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Calculus Study Group"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="subject">Subject*</label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Mathematics, Computer Science"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you'll be studying in this room..."
              rows={4}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="maxParticipants">Maximum Participants</label>
              <input
                id="maxParticipants"
                type="number"
                min={2}
                max={50}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
              />
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
                <span>Private Room</span>
              </label>
            </div>
          </div>
          
          {isPrivate && (
            <div className="form-group">
              <label htmlFor="joinCode">Join Code*</label>
              <div className="join-code-field">
                <input
                  id="joinCode"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ABC123"
                  maxLength={10}
                  required={isPrivate}
                />
                <button 
                  type="button" 
                  className="generate-code-btn"
                  onClick={generateJoinCode}
                >
                  Generate
                </button>
              </div>
              <p className="form-help">Share this code with those you want to invite</p>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <div className="tags-input-container">
              <input
                id="tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="e.g. Calculus, Homework, Exam Prep"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <button 
                type="button" 
                className="add-tag-btn"
                onClick={handleAddTag}
              >
                Add
              </button>
            </div>
            
            <div className="tags-list">
              {tags.map((tag, index) => (
                <div key={index} className="tag-item">
                  <span>{tag}</span>
                  <button 
                    type="button" 
                    className="remove-tag-btn"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            className="create-btn"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Study Room'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRoom; 