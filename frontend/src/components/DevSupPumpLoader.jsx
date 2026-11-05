import { styled, keyframes } from '../stitches.config.js';
import DevSupLogo from './DevSupLogo.jsx';

const pump = keyframes({
  '0%': {
    transform: 'scale(0.92)',
    filter: 'drop-shadow(0 0 5px #06b6d4) drop-shadow(0 0 12px rgba(6, 182, 212, 0.45))',
    opacity: 0.9,
  },
  '50%': {
    transform: 'scale(1.08)',
    filter: 'drop-shadow(0 0 9px #06b6d4) drop-shadow(0 0 20px rgba(6, 182, 212, 0.75))',
    opacity: 1,
  },
  '100%': {
    transform: 'scale(0.92)',
    filter: 'drop-shadow(0 0 5px #06b6d4) drop-shadow(0 0 12px rgba(6, 182, 212, 0.45))',
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
  backgroundColor: 'rgba(5, 8, 17, 0.42)', // Modern translucent backdrop, not pitch-dark
  backdropFilter: 'blur(14px) saturate(140%)',
  WebkitBackdropFilter: 'blur(14px) saturate(140%)',
  transition: 'opacity 0.2s ease',
  variants: {
    overlay: {
      true: {
        backgroundColor: 'rgba(5, 8, 17, 0.48)',
        backdropFilter: 'blur(16px) saturate(150%)',
        WebkitBackdropFilter: 'blur(16px) saturate(150%)',
      }
    }
  }
});

const GlassCard = styled('div', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '74px',
  height: '74px',
  borderRadius: '22px',
  backgroundColor: 'rgba(15, 23, 42, 0.65)',
  border: '1px solid rgba(6, 182, 212, 0.28)',
  boxShadow: '0 16px 36px -10px rgba(0, 0, 0, 0.5), 0 0 24px rgba(6, 182, 212, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
});

const PumpingIcon = styled('div', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: `${pump} 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
});

export default function DevSupPumpLoader({ overlay = false, size = 36 }) {
  return (
    <LoaderContainer overlay={overlay} role="status" aria-label="Loading DevSup">
      <GlassCard>
        <PumpingIcon>
          <DevSupLogo size={size} glow={false} strokeWidth={15} />
        </PumpingIcon>
      </GlassCard>
    </LoaderContainer>
  );
}
