import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Sparkles, Send, ArrowRight, Key, AlertTriangle, RefreshCw, User, Bot } from 'lucide-react'
import { toast } from 'sonner'
import useAppStore from '@/store/useAppStore'
import { callAssistantAPI } from '@/engine/ai'
import { cn } from '@/lib/utils'

const QUICK_ACTIONS = [
  { label: 'Submissions pending my review', msg: 'How many submissions are pending my review right now, and what are the most urgent ones?' },
  { label: 'Explain a risk score', msg: 'Can you explain how the AI risk score is calculated and what the sub-scores mean?' },
  { label: 'High-risk submissions this week', msg: 'Summarize the high-risk submissions I should be aware of.' },
  { label: 'Draft a decline notice', msg: 'Help me draft a professional adverse action notice for a declined submission.' },
  { label: 'Portfolio summary', msg: 'Give me a quick summary of the current portfolio status across all carriers.' },
  { label: 'Compliance question', msg: 'What compliance rules are enforced automatically by the platform?' },
]

// Parse optional navigation action from assistant response
function parseAction(text) {
  try {
    const match = text.match(/\{[\s\S]*?"action"\s*:\s*"navigate"[\s\S]*?\}/)
    if (match) return JSON.parse(match[0])
  } catch {}
  return null
}

// Strip the JSON action block from display text
function stripAction(text) {
  return text.replace(/\{[\s\S]*?"action"\s*:\s*"navigate"[\s\S]*?\}/g, '').trim()
}

function MessageBubble({ msg, onNavigate }) {
  const isUser = msg.role === 'user'
  const action = !isUser ? parseAction(msg.content) : null
  const display = !isUser ? stripAction(msg.content) : msg.content

  return (
    <div className={cn('flex gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={cn(
        'w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5',
        isUser ? 'bg-brand text-white' : 'bg-surface-tertiary text-ink-secondary border border-line'
      )}>
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>

      <div className={cn('max-w-[85%] space-y-2', isUser ? 'items-end' : 'items-start')}>
        <div className={cn(
          'px-3 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-brand text-white rounded-tr-sm'
            : 'bg-surface-secondary text-ink-primary border border-line rounded-tl-sm'
        )}>
          {display}
        </div>

        {/* Navigation action button */}
        {action && (
          <button
            onClick={() => onNavigate(action.path)}
            className="flex items-center gap-1.5 text-xs font-medium text-brand bg-brand-light
                       border border-brand/20 px-3 py-1.5 rounded-lg hover:bg-brand hover:text-white
                       transition-colors"
          >
            <ArrowRight size={12} /> {action.label}
          </button>
        )}
      </div>
    </div>
  )
}

