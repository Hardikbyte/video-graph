# Proposal: Hybrid Search with Vector Embeddings

## Why

As users build large knowledge boards in video-graph containing video timestamps/transcripts, markdown text, link titles, and notes, finding relevant content quickly becomes difficult. Traditional exact substring keyword search fails to find conceptually related information (e.g. searching "deployment" when a node notes "Docker container publishing"), while pure semantic search can overlook specific technical identifiers, IDs, or exact phrases. Introducing a hybrid search (semantic vector embeddings combined with exact keyword match) enables fast, context-aware retrieval across all board nodes.

## What Changes

- Add automated vector embedding generation for text, video notes/titles, and node annotations whenever nodes are created or updated.
- Store vector embeddings alongside node metadata (or within dedicated vector-indexed storage).
- Implement a search API endpoint (`GET /api/boards/:id/search` or `/api/search`) supporting hybrid query processing:
  - Exact lexical/substring matching across node titles, text, URLs, and notes.
  - Semantic vector similarity search using text embeddings.
  - Reciprocal Rank Fusion (RRF) or weighted score combination to rank hybrid results.
- Add an interactive search bar in the client interface (accessible via quick keyboard shortcut `/` or `Ctrl/Cmd+K` and header UI) that highlights, navigates, and focuses matching nodes on the canvas.

## Capabilities

### New Capabilities
- `node-search`: Search across board nodes using hybrid query matching (vector embedding semantic similarity and exact keyword matching) with canvas result navigation and highlights.

### Modified Capabilities
<!-- None: existing project has no existing durable specs in openspec/specs -->

## Impact

- **Backend Models & Routes**:
  - `server/src/models/Board.js` (or new embedding store schema) will store vector embeddings per node text chunk.
  - New search route in Express backend (`server/src/routes/search.js` or within `boards.js`).
  - Integration with embedding provider (e.g. OpenAI / Voyage / HuggingFace local or Xenova transformers / Ollama).
- **Client UI**:
  - `client/src/components/BoardHeader.jsx` and new `SearchBar.jsx` / `SearchResultsModal.jsx`.
  - Integration with React Flow instance (`reactFlow.setCenter` / zoom to node) to pan to selected search results.
- **Dependencies**:
  - Vector embedding library / client (or API SDK).
