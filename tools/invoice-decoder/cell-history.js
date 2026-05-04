/**
 * Per-cell edit history (Wave 13.8).
 *
 * 5-deep ring buffer per (rowIdx, field). Hovering a cell shows a
 * small clock icon; clicking opens "what you typed → what was OCR'd
 * → what we suggested," each restorable.
 *
 * Storage: in-memory only (this session). No localStorage write —
 * the operator's confirmed edits already persist via commitCellEdit;
 * this layer is the in-session undo stack.
 *
 * Public API:
 *   record(rowIdx, field, value, source)
 *   list(rowIdx, field)          → [{value, source, ts}]
 *   restore(rowIdx, field, idx)  → value to restore
 */
(function (root) {
  'use strict';

  var DEPTH = 5;
  var __ring = {};

  function _key(rowIdx, field) { return rowIdx + ':' + field; }

  function record(rowIdx, field, value, source) {
    var k = _key(rowIdx, field);
    var stack = __ring[k] || [];
    stack.unshift({ value: value, source: source || 'edit', ts: Date.now() });
    if (stack.length > DEPTH) stack.length = DEPTH;
    __ring[k] = stack;
  }
  function list(rowIdx, field) {
    return (__ring[_key(rowIdx, field)] || []).slice();
  }
  function restore(rowIdx, field, idx) {
    var stack = __ring[_key(rowIdx, field)] || [];
    return stack[idx] || null;
  }
  function clearRow(rowIdx) {
    Object.keys(__ring).forEach(function (k) {
      if (k.indexOf(rowIdx + ':') === 0) delete __ring[k];
    });
  }
  function clearAll() { __ring = {}; }

  var api = {
    record: record, list: list, restore: restore,
    clearRow: clearRow, clearAll: clearAll, DEPTH: DEPTH
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_CELL_HISTORY = api;
})(typeof window !== 'undefined' ? window : null);
