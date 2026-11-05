export const THEMES = {
    dark: {
        bg: '#0F172A',
        surface: '#1E293B',
        textMain: '#F8FAFC',
        textMuted: '#94A3B8',
        border: '#334155',
        accent: '#06B6D4',
        accentHover: '#0891b2',
    },
    emerald: {
        bg: '#0b141a',
        surface: '#111b21',
        textMain: '#e9edef',
        textMuted: '#8696a0',
        border: '#222e35',
        accent: '#00a884',
        accentHover: '#008069',
    },
    midnight: {
        bg: '#050811',
        surface: '#0b1120',
        textMain: '#ffffff',
        textMuted: '#8092a8',
        border: '#1a2538',
        accent: '#00d4ff',
        accentHover: '#06b6d4',
    },
    light: {
        bg: '#f0f2f5',
        surface: '#ffffff',
        textMain: '#111b21',
        textMuted: '#54656f',
        border: '#e9edef',
        accent: '#00a884',
        accentHover: '#008069',
    }
};

export const applyTheme = (themeName) => {
    let active = THEMES[themeName];
    if (!active) {
        if (themeName === 'system') {
            const prefersLight = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
            active = prefersLight ? THEMES.light : THEMES.dark;
        } else {
            active = THEMES.dark;
        }
    }
    
    if (typeof document !== 'undefined') {
        const root = document.documentElement;
        root.setAttribute('data-theme', themeName || 'dark');
        root.style.setProperty('--colors-bg', active.bg);
        root.style.setProperty('--colors-surface', active.surface);
        root.style.setProperty('--colors-textMain', active.textMain);
        root.style.setProperty('--colors-textMuted', active.textMuted);
        root.style.setProperty('--colors-border', active.border);
        root.style.setProperty('--colors-accent', active.accent);
        root.style.setProperty('--colors-accentHover', active.accentHover);
        
        if (document.body) {
            document.body.style.backgroundColor = active.bg;
            document.body.style.color = active.textMain;
        }
    }
};

