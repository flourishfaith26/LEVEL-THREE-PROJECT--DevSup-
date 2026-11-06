export const playNotificationSound = () => {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        const now = ctx.currentTime;
        
        // Tone 1: 587.33 Hz (D5)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.18, now + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.25);

        // Tone 2: 880 Hz (A5)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.1);
        gain2.gain.setValueAtTime(0, now + 0.1);
        gain2.gain.linearRampToValueAtTime(0.22, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.45);
    } catch (e) {
        console.warn('Audio playback not permitted or not supported', e);
    }
};

/**
 * Authentic, soothing WhatsApp-style call sound synthesizer.
 * - If isReceiving === true (Incoming Call): Plays the melodic, mellow wooden Marimba ringtone.
 * - If isReceiving === false (Outgoing Call): Plays the gentle, warm WhatsApp dual-sine ringback tone (soft tu-tuuu... pause).
 * Zero harsh buzzers or sharp beeps.
 */
export const playWhatsAppCallSound = (isReceiving = false) => {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return { stop: () => {}, pause: () => {} };

        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        let isStopped = false;
        let loopTimer = null;

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.9, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, ctx.currentTime);
        filter.Q.setValueAtTime(1, ctx.currentTime);

        masterGain.connect(filter);
        filter.connect(ctx.destination);

        // Helper to synthesize a mellow wooden marimba note
        const playMarimbaBar = (freq, startTime, duration) => {
            if (isStopped || ctx.state === 'closed') return;

            // Fundamental warm tone
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.16, startTime + 0.004);
            gain.gain.exponentialRampToValueAtTime(0.0003, startTime + duration);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(startTime);
            osc.stop(startTime + duration);

            // Subtle marimba strike overtone (quick wood tap)
            const overtone = ctx.createOscillator();
            const overtoneGain = ctx.createGain();
            overtone.type = 'sine';
            overtone.frequency.setValueAtTime(freq * 3.95, startTime);

            overtoneGain.gain.setValueAtTime(0, startTime);
            overtoneGain.gain.linearRampToValueAtTime(0.04, startTime + 0.002);
            overtoneGain.gain.exponentialRampToValueAtTime(0.0003, startTime + 0.05);

            overtone.connect(overtoneGain);
            overtoneGain.connect(masterGain);
            overtone.start(startTime);
            overtone.stop(startTime + 0.05);
        };

        // Helper for the gentle WhatsApp outgoing ring pulse (440Hz + 480Hz dual tone)
        const playSoftPulse = (startTime, duration) => {
            if (isStopped || ctx.state === 'closed') return;

            [440, 480].forEach(freq => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.045, startTime + 0.05);
                gain.gain.setValueAtTime(0.045, startTime + duration - 0.06);
                gain.gain.linearRampToValueAtTime(0.0001, startTime + duration);

                osc.connect(gain);
                gain.connect(masterGain);
                osc.start(startTime);
                osc.stop(startTime + duration);
            });
        };

        // WhatsApp incoming call marimba melody sequence [frequency, duration, noteGap]
        const MARIMBA_MELODY = [
            [587.33, 0.11, 0.04],  // D5
            [739.99, 0.11, 0.04],  // F#5
            [880.00, 0.11, 0.04],  // A5
            [1174.66, 0.22, 0.08], // D6
            [1108.73, 0.13, 0.04], // C#6
            [880.00, 0.13, 0.04],  // A5
            [739.99, 0.13, 0.04],  // F#5
            [659.25, 0.26, 0.18],  // E5

            [587.33, 0.11, 0.04],  // D5
            [739.99, 0.11, 0.04],  // F#5
            [880.00, 0.11, 0.04],  // A5
            [987.77, 0.20, 0.06],  // B5
            [880.00, 0.13, 0.04],  // A5
            [739.99, 0.13, 0.04],  // F#5
            [659.25, 0.13, 0.04],  // E5
            [587.33, 0.35, 1.35]   // D5 + gentle pause before repeating
        ];

        const startIncomingMelodyLoop = () => {
            if (isStopped) return;

            let cursorTime = ctx.currentTime + 0.05;
            for (let i = 0; i < MARIMBA_MELODY.length; i++) {
                const [freq, dur, gap] = MARIMBA_MELODY[i];
                playMarimbaBar(freq, cursorTime, dur);
                cursorTime += dur + gap;
            }

            const totalDurationMs = Math.max(1000, (cursorTime - ctx.currentTime) * 1000);
            loopTimer = setTimeout(() => {
                if (!isStopped) startIncomingMelodyLoop();
            }, totalDurationMs);
        };

        const startOutgoingRingLoop = () => {
            if (isStopped) return;

            const t = ctx.currentTime + 0.05;
            // Pulse 1: 0.4s
            playSoftPulse(t, 0.4);
            // Pulse 2: 0.4s after 0.2s pause
            playSoftPulse(t + 0.6, 0.4);

            // Repeat every 3.2 seconds
            loopTimer = setTimeout(() => {
                if (!isStopped) startOutgoingRingLoop();
            }, 3200);
        };

        if (isReceiving) {
            startIncomingMelodyLoop();
        } else {
            startOutgoingRingLoop();
        }

        const stop = () => {
            isStopped = true;
            if (loopTimer) {
                clearTimeout(loopTimer);
                loopTimer = null;
            }
            try {
                if (ctx.state !== 'closed') {
                    masterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
                    setTimeout(() => {
                        try { ctx.close(); } catch (e) {}
                    }, 80);
                }
            } catch (e) {}
        };

        return {
            stop,
            pause: stop
        };
    } catch (e) {
        console.warn('Unable to initialize WhatsApp call audio:', e);
        return { stop: () => {}, pause: () => {} };
    }
};


