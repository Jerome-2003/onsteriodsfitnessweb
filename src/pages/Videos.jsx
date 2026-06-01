import { useState, useEffect, useRef } from "react"
import Header from "../components/Header"

// ── Original local video imports (unchanged) ──────────────────────
import promo1 from "../assets/promo1.mp4"
import promo2 from "../assets/promo2.mp4"
import promo3 from "../assets/promo3.mp4"
import promo4 from "../assets/promo4.mp4"
import promo5 from "../assets/promo5.mp4"
import promo6 from "../assets/promo6.mp4"

import { db, storage } from "../components/videomanager/firebase"
import {
  collection, query, orderBy,
  onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp,
} from "firebase/firestore"
import {
  ref, uploadBytesResumable,
  getDownloadURL, deleteObject,
} from "firebase/storage"

/* ─────────────────────────────────────────────
   Videos.jsx  — CRUD-enabled via Firebase
   All original UI preserved; CRUD blended in.
───────────────────────────────────────────── */

// ── Static local videos (original, unchanged) ────────────────────
// Always shown first; no id so CRUD controls never appear on them
const staticVideos = [
  { src: promo1, title: "Full Body Home Workout" },
  { src: promo2, title: "Leg Day Tips" },
  { src: promo3, title: "Healthy Recipe Vlogs" },
  { src: promo4, title: "Meal Prep Sunday" },
  { src: promo5, title: "HIIT Cardio Blast" },
  { src: promo6, title: "Recovery & Stretching" },
]

