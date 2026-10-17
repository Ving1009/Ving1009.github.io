(function () {
  "use strict";

  var STORAGE_KEYS = {
    progress: "vhub_progress_v2",
    favorites: "vhub_favorites_v2",
    history: "vhub_history_v2",
    settings: "vhub_settings_v2",
    imported: "vhub_imported_movies_v2",
    ratings: "vhub_ratings_v2",
    comments: "vhub_comments_v2"
  };

  var LEGACY_KEYS = {
    progress: "tv_movie_hub_progress",
    favorites: "tv_movie_hub_favorites",
    settings: "tv_movie_hub_settings"
  };

  var NAV_ITEMS = [
    { id: "all", label: "Tất cả", eyebrow: "Library" },
    { id: "new", label: "Mới cập nhật", eyebrow: "Fresh drops" },
    { id: "trending", label: "Top Trending", eyebrow: "Hot right now" },
    { id: "movie", label: "Phim lẻ", eyebrow: "Feature films" },
    { id: "series", label: "Phim bộ", eyebrow: "Series" },
    { id: "animation", label: "Hoạt hình", eyebrow: "Animation" },
    { id: "favorites", label: "Yêu thích", eyebrow: "Your picks" },
    { id: "continue", label: "Đang xem", eyebrow: "Resume" }
  ];

  var CATEGORY_TO_NAME = {
    movie: "Phim lẻ",
    series: "Phim bộ",
    animation: "Hoạt hình"
  };

  var EPISODE_PAGE_SIZE = 48;
  var state = {
    detailPage: 0,
    playerPage: 0,
    playerBrowseSeasonIndex: 0,
    baseMovies: [],
    importedMovies: loadJson(STORAGE_KEYS.imported, []),
    movies: [],
    activeCategory: "all",
    activeMovieId: null,
    activeSeasonIndex: 0,
    activeEpisodeIndex: 0,
    activeSmartResult: null,
    smartSearchBusy: false,
    hls: null,
    playerSession: null,
    embedAutoNextTimer: null,
    progressTimer: null,
    playerControlsTimer: null,
    lastFocused: null,
    progress: loadJsonWithLegacy(STORAGE_KEYS.progress, LEGACY_KEYS.progress, {}),
    favorites: loadJsonWithLegacy(STORAGE_KEYS.favorites, LEGACY_KEYS.favorites, []),
    history: loadJson(STORAGE_KEYS.history, []),
    settings: Object.assign({
      autoplay: true,
      theme: "netflix",
      embedAutoNext: false
    }, loadJsonWithLegacy(STORAGE_KEYS.settings, LEGACY_KEYS.settings, {})),
    ratings: loadJson(STORAGE_KEYS.ratings, {}),
    comments: loadJson(STORAGE_KEYS.comments, {})
  };

  var els = {
    appShell: document.getElementById("appShell"),
    homeButton: document.getElementById("homeButton"),
    navList: document.getElementById("navList"),
    randomButton: document.getElementById("randomButton"),
    assistantButton: document.getElementById("assistantButton"),
    adminButton: document.getElementById("adminButton"),
    historyButton: document.getElementById("historyButton"),
    themeButton: document.getElementById("themeButton"),
    pageTitle: document.getElementById("pageTitle"),
    searchForm: document.getElementById("searchForm"),
    searchInput: document.getElementById("searchInput"),
    smartSearchButton: document.getElementById("smartSearchButton"),
    heroSection: document.getElementById("heroSection"),
    genreFilter: document.getElementById("genreFilter"),
    yearFilter: document.getElementById("yearFilter"),
    countryFilter: document.getElementById("countryFilter"),
    statusFilter: document.getElementById("statusFilter"),
    episodeFilter: document.getElementById("episodeFilter"),
    sortFilter: document.getElementById("sortFilter"),
    continueShelf: document.getElementById("continueShelf"),
    continueRow: document.getElementById("continueRow"),
    recommendedRow: document.getElementById("recommendedRow"),
    gridEyebrow: document.getElementById("gridEyebrow"),
    gridTitle: document.getElementById("gridTitle"),
    resultCount: document.getElementById("resultCount"),
    movieGrid: document.getElementById("movieGrid"),
    clearHistoryButton: document.getElementById("clearHistoryButton"),
    detailView: document.getElementById("detailView"),
    detailBackdrop: document.getElementById("detailBackdrop"),
    detailPoster: document.getElementById("detailPoster"),
    detailCategory: document.getElementById("detailCategory"),
    detailTitle: document.getElementById("detailTitle"),
    detailOriginalTitle: document.getElementById("detailOriginalTitle"),
    detailDescription: document.getElementById("detailDescription"),
    detailMeta: document.getElementById("detailMeta"),
    closeDetailButton: document.getElementById("closeDetailButton"),
    playButton: document.getElementById("playButton"),
    favoriteButton: document.getElementById("favoriteButton"),
    shareButton: document.getElementById("shareButton"),
    clearMovieProgressButton: document.getElementById("clearMovieProgressButton"),
    ratingBox: document.getElementById("ratingBox"),
    seasonTabs: document.getElementById("seasonTabs"),
    episodeGrid: document.getElementById("episodeGrid"),
    detailPagePrev: document.getElementById("detailPagePrev"),
    detailPageNext: document.getElementById("detailPageNext"),
    detailEpisodeRange: document.getElementById("detailEpisodeRange"),
    commentForm: document.getElementById("commentForm"),
    commentInput: document.getElementById("commentInput"),
    commentList: document.getElementById("commentList"),
    relatedRow: document.getElementById("relatedRow"),
    playerView: document.getElementById("playerView"),
    playerCloseButton: document.getElementById("playerCloseButton"),
    playerFullscreenButton: document.getElementById("playerFullscreenButton"),
    playerEmbedButton: document.getElementById("playerEmbedButton"),
    playerFrame: document.getElementById("playerFrame"),
    videoPlayer: document.getElementById("videoPlayer"),
    iframePlayer: document.getElementById("iframePlayer"),
    playerKicker: document.getElementById("playerKicker"),
    playerTitle: document.getElementById("playerTitle"),
    playerMeta: document.getElementById("playerMeta"),
    playerPrevButton: document.getElementById("playerPrevButton"),
    playerNextButton: document.getElementById("playerNextButton"),
    playerDetailButton: document.getElementById("playerDetailButton"),
    playerEpisodeCount: document.getElementById("playerEpisodeCount"),
    playerEpisodeList: document.getElementById("playerEpisodeList"),
    playerSeasonSelect: document.getElementById("playerSeasonSelect"),
    playerPagePrev: document.getElementById("playerPagePrev"),
    playerPageNext: document.getElementById("playerPageNext"),
    playerEpisodeRange: document.getElementById("playerEpisodeRange"),
    assistantPanel: document.getElementById("assistantPanel"),
    closeAssistantButton: document.getElementById("closeAssistantButton"),
    groqKeyInput: document.getElementById("groqKeyInput"),
    quickPrompts: document.getElementById("quickPrompts"),
    chatLog: document.getElementById("chatLog"),
    chatForm: document.getElementById("chatForm"),
    chatInput: document.getElementById("chatInput"),
    adminPanel: document.getElementById("adminPanel"),
    closeAdminButton: document.getElementById("closeAdminButton"),
    movieForm: document.getElementById("movieForm"),
    exportMoviesButton: document.getElementById("exportMoviesButton"),
    clearImportedButton: document.getElementById("clearImportedButton"),
    jsonImportInput: document.getElementById("jsonImportInput"),
    importJsonButton: document.getElementById("importJsonButton"),
    importResult: document.getElementById("importResult"),
    historyPanel: document.getElementById("historyPanel"),
    closeHistoryButton: document.getElementById("closeHistoryButton"),
    historyList: document.getElementById("historyList"),
    finishedModal: document.getElementById("finishedModal"),
    replayButton: document.getElementById("replayButton"),
    showRecommendationsButton: document.getElementById("showRecommendationsButton"),
    closeFinishedButton: document.getElementById("closeFinishedButton"),
    toast: document.getElementById("toast"),
    structuredData: document.getElementById("structuredData")
  };

  var keyGuard = {
    key: "",
    time: 0,
    down: {}
  };

  init();

  function init() {
    state.baseMovies = normalizeMovies(window.MOVIE_DATA || [], "base");
    rebuildMovieList();
    applyTheme();
    bindEvents();
    renderFilterOptions();
    renderQuickPrompts();
    renderAll();
    applyRouteFromUrl(false);
    // Không bật Service Worker; tránh TV giữ bản player/phim cũ.
    focusElement(els.homeButton);
  }

  function rebuildMovieList() {
    var imported = normalizeMovies(state.importedMovies || [], "imported");
    var byId = {};
    var merged = [];

    state.baseMovies.concat(imported).forEach(function (movie) {
      var id = movie.id;
      if (!byId[id]) {
        byId[id] = true;
        merged.push(movie);
        return;
      }

      var copy = Object.assign({}, movie, { id: uniqueSlug(movie.id, byId) });
      byId[copy.id] = true;
      merged.push(copy);
    });

    state.movies = merged;
  }

  function bindEvents() {
    els.homeButton.addEventListener("click", function () {
      state.activeCategory = "all";
      state.activeSmartResult = null;
      els.searchInput.value = "";
      renderAll();
      replaceRoute();
      focusElement(els.movieGrid.querySelector("[data-focusable]") || els.searchInput);
    });

    els.navList.addEventListener("click", function (event) {
      var button = event.target.closest("[data-category-id]");
      if (!button) {
        return;
      }
      state.activeCategory = button.dataset.categoryId;
      state.activeSmartResult = null;
      renderAll();
      replaceRoute();
      focusElement(els.navList.querySelector('[data-category-id="' + state.activeCategory + '"]'));
    });

    els.navList.addEventListener("change", function (event) {
      var select = event.target.closest("[data-category-select]");
      if (!select) {
        return;
      }
      state.activeCategory = select.value;
      state.activeSmartResult = null;
      renderAll();
      replaceRoute();
      focusElement(els.movieGrid.querySelector("[data-focusable]") || els.searchInput);
    });

    els.randomButton.addEventListener("click", playRandomMovie);
    els.assistantButton.addEventListener("click", openAssistant);
    els.adminButton.addEventListener("click", openAdmin);
    els.historyButton.addEventListener("click", openHistoryPanel);
    els.themeButton.addEventListener("click", toggleTheme);

    els.searchInput.addEventListener("input", debounce(function () {
      state.activeSmartResult = null;
      renderHome();
    }, 180));

    els.searchForm.addEventListener("submit", function (event) {
      event.preventDefault();
      runSmartSearch();
    });

    [els.genreFilter, els.yearFilter, els.countryFilter, els.statusFilter, els.episodeFilter, els.sortFilter].forEach(function (element) {
      element.addEventListener("change", function () {
        renderHome();
      });
    });

    els.movieGrid.addEventListener("click", handleMovieCardClick);
    els.recommendedRow.addEventListener("click", handleMovieCardClick);
    els.relatedRow.addEventListener("click", handleMovieCardClick);
    els.heroSection.addEventListener("click", function (event) {
      var playTarget = event.target.closest("[data-hero-play]");
      var detailTarget = event.target.closest("[data-hero-detail]");
      if (playTarget) {
        openDetail(playTarget.dataset.heroPlay);
      } else if (detailTarget) {
        openDetail(detailTarget.dataset.heroDetail);
      }
    });

    els.continueRow.addEventListener("click", function (event) {
      var card = event.target.closest("[data-movie-id]");
      if (card) {
        openDetail(card.dataset.movieId);
      }
    });

    els.clearHistoryButton.addEventListener("click", clearAllHistory);
    els.closeDetailButton.addEventListener("click", closeDetail);
    els.playButton.addEventListener("click", playCurrentSelection);
    els.favoriteButton.addEventListener("click", toggleFavorite);
    els.shareButton.addEventListener("click", shareCurrentMovie);
    els.clearMovieProgressButton.addEventListener("click", clearMovieProgress);

    els.ratingBox.addEventListener("click", function (event) {
      var button = event.target.closest("[data-rating]");
      if (!button) {
        return;
      }
      rateCurrentMovie(Number(button.dataset.rating));
    });

    els.seasonTabs.addEventListener("click", function (event) {
      var button = event.target.closest("[data-season-index]");
      if (!button) {
        return;
      }
      state.activeSeasonIndex = Number(button.dataset.seasonIndex);
      state.activeEpisodeIndex = getLastEpisodeIndex(getActiveMovie(), state.activeSeasonIndex);
      state.detailPage = Math.floor(state.activeEpisodeIndex / EPISODE_PAGE_SIZE);
      renderDetailEpisodes();
      updateRouteForCurrent(false, false);
      focusElement(els.episodeGrid.querySelector("[data-focusable]"));
    });

    els.detailPagePrev.addEventListener("click", function () {
      state.detailPage = Math.max(0, state.detailPage - 1);
      renderDetailEpisodes();
      focusElement(els.detailPagePrev);
    });
    els.detailPageNext.addEventListener("click", function () {
      state.detailPage += 1;
      renderDetailEpisodes();
      focusElement(els.detailPageNext);
    });
    els.episodeGrid.addEventListener("click", function (event) {
      var button = event.target.closest("[data-season-index][data-episode-index]");
      if (!button) {
        return;
      }
      state.activeSeasonIndex = Number(button.dataset.seasonIndex);
      state.activeEpisodeIndex = Number(button.dataset.episodeIndex);
      renderDetailEpisodes();
      playCurrentSelection();
    });

    els.commentForm.addEventListener("submit", function (event) {
      event.preventDefault();
      addCurrentComment();
    });

    els.videoPlayer.addEventListener("timeupdate", saveCurrentPlaybackTime);
    els.videoPlayer.addEventListener("play", function () {
      showPlayerControls(false);
    });
    els.videoPlayer.addEventListener("pause", function () {
      saveCurrentPlaybackTime();
      showPlayerControls(true);
    });
    els.videoPlayer.addEventListener("loadedmetadata", restorePlaybackTime);
    els.videoPlayer.addEventListener("ended", function () {
      showPlayerControls(true);
      handleEpisodeEnded("video-ended");
    });

    els.playerView.addEventListener("pointermove", function () {
      showPlayerControls(false);
    });
    els.playerView.addEventListener("touchstart", function () {
      showPlayerControls(false);
    }, { passive: true });
    els.playerView.addEventListener("click", function (event) {
      showPlayerControls(false);
      if (event.target.closest("button, input, select, textarea, a") || event.target.closest(".watch-sidebar")) {
        return;
      }
      focusElement(els.videoPlayer.hidden ? els.iframePlayer : els.videoPlayer);
    });
    els.playerEmbedButton.addEventListener("click", function (event) {
      event.stopPropagation();
      focusElement(els.iframePlayer);
    });
    els.playerCloseButton.addEventListener("click", function (event) {
      event.stopPropagation();
      closePlayer();
    });
    els.playerFullscreenButton.addEventListener("click", function (event) {
      event.stopPropagation();
      enterLandscapePlayback(true);
    });
    els.playerPrevButton.addEventListener("click", function (event) {
      event.stopPropagation();
      playPreviousEpisode();
    });
    els.playerNextButton.addEventListener("click", function (event) {
      event.stopPropagation();
      playNextEpisode();
    });
    els.playerDetailButton.addEventListener("click", function (event) {
      event.stopPropagation();
      closePlayer();
    });
    els.playerSeasonSelect.addEventListener("change", function () {
      state.playerBrowseSeasonIndex = Number(els.playerSeasonSelect.value) || 0;
      state.playerPage = 0;
      renderPlayerView();
      focusElement(els.playerSeasonSelect);
    });
    els.playerPagePrev.addEventListener("click", function () {
      state.playerPage = Math.max(0, state.playerPage - 1);
      renderPlayerView();
      focusElement(els.playerPagePrev);
    });
    els.playerPageNext.addEventListener("click", function () {
      state.playerPage += 1;
      renderPlayerView();
      focusElement(els.playerPageNext);
    });
    els.playerEpisodeList.addEventListener("click", function (event) {
      var button = event.target.closest("[data-player-season][data-player-episode]");
      if (!button) {
        return;
      }
      state.activeSeasonIndex = Number(button.dataset.playerSeason);
      state.activeEpisodeIndex = Number(button.dataset.playerEpisode);
      renderDetailEpisodes();
      playCurrentSelection();
    });

    els.closeAssistantButton.addEventListener("click", closeAssistant);
    els.groqKeyInput.value = window.GroqService ? window.GroqService.getApiKey() : "";
    els.groqKeyInput.addEventListener("change", function () {
      if (window.GroqService) {
        window.GroqService.setApiKey(els.groqKeyInput.value);
        showToast(window.GroqService.isConfigured() ? "Đã lưu Groq API key trên trình duyệt." : "Đã tắt Groq, dùng AI offline.");
      }
    });
    els.quickPrompts.addEventListener("click", function (event) {
      var button = event.target.closest("[data-prompt]");
      if (button) {
        els.chatInput.value = button.dataset.prompt;
        submitChatPrompt();
      }
    });
    els.chatForm.addEventListener("submit", function (event) {
      event.preventDefault();
      submitChatPrompt();
    });

    els.closeAdminButton.addEventListener("click", closeAdmin);
    els.movieForm.addEventListener("submit", function (event) {
      event.preventDefault();
      addMovieFromForm();
    });
    els.exportMoviesButton.addEventListener("click", exportImportedMovies);
    els.clearImportedButton.addEventListener("click", clearImportedMovies);
    els.importJsonButton.addEventListener("click", importJsonMovies);

    els.closeHistoryButton.addEventListener("click", closeHistoryPanel);
    els.historyList.addEventListener("click", function (event) {
      var openButton = event.target.closest("[data-open-history]");
      var removeButton = event.target.closest("[data-remove-history]");
      if (openButton) {
        closeHistoryPanel();
        openDetail(openButton.dataset.openHistory);
      } else if (removeButton) {
        removeMovieHistory(removeButton.dataset.removeHistory);
      }
    });

    els.replayButton.addEventListener("click", function () {
      els.finishedModal.hidden = true;
      state.activeSeasonIndex = 0;
      state.activeEpisodeIndex = 0;
      playCurrentSelection();
    });
    els.showRecommendationsButton.addEventListener("click", function () {
      els.finishedModal.hidden = true;
      closePlayer();
      closeDetail();
      state.activeCategory = "trending";
      renderAll();
      focusElement(els.recommendedRow.querySelector("[data-focusable]") || els.movieGrid.querySelector("[data-focusable]"));
    });
    els.closeFinishedButton.addEventListener("click", function () {
      els.finishedModal.hidden = true;
      closePlayer();
    });

    document.addEventListener("keydown", handleGlobalKeys);
    document.addEventListener("keyup", handleGlobalKeys);
    document.addEventListener("error", handleImageError, true);
    window.addEventListener("popstate", function () {
      applyRouteFromUrl(false);
    });
  }

  function renderAll() {
    renderNavigation();
    renderHome();
    updateSeo(getActiveMovie());
  }

  function renderNavigation() {
    els.navList.innerHTML = [
      '<p class="nav-caption">Khám phá</p>',
      '<div class="nav-button-list">',
      NAV_ITEMS.map(function (item) {
        var count = getCategoryMovies(item.id).length;
        var active = state.activeCategory === item.id;
        return '<button class="nav-button' + (active ? ' active' : '') + '" type="button" data-category-id="' + escapeAttr(item.id) + '" data-focusable aria-pressed="' + active + '">' +
          '<span>' + escapeHtml(item.label) + '</span><span class="nav-count">' + count + '</span></button>';
      }).join(""),
      '</div>'
    ].join("");
  }

  function renderFilterOptions() {
    fillSelect(els.genreFilter, "Tất cả thể loại", uniqueValues(function (movie) {
      return movie.genres || [];
    }));
    fillSelect(els.yearFilter, "Tất cả năm", uniqueValues(function (movie) {
      return movie.year ? [String(movie.year)] : [];
    }).sort(function (a, b) {
      return Number(b) - Number(a);
    }));
    fillSelect(els.countryFilter, "Tất cả quốc gia", uniqueValues(function (movie) {
      return movie.country ? [movie.country] : [];
    }));
    fillSelect(els.statusFilter, "Tất cả trạng thái", uniqueValues(function (movie) {
      return movie.status ? [movie.status] : [];
    }));
  }

  function fillSelect(select, allLabel, values) {
    var previous = select.value || "all";
    select.innerHTML = '<option value="all">' + escapeHtml(allLabel) + '</option>' + values.map(function (value) {
      return '<option value="' + escapeAttr(value) + '">' + escapeHtml(value) + '</option>';
    }).join("");
    select.value = values.indexOf(previous) !== -1 ? previous : "all";
  }

  function uniqueValues(selector) {
    var seen = {};
    var values = [];
    state.movies.forEach(function (movie) {
      selector(movie).forEach(function (value) {
        var clean = String(value || "").trim();
        if (clean && !seen[clean]) {
          seen[clean] = true;
          values.push(clean);
        }
      });
    });
    return values.sort(function (a, b) {
      return a.localeCompare(b, "vi");
    });
  }

  function renderHome() {
    var navItem = NAV_ITEMS.find(function (item) {
      return item.id === state.activeCategory;
    }) || NAV_ITEMS[0];
    var movies = getFilteredMovies();
    var query = els.searchInput.value.trim();
    var smartNote = state.activeSmartResult && state.activeSmartResult.note;

    els.pageTitle.textContent = query ? "Kết quả cho \"" + query + "\"" : navItem.label;
    els.gridEyebrow.textContent = smartNote || navItem.eyebrow;
    els.gridTitle.textContent = query ? "Tìm kiếm thông minh" : navItem.label;
    els.resultCount.textContent = movies.length + " phim";
    els.smartSearchButton.disabled = state.smartSearchBusy;
    els.smartSearchButton.textContent = state.smartSearchBusy ? "Đang tìm..." : "Tìm AI";

    renderHero(movies[0] || getTrendingMovies()[0] || state.movies[0]);
    renderContinueRow();
    renderRecommendedRow();

    if (!movies.length) {
      els.movieGrid.innerHTML = '<div class="empty-state">Không tìm thấy phim phù hợp. Thử bỏ bớt bộ lọc hoặc hỏi AI Assistant bằng mô tả tự nhiên.</div>';
      return;
    }

    els.movieGrid.innerHTML = movies.map(function (movie) {
      return renderMovieCard(movie, "grid");
    }).join("");
  }

  function renderHero(movie) {
    if (!movie) {
      els.heroSection.innerHTML = "";
      return;
    }

    var progress = state.progress[movie.id];
    var heroImage = movie.banner || movie.thumbnail;
    var meta = buildMetaBadges(movie).slice(0, 5).join("");
    els.heroSection.style.setProperty("--hero-image", "url('" + escapeCssUrl(heroImage) + "')");
    els.heroSection.innerHTML = [
      '<div class="hero-copy">',
      '<p class="eyebrow">Lựa chọn nổi bật</p>',
      '<h2>' + escapeHtml(movie.title) + '</h2>',
      '<p>' + escapeHtml(movie.description || "Một lựa chọn nổi bật trong thư viện.") + '</p>',
      '<div class="badge-line">' + meta + '</div>',
      '<div class="hero-actions">',
      '<button class="primary-button" type="button" data-hero-play="' + escapeAttr(movie.id) + '" data-focusable>' + (progress ? "Tiếp tục xem" : "Xem ngay") + '</button>',
      '<button class="secondary-button" type="button" data-hero-detail="' + escapeAttr(movie.id) + '" data-focusable>Chi tiết</button>',
      '</div>',
      '</div>'
    ].join("");
  }

  function renderContinueRow() {
    var items = getContinueMovies().slice(0, 12);
    els.continueShelf.hidden = items.length === 0;
    els.continueRow.innerHTML = items.map(renderContinueCard).join("");
  }

  function renderRecommendedRow() {
    var recommendations = window.VHubAI ? window.VHubAI.recommendMovies(state.movies, buildAIContext(), 12) : getTrendingMovies().slice(0, 12);
    els.recommendedRow.innerHTML = recommendations.map(function (movie) {
      return renderMovieCard(movie, "row");
    }).join("");
  }

  function getFilteredMovies() {
    var query = els.searchInput.value.trim();
    var movies = getCategoryMovies(state.activeCategory);

    if (state.activeSmartResult && state.activeSmartResult.query === query) {
      var allowed = {};
      movies.forEach(function (movie) {
        allowed[movie.id] = true;
      });
      movies = state.activeSmartResult.movies.filter(function (movie) {
        return allowed[movie.id];
      });
    } else if (query) {
      movies = localQueryMovies(query, movies);
    }

    movies = applyAdvancedFilters(movies);
    return sortMovies(movies);
  }

  function getCategoryMovies(categoryId) {
    if (categoryId === "new") {
      return state.movies.filter(function (movie) {
        return movie.isNew || movie.source === "imported";
      });
    }
    if (categoryId === "trending") {
      return getTrendingMovies();
    }
    if (categoryId === "favorites") {
      return state.movies.filter(function (movie) {
        return state.favorites.indexOf(movie.id) !== -1;
      });
    }
    if (categoryId === "continue") {
      return getContinueMovies();
    }
    if (CATEGORY_TO_NAME[categoryId]) {
      return state.movies.filter(function (movie) {
        return getMovieCategories(movie).indexOf(CATEGORY_TO_NAME[categoryId]) !== -1;
      });
    }
    return state.movies.slice();
  }

  function localQueryMovies(query, movies) {
    if (!window.VHubAI) {
      return movies;
    }
    return window.VHubAI.localSmartSearch(query, movies, buildAIContext()).movies;
  }

  function applyAdvancedFilters(movies) {
    var genre = els.genreFilter.value;
    var year = els.yearFilter.value;
    var country = els.countryFilter.value;
    var status = els.statusFilter.value;
    var episodeMode = els.episodeFilter.value;

    return movies.filter(function (movie) {
      var episodeCount = countEpisodes(movie);
      var matchesEpisodes = episodeMode === "all" ||
        episodeMode === "single" && episodeCount <= 1 ||
        episodeMode === "short" && episodeCount >= 1 && episodeCount <= 12 ||
        episodeMode === "medium" && episodeCount >= 13 && episodeCount <= 30 ||
        episodeMode === "long" && episodeCount > 30;

      return (genre === "all" || (movie.genres || []).indexOf(genre) !== -1) &&
        (year === "all" || String(movie.year || "") === year) &&
        (country === "all" || movie.country === country) &&
        (status === "all" || movie.status === status) &&
        matchesEpisodes;
    });
  }

  function sortMovies(movies) {
    var mode = els.sortFilter.value;
    var sorted = movies.slice();

    if (mode === "smart") {
      return sorted;
    }
    if (mode === "trending") {
      sorted.sort(function (a, b) {
        return trendingScore(b) - trendingScore(a);
      });
    } else if (mode === "recent") {
      sorted.sort(function (a, b) {
        return (b.updatedAt || b.year || 0) - (a.updatedAt || a.year || 0);
      });
    } else if (mode === "year-desc") {
      sorted.sort(function (a, b) {
        return (b.year || 0) - (a.year || 0) || a.title.localeCompare(b.title, "vi");
      });
    } else if (mode === "title-asc") {
      sorted.sort(function (a, b) {
        return a.title.localeCompare(b.title, "vi");
      });
    } else if (mode === "rating-desc") {
      sorted.sort(function (a, b) {
        return getDisplayRating(b) - getDisplayRating(a);
      });
    } else if (mode === "episodes-desc") {
      sorted.sort(function (a, b) {
        return countEpisodes(b) - countEpisodes(a) || a.title.localeCompare(b.title, "vi");
      });
    }
    return sorted;
  }

  function getTrendingMovies() {
    return state.movies.slice().sort(function (a, b) {
      return trendingScore(b) - trendingScore(a) || a.title.localeCompare(b.title, "vi");
    });
  }

  function trendingScore(movie) {
    var progress = state.progress[movie.id];
    var favoriteBoost = state.favorites.indexOf(movie.id) !== -1 ? 12 : 0;
    var watchBoost = progress ? 8 + Math.min(14, getWatchedEpisodeCount(movie) * 2) : 0;
    var ratingBoost = getDisplayRating(movie) * 1.5;
    var recencyBoost = movie.isNew || movie.source === "imported" ? 4 : 0;
    return favoriteBoost + watchBoost + ratingBoost + recencyBoost + (movie.views || 0);
  }

  function renderMovieCard(movie, variant) {
    var progress = state.progress[movie.id];
    var episodeCount = countEpisodes(movie);
    var watchedCount = getWatchedEpisodeCount(movie);
    var rating = getDisplayRating(movie);
    var classes = "movie-card" + (variant === "row" ? " row-card" : "");
    var badges = buildMetaBadges(movie);

    if (watchedCount > 0) {
      badges.push('<span class="badge watched">' + watchedCount + "/" + episodeCount + " đã xem</span>");
    }
    if (progress) {
      badges.push('<span class="badge progress">' + escapeHtml(getEpisodeLabel(movie, progress.seasonIndex, progress.episodeIndex)) + '</span>');
    }
    if (state.favorites.indexOf(movie.id) !== -1) {
      badges.push('<span class="badge favorite">Yêu thích</span>');
    }

    return [
      '<button class="' + classes + '" type="button" data-movie-id="' + escapeAttr(movie.id) + '" data-focusable>',
      '<span class="poster-wrap">',
      '<img class="poster" src="' + escapeAttr(movie.thumbnail) + '" alt="' + escapeAttr(movie.title) + '" loading="lazy" decoding="async">',
      '<span class="poster-glow"></span>',
      '</span>',
      '<span class="movie-body">',
      '<span class="movie-kicker">' + escapeHtml((movie.genres || [])[0] || getMovieCategoryText(movie)) + '</span>',
      '<span class="movie-title">' + escapeHtml(movie.title) + '</span>',
      '<span class="movie-desc">' + escapeHtml(movie.description || "") + '</span>',
      '<span class="movie-stat"><strong>' + rating.toFixed(1) + '</strong>/10 · ' + episodeCount + ' tập</span>',
      '<span class="badge-line">' + badges.slice(0, 5).join("") + '</span>',
      '<span class="hover-cta">Xem ngay</span>',
      '</span>',
      '</button>'
    ].join("");
  }

  function renderContinueCard(movie) {
    var progress = state.progress[movie.id] || {};
    var progressWidth = getProgressWidth(progress);
    var episodeLabel = getEpisodeLabel(movie, progress.seasonIndex, progress.episodeIndex);
    return [
      '<button class="continue-card" type="button" data-movie-id="' + escapeAttr(movie.id) + '" data-focusable>',
      '<span class="continue-thumb-wrap">',
      '<img class="continue-thumb" src="' + escapeAttr(movie.banner || movie.thumbnail) + '" alt="' + escapeAttr(movie.title) + '" loading="lazy">',
      '<span class="continue-progress" style="width:' + progressWidth + '%"></span>',
      '</span>',
      '<span class="continue-info">',
      '<strong>' + escapeHtml(movie.title) + '</strong>',
      '<span>' + escapeHtml(episodeLabel + " · " + getProgressText(progress)) + '</span>',
      '</span>',
      '</button>'
    ].join("");
  }

  function buildMetaBadges(movie) {
    var badges = [];
    if (movie.year) {
      badges.push('<span class="badge">' + escapeHtml(movie.year) + '</span>');
    }
    if (movie.country) {
      badges.push('<span class="badge">' + escapeHtml(movie.country) + '</span>');
    }
    badges.push('<span class="badge">' + countEpisodes(movie) + ' tập</span>');
    (movie.genres || []).slice(0, 3).forEach(function (genre) {
      badges.push('<span class="badge">' + escapeHtml(genre) + '</span>');
    });
    return badges;
  }

  function handleMovieCardClick(event) {
    var card = event.target.closest("[data-movie-id]");
    if (card) {
      openDetail(card.dataset.movieId);
    }
  }

  function openDetail(movieId, options) {
    var movie = findMovie(movieId);
    if (!movie) {
      showToast("Không tìm thấy phim.");
      return;
    }

    options = options || {};
    state.lastFocused = document.activeElement;
    state.activeMovieId = movie.id;

    var saved = state.progress[movie.id];
    var selection = getSavedSelection(movie, saved);
    state.activeSeasonIndex = typeof options.seasonIndex === "number" ? options.seasonIndex : selection.seasonIndex;
    state.activeEpisodeIndex = typeof options.episodeIndex === "number" ? options.episodeIndex : selection.episodeIndex;
    state.detailPage = Math.floor(state.activeEpisodeIndex / EPISODE_PAGE_SIZE);

    hydrateDetail(movie);
    els.detailView.hidden = false;
    document.body.classList.add("modal-open");
    renderDetailEpisodes();
    renderRating();
    renderComments();
    renderRelatedMovies();
    updateSeo(movie);
    updateRouteForCurrent(false, options.replaceRoute !== true);

    if (options.play) {
      playCurrentSelection();
    } else {
      focusElement(els.playButton);
    }
  }

  function hydrateDetail(movie) {
    els.detailBackdrop.style.backgroundImage = "url('" + escapeCssUrl(movie.banner || movie.thumbnail) + "')";
    els.detailPoster.src = movie.thumbnail;
    els.detailPoster.alt = movie.title;
    els.detailCategory.textContent = getMovieCategoryText(movie);
    els.detailTitle.textContent = movie.title;
    els.detailOriginalTitle.textContent = movie.originalTitle ? movie.originalTitle : "";
    els.detailDescription.textContent = movie.description || "Chưa có mô tả.";
    els.detailMeta.innerHTML = [
      '<span class="badge">' + escapeHtml(movie.status || "Hoàn thành") + '</span>',
      '<span class="badge">' + escapeHtml(movie.country || "Đang cập nhật") + '</span>',
      '<span class="badge">' + escapeHtml(movie.year || "N/A") + '</span>',
      '<span class="badge">' + countEpisodes(movie) + ' tập</span>',
      '<span class="badge rating-badge">' + getDisplayRating(movie).toFixed(1) + '/10</span>'
    ].join("") + (movie.genres || []).map(function (genre) {
      return '<span class="badge">' + escapeHtml(genre) + '</span>';
    }).join("");
    renderFavoriteButton();
    renderPlayButton();
  }

  function closeDetail() {
    els.detailView.hidden = true;
    document.body.classList.remove("modal-open");
    state.activeMovieId = null;
    updateSeo(null);
    replaceRoute();
    focusElement(state.lastFocused || els.movieGrid.querySelector("[data-focusable]") || els.homeButton);
  }

  function renderFavoriteButton() {
    var movie = getActiveMovie();
    if (!movie) {
      return;
    }
    var active = state.favorites.indexOf(movie.id) !== -1;
    els.favoriteButton.textContent = active ? "Bỏ yêu thích" : "Yêu thích";
    els.favoriteButton.setAttribute("aria-pressed", String(active));
  }

  function renderPlayButton() {
    var movie = getActiveMovie();
    var episode = getActiveEpisode();
    var progress = movie && state.progress[movie.id];
    els.playButton.disabled = !episode;
    els.playButton.textContent = progress ? "Tiếp tục xem" : "Xem ngay";
  }

  function renderRating() {
    var movie = getActiveMovie();
    if (!movie) {
      els.ratingBox.innerHTML = "";
      return;
    }
    var current = Number(state.ratings[movie.id] || 0);
    els.ratingBox.innerHTML = [
      '<span class="rating-label">Đánh giá của bạn</span>',
      '<div class="rating-buttons">',
      Array.from({ length: 10 }, function (_, index) {
        var value = index + 1;
        var active = current === value ? " active" : "";
        return '<button class="rating-button' + active + '" type="button" data-rating="' + value + '" data-focusable>' + value + '</button>';
      }).join(""),
      '</div>'
    ].join("");
  }

  function renderDetailEpisodes() {
    var movie = getActiveMovie();
    if (!movie) { return; }
    els.seasonTabs.innerHTML = movie.seasons.map(function (season, index) {
      var active = index === state.activeSeasonIndex ? " active" : "";
      return '<button class="season-button' + active + '" type="button" data-season-index="' + index + '" data-focusable>' + escapeHtml(season.name) + '</button>';
    }).join("");

    var season = movie.seasons[state.activeSeasonIndex] || { episodes: [] };
    var episodes = season.episodes || [];
    var totalPages = Math.max(1, Math.ceil(episodes.length / EPISODE_PAGE_SIZE));
    state.detailPage = Math.max(0, Math.min(totalPages - 1, state.detailPage));
    var first = state.detailPage * EPISODE_PAGE_SIZE;
    var last = Math.min(episodes.length, first + EPISODE_PAGE_SIZE);
    els.detailPagePrev.disabled = state.detailPage === 0;
    els.detailPageNext.disabled = state.detailPage >= totalPages - 1;
    els.detailEpisodeRange.textContent = episodes.length ? (first + 1) + "–" + last + " / " + episodes.length : "0 tập";
    els.episodeGrid.innerHTML = episodes.slice(first, last).map(function (episode, localIndex) {
      var index = first + localIndex;
      var current = index === state.activeEpisodeIndex ? " current" : "";
      var status = getEpisodeStatus(movie.id, state.activeSeasonIndex, index);
      var watched = status === "Đã xem" ? " watched" : "";
      var progress = getEpisodeProgress(movie.id, state.activeSeasonIndex, index);
      return [
        '<button class="episode-button' + current + watched + '" type="button" data-season-index="' + state.activeSeasonIndex + '" data-episode-index="' + index + '" data-focusable>',
        '<strong>' + escapeHtml(episode.title || "Tập " + (index + 1)) + '</strong>',
        '<small>' + escapeHtml(status) + '</small>',
        progress ? '<span class="episode-progress"><i style="width:' + progress + '%"></i></span>' : '',
        '</button>'
      ].join("");
    }).join("");
    renderPlayButton();
    scrollActiveEpisodeIntoView();
    if (!els.playerView.hidden) { renderPlayerView(); }
  }
  function renderComments() {
    var movie = getActiveMovie();
    if (!movie) {
      els.commentList.innerHTML = "";
      return;
    }
    var comments = state.comments[movie.id] || [];
    if (!comments.length) {
      els.commentList.innerHTML = '<p class="empty-note">Chưa có bình luận. Cảm nhận đầu tiên thường là hay nhất.</p>';
      return;
    }
    els.commentList.innerHTML = comments.slice().reverse().map(function (comment) {
      return [
        '<article class="comment-item">',
        '<strong>Bạn</strong>',
        '<time>' + escapeHtml(formatDate(comment.createdAt)) + '</time>',
        '<p>' + escapeHtml(comment.body) + '</p>',
        '</article>'
      ].join("");
    }).join("");
  }

  function renderRelatedMovies() {
    var movie = getActiveMovie();
    if (!movie) {
      els.relatedRow.innerHTML = "";
      return;
    }
    var related = state.movies.filter(function (candidate) {
      return candidate.id !== movie.id && hasSharedGenre(movie, candidate);
    }).sort(function (a, b) {
      return getSharedGenreCount(movie, b) - getSharedGenreCount(movie, a) || trendingScore(b) - trendingScore(a);
    }).slice(0, 10);

    if (!related.length) {
      related = getTrendingMovies().filter(function (candidate) {
        return candidate.id !== movie.id;
      }).slice(0, 10);
    }

    els.relatedRow.innerHTML = related.map(function (candidate) {
      return renderMovieCard(candidate, "row");
    }).join("");
  }

  function scrollActiveEpisodeIntoView() {
    window.requestAnimationFrame(function () {
      var current = els.episodeGrid.querySelector(".episode-button.current");
      if (current) {
        current.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
      }
    });
  }

  function toggleFavorite() {
    var movie = getActiveMovie();
    if (!movie) {
      return;
    }
    var index = state.favorites.indexOf(movie.id);
    if (index === -1) {
      state.favorites.push(movie.id);
      showToast("Đã thêm vào yêu thích.");
    } else {
      state.favorites.splice(index, 1);
      showToast("Đã bỏ khỏi yêu thích.");
    }
    saveJson(STORAGE_KEYS.favorites, state.favorites);
    renderFavoriteButton();
    renderAll();
  }

  function rateCurrentMovie(value) {
    var movie = getActiveMovie();
    if (!movie || value < 1 || value > 10) {
      return;
    }
    state.ratings[movie.id] = value;
    saveJson(STORAGE_KEYS.ratings, state.ratings);
    renderRating();
    hydrateDetail(movie);
    renderHome();
    showToast("Đã lưu đánh giá " + value + "/10.");
  }

  function addCurrentComment() {
    var movie = getActiveMovie();
    var body = els.commentInput.value.trim();
    if (!movie || !body) {
      return;
    }
    var comments = state.comments[movie.id] || [];
    comments.push({
      id: "comment-" + Date.now(),
      body: body,
      createdAt: Date.now()
    });
    state.comments[movie.id] = comments;
    saveJson(STORAGE_KEYS.comments, state.comments);
    els.commentInput.value = "";
    renderComments();
  }

  function clearMovieProgress() {
    var movie = getActiveMovie();
    if (!movie) {
      return;
    }
    delete state.progress[movie.id];
    state.history = state.history.filter(function (entry) {
      return entry.movieId !== movie.id;
    });
    saveJson(STORAGE_KEYS.progress, state.progress);
    saveJson(STORAGE_KEYS.history, state.history);
    state.activeSeasonIndex = 0;
    state.activeEpisodeIndex = 0;
    renderAll();
    renderDetailEpisodes();
    showToast("Đã xóa tiến trình của phim này.");
  }

  function playCurrentSelection() {
    var movie = getActiveMovie();
    var episode = getActiveEpisode();
    if (!movie || !episode) {
      return;
    }

    clearPlaybackTimers();
    els.playerView.hidden = false;
    document.body.classList.add("player-open");
    state.playerSession = {
      movieId: movie.id,
      seasonIndex: state.activeSeasonIndex,
      episodeIndex: state.activeEpisodeIndex,
      startedAt: Date.now(),
      baseTime: getStoredCurrentTime(movie.id, state.activeSeasonIndex, state.activeEpisodeIndex),
      duration: inferEpisodeDuration(movie, episode)
    };

    state.playerBrowseSeasonIndex = state.activeSeasonIndex;
    state.playerPage = Math.floor(state.activeEpisodeIndex / EPISODE_PAGE_SIZE);
    renderPlayerView();
    loadEpisodeSource(episode.videoUrl || episode.embedUrl || episode.url || "");
    markCurrentEpisodeProgress(false);
    addHistoryEntry(movie, episode, false);
    updateRouteForCurrent(true, true);
    startProgressTimer();
    showPlayerControls(false);
    focusElement(els.playerCloseButton);
  }

  function renderPlayerView() {
    var movie = getActiveMovie();
    var episode = getActiveEpisode();
    if (!movie || !episode) { return; }
    var season = movie.seasons[state.activeSeasonIndex] || {};
    var metaParts = [episode.title || "Đang xem", season.name || "Mùa 1", movie.year || "", getMovieCategoryText(movie)].filter(Boolean);
    els.playerKicker.textContent = (movie.genres || [])[0] || "Đang xem";
    els.playerTitle.textContent = movie.title;
    els.playerMeta.textContent = metaParts.join(" · ");
    els.playerEpisodeCount.textContent = countEpisodes(movie) + " tập";
    els.playerPrevButton.disabled = !getRelativeEpisode(-1);
    els.playerNextButton.disabled = !getRelativeEpisode(1);

    state.playerBrowseSeasonIndex = clampIndex(state.playerBrowseSeasonIndex, movie.seasons.length);
    var browseSeason = movie.seasons[state.playerBrowseSeasonIndex] || { episodes: [] };
    els.playerSeasonSelect.innerHTML = movie.seasons.map(function (item, index) {
      return '<option value="' + index + '">' + escapeHtml(item.name) + ' (' + (item.episodes || []).length + ')</option>';
    }).join("");
    els.playerSeasonSelect.value = String(state.playerBrowseSeasonIndex);
    var list = browseSeason.episodes || [];
    var pages = Math.max(1, Math.ceil(list.length / EPISODE_PAGE_SIZE));
    state.playerPage = Math.max(0, Math.min(pages - 1, state.playerPage));
    var first = state.playerPage * EPISODE_PAGE_SIZE;
    var last = Math.min(list.length, first + EPISODE_PAGE_SIZE);
    els.playerPagePrev.disabled = state.playerPage === 0;
    els.playerPageNext.disabled = state.playerPage >= pages - 1;
    els.playerEpisodeRange.textContent = list.length ? (first + 1) + "–" + last + " / " + list.length : "0 tập";
    els.playerEpisodeList.innerHTML = list.slice(first, last).map(function (item, localIndex) {
      var index = first + localIndex;
      var isCurrent = state.playerBrowseSeasonIndex === state.activeSeasonIndex && index === state.activeEpisodeIndex;
      var status = getEpisodeStatus(movie.id, state.playerBrowseSeasonIndex, index);
      var progress = getEpisodeProgress(movie.id, state.playerBrowseSeasonIndex, index);
      var classes = "watch-episode-button" + (isCurrent ? " current" : "");
      return [
        '<button class="' + classes + '" type="button" data-player-season="' + state.playerBrowseSeasonIndex + '" data-player-episode="' + index + '" data-focusable>',
        '<span class="watch-episode-thumb">' + (index + 1) + '</span>',
        '<span class="watch-episode-copy">',
        '<strong>' + escapeHtml(item.title || "Tập " + (index + 1)) + '</strong>',
        '<span>' + escapeHtml(browseSeason.name + " · " + status) + '</span>',
        progress ? '<span class="episode-progress"><i style="width:' + progress + '%"></i></span>' : '',
        '</span></button>'
      ].join("");
    }).join("");
    window.requestAnimationFrame(function () {
      var current = els.playerEpisodeList.querySelector(".watch-episode-button.current");
      if (current) {
        try { current.scrollIntoView({block:"nearest",inline:"nearest",behavior:"auto"}); }
        catch (error) { current.scrollIntoView(false); }
      }
    });
  }

  function loadEpisodeSource(url) {
    var movie = getActiveMovie();
    var episode = getActiveEpisode();
    var resumeSeconds = getStoredCurrentTime(movie.id, state.activeSeasonIndex, state.activeEpisodeIndex);
    var sourceUrl = normalizeSourceUrl(url, resumeSeconds);

    teardownHls();
    els.videoPlayer.pause();
    els.videoPlayer.removeAttribute("src");
    els.videoPlayer.hidden = true;
    els.videoPlayer.load();
    els.iframePlayer.hidden = true;
    els.iframePlayer.src = "about:blank";
    els.playerEmbedButton.hidden = true;

    if (!sourceUrl) {
      showToast("Tập này chưa có link video.");
      return;
    }

    if (isEmbedUrl(sourceUrl)) {
      els.iframePlayer.hidden = false;
      els.iframePlayer.src = sourceUrl;
      els.playerEmbedButton.hidden = false;
      // Iframe không báo kết thúc đáng tin cậy; không tự chuyển sau thời gian ước lượng.
      return;
    }

    els.videoPlayer.hidden = false;
    if (isHlsUrl(sourceUrl)) {
      if (els.videoPlayer.canPlayType("application/vnd.apple.mpegurl")) {
        els.videoPlayer.src = sourceUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        state.hls = new window.Hls({ maxBufferLength: 45 });
        state.hls.loadSource(sourceUrl);
        state.hls.attachMedia(els.videoPlayer);
      } else {
        loadHlsLibrary().then(function () {
          if (els.playerView.hidden || getActiveEpisode() !== episode) { return; }
          if (!window.Hls || !window.Hls.isSupported()) {
            showToast("Trình duyệt TV này chưa hỗ trợ HLS."); return;
          }
          teardownHls();
          state.hls = new window.Hls({ maxBufferLength: 20 });
          state.hls.loadSource(sourceUrl);
          state.hls.attachMedia(els.videoPlayer);
          var promise = els.videoPlayer.play();
          if (promise && promise.catch) {
            promise.catch(function () { showPlayerControls(true); });
          }
        }).catch(function () {
          showToast("Không tải được HLS. Hãy kiểm tra kết nối mạng.");
        });
        return;
      }
    } else {
      els.videoPlayer.src = sourceUrl;
    }

    var playPromise = els.videoPlayer.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {
        showPlayerControls(true);
        showToast("Nếu trình duyệt chặn tự phát, hãy bấm nút Play gốc của video.");
      });
    }
  }

  function setupEmbedAutoNext(movie, episode) {
    if (!state.settings.autoplay || !state.settings.embedAutoNext) {
      return;
    }
    var seconds = inferEpisodeDuration(movie, episode);
    state.embedAutoNextTimer = window.setTimeout(function () {
      handleEpisodeEnded("embed-fallback-timer");
    }, Math.max(60, seconds) * 1000);
  }

  function startProgressTimer() {
    state.progressTimer = window.setInterval(function () {
      if (els.playerView.hidden) {
        return;
      }
      if (els.videoPlayer.hidden) {
        markCurrentEpisodeProgress(false);
      } else {
        saveCurrentPlaybackTime();
      }
    }, 8000);
  }

  function restorePlaybackTime() {
    if (els.videoPlayer.hidden) {
      return;
    }
    var movie = getActiveMovie();
    if (!movie) {
      return;
    }
    var seconds = getStoredCurrentTime(movie.id, state.activeSeasonIndex, state.activeEpisodeIndex);
    if (seconds > 5 && Number.isFinite(els.videoPlayer.duration) && seconds < els.videoPlayer.duration - 8) {
      try {
        els.videoPlayer.currentTime = seconds;
      } catch (error) {}
    }
  }

  function saveCurrentPlaybackTime() {
    if (els.videoPlayer.hidden) {
      return;
    }
    var duration = getFiniteVideoDuration();
    var currentTime = Math.floor(els.videoPlayer.currentTime || 0);
    markCurrentEpisodeProgress(duration > 0 && currentTime / duration > 0.92);
  }

  function markCurrentEpisodeProgress(isWatched) {
    var movie = getActiveMovie();
    if (!movie) {
      return;
    }
    var existing = state.progress[movie.id] || {};
    var watched = Object.assign({}, existing.watched || {});
    var key = getEpisodeKey(state.activeSeasonIndex, state.activeEpisodeIndex);
    var currentTime = getCurrentPlaybackTime(existing);
    var duration = getCurrentPlaybackDuration(existing);

    if (isWatched) {
      watched[key] = true;
      currentTime = duration || currentTime;
    }

    state.progress[movie.id] = {
      seasonIndex: state.activeSeasonIndex,
      episodeIndex: state.activeEpisodeIndex,
      currentTime: Math.max(0, Math.floor(currentTime || 0)),
      duration: Math.max(0, Math.floor(duration || 0)),
      updatedAt: Date.now(),
      watched: watched
    };
    saveJson(STORAGE_KEYS.progress, state.progress);
  }

  function getCurrentPlaybackTime(existing) {
    if (!els.videoPlayer.hidden) {
      return els.videoPlayer.currentTime || 0;
    }
    if (state.playerSession) {
      var elapsed = (Date.now() - state.playerSession.startedAt) / 1000;
      return Math.min(state.playerSession.duration, state.playerSession.baseTime + elapsed);
    }
    return existing.currentTime || 0;
  }

  function getCurrentPlaybackDuration(existing) {
    if (!els.videoPlayer.hidden) {
      return getFiniteVideoDuration();
    }
    return state.playerSession ? state.playerSession.duration : existing.duration || 0;
  }

  function handleEpisodeEnded(reason) {
    var movie = getActiveMovie();
    var episode = getActiveEpisode();
    if (!movie || !episode) {
      return;
    }
    markCurrentEpisodeProgress(true);
    addHistoryEntry(movie, episode, true);
    renderAll();
    renderDetailEpisodes();

    if (state.settings.autoplay && hasNextEpisode()) {
      playNextEpisode(reason);
      return;
    }

    showFinishedModal();
  }

  function playNextEpisode() {
    var next = getRelativeEpisode(1);
    if (!next) {
      showFinishedModal();
      return;
    }
    state.activeSeasonIndex = next.seasonIndex;
    state.activeEpisodeIndex = next.episodeIndex;
    state.detailPage = Math.floor(state.activeEpisodeIndex / EPISODE_PAGE_SIZE);
    renderDetailEpisodes();
    playCurrentSelection();
  }

  function playPreviousEpisode() {
    var previous = getRelativeEpisode(-1);
    if (!previous) {
      showToast("Đây là tập đầu tiên.");
      return;
    }
    state.activeSeasonIndex = previous.seasonIndex;
    state.activeEpisodeIndex = previous.episodeIndex;
    state.detailPage = Math.floor(state.activeEpisodeIndex / EPISODE_PAGE_SIZE);
    renderDetailEpisodes();
    playCurrentSelection();
  }

  function showFinishedModal() {
    clearPlaybackTimers();
    els.finishedModal.hidden = false;
    focusElement(els.replayButton);
  }

  function closePlayer() {
    if (els.playerView.hidden) {
      return;
    }
    markCurrentEpisodeProgress(false);
    clearPlaybackTimers();
    teardownHls();
    els.videoPlayer.pause();
    els.videoPlayer.removeAttribute("src");
    els.videoPlayer.hidden = true;
    els.videoPlayer.load();
    els.iframePlayer.src = "about:blank";
    els.iframePlayer.hidden = true;
    els.playerView.hidden = true;
    els.playerView.classList.remove("controls-hidden");
    document.body.classList.remove("player-open");
    unlockScreenOrientation();
    exitPlayerFullscreen();
    state.playerSession = null;
    renderAll();
    renderDetailEpisodes();
    updateRouteForCurrent(false, false);
    focusElement(els.playButton);
  }

  function clearPlaybackTimers() {
    window.clearTimeout(state.embedAutoNextTimer);
    window.clearInterval(state.progressTimer);
    window.clearTimeout(state.playerControlsTimer);
    state.embedAutoNextTimer = null;
    state.progressTimer = null;
    state.playerControlsTimer = null;
  }

  function showPlayerControls(keepVisible) {
    if (els.playerView.hidden) {
      return;
    }
    els.playerView.classList.remove("controls-hidden");
    window.clearTimeout(state.playerControlsTimer);
    state.playerControlsTimer = null;

    if (keepVisible || els.playerFrame.querySelector(".player-controls").contains(document.activeElement) || !shouldAutoHidePlayerControls()) {
      return;
    }

    state.playerControlsTimer = window.setTimeout(function () {
      if (shouldAutoHidePlayerControls()) {
        els.playerView.classList.add("controls-hidden");
      }
    }, 2600);
  }

  function shouldAutoHidePlayerControls() {
    if (els.playerView.hidden) {
      return false;
    }
    if (els.videoPlayer.hidden) {
      return true;
    }
    return !els.videoPlayer.paused && !els.videoPlayer.ended;
  }

  function requestPlayerFullscreen() {
    var target = els.playerView;
    var fn = target.requestFullscreen || target.webkitRequestFullscreen || target.msRequestFullscreen;
    if (fn) {
      try {
        var result = fn.call(target);
        if (result && typeof result.catch === "function") {
          result.catch(function () {});
        }
        return result;
      } catch (error) {}
    }
    return null;
  }

  function enterLandscapePlayback(showHint) {
    showPlayerControls(false);
    var fullscreenResult = requestPlayerFullscreen();
    var lock = function () {
      lockScreenOrientation(showHint);
    };

    if (fullscreenResult && typeof fullscreenResult.then === "function") {
      fullscreenResult.then(lock).catch(function () {
        lock();
      });
      return;
    }
    lock();
  }

  function lockScreenOrientation(showHint) {
    var orientation = screen.orientation || screen.mozOrientation || screen.msOrientation;
    if (!orientation || typeof orientation.lock !== "function") {
      if (showHint) {
        showToast("Thiáº¿t bá»‹ nÃ y chÆ°a há»— trá»£ tá»± xoay ngang.");
      }
      return;
    }
    try {
      var result = orientation.lock("landscape");
      if (result && typeof result.catch === "function") {
        result.catch(function () {
          if (showHint) {
            showToast("HÃ£y cho phÃ©p toÃ n mÃ n hÃ¬nh Ä‘á»ƒ xoay ngang.");
          }
        });
      }
    } catch (error) {
      if (showHint) {
        showToast("HÃ£y cho phÃ©p toÃ n mÃ n hÃ¬nh Ä‘á»ƒ xoay ngang.");
      }
    }
  }

  function unlockScreenOrientation() {
    var orientation = screen.orientation || screen.mozOrientation || screen.msOrientation;
    if (orientation && typeof orientation.unlock === "function") {
      try {
        orientation.unlock();
      } catch (error) {}
    }
  }

  function exitPlayerFullscreen() {
    var fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    if (!fullscreenElement) {
      return;
    }
    var fn = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (fn) {
      try {
        var result = fn.call(document);
        if (result && typeof result.catch === "function") {
          result.catch(function () {});
        }
      } catch (error) {}
    }
  }

  var hlsLibraryPromise = null;
  function loadHlsLibrary() {
    if (window.Hls) { return Promise.resolve(); }
    if (hlsLibraryPromise) { return hlsLibraryPromise; }
    hlsLibraryPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js";
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    }).catch(function (error) {
      hlsLibraryPromise = null;
      throw error;
    });
    return hlsLibraryPromise;
  }

  function teardownHls() {
    if (state.hls) {
      state.hls.destroy();
      state.hls = null;
    }
  }

  function runSmartSearch() {
    var query = els.searchInput.value.trim();
    if (!query || !window.VHubAI) {
      state.activeSmartResult = null;
      renderHome();
      return;
    }

    state.smartSearchBusy = true;
    renderHome();
    window.VHubAI.smartSearch(query, state.movies, buildAIContext()).then(function (result) {
      state.activeSmartResult = {
        query: query,
        movies: result.movies || [],
        note: result.note || "AI đã lọc kết quả."
      };
      state.activeCategory = "all";
      state.smartSearchBusy = false;
      renderAll();
      showToast(state.activeSmartResult.note);
    }).catch(function (error) {
      state.smartSearchBusy = false;
      renderHome();
      showToast(error.message || "AI search chưa sẵn sàng.");
    });
  }

  function openAssistant() {
    closeSidePanels("assistant");
    els.assistantPanel.hidden = false;
    els.assistantButton.classList.add("active");
    if (!els.chatLog.children.length) {
      addChatMessage("assistant", "Mình có thể gợi ý phim theo mood, tóm tắt nội dung, giải thích thứ tự xem series, hoặc trả lời cách dùng website. Nếu chưa nhập Groq key, mình dùng AI offline ngay trong trình duyệt.");
    }
    focusElement(els.chatInput);
  }

  function closeAssistant() {
    els.assistantPanel.hidden = true;
    els.assistantButton.classList.remove("active");
    focusElement(els.assistantButton);
  }

  function closeSidePanels(except) {
    if (except !== "assistant") {
      els.assistantPanel.hidden = true;
      els.assistantButton.classList.remove("active");
    }
    if (except !== "admin") {
      els.adminPanel.hidden = true;
      els.adminButton.classList.remove("active");
    }
    if (except !== "history") {
      els.historyPanel.hidden = true;
      els.historyButton.classList.remove("active");
    }
  }

  function renderQuickPrompts() {
    var prompts = [
      "Gợi ý phim anime buồn nhưng đẹp hình ảnh",
      "Phim hành động có quái vật",
      "Phim giống Interstellar",
      "Giải thích thứ tự xem series này"
    ];
    els.quickPrompts.innerHTML = prompts.map(function (prompt) {
      return '<button class="chip-button" type="button" data-prompt="' + escapeAttr(prompt) + '" data-focusable>' + escapeHtml(prompt) + '</button>';
    }).join("");
  }

  function submitChatPrompt() {
    var prompt = els.chatInput.value.trim();
    if (!prompt || !window.VHubAI) {
      return;
    }
    els.chatInput.value = "";
    addChatMessage("user", prompt);
    addChatMessage("assistant", "Đang suy nghĩ...", true);

    window.VHubAI.assistantReply(prompt, state.movies, buildAIContext()).then(function (reply) {
      replacePendingChat(reply);
    }).catch(function (error) {
      replacePendingChat(error.message || "Mình chưa gọi được AI. Bạn kiểm tra Groq key hoặc dùng search offline nhé.");
    });
  }

  function addChatMessage(role, message, pending) {
    var article = document.createElement("article");
    article.className = "chat-message " + role;
    if (pending) {
      article.dataset.pending = "true";
    }
    article.textContent = message;
    els.chatLog.appendChild(article);
    els.chatLog.scrollTop = els.chatLog.scrollHeight;
  }

  function replacePendingChat(message) {
    var pending = els.chatLog.querySelector("[data-pending='true']");
    if (pending) {
      pending.removeAttribute("data-pending");
      pending.textContent = message;
    } else {
      addChatMessage("assistant", message);
    }
    els.chatLog.scrollTop = els.chatLog.scrollHeight;
  }

  function openAdmin() {
    closeSidePanels("admin");
    els.adminPanel.hidden = false;
    els.adminButton.classList.add("active");
    renderImportResult();
    focusElement(els.movieForm.elements.title);
  }

  function closeAdmin() {
    els.adminPanel.hidden = true;
    els.adminButton.classList.remove("active");
    focusElement(els.adminButton);
  }

  function addMovieFromForm() {
    var formData = new FormData(els.movieForm);
    var movie = {
      title: formData.get("title"),
      originalTitle: formData.get("originalTitle"),
      thumbnail: formData.get("thumbnail"),
      banner: formData.get("banner"),
      description: formData.get("description"),
      genres: splitList(formData.get("genres")),
      country: formData.get("country") || "Đang cập nhật",
      year: Number(formData.get("year")) || new Date().getFullYear(),
      status: formData.get("status") || "Hoàn thành",
      category: [],
      seasons: [
        {
          name: "Season 1",
          episodes: parseEpisodesText(formData.get("episodes"))
        }
      ],
      isNew: true
    };
    movie.category = inferCategories(movie);

    var result = validateMovieBatch([movie]);
    if (!result.valid) {
      els.importResult.textContent = result.errors.join("\n");
      return;
    }

    addImportedMovies([movie]);
    els.movieForm.reset();
    showToast("Đã thêm phim mới và hiển thị ngay.");
  }

  function importJsonMovies() {
    var raw = els.jsonImportInput.value.trim();
    if (!raw) {
      els.importResult.textContent = "Hãy dán object hoặc array JSON trước.";
      return;
    }

    try {
      var parsed = JSON.parse(raw);
      var movies = Array.isArray(parsed) ? parsed : [parsed];
      var result = validateMovieBatch(movies);
      if (!result.valid) {
        els.importResult.textContent = result.errors.join("\n");
        return;
      }
      addImportedMovies(movies);
      els.jsonImportInput.value = "";
      els.importResult.textContent = "Import thành công " + movies.length + " phim.";
      showToast("Đã import phim vào localStorage.");
    } catch (error) {
      els.importResult.textContent = "JSON không hợp lệ: " + error.message;
    }
  }

  function addImportedMovies(movies) {
    state.importedMovies = state.importedMovies.concat(movies.map(function (movie) {
      return Object.assign({}, movie, {
        id: movie.id || slugify(repairText(movie.title)),
        isNew: movie.isNew !== false,
        updatedAt: Date.now()
      });
    }));
    saveJson(STORAGE_KEYS.imported, state.importedMovies);
    rebuildMovieList();
    renderFilterOptions();
    renderAll();
    renderImportResult();
  }

  function validateMovieBatch(movies) {
    var errors = [];
    var existingIds = {};
    state.movies.forEach(function (movie) {
      existingIds[movie.id] = true;
    });
    var batchIds = {};

    movies.forEach(function (raw, index) {
      var label = "Phim #" + (index + 1);
      var title = repairText(raw.title || "");
      var id = raw.id || slugify(title);
      var episodes = collectRawEpisodes(raw);

      if (!title) {
        errors.push(label + ": thiếu tên phim.");
      }
      if (!isValidUrl(raw.thumbnail)) {
        errors.push(label + ": thumbnail không hợp lệ.");
      }
      if (!raw.description) {
        errors.push(label + ": thiếu mô tả.");
      }
      if (!episodes.length) {
        errors.push(label + ": thiếu danh sách tập.");
      }
      episodes.forEach(function (episode, episodeIndex) {
        if (!isValidUrl(episode.videoUrl || episode.embedUrl || episode.url)) {
          errors.push(label + " tập " + (episodeIndex + 1) + ": link nhúng không hợp lệ.");
        }
      });
      if (existingIds[id] || batchIds[id]) {
        errors.push(label + ": trùng slug/id " + id + ".");
      }
      batchIds[id] = true;
    });

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  function collectRawEpisodes(movie) {
    if (Array.isArray(movie.episodes)) {
      return movie.episodes;
    }
    return (movie.seasons || []).reduce(function (list, season) {
      return list.concat(season.episodes || []);
    }, []);
  }

  function exportImportedMovies() {
    var text = JSON.stringify(state.importedMovies, null, 2);
    els.importResult.textContent = text || "Chưa có phim import.";
    if (navigator.clipboard && text) {
      navigator.clipboard.writeText(text).then(function () {
        showToast("Đã copy JSON phim import.");
      }).catch(function () {
        showToast("JSON đã hiển thị ở khung kết quả.");
      });
    }
  }

  function clearImportedMovies() {
    if (!state.importedMovies.length) {
      showToast("Chưa có phim import để xóa.");
      return;
    }
    if (!window.confirm("Xóa toàn bộ phim đã import trên trình duyệt này?")) {
      return;
    }
    state.importedMovies = [];
    saveJson(STORAGE_KEYS.imported, state.importedMovies);
    rebuildMovieList();
    renderFilterOptions();
    renderAll();
    renderImportResult();
    showToast("Đã xóa phim import.");
  }

  function renderImportResult() {
    els.importResult.textContent = state.importedMovies.length ? "Đang lưu local " + state.importedMovies.length + " phim import." : "Chưa có phim import.";
  }

  function openHistoryPanel() {
    closeSidePanels("history");
    els.historyPanel.hidden = false;
    els.historyButton.classList.add("active");
    renderHistoryPanel();
    focusElement(els.historyPanel.querySelector("[data-focusable]") || els.closeHistoryButton);
  }

  function closeHistoryPanel() {
    els.historyPanel.hidden = true;
    els.historyButton.classList.remove("active");
    focusElement(els.historyButton);
  }

  function renderHistoryPanel() {
    if (!state.history.length) {
      els.historyList.innerHTML = '<p class="empty-note">Chưa có lịch sử xem.</p>';
      return;
    }
    els.historyList.innerHTML = [
      '<button class="ghost-button history-clear" type="button" data-clear-history data-focusable>Xóa toàn bộ lịch sử</button>',
      state.history.slice(0, 80).map(function (entry) {
        var movie = findMovie(entry.movieId);
        if (!movie) {
          return "";
        }
        return [
          '<article class="history-item">',
          '<img src="' + escapeAttr(movie.thumbnail) + '" alt="' + escapeAttr(movie.title) + '" loading="lazy">',
          '<div>',
          '<strong>' + escapeHtml(movie.title) + '</strong>',
          '<span>' + escapeHtml(entry.episodeTitle || "Đang xem") + ' · ' + escapeHtml(formatDate(entry.updatedAt || entry.watchedAt)) + '</span>',
          '</div>',
          '<button class="secondary-button compact" type="button" data-open-history="' + escapeAttr(movie.id) + '" data-focusable>Xem tiếp</button>',
          '<button class="ghost-button compact" type="button" data-remove-history="' + escapeAttr(movie.id) + '" data-focusable>Xóa phim</button>',
          '</article>'
        ].join("");
      }).join("")
    ].join("");

    var clearButton = els.historyList.querySelector("[data-clear-history]");
    if (clearButton) {
      clearButton.addEventListener("click", clearAllHistory, { once: true });
    }
  }

  function clearAllHistory() {
    state.progress = {};
    state.history = [];
    saveJson(STORAGE_KEYS.progress, state.progress);
    saveJson(STORAGE_KEYS.history, state.history);
    renderAll();
    renderHistoryPanel();
    showToast("Đã xóa toàn bộ lịch sử xem.");
  }

  function removeMovieHistory(movieId) {
    delete state.progress[movieId];
    state.history = state.history.filter(function (entry) {
      return entry.movieId !== movieId;
    });
    saveJson(STORAGE_KEYS.progress, state.progress);
    saveJson(STORAGE_KEYS.history, state.history);
    renderAll();
    renderHistoryPanel();
  }

  function playRandomMovie() {
    var pool = getFilteredMovies();
    if (!pool.length) {
      pool = state.movies;
    }
    var movie = pool[Math.floor(Math.random() * pool.length)];
    if (movie) {
      openDetail(movie.id);
    }
  }

  function shareCurrentMovie() {
    var movie = getActiveMovie();
    if (!movie) {
      return;
    }
    var url = buildMovieUrl(movie.id, state.activeSeasonIndex, state.activeEpisodeIndex, false);
    if (navigator.share) {
      navigator.share({
        title: movie.title,
        text: movie.description || movie.title,
        url: url
      }).catch(function () {});
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () {
        showToast("Đã copy link phim.");
      }).catch(function () {
        showToast(url);
      });
    } else {
      showToast(url);
    }
  }

  function addHistoryEntry(movie, episode, watched) {
    var key = movie.id + ":" + state.activeSeasonIndex + ":" + state.activeEpisodeIndex;
    state.history = state.history.filter(function (entry) {
      return entry.key !== key;
    });
    state.history.unshift({
      key: key,
      movieId: movie.id,
      seasonIndex: state.activeSeasonIndex,
      episodeIndex: state.activeEpisodeIndex,
      episodeTitle: episode.title || "",
      currentTime: getCurrentPlaybackTime({}),
      watched: Boolean(watched),
      updatedAt: Date.now()
    });
    state.history = state.history.slice(0, 160);
    saveJson(STORAGE_KEYS.history, state.history);
  }

  function buildAIContext() {
    return {
      activeMovie: getActiveMovie(),
      favorites: state.favorites.map(findMovie).filter(Boolean),
      history: state.history.map(function (entry) {
        return Object.assign({}, entry, { movie: findMovie(entry.movieId) });
      }).filter(function (entry) {
        return Boolean(entry.movie);
      }),
      ratings: state.ratings
    };
  }

  function updateRouteForCurrent(isPlaying, push) {
    var movie = getActiveMovie();
    if (!movie) {
      return;
    }
    var url = buildMovieUrl(movie.id, state.activeSeasonIndex, state.activeEpisodeIndex, isPlaying);
    if (push) {
      window.history.pushState({}, "", url);
    } else {
      window.history.replaceState({}, "", url);
    }
  }

  function replaceRoute() {
    window.history.replaceState({}, "", window.location.pathname);
  }

  function buildMovieUrl(movieId, seasonIndex, episodeIndex, play) {
    var url = new URL(window.location.href);
    url.searchParams.set("movie", movieId);
    url.searchParams.set("season", String(seasonIndex || 0));
    url.searchParams.set("episode", String(episodeIndex || 0));
    if (play) {
      url.searchParams.set("play", "1");
    } else {
      url.searchParams.delete("play");
    }
    return url.pathname + url.search + url.hash;
  }

  function applyRouteFromUrl(shouldPush) {
    var params = new URLSearchParams(window.location.search);
    var movieId = params.get("movie");
    if (!movieId) {
      return;
    }
    var movie = findMovie(movieId);
    if (!movie) {
      return;
    }
    var seasonIndex = Number(params.get("season") || 0);
    var episodeIndex = Number(params.get("episode") || 0);
    openDetail(movieId, {
      seasonIndex: clampIndex(seasonIndex, movie.seasons.length),
      episodeIndex: clampIndex(episodeIndex, (movie.seasons[seasonIndex] && movie.seasons[seasonIndex].episodes.length) || 1),
      play: false,
      replaceRoute: !shouldPush
    });
  }

  function updateSeo(movie) {
    var title = movie ? movie.title + " - V Hub" : "V Hub - Rạp phim tại nhà";
    var description = movie ? String(movie.description || "").slice(0, 155) : "Web xem phim tĩnh tối ưu cho TV, AI gợi ý phim, lịch sử xem, yêu thích và import phim.";
    var image = movie ? movie.banner || movie.thumbnail : "https://dummyimage.com/1200x630/050505/f5f1e8&text=V+Hub";

    document.title = title;
    setMeta("description", description);
    setMetaProperty("og:title", title);
    setMetaProperty("og:description", description);
    setMetaProperty("og:image", image);
    setMeta("twitter:card", "summary_large_image");

    var structured = movie ? {
      "@context": "https://schema.org",
      "@type": "Movie",
      "name": movie.title,
      "alternateName": movie.originalTitle || undefined,
      "description": description,
      "image": image,
      "datePublished": movie.year ? String(movie.year) : undefined,
      "genre": movie.genres || [],
      "countryOfOrigin": movie.country || undefined
    } : {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "V Hub",
      "url": window.location.origin + window.location.pathname,
      "potentialAction": {
        "@type": "SearchAction",
        "target": window.location.origin + window.location.pathname + "?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    };

    els.structuredData.textContent = JSON.stringify(structured);
  }

  function setMeta(name, content) {
    var tag = document.querySelector('meta[name="' + name + '"]');
    if (tag) {
      tag.setAttribute("content", content);
    }
  }

  function setMetaProperty(property, content) {
    var tag = document.querySelector('meta[property="' + property + '"]');
    if (tag) {
      tag.setAttribute("content", content);
    }
  }

  function normalizeRemoteKey(event) {
    var key = event.key || "";
    var code = event.code || "";
    var keyCode = event.keyCode || event.which || 0;

    if (key === "Up" || code === "ArrowUp" || keyCode === 38 || keyCode === 19) {
      return "ArrowUp";
    }
    if (key === "Down" || code === "ArrowDown" || keyCode === 40 || keyCode === 20) {
      return "ArrowDown";
    }
    if (key === "Left" || code === "ArrowLeft" || keyCode === 37 || keyCode === 21) {
      return "ArrowLeft";
    }
    if (key === "Right" || code === "ArrowRight" || keyCode === 39 || keyCode === 22) {
      return "ArrowRight";
    }
    if (key === "OK" || key === "Select" || key === "Accept" || code === "Enter" || keyCode === 13 || keyCode === 23) {
      return "Enter";
    }
    if (key === "Esc" || key === "Back" || key === "GoBack" || key === "BrowserBack" || key === "XF86Back" || keyCode === 27 || keyCode === 4 || keyCode === 461 || keyCode === 10009) {
      return "Escape";
    }
    if (key === "MediaPlayPause" || keyCode === 179 || keyCode === 10252) {
      return "MediaPlayPause";
    }
    if (key === " " || key === "Spacebar" || code === "Space" || keyCode === 32) {
      return " ";
    }
    return key;
  }

  function shouldHandleKeyEvent(event, key) {
    if (!key) {
      return false;
    }
    if (event.type === "keydown") {
      keyGuard.down[key] = true;
    }
    if (event.type === "keyup") {
      var now = Date.now();
      if (keyGuard.down[key]) {
        delete keyGuard.down[key];
        return false;
      }
      if (keyGuard.key === key && now - keyGuard.time < 180) {
        return false;
      }
    }
    keyGuard.key = key;
    keyGuard.time = Date.now();
    return true;
  }

  function handleGlobalKeys(event) {
    var active = document.activeElement;
    var key = normalizeRemoteKey(event);

    if (!shouldHandleKeyEvent(event, key)) {
      return;
    }
    if (key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight") {
      document.body.classList.add("tv-remote-mode");
    }

    if (!els.finishedModal.hidden && (key === "Escape" || key === "Backspace")) {
      event.preventDefault();
      els.finishedModal.hidden = true;
      closePlayer();
      return;
    }

    if (!els.playerView.hidden) {
      handlePlayerKeys(event);
      return;
    }

    if (isTypingTarget(active)) {
      if (key === "Escape") {
        active.blur();
      }
      return;
    }

    if (key === "Escape" || key === "Backspace") {
      event.preventDefault();
      if (!els.assistantPanel.hidden) {
        closeAssistant();
      } else if (!els.adminPanel.hidden) {
        closeAdmin();
      } else if (!els.historyPanel.hidden) {
        closeHistoryPanel();
      } else if (!els.detailView.hidden) {
        closeDetail();
      }
      return;
    }

    if (key.toLowerCase && key.toLowerCase() === "r") {
      playRandomMovie();
      return;
    }

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(key) !== -1) {
      if (active && active.tagName === "SELECT") { return; }
      if (!isTypingTarget(active)) { moveFocus(event); }
      return;
    }

    if (key === "Enter" && active && active.matches("button, [data-focusable], select")) {
      event.preventDefault();
      active.click();
    }
  }

  function handlePlayerKeys(event) {
    var key = normalizeRemoteKey(event);
    showPlayerControls(false);
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(key) !== -1) {
      if (document.activeElement && document.activeElement.tagName === "SELECT") { return; }
      if (document.activeElement !== els.iframePlayer) { moveFocus(event); }
      return;
    }
    if (key === "Enter" && document.activeElement &&
        document.activeElement.matches("button, [data-focusable]") &&
        document.activeElement !== els.videoPlayer && document.activeElement !== els.iframePlayer) {
      event.preventDefault();
      document.activeElement.click();
      return;
    }
    if (key === "Escape" || key === "Backspace") {
      event.preventDefault();
      closePlayer();
      return;
    }
    if (key.toLowerCase && key.toLowerCase() === "n") {
      event.preventDefault();
      playNextEpisode();
      return;
    }
    if (key.toLowerCase && key.toLowerCase() === "p") {
      event.preventDefault();
      playPreviousEpisode();
      return;
    }
    if (key.toLowerCase && key.toLowerCase() === "f") {
      event.preventDefault();
      enterLandscapePlayback(true);
      return;
    }
    if ((key === " " || key === "MediaPlayPause" || key.toLowerCase && key.toLowerCase() === "k") && !els.videoPlayer.hidden) {
      event.preventDefault();
      if (els.videoPlayer.paused) {
        els.videoPlayer.play().catch(function () {});
      } else {
        els.videoPlayer.pause();
      }
    }
  }

  function moveFocus(event) {
    var active = document.activeElement;
    var root = getFocusRoot();
    var key = normalizeRemoteKey(event);
    var candidates = Array.prototype.slice.call(root.querySelectorAll("[data-focusable], button, input, select, textarea, video, iframe, summary")).filter(function (element) {
      return element !== els.iframePlayer && isVisible(element) && !element.disabled;
    });

    if (!active || candidates.indexOf(active) === -1) {
      focusElement(candidates[0]);
      return;
    }

    var currentRect = active.getBoundingClientRect();
    var direction = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 }
    }[key];

    var next = candidates.reduce(function (best, element) {
      if (element === active) {
        return best;
      }
      var rect = element.getBoundingClientRect();
      var deltaX = centerX(rect) - centerX(currentRect);
      var deltaY = centerY(rect) - centerY(currentRect);
      var primary = direction.x ? deltaX * direction.x : deltaY * direction.y;
      var secondary = direction.x ? Math.abs(deltaY) : Math.abs(deltaX);
      if (primary <= 8) {
        return best;
      }
      var score = primary * 2 + secondary;
      return !best || score < best.score ? { element: element, score: score } : best;
    }, null);

    if (next) {
      event.preventDefault();
      focusElement(next.element);
      try {
        next.element.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
      } catch (error) { next.element.scrollIntoView(false); }
    }
  }

  function getFocusRoot() {
    if (!els.finishedModal.hidden) {
      return els.finishedModal;
    }
    if (!els.playerView.hidden) {
      return els.playerView;
    }
    if (!els.assistantPanel.hidden) {
      return els.assistantPanel;
    }
    if (!els.adminPanel.hidden) {
      return els.adminPanel;
    }
    if (!els.historyPanel.hidden) {
      return els.historyPanel;
    }
    if (!els.detailView.hidden) {
      return els.detailView;
    }
    return document;
  }

  function normalizeMovies(movies, source) {
    return (movies || []).map(function (movie, index) {
      return normalizeMovie(movie, index, source);
    }).filter(Boolean);
  }

  function normalizeMovie(movie, index, source) {
    var title = repairText(movie.title || movie.name || "Phim " + (index + 1));
    var id = movie.id || movie.slug || slugify(title) || "movie-" + index;
    var seasons = normalizeSeasons(movie, title);
    var genres = normalizeList(movie.genres || movie.genre).map(repairText);
    var categories = normalizeList(movie.categories && movie.categories.length ? movie.categories : movie.category).map(repairText);

    if (!categories.length) {
      categories = inferCategories({ genres: genres, seasons: seasons });
    }

    return {
      id: slugify(id),
      title: title,
      originalTitle: repairText(movie.originalTitle || movie.original_name || movie.originalName || ""),
      thumbnail: movie.thumbnail || movie.poster || movie.image || createPosterPlaceholder(title, false),
      banner: movie.banner || movie.backdrop || movie.thumbnail || movie.poster || "",
      description: repairText(movie.description || movie.overview || ""),
      category: categories,
      categories: categories,
      genres: genres,
      country: repairText(movie.country || movie.nation || "Đang cập nhật"),
      year: Number(movie.year || movie.releaseYear || movie.release_date && String(movie.release_date).slice(0, 4)) || "",
      status: repairText(movie.status || "Hoàn thành"),
      isNew: movie.isNew !== false,
      views: Number(movie.views || 0),
      rating: Number(movie.rating || movie.score || 0),
      runtimeMinutes: Number(movie.runtimeMinutes || movie.durationMinutes || movie.runtime || 0),
      updatedAt: Number(movie.updatedAt || 0),
      source: source,
      seasons: seasons
    };
  }

  function normalizeSeasons(movie, movieTitle) {
    var seasons = Array.isArray(movie.seasons) && movie.seasons.length ? movie.seasons : [
      {
        name: movie.seasonName || "Season 1",
        episodes: Array.isArray(movie.episodes) ? movie.episodes : []
      }
    ];

    return seasons.map(function (season, seasonIndex) {
      var episodes = (season.episodes || []).map(function (episode, episodeIndex) {
        return {
          id: episode.id || "s" + (seasonIndex + 1) + "e" + (episodeIndex + 1),
          title: repairText(episode.title || episode.name || "Tập " + (episodeIndex + 1)),
          videoUrl: episode.videoUrl || episode.embedUrl || episode.url || "",
          durationSeconds: Number(episode.durationSeconds || episode.duration || 0)
        };
      });

      if (!episodes.length && movie.videoUrl) {
        episodes.push({
          id: "movie",
          title: movieTitle,
          videoUrl: movie.videoUrl,
          durationSeconds: Number(movie.durationSeconds || 0)
        });
      }

      return {
        name: repairText(season.name || "Mùa " + (seasonIndex + 1)),
        episodes: episodes
      };
    });
  }

  function inferCategories(movie) {
    var episodeCount = (movie.seasons || []).reduce(function (total, season) {
      return total + (season.episodes || []).length;
    }, 0);
    var genres = (movie.genres || []).map(function (genre) {
      return normalizeText(genre);
    });
    var categories = [episodeCount > 1 ? "Phim bộ" : "Phim lẻ"];
    if (genres.some(function (genre) {
      return /anime|hoat hinh|animation/.test(genre);
    })) {
      categories.push("Hoạt hình");
    }
    return categories;
  }

  function parseEpisodesText(value) {
    return String(value || "").split(/\n+/).map(function (line, index) {
      var clean = line.trim();
      if (!clean) {
        return null;
      }
      var urlMatch = clean.match(/https?:\/\/\S+/);
      if (!urlMatch) {
        return null;
      }
      var title = clean.slice(0, urlMatch.index).replace(/[:\-–—]+$/, "").trim() || "Tập " + (index + 1);
      return {
        id: "ep-" + (index + 1),
        title: repairText(title),
        videoUrl: urlMatch[0]
      };
    }).filter(Boolean);
  }

  function getContinueMovies() {
    return state.movies.filter(function (movie) {
      return Boolean(state.progress[movie.id]);
    }).sort(function (a, b) {
      return (state.progress[b.id].updatedAt || 0) - (state.progress[a.id].updatedAt || 0);
    });
  }

  function getWatchedEpisodeCount(movie) {
    var progress = state.progress[movie.id];
    var watched = progress && progress.watched || {};
    return flattenEpisodes(movie).filter(function (item) {
      return Boolean(watched[getEpisodeKey(item.seasonIndex, item.episodeIndex)]);
    }).length;
  }

  function getEpisodeStatus(movieId, seasonIndex, episodeIndex) {
    var progress = state.progress[movieId];
    if (!progress) {
      return "Chưa xem";
    }
    var key = getEpisodeKey(seasonIndex, episodeIndex);
    if (progress.watched && progress.watched[key]) {
      return "Đã xem";
    }
    if (progress.seasonIndex === seasonIndex && progress.episodeIndex === episodeIndex) {
      return progress.currentTime > 0 ? "Đang xem" : "Đã mở";
    }
    return "Chưa xem";
  }

  function getEpisodeProgress(movieId, seasonIndex, episodeIndex) {
    var progress = state.progress[movieId];
    if (!progress || progress.seasonIndex !== seasonIndex || progress.episodeIndex !== episodeIndex) {
      return 0;
    }
    return getProgressWidth(progress);
  }

  function getProgressWidth(progress) {
    if (!progress) {
      return 0;
    }
    if (progress.duration > 0 && progress.currentTime > 0) {
      return Math.max(5, Math.min(100, Math.round(progress.currentTime / progress.duration * 100)));
    }
    return progress.currentTime > 0 ? 14 : 7;
  }

  function getProgressText(progress) {
    var width = getProgressWidth(progress);
    if (width >= 100) {
      return "Đã xem";
    }
    return width > 14 ? width + "%" : "Đang xem";
  }

  function getDisplayRating(movie) {
    return Number(state.ratings[movie.id] || movie.rating || 7.6);
  }

  function getRelativeEpisode(offset) {
    var movie = getActiveMovie();
    var flat = flattenEpisodes(movie);
    var currentIndex = flat.findIndex(function (item) {
      return item.seasonIndex === state.activeSeasonIndex && item.episodeIndex === state.activeEpisodeIndex;
    });
    return currentIndex === -1 ? null : flat[currentIndex + offset] || null;
  }

  function hasNextEpisode() {
    return Boolean(getRelativeEpisode(1));
  }

  function flattenEpisodes(movie) {
    if (!movie) {
      return [];
    }
    return movie.seasons.reduce(function (items, season, seasonIndex) {
      (season.episodes || []).forEach(function (episode, episodeIndex) {
        items.push({
          seasonIndex: seasonIndex,
          episodeIndex: episodeIndex,
          season: season,
          episode: episode
        });
      });
      return items;
    }, []);
  }

  function countEpisodes(movie) {
    return flattenEpisodes(movie).length;
  }

  function getLastEpisodeIndex(movie, seasonIndex) {
    var progress = state.progress[movie.id];
    var season = movie.seasons[seasonIndex];
    if (progress && progress.seasonIndex === seasonIndex && season && season.episodes[progress.episodeIndex]) {
      return progress.episodeIndex;
    }
    return 0;
  }

  function getSavedSelection(movie, progress) {
    var seasonIndex = progress ? Number(progress.seasonIndex) : 0;
    var episodeIndex = progress ? Number(progress.episodeIndex) : 0;
    var season = movie.seasons[seasonIndex];
    if (!season || !season.episodes[episodeIndex]) {
      return { seasonIndex: 0, episodeIndex: 0 };
    }
    return { seasonIndex: seasonIndex, episodeIndex: episodeIndex };
  }

  function getStoredCurrentTime(movieId, seasonIndex, episodeIndex) {
    var progress = state.progress[movieId];
    if (!progress || progress.seasonIndex !== seasonIndex || progress.episodeIndex !== episodeIndex) {
      return 0;
    }
    var key = getEpisodeKey(seasonIndex, episodeIndex);
    if (progress.watched && progress.watched[key]) {
      return 0;
    }
    return Number(progress.currentTime || 0);
  }

  function getEpisodeLabel(movie, seasonIndex, episodeIndex) {
    var season = movie && movie.seasons[seasonIndex || 0];
    var episode = season && season.episodes[episodeIndex || 0];
    return episode ? episode.title : "Đang xem";
  }

  function getEpisodeKey(seasonIndex, episodeIndex) {
    return "s" + seasonIndex + "e" + episodeIndex;
  }

  function getActiveMovie() {
    return findMovie(state.activeMovieId);
  }

  function getActiveEpisode() {
    var movie = getActiveMovie();
    var season = movie && movie.seasons[state.activeSeasonIndex];
    return season && season.episodes[state.activeEpisodeIndex] || null;
  }

  function findMovie(movieId) {
    return state.movies.find(function (movie) {
      return movie && movie.id === movieId;
    });
  }

  function getMovieCategories(movie) {
    return normalizeList(movie.categories && movie.categories.length ? movie.categories : movie.category);
  }

  function getMovieCategoryText(movie) {
    var categories = getMovieCategories(movie);
    return categories.length ? categories.join(" · ") : "Phim";
  }

  function hasSharedGenre(a, b) {
    return getSharedGenreCount(a, b) > 0;
  }

  function getSharedGenreCount(a, b) {
    var genres = {};
    (a.genres || []).forEach(function (genre) {
      genres[normalizeText(genre)] = true;
    });
    return (b.genres || []).filter(function (genre) {
      return genres[normalizeText(genre)];
    }).length;
  }

  function getFiniteVideoDuration() {
    return Number.isFinite(els.videoPlayer.duration) ? els.videoPlayer.duration : 0;
  }

  function inferEpisodeDuration(movie, episode) {
    if (episode && episode.durationSeconds) {
      return Number(episode.durationSeconds);
    }
    if (movie && movie.runtimeMinutes) {
      return Number(movie.runtimeMinutes) * 60;
    }
    return countEpisodes(movie) > 1 ? 24 * 60 : 95 * 60;
  }

  function isHlsUrl(url) {
    return /\.m3u8($|\?)/i.test(url);
  }
