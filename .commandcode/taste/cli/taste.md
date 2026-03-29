# Code Quality

- Always try to reuse functions and refactor to keep DRY (Don't Repeat Yourself). Confidence: 0.90
- Consolidate duplicated error handling, validation, and file I/O patterns into shared utilities. Confidence: 0.85
- Extract common functionality into dedicated utility modules (e.g., error-handler.ts, validation.ts, file-utils.ts). Confidence: 0.80

# Configuration

- Make editor selection configurable via environment variables ($EDITOR, $VISUAL) with fallback defaults. Confidence: 0.85
- Document configuration options in README with examples for different editors (vi, pico, nano, textedit, vscode, cursor, etc.). Confidence: 0.80

# Idea Management

- When listing ideas, use config naming conventions to filter out generated content files (outlines, posts, tweets, etc.) from base idea files. Confidence: 0.85
- Parse markdown headings from idea files and display them in listings to provide context about file contents. Confidence: 0.80
- Allow ideas directory location to be customizable via config with default to 'ideas' in root directory. Confidence: 0.80

# Command Implementation

- Use wrapper functions like wrapCommandAction() to standardize error handling across all commands. Confidence: 0.80
- Validate input using shared validateAndExit() utility for consistent error output. Confidence: 0.75
