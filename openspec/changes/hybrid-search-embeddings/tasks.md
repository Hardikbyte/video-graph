# Tasks

## 1. Backend Embedding Infrastructure & Storage

- [x] 1.1 Add embedding dependencies (`@xenova/transformers`) to `server/package.json` and verify installation succeeds
- [x] 1.2 Create `server/src/lib/embeddings.js` with text chunking, embedding generation using `@xenova/transformers`, and unit tests with mock outputs
- [x] 1.3 Create `server/src/models/NodeEmbedding.js` Mongoose schema with fields for `boardId`, `nodeId`, `text`, and `embedding` array, and verify model creation in a test

## 2. Server Node Sync & Search Endpoint

- [x] 2.1 Hook embedding generation into node creation (`POST /api/boards/:id/nodes`), node updates (`PATCH /api/boards/:id/nodes/:nodeId`), and deletion (`DELETE /api/boards/:id/nodes/:nodeId`)
- [x] 2.2 Implement hybrid search logic in `server/src/lib/hybridSearch.js` combining lexical substring matching and cosine similarity scoring using Reciprocal Rank Fusion (RRF), with unit tests
- [x] 2.3 Implement `GET /api/boards/:id/search` endpoint in `server/src/routes/boards.js` with query validation and auth protection, and verify with route tests

## 3. Client Search UI & Canvas Navigation

- [x] 3.1 Create `client/src/components/SearchBar.jsx` search overlay with input debouncing and query state, triggered by `/` and `Ctrl/Cmd+K` keyboard shortcuts
- [x] 3.2 Add search trigger button to `client/src/components/BoardHeader.jsx` and wire it to open the search bar modal
- [x] 3.3 Implement result selection behavior in `SearchBar.jsx` to pan and center the viewport on the matching node using React Flow's `setCenter` API, adding a brief highlight pulse to the target node
- [x] 3.4 Verify search end-to-end in the browser with sample queries matching both verbatim keywords and semantic phrases

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied.
- Verify the archived result.
