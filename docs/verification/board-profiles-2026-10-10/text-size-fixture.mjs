import http from 'node:http';

// Local, GET-only text-size fixture over the final build. No application source changes.
http.createServer(async (request, response) => {
  if (request.method !== 'GET' || !request.url?.startsWith('/')) {
    response.writeHead(405).end();
    return;
  }
  try {
    const upstream = await fetch(`http://127.0.0.1:4352${request.url}`);
    const headers = Object.fromEntries(upstream.headers);
    delete headers['content-length'];
    delete headers['content-encoding'];
    delete headers.etag;
    headers['cache-control'] = 'no-store';
    headers['x-robots-tag'] = 'noindex, follow';
    response.writeHead(upstream.status, headers);
    if ((headers['content-type'] ?? '').includes('text/html')) {
      response.end((await upstream.text()).replace('</head>', '<style>html{font-size:200%;}</style></head>'));
    } else response.end(Buffer.from(await upstream.arrayBuffer()));
  } catch { response.writeHead(503).end(); }
}).listen(4354, '127.0.0.1', () => console.log('Final text-size fixture ready on 4354'));
