// ==============================================================================
// 🎠 Palladius Showcase: Interactive Showcase App
// Tree Classification: Audience (All, Kids, Tools) -> Kind (Game, Educational, Tool)
// ==============================================================================

(function () {
  'use strict';

  // State
  let allGames = [];
  let currentAudience = 'all'; // 'all', 'kids', 'tools'
  let currentKind = 'all';     // 'all', 'game', 'educational', 'tool'
  let currentTag = null;
  let searchTerm = '';

  // DOM Elements
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const gamesGrid = document.getElementById('games-grid');
  const emptyState = document.getElementById('empty-state');
  const emptyQuerySpan = document.getElementById('empty-query');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  const countDisplay = document.getElementById('count-display');
  const audienceBtns = document.querySelectorAll('.audience-filter-btn');
  const kindBtns = document.querySelectorAll('.kind-filter-btn');
  const activeFiltersContainer = document.getElementById('active-filters');

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
    await loadGamesData();
    if (searchInput) {
      searchInput.focus();
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
    render();
  }

  function updateDynamicCountLabels() {
    const totalCount = allGames.length;
    const kidsCount = allGames.filter((g) => g.audience === 'kids' || g.category === 'kids').length;
    const toolsCount = allGames.filter((g) => g.audience === 'tools' || g.category === 'tools').length;

    audienceBtns.forEach((btn) => {
      const aud = btn.dataset.audience;
      if (aud === 'all') btn.textContent = `🌟 All (${totalCount})`;
      if (aud === 'kids') btn.textContent = `🧸 Kids & Family (${kidsCount})`;
      if (aud === 'tools') btn.textContent = `🛠️ Dad's Tools (${toolsCount})`;
    });

    const gamesCount = allGames.filter((g) => g.kind === 'game' || g.is_game).length;
    const eduCount = allGames.filter((g) => g.kind === 'educational' || (g.tags || []).includes('educational')).length;

    kindBtns.forEach((btn) => {
      const k = btn.dataset.kind;
      if (k === 'game') btn.innerHTML = `🎮 Games (${gamesCount})`;
      if (k === 'educational') btn.innerHTML = `📚 Educational (${eduCount})`;
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

    // Audience filter buttons (All, Kids & Family, Dad's Tools)
    audienceBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        audienceBtns.forEach((b) => {
          b.classList.remove('active', 'bg-indigo-600', 'text-white', 'shadow-md');
          b.classList.add('bg-white', 'text-slate-700');
        });
        btn.classList.add('active', 'bg-indigo-600', 'text-white', 'shadow-md');
        btn.classList.remove('bg-white', 'text-slate-700');

        currentAudience = btn.dataset.audience || 'all';
        render();
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
      // 1. Audience filter (Kids vs Tools)
      const itemAudience = item.audience || item.category;
      if (currentAudience !== 'all' && itemAudience !== currentAudience) {
        return false;
      }

      // 2. Kind / Subcategory filter (Game vs Educational vs Tool)
      if (currentKind !== 'all') {
        if (currentKind === 'game') {
          if (item.kind !== 'game' && !item.is_game) return false;
        } else if (currentKind === 'educational') {
          if (item.kind !== 'educational' && !(item.tags || []).includes('educational')) return false;
        } else if (currentKind === 'tool') {
          if (item.kind !== 'tool' && itemAudience !== 'tools') return false;
        }
      }

      // 3. Tag filter
      if (currentTag) {
        const itemTags = (item.tags || []).map((t) => t.toLowerCase());
        const itemTech = (item.tech || []).map((t) => t.toLowerCase());
        if (!itemTags.includes(currentTag.toLowerCase()) && !itemTech.includes(currentTag.toLowerCase())) {
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

  // Render cards
  function render() {
    const filtered = getFilteredGames();

    renderActiveFilterBadges();

    const totalCount = allGames.length;
    countDisplay.innerHTML = `Showing <strong>${filtered.length}</strong> of ${totalCount} creations`;

    if (filtered.length === 0) {
      gamesGrid.innerHTML = '';
      emptyState.classList.remove('hidden');
      if (emptyQuerySpan) {
        emptyQuerySpan.textContent = searchTerm ? `"${searchTerm}"` : 'the active filters';
      }
      return;
    }

    emptyState.classList.add('hidden');

    gamesGrid.innerHTML = filtered
      .map((game) => {
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
          ? `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">${game.badge}</span>`
          : '';

        const targetPill = game.target
          ? `<span class="text-xs text-slate-500 font-medium">🎯 ${game.target}</span>`
          : '';

        // Action Buttons
        let playBtn = '';
        if (game.play_url && game.play_url.trim() !== '') {
          if (game.can_embed) {
            playBtn = `
              <button onclick="window.playGameInline('${game.id}')"
                 class="inline-flex items-center justify-center gap-1.5 flex-1 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-sm hover:shadow-md transition-all">
                <span>🕹️ Play Here</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </button>
              <a href="${game.play_url}" target="_blank" rel="noopener noreferrer" title="Open in new tab"
                 class="p-2.5 rounded-xl text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
              </a>
            `;
          } else {
            playBtn = `
              <a href="${game.play_url}" target="_blank" rel="noopener noreferrer"
                 class="inline-flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-sm hover:shadow-md transition-all">
                <span>🎮 Play Now</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
              </a>
            `;
          }
        } else if (game.youtube_url) {
          playBtn = `
            <a href="${game.youtube_url}" target="_blank" rel="noopener noreferrer"
               class="inline-flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-sm hover:shadow-md transition-all">
              <span>🎬 Watch Demo</span>
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
            </a>
          `;
        } else if (game.issue_url) {
          playBtn = `
            <a href="${game.issue_url}" target="_blank" rel="noopener noreferrer"
               class="inline-flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all">
              <span>🔧 Fix / Revive (Issue #1)</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            </a>
          `;
        } else {
          playBtn = `
            <a href="${game.repo_url}" target="_blank" rel="noopener noreferrer"
               class="inline-flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all">
              <span>🚀 Explore Project</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </a>
          `;
        }

        const repoBtn = game.repo_url
          ? `
            <a href="${game.repo_url}" target="_blank" rel="noopener noreferrer" title="View Source Code on GitHub"
               class="inline-flex items-center justify-center p-2.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
            </a>
          `
          : '';

        const techHtml = (game.tech || [])
          .map(
            (t) =>
              `<button onclick="window.filterByTag('${t}')" class="px-2 py-0.5 text-xs font-medium rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">${t}</button>`
          )
          .join('');

        const tagsHtml = (game.tags || [])
          .map(
            (tag) =>
              `<button onclick="window.filterByTag('${tag}')" class="tag-chip text-xs text-indigo-600 hover:text-indigo-800 font-medium">#${tag}</button>`
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
          <article class="glass-card rounded-2xl overflow-hidden flex flex-col shadow-sm" data-id="${game.id}">
            <!-- Screenshot / Video Header with Hover Zoom and 2s Autoplay -->
            <div class="card-img-wrapper block h-56 bg-slate-900/10 relative group" ${ytAttr}>
              <a href="${imgTargetUrl}" ${imgClickAction} target="_blank" rel="noopener noreferrer" class="block w-full h-full">
                <img src="${game.screenshot}" ${gifAttrs} alt="${game.title}" class="w-full h-full object-cover object-center" loading="lazy" />
              </a>
              
              <!-- Top Badges with Clear Game vs Edu Distinction -->
              <div class="absolute top-3 left-3 flex flex-wrap gap-2 z-10 pointer-events-none">
                ${typeBadge}
                ${statusBadge}
              </div>

              <!-- Play hover overlay -->
              <div class="play-overlay absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <div class="w-14 h-14 rounded-full bg-white/95 text-indigo-600 flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform">
                  <svg class="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
            </div>

            <!-- Content Area -->
            <div class="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between gap-2 mb-2">
                  ${targetPill}
                  ${(game.created_at || game.model_used)
                    ? `<div class="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                         ${game.created_at ? `<span>📅 ${game.created_at}</span>` : ''}
                         ${game.model_used ? `<span class="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">🤖 ${game.model_used}</span>` : ''}
                       </div>`
                    : ''}
                </div>

                <h3 class="font-fun text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                  <a href="${imgTargetUrl}" ${imgClickAction} class="hover:text-indigo-600">
                    ${game.title}
                  </a>
                </h3>

                <p class="text-sm font-medium text-indigo-600 mt-1 mb-2">
                  ${game.tagline || ''}
                </p>

                <p class="text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4">
                  ${game.description || ''}
                </p>
              </div>

              <div>
                <!-- Tech & Tags -->
                <div class="flex flex-wrap items-center gap-1.5 mb-2">
                  ${techHtml}
                </div>
                <div class="flex flex-wrap items-center gap-2 mb-4 pt-1">
                  ${tagsHtml}
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center gap-2 pt-3 border-t border-slate-100">
                  ${playBtn}
                  ${repoBtn}
                  <button onclick="window.openGameDetails('${game.id}')" title="Details & Info" class="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </button>
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

  window.openGameDetails = function (gameId) {
    const game = allGames.find((g) => g.id === gameId);
    if (!game || !detailModal || !modalBody) return;

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
          ${game.can_embed ? `<button onclick="window.closeModal(); window.playGameInline('${game.id}')" class="flex-1 text-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition">🕹️ Play Here (Fullscreen)</button>` : ''}
          ${game.play_url ? `<a href="${game.play_url}" target="_blank" class="text-center py-2.5 px-4 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition">Open Tab</a>` : ''}
          ${game.issue_url ? `<a href="${game.issue_url}" target="_blank" class="text-center py-2.5 px-4 rounded-xl text-sm font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition">🔧 View Issue #1</a>` : ''}
          ${game.repo_url ? `<a href="${game.repo_url}" target="_blank" class="text-center py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition">📂 GitHub</a>` : ''}
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
