import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot, 
  limit, 
  Timestamp,
  doc,
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import './ChatRoom.css';

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhotoURL: string | null;
  createdAt: Timestamp;
}

interface ChatRoomProps {
  roomId: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ roomId }) => {
  const { currentUser, userProfile } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages
  useEffect(() => {
    if (!roomId) return;

    setIsLoading(true);
    const messagesRef = collection(db, 'studyRooms', roomId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const loadedMessages: Message[] = [];
        snapshot.forEach((doc) => {
          loadedMessages.push({
            id: doc.id,
            ...doc.data()
          } as Message);
        });
        setMessages(loadedMessages);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Failed to load messages');
        setIsLoading(false);
      }
    }, (err) => {
      console.error('Error subscribing to messages:', err);
      setError('Failed to subscribe to chat messages');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !currentUser || !roomId) return;
    
    try {
      const messagesRef = collection(db, 'studyRooms', roomId, 'messages');
      await addDoc(messagesRef, {
        text: message,
        userId: currentUser.uid,
        userName: userProfile?.displayName || 'Anonymous',
        userPhotoURL: userProfile?.photoURL || null,
        createdAt: serverTimestamp()
      });
      
      setMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const formatTime = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Group Chat</h2>
      </div>
      
      <div className="chat-messages">
        {isLoading ? (
          <div className="chat-loading">Loading messages...</div>
        ) : error ? (
          <div className="chat-error">{error}</div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`chat-message ${msg.userId === currentUser?.uid ? 'own-message' : ''}`}
            >
              <div className="message-avatar">
                {msg.userPhotoURL ? (
                  <img src={msg.userPhotoURL} alt={msg.userName} />
                ) : (
                  <div className="default-avatar">
                    {msg.userName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-author">{msg.userName}</span>
                  <span className="message-time">{formatTime(msg.createdAt)}</span>
                </div>
                <div className="message-text">{msg.text}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={!currentUser}
        />
        <button 
          type="submit" 
          disabled={!message.trim() || !currentUser}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatRoom; 