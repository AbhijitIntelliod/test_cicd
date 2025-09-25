const logger = require('../config/logger'); 

function summarizeFiles(req) {
  const oneMB = 1024 * 1024;
  let files = [];

  // Support popular upload middlewares like multer
  if (req.file) {
    files.push(req.file);
  }
  if (Array.isArray(req.files)) {
    files = files.concat(req.files);
  } else if (req.files && typeof req.files === 'object') {
    for (const key of Object.keys(req.files)) {
      const entry = req.files[key];
      if (Array.isArray(entry)) files = files.concat(entry);
      else if (entry) files.push(entry);
    }
  }

  if (files.length === 0) {
    const contentLength = Number(req.headers && req.headers['content-length']);
    if (!Number.isNaN(contentLength) && contentLength > oneMB) {
      return { payload_bytes: contentLength, payload_mb: Number((contentLength / oneMB).toFixed(2)) };
    }
    return null;
  }

  const totalBytes = files.reduce((sum, f) => sum + (Number(f.size) || 0), 0);
  if (totalBytes <= oneMB) return null;

  const details = files.map((f) => {
    const base = {
      fieldname: f.fieldname || null,
      originalname: f.originalname || null,
      mimetype: f.mimetype || null,
      size: Number(f.size) || 0,
    };

    // Optionally estimate rows for small text/CSV buffers to avoid heavy processing
    try {
      if (f.buffer && typeof f.buffer === 'object' && (f.mimetype || '').includes('csv')) {
        const content = f.buffer.toString('utf8');
        const rows = content.split(/\r?\n/).filter(Boolean).length;
        return { ...base, rows };
      }
    } catch (_) {}

    return base;
  });

  return {
    total_bytes: totalBytes,
    total_mb: Number((totalBytes / oneMB).toFixed(2)),
    file_count: files.length,
    files: details,
  };
}

function parseResponseBody(responseData) {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(responseData);
    return parsed;
  } catch (e) {
    // If not JSON, check if it's a large response
    if (responseData.length > 10000) {
      return {
        type: 'large_response',
        size_bytes: responseData.length,
        preview: responseData.substring(0, 200) + '...'
      };
    }
    return responseData;
  }
}

module.exports = function requestLogger(req, res, next) {
  const startTimeMs = Date.now();

  // Extract user_id and ip_address
  const userId = (req.body && req.body.user_id) || 
                 (req.headers && req.headers['x-user-id']) || 
                 (req.user && req.user.id) || // if you have auth middleware
                 null;
                 
  const ipAddress = req.ip || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket && req.connection.socket.remoteAddress) ||
                   null;

  // Set context for this request
  const contextData = {};
  if (userId) contextData.user_id = userId;
  if (ipAddress) contextData.ip_address = ipAddress;
  
  // Set the context in the logger
  logger.setContext(contextData);

  // Track response payload size and capture response body
  const originalWrite = res.write;
  const originalEnd = res.end;
  let responseBytes = 0;
  let responseChunks = [];

  res.write = function (chunk, encoding, callback) {
    try {
      if (chunk) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), encoding);
        responseBytes += buffer.length;
        responseChunks.push(buffer);
      }
    } catch (_) {}
    return originalWrite.call(this, chunk, encoding, callback);
  };

  res.end = function (chunk, encoding, callback) {
    try {
      if (chunk) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), encoding);
        responseBytes += buffer.length;
        responseChunks.push(buffer);
      }
    } catch (_) {}
    return originalEnd.call(this, chunk, encoding, callback);
  };

  res.on('finish', () => {
    const durationMs = Date.now() - startTimeMs;

    const uploadInfo = summarizeFiles(req);

    // Combine response chunks to get full response body
    let responseBody = null;
    try {
      if (responseChunks.length > 0) {
        const fullResponse = Buffer.concat(responseChunks).toString('utf8');
        responseBody = parseResponseBody(fullResponse);
      }
    } catch (e) {
      responseBody = { error: 'Failed to parse response body', size_bytes: responseBytes };
    }

    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration_ms: durationMs,
      response_size_bytes: responseBytes,
      request: {
        body: req.body,
        params: req.params,
        query: req.query,
        headers: {
          'user-agent': req.get('User-Agent'),
          'content-type': req.get('Content-Type'),
          'authorization': req.get('Authorization') ? 'Bearer ***' : undefined
        }
      },
      response: {
        body: responseBody,
        headers: {
          'content-type': res.get('Content-Type'),
          'content-length': res.get('Content-Length')
        }
      }
    };

    if (uploadInfo) {
      logData.upload = uploadInfo;
    }

    // Add error details if available
    if (res.locals && res.locals.error) {
      logData.response.error = res.locals.error;
    }

    const level = res.statusCode >= 500 ? 'error' : (res.statusCode >= 400 ? 'warn' : 'info');

    logger[level]('HTTP request completed', logData);

    logger.clearContext();
  });

  next();
};