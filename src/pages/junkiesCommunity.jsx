import { useState, useEffect, useRef } from "react"
import { db } from "../components/videomanager/firebase"   // ← same firebase.js
import Header from "../components/Header"
import {
  collection, query, orderBy, limit,
  onSnapshot, addDoc, serverTimestamp,
  doc, deleteDoc,
} from "firebase/firestore"

/*
  CommunityChat.jsx
  ─────────────────
  Drop this anywhere in your app: <CommunityChat />
  Uses the SAME firebase.js — only needs `db` (Firestore).
  Messages are stored in a new "messages" collection alongside "videos".

  Each message document shape:
  {
    text:      string,
    author:    string,
    createdAt: Timestamp,
  }
*/

// Change this to the signed-in user's display name once you add Auth.
// For now, we prompt for a display name on first load.
const GUEST_KEY = "cc_guest_name"

export default function CommunityChat() {
  const [messages,    setMessages]    = useState([])
  const [text,        setText]        = useState("")
  const [author,      setAuthor]      = useState("")
  const [nameInput,   setNameInput]   = useState("")
  const [nameSet,     setNameSet]     = useState(false)
  const [sending,     setSending]     = useState(false)
  const [error,       setError]       = useState("")
  const bottomRef   = useRef(null)
  const inputRef    = useRef(null)

  // Restore saved name from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem(GUEST_KEY)
    if (saved) { setAuthor(saved); setNameSet(true) }
  }, [])

  // READ — live listener, newest 100 messages, oldest first in view
  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      orderBy("createdAt", "asc"),
      limit(100)
    )
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  // Auto-scroll to bottom when messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Save display name and enter chat
  const handleSetName = () => {
    const name = nameInput.trim()
    if (!name) return
    sessionStorage.setItem(GUEST_KEY, name)
    setAuthor(name)
    setNameSet(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // CREATE — send a message
  const handleSend = async () => {
    setError("")
    const trimmed = text.trim()
    if (!trimmed) return
    setSending(true)
    try {
      await addDoc(collection(db, "messages"), {
        text:      trimmed,
        author,
        createdAt: serverTimestamp(),
      })
      setText("")
    } catch (err) {
      setError("Couldn't send — check your connection.")
    } finally {
      setSending(false)
    }
  }

  // DELETE — only own messages
  const handleDelete = async (msgId) => {
    try {
      await deleteDoc(doc(db, "messages", msgId))
    } catch {
      setError("Couldn't delete that message.")
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  /* ══════════════════════════════════════════
     NAME GATE — shown before entering chat
  ══════════════════════════════════════════ */
  if (!nameSet) {
    return (
      <div className="min-h-screen bg-[#E8392A] flex items-center justify-center px-4">
        <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-sm shadow-2xl
                        border border-white/10 text-center">
                            

          {/* YouTube-style icon header */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="bg-white rounded-md w-9 h-7 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#E8392A]">
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5
                         0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5
                         5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3
                         0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.75
                         15.5v-7l.5 3.5-6.5 3.5z" />
              </svg>
            </div>
            <h2 className="text-white text-xl font-extrabold tracking-widest uppercase">
              Community
            </h2>
          </div>

          <p className="text-white/60 text-sm mb-6 tracking-wide">
            Enter a display name to join the chat
          </p>

          <input
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSetName()}
            placeholder="Your name…"
            maxLength={32}
            className="w-full bg-gray-800 text-white placeholder-white/30 rounded-lg
                       px-4 py-3 text-sm border border-gray-700 outline-none mb-4
                       focus:ring-2 focus:ring-[#E8392A] transition text-center"
          />
          <button
            onClick={handleSetName}
            className="w-full bg-[#E8392A] text-white font-extrabold text-xs py-3
                       rounded-lg hover:bg-[#c52e21] active:scale-95 transition-all
                       tracking-widest uppercase"
          >
            Join Chat
          </button>
        </div>
      </div>
    )
  }

  /* ══════════════════════════════════════════
     MAIN CHAT UI
  ══════════════════════════════════════════ */
  return (
        <div className="min-h-screen bg-[#E8392A] font-sans flex flex-col">
            <Header />

      {/* ── Banner ── */}
      <div className="text-white py-8 px-6 text-center flex-shrink-0">
        <h1 className="text-4xl font-extrabold tracking-widest uppercase">
          Community
        </h1>
        <p className="text-white/70 text-xs mt-2 tracking-widest uppercase font-semibold">
          Chatting as&nbsp;
          <button
            onClick={() => { sessionStorage.removeItem(GUEST_KEY); setNameSet(false); setNameInput("") }}
            className="text-white underline underline-offset-2 hover:no-underline"
          >
            {author}
          </button>
          &nbsp;·&nbsp;tap name to change
        </p>
      </div>

      {/* ── Chat card ── */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 pb-6 flex flex-col gap-4">
        <div className="bg-gray-900 rounded-2xl shadow-lg border border-white/10
                        flex flex-col overflow-hidden" style={{ minHeight: "560px" }}>

          {/* Card header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 flex-shrink-0">
            <div className="bg-white rounded-md w-9 h-7 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#E8392A]">
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5
                         0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5
                         5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3
                         0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.75
                         15.5v-7l6.5 3.5-6.5 3.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-extrabold tracking-widest uppercase text-base leading-none">
                Live Chat
              </h2>
              <p className="text-white/40 text-xs mt-0.5 tracking-wide">
                {messages.length} message{messages.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
               style={{ maxHeight: "420px" }}>

            {messages.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-white/30 text-sm font-semibold tracking-widest uppercase">
                  No messages yet — say hello 👋
                </p>
              </div>
            )}

            {messages.map((msg) => {
              const isOwn = msg.author === author
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 group ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center
                                   flex-shrink-0 text-xs font-extrabold uppercase
                                   ${isOwn
                                     ? "bg-[#E8392A] text-white"
                                     : "bg-gray-700 text-white/70"}`}>
                    {msg.author?.[0] ?? "?"}
                  </div>

                  {/* Bubble */}
                  <div className={`flex flex-col gap-1 max-w-[72%]
                                   ${isOwn ? "items-end" : "items-start"}`}>
                    {!isOwn && (
                      <span className="text-white/40 text-xs px-1 font-semibold tracking-wide">
                        {msg.author}
                      </span>
                    )}
                    <div className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                                     break-words
                                     ${isOwn
                                       ? "bg-[#E8392A] text-white rounded-tr-sm"
                                       : "bg-gray-800 text-white/90 rounded-tl-sm"}`}>
                      {msg.text}

                      {/* Delete button — own messages only, on hover */}
                      {isOwn && (
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="absolute -top-2 -right-2 hidden group-hover:flex
                                     w-5 h-5 bg-gray-700 hover:bg-red-800 rounded-full
                                     items-center justify-center transition"
                          title="Delete"
                        >
                          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white/70">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor"
                                  strokeWidth="2" strokeLinecap="round" fill="none"/>
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Timestamp */}
                    {msg.createdAt && (
                      <span className="text-white/25 text-xs px-1">
                        {new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], {
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* ── Input bar ── */}
          <div className="border-t border-white/10 px-4 py-3 flex-shrink-0">
            {error && (
              <p className="text-red-400 text-xs font-semibold mb-2">{error}</p>
            )}
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a message… (Enter to send)"
                rows={1}
                maxLength={500}
                className="flex-1 bg-gray-800 text-white placeholder-white/30 rounded-xl
                           px-4 py-2.5 text-sm border border-gray-700 outline-none
                           focus:ring-2 focus:ring-[#E8392A] transition resize-none
                           leading-relaxed"
                style={{ maxHeight: "120px", overflowY: "auto" }}
              />
              <button
                onClick={handleSend}
                disabled={sending || !text.trim()}
                className="bg-[#E8392A] text-white rounded-xl px-4 py-2.5 flex-shrink-0
                           hover:bg-[#c52e21] disabled:opacity-40 disabled:cursor-not-allowed
                           active:scale-95 transition-all"
                title="Send"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-white"
                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </div>
            <p className="text-white/20 text-xs mt-1.5 text-right">
              {text.length}/500
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
