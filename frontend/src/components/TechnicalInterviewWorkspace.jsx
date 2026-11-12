import React, { useState, useEffect, useRef } from 'react';
import { 
    Play, RotateCcw, Clock, Award, CheckCircle2, AlertCircle, 
    FileText, UserCheck, Shield, Sparkles, Send, Copy, Check, 
    Maximize2, Minimize2, X, ChevronRight, Terminal, BookOpen, 
    Sliders, MessageSquare, Code2, Users
} from 'lucide-react';

const CURATED_PROBLEMS = [
    {
        id: 'two-sum',
        title: 'Two Sum',
        difficulty: 'Easy',
        category: 'Arrays & Hash Maps',
        description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.`,
        examples: [
            { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
            { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
            { input: 'nums = [3,3], target = 6', output: '[0,1]' }
        ],
        constraints: [
            '2 <= nums.length <= 10^4',
            '-10^9 <= nums[i] <= 10^9',
            '-10^9 <= target <= 10^9',
            'Only one valid answer exists.'
        ],
        templates: {
            javascript: `function twoSum(nums, target) {
    // Write your optimal O(n) solution here
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

// Test run
console.log(twoSum([2, 7, 11, 15], 9)); // Expected: [0, 1]
console.log(twoSum([3, 2, 4], 6));       // Expected: [1, 2]`,
            python: `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Test run
print(twoSum([2, 7, 11, 15], 9)) # Expected: [0, 1]
print(twoSum([3, 2, 4], 6))       # Expected: [1, 2]`,
            cpp: `#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> map;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (map.find(complement) != map.end()) {
            return {map[complement], i};
        }
        map[nums[i]] = i;
    }
    return {};
}

int main() {
    vector<int> nums = {2, 7, 11, 15};
    vector<int> res = twoSum(nums, 9);
    cout << "[" << res[0] << ", " << res[1] << "]" << endl;
    return 0;
}`,
            go: `package main

import "fmt"

func twoSum(nums []int, target int) []int {
    m := make(map[int]int)
    for i, num := range nums {
        complement := target - num
        if idx, ok := m[complement]; ok {
            return []int{idx, i}
        }
        m[num] = i
    }
    return nil
}

func main() {
    fmt.Println(twoSum([]int{2, 7, 11, 15}, 9))
}`,
            java: `import java.util.*;

public class Solution {
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[] {};
    }

    public static void main(String[] args) {
        int[] res = twoSum(new int[]{2, 7, 11, 15}, 9);
        System.out.println(Arrays.toString(res));
    }
}`
        }
    },
    {
        id: 'valid-parentheses',
        title: 'Valid Parentheses',
        difficulty: 'Easy',
        category: 'Stacks',
        description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
        examples: [
            { input: 's = "()"', output: 'true' },
            { input: 's = "()[]{}"', output: 'true' },
            { input: 's = "(]"', output: 'false' }
        ],
        constraints: [
            '1 <= s.length <= 10^4',
            's consists of parentheses only \'()[]{}\''
        ],
        templates: {
            javascript: `function isValid(s) {
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    for (const char of s) {
        if (char in map) {
            if (stack.pop() !== map[char]) return false;
        } else {
            stack.push(char);
        }
    }
    return stack.length === 0;
}

console.log(isValid("()[]{}")); // Expected: true
console.log(isValid("(]"));     // Expected: false`,
            python: `def isValid(s: str) -> bool:
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    return not stack

print(isValid("()[]{}")) # Expected: True
print(isValid("(]"))     # Expected: False`
        }
    },
    {
        id: 'lru-cache',
        title: 'LRU Cache Design',
        difficulty: 'Medium',
        category: 'System Design & Data Structures',
        description: `Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.

Implement the \`LRUCache\` class:
- \`LRUCache(int capacity)\` Initialize the LRU cache with positive size capacity.
- \`int get(int key)\` Return the value of the key if the key exists, otherwise return -1.
- \`void put(int key, int value)\` Update the value of the key if that key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.

The functions \`get\` and \`put\` must each run in \`O(1)\` average time complexity.`,
        examples: [
            { input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]', output: '[null, null, null, 1, null, -1, null, -1, 3, 4]' }
        ],
        constraints: [
            '1 <= capacity <= 3000',
            '0 <= key <= 10^4',
            '0 <= value <= 10^5',
            'At most 2 * 10^5 calls will be made to get and put.'
        ],
        templates: {
            javascript: `class LRUCache {
    constructor(capacity) {
        this.capacity = capacity;
        this.cache = new Map();
    }

    get(key) {
        if (!this.cache.has(key)) return -1;
        const val = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, val);
        return val;
    }

    put(key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.capacity) {
            // Delete first (least recently used) entry
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
        this.cache.set(key, value);
    }
}

const lru = new LRUCache(2);
lru.put(1, 1);
lru.put(2, 2);
console.log(lru.get(1)); // returns 1
lru.put(3, 3);          // evicts key 2
console.log(lru.get(2)); // returns -1 (not found)`,
            python: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)

lru = LRUCache(2)
lru.put(1, 1)
lru.put(2, 2)
print(lru.get(1)) # returns 1
lru.put(3, 3)     # evicts key 2
print(lru.get(2)) # returns -1`
        }
    },
    {
        id: 'rate-limiter',
        title: 'Token Bucket Rate Limiter',
        difficulty: 'Hard',
        category: 'Distributed Systems & Concurrency',
        description: `Implement a Token Bucket Rate Limiter algorithm suitable for a distributed microservice gateway.
Features needed:
1. \`capacity\`: Maximum token burst capacity.
2. \`refillRate\`: Number of tokens added per second.
3. \`allowRequest(tokens = 1)\`: Returns true if sufficient tokens exist and decrements, false if rate limited.
4. Thread-safe/asynchronous simulation.`,
        examples: [
            { input: 'bucket = new TokenBucket(capacity=5, refillRate=2); bucket.allowRequest(3)', output: 'true (tokens remaining: 2)' }
        ],
        constraints: [
            'Refill must calculate dynamically based on timestamp elapsed without thread polling.',
            'Support bursting up to capacity.'
        ],
        templates: {
            javascript: `class TokenBucketRateLimiter {
    constructor(capacity, refillRatePerSec) {
        this.capacity = capacity;
        this.refillRate = refillRatePerSec;
        this.tokens = capacity;
        this.lastRefillTimestamp = Date.now();
    }

    refill() {
        const now = Date.now();
        const elapsedSec = (now - this.lastRefillTimestamp) / 1000;
        this.tokens = Math.min(this.capacity, this.tokens + (elapsedSec * this.refillRate));
        this.lastRefillTimestamp = now;
    }

    allowRequest(cost = 1) {
        this.refill();
        if (this.tokens >= cost) {
            this.tokens -= cost;
            return true;
        }
        return false;
    }
}

const limiter = new TokenBucketRateLimiter(5, 2);
console.log("Req 1 (cost 3):", limiter.allowRequest(3)); // true
console.log("Req 2 (cost 3):", limiter.allowRequest(3)); // false (limited)
console.log("Tokens remaining:", limiter.tokens.toFixed(2));`,
            python: `import time

class TokenBucketRateLimiter:
    def __init__(self, capacity: int, refill_rate_per_sec: float):
        self.capacity = capacity
        self.refill_rate = refill_rate_per_sec
        self.tokens = capacity
        self.last_refill = time.time()

    def _refill(self):
        now = time.time()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_refill = now

    def allow_request(self, cost: int = 1) -> bool:
        self._refill()
        if self.tokens >= cost:
            self.tokens -= cost
            return True
        return False

limiter = TokenBucketRateLimiter(5, 2)
print("Req 1:", limiter.allow_request(3)) # True
print("Req 2:", limiter.allow_request(3)) # False`
        }
    }
];

