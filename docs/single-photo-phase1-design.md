# Single-Photo Phase 1 Design (Draft)

## Goal
- Add `1 photo + like/dislike` mode with minimal risk.
- Keep current A/B duel flow unchanged.
- Prepare clean handoff to Phase 2 multi-photo model.

## Why Phase 1 First
- Lower implementation complexity than `3+ photos`.
- Faster learning loop for participation/retention.
- Reuses existing share/result/comment pipeline with fewer breaking changes.

## Product Scope (Phase 1)
1. New battle mode: `single_reaction`
- Creator uploads 1 photo.
- Voter chooses `LIKE` or `DISLIKE`.

2. Existing mode remains: `duel`
- Current A/B voting remains as-is.

3. Result view
- `single_reaction`: show like/dislike counts + percentages.
- `duel`: unchanged.

## Data Model (Additive)
1. `battles.mode`
- Type: `text`
- Values: `duel | single_reaction`
- Default: `duel`

2. `votes.reaction`
- Type: `text`
- Values: `LIKE | DISLIKE`
- Nullable for duel rows.

## API/Service Direction
1. `createBattle`
- Add input: `mode?: 'duel' | 'single_reaction'`
- For now, keep storage compatible:
  - `duel`: current `image_a_url`, `image_b_url`
  - `single_reaction`: store image in `image_a_url`, set `image_b_url` to same or placeholder policy (implementation choice)

2. `submitVote`
- Add union input:
  - duel: `choice: 'A' | 'B'`
  - single_reaction: `reaction: 'LIKE' | 'DISLIKE'`

3. `getVoteResults`
- Return shape by mode:
  - duel: current result schema
  - single_reaction: `{ total, like_count, dislike_count, like_percent, dislike_percent }`

## UI/Routing Direction
1. Create screen
- Add mode toggle (`duel` / `single_reaction`).
- In `single_reaction`, hide B slot.

2. Web vote page `/web/b/[token]`
- Branch rendering by `battle.mode`.
- `single_reaction`: 1 image + like/dislike buttons.

3. Result page `/result/[battleId]`
- Branch result cards by mode.
- Keep comments section behavior identical.

## Metrics (Recommended)
- `battle_created` with `mode`
- `vote_submitted` with `mode`, `reaction|choice`
- Conversion per mode:
  - share click -> vote submit
  - vote submit -> comment submit

## Rollout Plan
1. DB expand migration (additive only)
2. App read path supports both modes
3. App write path gated by feature flag for `single_reaction`
4. Enable for internal cohort, then broad rollout
5. After stabilizing Phase 1, continue to Phase 2 (`battle_images` + index voting)

## Compatibility With Phase 2
- This phase does not block existing multi-photo drafts.
- In Phase 2, `single_reaction` can map naturally to `count = 1` on `battle_images`.

## Migration Draft
- [docs/migrations/single-photo-step1-expand.sql](c:/Users/user/pick-one/docs/migrations/single-photo-step1-expand.sql)
