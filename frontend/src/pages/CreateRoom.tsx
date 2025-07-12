import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import AppHeader from '../components/AppHeader';
import { createStudyRoom } from '../services/studyRoomService';
import { motion } from 'framer-motion';
import './CreateRoom.css';

const CreateRoom: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { isCollapsed } = useSidebar();
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
        createdBy: currentUser.uid,
        creatorName: userProfile.displayName || 'Anonymous'
      };
      
      const newRoom = await createStudyRoom(roomData, currentUser.uid, userProfile.displayName || 'Anonymous');
      
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
    <div className="min-h-screen create-room-container">
      <AppHeader />
      
      <main className="pt-24 px-4 md:px-8 pb-8">
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-between items-center mb-8"
          >
            <h1 className="text-3xl font-bold glass-title">Create a Study Room</h1>
            <button 
              className="px-4 py-2 rounded-lg transition-colors duration-300 cancel-btn"
              onClick={() => navigate('/study-rooms')}
            >
              Cancel
            </button>
          </motion.div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 rounded-lg mb-4 error-message"
            >
              {error}
            </motion.div>
          )}
          
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="p-8 rounded-lg shadow-lg create-room-form" 
            onSubmit={handleSubmit}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="name" className="block mb-2 text-sm font-medium form-label">Room Name*</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Calculus Study Group"
                  required
                  className="w-full px-4 py-3 rounded-lg border-2 shadow-sm hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-700 text-base font-sans form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="subject" className="block mb-2 text-sm font-medium form-label">Subject*</label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Mathematics, Computer Science"
                  required
                  className="w-full px-4 py-3 rounded-lg border-2 shadow-sm hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-700 text-base font-sans form-input"
                />
              </div>
            </div>
            
            <div className="form-group mt-4">
              <label htmlFor="description" className="block mb-2 text-sm font-medium form-label">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you'll be studying in this room..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border-2 shadow-sm hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-700 text-base font-sans form-input"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="form-group">
                <label htmlFor="maxParticipants" className="block mb-2 text-sm font-medium form-label">Maximum Participants</label>
                <input
                  id="maxParticipants"
                  type="number"
                  min={2}
                  max={50}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg border-2 shadow-sm hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-700 text-base font-sans form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="isPrivate" className="block mb-2 text-sm font-medium form-label">Privacy</label>
                <div className="flex items-center mt-1">
                  <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                      onChange={() => setIsPrivate(!isPrivate)}
                      className="form-checkbox h-5 w-5 text-blue-500 rounded border-gray-300 focus:ring-blue-500"
                  />
                    <span className="ml-2 text-gray-700">Private Room</span>
                </label>
                  {isPrivate && (
                    <button
                      type="button"
                      onClick={generateJoinCode}
                      className="ml-4 px-2 py-1 rounded text-xs create-room-btn"
                    >
                      Generate New Code
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {isPrivate && (
              <div className="form-group mt-4">
                <label htmlFor="joinCode" className="block mb-2 text-sm font-medium form-label">Join Code</label>
                <div className="flex">
                  <input
                    id="joinCode"
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ABC123"
                    className="w-full px-4 py-3 rounded-lg border-2 shadow-sm hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-700 text-base font-sans font-mono form-input"
                    style={{ letterSpacing: '0.2em' }}
                  />
                </div>
              </div>
            )}
            
            <div className="form-group mt-4">
              <label htmlFor="tags" className="block mb-2 text-sm font-medium form-label">Tags</label>
              <div className="flex">
                <input
                  id="tags"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add tags e.g. 'physics', 'homework'"
                  className="w-full px-4 py-3 rounded-lg border-2 shadow-sm hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-700 text-base font-sans form-input"
                />
                <button 
                  type="button" 
                  onClick={handleAddTag}
                  className="ml-2 px-4 py-3 rounded create-room-btn"
                >
                  Add
                </button>
              </div>
              
              {tags.length > 0 && (
                <div className="mt-2 p-2 rounded tag-container">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                      <div key={index} className="flex items-center px-3 py-1 rounded-full tag">
                        <span className="text-sm">{tag}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-sm font-bold"
                    >
                          &times;
                    </button>
                  </div>
                ))}
              </div>
                </div>
              )}
            </div>
            
            <div className="form-group mt-6 flex justify-end">
              <button 
                type="submit" 
                disabled={isLoading}
                className="px-6 py-3 rounded-lg text-base font-medium create-room-btn"
              >
                {isLoading ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </motion.form>
        </div>
      </main>
    </div>
  );
};

export default CreateRoom; 