export default function TechnicalInterviewWorkspace({
    isOpen,
    onClose,
    conversationId,
    conversationName = 'Interview Room',
    currentUser,
    socket,
    BACKEND_URL,
    onSendToChat
}) {
    if (!isOpen) return null;

    // Roles: 'interviewer' | 'candidate'
    const [userRole, setUserRole] = useState('interviewer');
    const [selectedProblemId, setSelectedProblemId] = useState('two-sum');
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState('');
    const [consoleOutput, setConsoleOutput] = useState('');
    const [isRunningCode, setIsRunningCode] = useState(false);
    
    // Timer state
    const [timerSeconds, setTimerSeconds] = useState(45 * 60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    // Rubric scores (1 to 5)
    const [rubric, setRubric] = useState({
        problemSolving: 4,
        dsa: 4,
        codeQuality: 4,
        communication: 5
    });
    const [interviewerNotes, setInterviewerNotes] = useState('');
    
    // AI Evaluation report state
    const [isGeneratingEval, setIsGeneratingEval] = useState(false);
    const [evaluationReport, setEvaluationReport] = useState(null);
    const [copiedReport, setCopiedReport] = useState(false);

    // Current problem details
    const currentProblem = CURATED_PROBLEMS.find(p => p.id === selectedProblemId) || CURATED_PROBLEMS[0];

    // Load initial code template when problem or language changes
    useEffect(() => {
        const template = currentProblem.templates[language] || currentProblem.templates.javascript || '// Write solution here';
        setCode(template);
    }, [selectedProblemId, language]);

    // Socket Room Sync
    useEffect(() => {
        if (!socket || !conversationId) return;

        socket.emit('interview:join', {
            conversationId,
            user: currentUser,
            role: userRole
        }, (initialState) => {
            if (initialState) {
                if (initialState.problemId) setSelectedProblemId(initialState.problemId);
                if (initialState.language) setLanguage(initialState.language);
                if (initialState.code) setCode(initialState.code);
                if (typeof initialState.remainingSeconds === 'number') setTimerSeconds(initialState.remainingSeconds);
                if (typeof initialState.isRunning === 'boolean') setIsTimerRunning(initialState.isRunning);
            }
        });

        const handleStateUpdate = (update) => {
            if (update.problemId) setSelectedProblemId(update.problemId);
            if (update.language) setLanguage(update.language);
            if (update.code !== undefined) setCode(update.code);
        };

        const handleTimerUpdate = ({ remainingSeconds, isRunning }) => {
            setTimerSeconds(remainingSeconds);
            setIsTimerRunning(isRunning);
        };

        const handleCodeRunStart = ({ senderName }) => {
            setConsoleOutput(`[Execution initiated by ${senderName}...]`);
        };

        const handleCodeRunResult = ({ output, executionTimeMs }) => {
            setConsoleOutput(`Output (${executionTimeMs || 0}ms):\n${output}`);
            setIsRunningCode(false);
        };

        socket.on('interview:state_updated', handleStateUpdate);
        socket.on('interview:timer_updated', handleTimerUpdate);
        socket.on('code:run:starting', handleCodeRunStart);
        socket.on('code:run:completed', handleCodeRunResult);

        return () => {
            socket.emit('interview:leave', { conversationId, user: currentUser });
            socket.off('interview:state_updated', handleStateUpdate);
            socket.off('interview:timer_updated', handleTimerUpdate);
            socket.off('code:run:starting', handleCodeRunStart);
            socket.off('code:run:completed', handleCodeRunResult);
        };
    }, [socket, conversationId, userRole]);

    // Timer Countdown effect
    useEffect(() => {
        let interval = null;
        if (isTimerRunning && timerSeconds > 0) {
            interval = setInterval(() => {
                setTimerSeconds(prev => {
                    const next = prev - 1;
                    if (userRole === 'interviewer' && socket && next % 5 === 0) {
                        socket.emit('interview:timer_sync', {
                            conversationId,
                            remainingSeconds: next,
                            isRunning: true
                        });
                    }
                    return next;
                });
            }, 1000);
        } else if (timerSeconds === 0) {
            setIsTimerRunning(false);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timerSeconds, userRole, socket, conversationId]);

    const formatTimer = (totalSeconds) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => {
        const nextState = !isTimerRunning;
        setIsTimerRunning(nextState);
        if (socket) {
            socket.emit('interview:timer_sync', {
                conversationId,
                remainingSeconds: timerSeconds,
                isRunning: nextState
            });
        }
    };

    const resetTimer = (minutes = 45) => {
        const secs = minutes * 60;
        setTimerSeconds(secs);
        setIsTimerRunning(false);
        if (socket) {
            socket.emit('interview:timer_sync', {
                conversationId,
                remainingSeconds: secs,
                isRunning: false
            });
        }
    };

    const handleCodeChange = (newCode) => {
        setCode(newCode);
        if (socket) {
            socket.emit('interview:state_update', {
                conversationId,
                update: { code: newCode }
            });
        }
    };

    const handleProblemChange = (problemId) => {
        setSelectedProblemId(problemId);
        const prob = CURATED_PROBLEMS.find(p => p.id === problemId);
        const newCode = prob?.templates[language] || prob?.templates.javascript || '// Solution';
        setCode(newCode);
        if (socket) {
            socket.emit('interview:state_update', {
                conversationId,
                update: { problemId, code: newCode }
            });
        }
    };

    const handleRunCode = async () => {
        setIsRunningCode(true);
        setConsoleOutput('Running code in isolated sandbox...');

        if (socket) {
            socket.emit('code:run:start', {
                conversationId,
                senderName: currentUser?.displayName || 'Peer',
                language
            });
        }

        try {
            const res = await fetch(`${BACKEND_URL}/api/code/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, language })
            });

            const data = await res.json();
            const outText = data.stdout || data.stderr || (data.output ? JSON.stringify(data.output, null, 2) : 'No output produced.');
            setConsoleOutput(`Output (${data.executionTimeMs || 0}ms):\n${outText}`);

            if (socket) {
                socket.emit('code:run:result', {
                    conversationId,
                    output: outText,
                    senderName: currentUser?.displayName || 'Peer',
                    language,
                    executionTimeMs: data.executionTimeMs || 0,
                    success: !data.stderr
                });
            }
        } catch (err) {
            setConsoleOutput(`Execution Error: ${err.message}`);
        } finally {
            setIsRunningCode(false);
        }
    };

    const handleGenerateAiEvaluation = async () => {
        setIsGeneratingEval(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/ai/interview-eval`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    problemTitle: currentProblem.title,
                    problemDescription: currentProblem.description,
                    candidateCode: code,
                    language,
                    notes: interviewerNotes,
                    rubric
                })
            });

            const data = await res.json();
            if (data.evaluation) {
                setEvaluationReport(data.evaluation);
            } else {
                setEvaluationReport('Could not generate evaluation: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            setEvaluationReport('Error communicating with AI service: ' + err.message);
        } finally {
            setIsGeneratingEval(false);
        }
    };

    const handleSendFeedbackToChat = () => {
        if (!evaluationReport || !onSendToChat) return;
        onSendToChat({
            content: `### 📋 Technical Interview Evaluation Report\n**Problem**: ${currentProblem.title}\n**Role**: ${userRole === 'interviewer' ? 'Interviewer Assessment' : 'Self Assessment'}\n\n${evaluationReport}`,
            isCodeSnippet: false
        });
        setCopiedReport(true);
        setTimeout(() => setCopiedReport(false), 2000);
    };

    const handleCopyReport = () => {
        if (!evaluationReport) return;
        navigator.clipboard.writeText(evaluationReport);
        setCopiedReport(true);
        setTimeout(() => setCopiedReport(false), 2000);
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: '#090D16',
            color: '#E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            {/* Top Bar Header */}
            <div style={{
                height: '60px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: '#0D1322',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                gap: '16px'
            }}>
                {/* Left: Branding & Role Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Award size={22} color="#06B6D4" />
                        <span style={{ fontSize: '1rem', fontWeight: '700', letterSpacing: '-0.3px', color: '#FFF' }}>
                            Technical Interview & Mentorship
                        </span>
                    </div>

                    <div style={{
                        display: 'flex',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        padding: '3px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                        <button
                            type="button"
                            onClick={() => setUserRole('interviewer')}
                            style={{
                                padding: '4px 10px',
                                border: 'none',
                                borderRadius: '6px',
                                backgroundColor: userRole === 'interviewer' ? '#06B6D4' : 'transparent',
                                color: userRole === 'interviewer' ? '#000' : '#94A3B8',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                            }}
                        >
                            Interviewer
                        </button>
                        <button
                            type="button"
                            onClick={() => setUserRole('candidate')}
                            style={{
                                padding: '4px 10px',
                                border: 'none',
                                borderRadius: '6px',
                                backgroundColor: userRole === 'candidate' ? '#06B6D4' : 'transparent',
                                color: userRole === 'candidate' ? '#000' : '#94A3B8',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                            }}
                        >
                            Candidate
                        </button>
                    </div>
                </div>

                {/* Center: Problem Selector & Countdown Timer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <select
                        value={selectedProblemId}
                        onChange={(e) => handleProblemChange(e.target.value)}
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '8px',
                            color: '#FFF',
                            padding: '6px 12px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        {CURATED_PROBLEMS.map(p => (
                            <option key={p.id} value={p.id} style={{ background: '#0F172A' }}>
                                [{p.difficulty}] {p.title}
                            </option>
                        ))}
                    </select>

                    {/* Timer Pill */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        border: '1px solid ' + (timerSeconds < 180 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.1)')
                    }}>
                        <Clock size={16} color={timerSeconds < 180 ? '#EF4444' : timerSeconds < 600 ? '#F59E0B' : '#06B6D4'} />
                        <span style={{
                            fontFamily: 'monospace',
                            fontSize: '1rem',
                            fontWeight: '700',
                            color: timerSeconds < 180 ? '#EF4444' : timerSeconds < 600 ? '#F59E0B' : '#FFF'
                        }}>
                            {formatTimer(timerSeconds)}
                        </span>

                        <button
                            type="button"
                            onClick={toggleTimer}
                            title={isTimerRunning ? 'Pause Timer' : 'Start Timer'}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: isTimerRunning ? '#F59E0B' : '#10B981',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex'
                            }}
                        >
                            <Play size={14} fill={isTimerRunning ? 'none' : '#10B981'} />
                        </button>
                        <button
                            type="button"
                            onClick={() => resetTimer(45)}
                            title="Reset to 45m"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94A3B8',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex'
                            }}
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={handleRunCode}
                        disabled={isRunningCode}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#10B981',
                            color: '#000',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 14px',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            cursor: isRunningCode ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <Play size={14} fill="#000" />
                        {isRunningCode ? 'Running...' : 'Run Code'}
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#94A3B8',
                            borderRadius: '8px',
                            padding: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Main Content Workspace (Split Layout) */}
            <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
                {/* 1. Problem Description (Left Pane) */}
                <div style={{
                    width: '320px',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: '#0A0F1D',
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            backgroundColor: currentProblem.difficulty === 'Easy' ? 'rgba(16, 185, 129, 0.15)' : currentProblem.difficulty === 'Medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: currentProblem.difficulty === 'Easy' ? '#10B981' : currentProblem.difficulty === 'Medium' ? '#F59E0B' : '#EF4444'
                        }}>
                            {currentProblem.difficulty}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{currentProblem.category}</span>
                    </div>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: '#FFF' }}>
                        {currentProblem.title}
                    </h2>

                    <div style={{ fontSize: '0.88rem', lineHeight: '1.6', color: '#CBD5E1', whiteSpace: 'pre-line' }}>
                        {currentProblem.description}
                    </div>

                    {/* Examples */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.82rem', textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.5px' }}>
                            Examples
                        </h4>
                        {currentProblem.examples.map((ex, idx) => (
                            <div key={idx} style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '8px',
                                padding: '10px',
                                fontSize: '0.82rem',
                                fontFamily: 'monospace'
                            }}>
                                <div style={{ color: '#94A3B8' }}>Input: <span style={{ color: '#FFF' }}>{ex.input}</span></div>
                                <div style={{ color: '#94A3B8', marginTop: '4px' }}>Output: <span style={{ color: '#06B6D4' }}>{ex.output}</span></div>
                                {ex.explanation && (
                                    <div style={{ color: '#64748B', marginTop: '4px', fontSize: '0.75rem', fontFamily: 'sans-serif' }}>
                                        {ex.explanation}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Constraints */}
                    <div>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '0.82rem', textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.5px' }}>
                            Constraints
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#94A3B8', lineHeight: '1.6' }}>
                            {currentProblem.constraints.map((c, i) => (
                                <li key={i}>{c}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* 2. Interactive Editor & Console (Center Pane) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    {/* Editor Toolbar */}
                    <div style={{
                        height: '42px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        backgroundColor: '#0F172A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 16px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Code2 size={16} color="#06B6D4" />
                            <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#94A3B8' }}>Solution Workspace</span>
                        </div>

                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            style={{
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '6px',
                                color: '#06B6D4',
                                padding: '3px 8px',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="javascript" style={{ background: '#0F172A' }}>JavaScript</option>
                            <option value="python" style={{ background: '#0F172A' }}>Python</option>
                            <option value="cpp" style={{ background: '#0F172A' }}>C++</option>
                            <option value="go" style={{ background: '#0F172A' }}>Go</option>
                            <option value="java" style={{ background: '#0F172A' }}>Java</option>
                        </select>
                    </div>

                    {/* Code Editor Textarea */}
                    <div style={{ flex: 1, position: 'relative', backgroundColor: '#0B1120' }}>
                        <textarea
                            value={code}
                            onChange={(e) => handleCodeChange(e.target.value)}
                            placeholder="Write code solution here..."
                            spellCheck={false}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                outline: 'none',
                                resize: 'none',
                                backgroundColor: 'transparent',
                                color: '#F8FAFC',
                                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                                fontSize: '0.92rem',
                                lineHeight: '1.6',
                                padding: '16px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Output Console */}
                    <div style={{
                        height: '180px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        backgroundColor: '#080C16',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            padding: '6px 16px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.75rem',
                            color: '#94A3B8',
                            fontWeight: '600'
                        }}>
                            <Terminal size={14} color="#10B981" />
                            <span>Execution Output</span>
                        </div>
                        <pre style={{
                            flex: 1,
                            margin: 0,
                            padding: '12px 16px',
                            overflowY: 'auto',
                            fontFamily: 'Consolas, Monaco, monospace',
                            fontSize: '0.82rem',
                            color: '#A7F3D0',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {consoleOutput || 'Click "Run Code" above to execute tests against the sandbox runner.'}
                        </pre>
                    </div>
                </div>

                {/* 3. Interviewer Rubric & Notes (Right Pane) */}
                <div style={{
                    width: '360px',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: '#0D1322',
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Shield size={18} color="#06B6D4" />
                            <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#FFF' }}>
                                {userRole === 'interviewer' ? 'Private Interviewer Rubric' : 'Candidate Evaluation'}
                            </span>
                        </div>
                    </div>

                    {/* Rubric Score Sliders */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                                <span style={{ color: '#CBD5E1' }}>Problem Solving & Logic</span>
                                <span style={{ color: '#06B6D4', fontWeight: '700' }}>{rubric.problemSolving} / 5</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="5" 
                                value={rubric.problemSolving}
                                onChange={(e) => setRubric(r => ({ ...r, problemSolving: Number(e.target.value) }))}
                                style={{ width: '100%', accentColor: '#06B6D4' }} 
                            />
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                                <span style={{ color: '#CBD5E1' }}>Data Structures & Algorithms</span>
                                <span style={{ color: '#06B6D4', fontWeight: '700' }}>{rubric.dsa} / 5</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="5" 
                                value={rubric.dsa}
                                onChange={(e) => setRubric(r => ({ ...r, dsa: Number(e.target.value) }))}
                                style={{ width: '100%', accentColor: '#06B6D4' }} 
                            />
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                                <span style={{ color: '#CBD5E1' }}>Code Quality & Cleanliness</span>
                                <span style={{ color: '#06B6D4', fontWeight: '700' }}>{rubric.codeQuality} / 5</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="5" 
                                value={rubric.codeQuality}
                                onChange={(e) => setRubric(r => ({ ...r, codeQuality: Number(e.target.value) }))}
                                style={{ width: '100%', accentColor: '#06B6D4' }} 
                            />
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                                <span style={{ color: '#CBD5E1' }}>Communication & System Design</span>
                                <span style={{ color: '#06B6D4', fontWeight: '700' }}>{rubric.communication} / 5</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="5" 
                                value={rubric.communication}
                                onChange={(e) => setRubric(r => ({ ...r, communication: Number(e.target.value) }))}
                                style={{ width: '100%', accentColor: '#06B6D4' }} 
                            />
                        </div>
                    </div>

                    {/* Private Interviewer Notes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: '600' }}>
                            Interviewer Notes & Observations:
                        </span>
                        <textarea
                            value={interviewerNotes}
                            onChange={(e) => setInterviewerNotes(e.target.value)}
                            placeholder="e.g. Candidate considered hash map tradeoff immediately, handled null edge case well..."
                            rows={4}
                            style={{
                                width: '100%',
                                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '8px',
                                color: '#FFF',
                                padding: '10px',
                                fontSize: '0.82rem',
                                resize: 'vertical',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* AI Evaluation Button */}
                    <button
                        type="button"
                        onClick={handleGenerateAiEvaluation}
                        disabled={isGeneratingEval}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            backgroundColor: 'rgba(6, 182, 212, 0.15)',
                            border: '1px solid #06B6D4',
                            color: '#06B6D4',
                            borderRadius: '8px',
                            padding: '10px',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            cursor: isGeneratingEval ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <Sparkles size={16} />
                        {isGeneratingEval ? 'Analyzing Solution...' : 'Generate AI Evaluation Scorecard'}
                    </button>

                    {/* Evaluation Output Section */}
                    {evaluationReport && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            borderRadius: '10px',
                            padding: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#06B6D4' }}>
                                    AI Scorecard Report
                                </span>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                        type="button"
                                        onClick={handleCopyReport}
                                        title="Copy evaluation report"
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: copiedReport ? '#10B981' : '#94A3B8',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            padding: '4px'
                                        }}
                                    >
                                        {copiedReport ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSendFeedbackToChat}
                                        title="Send report to chat"
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#06B6D4',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            padding: '4px'
                                        }}
                                    >
                                        <Send size={14} />
                                    </button>
                                </div>
                            </div>
                            <div style={{
                                maxHeight: '250px',
                                overflowY: 'auto',
                                fontSize: '0.78rem',
                                color: '#CBD5E1',
                                lineHeight: '1.5',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {evaluationReport}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
