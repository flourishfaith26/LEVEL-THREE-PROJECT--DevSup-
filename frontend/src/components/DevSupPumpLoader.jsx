import { styled, keyframes } from '../stitches.config.js';
import DevSupLogo from './DevSupLogo.jsx';

const pump = keyframes({
  '0%': {
    transform: 'scale(0.86)',
    filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.35))',
    opacity: 0.85,
  },
  '50%': {
    transform: 'scale(1.28)',
    filter: 'drop-shadow(0 0 40px rgba(6, 182, 212, 0.95))',
    opacity: 1,
  },
  '100%': {
    transform: 'scale(0.86)',
    filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.35))',
    opacity: 0.85,
  },
});

const LoaderContainer = styled('div', {
  position: 'fixed',
  inset: 0,
  zIndex: 99999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '$bg',
  variants: {
    overlay: {
      true: {
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(8px)',
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
