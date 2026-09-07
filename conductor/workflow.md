# Workflow: Palladius Vetrina

## Development Standards
1. **Spec-Driven Development**: Plan every non-trivial enhancement via Conductor tracks (`spec.md` -> `plan.md` -> implementation -> verification).
2. **Schema Integrity & TDD**: Every change to data schemas or parsers must be accompanied by automated validation in `tests/test_games_yaml.py` before merging.
3. **Continuous Build**: Run `bin/build.py` whenever data sources are modified to regenerate both `data/games.json` and `assets/js/games-data.js`.
4. **Clean Commits**: Semantic commit messages (`feat:`, `fix:`, `chore:`, `docs:`).
