import { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { styled, keyframes } from './stitches.config.js';
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'));
const AuthPage = lazy(() => import('./pages/AuthPage'));

const spin = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

// Custom Stitches loading container
const LoadingContainer = styled('div', {
  height: '100vh',
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '$bg',
  color: '$textMain',
  fontFamily: 'system-ui, sans-serif'
});

const AppSpinner = styled('div', {
  width: '56px',
  height: '56px',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '16px',
});

const AppSpinnerRing = styled('div', {
  position: 'absolute',
  inset: 0,
  borderRadius: '50%',
  border: '3px solid rgba(6, 182, 212, 0.18)',
  borderTopColor: '$accent',
  borderRightColor: '$accent',
  animation: `${spin} 0.8s cubic-bezier(0.5, 0.1, 0.4, 0.9) infinite`,
});

function FullPageLoader({ message = 'Loading DevSup...' }) {
  return (
    <LoadingContainer>
      <AppSpinner>
        <AppSpinnerRing />
        <img src="/favicon.svg" alt="DevSup" style={{ width: '26px', height: '26px', filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))' }} />
      </AppSpinner>
      <span style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--colors-textMuted)' }}>{message}</span>
    </LoadingContainer>
  );
}

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
    return <FullPageLoader message="Loading DevSup..." />;
  }

  return (
    <Suspense fallback={<FullPageLoader message="Loading DevSup..." />}>
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