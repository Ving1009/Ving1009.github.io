(function () {
  "use strict";

  var STORAGE_KEYS = {
    progress: "tv_movie_hub_progress",
    favorites: "tv_movie_hub_favorites",
    settings: "tv_movie_hub_settings"
  };

  var CATEGORY_ITEMS = [
    { id: "new", label: "Phim mới" },
    { id: "movie", label: "Phim lẻ" },
    { id: "series", label: "Phim bộ" },
    { id: "animation", label: "Hoạt hình" },
    { id: "show", label: "TV Show" },
    { id: "favorites", label: "Yêu thích" },
    { id: "continue", label: "Tiếp tục xem" }
  ];

  var CATEGORY_TO_NAME = {
    movie: "Phim lẻ",
    series: "Phim bộ",
    animation: "Hoạt hình",
    show: "TV Show"
  };

  var state = {
    movies: normalizeMovies(window.MOVIE_DATA || []),
    activeCategory: "new",
    activeMovieId: null,
    activeSeasonIndex: 0,
    activeEpisodeIndex: 0,
    hls: null,
    lastFocused: null,
    progress: loadJson(STORAGE_KEYS.progress, {}),
    favorites: loadJson(STORAGE_KEYS.favorites, []),
    settings: loadJson(STORAGE_KEYS.settings, { autoplay: true })
  };

  var els = {
    categoryNav: document.getElementById("categoryNav"),
    pageTitle: document.getElementById("pageTitle"),
    gridTitle: document.getElementById("gridTitle"),
    resultCount: document.getElementById("resultCount"),
    searchInput: document.getElementById("searchInput"),
    genreFilter: document.getElementById("genreFilter"),
    movieGrid: document.getElementById("movieGrid"),
    continueSection: document.getElementById("continueSection"),
    continueRow: document.getElementById("continueRow"),
    clearHistoryButton: document.getElementById("clearHistoryButton"),
    detailView: document.getElementById("detailView"),
    detailBackdrop: document.getElementById("detailBackdrop"),
    detailPoster: document.getElementById("detailPoster"),
    detailCategory: document.getElementById("detailCategory"),
    detailTitle: document.getElementById("detailTitle"),
    detailDescription: document.getElementById("detailDescription"),
    detailMeta: document.getElementById("detailMeta"),
    detailActions: document.querySelector(".detail-actions"),
    closeDetailButton: document.getElementById("closeDetailButton"),
    playButton: document.getElementById("playButton"),
    favoriteButton: document.getElementById("favoriteButton"),
    seasonTabs: document.getElementById("seasonTabs"),
    episodeGrid: document.getElementById("episodeGrid"),
    playerView: document.getElementById("playerView"),
    closePlayerButton: document.getElementById("closePlayerButton"),
    playerMovieTitle: document.getElementById("playerMovieTitle"),
    playerEpisodeTitle: document.getElementById("playerEpisodeTitle"),
    playerFrame: document.getElementById("playerFrame"),
    videoPlayer: document.getElementById("videoPlayer"),
    iframePlayer: document.getElementById("iframePlayer"),
    autoplayToggle: document.getElementById("autoplayToggle"),
    prevEpisodeButton: document.getElementById("prevEpisodeButton"),
    nextEpisodeButton: document.getElementById("nextEpisodeButton"),
    fullscreenButton: document.getElementById("fullscreenButton"),
    toast: document.getElementById("toast")
  };

  init();

  function init() {
    renderNavigation();
    renderGenres();
    bindEvents();
    renderHome();
    setupSpatialNavigation();
    focusFirstItem();
  }

  function normalizeMovies(movies) {
    return movies.map(function (movie, movieIndex) {
      var movieId = movie.id || slugify(movie.title || "movie-" + movieIndex);
      var seasons = (movie.seasons || []).map(function (season, seasonIndex) {
        var episodes = (season.episodes || []).map(function (episode, episodeIndex) {
          return Object.assign({}, episode, {
            id: episode.id || "s" + (seasonIndex + 1) + "e" + (episodeIndex + 1),
            title: episode.title || "Tập " + (episodeIndex + 1)
          });
        });

        return Object.assign({}, season, {
          name: season.name || "Mùa " + (seasonIndex + 1),
          episodes: episodes
        });
      });

      return Object.assign({}, movie, {
        id: movieId,
        seasons: seasons,
        genres: movie.genres || []
      });
    });
  }

  function renderNavigation() {
    els.categoryNav.innerHTML = CATEGORY_ITEMS.map(function (item) {
      var count = getCategoryMovies(item.id).length;
      return [
        '<button class="nav-button" type="button" data-category="' + item.id + '" data-focusable>',
        "<span>" + escapeHtml(item.label) + "</span>",
        '<span class="nav-count">' + count + "</span>",
        "</button>"
      ].join("");
    }).join("");
    setActiveNav();
  }

  function renderGenres() {
    var genres = state.movies.reduce(function (all, movie) {
      movie.genres.forEach(function (genre) {
        if (all.indexOf(genre) === -1) {
          all.push(genre);
        }
      });
      return all;
    }, []).sort();

    els.genreFilter.innerHTML = '<option value="all">Tất cả thể loại</option>' + genres.map(function (genre) {
      return '<option value="' + escapeAttr(genre) + '">' + escapeHtml(genre) + "</option>";
    }).join("");
  }

  function bindEvents() {
    els.categoryNav.addEventListener("click", function (event) {
      var button = event.target.closest("[data-category]");
      if (!button) {
        return;
      }
      state.activeCategory = button.dataset.category;
      renderHome();
      setActiveNav();
      focusFirstItem();
    });

    els.searchInput.addEventListener("input", renderHome);
    els.genreFilter.addEventListener("change", renderHome);

    els.movieGrid.addEventListener("click", function (event) {
      var card = event.target.closest("[data-movie-id]");
      if (card) {
        openDetail(card.dataset.movieId);
      }
    });

    els.continueRow.addEventListener("click", function (event) {
      var card = event.target.closest("[data-movie-id]");
      if (card) {
        openDetail(card.dataset.movieId);
      }
    });

    els.closeDetailButton.addEventListener("click", closeDetail);
    els.playButton.addEventListener("click", playCurrentSelection);
    els.favoriteButton.addEventListener("click", toggleFavorite);

    els.seasonTabs.addEventListener("click", function (event) {
      var button = event.target.closest("[data-season-index]");
      if (!button) {
        return;
      }
      state.activeSeasonIndex = Number(button.dataset.seasonIndex);
      state.activeEpisodeIndex = getLastEpisodeIndex(getActiveMovie(), state.activeSeasonIndex);
      renderDetailEpisodes();
      focusElement(els.episodeGrid.querySelector("[data-focusable]"));
    });

    els.episodeGrid.addEventListener("click", function (event) {
      var button = event.target.closest("[data-episode-index]");
      if (!button) {
        return;
      }
      state.activeSeasonIndex = Number(button.dataset.seasonIndex);
      state.activeEpisodeIndex = Number(button.dataset.episodeIndex);
      renderDetailEpisodes();
      playCurrentSelection();
    });

    els.closePlayerButton.addEventListener("click", closePlayer);
    els.prevEpisodeButton.addEventListener("click", playPreviousEpisode);
    els.nextEpisodeButton.addEventListener("click", playNextEpisode);
    els.fullscreenButton.addEventListener("click", requestFullscreen);

    els.autoplayToggle.checked = state.settings.autoplay !== false;
    els.autoplayToggle.addEventListener("change", function () {
      state.settings.autoplay = els.autoplayToggle.checked;
      saveJson(STORAGE_KEYS.settings, state.settings);
    });

    els.videoPlayer.addEventListener("timeupdate", saveCurrentPlaybackTime);
    els.videoPlayer.addEventListener("pause", saveCurrentPlaybackTime);
    els.videoPlayer.addEventListener("ended", handleVideoEnded);

    els.clearHistoryButton.addEventListener("click", function () {
      state.progress = {};
      saveJson(STORAGE_KEYS.progress, state.progress);
      renderNavigation();
      renderHome();
      showToast("Đã xóa lịch sử xem.");
    });

    // Lắng nghe sự thay đổi Fullscreen để xoay ngang màn hình tự động
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    document.addEventListener("keydown", handleGlobalKeys);
  }

  function renderHome() {
    var title = getCategoryLabel(state.activeCategory);
    els.pageTitle.textContent = title;
    els.gridTitle.textContent = title;

    var movies = getFilteredMovies();
    els.movieGrid.innerHTML = movies.length ? movies.map(renderMovieCard).join("") : '<div class="empty-state">Không tìm thấy phim phù hợp.</div>';
    els.resultCount.textContent = movies.length + " phim";
    renderContinueRow();
  }

  function renderContinueRow() {
    var items = getContinueMovies().slice(0, 10);
    els.continueSection.hidden = items.length === 0;
    els.continueRow.innerHTML = items.map(renderContinueCard).join("");
  }

  function getFilteredMovies() {
    var query = normalizeText(els.searchInput.value);
    var genre = els.genreFilter.value;

    return getCategoryMovies(state.activeCategory).filter(function (movie) {
      var text = normalizeText([
        movie.title,
        movie.description,
        movie.category,
        movie.genres.join(" "),
        flattenEpisodes(movie).map(function (item) {
          return item.episode.title;
        }).join(" ")
      ].join(" "));

      var matchesQuery = !query || text.indexOf(query) !== -1;
      var matchesGenre = genre === "all" || movie.genres.indexOf(genre) !== -1;
      return matchesQuery && matchesGenre;
    });
  }

  function getCategoryMovies(categoryId) {
    if (categoryId === "new") {
      return state.movies.filter(function (movie) {
        return movie.isNew;
      });
    }

    if (categoryId === "favorites") {
      return state.movies.filter(function (movie) {
        return state.favorites.indexOf(movie.id) !== -1;
      });
    }

    if (categoryId === "continue") {
      return getContinueMovies();
    }

    return state.movies.filter(function (movie) {
      return movie.category === CATEGORY_TO_NAME[categoryId];
    });
  }

  function getContinueMovies() {
    return state.movies.filter(function (movie) {
      return Boolean(state.progress[movie.id]);
    }).sort(function (a, b) {
      return (state.progress[b.id].updatedAt || 0) - (state.progress[a.id].updatedAt || 0);
    });
  }

  function renderMovieCard(movie) {
    var progress = state.progress[movie.id];
    var episodeCount = flattenEpisodes(movie).length;
    var badges = [
      '<span class="badge">' + escapeHtml(movie.category) + "</span>",
      '<span class="badge">' + episodeCount + " tập</span>"
    ];

    if (progress) {
      badges.push('<span class="badge progress">' + escapeHtml(getEpisodeLabel(movie, progress.seasonIndex, progress.episodeIndex)) + "</span>");
    }

    if (state.favorites.indexOf(movie.id) !== -1) {
      badges.push('<span class="badge favorite">Yêu thích</span>');
    }

    return [
      '<button class="movie-card" type="button" data-movie-id="' + escapeAttr(movie.id) + '" data-focusable>',
      '<img class="poster" src="' + escapeAttr(movie.thumbnail) + '" alt="' + escapeAttr(movie.title) + '" loading="lazy">',
      '<span class="movie-body">',
      '<span class="movie-title">' + escapeHtml(movie.title) + "</span>",
      '<span class="movie-desc">' + escapeHtml(movie.description) + "</span>",
      '<span class="badge-line">' + badges.join("") + "</span>",
      "</span>",
      "</button>"
    ].join("");
  }

  function renderContinueCard(movie) {
    var progress = state.progress[movie.id];
    var episodeLabel = progress ? getEpisodeLabel(movie, progress.seasonIndex, progress.episodeIndex) : "";
    var watched = progress && progress.watched && progress.watched[getEpisodeKey(progress.seasonIndex, progress.episodeIndex)];
    var progressWidth = watched ? 100 : progress && progress.currentTime > 0 ? 42 : 12;

    return [
      '<button class="history-card" type="button" data-movie-id="' + escapeAttr(movie.id) + '" data-focusable>',
      '<span class="history-thumb-wrap">',
      '<img class="history-thumb" src="' + escapeAttr(movie.thumbnail) + '" alt="' + escapeAttr(movie.title) + '" loading="lazy">',
      '<span class="history-progress" style="width: ' + progressWidth + '%"></span>',
      "</span>",
      '<span class="history-info">',
      '<span class="history-title">' + escapeHtml(movie.title) + "</span>",
      '<span class="history-episode">' + escapeHtml(episodeLabel) + "</span>",
      "</span>",
      "</button>"
    ].join("");
  }

  function openDetail(movieId) {
    var movie = findMovie(movieId);
    if (!movie) {
      return;
    }

    state.lastFocused = document.activeElement;
    state.activeMovieId = movie.id;

    var saved = state.progress[movie.id];
    state.activeSeasonIndex = saved ? saved.seasonIndex : 0;
    state.activeEpisodeIndex = saved ? saved.episodeIndex : 0;

    els.detailBackdrop.style.backgroundImage = "url('" + movie.thumbnail.replace(/'/g, "%27") + "')";
    els.detailPoster.src = movie.thumbnail;
    els.detailPoster.alt = movie.title;
    els.detailCategory.textContent = movie.category;
    els.detailTitle.textContent = movie.title;
    els.detailDescription.textContent = movie.description;
    els.detailMeta.innerHTML = [
      movie.year ? '<span class="badge">' + movie.year + "</span>" : "",
      movie.genres.map(function (genre) {
        return '<span class="badge">' + escapeHtml(genre) + "</span>";
      }).join("")
    ].join("");

    renderFavoriteButton();
    renderDetailEpisodes();
    els.detailView.hidden = false;
    document.body.style.overflow = "hidden";
    focusElement(els.playButton);
  }

  function closeDetail() {
    els.detailView.hidden = true;
    document.body.style.overflow = "";
    focusElement(state.lastFocused || els.movieGrid.querySelector("[data-focusable]"));
  }

  function renderFavoriteButton() {
    var movie = getActiveMovie();
    var isFavorite = state.favorites.indexOf(movie.id) !== -1;
    els.favoriteButton.textContent = isFavorite ? "Bỏ yêu thích" : "Yêu thích";
  }

  function renderDetailEpisodes() {
    var movie = getActiveMovie();
    var progress = state.progress[movie.id];

    els.seasonTabs.innerHTML = movie.seasons.map(function (season, index) {
      return [
        '<button class="season-button ' + (index === state.activeSeasonIndex ? "active" : "") + '" type="button"',
        ' data-season-index="' + index + '" data-focusable>',
        escapeHtml(season.name),
        "</button>"
      ].join("");
    }).join("");

    var activeSeason = movie.seasons[state.activeSeasonIndex] || movie.seasons[0];
    els.episodeGrid.innerHTML = activeSeason.episodes.map(function (episode, index) {
      var status = getEpisodeStatus(movie.id, state.activeSeasonIndex, index);
      var classes = ["episode-button"];
      if (status === "Đã xem") {
        classes.push("watched");
      }
      if (progress && progress.seasonIndex === state.activeSeasonIndex && progress.episodeIndex === index) {
        classes.push("current");
      }

      return [
        '<button class="' + classes.join(" ") + '" type="button" data-season-index="' + state.activeSeasonIndex + '"',
        ' data-episode-index="' + index + '" data-focusable>',
        '<span>' + escapeHtml(episode.title) + "</span>",
        "<small>" + status + "</small>",
        "</button>"
      ].join("");
    }).join("");

    updatePlayerButtons();
  }

  function getEpisodeStatus(movieId, seasonIndex, episodeIndex) {
    var progress = state.progress[movieId];
    if (!progress) {
      return "Chưa xem";
    }

    if (progress.watched && progress.watched[getEpisodeKey(seasonIndex, episodeIndex)]) {
      return "Đã xem";
    }

    if (progress.seasonIndex === seasonIndex && progress.episodeIndex === episodeIndex) {
      return "Đang xem";
    }

    return "Chưa xem";
  }

  function toggleFavorite() {
    var movie = getActiveMovie();
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
    renderNavigation();
    renderHome();
  }

  function playCurrentSelection() {
    var movie = getActiveMovie();
    var episode = getActiveEpisode();
    if (!movie || !episode) {
      return;
    }

    els.playerMovieTitle.textContent = movie.title;
    els.playerEpisodeTitle.textContent = episode.title;
    els.playerView.hidden = false;
    document.body.classList.add("player-open");
    document.body.style.overflow = "hidden";
    loadEpisodeSource(episode.videoUrl);
    restorePlaybackTime(movie.id);
    markCurrentEpisodeProgress(false);
    updatePlayerButtons();
    focusElement(els.fullscreenButton);
  }

  function loadEpisodeSource(url) {
    teardownHls();
    els.videoPlayer.pause();
    els.videoPlayer.removeAttribute("src");
    els.videoPlayer.load();
    els.iframePlayer.hidden = true;
    els.videoPlayer.hidden = false;

    if (isEmbedUrl(url)) {
      els.videoPlayer.hidden = true;
      els.iframePlayer.hidden = false;
      els.iframePlayer.src = url;
      return;
    }

    els.iframePlayer.src = "about:blank";
    if (isHlsUrl(url)) {
      if (els.videoPlayer.canPlayType("application/vnd.apple.mpegurl")) {
        els.videoPlayer.src = url;
      } else if (window.Hls && window.Hls.isSupported()) {
        state.hls = new window.Hls();
        state.hls.loadSource(url);
        state.hls.attachMedia(els.videoPlayer);
      } else {
        showToast("Trình duyệt này chưa hỗ trợ HLS.");
        return;
      }
    } else {
      els.videoPlayer.src = url;
    }

    var playPromise = els.videoPlayer.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {
        showToast("Nhấn Phát trên remote để bắt đầu video.");
      });
    }
  }

  function restorePlaybackTime(movieId) {
    if (els.videoPlayer.hidden) {
      return;
    }

    var progress = state.progress[movieId];
    if (!progress || !progress.currentTime) {
      return;
    }

    var applyTime = function () {
      if (Number.isFinite(progress.currentTime) && progress.currentTime > 5) {
        els.videoPlayer.currentTime = progress.currentTime;
      }
      els.videoPlayer.removeEventListener("loadedmetadata", applyTime);
    };

    els.videoPlayer.addEventListener("loadedmetadata", applyTime);
  }

  function saveCurrentPlaybackTime() {
    var movie = getActiveMovie();
    if (!movie || els.videoPlayer.hidden) {
      return;
    }

    var currentTime = els.videoPlayer.currentTime || 0;
    var duration = els.videoPlayer.duration || 0;
    markCurrentEpisodeProgress(duration > 0 && currentTime / duration > 0.92);
  }

  function markCurrentEpisodeProgress(isWatched) {
    var movie = getActiveMovie();
    if (!movie) {
      return;
    }

    var existing = state.progress[movie.id] || {};
    var watched = Object.assign({}, existing.watched || {});
    if (isWatched) {
      watched[getEpisodeKey(state.activeSeasonIndex, state.activeEpisodeIndex)] = true;
    }

    state.progress[movie.id] = {
      seasonIndex: state.activeSeasonIndex,
      episodeIndex: state.activeEpisodeIndex,
      currentTime: els.videoPlayer.hidden ? 0 : Math.floor(els.videoPlayer.currentTime || 0),
      updatedAt: Date.now(),
      watched: watched
    };
    saveJson(STORAGE_KEYS.progress, state.progress);
  }

  function handleVideoEnded() {
    markCurrentEpisodeProgress(true);
    renderDetailEpisodes();
    renderHome();
    if (els.autoplayToggle.checked && hasNextEpisode()) {
      playNextEpisode();
    } else {
      showToast("Đã xem xong tập này.");
    }
  }

  function playPreviousEpisode() {
    var previous = getRelativeEpisode(-1);
    if (!previous) {
      return;
    }
    state.activeSeasonIndex = previous.seasonIndex;
    state.activeEpisodeIndex = previous.episodeIndex;
    renderDetailEpisodes();
    playCurrentSelection();
  }

  function playNextEpisode() {
    var next = getRelativeEpisode(1);
    if (!next) {
      return;
    }
    state.activeSeasonIndex = next.seasonIndex;
    state.activeEpisodeIndex = next.episodeIndex;
    renderDetailEpisodes();
    playCurrentSelection();
  }

  function getRelativeEpisode(offset) {
    var movie = getActiveMovie();
    var flat = flattenEpisodes(movie);
    var currentIndex = flat.findIndex(function (item) {
      return item.seasonIndex === state.activeSeasonIndex && item.episodeIndex === state.activeEpisodeIndex;
    });
    return flat[currentIndex + offset] || null;
  }

  function hasNextEpisode() {
    return Boolean(getRelativeEpisode(1));
  }

  function updatePlayerButtons() {
    els.prevEpisodeButton.disabled = !getRelativeEpisode(-1);
    els.nextEpisodeButton.disabled = !getRelativeEpisode(1);
  }

  function closePlayer() {
    saveCurrentPlaybackTime();
    teardownHls();
    els.videoPlayer.pause();
    els.videoPlayer.removeAttribute("src");
    els.videoPlayer.load();
    els.iframePlayer.src = "about:blank";
    els.playerView.hidden = true;
    document.body.classList.remove("player-open");
    renderDetailEpisodes();
    renderNavigation();
    renderHome();
    focusElement(els.playButton);
  }

  function requestFullscreen() {
    var target = els.playerFrame;
    var fn = target.requestFullscreen || target.webkitRequestFullscreen || target.msRequestFullscreen;
    if (fn) {
      fn.call(target);
    }
  }

  // Tự động xoay ngang màn hình bằng Screen Orientation API khi bật/tắt chế độ toàn màn hình
  function handleFullscreenChange() {
    var isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    if (isFullscreen) {
      if (screen.orientation && typeof screen.orientation.lock === "function") {
        screen.orientation.lock("landscape").catch(function () {
          // Bỏ qua lỗi trên các thiết bị không hỗ trợ khóa hướng màn hình
        });
      }
    } else {
      if (screen.orientation && typeof screen.orientation.unlock === "function") {
        screen.orientation.unlock();
      }
    }
  }

  function teardownHls() {
    if (state.hls) {
      state.hls.destroy();
      state.hls = null;
    }
  }

  function handleGlobalKeys(event) {
    if (event.key === "Escape" || event.key === "Backspace") {
      if (!els.playerView.hidden) {
        event.preventDefault();
        closePlayer();
        return;
      }
      if (!els.detailView.hidden) {
        event.preventDefault();
        closeDetail();
      }
    }

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(event.key) !== -1) {
      moveFocus(event);
    }

    if (event.key === "Enter" && document.activeElement && document.activeElement.matches("button, [data-focusable]")) {
      document.activeElement.click();
    }
  }

  function setupSpatialNavigation() {
    document.addEventListener("focusin", function (event) {
      var target = event.target.closest("[data-focusable], button, input, select");
      if (target) {
        target.classList.add("focus-visible");
        target.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    });

    document.addEventListener("focusout", function (event) {
      var target = event.target.closest("[data-focusable], button, input, select");
      if (target) {
        target.classList.remove("focus-visible");
      }
    });
  }

  function moveFocus(event) {
    var key = event.key;
    var active = document.activeElement;
    if (!active || !active.matches("[data-focusable], button, input, select")) {
      focusFirstItem();
      return;
    }

    var candidates = Array.prototype.slice.call(getFocusRoot().querySelectorAll("[data-focusable], button, input, select")).filter(function (element) {
      return isVisible(element) && !element.disabled;
    });
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
      if (!best || score < best.score) {
        return { element: element, score: score };
      }

      return best;
    }, null);

    if (next) {
      event.preventDefault();
      focusElement(next.element);
    }
  }

  function focusFirstItem() {
    focusElement(getFocusRoot().querySelector("[data-focusable]"));
  }

  function focusElement(element) {
    if (element && typeof element.focus === "function") {
      element.focus({ preventScroll: true });
    }
  }

  function isVisible(element) {
    var rect = element.getBoundingClientRect();
    var style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  }

  function getFocusRoot() {
    if (!els.playerView.hidden) {
      return els.playerView;
    }
    if (!els.detailView.hidden) {
      return els.detailView;
    }
    return document;
  }

  function centerX(rect) {
    return rect.left + rect.width / 2;
  }

  function centerY(rect) {
    return rect.top + rect.height / 2;
  }

  function getActiveMovie() {
    return findMovie(state.activeMovieId);
  }

  function getActiveEpisode() {
    var movie = getActiveMovie();
    if (!movie) {
      return null;
    }
    var season = movie.seasons[state.activeSeasonIndex];
    return season && season.episodes[state.activeEpisodeIndex];
  }

  function findMovie(movieId) {
    return state.movies.find(function (movie) {
      return movie.id === movieId;
    });
  }

  function flattenEpisodes(movie) {
    if (!movie) {
      return [];
    }

    return movie.seasons.reduce(function (list, season, seasonIndex) {
      season.episodes.forEach(function (episode, episodeIndex) {
        list.push({
          seasonIndex: seasonIndex,
          episodeIndex: episodeIndex,
          season: season,
          episode: episode
        });
      });
      return list;
    }, []);
  }

  function getLastEpisodeIndex(movie, seasonIndex) {
    var progress = state.progress[movie.id];
    if (progress && progress.seasonIndex === seasonIndex) {
      return progress.episodeIndex;
    }
    return 0;
  }

  function getEpisodeLabel(movie, seasonIndex, episodeIndex) {
    var season = movie.seasons[seasonIndex];
    var episode = season && season.episodes[episodeIndex];
    return episode ? episode.title : "Đang xem";
  }

  function getEpisodeKey(seasonIndex, episodeIndex) {
    return "s" + seasonIndex + "e" + episodeIndex;
  }

  function getCategoryLabel(categoryId) {
    var found = CATEGORY_ITEMS.find(function (item) {
      return item.id === categoryId;
    });
    return found ? found.label : "Phim mới";
  }

  function isHlsUrl(url) {
    return /\.m3u8($|\?)/i.test(url);
  }

  function isEmbedUrl(url) {
    return /youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|ok\.ru|drive\.google\.com|\/embed\//i.test(url);
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function slugify(value) {
    return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
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
    }, 2600);
  }

  function setActiveNav() {
    Array.prototype.forEach.call(els.categoryNav.querySelectorAll(".nav-button"), function (button) {
      button.classList.toggle("active", button.dataset.category === state.activeCategory);
    });
  }
})();
