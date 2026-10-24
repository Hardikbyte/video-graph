# Spec Delta

## Purpose

Enables hybrid semantic vector and exact keyword search across notes, video titles, and text nodes on a board, with seamless canvas navigation.

## ADDED Requirements

### Requirement: Node embedding indexing
The system SHALL generate and persist vector embeddings for nodes whenever their searchable text content (title, notes, text, or section) is created or modified.

#### Scenario: Successful embedding update on node mutation
- **WHEN** a user creates or updates a node with non-empty text, title, or notes
- **THEN** the system generates an embedding representation and stores it associated with the node

#### Scenario: Node deletion removes index
- **WHEN** a node is deleted from a board
- **THEN** its associated embeddings are removed from the search index

### Requirement: Hybrid search query execution
The system SHALL accept search queries and return scored matches ranked by combining semantic similarity scores and exact word-for-word substring matches.

#### Scenario: Exact word match prioritizing
- **WHEN** a user searches for an exact phrase appearing verbatim in a node's text
- **THEN** the system includes the node in the results with an elevated exact-match score boost

#### Scenario: Semantic concept match
- **WHEN** a user searches using conceptually related words not present verbatim in the node
- **THEN** the system returns matching nodes whose vector similarity score exceeds the relevance threshold

#### Scenario: Empty query handling
- **WHEN** a search request is submitted with an empty or whitespace-only query
- **THEN** the system returns an empty result list without error

### Requirement: Client search interface and canvas navigation
The system SHALL provide an accessible search bar on the board canvas allowing users to submit queries, browse matching results, and focus nodes.

#### Scenario: Trigger search bar via shortcut
- **WHEN** a user presses `/` or `Ctrl+K` (or `Cmd+K`) while viewing a board
- **THEN** the search input is focused and opened

#### Scenario: Focus result node on canvas
- **WHEN** a user selects a search result from the result list
- **THEN** the canvas viewport animates to center and highlight the matching node
