## What this changes

<!-- One module per pull request where possible: content and lab together. -->

## Checklist

- [ ] `./tools/Test-GuideContent.ps1` passes locally
- [ ] Every new claim traces to a Microsoft Learn page listed in the lesson's Sources block
- [ ] `last_verified` bumped only where the product documentation was actually re-checked
- [ ] No exam dumps, recalled exam questions or live-exam content
- [ ] New or changed questions carry a verbatim `sub_skill` and a `why_not` note for every wrong option
- [ ] Diagrams (if any) restate the lesson text, carry `accTitle`/`accDescr`, and are top-down
- [ ] Labs (if touched) were run end to end, **including teardown**, and the cost header still matches
- [ ] If files under `assets/` changed: `CACHE_VERSION` bumped in `sw.js`, and `node tools/a11y-check.js` is clean
- [ ] If an objective heading changed: `docs/SKILLS-MEASURED-SNAPSHOT.md`, `content/manifest.json`, `docs/SYLLABUS.md` and `content/official-training.json` updated together
