# TaskFlow CLI - Technical Specification

## Technology Stack

- **Runtime:** Node.js 20+ (LTS)
- **Language:** TypeScript with strict mode
- **Storage:** SQLite via better-sqlite3 for local persistence
- **CLI Framework:** Commander.js for argument parsing
- **Testing:** Vitest for unit and integration tests

## Architecture

### Overview

TaskFlow follows a layered CLI architecture:

```
CLI Layer (Commander.js) -> Service Layer -> Repository Layer -> SQLite
```

All data is stored locally in a SQLite database at `~/.taskflow/data.db`. The application is designed to be **offline-first** with no cloud dependencies for core functionality.

### Key Components

1. **CLI Parser** - Handles command routing, argument validation, and output formatting
2. **Task Service** - Business logic for task CRUD, dependency resolution, and status transitions
3. **Project Service** - Project lifecycle management, milestone tracking, health calculations
4. **Storage Engine** - SQLite operations with WAL mode for concurrent read access
5. **Report Generator** - Aggregates task data into summary reports and exports

### Data Model

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  archived_at DATETIME
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  title TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  parent_id TEXT REFERENCES tasks(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);
```

## Constraints

- **Offline-first:** Core task management must work without any network connectivity
- **Single binary:** Distribution as a single executable via `pkg` or similar bundler
- **No cloud account required:** Users should never need to create an account for local-only usage
- **Backward compatibility:** Database schema migrations must preserve existing user data

## Performance Requirements

- Cold start: < 150ms
- Task creation: < 50ms
- Query up to 10,000 tasks: < 200ms
- SQLite database size limit: 500MB before warning user

## Security

- No sensitive data transmitted over the network in local-only mode
- Database file permissions set to owner-only (0600)
- API keys for optional sync stored in OS keychain, never in plaintext config files
