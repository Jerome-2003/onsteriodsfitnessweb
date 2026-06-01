import { db, storage } from "./firebase";
import { ref, deleteObject } from "firebase/storage";
import { doc, deleteDoc } from "firebase/firestore";

export const deleteVideo = async (videoId, storagePath) => {
  // 1️⃣ Remove the actual video file from Storage
  const fileRef = ref(storage, storagePath);
  await deleteObject(fileRef);

  // 2️⃣ Remove the metadata document from Firestore
  await deleteDoc(doc(db, "videos", videoId));

  // The onSnapshot listener in useVideos() picks up
  // the change automatically — no manual state update needed
};
// Usage in a component:
const handleDelete = async (video) => {
  if (!window.confirm("Delete this video?")) return;
  await deleteVideo(video.id, video.storagePath);
};