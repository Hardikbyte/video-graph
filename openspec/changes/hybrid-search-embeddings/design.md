# Design: Hybrid Search Architecture with Vector Embeddings

## Context

See `proposal.md` for motivation.
Currently, `Board` documents in MongoDB store an embedded array of `nodes` (with properties `type`, `youtubeId`, `text`, `url`, `section`, `title`, `notes`, `position`). There is no search index or embedding generation mechanism. The client renders nodes using `@xyflow/react` and allows zooming/panning via React Flow instance hooks.

## Goals / Non-Goals

**Goals:**
- Provide hybrid search (exact substring lexical matching + cosine similarity semantic vector search).
- Rank combined results using Reciprocal Rank Fusion (RRF) or linear score combination.
- Provide responsive canvas navigation: selecting a search result centers and flashes/highlights the matching node.
- Keep embedding generation modular so local transformers (e.g. `@xenova/transformers`) or hosted API embeddings (e.g. OpenAI/Ollama) can be configured via environment variables.

**Non-Goals:**
- Full semantic search across raw video audio transcripts inside external YouTube videos (only indexing titles, sections, user notes, and node texts for now).
- Cross-user global public search (search remains strictly scoped to boards owned by or accessible to the requesting user).

## Decisions

### 1. Vector Storage Strategy
- **Decision**: Store node embedding records either inside a dedicated `NodeEmbedding` collection (`{ boardId, nodeId, text, embedding, updatedAt }`) or directly alongside nodes in MongoDB.
- **Rationale**: A dedicated collection (`NodeEmbedding` or indexed subdocuments) avoids bloat on the main `Board` document when updating positions and simple properties, and enables efficient vector queries without reading the whole board.
- **Alternatives Considered**:
  - *In-memory client-side embeddings*: Exceeds browser storage/CPU limits for large boards with dozens of nodes.
  - *External vector DB (Pinecone/Milvus/Qdrant)*: Adds heavy operational complexity and extra service dependencies for an MVP already running MongoDB. MongoDB Atlas Vector Search or local in-process cosine distance calculation for board-scoped subsets provides clean zero-extra-infrastructure deployment.

### 2. Embedding Model / Provider
- **Decision**: Modular embedding service using `@xenova/transformers` (local ONNX pipeline with lightweight `all-MiniLM-L6-v2` or `bge-small-en-v1.5`) with optional fallback/env override for OpenAI `text-embedding-3-small`.
- **Rationale**: Works offline and in local dev without requiring an external paid API key or third-party egress, while still producing standard 384-dim dense vectors.
- **Alternatives Considered**:
  - *OpenAI only*: Requires mandatory API key, breaking out-of-the-box local setup and seed scripts.

### 3. Hybrid Scoring Algorithm
- **Decision**: Reciprocal Rank Fusion (RRF) combining rank positions:
  `RRF_Score(d) = (w_lexical / (k + rank_lexical(d))) + (w_semantic / (k + rank_semantic(d)))` with `k=60`. Exact matches on title/text receive a boosted lexical rank.
- **Rationale**: RRF naturally normalizes unbounded lexical scores with cosine similarity scores without requiring ad-hoc manual weight calibration.

### 4. Client Search Interaction
- **Decision**: Floating search bar / command palette overlay triggered by keyboard shortcut `/` or `Ctrl+K`/`Cmd+K`.
- **Behavior**: Entering text debounces a request to `/api/boards/:id/search?q=...`. Selecting an item invokes `useReactFlow().setCenter(node.position.x, node.position.y, { zoom: 1.2, duration: 800 })` and triggers a highlight effect on `NodeShell`.

## Risks / Trade-offs

- **[Risk] Initial embedding generation latency when creating/pasting many nodes** → Mitigation: Process embeddings asynchronously in background jobs or fire-and-forget queues; immediately return 201 for node creation.
- **[Risk] High memory footprint for local transformer model in Node.js** → Mitigation: Use quantized small models (~30-40MB) and lazy-load the pipeline only upon first embedding request.
- **[Risk] Outdated embeddings when node text is patched** → Mitigation: Hook into `PATCH /:id/nodes/:nodeId` and update or invalidate the embedding record for that `nodeId`.
