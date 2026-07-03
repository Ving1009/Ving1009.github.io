(function () {
  "use strict";

  var MOOD_KEYWORDS = {
    "buon": ["drama", "tinh cam", "cam dong", "tam ly", "anime", "phieu luu"],
    "vui": ["hai", "hai huoc", "gia dinh", "phieu luu"],
    "hoi hop": ["giat gan", "trinh tham", "hanh dong"],
    "so hai": ["kinh di", "bi an", "giat gan"],
    "chill": ["doi thuong", "hai", "phieu luu", "gia dinh"],
    "quai vat": ["hanh dong", "phieu luu", "khoa hoc", "vien tuong"],
    "anime": ["anime", "hoat hinh"],
    "interstellar": ["khoa hoc", "vien tuong", "khong gian", "phieu luu"]
  };

  function smartSearch(query, movies, context) {
    var trimmed = String(query || "").trim();
    if (!trimmed) {
      return Promise.resolve({ movies: movies.slice(0, 24), note: "Hiển thị phim nổi bật." });
    }

    if (window.GroqService && window.GroqService.isConfigured()) {
      return searchWithGroq(trimmed, movies, context).catch(function () {
        return localSmartSearch(trimmed, movies, context);
      });
    }

    return Promise.resolve(localSmartSearch(trimmed, movies, context));
  }

  function searchWithGroq(query, movies, context) {
    var catalog = movies.map(function (movie) {
      return {
        id: movie.id,
        title: movie.title,
        originalTitle: movie.originalTitle || "",
        year: movie.year || "",
        country: movie.country || "",
        status: movie.status || "",
        genres: movie.genres || [],
        categories: movie.categories || movie.category || [],
        description: String(movie.description || "").slice(0, 420)
      };
    });

    return window.GroqService.chat({
      responseFormat: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "Bạn là AI tìm phim cho website V Hub.",
            "Chỉ trả JSON hợp lệ dạng {\"ids\":[\"movie-id\"],\"note\":\"lý do ngắn\"}.",
            "Ưu tiên kết quả gần đúng, hiểu tiếng Việt không dấu, mood, thể loại, phim tương tự.",
            "Không bịa id ngoài catalog."
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify({
            query: query,
            watchContext: compactContext(context),
            catalog: catalog
          })
        }
      ],
      temperature: 0.2,
      maxTokens: 700
    }).then(function (content) {
      var parsed = parseJson(content);
      var ids = Array.isArray(parsed.ids) ? parsed.ids : [];
      var selected = ids.map(function (id) {
        return movies.find(function (movie) {
          return movie.id === id;
        });
      }).filter(Boolean);

      if (!selected.length) {
        return localSmartSearch(query, movies, context);
      }

      return {
        movies: selected,
        note: parsed.note || "AI đã chọn các phim gần nhất với yêu cầu."
      };
    });
  }

  function localSmartSearch(query, movies, context) {
    var normalizedQuery = normalizeText(query);
    var queryTokens = tokenize(normalizedQuery);
    var expandedTokens = expandMoodTokens(queryTokens, normalizedQuery);
    var scored = movies.map(function (movie) {
      return {
        movie: movie,
        score: scoreMovie(movie, queryTokens.concat(expandedTokens), normalizedQuery, context)
      };
    }).filter(function (item) {
      return item.score > 0;
    }).sort(function (a, b) {
      return b.score - a.score || getMovieTitle(a.movie).localeCompare(getMovieTitle(b.movie), "vi");
    });

    return {
      movies: scored.map(function (item) {
        return item.movie;
      }),
      note: scored.length ? "AI offline đã tìm theo mood, thể loại, tên phụ và mô tả." : "Chưa thấy phim thật khớp. Hãy thử từ khóa rộng hơn."
    };
  }

  function recommendMovies(movies, context, limit) {
    var signals = buildTasteSignals(context);
    var scored = movies.map(function (movie) {
      return {
        movie: movie,
        score: recommendationScore(movie, signals, context)
      };
    }).sort(function (a, b) {
      return b.score - a.score || getMovieTitle(a.movie).localeCompare(getMovieTitle(b.movie), "vi");
    });

    return scored.slice(0, limit || 12).map(function (item) {
      return item.movie;
    });
  }

  function assistantReply(prompt, movies, context) {
    var input = String(prompt || "").trim();
    if (!input) {
      return Promise.resolve("Bạn muốn mình gợi ý theo tâm trạng, thể loại, hay một phim tương tự phim nào đó?");
    }

    if (window.GroqService && window.GroqService.isConfigured()) {
      return window.GroqService.chat({
        messages: [
          {
            role: "system",
            content: [
              "Bạn là AI Assistant cho website xem phim V Hub.",
              "Trả lời tiếng Việt, ngắn gọn, hữu ích.",
              "Có thể gợi ý phim, tóm tắt nội dung, giải thích thứ tự xem series, hướng dẫn dùng website.",
              "Chỉ đề xuất phim có trong catalog nếu người dùng hỏi phim để xem ngay."
            ].join(" ")
          },
          {
            role: "user",
            content: JSON.stringify({
              prompt: input,
              context: compactContext(context),
              catalog: movies.map(function (movie) {
                return {
                  id: movie.id,
                  title: movie.title,
                  originalTitle: movie.originalTitle || "",
                  year: movie.year || "",
                  genres: movie.genres || [],
                  description: String(movie.description || "").slice(0, 260),
                  episodes: countEpisodes(movie)
                };
              })
            })
          }
        ],
        temperature: 0.55,
        maxTokens: 850
      }).catch(function () {
        return offlineAssistantReply(input, movies, context);
      });
    }

    return Promise.resolve(offlineAssistantReply(input, movies, context));
  }

  function offlineAssistantReply(prompt, movies, context) {
    var normalized = normalizeText(prompt);
    var picks = localSmartSearch(prompt, movies, context).movies.slice(0, 5);

    if (/tom tat|noi dung|summary/.test(normalized)) {
      var active = context && context.activeMovie;
      if (active) {
        return "Tóm tắt nhanh: " + active.title + " xoay quanh " + String(active.description || "một câu chuyện giải trí").slice(0, 260) + ".";
      }
    }

    if (/thu tu|series|xem truoc|xem sau/.test(normalized)) {
      var movie = context && context.activeMovie;
      if (movie && movie.seasons && movie.seasons.length) {
        return "Thứ tự xem đề xuất: xem theo thứ tự mùa và tập đang hiển thị. Với phim này, bắt đầu từ " + movie.seasons[0].name + ", tập đầu tiên, rồi đi lần lượt để hệ thống auto-next và lưu lịch sử hoạt động chính xác.";
      }
    }

    if (/website|phim moi|them phim|import|yeu thich|lich su/.test(normalized)) {
      return "Bạn có thể tìm realtime ở ô trên cùng, bấm AI Assistant để hỏi bằng ngôn ngữ tự nhiên, dùng Thêm phim để paste link tập, dùng Yêu thích/Lịch sử để cá nhân hóa đề xuất. Player khi xem sẽ chỉ còn UI gốc của nền tảng nhúng.";
    }

    if (!picks.length) {
      picks = recommendMovies(movies, context, 5);
    }

    return "Gợi ý hợp gu lúc này: " + picks.map(function (movie) {
      return movie.title;
    }).join(", ") + ".";
  }

  function buildTasteSignals(context) {
    var genreScores = {};
    var countryScores = {};
    var watchedIds = {};
    var favoriteIds = {};

    (context && context.history || []).forEach(function (entry) {
      watchedIds[entry.movieId] = (watchedIds[entry.movieId] || 0) + 1;
      addMovieSignals(entry.movie, 2);
    });

    (context && context.favorites || []).forEach(function (movie) {
      favoriteIds[movie.id] = true;
      addMovieSignals(movie, 4);
    });

    function addMovieSignals(movie, weight) {
      if (!movie) {
        return;
      }
      (movie.genres || []).forEach(function (genre) {
        var key = normalizeText(genre);
        genreScores[key] = (genreScores[key] || 0) + weight;
      });
      if (movie.country) {
        var countryKey = normalizeText(movie.country);
        countryScores[countryKey] = (countryScores[countryKey] || 0) + weight;
      }
    }

    return {
      genreScores: genreScores,
      countryScores: countryScores,
      watchedIds: watchedIds,
      favoriteIds: favoriteIds
    };
  }

  function recommendationScore(movie, signals, context) {
    var score = 0;
    var genres = movie.genres || [];
    genres.forEach(function (genre) {
      score += signals.genreScores[normalizeText(genre)] || 0;
    });
    if (movie.country) {
      score += signals.countryScores[normalizeText(movie.country)] || 0;
    }
    if (movie.isNew) {
      score += 2;
    }
    score += Math.min(4, (movie.views || 0) / 10);
    score += Number(movie.year || 0) >= new Date().getFullYear() - 2 ? 1.5 : 0;
    score += countEpisodes(movie) > 1 ? 0.5 : 0.25;
    score += signals.favoriteIds[movie.id] ? -4 : 0;
    score += signals.watchedIds[movie.id] ? -1 : 0;

    var rating = context && context.ratings && context.ratings[movie.id];
    if (rating) {
      score += Number(rating) / 2;
    }
    return score;
  }

  function scoreMovie(movie, tokens, normalizedQuery, context) {
    var text = normalizeText([
      movie.title,
      movie.originalTitle,
      movie.description,
      movie.country,
      movie.status,
      movie.year,
      (movie.categories || movie.category || []).join(" "),
      (movie.genres || []).join(" "),
      flattenEpisodeTitles(movie)
    ].join(" "));

    var title = normalizeText(movie.title + " " + (movie.originalTitle || ""));
    var score = 0;
    tokens.forEach(function (token) {
      if (!token) {
        return;
      }
      if (title.indexOf(token) !== -1) {
        score += 8;
      }
      if (text.indexOf(token) !== -1) {
        score += 3;
      }
      score += fuzzyTokenScore(token, text);
    });

    if (normalizedQuery && text.indexOf(normalizedQuery) !== -1) {
      score += 20;
    }

    var recommendations = recommendMovies([movie], context || {}, 1);
    if (recommendations[0] && recommendations[0].id === movie.id) {
      score += 1;
    }

    return score;
  }

  function expandMoodTokens(tokens, normalizedQuery) {
    var additions = [];
    Object.keys(MOOD_KEYWORDS).forEach(function (mood) {
      if (normalizedQuery.indexOf(mood) !== -1 || tokens.indexOf(mood) !== -1) {
        additions = additions.concat(MOOD_KEYWORDS[mood]);
      }
    });
    return additions;
  }

  function fuzzyTokenScore(token, text) {
    if (token.length < 3) {
      return 0;
    }
    var compactText = text.replace(/\s+/g, "");
    var compactToken = token.replace(/\s+/g, "");
    if (compactText.indexOf(compactToken) !== -1) {
      return 2;
    }
    var pattern = compactToken.split("").map(escapeRegExp).join(".*?");
    try {
      return new RegExp(pattern).test(compactText) ? 1 : 0;
    } catch (error) {
      return 0;
    }
  }

  function compactContext(context) {
    return {
      favorites: (context && context.favorites || []).map(getMovieTitle).slice(0, 8),
      history: (context && context.history || []).map(function (entry) {
        return {
          title: entry.movie ? entry.movie.title : entry.movieId,
          episode: entry.episodeTitle || "",
          updatedAt: entry.updatedAt || entry.watchedAt || 0
        };
      }).slice(0, 10),
      activeMovie: context && context.activeMovie ? {
        title: context.activeMovie.title,
        genres: context.activeMovie.genres || [],
        description: String(context.activeMovie.description || "").slice(0, 260)
      } : null
    };
  }

  function parseJson(value) {
    try {
      return JSON.parse(value);
    } catch (error) {
      var match = String(value || "").match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : {};
    }
  }

  function flattenEpisodeTitles(movie) {
    return (movie.seasons || []).map(function (season) {
      return (season.episodes || []).map(function (episode) {
        return episode.title || "";
      }).join(" ");
    }).join(" ");
  }

  function countEpisodes(movie) {
    return (movie.seasons || []).reduce(function (total, season) {
      return total + (season.episodes || []).length;
    }, 0);
  }

  function getMovieTitle(movie) {
    return movie ? movie.title || movie.id || "Phim" : "Phim";
  }

  function tokenize(value) {
    return normalizeText(value).split(/[^a-z0-9]+/).filter(function (token) {
      return token.length >= 2;
    });
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d");
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  window.VHubAI = {
    smartSearch: smartSearch,
    recommendMovies: recommendMovies,
    assistantReply: assistantReply,
    localSmartSearch: localSmartSearch,
    normalizeText: normalizeText
  };
})();
