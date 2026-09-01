(function(){
  const App = {};

  App.escapeHtml = function(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[c]);
  };

  App.toast = function(msg){
    document.querySelectorAll('.toast').forEach(old => old.remove());
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = String(msg == null ? '' : msg);
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 300);
    }, 2600);
  };

  App.busy = function(btn, promiseFn){
    if(!btn) return promiseFn();
    const prevText = btn.textContent;
    const prevDisabled = btn.disabled;
    btn.disabled = true;
    btn.textContent = '…';
    return Promise.resolve()
      .then(promiseFn)
      .finally(() => {
        btn.disabled = prevDisabled;
        btn.textContent = prevText;
      });
  };

  let currentView = 'talk';

  function switchTab(name){
    if(name !== 'talk' && currentView === 'talk'){
      // leaving the chat: never let TTS keep talking or the mic stay open
      if(window.Talk && typeof window.Talk.suspend === 'function'){
        try { window.Talk.suspend(); } catch(e){ /* ignore */ }
      }
    }
    if(name === 'vocab' && window.VocabUI && typeof window.VocabUI.refresh === 'function'){
      // stats/list go stale while a conversation or report edits the deck
      try { window.VocabUI.refresh(); } catch(e){ /* ignore */ }
    }
    currentView = name;
    document.querySelectorAll('.view').forEach(v => {
      v.classList.toggle('active', v.id === 'view-' + name);
    });
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.view === name);
    });
    window.scrollTo(0, 0);
  }

  function initTabs(){
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.view));
    });
  }

  /* iOS Safari: 100vh lies, and the on-screen keyboard covers the fixed tabbar
     and the chat controls. Publish the real visual viewport + keyboard inset
     as CSS variables so the layout can react. */
  let syncTimer = null;
  function syncViewport(){
    const root = document.documentElement;
    const bar = document.querySelector('.topbar');
    if(bar){
      const h = Math.round(bar.getBoundingClientRect().height);
      if(h > 0) root.style.setProperty('--topbar-h', h + 'px');
    }
    const vv = window.visualViewport;
    const vh = Math.round(vv ? vv.height : window.innerHeight);
    if(vh > 0) root.style.setProperty('--vvh', vh + 'px');
    let kb = 0;
    if(vv) kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
    root.style.setProperty('--kb', kb + 'px');
    if(document.body) document.body.classList.toggle('kb-open', kb > 90);
  }

  // Sync now AND once more after the keyboard/rotation animation settles.
  // (Never defer the only update to rAF: it is throttled in background tabs,
  // which leaves --vvh stale and the chat pane the wrong height.)
  function queueSync(){
    syncViewport();
    clearTimeout(syncTimer);
    syncTimer = setTimeout(syncViewport, 180);
  }

  function initViewport(){
    syncViewport();
    window.addEventListener('resize', queueSync);
    window.addEventListener('orientationchange', () => setTimeout(queueSync, 250));
    if(window.visualViewport){
      window.visualViewport.addEventListener('resize', queueSync);
      window.visualViewport.addEventListener('scroll', queueSync);
    }
    // fonts/safe-area can settle a frame or two late
    setTimeout(syncViewport, 300);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initViewport();
    initTabs();
    if(window.Talk && typeof window.Talk.init === 'function') window.Talk.init();
    if(window.VocabUI && typeof window.VocabUI.init === 'function') window.VocabUI.init();
    if(window.SettingsUI && typeof window.SettingsUI.init === 'function') window.SettingsUI.init();
    syncViewport();
  });

  window.App = App;
})();
