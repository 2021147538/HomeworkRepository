/*  detail.js  ─  영화 상세 + 후기  (Fetch 금지 → utils.js 의 XHR api() 사용) */

import { api, formatDate } from './utils.js';

/* ───────────────── movie_id 추출 ───────────────────────────── */
const idMatch = location.pathname.match(/^\/movies\/(\d+)/);
const id = idMatch ? +idMatch[1] : NaN;
const root = document.getElementById('detail');

/* ───────────────── 메인 실행 ───────────────────────────────── */
(async () => {
  if (Number.isNaN(id)) return renderNotFound();

  try {
    const movie = await api(`/movies/${id}`);
    if (!movie) return renderNotFound();
    renderMovie(movie);
    await loadComments();
    document.getElementById('cmtForm').onsubmit = submitComment;
  } catch (e) {
    console.error(e); renderNotFound();
  }
})();

/* ───────────────── 렌더 함수들 ──────────────────────────────── */
function renderNotFound() {
  root.textContent = '영화를 찾을 수 없습니다.';
}

function renderMovie(m) {
  /* 절대 경로로 바꿔야 /movies/… 하위에서도 이미지가 보입니다 */
  const poster = '/' + m.poster_url.replace(/^\/?/, '');

  root.innerHTML = `
    <article class="movie-card-lg">
      <img class="poster-lg" src="${poster}" alt="${m.title}">
      <div class="meta">
        <p class="small">영화 id: <b>${m.id}</b></p>
        <h2 class="title-row">🎬 ${m.title}</h2>

        <p><span class="icon">📅</span> 개봉일: ${formatDate(m.release_date)}</p>
        <p><span class="icon">⭐</span> 평점: ${m.vote_average.toFixed(1)}</p>

        <p class="overview"><span class="icon">📝</span> 줄거리: ${escape(
          m.overview)}</p>

        <button id="backBtn">목록으로</button>
      </div>
    </article>

    <section class="review-box">
      <h3>🎞️ 영화 후기</h3>
      <ul id="cmtList" class="cmt-list"></ul>

      <form id="cmtForm" class="cmt-form">
        <input  name="name" placeholder="이름(선택)">
        <textarea name="content" placeholder="후기를 입력하세요" required></textarea>
        <button type="submit">등록</button>
      </form>
    </section>`;

  document.getElementById('backBtn').onclick = () => history.back();
}

async function loadComments() {
  const list = await api(`/movies/${id}/comments`);
  document.getElementById('cmtList').innerHTML = list
    .map(c => `<li><b>${escape(c.name)}</b> · ${formatDate(c.timestamp)}
               <p>${escape(c.content)}</p></li>`).join('');
}

async function submitComment(e) {
  e.preventDefault();
  const f = e.target;
  const name = f.name.value.trim() || '익명';
  const content = f.content.value.trim();
  if (!content) return;

  await api(`/movies/${id}/comments`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name,content})
  });

  f.reset(); loadComments();
}

function escape(str) {
  return str.replace(/[&<>"']/g, s =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}
