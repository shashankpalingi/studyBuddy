import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  setDoc, 
  Timestamp,
  arrayUnion,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import './CollaborativeNotes.css';

interface NotesData {
  content: string;
  lastUpdatedBy: string;
  lastUpdatedAt: Timestamp;
  editorIds: string[];
}

interface CollaborativeNotesProps {
  roomId: string;
}

const CollaborativeNotes: React.FC<CollaborativeNotesProps> = ({ roomId }) => {
  const { currentUser, userProfile } = useAuth();
  const [notesContent, setNotesContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeEditors, setActiveEditors] = useState<string[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // For debouncing saves
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load notes content
  useEffect(() => {
    if (!roomId) return;
    
    setIsLoading(true);
    
    const notesRef = doc(db, 'studyRooms', roomId, 'tools', 'notes');
    
    // Subscribe to notes updates
    const unsubscribe = onSnapshot(notesRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.data() as NotesData;
          setNotesContent(data.content);
          setActiveEditors(data.editorIds || []);
          if (data.lastUpdatedAt) {
            setLastSaved(data.lastUpdatedAt.toDate());
          }
        } else {
          // Initialize notes document if it doesn't exist
          setDoc(notesRef, {
            content: '# Study Notes\n\nUse this space to take collaborative notes with your study group.\n\n## Key Points\n\n- Point 1\n- Point 2\n- Point 3',
            lastUpdatedBy: currentUser?.uid || 'system',
            lastUpdatedAt: Timestamp.now(),
            editorIds: []
          }).catch(err => {
            console.error('Error initializing notes:', err);
          });
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading notes:', err);
        setError('Failed to load notes');
        setIsLoading(false);
      }
    }, (err) => {
      console.error('Error subscribing to notes updates:', err);
      setError('Failed to subscribe to notes updates');
      setIsLoading(false);
    });
    
    return () => {
      unsubscribe();
      // Clear any pending save timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [roomId, currentUser]);
  
  // Register user as active editor
  useEffect(() => {
    if (!roomId || !currentUser) return;
    
    const notesRef = doc(db, 'studyRooms', roomId, 'tools', 'notes');
    
    const registerAsEditor = async () => {
      try {
        const docSnap = await getDoc(notesRef);
        
        if (docSnap.exists()) {
          await updateDoc(notesRef, {
            editorIds: arrayUnion(currentUser.uid)
          });
        }
      } catch (err) {
        console.error('Error registering as editor:', err);
      }
    };
    
    registerAsEditor();
    
    // Remove user from active editors when unmounting
    return () => {
      const removeEditor = async () => {
        try {
          const docSnap = await getDoc(notesRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data() as NotesData;
            const updatedEditors = data.editorIds.filter(id => id !== currentUser.uid);
            
            await updateDoc(notesRef, {
              editorIds: updatedEditors
            });
          }
        } catch (err) {
          console.error('Error removing editor:', err);
        }
      };
      
      removeEditor();
    };
  }, [roomId, currentUser]);
  
  // Handle notes content change
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setNotesContent(newContent);
    
    // Debounce saving to avoid too many updates
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveNotes(newContent);
    }, 1000); // Save after 1 second of inactivity
  };
  
  // Save notes to Firestore
  const saveNotes = async (content: string) => {
    if (!roomId || !currentUser) return;
    
    try {
      setIsSaving(true);
      
      const notesRef = doc(db, 'studyRooms', roomId, 'tools', 'notes');
      await updateDoc(notesRef, {
        content: content,
        lastUpdatedBy: currentUser.uid,
        lastUpdatedAt: Timestamp.now()
      });
      
      setLastSaved(new Date());
      setIsSaving(false);
    } catch (err) {
      console.error('Error saving notes:', err);
      setError('Failed to save notes');
      setIsSaving(false);
    }
  };
  
  // Format timestamp
  const formatTime = (date: Date | null) => {
    if (!date) return '';
    
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  // Format editor names
  const formatEditors = () => {
    if (activeEditors.length === 0) return 'No active editors';
    
    const isUserActive = currentUser && activeEditors.includes(currentUser.uid);
    const otherEditors = activeEditors.filter(id => id !== currentUser?.uid);
    
    if (isUserActive && otherEditors.length === 0) {
      return 'Only you are editing';
    }
    
    if (isUserActive) {
      return `You and ${otherEditors.length} other${otherEditors.length === 1 ? '' : 's'} are editing`;
    }
    
    return `${activeEditors.length} people are editing`;
  };
  
  if (isLoading) {
    return <div className="notes-loading">Loading notes...</div>;
  }
  
  if (error) {
    return <div className="notes-error">{error}</div>;
  }
  
  return (
    <div className="collaborative-notes">
      <div className="notes-header">
        <div className="notes-info">
          <span className="editors-status">{formatEditors()}</span>
          <span className="save-status">
            {isSaving ? 'Saving...' : (lastSaved ? `Last saved: ${formatTime(lastSaved)}` : '')}
          </span>
        </div>
        <div className="notes-controls">
          {/* Future feature: Add formatting controls here */}
        </div>
      </div>
      
      <div className="notes-content">
        <textarea
          value={notesContent}
          onChange={handleNotesChange}
          placeholder="Start typing your collaborative notes here..."
          disabled={!currentUser}
          spellCheck="true"
        />
      </div>
    </div>
  );
};

export default CollaborativeNotes; 