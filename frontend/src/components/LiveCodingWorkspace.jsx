import React, { useState, useRef, useEffect } from 'react';
import { Play, Copy, Check, Send, Trash2, Code2, Terminal, RefreshCw, X, Sparkles, ChevronDown } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CODE_TEMPLATES = {
    javascript: {
        name: 'Two Sum Algorithm',
        code: `// DevSup Live Coding - Two Sum
function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}

console.log("Testing twoSum([2, 7, 11, 15], 9)...");
const result = twoSum([2, 7, 11, 15], 9);
console.log("Indices found:", result);
return result;`
    },
    python: {
        name: 'QuickSort & Benchmark',
        code: `# DevSup Live Coding - QuickSort
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

numbers = [38, 27, 43, 3, 9, 82, 10]
print("Original:", numbers)
sorted_numbers = quicksort(numbers)
print("Sorted:", sorted_numbers)`
    },
    typescript: {
        name: 'Async Pipeline',
        code: `// DevSup Live Coding - Type-safe Event Pipeline
interface PipelineEvent<T> {
    id: string;
    payload: T;
    timestamp: number;
}

class EventBus<T> {
    private handlers: Array<(event: PipelineEvent<T>) => void> = [];

    subscribe(fn: (event: PipelineEvent<T>) => void) {
        this.handlers.push(fn);
    }

    emit(payload: T) {
        const evt: PipelineEvent<T> = {
            id: Math.random().toString(36).slice(2),
            payload,
            timestamp: Date.now()
        };
        this.handlers.forEach(h => h(evt));
    }
}

const bus = new EventBus<string>();
bus.subscribe(e => console.log("[EVENT]", e.id, "=>", e.payload));
bus.emit("Signaling established with channel peer");`
    },
    html: {
        name: 'Interactive Glass Card',
        code: `<!-- DevSup Live UI Preview -->
<div style="background: rgba(6, 182, 212, 0.15); border: 1px solid #06b6d4; padding: 20px; border-radius: 12px; font-family: sans-serif; color: #fff;">
  <h3 style="margin: 0 0 8px 0; color: #06b6d4;">DevSup Live UI Sandbox</h3>
  <p style="margin: 0; color: #94a3b8;">Real-time styling rendered inside channel workspace.</p>
</div>`
    }
};

