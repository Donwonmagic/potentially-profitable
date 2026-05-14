/**
 * Shared schema-based form validator for the Muntin Digital toolkit.
 *
 * Eight+ tools inline their own per-field blur handlers with
 * inconsistent error messages, focus management, and required-field
 * semantics. This module replaces those with a tiny schema:
 *
 *   const errors = MuntinValidate.validate({
 *     name:    { value: '',           rules: 'required' },
 *     email:   { value: 'foo',        rules: 'required|email' },
 *     price:   { value: '12.50',      rules: 'required|number|min:0' },
 *     menuUrl: { value: 'menu.com',   rules: 'url' },
 *   }, { locale: 'en' });
 *
 *   if (errors.name) ...
 *
 * Rules supported: required, number, integer, min:N, max:N, email, url,
 * pattern:<name>, maxLength:N, minLength:N. Pattern names: 'usZip',
 * 'phone', 'time24h'. Add to PATTERNS below.
 *
 * Messages are localized in EN + ES.
 *
 * Pure functions; safe to import in Node tests.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else if (typeof self !== 'undefined') {
    self.MuntinValidate = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Tolerant URL check — accept absent scheme; we don't try to parse
  // the path. Reject obvious garbage (whitespace, no dot).
  var URL_RE   = /^(?:https?:\/\/)?[^\s/$.?#].[^\s]*$/i;

  var PATTERNS = {
    usZip:   /^\d{5}(?:-\d{4})?$/,
    phone:   /^[+()\-\d\s]{7,}$/,
    time24h: /^([01]\d|2[0-3]):[0-5]\d$/
  };

  var MESSAGES = {
    en: {
      required:  function () { return 'This field is required.'; },
      number:    function () { return 'Enter a number.'; },
      integer:   function () { return 'Enter a whole number.'; },
      min:       function (n) { return 'Must be ' + n + ' or more.'; },
      max:       function (n) { return 'Must be ' + n + ' or less.'; },
      email:     function () { return 'Enter a valid email.'; },
      url:       function () { return 'Enter a valid URL.'; },
      minLength: function (n) { return 'At least ' + n + ' characters.'; },
      maxLength: function (n) { return 'At most ' + n + ' characters.'; },
      pattern:   function () { return 'Doesn\'t match the expected format.'; }
    },
    es: {
      required:  function () { return 'Este campo es obligatorio.'; },
      number:    function () { return 'Escribe un número.'; },
      integer:   function () { return 'Escribe un número entero.'; },
      min:       function (n) { return 'Debe ser ' + n + ' o más.'; },
      max:       function (n) { return 'Debe ser ' + n + ' o menos.'; },
      email:     function () { return 'Escribe un correo válido.'; },
      url:       function () { return 'Escribe una URL válida.'; },
      minLength: function (n) { return 'Al menos ' + n + ' caracteres.'; },
      maxLength: function (n) { return 'Como máximo ' + n + ' caracteres.'; },
      pattern:   function () { return 'No coincide con el formato esperado.'; }
    }
  };

  function isEmpty(v) {
    return v == null || (typeof v === 'string' && v.trim() === '');
  }

  function parseRules(ruleStr) {
    if (Array.isArray(ruleStr)) return ruleStr;
    if (!ruleStr) return [];
    return String(ruleStr).split('|').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function checkOne(rule, value, msgs) {
    var parts = rule.split(':');
    var name = parts[0];
    var arg = parts[1];
    var s = isEmpty(value) ? '' : String(value).trim();
    switch (name) {
      case 'required':
        if (isEmpty(value)) return msgs.required();
        return null;
      case 'number':
        if (s === '') return null;
        if (!isFinite(Number(s))) return msgs.number();
        return null;
      case 'integer':
        if (s === '') return null;
        if (!/^-?\d+$/.test(s)) return msgs.integer();
        return null;
      case 'min':
        if (s === '') return null;
        if (Number(s) < Number(arg)) return msgs.min(arg);
        return null;
      case 'max':
        if (s === '') return null;
        if (Number(s) > Number(arg)) return msgs.max(arg);
        return null;
      case 'email':
        if (s === '') return null;
        if (!EMAIL_RE.test(s)) return msgs.email();
        return null;
      case 'url':
        if (s === '') return null;
        if (!URL_RE.test(s)) return msgs.url();
        return null;
      case 'minLength':
        if (s.length < Number(arg)) return msgs.minLength(arg);
        return null;
      case 'maxLength':
        if (s.length > Number(arg)) return msgs.maxLength(arg);
        return null;
      case 'pattern':
        if (s === '') return null;
        var re = PATTERNS[arg];
        if (!re) return null; // unknown pattern is silently a pass
        if (!re.test(s)) return msgs.pattern();
        return null;
      default:
        return null; // unknown rule is silently a pass
    }
  }

  // validate(spec, options) -> { fieldName: 'first error message' }
  // Only the first failing rule per field is returned, matching how
  // most tools render inline errors.
  function validate(spec, options) {
    options = options || {};
    var msgs = MESSAGES[options.locale === 'es' ? 'es' : 'en'];
    var errors = {};
    Object.keys(spec || {}).forEach(function (field) {
      var entry = spec[field] || {};
      var rules = parseRules(entry.rules);
      for (var i = 0; i < rules.length; i++) {
        var err = checkOne(rules[i], entry.value, msgs);
        if (err) { errors[field] = err; break; }
      }
    });
    return errors;
  }

  function hasErrors(errors) {
    if (!errors) return false;
    for (var k in errors) { if (Object.prototype.hasOwnProperty.call(errors, k)) return true; }
    return false;
  }

  return {
    validate: validate,
    hasErrors: hasErrors,
    addPattern: function (name, regex) { PATTERNS[name] = regex; }
  };
}));
