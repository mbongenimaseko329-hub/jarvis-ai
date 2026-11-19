
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const { message } = JSON.parse(event.body || "{}");

    if (!message || typeof message !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Message is required" })
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing.");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "API key is not configured" })
      };
    }

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=" +
      apiKey;

    let response;
    let data;

    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "You are JARVIS, a calm, intelligent and professional personal AI assistant. Speak clearly and concisely."
            }]
          },
          contents: [{
            parts: [{ text: message }]
          }]
        })
      });

      data = await response.json();

      if (response.ok) break;

      console.error("Gemini attempt:", attempt + 1);
      console.error("Gemini status:", response.status);
      console.error(
        "Gemini error:",
        JSON.stringify(data.error || data)
      );

      const temporaryError =
        response.status === 429 ||
        response.status === 500 ||
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504;

      if (!temporaryError || attempt === 2) break;

      await new Promise(resolve =>
        setTimeout(resolve, attempt === 0 ? 2000 : 4000)
      );
    }

    if (!response.ok) {
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Gemini is temporarily unavailable. Please try again shortly."
        })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reply:
          data.candidates?.[0]?.content?.parts?.[0]?.text ||
          "I couldn't generate a response."
      })
    };

  } catch (error) {
    console.error("JARVIS function error:", error.message);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Something went wrong"
      })
    };
  }
};