const Videos = () => {
  /* ── Existing carousel / player state ────── */
  const [activeIndex,    setActiveIndex]    = useState(0)
  const [carouselStart,  setCarouselStart]  = useState(0)
  const visibleCount = 3

  /* ── Firebase / CRUD state ───────────────── */
  const [firebaseVideos, setFirebaseVideos] = useState([])   // ← renamed
  const [loading,        setLoading]        = useState(true)
  const [showUpload,     setShowUpload]      = useState(false)
  const [title,          setTitle]          = useState("")
  const [desc,           setDesc]           = useState("")
  const [file,           setFile]           = useState(null)
  const [progress,       setProgress]       = useState(null)  // 0-100 | null
  const [editing,        setEditing]        = useState(null)  // {id,title,desc} | null
  const [uploadErr,      setUploadErr]      = useState("")
  const fileInputRef = useRef(null)

  // Combined: original 6 first, then Firebase uploads newest-first
  const videos = [...staticVideos, ...firebaseVideos]

  /* ── READ — live Firestore listener ─────── */
  useEffect(() => {
    const q = query(
      collection(db, "videos"),
      orderBy("createdAt", "desc")
    )
    const unsub = onSnapshot(q, (snap) => {
      setFirebaseVideos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  /* Keep activeIndex valid when list shrinks */
  useEffect(() => {
    if (videos.length > 0 && activeIndex >= videos.length) {
      setActiveIndex(videos.length - 1)
    }
  }, [videos, activeIndex])

  /* ── CREATE — upload file → save metadata ─ */
  const handleUpload = () => {
    setUploadErr("")
    if (!title.trim()) return setUploadErr("Please add a title.")
    if (!file)         return setUploadErr("Please choose a video file.")

    const sRef = ref(storage, `videos/${Date.now()}_${file.name}`)
    const task = uploadBytesResumable(sRef, file)

    task.on(
      "state_changed",
      (s) => setProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
      (err) => { setUploadErr(err.message); setProgress(null) },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        await addDoc(collection(db, "videos"), {
          title:       title.trim(),
          description: desc.trim(),
          url,
          storagePath: sRef.fullPath,
          createdAt:   serverTimestamp(),
        })
        /* reset form */
        setTitle(""); setDesc(""); setFile(null)
        setProgress(null); setShowUpload(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    )
  }

  /* ── UPDATE — title / description only ──── */
  const handleUpdate = async () => {
    if (!editing?.title?.trim()) return
    await updateDoc(doc(db, "videos", editing.id), {
      title:       editing.title.trim(),
      description: editing.desc?.trim() ?? "",
      updatedAt:   serverTimestamp(),
    })
    setEditing(null)
  }

  /* ── DELETE — Storage + Firestore ────────── */
  const handleDelete = async (v, e) => {
    e.stopPropagation()
    if (!window.confirm(`Delete "${v.title}"?`)) return
    try {
      await deleteObject(ref(storage, v.storagePath))
    } catch (_) {
      /* file may already be gone — proceed to delete doc */
    }
    await deleteDoc(doc(db, "videos", v.id))
  }

  /* ── Carousel helpers (unchanged logic) ─── */
  const maxStart    = Math.max(0, videos.length - visibleCount)
  const handlePrev  = () => setCarouselStart((p) => Math.max(p - 1, 0))
  const handleNext  = () => setCarouselStart((p) => Math.min(p + 1, maxStart))
  const visibleVids = videos.slice(carouselStart, carouselStart + visibleCount)

  // Local videos have .src, Firebase videos have .url
  const videoSrc = (v) => v.src ?? v.url

  /* ── Loading screen — only shown before Firebase resolves ──── */
  // Static promo videos still render immediately; this just prevents
  // the carousel from flashing before Firebase videos are known.
  if (loading) {
    return (
      <div className="min-h-screen bg-[#E8392A] font-sans">
        <Header />
        <div className="text-white py-10 px-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-widest uppercase">Videos</h1>
        </div>
        {/* Show the 6 static videos immediately while Firebase loads */}
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {staticVideos.map((video, index) => (
              <div key={index} className="rounded-xl overflow-hidden shadow border border-gray-100">
                <div className="relative bg-black aspect-video">
                  <video src={video.src} className="w-full h-full object-cover opacity-80" muted />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-[#E8392A]/80 rounded-full p-3">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-white">
                  <p className="font-semibold text-gray-900 text-sm truncate">{video.title}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-8 text-white/60">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-xs font-semibold tracking-widest uppercase">Loading more videos…</span>
          </div>
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#E8392A] font-sans">

      {/* ── Site Header (unchanged) ── */}
      <Header />

      {/* ── Page Hero Banner ── */}
      <div className="text-white py-10 px-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-widest uppercase">
          Videos
        </h1>

        {/* ADD VIDEO toggle button — blends into banner */}
        <button
          onClick={() => { setShowUpload((v) => !v); setUploadErr("") }}
          className="mt-5 inline-flex items-center gap-2 bg-white text-[#E8392A]
                     font-extrabold text-xs px-6 py-2.5 rounded-full
                     hover:bg-white/90 active:scale-95 transition-all
                     tracking-widest uppercase shadow"
        >
          {showUpload ? (
            <><span className="text-lg leading-none">✕</span> Cancel</>
          ) : (
            <><span className="text-lg leading-none">＋</span> Add Video</>
          )}
        </button>
      </div>

      {/* ═══════════════════════════════════════
          UPLOAD PANEL  (slides in under banner)
      ═══════════════════════════════════════ */}
      {showUpload && (
        <div className="max-w-5xl mx-auto px-4 pb-6">
          <div className="bg-gray-900 rounded-xl p-6 shadow-xl
                          border border-white/10 animate-fadeIn">

            <div className="flex items-center gap-3 mb-5">
              {/* YouTube-style icon — matches card header */}
              <div className="bg-white rounded-md w-9 h-7 flex items-center
                              justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#E8392A]">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12
                           3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0
                           12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6
                           9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31
                           31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.75
                           15.5v-7l6.5 3.5-6.5 3.5z" />
                </svg>
              </div>
              <h2 className="text-white text-xl font-extrabold tracking-widest uppercase">
                Upload New Video
              </h2>
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Video title *"
                className="bg-gray-800 text-white placeholder-white/30
                           rounded-lg px-4 py-2.5 text-sm border border-gray-700
                           outline-none focus:ring-2 focus:ring-[#E8392A]
                           transition"
              />
              <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Description (optional)"
                className="bg-gray-800 text-white placeholder-white/30
                           rounded-lg px-4 py-2.5 text-sm border border-gray-700
                           outline-none focus:ring-2 focus:ring-[#E8392A]
                           transition"
              />
            </div>

            {/* File picker + Upload button */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <label className="flex-1 bg-gray-800 border border-dashed
                                border-gray-600 rounded-lg px-4 py-3 text-sm
                                cursor-pointer hover:border-[#E8392A]
                                transition group">
                <span className={file ? "text-white" : "text-white/40 group-hover:text-white/60"}>
                  {file ? `📹  ${file.name}` : "Choose video file  (MP4, MOV, WebM…)"}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </label>

              <button
                onClick={handleUpload}
                disabled={progress !== null}
                className="bg-[#E8392A] text-white font-extrabold text-xs
                           px-7 py-3 rounded-lg hover:bg-[#c52e21]
                           disabled:opacity-50 disabled:cursor-not-allowed
                           active:scale-95 transition-all tracking-widest
                           uppercase whitespace-nowrap shadow"
              >
                {progress !== null ? `Uploading  ${progress}%` : "Upload Video"}
              </button>
            </div>

            {/* Progress bar */}
            {progress !== null && (
              <div className="mt-3 h-1 rounded-full bg-gray-700 overflow-hidden">
                <div
                  className="h-full bg-[#E8392A] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {/* Inline error */}
            {uploadErr && (
              <p className="mt-3 text-xs text-red-400 font-semibold">{uploadErr}</p>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          EDIT MODAL  (overlay)
      ═══════════════════════════════════════ */}
      {editing && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center
                     justify-center p-4 backdrop-blur-sm"
          onClick={() => setEditing(null)}
        >
          <div
            className="bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-2xl
                       border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-white rounded-md w-9 h-7 flex items-center
                              justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#E8392A]">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12
                           3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0
                           12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6
                           9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31
                           31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.75
                           15.5v-7l6.5 3.5-6.5 3.5z" />
                </svg>
              </div>
              <h2 className="text-white text-xl font-extrabold tracking-widest uppercase">
                Edit Video
              </h2>
            </div>

            <div className="flex flex-col gap-3 mb-5">
              <input
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="Video title"
                className="bg-gray-800 text-white placeholder-white/30 rounded-lg
                           px-4 py-2.5 text-sm border border-gray-700 outline-none
                           focus:ring-2 focus:ring-[#E8392A] transition"
              />
              <input
                value={editing.desc}
                onChange={(e) => setEditing({ ...editing, desc: e.target.value })}
                placeholder="Description"
                className="bg-gray-800 text-white placeholder-white/30 rounded-lg
                           px-4 py-2.5 text-sm border border-gray-700 outline-none
                           focus:ring-2 focus:ring-[#E8392A] transition"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleUpdate}
                className="flex-1 bg-[#E8392A] text-white font-extrabold text-xs
                           py-3 rounded-lg hover:bg-[#c52e21] active:scale-95
                           transition-all tracking-widest uppercase"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditing(null)}
                className="flex-1 bg-gray-700 text-white font-extrabold text-xs
                           py-3 rounded-lg hover:bg-gray-600 active:scale-95
                           transition-all tracking-widest uppercase"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          MAIN CONTENT  (original layout intact)
      ═══════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ── Empty state ── */}
        {videos.length === 0 && (
          <div className="bg-gray-900 rounded-xl p-12 text-center shadow-lg mb-10">
            <p className="text-white/40 font-extrabold tracking-widest uppercase text-sm mb-3">
              No Videos Yet
            </p>
            <button
              onClick={() => setShowUpload(true)}
              className="bg-[#E8392A] text-white font-extrabold text-xs
                         px-6 py-3 rounded-full hover:bg-[#c52e21]
                         active:scale-95 transition-all tracking-widest uppercase"
            >
              ＋ Upload Your First Video
            </button>
          </div>
        )}

        {videos.length > 0 && (
          <>
            {/* ───────────────────────────────────────
                VIDEOS CARD — carousel  (original UI)
            ─────────────────────────────────────── */}
            <div className="bg-gray-900 rounded-xl p-6 shadow-lg">

              {/* Card Header (original) */}
              <div className="flex items-center gap-3 mb-1">
                <div className="bg-white rounded-md w-9 h-7 flex items-center
                                justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#E8392A]">
                    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12
                             3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0
                             12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6
                             9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31
                             31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.75
                             15.5v-7l6.5 3.5-6.5 3.5z" />
                  </svg>
                </div>
                <h2 className="text-white text-2xl font-extrabold tracking-widest uppercase">
                  Videos
                </h2>
              </div>

              {/* Subheading + Carousel Nav (original) */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-white/80 text-sm font-semibold tracking-widest uppercase">
                  Recent Videos
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={carouselStart === 0}
                    className="w-7 h-7 rounded-full border border-white/60 text-white
                               flex items-center justify-center hover:bg-white/20
                               disabled:opacity-30 transition"
                  >
                    ‹
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={carouselStart >= maxStart}
                    className="w-7 h-7 rounded-full border border-white/60 text-white
                               flex items-center justify-center hover:bg-white/20
                               disabled:opacity-30 transition"
                  >
                    ›
                  </button>
                </div>
              </div>

              {/* ── Carousel Thumbnails — edit/delete overlaid ── */}
              <div className="grid grid-cols-3 gap-3">
                {visibleVids.map((video, i) => {
                  const globalIndex = carouselStart + i
                  const isFirebase  = Boolean(video.id)  // local vids have no id
                  return (
                    <div key={video.id ?? video.src} className="relative group">
                      <button
                        onClick={() => setActiveIndex(globalIndex)}
                        className={`w-full rounded-lg overflow-hidden text-left
                                   transition-all ${
                                     activeIndex === globalIndex
                                       ? "ring-2 ring-white"
                                       : "hover:ring-1 hover:ring-white/60"
                                   }`}
                      >
                        <div className="relative bg-black aspect-video">
                          <video
                            src={videoSrc(video)}
                            className="w-full h-full object-cover opacity-80"
                            muted
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-black/50 rounded-full p-2">
                              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <p className="bg-gray-900 text-white text-xs px-2 py-1 truncate">
                          {video.title}
                        </p>
                      </button>

                      {/* CRUD controls — Firebase videos only, appear on hover */}
                      {isFirebase && (
                        <div className="absolute top-1.5 right-1.5 hidden group-hover:flex
                                        gap-1 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditing({ id: video.id, title: video.title,
                                           desc: video.description ?? "" })
                            }}
                            title="Edit"
                            className="bg-gray-900/90 text-white rounded px-1.5 py-1
                                       text-xs hover:bg-gray-700 transition"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => handleDelete(video, e)}
                            title="Delete"
                            className="bg-[#E8392A]/90 text-white rounded px-1.5 py-1
                                       text-xs hover:bg-[#E8392A] transition"
                          >
                            🗑
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ─────────────────────────────────────────
                FEATURED VIDEO PLAYER  (original)
            ───────────────────────────────────────── */}
            <div className="mt-8">
              <div className="flex items-start justify-between mb-3 gap-4">
                <h3 className="text-gray-900 text-xl font-bold uppercase tracking-wide">
                  {videos[activeIndex]?.title}
                </h3>
                {/* Edit / delete — only shown when a Firebase video is featured */}
                {videos[activeIndex]?.id && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() =>
                        setEditing({
                          id:    videos[activeIndex].id,
                          title: videos[activeIndex].title,
                          desc:  videos[activeIndex].description ?? "",
                        })
                      }
                      className="text-xs font-bold text-gray-700 border border-gray-300
                                 rounded-full px-3 py-1 hover:bg-gray-100
                                 transition tracking-wide uppercase"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={(e) => handleDelete(videos[activeIndex], e)}
                      className="text-xs font-bold text-white bg-[#E8392A] rounded-full
                                 px-3 py-1 hover:bg-[#c52e21] transition
                                 tracking-wide uppercase"
                    >
                      🗑 Delete
                    </button>
                  </div>
                )}
              </div>

              {videos[activeIndex]?.description && (
                <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                  {videos[activeIndex].description}
                </p>
              )}

              <video
                key={activeIndex}
                src={videoSrc(videos[activeIndex])}
                controls
                className="w-full rounded-xl shadow-md bg-black aspect-video"
              />
            </div>

            {/* ─────────────────────────────────────────
                ALL VIDEOS GRID  (original + CRUD)
            ───────────────────────────────────────── */}
            <div className="mt-12">
              <h2 className="text-2xl font-extrabold tracking-widest uppercase
                             mb-5 text-gray-900">
                All Videos
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video, index) => {
                  const isFirebase = Boolean(video.id)
                  return (
                    <div
                      key={video.id ?? video.src}
                      className="rounded-xl overflow-hidden shadow border
                                 border-gray-100 cursor-pointer group relative"
                      onClick={() => {
                        setActiveIndex(index)
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }}
                    >
                      <div className="relative bg-black aspect-video">
                        <video
                          src={videoSrc(video)}
                          className="w-full h-full object-cover opacity-80
                                     group-hover:opacity-100 transition"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-[#E8392A]/80 group-hover:bg-[#E8392A]
                                          rounded-full p-3 transition">
                            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>

                        {/* CRUD controls — Firebase videos only, appear on hover */}
                        {isFirebase && (
                          <div className="absolute top-2 right-2 hidden group-hover:flex
                                          gap-1.5 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditing({ id: video.id, title: video.title,
                                             desc: video.description ?? "" })
                              }}
                              title="Edit"
                              className="bg-gray-900/85 text-white rounded-lg
                                         px-2.5 py-1.5 text-xs font-bold
                                         hover:bg-gray-800 transition backdrop-blur-sm"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={(e) => handleDelete(video, e)}
                              title="Delete"
                              className="bg-[#E8392A]/90 text-white rounded-lg
                                         px-2.5 py-1.5 text-xs font-bold
                                         hover:bg-[#E8392A] transition backdrop-blur-sm"
                            >
                              🗑
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-white">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {video.title}
                        </p>
                        {video.description && (
                          <p className="text-gray-500 text-xs mt-0.5 truncate">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Videos
