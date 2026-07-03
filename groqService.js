(function () {
  "use strict";

  var STORAGE_KEY = "vhub_groq_api_key";
  var DEFAULT_MODEL = "llama-3.3-70b-versatile";
  var API_URL = "https://api.groq.com/openai/v1/chat/completions";

  function getApiKey() {
    try {
      return String(window.GROQ_API_KEY || window.localStorage.getItem(STORAGE_KEY) || "").trim();
    } catch (error) {
      return String(window.GROQ_API_KEY || "").trim();
    }
  }

  function setApiKey(value) {
    var key = String(value || "").trim();
    try {
      if (key) {
        window.localStorage.setItem(STORAGE_KEY, key);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {}
    window.GROQ_API_KEY = key;
    return key;
  }

  function isConfigured() {
    var key = getApiKey();
    return Boolean(key && key.indexOf("[") !== 0);
  }

  function chat(options) {
    var key = getApiKey();
    if (!isConfigured()) {
      return Promise.reject(new Error("Chưa cấu hình Groq API key."));
    }

    var body = {
      model: options.model || DEFAULT_MODEL,
      messages: options.messages || [],
      temperature: typeof options.temperature === "number" ? options.temperature : 0.45,
      max_tokens: options.maxTokens || 900,
      response_format: options.responseFormat
    };

    if (!body.response_format) {
      delete body.response_format;
    }

    return fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + key
      },
      body: JSON.stringify(body)
    }).then(function (response) {
      if (!response.ok) {
        return response.text().then(function (text) {
          throw new Error("Groq API lỗi " + response.status + ": " + text.slice(0, 180));
        });
      }
      return response.json();
    }).then(function (data) {
      var message = data && data.choices && data.choices[0] && data.choices[0].message;
      return message && message.content ? message.content.trim() : "";
    });
  }

  window.GroqService = {
    apiUrl: API_URL,
    defaultModel: DEFAULT_MODEL,
    getApiKey: getApiKey,
    setApiKey: setApiKey,
    isConfigured: isConfigured,
    chat: chat
  };
})();
