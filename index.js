// ============================================================
// Language Translator MCP Server
// ============================================================
// This MCP (Model Context Protocol) server exposes two tools:
//   1. detect_language  – detects the language of a given text
//   2. translate_text   – translates text to a target language
// ============================================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod"; // Zod is bundled with the MCP SDK
import { franc } from "franc"; // Lightweight language detection
import langs from "langs"; // Maps ISO 639-3 codes to readable names & ISO 639-1 codes

// --------------------------------------------------
// Helper: convert ISO 639-3 code (franc) → ISO 639-1
// --------------------------------------------------
// franc returns 3-letter codes like "eng", "spa", "fra".
// This helper converts them to the familiar 2-letter
// codes like "en", "es", "fr".
function toShortCode(iso3Code) {
  const language = langs.where("3", iso3Code);
  return language ? language["1"] : null; // returns 2-letter code or null
}

// --------------------------------------------------
// Helper: call a free translation API
// --------------------------------------------------
// We use the MyMemory public translation API which is
// free for up to 5000 words/day and requires no API key.
//
// If you need higher limits, set the environment variable
// MYMEMORY_API_KEY with your key from https://mymemory.translated.net
// and it will be included in requests automatically.
async function translateWithAPI(text, sourceLang, targetLang) {
  // Build the language pair string, e.g. "en|es"
  const langPair = `${sourceLang}|${targetLang}`;

  // Build the API URL
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", langPair);

  // If the user has an API key, include it for higher rate limits
  const apiKey = process.env.MYMEMORY_API_KEY;
  if (apiKey) {
    url.searchParams.set("key", apiKey);
  }

  // Make the HTTP request
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Translation API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Check for API-level errors
  if (data.responseStatus !== 200) {
    throw new Error(`Translation failed: ${data.responseDetails || "Unknown error"}`);
  }

  return data.responseData.translatedText;
}

// ============================================================
// Create the MCP Server
// ============================================================
const server = new McpServer({
  name: "language-translator", // Unique name for this server
  version: "1.0.0",
});

// ============================================================
// Tool 1: detect_language
// ============================================================
// Takes a text string and returns the detected language code
// along with a confidence score.
server.tool(
  "detect_language", // Tool name
  "Detects the language of the given text and returns a language code with a confidence score",
  {
    // Input schema — requires a single "text" parameter
    text: z.string().describe("The text whose language you want to detect"),
  },
  async ({ text }) => {
    // --- Validate input ---
    if (!text || text.trim().length === 0) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: "Text parameter is required and cannot be empty" }),
          },
        ],
      };
    }

    // --- Detect the language using franc ---
    // franc returns an ISO 639-3 code (e.g. "eng") or "und" if undetermined
    const detectedCode = franc(text);

    if (detectedCode === "und") {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: "Could not determine language. Try providing a longer text sample.",
            }),
          },
        ],
      };
    }

    // Convert 3-letter code to 2-letter code
    const shortCode = toShortCode(detectedCode);
    const language = langs.where("3", detectedCode);

    // --- Calculate a simple confidence score ---
    // franc doesn't provide a built-in confidence value, so we
    // estimate one based on text length (longer text = more reliable).
    const length = text.trim().length;
    let confidence;
    if (length > 200) confidence = 0.95;
    else if (length > 100) confidence = 0.85;
    else if (length > 50) confidence = 0.7;
    else if (length > 20) confidence = 0.5;
    else confidence = 0.3;

    // --- Return the result ---
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              detected_language: shortCode || detectedCode, // e.g. "en" or fallback to "eng"
              iso639_3: detectedCode, // e.g. "eng"
              language_name: language ? language.name : "Unknown", // e.g. "English"
              confidence: confidence,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ============================================================
// Tool 2: translate_text
// ============================================================
// Translates text from one language to another.
// Uses the MyMemory free translation API.
server.tool(
  "translate_text", // Tool name
  "Translates text to the specified target language",
  {
    // Input schema — text and target_language are required,
    // source_language is optional (auto-detected if omitted)
    text: z.string().describe("The text to translate"),
    target_language: z
      .string()
      .describe('Target language code, e.g. "es" for Spanish, "fr" for French'),
    source_language: z
      .string()
      .optional()
      .describe('Source language code, e.g. "en" for English. If omitted, it will be auto-detected'),
  },
  async ({ text, target_language, source_language }) => {
    // --- Validate required inputs ---
    if (!text || text.trim().length === 0) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: "Text parameter is required and cannot be empty" }),
          },
        ],
      };
    }

    if (!target_language || target_language.trim().length === 0) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: "target_language parameter is required" }),
          },
        ],
      };
    }

    // --- Determine the source language ---
    // If not provided, auto-detect it using franc
    let sourceLang = source_language;
    if (!sourceLang) {
      const detectedCode = franc(text);
      if (detectedCode === "und") {
        // If detection fails, default to English
        sourceLang = "en";
      } else {
        sourceLang = toShortCode(detectedCode) || "en";
      }
    }

    // --- Call the translation API ---
    try {
      const translatedText = await translateWithAPI(text, sourceLang, target_language);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                translated_text: translatedText,
                source_language: sourceLang,
                target_language: target_language,
                original_text: text,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `Translation failed: ${error.message}`,
            }),
          },
        ],
      };
    }
  }
);

// ============================================================
// Start the server using stdio transport
// ============================================================
// MCP servers communicate over stdin/stdout. This is how
// an MCP client (like Claude Desktop) connects to the server.
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Language Translator MCP server is running...");
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
