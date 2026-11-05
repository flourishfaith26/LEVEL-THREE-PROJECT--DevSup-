import { styled, keyframes } from '../stitches.config.js';
import DevSupLogo from './DevSupLogo.jsx';

const pump = keyframes({
  '0%': {
    transform: 'scale(0.88)',
    filter: 'drop-shadow(0 0 6px #06b6d4) drop-shadow(0 0 14px rgba(6, 182, 212, 0.6))',
    opacity: 0.9,
  },
  '50%': {
    transform: 'scale(1.22)',
    filter: 'drop-shadow(0 0 10px #06b6d4) drop-shadow(0 0 22px rgba(6, 182, 212, 0.85))',
    opacity: 1,
  },
  '100%': {
    transform: 'scale(0.88)',
    filter: 'drop-shadow(0 0 6px #06b6d4) drop-shadow(0 0 14px rgba(6, 182, 212, 0.6))',
    opacity: 0.9,
  },
});

const LoaderContainer = styled('div', {
  position: 'fixed',
  inset: 0,
  zIndex: 99999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#050811', // Deep pitch black background
  variants: {
    overlay: {
      true: {
        backgroundColor: 'rgba(3, 7, 18, 0.96)', // Pitch-dark backdrop
        backdropFilter: 'blur(10px)',
      }
    }
  }
});

const PumpingIcon = styled('div', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: `${pump} 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
});

export default function DevSupPumpLoader({ overlay = false, size = 72 }) {
  return (
    <LoaderContainer overlay={overlay} role="status" aria-label="Loading DevSup">
      <PumpingIcon>
        <DevSupLogo size={size} glow={false} strokeWidth={15} />
      </PumpingIcon>
    </LoaderContainer>
  );
}


