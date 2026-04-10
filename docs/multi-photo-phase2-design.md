# Multi-Photo Phase 2 Design (Draft)

## Goal
- Generalize the current A/B-only battle model to support `1 photo` and `3+ photos`.
- In this cycle, keep implementation on hold and finalize only design + migration drafts.

## Target Data Model
- Keep `battles` as battle metadata.
- Move image entries into `battle_images`:
  - `battle_id`, `position`, `image_url`, `created_at`
- Move vote selection to index-based model:
  - `votes.choice_index` (int)
  - legacy `votes.choice` is temporary during compatibility window.
- Move reason target to index-based model:
  - `vote_reasons.selected_index` (int)
  - legacy `selected_slot` is temporary during compatibility window.

## Product Modes
1. Single Photo Mode (`count = 1`)
- Feedback/evaluation flow instead of A/B choice voting.
- Result is score/feedback oriented.

2. Multi Photo Mode (`count >= 3`)
- Single-choice voting among N candidates.
- Result shows per-image vote count, percent, and ranking.

## Compatibility Strategy
- Keep current A/B flow stable while phase 2 is in progress.
- Migrate writes/reads in two steps:
1. **Expand migration** (additive, backward compatible)
2. **Contract migration** (remove legacy A/B columns after app cutover)

## Migration Drafts
- Step 1: [docs/migrations/multi-photo-step1-expand.sql](c:/Users/user/pick-one/docs/migrations/multi-photo-step1-expand.sql)
- Step 2: [docs/migrations/multi-photo-step2-contract.sql](c:/Users/user/pick-one/docs/migrations/multi-photo-step2-contract.sql)

## Risks
- Current reason model assumes A/B (`selected_slot`), so index migration must be coordinated with app release.
- Results for N-choice battles may need optimized aggregation (RPC/materialized view) for scale.
