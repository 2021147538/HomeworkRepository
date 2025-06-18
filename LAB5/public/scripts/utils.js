const host = '';     // 같은 오리진이면 빈 문자열

export function api(path, opts = {}) {
  return new Promise((resolve, reject) => {
    const xhr    = new XMLHttpRequest();
    const method = (opts.method || 'GET').toUpperCase();

    xhr.open(method, host + '/api' + path, true);
    xhr.responseType = 'json';

    /* 헤더 지정 */
    if (opts.headers)
      Object.entries(opts.headers)
            .forEach(([k, v]) => xhr.setRequestHeader(k, v));

    /* 완료 콜백 */
    xhr.onload = () => {
      const ok = xhr.status >= 200 && xhr.status < 300;
      if (ok) resolve(xhr.response);
      else    reject(new Error(xhr.statusText || 'HTTP ' + xhr.status));
    };
    xhr.onerror = () => reject(new Error('Network Error'));

    xhr.send(opts.body || null);
  });
}

/* 날짜 출력 공용 함수 */
export const formatDate = d =>
  new Date(d).toLocaleDateString('ko-KR',
    { year: 'numeric', month: '2-digit', day: '2-digit' });
