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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <AppHeader />
      
      <main className="transition-[margin] duration-300 ease-in-out pt-24 px-4 md:px-8 pb-8" style={{ marginLeft: `${isCollapsed ? '80px' : '256px'}` }}>
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-between items-center mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900">Create a Study Room</h1>
            <button 
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-300"
              onClick={() => navigate('/study-rooms')}
            >
              Cancel
            </button>
          </motion.div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-100 text-red-600 p-4 rounded-lg mb-4"
            >
              {error}
            </motion.div>
          )}
          
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-8 rounded-lg shadow-lg border border-gray-200" 
            onSubmit={handleSubmit}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-800">Room Name*</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Calculus Study Group"
                  required
                  className="w-full bg-white text-black px-4 py-3 rounded-lg border-2 border-gray-400 shadow-sm hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-700 text-base font-sans"
                  style={{ color: 'black' }}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="subject" className="block mb-2 text-sm font-medium text-gray-800">Subject*</label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Mathematics, Computer Science"
                  required
                  className="w-full bg-white text-black px-4 py-3 rounded-lg border-2 border-gray-400 shadow-sm hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-700 text-base font-sans"
                  style={{ color: 'black' }}
                />
              </div>
            </div>
            
            <div className="form-group mt-4">
              <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-800">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you'll be studying in this room..."
                rows={4}
                className="w-full bg-white text-black px-4 py-3 rounded-lg border-2 border-gray-400 shadow-sm hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-700 text-base font-sans"
                style={{ color: 'black' }}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="form-group">
                <label htmlFor="maxParticipants" className="block mb-2 text-sm font-medium text-gray-800">Maximum Participants</label>
                <input
                  id="maxParticipants"
                  type="number"
                  min={2}
                  max={50}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                  className="w-full bg-white text-black px-4 py-3 rounded-lg border-2 border-gray-400 shadow-sm hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-700 text-base font-sans"
                  style={{ color: 'black' }}
                />
              </div>
              
              <div className="form-group flex items-center justify-center">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-800 font-medium">Private Room</span>
                </label>
              </div>
            </div>
            
            {isPrivate && (
              <div className="form-group mt-4">
                <label htmlFor="joinCode" className="block mb-2 text-sm font-medium text-gray-800">Join Code*</label>
                <div className="flex space-x-2">
                  <input
                    id="joinCode"
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ABC123"
                    maxLength={10}
                    required={isPrivate}
                    className="flex-grow bg-white text-black px-4 py-3 rounded-lg border-2 border-gray-400 shadow-sm hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-700 text-base font-sans"
                    style={{ color: 'black' }}
                  />
                  <button 
                    type="button" 
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors duration-300 font-medium"
                    onClick={generateJoinCode}
                  >
                    Generate
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Share this code with those you want to invite</p>
              </div>
            )}
            
            <div className="form-group mt-4">
              <label htmlFor="tags" className="block mb-2 text-sm font-medium text-gray-800">Tags</label>
              <div className="flex space-x-2 mb-4">
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
                  className="flex-grow bg-white text-black px-4 py-3 rounded-lg border-2 border-gray-400 shadow-sm hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-700 text-base font-sans"
                  style={{ color: 'black' }}
                />
                <button 
                  type="button" 
                  className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors duration-300 font-medium"
                  onClick={handleAddTag}
                >
                  Add
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <div key={index} className="bg-gray-100 text-gray-800 text-sm px-3 py-1.5 rounded-full flex items-center space-x-2 border border-gray-200">
                    <span>{tag}</span>
                    <button 
                      type="button" 
                      className="text-gray-500 hover:text-red-500"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors duration-300 disabled:opacity-50 font-medium text-base"
              >
                {isLoading ? 'Creating Room...' : 'Create Study Room'}
              </button>
            </div>
          </motion.form>
        </div>
      </main>
    </div>
  );
};

export default CreateRoom; 