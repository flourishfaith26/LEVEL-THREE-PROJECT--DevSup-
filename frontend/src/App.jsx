import { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { styled } from './stitches.config.js';
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'));
const AuthPage = lazy(() => import('./pages/AuthPage'));

// Custom Stitches loading container
const LoadingContainer = styled('div', {
  height: '100vh',
  minHeight: '100dvh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '$bg',
  color: '$accent',
  fontSize: '1.25rem',
  fontWeight: 'bold',
  fontFamily: 'system-ui, sans-serif'
});

const SESSION_TIMEOUT_MS = 48 * 60 * 60 * 1000;
const SESSION_ACTIVITY_KEY_PREFIX = 'devsup:last-active:';

function SessionTimeout() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const isLoggingOut = useRef(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.sub) return undefined;

    const activityKey = `${SESSION_ACTIVITY_KEY_PREFIX}${user.sub}`;
    const lastActivity = Number(localStorage.getItem(activityKey));
    const now = Date.now();

    const expireSession = () => {
      if (isLoggingOut.current) return;
      isLoggingOut.current = true;
      localStorage.removeItem(activityKey);
      void logout({ logoutParams: { returnTo: window.location.origin } });
    };

    if (Number.isFinite(lastActivity) && lastActivity > 0 && now - lastActivity >= SESSION_TIMEOUT_MS) {
      expireSession();
      return undefined;
    }

    const updateActivity = () => {
      const currentTime = Date.now();
      const previousActivity = Number(localStorage.getItem(activityKey));
      if (Number.isFinite(previousActivity) && previousActivity > 0 && currentTime - previousActivity >= SESSION_TIMEOUT_MS) {
        expireSession();
        return;
      }
      localStorage.setItem(activityKey, String(currentTime));
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') updateActivity();
    };

    localStorage.setItem(activityKey, String(now));
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', updateActivity);
    const activityInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') updateActivity();
    }, 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', updateActivity);
      window.clearInterval(activityInterval);
    };
  }, [isAuthenticated, isLoading, logout, user?.sub]);

  return null;
}

const Auth0ProviderWithNavigate = ({ children }) => {
  const navigate = useNavigate();
  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

  const onRedirectCallback = (appState) => {
    navigate(appState?.returnTo || '/dashboard', { replace: true });
  };

  if (!(domain && clientId)) {
    return (
      <AuthProvider>
        <SessionTimeout />
        {children}
      </AuthProvider>
    );
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: "https://devsup-api"
      }}
      cacheLocation="localstorage"
      onRedirectCallback={onRedirectCallback}
    >
      <AuthProvider>
        <SessionTimeout />
        {children}
      </AuthProvider>
    </Auth0Provider>
  );
};

function AppRoutes() {
  const { isAuthenticated, isLoading, error } = useAuth();

  if (error) {
    return (
      <LoadingContainer style={{ color: '#EF4444', flexDirection: 'column', textAlign: 'center', padding: '20px' }}>
        <div>Authentication Error</div>
        <div style={{ fontSize: '1rem', marginTop: '10px', color: '#94A3B8' }}>{error.message}</div>
      </LoadingContainer>
    );
  }

  if (isLoading) {
    return (
      <LoadingContainer>
        Loading DevSup...
      </LoadingContainer>
    );
  }

  return (
    <Suspense fallback={<LoadingContainer>Loading DevSup...</LoadingContainer>}>
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
        {/* Catch-all route for any unmatched paths */}
        <Route 
          path="*" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} 
        />
      </Routes>
    </Suspense>
  );
}
function App() {
  return (
    <Router>
      <Auth0ProviderWithNavigate>
        <AppRoutes />
      </Auth0ProviderWithNavigate>
    </Router>
  );
}

export default App;