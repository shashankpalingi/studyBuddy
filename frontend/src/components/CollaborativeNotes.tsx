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
  
  // Speech recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognition | null>(null);
  
  // State for speech recognition support
  const [speechSupported, setSpeechSupported] = useState(false);

  // Check speech recognition support on component mount
  useEffect(() => {
    // Check for speech recognition support across different browser implementations
    const checkSpeechSupport = () => {
      const SpeechRecognition = 
        window.SpeechRecognition || 
        window.webkitSpeechRecognition || 
        window.mozSpeechRecognition || 
        window.msSpeechRecognition;
      
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          setSpeechSupported(true);
        } catch (err) {
          console.error('Speech recognition not fully supported:', err);
          setSpeechSupported(false);
        }
      } else {
        console.error('Speech recognition API not found');
        setSpeechSupported(false);
      }
    };

    checkSpeechSupport();
  }, []);
  
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
  
  // Toggle speech recognition
  const toggleSpeechRecognition = () => {
    // Ensure speech recognition is supported
    if (!speechSupported) {
      setError('Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari.');
      return;
    }

    // Dynamically get the correct SpeechRecognition constructor
    const SpeechRecognition = 
      window.SpeechRecognition || 
      window.webkitSpeechRecognition || 
      window.mozSpeechRecognition || 
      window.msSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition API is not available.');
      return;
    }
    
    // Stop any existing recognition
    try {
      if (speechRecognition) {
        speechRecognition.stop();
      }
    } catch (stopErr) {
      console.warn('Error stopping speech recognition:', stopErr);
    }
    
    // Reset state
    setIsListening(false);
    setError('');
    
    // If not currently listening, start a new recognition session
    if (!isListening) {
      // Recreate the recognition object to ensure a fresh state
      const newRecognition = new SpeechRecognition();
      
      // Configure new recognition
      newRecognition.continuous = true;
      newRecognition.interimResults = true;
      newRecognition.lang = 'en-US';
      
      // Event handlers
      let accumulatedTranscript = '';
      
      newRecognition.onresult = (event) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        
        // Accumulate transcripts
        if (finalTranscript.trim()) {
          accumulatedTranscript += finalTranscript.trim() + ' ';
          
          // Prepare updated content
          const updatedContent = notesContent 
            ? `${notesContent}\n\n${accumulatedTranscript.trim()}` 
            : accumulatedTranscript.trim();
          
          // Update state and save
          setNotesContent(updatedContent);
          saveNotes(updatedContent);
        }
      };
      
      newRecognition.onstart = () => {
        setIsListening(true);
        setError('');
      };
      
      newRecognition.onend = () => {
        // Reset accumulated transcript
        accumulatedTranscript = '';
        
        // If we were intentionally listening, try to restart
        if (isListening) {
          try {
            newRecognition.start();
          } catch (restartErr) {
            console.error('Error restarting speech recognition:', restartErr);
            setError('Speech recognition stopped. Please restart.');
            setIsListening(false);
          }
        }
      };
      
      newRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        // Handle specific error cases
        switch (event.error) {
          case 'no-speech':
            setError('No speech was detected. Please speak into the microphone.');
            break;
          case 'audio-capture':
            setError('No microphone was found. Ensure microphone is connected.');
            break;
          case 'not-allowed':
            setError('Microphone access was denied. Please check your browser settings.');
            break;
          case 'aborted':
            // Silently try to restart
            try {
              newRecognition.start();
            } catch (restartErr) {
              console.error('Error restarting after aborted:', restartErr);
              setIsListening(false);
            }
            return;
          default:
            setError(`Speech recognition error: ${event.error}`);
        }
        
        setIsListening(false);
      };
      
      // Start the new recognition
      try {
        newRecognition.start();
        setSpeechRecognition(newRecognition);
      } catch (startErr) {
        console.error('Error starting speech recognition:', startErr);
        setError('Failed to start speech recognition. Please check microphone permissions.');
        setIsListening(false);
      }
    }
  };

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
  
  // Render method
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
          {/* Conditionally render voice typing button with more robust check */}
          {speechSupported && (
            <button 
              className={`speech-btn ${isListening ? 'listening' : ''}`}
              onClick={toggleSpeechRecognition}
              title={isListening ? 'Stop Voice Typing' : 'Start Voice Typing'}
            >
              {isListening ? '🛑 Stop Voice' : '🎙️ Voice Type'}
            </button>
          )}
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