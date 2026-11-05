import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { styled, keyframes } from './stitches.config.js';
import DevSupPumpLoader from './components/DevSupPumpLoader.jsx';
import { WifiOff } from 'lucide-react';
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));

const slideDown = keyframes({
  '0%': { transform: 'translateY(-100%)', opacity: 0 },
  '100%': { transform: 'translateY(0)', opacity: 1 },
});

const OfflineBanner = styled('div', {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 100000,
  backgroundColor: '#0F172A',
  borderBottom: '1px solid rgba(239, 68, 68, 0.4)',
  color: '#F8FAFC',
  padding: '10px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  fontSize: '0.9rem',
  fontWeight: '500',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  animation: `${slideDown} 0.3s ease-out`,
});

function OfflineNotifier() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <OfflineBanner role="alert">
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        color: '#EF4444'
      }}>
        <WifiOff size={14} />
      </div>
      <span>You are offline. Please check your connection.</span>
    </OfflineBanner>
  );
}

// Custom Stitches error container
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
  const location = useLocation();

  if (error) {
    return (
      <LoadingContainer style={{ color: '#EF4444', flexDirection: 'column', textAlign: 'center', padding: '20px' }}>
        <div>Authentication Error</div>
        <div style={{ fontSize: '1rem', marginTop: '10px', color: '#94A3B8' }}>{error.message}</div>
      </LoadingContainer>
    );
  }

  // Only show the pump loader when transitioning from home/login into dashboard, NOT when already on dashboard
  const isDashboardRoute = location.pathname.startsWith('/dashboard');

  if (isLoading && !isDashboardRoute) {
    return <DevSupPumpLoader size={36} />;
  }

  return (
    <Suspense fallback={isDashboardRoute ? null : <DevSupPumpLoader size={36} />}>
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
          path="/reset-password" 
          element={<ResetPasswordPage />} 
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
      <OfflineNotifier />
      <Auth0ProviderWithNavigate>
        <AppRoutes />
      </Auth0ProviderWithNavigate>
    </Router>
  );
}

export default App;