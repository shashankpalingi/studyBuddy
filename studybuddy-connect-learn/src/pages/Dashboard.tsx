import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppHeader from '../components/AppHeader';
import { getJoinedRooms } from '../services/studyRoomService';
import { StudyRoom } from '../types/studyRoom';
import './Dashboard.css';

const Dashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const [joinedRooms, setJoinedRooms] = useState<StudyRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchJoinedRooms = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        const rooms = await getJoinedRooms(currentUser.uid);
        setJoinedRooms(rooms);
      } catch (error) {
        console.error('Error fetching joined rooms:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJoinedRooms();
  }, [currentUser]);
  
  return (
    <div className="dashboard">
      <AppHeader />
      <div className="dashboard-content">
        <div className="dashboard-welcome">
          <h1>Welcome, {userProfile?.displayName || 'Student'}!</h1>
          <p>Track your progress, join study rooms, and connect with other students.</p>
        </div>
        
        <div className="dashboard-features">
          <div className="dashboard-card study-rooms-feature">
            <div className="card-content">
              <h2>Study Rooms</h2>
              <p>Join or create virtual study rooms to connect with peers and study together.</p>
              <div className="card-actions">
                <Link to="/study-rooms" className="primary-button">
                  Browse Study Rooms
                </Link>
                <Link to="/create-room" className="secondary-button">
                  Create a Room
                </Link>
              </div>
            </div>
          </div>
          
          <div className="dashboard-card profile-feature">
            <div className="card-content">
              <h2>My Profile</h2>
              <p>Manage your personal profile, settings, and study preferences.</p>
              <div className="card-actions">
                <Link to="/profile" className="primary-button">
                  View Profile
                </Link>
              </div>
            </div>
          </div>
          
          <div className="dashboard-card soon-feature">
            <div className="card-content">
              <h2>More Features Coming Soon</h2>
              <p>We're working on adding more tools to enhance your learning experience!</p>
              <ul className="upcoming-features">
                <li>Study schedules and reminders</li>
                <li>Flashcards and quizzes</li>
                <li>Progress tracking</li>
                <li>Resource sharing</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="joined-rooms-section">
          <h2>My Study Rooms</h2>
          
          {isLoading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading your study rooms...</p>
            </div>
          ) : joinedRooms.length > 0 ? (
            <div className="joined-rooms-list">
              {joinedRooms.map(room => (
                <Link 
                  to={`/study-room/${room.id}`} 
                  key={room.id}
                  className="joined-room-card"
                >
                  <h3>{room.name}</h3>
                  <p className="room-subject">{room.subject}</p>
                  <div className="room-meta">
                    <span className="room-participants">
                      <i className="fas fa-users"></i> {room.participants.length}/{room.maxParticipants}
                    </span>
                    {room.isPrivate && (
                      <span className="room-private">
                        <i className="fas fa-lock"></i> Private
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-rooms">
              <p>You haven't joined any study rooms yet.</p>
              <Link to="/study-rooms" className="primary-button">
                Find Study Rooms
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 