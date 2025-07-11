import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { SidebarProvider } from './contexts/SidebarContext';
import Index from './pages/Index';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile';
import StudyRooms from './pages/StudyRooms';
import CreateRoom from './pages/CreateRoom';
import StudyRoomView from './pages/StudyRoomView';
import Admin from './pages/Admin';
import './App.css';
import { useState } from 'react';
import Preloader from './components/ui/preloader';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      <Preloader onLoadComplete={() => setIsLoading(false)} />
      <div className={`${isLoading ? 'hidden' : ''}`}>
        <SidebarProvider>
          <div className="app-container">
            <Toaster />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/study-rooms"
                element={
                  <ProtectedRoute>
                    <StudyRooms />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/create-room"
                element={
                  <ProtectedRoute>
                    <CreateRoom />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/study-room/:roomId"
                element={
                  <ProtectedRoute>
                    <StudyRoomView />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              
              <Route path="/not-found" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/not-found" replace />} />
            </Routes>
          </div>
        </SidebarProvider>
      </div>
    </>
  );
}

export default App;
