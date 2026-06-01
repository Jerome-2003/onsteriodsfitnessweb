import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection, query, orderBy, onSnapshot
} from "firebase/firestore";

export function useVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "videos"),
      orderBy("createdAt", "desc")
    );

    // onSnapshot = live updates (no manual  refresh needed)
    const unsub = onSnapshot(q, snap => {
      setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return unsub; // cleanup on unmount
  }, []);

  return { videos, loading };
}

// VideoList.jsx — render the grid
export function VideoList() {
  const { videos, loading } = useVideos();
  if (loading) return <p>Loading...</p>;
 return (
    <div className="video-grid">
      {videos.map(v => (
        <div key={v.id} className="video-card">
          <video src={v.url} controls width="100%" />
          <h3>{v.title}</h3>
          <p>{v.description}</p>
        </div>
      ))}
    </div>
  );
}