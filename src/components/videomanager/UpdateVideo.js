import { db, storage } from "./firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, deleteObject, getDownloadURL,
         uploadBytesResumable } from "firebase/storage";

// ✏️ Update title / description only
export const updateVideoMeta = async (videoId, { title, description }) => {
  await updateDoc(doc(db, "videos", videoId), {
    title,
    description,
    updatedAt: serverTimestamp(),
  });
};

// 🔄 Replace the video file + update metadata
export const replaceVideoFile = async (
  videoId, oldStoragePath, newFile, onProgress
  ) => {
  // 1️⃣ Delete old file from Storage
  await deleteObject(ref(storage, oldStoragePath));

  // 2️⃣ Upload new file
  const newRef = ref(storage, `videos/${Date.now()}_${newFile.name}`);
  const task  = uploadBytesResumable(newRef, newFile);

  await new Promise((res, rej) => task.on(
    "state_changed",
    s => onProgress?.(Math.round(
      (s.bytesTransferred / s.totalBytes) * 100)),
    rej, res
  ));

  // 3️⃣ Get new URL and update Firestore doc
  const url = await getDownloadURL(task.snapshot.ref);
  await updateDoc(doc(db, "videos", videoId), {
     url,
    storagePath: newRef.fullPath,
    updatedAt:   serverTimestamp(),
  });
};