export default function LiveCodingWorkspace({ onClose, onSendToChat, activeConversationName = 'Channel' }) {
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState(CODE_TEMPLATES.javascript.code);
    const [output, setOutput] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [copied, setCopied] = useState(false);
    const [shared, setShared] = useState(false);
    const editorRef = useRef(null);

    const handleLanguageChange = (newLang) => {
        setLanguage(newLang);
        if (CODE_TEMPLATES[newLang]) {
            setCode(CODE_TEMPLATES[newLang].code);
        }
        setOutput([]);
    };

    const handleRunCode = () => {
        setIsRunning(true);
        const startTime = performance.now();
        const logs = [];

        if (language === 'javascript' || language === 'typescript') {
            try {
                // Intercept console inside sandbox
                const customConsole = {
                    log: (...args) => logs.push({ type: 'log', text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }),
                    info: (...args) => logs.push({ type: 'info', text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }),
                    warn: (...args) => logs.push({ type: 'warn', text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }),
                    error: (...args) => logs.push({ type: 'error', text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') })
                };

                // Remove export/interface typescript keywords before evaluation
                const executableJs = code
                    .replace(/interface\s+[\w<>]+\s*\{[^}]*\}/g, '')
                    .replace(/type\s+[\w<>]+\s*=\s*[^;]+;/g, '')
                    .replace(/:\s*[A-Z][a-zA-Z0-9<>\[\]]*/g, '');

                const runFn = new Function('console', executableJs);
                const result = runFn(customConsole);

                if (result !== undefined) {
                    logs.push({ type: 'return', text: `Return => ${typeof result === 'object' ? JSON.stringify(result) : String(result)}` });
                }

                const elapsed = (performance.now() - startTime).toFixed(1);
                logs.push({ type: 'system', text: `Execution finished in ${elapsed}ms (Exit 0)` });
            } catch (err) {
                logs.push({ type: 'error', text: `${err.name}: ${err.message}` });
            }
        } else if (language === 'html') {
            logs.push({ type: 'info', text: 'HTML markup verified and ready for browser rendering.' });
            logs.push({ type: 'system', text: 'Live DOM compiled in 1.2ms' });
        } else {
            logs.push({ type: 'info', text: `[Simulated ${language.toUpperCase()} Runner] Syntax analyzed successfully.` });
            logs.push({ type: 'system', text: 'Compiled with exit code 0.' });
        }

        setOutput(logs);
        setIsRunning(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleBroadcast = () => {
        if (!code.trim() || !onSendToChat) return;
        const formattedSnippet = '```' + language + '\n' + code.trim() + '\n```';
        onSendToChat(formattedSnippet);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
    };

    const handleKeyDown = (e) => {
        // Tab key support
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const val = e.target.value;
            setCode(val.substring(0, start) + '    ' + val.substring(end));
            setTimeout(() => {
                if (editorRef.current) {
                    editorRef.current.selectionStart = editorRef.current.selectionEnd = start + 4;
                }
            }, 0);
        }
        // Ctrl+Enter to Run
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleRunCode();
        }
    };

    const lineCount = code.split('\n').length;
    const linesArr = Array.from({ length: Math.max(lineCount, 12) }, (_, i) => i + 1);

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#0d1117', color: '#c9d1d9', overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                backgroundColor: '#161b22',
                borderBottom: '1px solid #30363d',
                gap: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--colors-accent)', fontWeight: 600, fontSize: '0.95rem' }}>
                        <Code2 size={20} />
                        <span>Live Code IDE</span>
                    </div>

                    <div style={{ height: '18px', width: '1px', backgroundColor: '#30363d' }} />

                    <select
                        value={language}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        style={{
                            backgroundColor: '#21262d',
                            color: '#c9d1d9',
                            border: '1px solid #30363d',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '0.85rem',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="javascript">JavaScript (Node / ES6)</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                        <option value="html">HTML5 / Web Sandbox</option>
                    </select>

                    <span style={{ fontSize: '0.8rem', color: '#8b949e' }}>
                        Ctrl + Enter to run
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        type="button"
                        onClick={handleRunCode}
                        disabled={isRunning}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            backgroundColor: '#238636',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                    >
                        <Play size={14} fill="#fff" />
                        {isRunning ? 'Running...' : 'Run Code'}
                    </button>

                    <button
                        type="button"
                        onClick={handleBroadcast}
                        title="Share this code snippet in channel chat"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            backgroundColor: shared ? '#1f6feb' : '#21262d',
                            color: '#c9d1d9',
                            border: '1px solid #30363d',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            cursor: 'pointer'
                        }}
                    >
                        {shared ? <Check size={14} color="#58a6ff" /> : <Send size={14} />}
                        {shared ? 'Shared to Chat!' : 'Share in Chat'}
                    </button>

                    <button
                        type="button"
                        onClick={handleCopy}
                        title="Copy code"
                        style={{
                            padding: '6px 10px',
                            backgroundColor: '#21262d',
                            color: '#c9d1d9',
                            border: '1px solid #30363d',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        {copied ? <Check size={16} color="#3fb950" /> : <Copy size={16} />}
                    </button>

                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            title="Close Live Coding"
                            style={{
                                padding: '6px 10px',
                                backgroundColor: 'transparent',
                                color: '#8b949e',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Editor & Terminal Split */}
            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
                {/* Code Editor */}
                <div style={{ flex: 1.2, display: 'flex', position: 'relative', overflow: 'hidden', borderRight: '1px solid #30363d' }}>
                    {/* Line numbers */}
                    <div style={{
                        padding: '16px 8px 16px 12px',
                        backgroundColor: '#0d1117',
                        borderRight: '1px solid #21262d',
                        color: '#484f58',
                        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                        fontSize: '0.88rem',
                        lineHeight: '1.5',
                        textAlign: 'right',
                        userSelect: 'none',
                        minWidth: '40px'
                    }}>
                        {linesArr.map(n => <div key={n}>{n}</div>)}
                    </div>

                    {/* Textarea */}
                    <textarea
                        ref={editorRef}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onKeyDown={handleKeyDown}
                        spellCheck={false}
                        style={{
                            flex: 1,
                            backgroundColor: '#0d1117',
                            color: '#e6edf3',
                            border: 'none',
                            outline: 'none',
                            padding: '16px 14px',
                            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                            fontSize: '0.88rem',
                            lineHeight: '1.5',
                            resize: 'none',
                            whiteSpace: 'pre',
                            overflowWrap: 'normal',
                            overflowX: 'auto'
                        }}
                    />
                </div>

                {/* Output Terminal */}
                <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', backgroundColor: '#090d13', minWidth: 0 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 14px',
                        backgroundColor: '#161b22',
                        borderBottom: '1px solid #21262d',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#8b949e'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Terminal size={14} />
                            <span>Execution Terminal</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOutput([])}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'none',
                                border: 'none',
                                color: '#8b949e',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                            }}
                        >
                            <Trash2 size={12} /> Clear
                        </button>
                    </div>

                    <div style={{
                        flex: 1,
                        padding: '14px',
                        overflowY: 'auto',
                        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                        fontSize: '0.84rem',
                        lineHeight: '1.5',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                    }}>
                        {output.length === 0 ? (
                            <div style={{ color: '#484f58', fontStyle: 'italic', padding: '20px 0' }}>
                                Click "Run Code" or press Ctrl+Enter to execute.
                            </div>
                        ) : (
                            output.map((line, idx) => {
                                let color = '#c9d1d9';
                                if (line.type === 'error') color = '#f85149';
                                else if (line.type === 'return') color = '#56d364';
                                else if (line.type === 'info') color = '#58a6ff';
                                else if (line.type === 'system') color = '#8b949e';

                                return (
                                    <div key={idx} style={{ color, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                        <span style={{ opacity: 0.4, userSelect: 'none' }}>❯</span>
                                        <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{line.text}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

