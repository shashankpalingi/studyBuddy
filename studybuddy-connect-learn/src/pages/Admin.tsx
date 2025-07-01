import React from 'react';
import { deleteAllStudyRooms } from '../services/studyRoomService';
import { useNavigate } from 'react-router-dom';

const Admin: React.FC = () => {
  const navigate = useNavigate();

  const handleDeleteAllRooms = async () => {
    try {
      await deleteAllStudyRooms();
      alert('All study rooms have been deleted successfully');
      navigate('/study-rooms');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to delete study rooms');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin Panel</h1>
      <button 
        onClick={handleDeleteAllRooms}
        style={{
          padding: '10px 20px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Delete All Study Rooms
      </button>
    </div>
  );
};

export default Admin; 