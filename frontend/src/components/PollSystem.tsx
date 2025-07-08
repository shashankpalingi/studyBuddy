import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  Timestamp,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import './PollSystem.css';

interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
  isActive: boolean;
  allowMultipleVotes: boolean;
}

interface PollSystemProps {
  roomId: string;
}

const PollSystem: React.FC<PollSystemProps> = ({ roomId }) => {
  const { currentUser, userProfile } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewPollForm, setShowNewPollForm] = useState(false);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: ['', ''],
    allowMultipleVotes: false
  });
  
  // Load polls
  useEffect(() => {
    if (!roomId) return;
    
    setIsLoading(true);
    
    const pollsRef = collection(db, 'studyRooms', roomId, 'polls');
    const q = query(pollsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const loadedPolls: Poll[] = [];
        snapshot.forEach((doc) => {
          loadedPolls.push({
            id: doc.id,
            ...doc.data()
          } as Poll);
        });
        setPolls(loadedPolls);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading polls:', err);
        setError('Failed to load polls');
        setIsLoading(false);
      }
    }, (err) => {
      console.error('Error subscribing to polls updates:', err);
      setError('Failed to subscribe to polls updates');
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [roomId]);
  
  // Add option in new poll form
  const handleAddOption = () => {
    setNewPoll({
      ...newPoll,
      options: [...newPoll.options, '']
    });
  };
  
  // Remove option in new poll form
  const handleRemoveOption = (index: number) => {
    const options = [...newPoll.options];
    if (options.length <= 2) return; // Keep at least 2 options
    
    options.splice(index, 1);
    setNewPoll({
      ...newPoll,
      options
    });
  };
  
  // Update option text
  const handleOptionChange = (index: number, value: string) => {
    const options = [...newPoll.options];
    options[index] = value;
    setNewPoll({
      ...newPoll,
      options
    });
  };
  
  // Create new poll
  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomId || !currentUser || !userProfile) return;
    
    // Validate
    if (!newPoll.question.trim()) {
      setError('Question is required');
      return;
    }
    
    const validOptions = newPoll.options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      setError('At least two valid options are required');
      return;
    }
    
    try {
      setIsCreatingPoll(true);
      setError('');
      
      const pollsRef = collection(db, 'studyRooms', roomId, 'polls');
      
      // Prepare options with unique IDs
      const optionsWithIds = validOptions.map(opt => ({
        id: Math.random().toString(36).substring(2, 9),
        text: opt.trim(),
        votes: []
      }));
      
      await addDoc(pollsRef, {
        question: newPoll.question.trim(),
        options: optionsWithIds,
        createdBy: currentUser.uid,
        createdByName: userProfile.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
        isActive: true,
        allowMultipleVotes: newPoll.allowMultipleVotes
      });
      
      // Reset form
      setNewPoll({
        question: '',
        options: ['', ''],
        allowMultipleVotes: false
      });
      setShowNewPollForm(false);
      setIsCreatingPoll(false);
    } catch (err) {
      console.error('Error creating poll:', err);
      setError('Failed to create poll');
      setIsCreatingPoll(false);
    }
  };
  
  // Vote for an option
  const handleVote = async (pollId: string, poll: Poll, optionId: string) => {
    if (!roomId || !currentUser) return;
    
    try {
      const pollRef = doc(db, 'studyRooms', roomId, 'polls', pollId);
      
      // If multiple votes are not allowed, remove previous votes
      if (!poll.allowMultipleVotes) {
        // Get all options that the user has voted for
        const userVotedOptions = poll.options.filter(opt => 
          opt.votes.includes(currentUser.uid)
        );
        
        // If user already voted for this option, remove the vote
        if (userVotedOptions.some(opt => opt.id === optionId)) {
          // Find the option to update
          const optionToUpdate = poll.options.find(opt => opt.id === optionId);
          if (!optionToUpdate) return;
          
          // Update the option votes
          const updatedOptions = poll.options.map(opt => {
            if (opt.id === optionId) {
              return {
                ...opt,
                votes: opt.votes.filter(uid => uid !== currentUser.uid)
              };
            }
            return opt;
          });
          
          await updateDoc(pollRef, {
            options: updatedOptions
          });
          
          return;
        }
        
        // Remove votes from all other options
        for (const opt of userVotedOptions) {
          await updateDoc(pollRef, {
            [`options`]: poll.options.map(o => {
              if (o.id === opt.id) {
                return {
                  ...o,
                  votes: o.votes.filter(uid => uid !== currentUser.uid)
                };
              }
              return o;
            })
          });
        }
      }
      
      // Add vote to the selected option
      await updateDoc(pollRef, {
        [`options`]: poll.options.map(o => {
          if (o.id === optionId) {
            if (o.votes.includes(currentUser.uid)) {
              // Already voted, remove vote (toggle)
              return {
                ...o,
                votes: o.votes.filter(uid => uid !== currentUser.uid)
              };
            } else {
              // Add vote
              return {
                ...o,
                votes: [...o.votes, currentUser.uid]
              };
            }
          }
          return o;
        })
      });
    } catch (err) {
      console.error('Error voting:', err);
      setError('Failed to register vote');
    }
  };
  
  // Close/reopen poll
  const handleTogglePollStatus = async (pollId: string, currentStatus: boolean) => {
    if (!roomId || !currentUser) return;
    
    try {
      const pollRef = doc(db, 'studyRooms', roomId, 'polls', pollId);
      await updateDoc(pollRef, {
        isActive: !currentStatus
      });
    } catch (err) {
      console.error('Error updating poll status:', err);
      setError('Failed to update poll status');
    }
  };
  
  // Delete poll
  const handleDeletePoll = async (pollId: string, createdBy: string) => {
    if (!roomId || !currentUser) return;
    
    // Only allow deletion if user is the creator
    if (createdBy !== currentUser.uid) {
      setError('You can only delete polls you created');
      return;
    }
    
    try {
      const pollRef = doc(db, 'studyRooms', roomId, 'polls', pollId);
      await deleteDoc(pollRef);
    } catch (err) {
      console.error('Error deleting poll:', err);
      setError('Failed to delete poll');
    }
  };
  
  // Calculate percentage
  const calculatePercentage = (votes: string[], totalVotes: number): string => {
    if (totalVotes === 0) return '0%';
    
    const percentage = (votes.length / totalVotes) * 100;
    return `${Math.round(percentage)}%`;
  };
  
  // Get total votes for a poll
  const getTotalVotes = (poll: Poll): number => {
    const uniqueVoters = new Set();
    
    poll.options.forEach(option => {
      option.votes.forEach(voter => uniqueVoters.add(voter));
    });
    
    return uniqueVoters.size;
  };
  
  // Check if user has voted for an option
  const hasVoted = (votes: string[]): boolean => {
    return currentUser ? votes.includes(currentUser.uid) : false;
  };
  
  if (isLoading) {
    return <div className="polls-loading">Loading polls...</div>;
  }
  
  return (
    <div className="poll-system">
      <div className="polls-header">
        <h3>Polls & Questions</h3>
        {currentUser && (
          <button 
            className="create-poll-btn"
            onClick={() => setShowNewPollForm(!showNewPollForm)}
          >
            {showNewPollForm ? 'Cancel' : 'Create Poll'}
          </button>
        )}
      </div>
      
      {error && <div className="polls-error">{error}</div>}
      
      {showNewPollForm && (
        <div className="new-poll-form">
          <form onSubmit={handleCreatePoll}>
            <div className="form-group">
              <label htmlFor="poll-question">Question:</label>
              <input
                id="poll-question"
                type="text"
                value={newPoll.question}
                onChange={(e) => setNewPoll({...newPoll, question: e.target.value})}
                placeholder="Enter your question"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Options:</label>
              {newPoll.options.map((option, index) => (
                <div key={index} className="option-row">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  {newPoll.options.length > 2 && (
                    <button 
                      type="button" 
                      className="remove-option-btn"
                      onClick={() => handleRemoveOption(index)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button" 
                className="add-option-btn"
                onClick={handleAddOption}
              >
                + Add Option
              </button>
            </div>
            
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newPoll.allowMultipleVotes}
                  onChange={(e) => setNewPoll({...newPoll, allowMultipleVotes: e.target.checked})}
                />
                Allow multiple votes
              </label>
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                disabled={isCreatingPoll || !newPoll.question.trim() || newPoll.options.filter(o => o.trim()).length < 2}
              >
                {isCreatingPoll ? 'Creating...' : 'Create Poll'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="polls-list">
        {polls.length === 0 ? (
          <div className="no-polls">
            <p>No polls have been created yet</p>
          </div>
        ) : (
          polls.map((poll) => {
            const totalVotes = getTotalVotes(poll);
            
            return (
              <div 
                key={poll.id} 
                className={`poll-item ${!poll.isActive ? 'inactive' : ''}`}
              >
                <div className="poll-header">
                  <h4 className="poll-question">{poll.question}</h4>
                  <div className="poll-actions">
                    {currentUser && poll.createdBy === currentUser.uid && (
                      <>
                        <button 
                          className="toggle-poll-btn"
                          onClick={() => handleTogglePollStatus(poll.id, poll.isActive)}
                          title={poll.isActive ? 'Close poll' : 'Reopen poll'}
                        >
                          {poll.isActive ? '📊' : '🔓'}
                        </button>
                        <button 
                          className="delete-poll-btn"
                          onClick={() => handleDeletePoll(poll.id, poll.createdBy)}
                          title="Delete poll"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="poll-meta">
                  <span className="poll-creator">Created by {poll.createdByName}</span>
                  <span className="poll-status">
                    {poll.isActive ? 'Active' : 'Closed'} • {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="poll-options">
                  {poll.options.map((option) => (
                    <div key={option.id} className="poll-option">
                      <button 
                        className={`vote-btn ${hasVoted(option.votes) ? 'voted' : ''}`}
                        onClick={() => poll.isActive && handleVote(poll.id, poll, option.id)}
                        disabled={!poll.isActive || !currentUser}
                      >
                        <span className="option-text">{option.text}</span>
                        <span className="vote-count">{option.votes.length}</span>
                      </button>
                      <div className="vote-bar-container">
                        <div 
                          className="vote-bar" 
                          style={{ width: calculatePercentage(option.votes, totalVotes) }}
                        ></div>
                        <span className="vote-percentage">{calculatePercentage(option.votes, totalVotes)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {!poll.isActive && (
                  <div className="poll-closed-message">
                    This poll is closed
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PollSystem; 