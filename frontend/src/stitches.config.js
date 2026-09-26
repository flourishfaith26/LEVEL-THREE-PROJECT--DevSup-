import { createStitches } from '@stitches/react';

export const { styled, globalCss, keyframes } = createStitches({
    theme: {
        colors: {
            bg: '#0F172A',
            surface: '#1E293B',
            accent: '#06B6D4',
            accentHover: '#0891b2',
            textMain: '#F8FAFC',
            textMuted: '#94A3B8',
            border: '#334155',
            danger: '#EF4444',
        },
        space: {
            1: '0.5rem',
            2: '1rem',
            3: '1.5rem',
            4: '2rem',
        },
        radii: {
            1: '6px',
            2: '12px',
            round: '9999px',
        },
    },
});

export const globalStyles = globalCss({
    '*': { 
        margin: 0, 
        padding: 0, 
        boxSizing: 'border-box',
        scrollbarWidth: 'thin',
        scrollbarColor: '#334155 transparent'
    },
    '::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
    },
    '::-webkit-scrollbar-track': {
        background: 'transparent',
    },
    '::-webkit-scrollbar-thumb': {
        backgroundColor: '$border',
        borderRadius: '4px',
    },
    '::-webkit-scrollbar-thumb:hover': {
        backgroundColor: '$textMuted',
    },
    '::-webkit-scrollbar-corner': {
        background: 'transparent',
    },
    'body': {
        backgroundColor: '$bg',
        color: '$textMain',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
    },
    '#root': {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    }
});