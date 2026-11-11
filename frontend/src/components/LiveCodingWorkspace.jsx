import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    Play, Copy, Check, Send, Trash2, Code2, Terminal, RefreshCw, 
    X, Sparkles, Users, Eye, Zap, AlertCircle, CheckCircle2, ChevronRight, CornerDownLeft
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const CODE_TEMPLATES = {
    javascript: {
        name: 'JavaScript (Node.js)',
        badge: 'JS',
        code: `// DevSup Live Pair Programming - Two Sum Hash Map
function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) {
            return [map.get(diff), i];
        }
        map.set(nums[i], i);
    }
    return [];
}

const numbers = [2, 7, 11, 15];
const target = 9;
console.log("Input:", numbers, "Target:", target);
console.log("Pair indices:", twoSum(numbers, target));`
    },
    python: {
        name: 'Python 3',
        badge: 'PY',
        code: `# DevSup Live Pair Programming - Binary Search & QuickSort
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    mid = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + mid + quicksort(right)

numbers = [64, 34, 25, 12, 22, 11, 90]
print("Unsorted:", numbers)
print("Sorted:  ", quicksort(numbers))`
    },
    typescript: {
        name: 'TypeScript',
        badge: 'TS',
        code: `// DevSup Live Pair Programming - Generic Stack
class Stack<T> {
    private items: T[] = [];
    push(item: T): void { this.items.push(item); }
    pop(): T | undefined { return this.items.pop(); }
    peek(): T | undefined { return this.items[this.items.length - 1]; }
    size(): number { return this.items.length; }
}

const stack = new Stack<string>();
stack.push("WebSocket connected");
stack.push("Signal dispatched");
console.log("Top item:", stack.peek());
console.log("Stack size:", stack.size());`
    },
    cpp: {
        name: 'C++ (C++17)',
        badge: 'C++',
        code: `// DevSup Live Pair Programming - C++
#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::vector<int> data = {10, 20, 30, 40, 50};
    int sum = std::accumulate(data.begin(), data.end(), 0);
    std::cout << "DevSup C++ Runner" << std::endl;
    std::cout << "Vector sum: " << sum << std::endl;
    return 0;
}`
    },
    go: {
        name: 'Go (Golang)',
        badge: 'GO',
        code: `// DevSup Live Pair Programming - Go Goroutines
package main

import (
    "fmt"
    "time"
)

func worker(id int, ch chan string) {
    ch <- fmt.Sprintf("Worker %d finished task", id)
}

func main() {
    ch := make(chan string, 3)
    for i := 1; i <= 3; i++ {
        go worker(i, ch)
    }
    for i := 1; i <= 3; i++ {
        fmt.Println(<-ch)
    }
    fmt.Println("DevSup Go runner executed successfully.")
}`
    },
    rust: {
        name: 'Rust',
        badge: 'RS',
        code: `// DevSup Live Pair Programming - Rust Memory Safety
fn main() {
    let mut numbers = vec![1, 2, 3, 4, 5];
    numbers.push(6);
    let total: i32 = numbers.iter().sum();
    println!("DevSup Rust Sandbox");
    println!("Numbers: {:?}", numbers);
    println!("Sum: {}", total);
}`
    },
    java: {
        name: 'Java (OpenJDK)',
        badge: 'JAVA',
        code: `// DevSup Live Pair Programming - Java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from DevSup Java Sandbox!");
        int a = 15;
        int b = 25;
        System.out.println("Sum of " + a + " + " + b + " = " + (a + b));
    }
}`
    },
    php: {
        name: 'PHP 8',
        badge: 'PHP',
        code: `<?php
// DevSup Live Pair Programming - PHP
$fruits = ["Apple", "Banana", "Cherry", "Mango"];
echo "DevSup PHP 8 Sandbox\\n";
foreach ($fruits as $idx => $fruit) {
    echo "Item #{$idx}: {$fruit}\\n";
}
?>`
    },
    html: {
        name: 'HTML5 / CSS / Live DOM',
        badge: 'HTML',
        code: `<!-- DevSup Live Interactive Sandbox -->
<div style="padding: 24px; background: linear-gradient(135deg, #0f172a, #1e293b); color: #f8fafc; font-family: system-ui, sans-serif; border-radius: 12px; border: 1px solid #38bdf8;">
    <h2 style="margin: 0 0 8px 0; color: #38bdf8; display: flex; align-items: center; gap: 8px;">
        ⚡ DevSup Pair Programming
    </h2>
    <p style="color: #94a3b8; margin: 0 0 16px 0;">Live rendered DOM preview for engineering teams.</p>
    <button onclick="this.innerText = 'Sync Active! ✅'" style="background: #0284c7; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;">
        Click to Test Interaction
    </button>
</div>`
    }
};

