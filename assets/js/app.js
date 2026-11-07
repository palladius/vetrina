// ==============================================================================
// 🎠 Palladius Showcase: Interactive Showcase App
// Tree Classification: Audience (All, Kids, Tools) -> Kind (Game, Educational, Tool)
// ==============================================================================

(function () {
  'use strict';

  // State
  let allGames = [];
  let healthReport = window.VETRINA_HEALTH || null;
  let currentAudience = 'all'; // 'all', 'kids', 'tools'
  let currentKind = 'all';     // 'all', 'game', 'educational', 'tool'
  let currentTag = null;
  let searchTerm = '';
  let currentSort = 'juicy';   // 'juicy', 'score', 'recency', 'name'

  // DOM Elements
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const sortSelect = document.getElementById('sort-select');
  const gamesGrid = document.getElementById('games-grid');
  const emptyState = document.getElementById('empty-state');
  const emptyQuerySpan = document.getElementById('empty-query');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  const countDisplay = document.getElementById('count-display');
  const audienceBtns = document.querySelectorAll('.audience-filter-btn');
  const kindBtns = document.querySelectorAll('.kind-filter-btn');
  const activeFiltersContainer = document.getElementById('active-filters');
  const sreHeaderSummary = document.getElementById('sre-header-summary');

  // Detail Modal elements
  const detailModal = document.getElementById('detail-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalBody = document.getElementById('modal-body');

  // Play / Iframe Modal elements
  const playModal = document.getElementById('play-modal');
  const playModalTitle = document.getElementById('play-modal-title');
  const playModalIframe = document.getElementById('play-modal-iframe');
  const playModalExternalLink = document.getElementById('play-modal-external-link');
  const playModalCloseBtn = document.getElementById('play-modal-close-btn');

  // Initialize
  async function init() {
    setupEventListeners();
    await Promise.all([loadGamesData(), loadHealthData()]);
    updateSreHeaderSummary();
    render();
    handleHashRouting();
    window.addEventListener('hashchange', handleHashRouting);
    if (searchInput && !window.location.hash) {
      searchInput.focus();
    }
  }

  // Support direct bookmarkable hash endpoints: #kids, #ale-sebi, #tools, #diaries, #pwa, #sre, or game modal #game-tubature
  function handleHashRouting() {
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    if (!hash) return;

    if (hash === 'sre' || hash === 'health' || hash === 'status') {
      window.openSreModal();
    } else if (hash === 'kids' || hash === 'ale-sebi' || hash === 'ale-seby' || hash === 'kids-club') {
      window.filterByAudience('kids');
    } else if (hash === 'tools' || hash === 'dads-tools') {
      window.filterByAudience('tools');
    } else if (hash === 'diaries' || hash === 'journals') {
      window.filterByAudience('journals');
    } else if (hash === 'pwa' || hash === 'offline') {
      window.filterByTag('pwa');
    } else if (hash === 'puffin-ring' || hash === 'puffin-login' || hash === 'supports_puffin_login' || hash === 'ring') {
      window.filterByTag('supports_puffin_login');
    } else if (hash === 'character-consistency' || hash === 'consistency' || hash === 'faces') {
      window.filterByTag('character-consistency');
    } else if (hash.startsWith('game-') || hash.startsWith('app-')) {
      const gId = hash.replace(/^(game-|app-)/, '');
      const g = allGames.find((item) => item.id === gId);
      if (g) window.openGameDetails(g.id);
    }
  }

  // Load data from games.json or fallback
  async function loadGamesData() {
    try {
      const response = await fetch('data/games.json');
      if (!response.ok) throw new Error('Fetch failed');
      allGames = await response.json();
    } catch (e) {
      console.warn('Using local fallback PALLADIUS_GAMES data:', e);
      if (window.PALLADIUS_GAMES && Array.isArray(window.PALLADIUS_GAMES)) {
        allGames = window.PALLADIUS_GAMES;
      } else {
        console.error('No games data found.');
      }
    }

    updateDynamicCountLabels();
  }

  async function loadHealthData() {
    try {
      const response = await fetch('data/health.json');
      if (response.ok) {
        healthReport = await response.json();
      }
    } catch (e) {
      if (window.VETRINA_HEALTH) {
        healthReport = window.VETRINA_HEALTH;
      }
    }
  }

  function updateSreHeaderSummary() {
    if (!sreHeaderSummary || !healthReport || !healthReport.summary) return;
    const s = healthReport.summary;
    const parts = [`${s.healthy || 0}🟢`];
    if (s.ci_failing > 0) parts.push(`${s.ci_failing}🟡`);
    if (s.degraded > 0) parts.push(`${s.degraded}🟠`);
    if (s.down > 0) parts.push(`${s.down}🔴`);
    sreHeaderSummary.textContent = `SRE: ${parts.join(' ')}`;
  }

  function updateDynamicCountLabels() {
    const visibleGames = allGames.filter((g) => !g.archived && !g.hidden);
    const totalCount = visibleGames.length;
    const kidsCount = visibleGames.filter((g) => g.audience === 'kids' || g.category === 'kids').length;
    const journalsCount = visibleGames.filter((g) => g.audience === 'journals' || g.category === 'journals' || g.kind === 'journal').length;
    const toolsCount = visibleGames.filter((g) => g.audience === 'tools' || g.category === 'tools').length;

    audienceBtns.forEach((btn) => {
      const aud = btn.dataset.audience;
      if (aud === 'all') btn.textContent = `🌟 All (${totalCount})`;
      if (aud === 'kids') btn.textContent = `🧸 Kids & Family (${kidsCount})`;
      if (aud === 'journals') btn.textContent = `📔 Papino's Diaries (${journalsCount})`;
      if (aud === 'tools') btn.textContent = `🛠️ Dad's Tools (${toolsCount})`;
    });

    const gamesCount = visibleGames.filter((g) => g.kind === 'game' || g.is_game).length;
    const eduCount = visibleGames.filter((g) => g.kind === 'educational' || (g.tags || []).includes('educational')).length;

    kindBtns.forEach((btn) => {
      const k = btn.dataset.kind;
      if (k === 'game') btn.innerHTML = `🎮 Games (${gamesCount})`;
      if (k === 'educational') btn.innerHTML = `📚 Educational (${eduCount})`;
      if (k === 'journal') btn.innerHTML = `📔 Diaries (${journalsCount})`;
      if (k === 'tool') btn.innerHTML = `🛠️ Tools (${toolsCount})`;
    });
  }

  // Setup UI listeners
  function setupEventListeners() {
    // Real-time as-you-type search input
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim().toLowerCase();
      clearSearchBtn.classList.toggle('hidden', searchTerm.length === 0);
      render();
    });

    // Clear search button
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchTerm = '';
      clearSearchBtn.classList.add('hidden');
      searchInput.focus();
      render();
    });

    // Reset filters button in empty state
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => {
        resetAllFilters();
      });
    }

    // Audience filter buttons (All, Kids & Family, Papino's Diaries, Dad's Tools)
    audienceBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const aud = btn.dataset.audience || 'all';
        window.setAudienceFilter(aud);
      });
    });

    // Kind filter buttons (All Kinds, Games, Educational, Tools)
    kindBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        kindBtns.forEach((b) => {
          b.classList.remove('active', 'bg-slate-800', 'text-white');
          b.classList.add('bg-white', 'text-slate-600');
        });
        btn.classList.add('active', 'bg-slate-800', 'text-white');
        btn.classList.remove('bg-white', 'text-slate-600');

        currentKind = btn.dataset.kind || 'all';
        render();
      });
    });

    // Global keyboard shortcuts: '/' to focus search, 'Esc' to clear/blur
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      } else if (e.key === 'Escape') {
        if (playModal && !playModal.classList.contains('hidden')) {
          closePlayModal();
        } else if (detailModal && !detailModal.classList.contains('hidden')) {
          closeModal();
        } else if (searchInput.value) {
          searchInput.value = '';
          searchTerm = '';
          clearSearchBtn.classList.add('hidden');
          render();
        } else {
          searchInput.blur();
        }
      }
    });

    // Modal close listeners
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (detailModal) {
      detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) closeModal();
      });
    }

    if (playModalCloseBtn) playModalCloseBtn.addEventListener('click', closePlayModal);
    if (playModal) {
      playModal.addEventListener('click', (e) => {
        if (e.target === playModal) closePlayModal();
      });
    }
  }

  function resetAllFilters() {
    searchTerm = '';
    currentAudience = 'all';
    currentKind = 'all';
    currentTag = null;
    currentSort = 'juicy';
    if (sortSelect) sortSelect.value = 'juicy';
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');

    audienceBtns.forEach((b) => {
      if (b.dataset.audience === 'all') {
        b.classList.add('active', 'bg-indigo-600', 'text-white', 'shadow-md');
        b.classList.remove('bg-white', 'text-slate-700');
      } else {
        b.classList.remove('active', 'bg-indigo-600', 'text-white', 'shadow-md');
        b.classList.add('bg-white', 'text-slate-700');
      }
    });

    kindBtns.forEach((b) => {
      if (b.dataset.kind === 'all') {
        b.classList.add('active', 'bg-slate-800', 'text-white');
        b.classList.remove('bg-white', 'text-slate-600');
      } else {
        b.classList.remove('active', 'bg-slate-800', 'text-white');
        b.classList.add('bg-white', 'text-slate-600');
      }
    });

    render();
    searchInput.focus();
  }

  // Filter & Search Logic with Tree Navigation
  function getFilteredGames() {
    return allGames.filter((item) => {
      // 0. Exclude archived & unplayable items (hidden from showcase!)
      if (item.archived || item.hidden) {
        return false;
      }

      // 1. Audience filter (Kids vs Tools)
      const itemAudience = item.audience || item.category;
      if (currentAudience !== 'all' && itemAudience !== currentAudience) {
        return false;
      }

      // 2. Kind / Subcategory filter (Game vs Educational vs Journal vs Tool)
      if (currentKind !== 'all') {
        if (currentKind === 'game') {
          if (item.kind !== 'game' && !item.is_game) return false;
        } else if (currentKind === 'educational') {
          if (item.kind !== 'educational' && !(item.tags || []).includes('educational')) return false;
        } else if (currentKind === 'journal') {
          if (item.kind !== 'journal' && itemAudience !== 'journals') return false;
        } else if (currentKind === 'tool') {
          if (item.kind !== 'tool' && itemAudience !== 'tools') return false;
        }
      }

      // 3. Tag filter
      if (currentTag) {
        const tagLower = currentTag.toLowerCase();
        const itemTags = (item.tags || []).map((t) => t.toLowerCase());
        const itemTech = (item.tech || []).map((t) => t.toLowerCase());
        const isPuffinFilter = ['supports_puffin_login', 'puffin-login', 'puffin-ring'].includes(tagLower);
        if (isPuffinFilter && item.supports_puffin_login === true) {
          // Matches supports_puffin_login boolean flag
        } else if (!itemTags.includes(tagLower) && !itemTech.includes(tagLower)) {
          return false;
        }
      }

      // 4. Search query matching
      if (searchTerm) {
        const idMatch = (item.id || '').toLowerCase().includes(searchTerm);
        const titleMatch = (item.title || '').toLowerCase().includes(searchTerm);
        const descMatch = (item.description || '').toLowerCase().includes(searchTerm);
        const taglineMatch = (item.tagline || '').toLowerCase().includes(searchTerm);
        const targetMatch = (item.target || '').toLowerCase().includes(searchTerm);
        const tagMatch = (item.tags || []).some((t) => t.toLowerCase().includes(searchTerm));
        const techMatch = (item.tech || []).some((t) => t.toLowerCase().includes(searchTerm));

        if (!idMatch && !titleMatch && !descMatch && !taglineMatch && !targetMatch && !tagMatch && !techMatch) {
          return false;
        }
      }

      return true;
    });
  }

  // Calculate Juicy Ranking Score (Base Score + Recency Bonus + Media/Playable Bonus - Penalties)
  function calculateJuicyScore(game) {
    const baseScore = typeof game.score === 'number' ? game.score : 50;
    let bonus = 0;

    // Recency bonus from created_at
    const d = (game.created_at || '').toLowerCase();
    if (d.includes('2026-08') || d.includes('2026-07')) {
      bonus += 16;
    } else if (d.includes('2026')) {
      bonus += 12;
    } else if (d.includes('2025')) {
      bonus += 8;
    } else if (d.includes('2024')) {
      bonus += 4;
    }

    // Playability & Media bonus
    if (game.can_embed) bonus += 7;
    if (game.youtube_id) bonus += 7;
    if (game.featured) bonus += 4;

    // Penalties for unplayable / offline
    if (game.archived) bonus -= 25;

    return baseScore + bonus;
  }

  function getSortedGames(games) {
    const copy = [...games];
    switch (currentSort) {
      case 'juicy':
        return copy.sort((a, b) => calculateJuicyScore(b) - calculateJuicyScore(a));
      case 'score':
        return copy.sort((a, b) => {
          const scoreA = typeof a.score === 'number' ? a.score : 50;
          const scoreB = typeof b.score === 'number' ? b.score : 50;
          return scoreB - scoreA;
        });
      case 'recency':
        return copy.sort((a, b) => {
          const dateA = a.created_at || '';
          const dateB = b.created_at || '';
          return dateB.localeCompare(dateA);
        });
      case 'name':
        return copy.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return copy;
    }
  }

  // Render cards
  function render() {
    const filtered = getFilteredGames();
    const sorted = getSortedGames(filtered);

    renderActiveFilterBadges();

    const totalCount = allGames.filter((g) => !g.archived && !g.hidden).length;
    countDisplay.innerHTML = `Showing <strong>${sorted.length}</strong> of ${totalCount} creations`;

    if (sorted.length === 0) {
      gamesGrid.innerHTML = '';
      emptyState.classList.remove('hidden');
      if (emptyQuerySpan) {
        emptyQuerySpan.textContent = searchTerm ? `"${searchTerm}"` : 'the active filters';
      }
      return;
    }

    emptyState.classList.add('hidden');

    gamesGrid.innerHTML = sorted
      .map((game) => {
        // Score Badge Calculation
        const score = typeof game.score === 'number' ? game.score : 50;
        let scoreBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
        let scoreIcon = '🎯';
        if (score >= 90) {
          scoreBadgeClass = 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 border-amber-300 shadow-xs font-bold';
          scoreIcon = '⭐';
        } else if (score >= 80) {
          scoreBadgeClass = 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-900 border-emerald-300 shadow-xs font-bold';
          scoreIcon = '🔥';
        } else if (score >= 70) {
          scoreBadgeClass = 'bg-indigo-50 text-indigo-800 border-indigo-200 font-semibold';
          scoreIcon = '✨';
        } else if (score < 50) {
          scoreBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200 font-medium';
          scoreIcon = '📦';
        }
        const scorePill = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border ${scoreBadgeClass}" title="Quality & Polish Score: ${score}/100">${scoreIcon} <strong>${score}</strong><span class="text-[10px] opacity-70">/100</span></span>`;

        // Precise Badge Distinction (Game vs Educational vs Tool)
        let typeBadge = '';
        if (game.audience === 'tools' || game.kind === 'tool' || game.category === 'tools') {
          typeBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">🛠️ Dad's Tool</span>`;
        } else if (game.id === 'orologiaio') {
          typeBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-900 border border-sky-200">⏰ Kids Edu-Game</span>`;
        } else if (game.kind === 'educational' || !game.is_game && (game.tags || []).includes('educational')) {
          typeBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-900 border border-purple-200">📚 Kids Educational</span>`;
        } else {
          typeBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200">🎮 Kids Game</span>`;
        }

        const statusBadge = game.badge
          ? `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${game.archived ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}">${game.badge}</span>`
          : '';

        const puffinRingBadge = game.supports_puffin_login
          ? `<a href="https://puffin-login-932724269481.europe-west1.run.app/ring.html" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();" class="pointer-events-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white border border-amber-300 shadow-sm hover:from-amber-400 hover:to-orange-400 transition" title="Member of the Puffin Login Ring (supports_puffin_login: true)">🔥💍 Puffin Ring</a>`
          : '';

        const itemHealth = healthReport && healthReport.items ? healthReport.items[game.id] : null;
        let sreAlertBadge = '';
        if (itemHealth) {
          if (itemHealth.overall === 'down') {
            sreAlertBadge = `<button onclick="window.openSreModal(); event.stopPropagation();" class="pointer-events-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-sm hover:bg-rose-700 transition" title="Endpoint Down! Click for SRE Status">🔴 Site Down</button>`;
          } else if (itemHealth.overall === 'ci_failing') {
            const runUrl = itemHealth.ci && itemHealth.ci.run_url ? itemHealth.ci.run_url : '#sre';
            sreAlertBadge = `<a href="${runUrl}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();" class="pointer-events-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 border border-amber-500 shadow-sm hover:bg-amber-300 transition" title="Latest GitHub Actions Run Failed: ${itemHealth.ci.workflow_name || 'CI'}">🟡 CI Failed</a>`;
          } else if (itemHealth.overall === 'degraded') {
            sreAlertBadge = `<button onclick="window.openSreModal(); event.stopPropagation();" class="pointer-events-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500 text-white shadow-sm hover:bg-orange-600 transition" title="Secondary Region Down! Click for SRE Status">🟠 Region Degraded</button>`;
          }
        }

        const targetPill = game.target
          ? `<span class="text-xs text-slate-500 font-medium">🎯 ${game.target}</span>`
          : '';

        // Action Buttons: Only "PLAY" in grande, and "codice" in piccolo on hover
        let playBtn = '';
        if (game.play_url && game.play_url.trim() !== '') {
          if (game.can_embed) {
            playBtn = `
              <button onclick="window.playGameInline('${game.id}')"
                 class="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold tracking-wide text-white bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-sm hover:shadow transition-all">
                <span>🎮 PLAY</span>
              </button>
            `;
          } else {
            playBtn = `
              <a href="${game.play_url}" target="_blank" rel="noopener noreferrer"
                 class="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold tracking-wide text-white bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-sm hover:shadow transition-all">
                <span>🎮 PLAY</span>
              </a>
            `;
          }
        } else if (game.youtube_url) {
          playBtn = `
            <a href="${game.youtube_url}" target="_blank" rel="noopener noreferrer"
               class="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold tracking-wide text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-sm hover:shadow transition-all">
              <span>🎬 WATCH DEMO</span>
            </a>
          `;
        } else if (game.issue_url) {
          playBtn = `
            <a href="${game.issue_url}" target="_blank" rel="noopener noreferrer"
               class="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold tracking-wide text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all">
              <span>🔧 FIX (Issue #1)</span>
            </a>
          `;
        } else {
          playBtn = `
            <a href="${game.repo_url}" target="_blank" rel="noopener noreferrer"
               class="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold tracking-wide text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all">
              <span>🚀 EXPLORE</span>
            </a>
          `;
        }

        const techHtml = (game.tech || [])
          .map(
            (t) =>
              `<button onclick="window.filterByTag('${t}')" class="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">${t}</button>`
          )
          .join('');

        const tagsHtml = (game.tags || [])
          .map(
            (tag) =>
              `<button onclick="window.filterByTag('${tag}')" class="tag-chip text-[11px] text-indigo-600 hover:text-indigo-800 font-medium">#${tag}</button>`
          )
          .join('');

        const imgClickAction = game.can_embed
          ? `onclick="window.playGameInline('${game.id}'); return false;"`
          : ``;
        const imgTargetUrl = game.play_url && game.play_url.trim() !== '' ? game.play_url : game.repo_url;

        const gifAttrs = game.screenshot_gif
          ? `onmouseenter="this.dataset.static=this.src; this.src='${game.screenshot_gif}';" onmouseleave="this.src=this.dataset.static;"`
          : ``;

        const ytAttr = game.youtube_id ? `data-youtube="${game.youtube_id}" id="yt-wrap-${game.id}"` : '';

        return `
          <article class="glass-card rounded-2xl overflow-hidden flex flex-col shadow-sm transition-all duration-300 group" data-id="${game.id}">
            <!-- Screenshot / Video Header with Hover Zoom and 2s Autoplay -->
            <div class="card-img-wrapper block h-44 sm:h-48 bg-slate-900/10 relative" ${ytAttr}>
              <a href="${imgTargetUrl}" ${imgClickAction} target="_blank" rel="noopener noreferrer" class="block w-full h-full">
                <img src="${game.screenshot}" ${gifAttrs} alt="${game.title}" class="w-full h-full object-cover object-center" loading="lazy" />
              </a>
              
              <!-- Top Badges (Category & Status) -->
              <div class="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10 pointer-events-none">
                ${typeBadge}
                ${statusBadge}
                ${puffinRingBadge}
                ${sreAlertBadge}
              </div>

              <!-- Play hover overlay -->
              ${game.play_url && game.play_url.trim() !== '' ? `
              <div class="play-overlay absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <div class="w-12 h-12 rounded-full bg-white/95 text-indigo-600 flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>` : ''}
            </div>

            <!-- Resting Content Area (Less is More: Title, Score, Subtitle, Large PLAY) -->
            <div class="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
              <div>
                <!-- Row 1: Title with Emoji + Score Badge -->
                <div class="flex items-start justify-between gap-2 mb-1">
                  <h3 class="font-fun text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight line-clamp-1">
                    <a href="${imgTargetUrl}" ${imgClickAction} class="hover:text-indigo-600">
                      ${game.title}
                    </a>
                  </h3>
                  <div class="flex-shrink-0">
                    ${scorePill}
                  </div>
                </div>

                <!-- Row 2: Subtitle / Tagline -->
                <p class="text-xs text-slate-500 font-medium line-clamp-1 mb-3">
                  ${game.tagline || ''}
                </p>
              </div>

              <!-- Row 3: Only "PLAY" in grande! -->
              <div>
                ${playBtn}
                ${game.regions && game.regions.length > 0 ? `
                  <div class="flex items-center justify-center flex-wrap gap-2 mt-2 text-[11px] text-slate-500 font-medium">
                    <span class="text-slate-400">Regions:</span>
                    ${game.regions.map(r => `
                      <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="hover:text-indigo-600 underline font-semibold transition-colors" title="${r.region || r.name}">
                        ${r.name}
                      </a>
                    `).join('<span class="text-slate-300">•</span>')}
                  </div>
                ` : ''}
              </div>

              <!-- Hover Drawer: Shows description, tags, and "codice" in piccolo -->
              <div class="card-hover-details max-h-0 opacity-0 overflow-hidden group-hover:max-h-96 group-hover:opacity-100 group-hover:mt-3 transition-all duration-300 ease-in-out border-t border-slate-100/80 group-hover:pt-2.5">
                <div class="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  ${targetPill}
                  <div class="flex items-center gap-1.5 font-medium">
                    ${game.created_at ? `<span>📅 ${game.created_at}</span>` : ''}
                    ${game.model_used ? `<span class="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">🤖 ${game.model_used}</span>` : ''}
                  </div>
                </div>

                <p class="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-2.5">
                  ${game.description || ''}
                </p>

                <!-- Tech stack -->
                <div class="flex flex-wrap items-center gap-1 mb-2">
                  ${techHtml}
                </div>

                <!-- Hashtags -->
                <div class="flex flex-wrap items-center gap-1.5 mb-2.5">
                  ${tagsHtml}
                </div>

                <!-- Available Regions (Multi-Cloud / Multi-Region) -->
                ${game.regions && game.regions.length > 0 ? `
                  <div class="mb-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <span>🌐 Available Regions:</span>
                    </div>
                    <div class="flex flex-wrap gap-1.5">
                      ${game.regions.map(r => `
                        <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-300 shadow-2xs transition-all">
                          <span>${r.name}</span>
                        </a>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}

                <!-- Links: Article & Codice -->
                <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    ${game.article_url ? `
                      <a href="${game.article_url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold transition-colors">
                        <span>📰 read article</span>
                      </a>
                    ` : '<span class="text-[11px] text-slate-400">Open source</span>'}
                  </div>
                  ${game.repo_url ? `
                    <a href="${game.repo_url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 font-semibold transition-colors">
                      <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                      <span>codice</span>
                    </a>
                  ` : ''}
                </div>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    // Auto-start YouTube videos after 2 seconds (no audio by default, loop & controls enabled)
    if (window._youtubeTimer) clearTimeout(window._youtubeTimer);
    window._youtubeTimer = setTimeout(() => {
      document.querySelectorAll('[data-youtube]').forEach((container) => {
        const ytid = container.dataset.youtube;
        if (!ytid) return;
        container.innerHTML = `
          <div class="relative w-full h-full bg-black">
            <iframe
              class="w-full h-full border-0 absolute inset-0 z-20"
              src="https://www.youtube-nocookie.com/embed/${ytid}?autoplay=1&mute=1&loop=1&playlist=${ytid}&controls=1&modestbranding=1"
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen>
            </iframe>
          </div>
        `;
      });
    }, 2000);
  }

  function renderActiveFilterBadges() {
    if (!activeFiltersContainer) return;
    let badges = [];

    if (currentAudience !== 'all') {
      const label = currentAudience === 'kids' ? '🧸 Kids & Family' : "🛠️ Dad's Tools";
      badges.push(`
        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          Audience: ${label}
          <button onclick="window.setAudienceFilter('all')" class="hover:text-indigo-900 ml-1 font-bold">×</button>
        </span>
      `);
    }

    if (currentKind !== 'all') {
      const kindLabels = {
        game: '🎮 Games',
        educational: '📚 Educational',
        tool: '🛠️ Tools'
      };
      badges.push(`
        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
          Type: ${kindLabels[currentKind] || currentKind}
          <button onclick="window.setKindFilter('all')" class="hover:text-emerald-900 ml-1 font-bold">×</button>
        </span>
      `);
    }

    if (currentTag) {
      badges.push(`
        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
          Tag: #${currentTag}
          <button onclick="window.clearCurrentTag()" class="hover:text-violet-900 ml-1 font-bold">×</button>
        </span>
      `);
    }

    if (searchTerm) {
      badges.push(`
        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-800">
          Search: "${searchTerm}"
          <button onclick="window.clearSearchQuery()" class="hover:text-slate-900 ml-1 font-bold">×</button>
        </span>
      `);
    }

    if (currentSort !== 'juicy') {
      const sortLabels = {
        score: '🏆 Top Score',
        recency: '📅 Newest First',
        name: '🔤 Alphabetical'
      };
      badges.push(`
        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-900">
          Sort: ${sortLabels[currentSort] || currentSort}
          <button onclick="window.setSort('juicy')" class="hover:text-amber-950 ml-1 font-bold">×</button>
        </span>
      `);
    }

    activeFiltersContainer.innerHTML = badges.join('');
  }

  // Play game inline in an arcade iframe modal
  window.playGameInline = function (gameId) {
    const game = allGames.find((g) => g.id === gameId);
    if (!game || !game.play_url || !playModal || !playModalIframe) return;

    playModalTitle.textContent = game.title;
    playModalIframe.src = game.play_url;
    if (playModalExternalLink) {
      playModalExternalLink.href = game.play_url;
    }

    playModal.classList.remove('hidden');
    playModal.classList.add('flex');
  };

  function closePlayModal() {
    if (!playModal || !playModalIframe) return;
    playModalIframe.src = 'about:blank';
    playModal.classList.add('hidden');
    playModal.classList.remove('flex');
  }

  window.filterByTag = function (tag) {
    currentTag = tag;
    render();
  };

  window.clearCurrentTag = function () {
    currentTag = null;
    render();
  };

  window.clearSearchQuery = function () {
    searchTerm = '';
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    render();
    searchInput.focus();
  };

  window.setAudienceFilter = function (aud) {
    currentAudience = aud;
    if (history.replaceState && aud !== 'all') {
      history.replaceState(null, '', '#' + (aud === 'kids' ? 'kids' : aud));
    } else if (history.replaceState && aud === 'all') {
      history.replaceState(null, '', window.location.pathname);
    }
    audienceBtns.forEach((b) => {
      if (b.dataset.audience === aud) {
        b.classList.add('active', 'bg-indigo-600', 'text-white', 'shadow-md');
        b.classList.remove('bg-white', 'text-slate-700');
      } else {
        b.classList.remove('active', 'bg-indigo-600', 'text-white', 'shadow-md');
        b.classList.add('bg-white', 'text-slate-700');
      }
    });
    render();
  };
  window.filterByAudience = window.setAudienceFilter;

  window.setKindFilter = function (kind) {
    currentKind = kind;
    kindBtns.forEach((b) => {
      if (b.dataset.kind === kind) {
        b.classList.add('active', 'bg-slate-800', 'text-white');
        b.classList.remove('bg-white', 'text-slate-600');
      } else {
        b.classList.remove('active', 'bg-slate-800', 'text-white');
        b.classList.add('bg-white', 'text-slate-600');
      }
    });
    render();
  };
  window.filterByKind = window.setKindFilter;

  window.setSort = function (sortType) {
    currentSort = sortType;
    if (sortSelect && sortSelect.value !== sortType) {
      sortSelect.value = sortType;
    }
    render();
  };

  window.openGameDetails = function (gameId) {
    const game = allGames.find((g) => g.id === gameId);
    if (!game || !detailModal || !modalBody) return;

    const score = typeof game.score === 'number' ? game.score : 50;
    let scoreBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
    let scoreIcon = '🎯';
    if (score >= 90) {
      scoreBadgeClass = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      scoreIcon = '⭐';
    } else if (score >= 80) {
      scoreBadgeClass = 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
      scoreIcon = '🔥';
    } else if (score >= 70) {
      scoreBadgeClass = 'bg-indigo-100 text-indigo-900 border-indigo-200 font-semibold';
      scoreIcon = '✨';
    } else if (score < 50) {
      scoreBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200 font-medium';
      scoreIcon = '📦';
    }
    const modalScorePill = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${scoreBadgeClass}">${scoreIcon} Score: <strong>${score}</strong>/100</span>`;

    let modalTypeBadge = '';
    if (game.audience === 'tools' || game.kind === 'tool') {
      modalTypeBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">🛠️ Dad's Tool</span>`;
    } else if (game.kind === 'educational') {
      modalTypeBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-900">📚 Kids Educational</span>`;
    } else {
      modalTypeBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900">🎮 Kids Game</span>`;
    }

    modalBody.innerHTML = `
      <div class="space-y-4">
        <div class="rounded-xl overflow-hidden max-h-72 border border-slate-200">
          <img src="${game.screenshot}" alt="${game.title}" class="w-full h-full object-cover">
        </div>
        <div class="flex items-center gap-2">
          ${modalScorePill}
          ${modalTypeBadge}
          ${game.badge ? `<span class="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">${game.badge}</span>` : ''}
          ${game.target ? `<span class="text-xs text-slate-500">🎯 ${game.target}</span>` : ''}
        </div>
        <h2 class="font-fun text-2xl font-bold text-slate-900">${game.title}</h2>
        <p class="text-sm font-medium text-indigo-600">${game.tagline || ''}</p>
        <p class="text-sm text-slate-700 leading-relaxed">${game.description || ''}</p>
        
        <div class="pt-3 border-t border-slate-200">
          <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Technology Stack & Tags</h4>
          <div class="flex flex-wrap gap-1.5 mb-2">
            ${(game.tech || []).map((t) => `<span class="px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-md font-medium">${t}</span>`).join('')}
          </div>
          <div class="flex flex-wrap gap-2 text-xs text-indigo-600 font-medium">
            ${(game.tags || []).map((t) => `#${t}`).join(' ')}
          </div>
        </div>

        <div class="flex items-center gap-3 pt-4 border-t border-slate-200">
          ${game.archived ? `<a href="${game.repo_url}" target="_blank" class="flex-1 text-center py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition">📦 View Archived Code (Unplayable)</a>` : ''}
          ${game.can_embed ? `<button onclick="window.closeModal(); window.playGameInline('${game.id}')" class="flex-1 text-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition">🕹️ Play Here (Fullscreen)</button>` : ''}
          ${game.play_url ? `<a href="${game.play_url}" target="_blank" class="text-center py-2.5 px-4 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition">Open Tab</a>` : ''}
          ${game.article_url ? `<a href="${game.article_url}" target="_blank" class="text-center py-2.5 px-4 rounded-xl text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition">📰 Read Article</a>` : ''}
          ${game.issue_url ? `<a href="${game.issue_url}" target="_blank" class="text-center py-2.5 px-4 rounded-xl text-sm font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition">🔧 View Issue #1</a>` : ''}
          ${game.repo_url && !game.archived ? `<a href="${game.repo_url}" target="_blank" class="text-center py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition">📂 GitHub</a>` : ''}
        </div>
      </div>
    `;

    detailModal.classList.remove('hidden');
    detailModal.classList.add('flex');
  };

  window.openSreModal = function () {
    if (!detailModal || !modalBody) return;
    if (history.replaceState) {
      history.replaceState(null, '', '#sre');
    }

    if (!healthReport || !healthReport.items) {
      modalBody.innerHTML = `<div class="p-6 text-center text-slate-600">No SRE health telemetry loaded yet. Run <code>python3 bin/check_health.py</code>.</div>`;
      detailModal.classList.remove('hidden');
      detailModal.classList.add('flex');
      return;
    }

    const s = healthReport.summary || {};
    const itemsList = Object.values(healthReport.items);
    const severityOrder = { down: 0, ci_failing: 1, degraded: 2, healthy: 3, archived: 4 };
    itemsList.sort((a, b) => (severityOrder[a.overall] ?? 9) - (severityOrder[b.overall] ?? 9));

    const rowsHtml = itemsList
      .map((r) => {
        let statusBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900">🟢 Healthy</span>`;
        if (r.overall === 'down') {
          statusBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">🔴 Site Down</span>`;
        } else if (r.overall === 'ci_failing') {
          statusBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">🟡 CI Broken</span>`;
        } else if (r.overall === 'degraded') {
          statusBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-900 border border-orange-300">🟠 Degraded</span>`;
        } else if (r.overall === 'archived') {
          statusBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">📦 Archived</span>`;
        }

        const w = r.web || {};
        let webCell = `<span class="text-slate-400 text-xs">— (CLI/Tool)</span>`;
        if (w.status === 'up') {
          webCell = `<a href="${r.play_url}" target="_blank" class="text-xs font-semibold text-emerald-700 hover:underline">200 OK (${w.latency_ms}ms)</a>`;
        } else if (w.status === 'protected') {
          webCell = `<a href="${r.play_url}" target="_blank" class="text-xs font-semibold text-indigo-700 hover:underline">🔒 ZeroTrust (${w.latency_ms}ms)</a>`;
        } else if (w.status === 'archived') {
          webCell = `<span class="text-xs text-slate-400">📦 Archived</span>`;
        } else if (w.status === 'down') {
          webCell = `<a href="${r.play_url}" target="_blank" class="text-xs font-bold text-rose-600 hover:underline">❌ ${w.http_code || 'ERR'} (${w.note || 'Down'})</a>`;
        }

        if (r.regions && r.regions.length > 0) {
          const regPills = r.regions
            .map((reg) => {
              const ok = reg.status === 'up';
              return `<a href="${reg.url}" target="_blank" class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-300'}" title="${reg.note || ''}">${ok ? '🟢' : '🔴'} ${reg.name}</a>`;
            })
            .join(' ');
          webCell += `<div class="mt-1 flex flex-wrap gap-1">${regPills}</div>`;
        }

        const ci = r.ci || {};
        let ciCell = `<span class="text-xs text-slate-400">⚪ No workflows</span>`;
        if (ci.status === 'passing') {
          ciCell = `<a href="${ci.run_url}" target="_blank" class="text-xs font-medium text-emerald-700 hover:underline">✅ ${ci.workflow_name || 'CI'} <span class="text-slate-400">(${(ci.updated_at || '').slice(0, 10)})</span></a>`;
        } else if (ci.status === 'failing') {
          ciCell = `<a href="${ci.run_url}" target="_blank" class="text-xs font-bold text-rose-600 hover:underline">❌ FAIL: ${ci.workflow_name || 'CI'} (${(ci.updated_at || '').slice(0, 10)}) ↗</a>`;
        } else if (ci.status === 'gitlab') {
          ciCell = `<a href="${r.repo_url}" target="_blank" class="text-xs font-medium text-orange-700 hover:underline">🦊 GitLab Repo</a>`;
        } else if (ci.status === 'none') {
          ciCell = `<span class="text-xs text-slate-400">—</span>`;
        }

        return `
          <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition">
            <td class="py-2.5 px-2 whitespace-nowrap">${statusBadge}</td>
            <td class="py-2.5 px-2">
              <div class="font-bold text-xs sm:text-sm text-slate-900">${r.title}</div>
              <div class="text-[11px] text-slate-400 font-mono">${r.id}</div>
            </td>
            <td class="py-2.5 px-2">${webCell}</td>
            <td class="py-2.5 px-2">${ciCell}</td>
          </tr>
        `;
      })
      .join('');

    modalBody.innerHTML = `
      <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2 pr-8">
          <div>
            <h2 class="font-fun text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span>🩺 Vetrina SRE Health & CI/CD Monitor</span>
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Deterministic probe across all ${healthReport.total} Vetrina apps • Last checked: <code class="font-mono text-indigo-600">${healthReport.checked_at}</code> (${healthReport.duration_sec}s)
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900">🟢 ${s.healthy || 0} Healthy</span>
            <span class="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900">🟡 ${s.ci_failing || 0} CI Broken</span>
            <span class="px-2.5 py-1 rounded-full bg-orange-100 text-orange-900">🟠 ${s.degraded || 0} Degraded</span>
            <span class="px-2.5 py-1 rounded-full bg-rose-100 text-rose-900">🔴 ${s.down || 0} Down</span>
          </div>
        </div>

        <div class="overflow-x-auto rounded-2xl border border-slate-200 max-h-[62vh] overflow-y-auto">
          <table class="w-full text-left border-collapse">
            <thead class="bg-slate-100/90 sticky top-0 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th class="py-2.5 px-2">Status</th>
                <th class="py-2.5 px-2">App</th>
                <th class="py-2.5 px-2">Live Endpoint</th>
                <th class="py-2.5 px-2">GitHub Actions CI/CD</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <div class="text-[11px] text-slate-500 flex items-center justify-between pt-1">
          <span>Run locally anytime: <code class="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-indigo-700">just health</code> or <code class="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-indigo-700">python3 bin/check_health.py</code></span>
          <a href="https://github.com/palladius/vetrina/actions" target="_blank" class="text-indigo-600 hover:underline font-semibold">View Vetrina Cron Runs ↗</a>
        </div>
      </div>
    `;

    detailModal.classList.remove('hidden');
    detailModal.classList.add('flex');
  };

  window.closeModal = closeModal;

  function closeModal() {
    if (!detailModal) return;
    detailModal.classList.add('hidden');
    detailModal.classList.remove('flex');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
