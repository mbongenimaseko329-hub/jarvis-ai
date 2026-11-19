
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

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey,
      {
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
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini returned status:", response.status);
      console.error("Gemini error details:", JSON.stringify(data.error || data));
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Gemini request failed" })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reply: data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response."
      })
    };

  } catch (error) {
    console.error("JARVIS function error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Something went wrong" })
    };
  }
};
