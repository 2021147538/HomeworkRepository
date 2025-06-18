/*  index.js  ─ 메인 목록 + 검색 + 정렬 + 무한 스크롤
    ▸ Fetch 금지 → utils.js 의 XHR api() 사용
*/

import { api, formatDate } from "./utils.js";

const list   = document.getElementById("movieList");
const kwIn   = document.getElementById("searchInput");
const toTop  = document.getElementById("toTop");
const BATCH  = 6;

let search   = "";
let sort     = "";
let offset   = 0;
let isEnd    = false;
let isLoading = false;

/* ---------- 최초 로드 ---------- */
load();

/* ---------- 데이터 로드 ---------- */
async function load() {
  if (isEnd || isLoading) return;
  isLoading = true;

  const [col = "id", dir = "asc"] = (sort || "id asc").split(" ");
  const qs =
    `/movies?search=${encodeURIComponent(search)}` +
    `&sort=${col}&order=${dir}&offset=${offset}&limit=${BATCH}`;

  try {
    const rows = await api(qs);
    rows.forEach(row => list.append(makeCard(row)));
    offset += rows.length;
    if (rows.length < BATCH) isEnd = true;
  } catch (e) {
    console.error(e);
  }
  isLoading = false;
}

/* ---------- 카드 DOM ---------- */
function makeCard(m) {
  const el = document.createElement("article");
  el.className = "movie-card";

  /* 앞에 슬래시가 중복되지 않도록 보정 */
  const poster = "/" + m.poster_url.replace(/^\/?/, "");

  el.innerHTML = `
    <a href="/movies/${m.id}" class="card-link">
      <img src="${poster}" alt="${m.title}" loading="lazy">
      <div class="overlay"><p>${m.overview}</p></div>
      <div class="info">
        <h3>${m.title}</h3>
        <small>${formatDate(m.release_date)}</small>
        <span class="badge">${m.vote_average.toFixed(1)}</span>
      </div>
    </a>`;
  return el;
}

/* ---------- 이벤트 ---------- */
document.getElementById("searchBtn").onclick =
kwIn.onkeyup = () => {
  search = kwIn.value.trim();
  reset();
};

document.querySelectorAll('input[name="sort"]').forEach(r =>
  r.onchange = () => {
    sort = r.value;
    reset();
  });

/* 무한 스크롤 */
window.addEventListener("scroll", () => {
  if (
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 200
  ) load();
});

/* 맨 위로 버튼 */
toTop.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
window.onscroll = () => toTop.classList.toggle("show", scrollY > 300);

/* ---------- 헬퍼 ---------- */
function reset() {
  offset = 0;
  isEnd  = false;
  list.innerHTML = "";
  load();
}
