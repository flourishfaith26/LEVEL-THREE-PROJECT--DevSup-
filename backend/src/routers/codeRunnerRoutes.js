import express from 'express';
import { askGemini } from './aiRoutes.js';

const router = express.Router();

// Supported Piston runtime mapping
const RUNTIME_MAP = {
    javascript: { language: 'javascript', version: '18.15.0' },
    typescript: { language: 'typescript', version: '5.0.3' },
    python: { language: 'python', version: '3.10.0' },
    python3: { language: 'python', version: '3.10.0' },
    cpp: { language: 'c++', version: '10.2.0' },
    'c++': { language: 'c++', version: '10.2.0' },
    c: { language: 'c', version: '10.2.0' },
    java: { language: 'java', version: '15.0.2' },
    go: { language: 'go', version: '1.16.2' },
    golang: { language: 'go', version: '1.16.2' },
    rust: { language: 'rust', version: '1.68.2' },
    php: { language: 'php', version: '8.2.3' },
    ruby: { language: 'ruby', version: '3.0.1' },
    bash: { language: 'bash', version: '5.2.0' }
};

/**
 * POST /api/code/run
 * Body: { language, code, stdin }
 * Safely executes code via Piston Multi-Language Sandbox
 */
router.post('/run', async (req, res) => {
    const { language = 'javascript', code, stdin = '' } = req.body;

    if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Code is required for execution' });
    }

    const normalizedLang = language.toLowerCase().trim();
    const runtime = RUNTIME_MAP[normalizedLang] || { language: normalizedLang, version: '*' };

    const startTime = Date.now();

    try {
        // 1. Call Piston Sandbox Engine
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 9000);

        const pistonResponse = await fetch('https://emkc.org/api/v2/piston/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: runtime.language,
                version: runtime.version,
                files: [
                    {
                        name: getFilename(runtime.language),
                        content: code
                    }
                ],
                stdin: stdin || '',
                run_timeout: 5000,
                compile_timeout: 8000
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (pistonResponse.ok) {
            const data = await pistonResponse.json();
            const elapsed = Date.now() - startTime;
            const run = data.run || {};
            const compile = data.compile || {};

            const stdout = run.stdout || '';
            const stderr = run.stderr || compile.stderr || '';
            const exitCode = typeof run.code === 'number' ? run.code : (compile.code || 0);

            return res.json({
                success: exitCode === 0 && !stderr,
                stdout: stdout,
                stderr: stderr,
                output: run.output || compile.output || (stdout + (stderr ? '\n' + stderr : '')),
                exitCode: exitCode,
                executionTimeMs: elapsed,
                language: runtime.language,
                version: data.version || runtime.version
            });
        }
        
        throw new Error(`Piston runner returned status ${pistonResponse.status}`);
    } catch (err) {
        console.warn('Piston runner error, utilizing fallback runner:', err.message);

        // Fallback for JS
        if (normalizedLang === 'javascript' || normalizedLang === 'typescript') {
            const elapsed = Date.now() - startTime;
            return res.json({
                success: true,
                stdout: 'Sandbox execution evaluated in client VM.',
                stderr: '',
                output: 'Client VM ready.',
                exitCode: 0,
                executionTimeMs: elapsed,
                fallback: true,
                language: normalizedLang
            });
        }

        return res.status(503).json({
            error: 'Execution engine currently unavailable. Please try again in a few moments.',
            details: err.message
        });
    }
});

/**
 * POST /api/code/ai-fix
 * Body: { code, language, error }
 * Prompts Gemini (@devsup-ai) to fix and explain the error in the user's live code
 */
router.post('/ai-fix', async (req, res) => {
    const { code, language = 'javascript', error = '' } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'Code is required' });
    }

    try {
        const prompt = `You are @devsup-ai, an expert staff software engineer.
A developer in DevSup is writing ${language} code and encountered the following error or issue:
\`\`\`
${error || 'Code optimization / bug check requested'}
\`\`\`

Here is their current code:
\`\`\`${language}
${code}
\`\`\`

Please provide:
1. A concise explanation of the bug or potential issue (1-2 bullet points).
2. The complete corrected/optimized code block in \`\`\`${language} ... \`\`\`.
3. Keep your tone encouraging, precise, and developer-centric.`;

        const aiResponse = await askGemini({
            prompt,
            systemInstruction: 'You are @devsup-ai, a concise expert coding assistant embedded in DevSup IDE.'
        });

        res.json({
            success: true,
            analysis: aiResponse
        });
    } catch (err) {
        console.error('AI Fix error:', err);
        res.status(500).json({
            error: 'AI assistant is currently unavailable.',
            details: err.message
        });
    }
});

function getFilename(lang) {
    switch (lang) {
        case 'python': return 'main.py';
        case 'javascript': return 'index.js';
        case 'typescript': return 'index.ts';
        case 'c++': case 'cpp': return 'main.cpp';
        case 'c': return 'main.c';
        case 'java': return 'Main.java';
        case 'go': return 'main.go';
        case 'rust': return 'main.rs';
        case 'php': return 'index.php';
        case 'ruby': return 'main.rb';
        default: return 'script.txt';
    }
}

export default router;
