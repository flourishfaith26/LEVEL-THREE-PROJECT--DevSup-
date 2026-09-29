import { useAuth0 } from '@auth0/auth0-react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { styled } from './stitches.config.js';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ProfileSetup from './pages/ProfileSetup';
import AuthPage from './pages/AuthPage';

// Custom Stitches loading container
const LoadingContainer = styled('div', {
  height: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '$bg',
  color: '$accent',
  fontSize: '1.25rem',
  fontWeight: 'bold',
  fontFamily: 'system-ui, sans-serif'
});

function App() {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <LoadingContainer>
        Loading DevSup...
      </LoadingContainer>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={!isAuthenticated ? <Home /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/login" 
          element={!isAuthenticated ? <AuthPage /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/setup" 
          element={isAuthenticated ? <ProfileSetup /> : <Navigate to="/" replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;