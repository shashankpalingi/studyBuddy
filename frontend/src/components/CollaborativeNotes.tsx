import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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
  
  // Quill editor modules and formats
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  }), []);
  
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'align',
    'link'
  ];
  
  // First, initialize the notes document if it doesn't exist
  useEffect(() => {
    if (!roomId || !currentUser) return;
    
    const initializeNotes = async () => {
      const notesRef = doc(db, 'studyRooms', roomId, 'tools', 'notes');
      
      try {
        const docSnap = await getDoc(notesRef);
        
        if (!docSnap.exists()) {
          console.log('Creating new notes document');
          await setDoc(notesRef, {
            content: '<h1>Study Notes</h1><p>Use this space to take collaborative notes with your study group.</p><h2>Key Points</h2><ul><li>Point 1</li><li>Point 2</li><li>Point 3</li></ul>',
            lastUpdatedBy: currentUser.uid,
            lastUpdatedAt: Timestamp.now(),
            editorIds: [currentUser.uid]
          });
        }
      } catch (err) {
        console.error('Error initializing notes:', err);
        setError('Failed to initialize notes. Please refresh the page and try again.');
      }
    };
    
    initializeNotes();
  }, [roomId, currentUser]);
  
  // Load notes content
  useEffect(() => {
    if (!roomId || !currentUser) return;
    
    setIsLoading(true);
    
    const notesRef = doc(db, 'studyRooms', roomId, 'tools', 'notes');
    
    // Subscribe to notes updates
    const unsubscribe = onSnapshot(notesRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.data() as NotesData;
          setNotesContent(data.content || '');
          setActiveEditors(data.editorIds || []);
          if (data.lastUpdatedAt) {
            setLastSaved(data.lastUpdatedAt.toDate());
          }
          setIsLoading(false);
        } else {
          // If the document doesn't exist (rare case), it will be created by the initialization effect
          setIsLoading(true);
        }
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
  const handleNotesChange = (content: string) => {
    setNotesContent(content);
    
    // Debounce saving to avoid too many updates
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveNotes(content);
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
      
      console.log('Notes saved successfully');
      setLastSaved(new Date());
      setIsSaving(false);
    } catch (err) {
      console.error('Error saving notes:', err);
      setError('Failed to save notes');
      setIsSaving(false);
      
      // Try to create the document if it doesn't exist
      try {
        const docSnap = await getDoc(doc(db, 'studyRooms', roomId, 'tools', 'notes'));
        if (!docSnap.exists()) {
          await setDoc(doc(db, 'studyRooms', roomId, 'tools', 'notes'), {
            content: content,
            lastUpdatedBy: currentUser.uid,
            lastUpdatedAt: Timestamp.now(),
            editorIds: [currentUser.uid]
          });
          setLastSaved(new Date());
          setIsSaving(false);
          setError('');
        }
      } catch (fallbackErr) {
        console.error('Error in fallback save:', fallbackErr);
      }
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

  // Handle download notes
  const handleDownloadNotes = () => {
    // Create HTML document with proper styling
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Study Notes</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 40px;
              color: #333;
            }
            h1 { color: #0066cc; }
            h2 { color: #444; }
            ul, ol { padding-left: 20px; }
            .notes-container {
              max-width: 800px;
              margin: 0 auto;
            }
            .footer {
              margin-top: 30px;
              border-top: 1px solid #eee;
              padding-top: 10px;
              color: #666;
              font-size: 0.8em;
            }
          </style>
        </head>
        <body>
          <div class="notes-container">
            ${notesContent}
            <div class="footer">
              <p>Downloaded from StudyBuddy on ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Create a blob from the content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Create a link to download it
    const a = document.createElement('a');
    a.href = url;
    a.download = `study_notes_${new Date().toLocaleDateString().replace(/\//g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  if (isLoading) {
    return <div className="notes-loading">Loading notes...</div>;
  }
  
  if (error && !notesContent) {
    return (
      <div className="notes-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }
  
  return (
    <div className="collaborative-notes">
      <div className="notes-header">
        <div className="notes-info">
          <span className="editors-status">{formatEditors()}</span>
          <span className="save-status">
            {isSaving ? 'Saving...' : (lastSaved ? `Last saved: ${formatTime(lastSaved)}` : '')}
          </span>
          {error && <span className="save-error">Error: {error}</span>}
        </div>
        <div className="notes-controls">
          <button 
            className="download-btn"
            onClick={handleDownloadNotes}
            title="Download Notes"
          >
            📥 Download
          </button>
        </div>
      </div>
      
      <div className="notes-content">
        <ReactQuill 
          theme="snow"
          value={notesContent}
          onChange={handleNotesChange}
          modules={modules}
          formats={formats}
          readOnly={!currentUser}
          placeholder="Start typing your collaborative notes here..."
        />
      </div>
    </div>
  );
};

export default CollaborativeNotes; 