/*
 * Adds HTTP Range support to the video files served from static assets.
 * Browsers need 206 Partial Content to seek inside a video; without it,
 * clicking the timeline jumps back to the start until the whole file has
 * downloaded. Everything else is passed straight to the assets binding.
 */
const VIDEO = /\.(webm|mp4)$/i;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!VIDEO.test(url.pathname) || (request.method !== 'GET' && request.method !== 'HEAD')) {
      return env.ASSETS.fetch(request);
    }

    // Ask the assets binding for the whole file (it ignores Range anyway).
    const plain = new Headers(request.headers);
    plain.delete('Range');
    plain.delete('If-Range');
    const res = await env.ASSETS.fetch(new Request(url.toString(), { method: 'GET', headers: plain }));
    if (res.status !== 200) return res;

    let size = Number(res.headers.get('Content-Length'));
    let body = res.body;
    if (!(size > 0) && request.headers.has('Range')) {
      // No length on the asset response: read it once to know the size.
      const buf = await res.arrayBuffer();
      size = buf.byteLength;
      body = new Blob([buf]).stream();
    }
    const headers = new Headers(res.headers);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=86400');

    const range = parseRange(request.headers.get('Range'), size);
    if (request.method === 'HEAD') {
      body && body.cancel();
      return new Response(null, { status: 200, headers });
    }
    if (!range) return new Response(body, { status: 200, headers });
    if (range === 'invalid') {
      body && body.cancel();
      return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    }

    const [start, end] = range;
    headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
    headers.set('Content-Length', String(end - start + 1));
    return new Response(slice(body, start, end), { status: 206, headers });
  },
};

function parseRange(value, size) {
  if (!value || !Number.isFinite(size) || size <= 0) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!m || (m[1] === '' && m[2] === '')) return null;
  let start, end;
  if (m[1] === '') {
    start = Math.max(0, size - Number(m[2]));
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start >= size || start > end) return 'invalid';
  return [start, end];
}

// Stream only bytes start..end (inclusive) of the body; chunks are cut with
// subarray(), so the work does not grow with the file size.
function slice(body, start, end) {
  let pos = 0;
  const reader = body.getReader();
  return new ReadableStream({
    async pull(controller) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) { controller.close(); return; }
        const chunkStart = pos;
        pos += value.byteLength;
        if (pos <= start) continue;
        const from = Math.max(0, start - chunkStart);
        const to = Math.min(value.byteLength, end - chunkStart + 1);
        if (to > from) controller.enqueue(value.subarray(from, to));
        if (pos > end) { controller.close(); reader.cancel(); return; }
        return;
      }
    },
    cancel(reason) { reader.cancel(reason); },
  });
}
