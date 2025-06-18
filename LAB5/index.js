/**
 * index.js – LAB5 백엔드
 *  ▸ Express + SQLite3 + JSON(File-I/O) 댓글
 *  ▸ Fetch API 미사용 (프런트는 XHR 기반 utils.js)
 */

import fs      from 'fs';
import path    from 'path';
import url     from 'url';
import express from 'express';
import cors    from 'cors';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const DB_PATH   = path.join(__dirname, 'product.db');
const CMT_PATH  = path.join(__dirname, 'comment.json');
const PORT      = process.env.PORT || 3000;

/* ------------------------------------------------------------------ */
/* 1. 기본 미들웨어 + 정적 파일                                        */
/* ------------------------------------------------------------------ */
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ------------------------------------------------------------------ */
/* 2. SQLite DB 초기화                                                */
/* ------------------------------------------------------------------ */
const db = new sqlite3.Database(DB_PATH);
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS movies(
    movie_id            INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_image         TEXT,
    movie_title         TEXT,
    movie_overview      TEXT,
    movie_release_date  TEXT,
    movie_rate          REAL
  )`);

  /*  DB가 비어 있으면 seed.json → 시딩 (1회용)  */
  db.get('SELECT COUNT(*) AS n FROM movies', (_, row) => {
    if (row.n === 0) seedDB();
  });
});

/* ------------------------------------------------------------------ */
/* 3. 댓글 파일 초기화                                                */
/* ------------------------------------------------------------------ */
if (!fs.existsSync(CMT_PATH)) fs.writeFileSync(CMT_PATH, '{}', 'utf8');

/* ------------------------------------------------------------------ */
/* 4. REST API                                                        */
/* ------------------------------------------------------------------ */

/* ► 4-1. 영화 목록 + 검색 + 정렬 + 페이징 */
app.get('/api/movies', (req, res) => {
  const {
    search = '',
    sort   = 'id',                // id | title | release_date | vote_average
    order  = 'asc',               // asc | desc
    offset = 0,
    limit  = 6
  } = req.query;

  /* 프런트 파라미터 → 실제 DB 컬럼 매핑 */
  const sortMap = {
    id            : 'movie_id',
    title         : 'movie_title',
    release_date  : 'movie_release_date',
    vote_average  : 'movie_rate'
  };
  const col   = sortMap[sort] || 'movie_id';
  const dir   = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  db.all(
    `SELECT
        movie_id           AS id,
        movie_image        AS poster_url,
        movie_title        AS title,
        movie_overview     AS overview,
        movie_release_date AS release_date,
        movie_rate         AS vote_average
     FROM movies
     WHERE movie_title LIKE ? COLLATE NOCASE
     ORDER BY ${col} ${dir}
     LIMIT ? OFFSET ?`,
    [`%${search}%`, +limit, +offset],
    (e, rows) => e ? res.status(500).json(e) : res.json(rows)
  );
});

/* ► 4-2. 영화 상세  */
app.get('/api/movies/:id', (req, res) => {
  db.get(
    `SELECT
        movie_id           AS id,
        movie_image        AS poster_url,
        movie_title        AS title,
        movie_overview     AS overview,
        movie_release_date AS release_date,
        movie_rate         AS vote_average
     FROM movies
     WHERE movie_id = ?`,
    [req.params.id],
    (_, row) => row ? res.json(row) : res.status(404).end()
  );
});

/* ► 4-3. 댓글 가져오기 */
app.get('/api/movies/:id/comments', (req, res) => {
  const data = JSON.parse(fs.readFileSync(CMT_PATH));
  res.json(data[req.params.id] || []);
});

/* ► 4-4. 댓글 작성 (File-I/O) */
app.post('/api/movies/:id/comments', (req, res) => {
  const { name = '익명', content = '' } = req.body;
  if (!content.trim()) return res.status(400).end();

  const dbj  = JSON.parse(fs.readFileSync(CMT_PATH));
  (dbj[req.params.id] ||= []).push({
    id: Date.now(),
    name,
    content,
    timestamp: new Date().toISOString()
  });
  fs.writeFileSync(CMT_PATH, JSON.stringify(dbj, null, 2));
  res.status(201).end();
});

/* ------------------------------------------------------------------ */
/* 5. /movies/:id → detail.html 라우팅 (항상 API 뒤쪽!)                */
/* ------------------------------------------------------------------ */
app.get('/movies/:id', (_, res) =>
  res.sendFile(path.join(__dirname, 'public', 'detail.html')));

/* ------------------------------------------------------------------ */
/* 6. 시딩 함수 (product.json → seed.json)                            */
/* ------------------------------------------------------------------ */
function seedDB() {
  const seed = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'public', 'product.json'), 'utf8')
  );
  const st = db.prepare(
    `INSERT INTO movies
       (movie_image, movie_title, movie_overview, movie_release_date, movie_rate)
     VALUES (?,?,?,?,?)`
  );
  seed.forEach(m =>
    st.run(m.poster_url, m.title, m.overview, m.release_date, m.vote_average));
  st.finalize(() => {
    console.log(`📀 DB seeded (${seed.length} movies)`);
  });
}

/* ------------------------------------------------------------------ */
/* 7. 서버 시작                                                        */
/* ------------------------------------------------------------------ */
app.listen(PORT, () =>
  console.log(`🎬  http://localhost:${PORT}`));
