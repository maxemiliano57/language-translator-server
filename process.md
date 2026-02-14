# Development Process

This document outlines the process followed to build the Language Translator MCP Server.

## 1. Project Initialization

- Created a new Node.js project with `npm init`
- Set the project to use ES Modules (`"type": "module"` in `package.json`)
- Installed dependencies:
  - `@modelcontextprotocol/sdk` - The official MCP SDK for building MCP servers
  - `franc` - Lightweight trigram-based language detection library
  - `langs` - Utility for mapping between ISO 639 language code formats

## 2. Server Architecture

The server follows the standard MCP server pattern:

1. **Create an `McpServer` instance** with a name and version
2. **Register tools** using `server.tool()`, defining:
   - Tool name and description
   - Input schema (using Zod for validation)
   - Handler function with the tool logic
3. **Connect via stdio transport** so MCP clients can communicate with the server over stdin/stdout

## 3. Tool Implementation

### detect_language
- Accepts a `text` string input
- Uses the `franc` library to detect the language, which returns an ISO 639-3 code (e.g., `"eng"`, `"fra"`)
- Converts the 3-letter code to a 2-letter ISO 639-1 code (e.g., `"en"`, `"fr"`) using the `langs` library
- Estimates a confidence score based on input text length (longer text yields higher confidence)
- Returns the detected language code, ISO 639-3 code, language name, and confidence score

### translate_text
- Accepts `text`, `target_language` (required), and `source_language` (optional)
- If `source_language` is not provided, auto-detects it using `franc`
- Calls the MyMemory Translation API (`api.mymemory.translated.net`) to perform the translation
- Returns the translated text along with source/target language codes and the original text

## 4. MCP Client Configuration

- Created a `.mcp.json` file in the project root to configure the server for Claude Code
- The configuration specifies the `node` command and the path to `index.js`
- This allows Claude Code to automatically discover and connect to the server

## 5. Testing

Tested the server through Claude Code by:
1. Reconnecting to the MCP server via `/mcp`
2. Using `detect_language` to identify the language of Spanish text ("Hola amigo, como estas")
3. Using `translate_text` to translate French text ("Je suis tres fatigue") to English

### Observations
- Language detection with `franc` can be inaccurate on short text inputs (detected Spanish as Esperanto with 50% confidence)
- Translation requires explicitly specifying the source language when auto-detection fails; specifying `source_language: "fr"` for the French text produced the correct English translation: "I am very tired"
- The MyMemory API returns an error if source and target languages are the same, which can happen when auto-detection misidentifies the source language

## 6. Potential Improvements

- Use a more accurate language detection library or API for short text
- Add caching for repeated translations
- Add support for batch translation of multiple texts
- Implement fallback translation APIs for higher reliability