export default function AIAssistantPanel({ open, onClose }) {
  const navigate    = useNavigate()
  const { apiKey, submissions, carriers, enrollments, currentUser, getActiveCarrier } = useAppStore()
  const activeCarrier = getActiveCarrier()

  const [messages,  setMessages]  = useState([])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const bottomRef   = useRef(null)
  const inputRef    = useRef(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      const pending = submissions.filter(s => s.status === 'PENDING').length
      const referred = submissions.filter(s => s.status === 'REFERRED').length
      setMessages([{
        role: 'assistant',
        content: `Hi ${currentUser.name.split(' ')[0]}! I'm your Uniblox AI assistant.\n\nRight now you have ${pending} pending and ${referred} referred submissions. I can help you work through your queue, answer compliance questions, draft communications, or explain anything in the platform.\n\nWhat would you like to do?`,
      }])
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend(text) {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setError(null)

    const userMessage = { role: 'user', content: msg }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setLoading(true)

    // Build the API messages array (exclude the greeting which has no user turn)
    const apiMessages = updatedMessages
      .filter((m, i) => !(i === 0 && m.role === 'assistant'))
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const reply = await callAssistantAPI({
        messages: apiMessages,
        appContext: { submissions, carriers, enrollments, currentUser, activeCarrier },
        apiKey,
      })
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      if (err.message === 'API_KEY_MISSING') {
        setError('no_key')
      } else {
        setError(err.message)
        toast.error('Assistant error', { description: err.message })
      }
    } finally {
      setLoading(false)
    }
  }

  function handleNavigate(path) {
    navigate(path)
    onClose()
  }

  function handleClear() {
    setMessages([])
    setError(null)
    // Re-trigger greeting
    const pending = submissions.filter(s => s.status === 'PENDING').length
    const referred = submissions.filter(s => s.status === 'REFERRED').length
    setMessages([{
      role: 'assistant',
      content: `Cleared! I'm ready to help. You have ${pending} pending and ${referred} referred submissions. What do you need?`,
    }])
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />

      <div className="fixed top-0 right-0 z-50 h-screen w-[420px] flex flex-col
                      bg-surface-primary border-l border-line shadow-2xl animate-slideInRight">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-line flex-shrink-0
                        bg-gradient-to-r from-surface-primary to-brand-light/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-sm">
              <Sparkles size={15} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-ink-primary">AI Assistant</div>
              <div className="text-[11px] text-ink-tertiary">Powered by Claude</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClear}
              title="Clear conversation"
              className="w-7 h-7 flex items-center justify-center rounded text-ink-tertiary
                         hover:bg-surface-hover hover:text-ink-primary transition-colors"
            >
              <RefreshCw size={13} />
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded text-ink-tertiary
                         hover:bg-surface-hover hover:text-ink-primary transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* No API key state */}
        {error === 'no_key' && (
          <div className="mx-4 mt-4 flex-shrink-0">
            <div className="flex items-start gap-3 p-4 bg-caution-light border border-caution/30 rounded-lg">
              <Key size={16} className="text-caution flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-caution-text">API key required</div>
                <div className="text-xs text-caution-text/80 mt-1">
                  Add your Claude API key in Settings → AI Model Settings to use the assistant.
                </div>
                <button
                  onClick={() => { navigate('/settings/ai'); onClose() }}
                  className="mt-2 text-xs font-medium text-caution-text underline"
                >
                  Go to AI Settings →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} onNavigate={handleNavigate} />
          ))}

          {loading && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-surface-tertiary border border-line flex-shrink-0
                              flex items-center justify-center mt-0.5">
                <Bot size={13} className="text-ink-secondary" />
              </div>
              <div className="bg-surface-secondary border border-line rounded-xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-ink-tertiary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-ink-tertiary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-ink-tertiary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {error && error !== 'no_key' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-destructive-light border border-destructive/20
                            rounded-lg text-xs text-destructive-text">
              <AlertTriangle size={13} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick actions — only show when conversation is fresh */}
        {messages.length <= 1 && !loading && (
          <div className="px-4 pb-3 flex-shrink-0">
            <div className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wider mb-2">
              Quick actions
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((qa) => (
                <button
                  key={qa.label}
                  onClick={() => handleSend(qa.msg)}
                  className="text-[11px] px-2.5 py-1.5 bg-surface-secondary border border-line rounded-lg
                             text-ink-secondary hover:border-brand hover:text-brand hover:bg-brand-light
                             transition-colors text-left"
                >
                  {qa.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-line flex-shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Ask anything or describe a task…"
              rows={1}
              className="flex-1 px-3 py-2.5 text-sm bg-surface-secondary border border-line rounded-xl
                         focus:outline-none focus:border-brand text-ink-primary placeholder:text-ink-tertiary
                         resize-none overflow-hidden transition-colors min-h-[40px]"
              style={{ height: '40px' }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl
                         bg-brand text-white hover:bg-brand-hover
                         disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={15} />
            </button>
          </div>
          <div className="text-[10px] text-ink-tertiary mt-1.5 text-center">
            Enter to send · Shift+Enter for new line
          </div>
        </div>
      </div>
    </>
  )
}
