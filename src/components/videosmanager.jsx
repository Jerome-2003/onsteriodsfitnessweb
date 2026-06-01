// import { useState, useEffect } from "react";
// import { db, storage } from "./firebase";
// import { collection, query, orderBy,
//          onSnapshot, addDoc, updateDoc,
//          deleteDoc, doc, serverTimestamp
//        } from "firebase/firestore";
// import { ref, uploadBytesResumable,
//          getDownloadURL, deleteObject
//        } from "firebase/storage";

// export default function VideoManager() {
//   const [videos,   setVideos]   = useState([]);
//   const [title,    setTitle]    = useState("");
//   const [desc,     setDesc]     = useState("");
//   const [file,     setFile]     = useState(null);
//   const [progress, setProgress] = useState(null);
//   const [editing,  setEditing]  = useState(null); // {id, title, desc}
//    // READ — live listener
//   useEffect(() => {
//     const unsub = onSnapshot(
//       query(collection(db,"videos"), orderBy("createdAt","desc")),
//       s => setVideos(s.docs.map(d => ({id:d.id,...d.data()})))
//     );
//     return unsub;
//   }, []);

//   // CREATE — upload then save
//   const handleUpload = () => {
//     if (!file || !title) return;
//     const sRef = ref(storage,`videos/${Date.now()}_${file.name}`);
//     const task = uploadBytesResumable(sRef, file);
//     task.on("state_changed",
//       s  => setProgress(Math.round(s.bytesTransferred/s.totalBytes*100)),
//       null,
//       async () => {
//         const url = await getDownloadURL(task.snapshot.ref);
//         await addDoc(collection(db,"videos"), {
//           title, description:desc, url,
//           storagePath:sRef.fullPath, createdAt:serverTimestamp()
//         });
//         setTitle(""); setDesc(""); setFile(null); setProgress(null);
//       }
//     );
//   };

//   // UPDATE — metadata only
//   const handleUpdate = async () => {
//     await updateDoc(doc(db,"videos",editing.id),{ title:editing.title, description:editing.desc,
//       updatedAt:serverTimestamp()
//     });
//     setEditing(null);
//   };

//   // DELETE — storage + firestore
//   const handleDelete = async (v) => {
//     if (!window.confirm("Delete this video?")) return;
//     await deleteObject(ref(storage, v.storagePath));
//     await deleteDoc(doc(db,"videos",v.id));
//   };

//   return (
//     <>
//     <div>
//       <{/* Upload form */}>
//       <input value={title} onChange={e=>setTitle(e.target.value)}
//              placeholder="Video title" />
//               <input value={desc}  onChange={e=>setDesc(e.target.value)}
//              placeholder="Description" />
//       <input type="file" accept="video/*"
//              onChange={e=>setFile(e.target.files[0])} />
//       <button onClick={handleUpload}>
//         {progress !== null ? `Uploading ${progress}%` : "Upload Video"}
//       </button>

//       <{/* Edit modal */}>
//       {editing && (
//         <div>
//           <input value={editing.title}
//                  onChange={e=>setEditing({...editing,title:e.target.value})} />
//           <input value={editing.desc}
//                  onChange={e=>setEditing({...editing,desc:e.target.value})} />
//           <button onClick={handleUpdate}>Save</button>
//           <button onClick={()=>setEditing(null)}>Cancel</button>
//         </div>
//          )}

//       <{/* Video grid */}>
//       {videos.map(v => (
//         <div key={v.id}>
//           <video src={v.url} controls />
//           <h3>{v.title}</h3>
//           <button onClick={()=>
//             setEditing({id:v.id,title:v.title,desc:v.description})
//           }>Edit</button>
//           <button onClick={()=>handleDelete(v)}>Delete</button>
//         </div>
//       ))}
//     </div>
//     </>
//   );
// }