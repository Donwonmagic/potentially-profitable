/**
 * Shared fetch-with-retry orchestrator for the Muntin Digital toolkit.
 *
 * Seven URL-scanning tools (Speed Test, Mobile Check, Schema Check, SEO
 * Grader, Tech Stack, Compare, Restaurant Audit) each implement their
 * own retry loop — some with exponential backoff, some fixed, some
 * none at all, none honoring Retry-After headers. This module wraps
 * MuntinFetchError into one orchestrator with sensible defaults.
 *
 * Usage:
 *   try {
 *     const response = await MuntinFetchRetry.run(() => fetch(url), {
 *       maxRetries: 2,         // initial + 2 retries = 3 attempts max
 *       initialDelayMs: 500,
 *       backoff: 'exponential', // 500 → 1000 → 2000
 *       signal: abortController.signal,
 *       onAttempt: (n, delayMs) => statusBar.textContent = `Retrying… (${n})`,
 *     });
 *     // success — response is the resolved fetch Response
 *   } catch (err) {
 *     const classified = err.classified;       // MuntinFetchError record
 *     const messageEn   = err.messageEn;
 *     const retryAfter  = err.retryAfterSec;
 *   }
 *
 * Behaviour:
 *  - On transient kinds (rate-limit, timeout, server-error, network),
 *    retry up to maxRetries with the configured backoff. If the error
 *    record has a retryAfterSec value, it overrides the backoff.
 *  - On terminal kinds (not-found, cors, bot-block, unknown), throw
 *    immediately.
 *  - If signal aborts at any point, throws an AbortError.
 *
 * Depends on: MuntinFetchError (loaded as a sibling script).
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(typeof require === 'function' ? require('./fetch-error.js') : null);
  } else if (typeof self !== 'undefined') {
    self.MuntinFetchRetry = factory(self.MuntinFetchError);
  }
}(typeof self !== 'undefined' ? self : this, function (MuntinFetchError) {
  'use strict';

  var TRANSIENT_KINDS = { 'rate-limit':1, 'timeout':1, 'server-error':1, 'network':1 };

  function delay(ms, signal) {
    return new Promise(function (resolve, reject) {
      if (signal && signal.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }
      var t = setTimeout(resolve, ms);
      if (signal) {
        signal.addEventListener('abort', function () {
          clearTimeout(t);
          reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
      }
    });
  }

  function classifyError(err, response) {
    if (MuntinFetchError && typeof MuntinFetchError.classifyFetchError === 'function') {
      return MuntinFetchError.classifyFetchError(err, response);
    }
    // Bare fallback so this module is usable even if fetch-error.js
    // hasn't loaded yet — callers still get a structured throw.
    return {
      kind: 'unknown',
      messageEn: (err && err.message) || 'Something went wrong.',
      messageEs: 'Algo salió mal.',
      retryAfterSec: null
    };
  }

  function isTransient(kind) {
    return Boolean(TRANSIENT_KINDS[kind]);
  }

  function nextDelay(opts, attempt) {
    var base = opts.initialDelayMs == null ? 500 : opts.initialDelayMs;
    var mode = opts.backoff || 'exponential';
    if (mode === 'fixed') return base;
    if (mode === 'linear') return base * attempt;
    return base * Math.pow(2, attempt - 1); // exponential
  }

  // run(fetchFn, options) -> Promise<Response>
  function run(fetchFn, options) {
    options = options || {};
    var maxRetries = options.maxRetries == null ? 2 : options.maxRetries;
    var signal = options.signal;
    var onAttempt = typeof options.onAttempt === 'function' ? options.onAttempt : null;

    function attempt(n) {
      if (signal && signal.aborted) {
        return Promise.reject(new DOMException('Aborted', 'AbortError'));
      }
      if (onAttempt && n > 1) onAttempt(n, 0);
      return Promise.resolve()
        .then(fetchFn)
        .then(function (response) {
          if (response && response.ok === false) {
            // Surface HTTP errors so classifyError can read status/headers.
            var httpErr = new Error('HTTP ' + response.status);
            httpErr.response = response;
            httpErr.status = response.status;
            throw httpErr;
          }
          return response;
        })
        .catch(function (err) {
          if (err && err.name === 'AbortError') throw err;
          var classified = classifyError(err, err && err.response);
          if (n - 1 >= maxRetries || !isTransient(classified.kind)) {
            var thrown = new Error(classified.messageEn);
            thrown.classified = classified;
            thrown.messageEn = classified.messageEn;
            thrown.messageEs = classified.messageEs;
            thrown.kind = classified.kind;
            thrown.retryAfterSec = classified.retryAfterSec;
            thrown.cause = err;
            throw thrown;
          }
          // Compute delay; honour Retry-After if present.
          var waitMs = classified.retryAfterSec != null
            ? classified.retryAfterSec * 1000
            : nextDelay(options, n);
          if (onAttempt) onAttempt(n + 1, waitMs);
          return delay(waitMs, signal).then(function () { return attempt(n + 1); });
        });
    }

    return attempt(1);
  }

  return {
    run: run,
    isTransient: isTransient
  };
}));