export default function LiveCodingWorkspace({
    onClose,
    onSendToChat,
    activeConversationName = 'Channel',
    conversationId = null,
    socket = null,
    currentUser = null
}) {
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState(CODE_TEMPLATES.javascript.code);
    const [stdin, setStdin] = useState('');
    const [output, setOutput] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [activeTab, setActiveTab] = useState('terminal'); // 'terminal' | 'preview'
    const [executionMeta, setExecutionMeta] = useState(null); // { time, exitCode, mem }
    const [copied, setCopied] = useState(false);
    const [shared, setShared] = useState(false);

    // Collaboration states
    const [peers, setPeers] = useState([]);
    const [peerTyping, setPeerTyping] = useState(null);
    const isRemoteEditRef = useRef(false);

    // AI Debugging states
    const [aiFixLoading, setAiFixLoading] = useState(false);
    const [aiFixResult, setAiFixResult] = useState(null);
    const [showAiModal, setShowAiModal] = useState(false);

    const editorRef = useRef(null);
    const preRef = useRef(null);
    const lineNumRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // 1. Socket.IO Room Join & Sync
    useEffect(() => {
        if (!socket || !conversationId) return;

        const userPayload = {
            id: currentUser?._id || currentUser?.id,
            name: currentUser?.displayName || currentUser?.name || 'Developer'
        };

        socket.emit('code:join', { conversationId, user: userPayload });

        const handlePeerJoined = (data) => {
            if (data?.user?.name) {
                setPeers(prev => [...prev.filter(p => p.id !== data.user.id), data.user]);
            }
        };

        const handlePeerLeft = (data) => {
            if (data?.user?.id) {
                setPeers(prev => prev.filter(p => p.id !== data.user.id));
            }
        };

        const handleCodeUpdate = (data) => {
            if (data?.code !== undefined) {
                isRemoteEditRef.current = true;
                setCode(data.code);
                if (data.language) setLanguage(data.language);
                if (data.senderName) {
                    setPeerTyping(`${data.senderName} is editing...`);
                    clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => setPeerTyping(null), 1800);
                }
                setTimeout(() => { isRemoteEditRef.current = false; }, 50);
            }
        };

        const handleRunStarting = (data) => {
            setIsRunning(true);
            setOutput([{ type: 'system', text: `⚡ ${data.senderName || 'Peer'} initiated code execution...` }]);
        };

        const handleRunCompleted = (data) => {
            setIsRunning(false);
            if (Array.isArray(data.output)) {
                setOutput(data.output);
            }
            if (data.executionTimeMs !== undefined) {
                setExecutionMeta({
                    time: data.executionTimeMs,
                    exitCode: data.success ? 0 : 1
                });
            }
        };

        socket.on('code:peer_joined', handlePeerJoined);
        socket.on('code:peer_left', handlePeerLeft);
        socket.on('code:update', handleCodeUpdate);
        socket.on('code:run:starting', handleRunStarting);
        socket.on('code:run:completed', handleRunCompleted);

        return () => {
            socket.emit('code:leave', { conversationId, user: userPayload });
            socket.off('code:peer_joined', handlePeerJoined);
            socket.off('code:peer_left', handlePeerLeft);
            socket.off('code:update', handleCodeUpdate);
            socket.off('code:run:starting', handleRunStarting);
            socket.off('code:run:completed', handleRunCompleted);
            clearTimeout(typingTimeoutRef.current);
        };
    }, [socket, conversationId, currentUser]);

    // Broadcast code changes to peers
    const broadcastCodeChange = useCallback((newCode, newLang) => {
        if (!socket || !conversationId || isRemoteEditRef.current) return;
        socket.emit('code:change', {
            conversationId,
            code: newCode,
            language: newLang,
            senderId: currentUser?._id || currentUser?.id,
            senderName: currentUser?.displayName || currentUser?.name || 'Developer'
        });
    }, [socket, conversationId, currentUser]);

    const handleCodeChange = (e) => {
        const val = e.target.value;
        setCode(val);
        broadcastCodeChange(val, language);
    };

    const handleLanguageChange = (newLang) => {
        setLanguage(newLang);
        if (CODE_TEMPLATES[newLang]) {
            setCode(CODE_TEMPLATES[newLang].code);
            broadcastCodeChange(CODE_TEMPLATES[newLang].code, newLang);
        }
        setOutput([]);
        setExecutionMeta(null);
        if (newLang === 'html') setActiveTab('preview');
        else setActiveTab('terminal');
    };

    const handleEditorScroll = (e) => {
        const { scrollTop, scrollLeft } = e.target;
        if (preRef.current) {
            preRef.current.scrollTop = scrollTop;
            preRef.current.scrollLeft = scrollLeft;
        }
        if (lineNumRef.current) {
            lineNumRef.current.scrollTop = scrollTop;
        }
    };

    // 2. Real Multi-Language Code Execution
    const handleRunCode = async () => {
        if (isRunning) return;
        setIsRunning(true);
        setExecutionMeta(null);

        // Broadcast to peers that execution started
        if (socket && conversationId) {
            socket.emit('code:run:start', {
                conversationId,
                senderName: currentUser?.displayName || currentUser?.name || 'Developer',
                language
            });
        }

        const logs = [];

        // For HTML, immediately render preview
        if (language === 'html') {
            setActiveTab('preview');
            logs.push({ type: 'info', text: 'HTML DOM compiled into live sandbox preview.' });
            logs.push({ type: 'system', text: 'Browser iframe mounted in 0.8ms' });
            setOutput(logs);
            setIsRunning(false);
            return;
        }

        try {
            // Call DevSup Multi-Language Piston Code Runner
            const response = await fetch(`${BACKEND_URL}/api/code/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language,
                    code,
                    stdin
                })
            });

            const data = await response.json();

            if (response.ok && data) {
                if (data.stdout) {
                    data.stdout.trim().split('\n').forEach(line => {
                        logs.push({ type: 'log', text: line });
                    });
                }

                if (data.stderr) {
                    data.stderr.trim().split('\n').forEach(line => {
                        logs.push({ type: 'error', text: line });
                    });
                }

                if (!data.stdout && !data.stderr && data.output) {
                    data.output.trim().split('\n').forEach(line => {
                        logs.push({ type: 'log', text: line });
                    });
                }

                const elapsed = data.executionTimeMs || 0;
                const exitCode = data.exitCode !== undefined ? data.exitCode : 0;
                logs.push({
                    type: exitCode === 0 ? 'system' : 'error',
                    text: `Program finished with exit code ${exitCode} (${elapsed}ms)`
                });

                setExecutionMeta({
                    time: elapsed,
                    exitCode: exitCode,
                    version: data.version
                });
            } else {
                throw new Error(data.error || 'Execution failed');
            }
        } catch (err) {
            // Local fallback execution for JavaScript/TypeScript if remote runner fails
            if (language === 'javascript' || language === 'typescript') {
                const startTime = performance.now();
                try {
                    const customConsole = {
                        log: (...args) => logs.push({ type: 'log', text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }),
                        info: (...args) => logs.push({ type: 'info', text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }),
                        warn: (...args) => logs.push({ type: 'warn', text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }),
                        error: (...args) => logs.push({ type: 'error', text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') })
                    };

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
                    logs.push({ type: 'system', text: `Executed in client sandbox in ${elapsed}ms (Exit 0)` });
                    setExecutionMeta({ time: elapsed, exitCode: 0 });
                } catch (clientErr) {
                    logs.push({ type: 'error', text: `${clientErr.name}: ${clientErr.message}` });
                    setExecutionMeta({ time: 0, exitCode: 1 });
                }
            } else {
                logs.push({ type: 'error', text: `Execution failed: ${err.message}` });
                logs.push({ type: 'system', text: 'Piston runner timed out or is temporarily unreachable.' });
            }
        }

        setOutput(logs);
        setIsRunning(false);

        // Sync completed output with peers
        if (socket && conversationId) {
            socket.emit('code:run:result', {
                conversationId,
                output: logs,
                senderName: currentUser?.displayName || currentUser?.name || 'Developer',
                language,
                executionTimeMs: executionMeta?.time || 0,
                success: !logs.some(l => l.type === 'error')
            });
        }
    };

    // 3. AI Debug & Optimization with @devsup-ai
    const handleAskAiToFix = async () => {
        setAiFixLoading(true);
        setShowAiModal(true);
        setAiFixResult(null);

        const errorLogs = output.filter(l => l.type === 'error').map(l => l.text).join('\n');

        try {
            const res = await fetch(`${BACKEND_URL}/api/code/ai-fix`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language,
                    code,
                    error: errorLogs || 'Optimize performance, handle edge cases, and explain time/space complexity.'
                })
            });

            const data = await res.json();
            if (res.ok && data.analysis) {
                setAiFixResult(data.analysis);
            } else {
                setAiFixResult('AI assistant could not process code at this moment.');
            }
        } catch (err) {
            setAiFixResult(`Failed to reach @devsup-ai: ${err.message}`);
        } finally {
            setAiFixLoading(false);
        }
    };

    // Apply AI suggested code
    const handleApplyAiCode = () => {
        if (!aiFixResult) return;
        // Extract code block from markdown if present
        const match = aiFixResult.match(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/);
        if (match && match[1]) {
            const extracted = match[1].trim();
            setCode(extracted);
            broadcastCodeChange(extracted, language);
        }
        setShowAiModal(false);
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
            const nextCode = val.substring(0, start) + '    ' + val.substring(end);
            setCode(nextCode);
            broadcastCodeChange(nextCode, language);
            setTimeout(() => {
                if (editorRef.current) {
                    editorRef.current.selectionStart = editorRef.current.selectionEnd = start + 4;
                }
            }, 0);
        }
        // Ctrl+Enter or Cmd+Enter to Run
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleRunCode();
        }
    };

    const hasErrors = output.some(l => l.type === 'error');
    const lineCount = code.split('\n').length;
    const linesArr = Array.from({ length: Math.max(lineCount, 14) }, (_, i) => i + 1);

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#0d1117', color: '#c9d1d9', overflow: 'hidden' }}>
            {/* Top Toolbar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 18px',
                backgroundColor: '#161b22',
                borderBottom: '1px solid #30363d',
                gap: '12px',
                flexWrap: 'wrap'
            }}>
                {/* Left controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 600, fontSize: '0.95rem' }}>
                        <Code2 size={20} />
                        <span>Pair IDE</span>
                    </div>

                    <div style={{ height: '18px', width: '1px', backgroundColor: '#30363d' }} />

                    {/* Language Selector */}
                    <select
                        value={language}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        style={{
                            backgroundColor: '#21262d',
                            color: '#f0f6fc',
                            border: '1px solid #30363d',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        {Object.entries(CODE_TEMPLATES).map(([key, t]) => (
                            <option key={key} value={key}>{t.name}</option>
                        ))}
                    </select>

                    {/* Collaborative Peers Badge */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        backgroundColor: '#21262d',
                        border: '1px solid #30363d',
                        fontSize: '0.78rem',
                        color: peers.length > 0 ? '#3fb950' : '#8b949e'
                    }}>
                        <span style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            backgroundColor: peers.length > 0 ? '#3fb950' : '#8b949e',
                            boxShadow: peers.length > 0 ? '0 0 8px #3fb950' : 'none'
                        }} />
                        <Users size={12} />
                        <span>{peers.length > 0 ? `${peers.length + 1} pair active` : 'Live session'}</span>
                    </div>

                    {/* Peer typing status indicator */}
                    {peerTyping && (
                        <span style={{ fontSize: '0.78rem', color: '#58a6ff', fontStyle: 'italic', animation: 'pulse 1.5s infinite' }}>
                            {peerTyping}
                        </span>
                    )}
                </div>

                {/* Right actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Ask @devsup-ai button */}
                    <button
                        type="button"
                        onClick={handleAskAiToFix}
                        title="Analyze and debug code with Gemini AI"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            backgroundColor: 'rgba(168, 85, 247, 0.15)',
                            color: '#c084fc',
                            border: '1px solid rgba(168, 85, 247, 0.4)',
                            borderRadius: '6px',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Sparkles size={14} />
                        <span>Ask AI</span>
                    </button>

                    {/* Run Code Button */}
                    <button
                        type="button"
                        onClick={handleRunCode}
                        disabled={isRunning}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 15px',
                            backgroundColor: isRunning ? '#1f6feb' : '#238636',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: isRunning ? 'wait' : 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            transition: 'background 0.2s'
                        }}
                    >
                        {isRunning ? <RefreshCw size={14} className="spin" /> : <Play size={14} fill="#fff" />}
                        <span>{isRunning ? 'Executing...' : 'Run Code'}</span>
                    </button>

                    {/* Share to Chat */}
                    <button
                        type="button"
                        onClick={handleBroadcast}
                        title="Post code snippet into chat"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            backgroundColor: shared ? '#1f6feb' : '#21262d',
                            color: '#c9d1d9',
                            border: '1px solid #30363d',
                            borderRadius: '6px',
                            fontSize: '0.82rem',
                            fontWeight: 500,
                            cursor: 'pointer'
                        }}
                    >
                        {shared ? <Check size={14} color="#58a6ff" /> : <Send size={14} />}
                        <span>{shared ? 'Sent!' : 'Send to Chat'}</span>
                    </button>

                    {/* Copy */}
                    <button
                        type="button"
                        onClick={handleCopy}
                        title="Copy code to clipboard"
                        style={{
                            padding: '6px 10px',
                            backgroundColor: '#21262d',
                            color: '#c9d1d9',
                            border: '1px solid #30363d',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        {copied ? <Check size={15} color="#3fb950" /> : <Copy size={15} />}
                    </button>

                    {/* Close */}
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            title="Close Live Coding Workspace"
                            style={{
                                padding: '6px 8px',
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

            {/* Split Screen: Left (Editor) / Right (Terminal & Preview) */}
            <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
                {/* Code Editor Container */}
                <div style={{
                    flex: 1.25,
                    display: 'flex',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRight: '1px solid #30363d',
                    backgroundColor: '#1e1e1e'
                }}>
                    {/* Line numbers gutter */}
                    <div
                        ref={lineNumRef}
                        style={{
                            padding: '16px 8px 16px 12px',
                            backgroundColor: '#1e1e1e',
                            borderRight: '1px solid #2d2d2d',
                            color: '#6e7681',
                            fontFamily: 'Consolas, "Fira Code", Monaco, monospace',
                            fontSize: '0.88rem',
                            lineHeight: '1.5',
                            textAlign: 'right',
                            userSelect: 'none',
                            minWidth: '44px',
                            overflow: 'hidden'
                        }}
                    >
                        {linesArr.map(n => <div key={n} style={{ height: '1.5em' }}>{n}</div>)}
                    </div>

                    {/* Syntax Highlighted & Editable Code Area */}
                    <div style={{ position: 'relative', flex: 1, height: '100%', overflow: 'hidden', backgroundColor: '#1e1e1e' }}>
                        {/* Layer 1: Syntax Highlighted Display */}
                        <div
                            ref={preRef}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                overflow: 'hidden',
                                margin: 0,
                                padding: '16px 14px',
                                boxSizing: 'border-box',
                                pointerEvents: 'none',
                                userSelect: 'none'
                            }}
                        >
                            <SyntaxHighlighter
                                language={language === 'typescript' ? 'tsx' : (language === 'c++' ? 'cpp' : language)}
                                style={vscDarkPlus}
                                customStyle={{
                                    margin: 0,
                                    padding: 0,
                                    background: 'transparent',
                                    fontSize: '0.88rem',
                                    lineHeight: '1.5',
                                    fontFamily: 'Consolas, "Fira Code", Monaco, monospace',
                                    whiteSpace: 'pre',
                                    wordBreak: 'normal',
                                    overflowWrap: 'normal',
                                    tabSize: 4
                                }}
                                codeTagProps={{
                                    style: {
                                        fontFamily: 'Consolas, "Fira Code", Monaco, monospace',
                                        fontSize: '0.88rem',
                                        lineHeight: '1.5'
                                    }
                                }}
                            >
                                {code + (code.endsWith('\n') ? ' ' : '')}
                            </SyntaxHighlighter>
                        </div>

                        {/* Layer 2: Transparent Input Textarea */}
                        <textarea
                            ref={editorRef}
                            className="live-code-textarea"
                            value={code}
                            onChange={handleCodeChange}
                            onKeyDown={handleKeyDown}
                            onScroll={handleEditorScroll}
                            spellCheck={false}
                            autoCapitalize="off"
                            autoComplete="off"
                            autoCorrect="off"
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                margin: 0,
                                padding: '16px 14px',
                                boxSizing: 'border-box',
                                background: 'transparent',
                                color: 'transparent',
                                caretColor: '#58a6ff',
                                border: 'none',
                                outline: 'none',
                                fontFamily: 'Consolas, "Fira Code", Monaco, monospace',
                                fontSize: '0.88rem',
                                lineHeight: '1.5',
                                resize: 'none',
                                whiteSpace: 'pre',
                                overflowWrap: 'normal',
                                overflow: 'auto',
                                zIndex: 2,
                                tabSize: 4
                            }}
                        />
                    </div>
                </div>

                {/* Right Pane: Terminal / Live DOM Preview */}
                <div style={{ flex: 0.85, display: 'flex', flexDirection: 'column', backgroundColor: '#090d13', minWidth: 0 }}>
                    {/* Terminal Navigation Bar */}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={() => setActiveTab('terminal')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    backgroundColor: activeTab === 'terminal' ? '#21262d' : 'transparent',
                                    color: activeTab === 'terminal' ? '#58a6ff' : '#8b949e',
                                    fontWeight: activeTab === 'terminal' ? 600 : 500
                                }}
                            >
                                <Terminal size={14} />
                                <span>Output</span>
                            </button>

                            {language === 'html' && (
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('preview')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        backgroundColor: activeTab === 'preview' ? '#21262d' : 'transparent',
                                        color: activeTab === 'preview' ? '#38bdf8' : '#8b949e',
                                        fontWeight: activeTab === 'preview' ? 600 : 500
                                    }}
                                >
                                    <Eye size={14} />
                                    <span>Web Preview</span>
                                </button>
                            )}
                        </div>

                        {/* Execution benchmarks */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {executionMeta && (
                                <span style={{
                                    fontSize: '0.74rem',
                                    color: executionMeta.exitCode === 0 ? '#3fb950' : '#f85149',
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    padding: '2px 6px',
                                    borderRadius: '4px'
                                }}>
                                    {executionMeta.time}ms • Exit {executionMeta.exitCode}
                                </span>
                            )}

                            <button
                                type="button"
                                onClick={() => { setOutput([]); setExecutionMeta(null); }}
                                title="Clear Terminal"
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
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Terminal Body */}
                    {activeTab === 'terminal' ? (
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
                                <div style={{ color: '#484f58', fontStyle: 'italic', padding: '24px 0', textAlign: 'center' }}>
                                    Press <kbd style={{ padding: '2px 5px', background: '#21262d', borderRadius: '4px', color: '#c9d1d9' }}>Ctrl + Enter</kbd> to run code across multi-language sandbox.
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

                            {/* Intelligent AI Prompt on Error */}
                            {hasErrors && (
                                <div style={{
                                    marginTop: '12px',
                                    padding: '10px 14px',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                                    border: '1px solid rgba(168, 85, 247, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d8b4fe', fontSize: '0.8rem' }}>
                                        <Sparkles size={16} />
                                        <span>Error detected in execution trace.</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAskAiToFix}
                                        style={{
                                            padding: '4px 10px',
                                            backgroundColor: '#8b5cf6',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '0.78rem',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Ask @devsup-ai to Fix
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Live HTML DOM Iframe Preview */
                        <div style={{ flex: 1, backgroundColor: '#ffffff', position: 'relative' }}>
                            <iframe
                                title="Live Preview"
                                srcDoc={code}
                                sandbox="allow-scripts"
                                style={{ width: '100%', height: '100%', border: 'none' }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* AI Assistant Modal / Drawer */}
            {showAiModal && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(3px)',
                    zIndex: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px'
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '680px',
                        maxHeight: '85vh',
                        backgroundColor: '#161b22',
                        border: '1px solid #30363d',
                        borderRadius: '12px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        {/* Header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 20px',
                            borderBottom: '1px solid #30363d',
                            backgroundColor: '#0d1117'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', fontWeight: 600 }}>
                                <Sparkles size={18} />
                                <span>@devsup-ai Code Inspector</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAiModal(false)}
                                style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                            {aiFixLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '12px' }}>
                                    <RefreshCw size={24} className="spin" color="#c084fc" />
                                    <span style={{ fontSize: '0.88rem', color: '#8b949e' }}>
                                        Analyzing AST, checking bounds, and generating fix with Gemini...
                                    </span>
                                </div>
                            ) : (
                                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.88rem', lineHeight: '1.6', color: '#e6edf3' }}>
                                    {aiFixResult}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            padding: '12px 20px',
                            borderTop: '1px solid #30363d',
                            backgroundColor: '#0d1117',
                            gap: '10px'
                        }}>
                            <button
                                type="button"
                                onClick={() => setShowAiModal(false)}
                                style={{
                                    padding: '6px 14px',
                                    backgroundColor: '#21262d',
                                    color: '#c9d1d9',
                                    border: '1px solid #30363d',
                                    borderRadius: '6px',
                                    fontSize: '0.84rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                            {aiFixResult && !aiFixLoading && (
                                <button
                                    type="button"
                                    onClick={handleApplyAiCode}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 14px',
                                        backgroundColor: '#8b5cf6',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '0.84rem',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <CheckCircle2 size={15} />
                                    <span>Apply Fix to Editor</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
