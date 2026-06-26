from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

import build_graph


class BuildGraphParsingTests(unittest.TestCase):
    def test_parse_timestamp_ms(self) -> None:
        self.assertEqual(build_graph.parse_timestamp_ms("00:01:02.500"), 62500)
        self.assertEqual(build_graph.parse_timestamp_ms("01:02,250"), 62250)
        self.assertEqual(build_graph.parse_timestamp_ms("bad"), 0)

    def test_parse_subtitles(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "sample.srt"
            path.write_text("1\n00:00:01,000 --> 00:00:02,500\nFirst line.\nSecond line.\n", encoding="utf-8")
            rows = build_graph.parse_subtitles(path)
        self.assertEqual(rows, [{"start_ms": 1000, "end_ms": 2500, "text": "First line. Second line."}])

    def test_parse_json_segments(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "sample.json"
            path.write_text(json.dumps({"segments": [{"start": 1.5, "end": 2.25, "text": "Segment text"}]}), encoding="utf-8")
            rows = build_graph.parse_json(path)
        self.assertEqual(rows, [{"start_ms": 1500, "end_ms": 2250, "text": "Segment text"}])

    def test_review_export_removes_runtime_source_path(self) -> None:
        review = {
            "source_path": "data/reclass.json",
            "reclassifications": {"people:test": "locations"},
        }
        exported = build_graph.export_review(review)
        self.assertNotIn("source_path", exported)
        self.assertEqual(exported["reclassifications"], {"people:test": "locations"})
        self.assertEqual(exported["falsePositives"], {})

    def test_name_reclassifications_are_derived_from_entity_ids(self) -> None:
        review = {"reclassifications": {"people:department-of-energy": "government_agencies"}}
        build_graph.normalize_review(review)
        build_graph.add_name_reclassifications_from_ids(review)
        self.assertEqual(review["nameReclassifications"]["department of energy"], "government_agencies")


if __name__ == "__main__":
    unittest.main()
