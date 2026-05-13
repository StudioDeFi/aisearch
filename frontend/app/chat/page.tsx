'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { ChatMessage, UnifiedSearchDocument } from '@/../../packages/types/src'

/** Delay (ms) between words when simulating streaming word-by-word reveal */
const STREAMING_WORD_DELAY_MS = 18
let msgCounter = 0
function makeId() { return `msg-${++msgCounter}-${Date.now()}` }

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: makeId(),
      role: 'assistant',
      content: "Hello! I'm AISEARCH ELITE's AI assistant. Ask me anything — I'll search the web and synthesize research to give you comprehensive answers.",
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    const q = input.trim()
    if (!q || streaming) return
    setInput('')

    const userMsg: ChatMessage = { id: makeId(), role: 'user', content: q, timestamp: new Date().toISOString() }
    const assistantId = makeId()
    const assistantMsg: ChatMessage = { id: assistantId, role: 'assistant', content: '', timestamp: new Date().toISOString() }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setStreaming(true)

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, depth: 'deep', sources: 5 }),
      })

      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()

      // Simulate streaming by revealing content word-by-word
      const fullText = data.summary ?? 'I could not find a good answer. Please try rephrasing your query.'
      const sources: UnifiedSearchDocument[] = data.sources ?? []
      const words = fullText.split(' ')
      let acc = ''
      for (const word of words) {
        acc += (acc ? ' ' : '') + word
        const snapshot = acc
        setMessages((prev) =>
          prev.map((m) => m.id === assistantId ? { ...m, content: snapshot, sources: sources } : m)
        )
        await new Promise((r) => setTimeout(r, STREAMING_WORD_DELAY_MS))
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: 'Sorry, I encountered an error. Please try again.' } : m
        )
      )
    } finally {
      setStreaming(false)
    }
  }, [input, streaming])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <a href="/" className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm">AI Research Chat</h1>
            <p className="text-slate-500 text-xs">Powered by AISEARCH ELITE</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-400 text-xs">Online</span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                  </svg>
                </div>
              )}
              <div className={`max-w-xl ${msg.role === 'user' ? 'order-first' : ''}`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-sm'
                    : 'bg-white/10 text-slate-200 rounded-tl-sm'
                }`}>
                  {msg.content}
                  {msg.role === 'assistant' && streaming && msg.id === messages[messages.length - 1]?.id && (
                    <span className="inline-block w-1.5 h-4 bg-brand-400 ml-1 animate-pulse rounded-sm" />
                  )}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-slate-500 mb-1">Sources:</p>
                    {msg.sources.slice(0, 3).map((src, i) => (
                      <a key={i} href={src.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-slate-400 hover:text-brand-400 transition-colors">
                        <span className="w-4 h-4 rounded bg-white/10 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                        <span className="truncate">{src.title}</span>
                      </a>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-600 mt-1 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-white/10 bg-slate-900/80 backdrop-blur">
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything… press Enter to send, Shift+Enter for new line"
            rows={1}
            className="flex-1 bg-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 border border-white/10"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || streaming}
            className="bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-center text-slate-600 text-xs mt-2">AI responses may contain inaccuracies. Verify important information.</p>
      </div>
    </div>
  )
}
