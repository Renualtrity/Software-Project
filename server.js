var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var url = require('url');

var PORT = 8080;
var PUBLIC_DIR = path.join(__dirname, '.');

var mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

http.createServer(function(request, response) {
    console.log('[' + new Date().toISOString() + '] Request: ' + request.url);

    var parsedUrl = new URL(request.url, 'http://localhost');
    var pathname = parsedUrl.pathname;

    if (pathname === '/api/download') {
        handleDownloadProxy(request, response, parsedUrl);
        return;
    }

    if (pathname === '/api/ai/generate') {
        handleAIGenerate(request, response);
        return;
    }

    var filePath = '.' + pathname;
    if (filePath === './') {
        filePath = './index.html';
    }

    var extname = String(path.extname(filePath)).toLowerCase();
    var contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(path.join(PUBLIC_DIR, filePath), function(error, content) {
        if (error) {
            if(error.code === 'ENOENT') {
                response.writeHead(404);
                response.end('File not found');
            } else {
                response.writeHead(500);
                response.end('Server Error: ' + error.code);
            }
        } else {
            response.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            response.end(content, 'utf-8');
        }
    });
}).listen(PORT, function() {
    console.log('MCGA Pro Server running at http://localhost:' + PORT + '/');
});

function handleDownloadProxy(request, response, parsedUrl) {
    var targetUrl = parsedUrl.searchParams.get('url');
    var filename = parsedUrl.searchParams.get('filename') || 'download';

    if (!targetUrl) {
        response.writeHead(400);
        response.end('Missing URL parameter');
        return;
    }

    console.log('[' + new Date().toISOString() + '] Proxy download: ' + targetUrl + ' -> ' + filename);

    downloadFileWithRedirect(targetUrl, 5, function(err, res) {
        if (err) {
            console.error('[' + new Date().toISOString() + '] Download proxy error:', err);
            response.writeHead(500);
            response.end('Download failed: ' + err.message);
            return;
        }

        console.log('[' + new Date().toISOString() + '] Download response status: ' + res.statusCode);

        if (res.statusCode !== 200) {
            var body = [];
            res.on('data', function(chunk) { body.push(chunk); });
            res.on('end', function() {
                console.error('[' + new Date().toISOString() + '] Download error body:', Buffer.concat(body).toString());
                response.writeHead(res.statusCode);
                response.end('Download failed with status ' + res.statusCode);
            });
            return;
        }

        var contentDisposition = 'attachment; filename="' + filename + '"';
        
        response.writeHead(200, {
            'Content-Type': res.headers['content-type'] || 'application/octet-stream',
            'Content-Disposition': contentDisposition,
            'Content-Length': res.headers['content-length']
        });

        res.pipe(response);
    });
}

function downloadFileWithRedirect(targetUrl, maxRedirects, callback) {
    var target = new URL(targetUrl);
    var protocol = target.protocol === 'https:' ? https : http;

    var options = {
        hostname: target.hostname,
        path: target.pathname + target.search,
        headers: {
            'User-Agent': 'MCGA-Pro/2.0.0 (https://github.com/Renualtrity/Software-project)'
        }
    };

    protocol.get(options, function(res) {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && maxRedirects > 0) {
            console.log('[' + new Date().toISOString() + '] Redirecting to: ' + res.headers.location);
            downloadFileWithRedirect(res.headers.location, maxRedirects - 1, callback);
        } else {
            callback(null, res);
        }
    }).on('error', function(err) {
        callback(err, null);
    });
}

function handleAIGenerate(request, response) {
    if (request.method !== 'POST') {
        response.writeHead(405, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    var body = '';
    request.on('data', function(chunk) { body += chunk; });
    request.on('end', function() {
        try {
            var params = JSON.parse(body);
            var apiKey = params.apiKey;
            var apiUrl = params.apiUrl;
            var model = params.model;
            var messages = params.messages;
            var temperature = typeof params.temperature === 'number' ? params.temperature : 0.7;

            if (!apiKey || !apiUrl || !model || !messages) {
                response.writeHead(400, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: 'Missing required parameters: apiKey, apiUrl, model, messages' }));
                return;
            }

            console.log('[' + new Date().toISOString() + '] AI generate request: model=' + model + ', url=' + apiUrl);

            var target = new URL(apiUrl);
            var protocol = target.protocol === 'https:' ? https : http;

            var requestBody = JSON.stringify({
                model: model,
                messages: messages,
                temperature: temperature,
                max_tokens: 4096,
                stream: false
            });

            var options = {
                hostname: target.hostname,
                port: target.port || (target.protocol === 'https:' ? 443 : 80),
                path: target.pathname + target.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey,
                    'Content-Length': Buffer.byteLength(requestBody),
                    'User-Agent': 'MCGA-Pro/2.0.0'
                }
            };

            var req = protocol.request(options, function(res) {
                var responseBody = '';
                res.on('data', function(chunk) { responseBody += chunk; });
                res.on('end', function() {
                    console.log('[' + new Date().toISOString() + '] AI response status: ' + res.statusCode);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            var data = JSON.parse(responseBody);
                            var content = '';
                            if (data.choices && data.choices[0]) {
                                if (data.choices[0].message && data.choices[0].message.content) {
                                    content = data.choices[0].message.content;
                                } else if (data.choices[0].text) {
                                    content = data.choices[0].text;
                                }
                            }
                            response.writeHead(200, {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            });
                            response.end(JSON.stringify({
                                success: true,
                                content: content,
                                raw: data
                            }));
                        } catch (e) {
                            response.writeHead(500, { 'Content-Type': 'application/json' });
                            response.end(JSON.stringify({ error: 'Failed to parse AI response: ' + e.message, raw: responseBody }));
                        }
                    } else {
                        console.error('[' + new Date().toISOString() + '] AI error response: ' + responseBody);
                        response.writeHead(res.statusCode, { 'Content-Type': 'application/json' });
                        response.end(JSON.stringify({ error: 'AI API returned ' + res.statusCode, raw: responseBody }));
                    }
                });
            });

            req.on('error', function(err) {
                console.error('[' + new Date().toISOString() + '] AI request error:', err);
                response.writeHead(500, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: 'AI request failed: ' + err.message }));
            });

            req.write(requestBody);
            req.end();

        } catch (e) {
            console.error('[' + new Date().toISOString() + '] AI generate error:', e);
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Server error: ' + e.message }));
        }
    });
}
