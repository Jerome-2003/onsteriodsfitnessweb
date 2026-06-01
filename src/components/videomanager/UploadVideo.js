import { db, storage } from "./firebase";
import {
  ref, uploadBytesResumable, getDownloadURL
} from "firebase/storage";
import {
  collection, addDoc, serverTimestamp
} from "firebase/firestore";

const vidUpload
 = (file, title, desc, onProgress) =>
  new Promise((resolve, reject) => {
  return (
    <><div>
        // 1️⃣ Reference a unique path in Storage
    const storageRef = ref(storage, `videos/${Date.now()}_${file.name}`);
    const task = uploadBytesResumable(storageRef, file);

    task.on("state_changed",
      // 2️⃣ Track progress (0–100)
      snap => onProgress?.(Math.round(
        (snap.bytesTransferred / snap.totalBytes) * 100
      )),
      err  => reject(err),

      // 3️⃣ On complete → get URL → save to Firestore
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        const docRef = await addDoc(
          collection(db, "videos"),
          {
            title,
            description: desc, url,
            storagePath: storageRef.fullPath,
            createdAt:   serverTimestamp(),
          }
        );
        resolve({ id: docRef.id, url });
      }
    );
  });
    </div>
    </>
  )
}

export default vidUpload;

