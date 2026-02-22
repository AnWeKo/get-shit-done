# TaskFlow CLI - User Stories

## Task Management

### US-01: Create a Task
**As a** developer, **I want to** create a new task from the command line **so that** I can quickly capture work items without leaving my terminal.

**Acceptance Criteria:**
- `taskflow add "Fix login bug" --priority high --project myapp` creates a task
- Task is immediately visible in `taskflow list`
- Task gets a unique short ID (e.g., TF-42) for easy reference

### US-02: Complete a Task
**As a** developer, **I want to** mark a task as done **so that** I can track my progress and see what's finished.

**Acceptance Criteria:**
- `taskflow done TF-42` marks the task as completed with a timestamp
- Completed tasks are hidden from default `taskflow list` but visible with `--all` flag
- Completing a parent task warns if subtasks are still open

### US-03: Filter and Search Tasks
**As a** developer, **I want to** filter tasks by project, priority, or tags **so that** I can focus on what matters right now.

**Acceptance Criteria:**
- `taskflow list --project myapp` shows only tasks in that project
- `taskflow list --priority critical` shows only critical tasks
- `taskflow list --tag backend` shows tasks with the "backend" tag
- Multiple filters can be combined: `taskflow list --project myapp --priority high`

## Reporting

### US-04: Generate Weekly Report
**As a** team lead, **I want to** generate a summary of completed work **so that** I can share progress with stakeholders.

**Acceptance Criteria:**
- `taskflow report --week` shows tasks completed in the last 7 days
- Report includes task count, breakdown by project, and velocity trend
- `taskflow report --week --format json` outputs machine-readable JSON
