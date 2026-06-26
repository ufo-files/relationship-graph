## What changed

- [ ] Reclassification updates in `data/reclass.json`
- [ ] Transcript source files in `data/transcripts/`
- [ ] Extraction, graph, or UI code
- [ ] Documentation or repository maintenance

## Validation

- [ ] I ran `python scripts/validate_repo.py`
- [ ] I ran `python -m unittest discover -s tests -v`
- [ ] I ran `python build_graph.py` when changing the builder or transcript data

## Notes

Generated app files should not be edited by hand. The rebuild workflow regenerates them after source data is merged.
