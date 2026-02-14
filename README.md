# Language Translator MCP Server

An MCP (Model Context Protocol) server that provides language detection and translation capabilities. Built with the MCP SDK, it exposes two tools that any MCP-compatible client (like Claude Code or Claude Desktop) can use.

## Tools

### `detect_language`
Detects the language of a given text string. Returns the detected language code (ISO 639-1 and ISO 639-3), language name, and a confidence score based on text length.

### `translate_text`
Translates text from one language to another using the [MyMemory Translation API](https://mymemory.translated.net). Supports auto-detection of the source language if not specified.

## Tech Stack

- **Runtime:** Node.js (ES Modules)
- **MCP SDK:** `@modelcontextprotocol/sdk` v1.12+
- **Language Detection:** `franc` (trigram-based detection, ISO 639-3 codes)
- **Language Code Mapping:** `langs` (ISO 639-3 to ISO 639-1 conversion)
- **Translation API:** MyMemory (free, no API key required for up to 5,000 words/day)

## Setup

### Prerequisites
- Node.js v18+

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/language-translator-server.git
cd language-translator-server
npm install
```

### Running the Server

```bash
npm start
```

The server communicates over stdio and is designed to be launched by an MCP client.

### Connecting to Claude Code

Add the server to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "lang-server": {
      "command": "node",
      "args": ["/path/to/language-translator-server/index.js"]
    }
  }
}
```

## Configuration

| Environment Variable | Description |
|---|---|
| `MYMEMORY_API_KEY` | Optional. MyMemory API key for higher rate limits. |

## Usage Examples

Once connected via an MCP client:

- **Detect language:** "Detect the language of 'Bonjour le monde'"
- **Translate text:** "Translate 'Hello world' to Spanish"
- **Auto-detect + translate:** "Translate 'Guten Tag' to English"

## License

ISC
