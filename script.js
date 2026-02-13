// ===== 0) Cá nhân hoá tên qua URL: ?to=Lan&from=Binh =====
const params = new URLSearchParams(location.search);
const to = params.get("to");
const from = params.get("from");
if (to) document.getElementById("herName").textContent = to;
if (from) document.getElementById("yourName").textContent = from;

// ===== 1) Hiệu ứng phong thư + tim =====
const envelope = document.getElementById("envelope");
const layer = document.getElementById("heartsLayer");

document.getElementById("btnOpen").addEventListener("click", () => {
  envelope.classList.toggle("open");
  if (envelope.classList.contains("open")) burstHearts(18);
});

document.getElementById("btnHearts").addEventListener("click", () => burstHearts(26));

function burstHearts(n){
  for(let i=0;i<n;i++){
    const heart = document.createElement("div");
    heart.className = "heart";
    heart.textContent = Math.random() > 0.5 ? "💖" : "💕";

    const x = Math.random() * window.innerWidth;
    const duration = 2 + Math.random() * 2.2;
    const size = 16 + Math.random() * 16;

    heart.style.left = `${x}px`;
    heart.style.bottom = `-20px`;
    heart.style.fontSize = `${size}px`;
    heart.style.animationDuration = `${duration}s`;

    layer.appendChild(heart);
    setTimeout(() => heart.remove(), duration * 1000);
  }
}

// ===== 2) Nhạc nền bật/tắt (luôn hiện nút, có guard) =====
const bgm = document.getElementById("bgm");
const musicBtn = document.getElementById("musicBtn");
const musicIcon = document.getElementById("musicIcon");
const musicText = document.getElementById("musicText");

const MUSIC_KEY = "valentine_music_on";
let musicOn = localStorage.getItem(MUSIC_KEY) === "1";

function updateMusicUI(){
  if (!musicBtn || !musicIcon || !musicText) return;
  musicBtn.setAttribute("aria-pressed", String(musicOn));
  musicIcon.textContent = musicOn ? "🔊" : "🔇";
  musicText.textContent = musicOn ? "Nhạc: Bật" : "Nhạc: Tắt";
}
updateMusicUI();

if (musicBtn && bgm) {
  musicBtn.addEventListener("click", async () => {
    try{
      musicOn = !musicOn;
      localStorage.setItem(MUSIC_KEY, musicOn ? "1" : "0");

      if (musicOn) await bgm.play();
      else bgm.pause();

      updateMusicUI();
    }catch{
      musicOn = false;
      localStorage.setItem(MUSIC_KEY, "0");
      updateMusicUI();
      alert("Chưa phát được nhạc. Hãy chắc chắn có file music.mp3 cùng thư mục nhé!");
    }
  });

  // Nếu trước đó bật nhạc, click đầu tiên trên trang sẽ phát (do autoplay policy)
  document.addEventListener("click", async () => {
    if (musicOn && bgm.paused) { try { await bgm.play(); } catch {} }
  }, { once: true });
}

// ===== 3) Mini game Yes/No (No không thể bấm) =====
const btnYes = document.getElementById("btnYes");
const btnNo = document.getElementById("btnNo");
const miniBtns = document.getElementById("miniBtns");
const miniResult = document.getElementById("miniResult");

btnYes.addEventListener("click", () => {
  miniResult.textContent = "Hehe 😳 Anh biết mà! Chúc em Valentine thật hạnh phúc 💖";
  burstHearts(35);
});

btnNo.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  dodgeNo(true);
});
btnNo.addEventListener("mouseenter", () => dodgeNo(true));
btnNo.addEventListener("touchstart", (e) => {
  e.preventDefault();
  e.stopPropagation();
  dodgeNo(true);
}, { passive: false });

function dodgeNo(forceAbsolute){
  const box = miniBtns.getBoundingClientRect();
  const noRect = btnNo.getBoundingClientRect();

  if (forceAbsolute) btnNo.style.position = "absolute";

  const padding = 6;
  const maxX = Math.max(padding, box.width - noRect.width - padding);
  const maxY = Math.max(padding, box.height - noRect.height - padding);

  const x = Math.random() * maxX;
  const y = Math.random() * maxY;

  btnNo.style.left = `${x}px`;
  btnNo.style.top = `${y}px`;

  btnNo.animate(
    [
      { transform: "translate(0,0)" },
      { transform: "translate(-2px,1px)" },
      { transform: "translate(2px,-1px)" },
      { transform: "translate(0,0)" },
    ],
    { duration: 160 }
  );
}

// ===== 4) Firebase Firestore: bình luận lưu vĩnh viễn =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, orderBy, limit, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAfk0xnLKL_QwrLwGk2tBSvsg7ewkeIHBA",
  authDomain: "valentine-comments.firebaseapp.com",
  projectId: "valentine-comments",
  storageBucket: "valentine-comments.firebasestorage.app",
  messagingSenderId: "869705038390",
  appId: "1:869705038390:web:21f1cd762d0c4002ef3697",
  measurementId: "G-Z7VHSB00H6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("commentForm");
const nameInput = document.getElementById("nameInput");
const contentInput = document.getElementById("contentInput");
const list = document.getElementById("commentList");

// Load 30 comment mới nhất
const commentsRef = collection(db, "comments");
const q = query(commentsRef, orderBy("createdAt", "desc"), limit(30));

// Realtime render
onSnapshot(q, (snap) => {
  list.innerHTML = "";
  snap.forEach((doc) => {
    const c = doc.data();
    list.appendChild(renderComment(c));
  });
}, (err) => {
  console.error("Firestore snapshot error:", err);
});

// Submit comment
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = (nameInput.value || "Ẩn danh").trim().slice(0, 30);
  const content = contentInput.value.trim().slice(0, 3000);
  if (!content) return;

  const last = Number(localStorage.getItem("last_comment_ts") || "0");
  const now = Date.now();
  if (now - last < 10_000) {
    alert("Chậm lại 1 chút nha 💛");
    return;
  }

  await addDoc(commentsRef, { name, content, createdAt: serverTimestamp() });

  localStorage.setItem("last_comment_ts", String(now));
  contentInput.value = "";
  burstHearts(10);
});

// Render helpers
function renderComment(c){
  const el = document.createElement("div");
  el.className = "cmt";

  const name = escapeHtml(c.name ?? "Ẩn danh");
  const content = escapeHtml(c.content ?? "");
  const time = c.createdAt?.toDate ? formatTime(c.createdAt.toDate()) : "vừa xong";

  el.innerHTML = `
    <div class="meta">
      <div class="name">${name}</div>
      <div class="time">${time}</div>
    </div>
    <p class="text">${content}</p>
  `;
  return el;
}

function formatTime(d){
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const hh = String(d.getHours()).padStart(2,"0");
  const mi = String(d.getMinutes()).padStart(2,"0");
  return `${dd}/${mm} ${hh}:${mi}`;
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;")
    .replaceAll("\n","<br/>");
}