function isEmbedUrl(url) {
    return /youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|ok\.ru|drive\.google\.com|mega\.nz|streamc\.xyz|\/embed(?:\/|\.php)/i.test(url);
}

  function normalizeSourceUrl(url, resumeSeconds) {
    var value = String(url || "").trim();
    if (!value) {
      return "";
    }

    var youtubeId = getYoutubeId(value);
    if (youtubeId) {
      var start = resumeSeconds > 5 ? "&start=" + Math.floor(resumeSeconds) : "";
      return "https://www.youtube.com/embed/" + youtubeId + "?autoplay=1&rel=0" + start;
    }

    if (/drive\.google\.com/i.test(value)) {
      var fileMatch = value.match(/\/file\/d\/([^/?#]+)/i);
      if (fileMatch) {
        return "https://drive.google.com/file/d/" + fileMatch[1] + "/preview";
      }
      var idMatch = value.match(/[?&]id=([^&#]+)/i);
      if (idMatch) {
        return "https://drive.google.com/file/d/" + idMatch[1] + "/preview";
      }
    }

    if (/mega\.nz\/file\//i.test(value)) {
      return value.replace("/file/", "/embed/");
    }

    return value;
  }

  function getYoutubeId(url) {
    var watchMatch = url.match(/[?&]v=([^&#]+)/i);
    var shortMatch = url.match(/youtu\.be\/([^?&#]+)/i);
    var embedMatch = url.match(/youtube\.com\/embed\/([^?&#]+)/i);
    var id = watchMatch && watchMatch[1] || shortMatch && shortMatch[1] || embedMatch && embedMatch[1];
    return id ? id.replace(/[^a-zA-Z0-9_-]/g, "") : "";
  }

  function splitList(value) {
    return String(value || "").split(/[,;\n]+/).map(function (item) {
      return repairText(item.trim());
    }).filter(Boolean);
  }

  function normalizeList(value) {
    if (Array.isArray(value)) {
      return value.map(function (item) {
        return repairText(String(item || "").trim());
      }).filter(Boolean);
    }
    if (!value) {
      return [];
    }
    return splitList(value);
  }

  function repairText(value) {
    var text = String(value || "");
    if (!/[ÃÂâ]/.test(text)) {
      return text;
    }
    try {
      return decodeURIComponent(escape(text));
    } catch (error) {
      return text;
    }
  }

  function normalizeText(value) {
    if (window.VHubAI && window.VHubAI.normalizeText) {
      return window.VHubAI.normalizeText(value);
    }
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");
  }

  function slugify(value) {
    return normalizeText(repairText(value)).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function uniqueSlug(base, used) {
    var root = slugify(base) || "movie";
    var slug = root;
    var index = 2;
    while (used[slug]) {
      slug = root + "-" + index;
      index += 1;
    }
    return slug;
  }

  function isValidUrl(value) {
    try {
      var url = new URL(String(value || ""));
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (error) {
      return false;
    }
  }

  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var args = arguments;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        fn.apply(null, args);
      }, wait);
    };
  }

  function focusElement(element) {
    if (element && typeof element.focus === "function") {
      try {
        element.focus({ preventScroll: true });
      } catch (error) {
        element.focus();
      }
    }
  }

  function isVisible(element) {
    if (!element || element.hidden) {
      return false;
    }
    var rect = element.getBoundingClientRect();
    var style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  }

  function isTypingTarget(element) {
    return element && element.matches("input, textarea");
  }

  function isArrowEditingControl(element) {
    return element && element.matches("input, textarea, select, video, iframe");
  }

  function centerX(rect) {
    return rect.left + rect.width / 2;
  }

  function centerY(rect) {
    return rect.top + rect.height / 2;
  }

  function clampIndex(index, length) {
    if (!Number.isFinite(index) || index < 0) {
      return 0;
    }
    return Math.min(index, Math.max(0, length - 1));
  }

  function toggleTheme() {
    state.settings.theme = state.settings.theme === "amoled" ? "netflix" : "amoled";
    saveJson(STORAGE_KEYS.settings, state.settings);
    applyTheme();
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.settings.theme === "amoled" ? "amoled" : "netflix";
    els.themeButton.textContent = state.settings.theme === "amoled" ? "Màu mặc định" : "Nền AMOLED";
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || !/^https?:$/.test(window.location.protocol)) {
      return;
    }
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }

  function handleImageError(event) {
    var image = event.target;
    if (!image || image.tagName !== "IMG" || image.dataset.fallbackApplied) {
      return;
    }
    image.dataset.fallbackApplied = "true";
    image.src = createPosterPlaceholder(image.alt || "V Hub", image.classList.contains("continue-thumb"));
  }

  function createPosterPlaceholder(title, isWide) {
    var width = isWide ? 960 : 640;
    var height = isWide ? 540 : 960;
    var safeTitle = escapeHtml(title).slice(0, 80);
    var svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + " " + height + '">',
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#101e2e"/><stop offset="1" stop-color="#183b46"/></linearGradient></defs>',
      '<rect width="100%" height="100%" fill="url(#g)"/>',
      '<circle cx="' + width * 0.78 + '" cy="' + height * 0.18 + '" r="' + width * 0.22 + '" fill="#65dec9" opacity="0.18"/>',
      '<text x="50%" y="46%" fill="#fff8ec" font-family="Arial, sans-serif" font-size="' + (isWide ? 64 : 58) + '" font-weight="700" text-anchor="middle">V Hub</text>',
      '<text x="50%" y="56%" fill="#f6ddaa" font-family="Arial, sans-serif" font-size="' + (isWide ? 28 : 30) + '" text-anchor="middle">' + safeTitle + '</text>',
      '</svg>'
    ].join("");
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  function formatDate(timestamp) {
    if (!timestamp) {
      return "vừa xong";
    }
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(timestamp));
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }

  function escapeCssUrl(value) {
    return String(value || "").replace(/['"\\\n\r]/g, function (char) {
      return "\\" + char;
    });
  }

  function loadJsonWithLegacy(key, legacyKey, fallback) {
    var primary = loadJson(key, null);
    if (primary !== null) {
      return primary;
    }
    return loadJson(legacyKey, fallback);
  }

  function loadJson(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      showToast("Không thể lưu dữ liệu trên trình duyệt này.");
    }
  }

  var toastTimer = null;
  function showToast(message) {
    window.clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.hidden = false;
    toastTimer = window.setTimeout(function () {
      els.toast.hidden = true;
    }, 2800);
  }
})();
