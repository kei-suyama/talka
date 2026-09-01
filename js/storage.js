// storage.js - localStorage wrapper
(function () {
  const PREFIX = 'talka:';

  function get(key, def) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null || raw === undefined) return def;
      return JSON.parse(raw);
    } catch (e) {
      return def;
    }
  }

  function set(key, val) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(val));
      return true;
    } catch (e) {
      return false;
    }
  }

  function del(key) {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch (e) {
      /* ignore */
    }
  }

  window.Store = { get, set, del };
})();
