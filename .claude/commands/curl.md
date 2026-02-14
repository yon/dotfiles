# Curl

Fetch web content using curl with browser headers.

## Usage

```
/curl <url> [prompt]
```

- `url` - The URL to fetch
- `prompt` - Optional instructions for processing the content (default: summarize)

## Process

1. **Fetch with browser headers**:

```bash
curl -sL \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" \
  -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" \
  -H "Accept-Language: en-US,en;q=0.5" \
  "<url>"
```

2. **Handle response**:
   - **Normal size** (< 100KB): Return raw content directly, apply prompt to analyze
   - **Large content** (>= 100KB): Save to `~/.claude/curl-output/<timestamp>-<domain>.html`, return file path for chunked processing

3. **Process**: Apply the prompt to analyze/summarize the content. LLM parses raw HTML directly.

## Large Content Handling

When content exceeds 100KB:

```bash
mkdir -p ~/.claude/curl-output
curl -sL [headers] "<url>" > ~/.claude/curl-output/$(date +%Y%m%d-%H%M%S)-<domain>.html
```

Return: "Content saved to [path] (X KB). Use Read tool with offset/limit for chunked processing."

## Notes

- Use this instead of the native WebFetch tool
- Handles sites that block bot User-Agents
- Follows redirects automatically (-L flag)
- Returns raw HTML - LLM parses it directly
