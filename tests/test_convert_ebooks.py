from __future__ import annotations

import csv
import tempfile
import unittest
import zipfile
from pathlib import Path

from scripts import convert_ebooks


class ConvertEbooksTests(unittest.TestCase):
    def test_epub_to_public_snippet_tsv(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source_dir = root / "documents"
            output_dir = root / "transcripts"
            source_dir.mkdir()
            epub = source_dir / "Sample Book.epub"
            make_epub(
                epub,
                """
                <html><body>
                <p>Bob Lazar discussed Area 51 with NASA and the Central Intelligence Agency in a short test passage.</p>
                <p>This unrelated paragraph has no terms that should matter.</p>
                </body></html>
                """,
            )

            converted = convert_ebooks.convert_directory(source_dir=source_dir, output_dir=output_dir, max_chars=220)

            self.assertEqual(len(converted), 1)
            self.assertEqual(converted[0].segments, 1)
            output = output_dir / "ebook-sample-book.tsv"
            self.assertTrue(output.exists())

            with output.open("r", encoding="utf-8", newline="") as handle:
                rows = list(csv.DictReader(handle, delimiter="\t"))

            self.assertEqual(rows[0]["start"], "0")
            self.assertEqual(rows[0]["end"], "1000")
            self.assertIn("Section 1:", rows[0]["text"])
            self.assertIn("Bob Lazar", rows[0]["text"])
            self.assertIn("Area 51", rows[0]["text"])


def make_epub(path: Path, body: str) -> None:
    with zipfile.ZipFile(path, "w") as archive:
        archive.writestr("mimetype", "application/epub+zip")
        archive.writestr(
            "META-INF/container.xml",
            """<?xml version="1.0"?>
            <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
              <rootfiles>
                <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
              </rootfiles>
            </container>
            """,
        )
        archive.writestr(
            "OEBPS/content.opf",
            """<?xml version="1.0"?>
            <package xmlns="http://www.idpf.org/2007/opf" version="3.0">
              <manifest>
                <item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/>
              </manifest>
              <spine>
                <itemref idref="chapter"/>
              </spine>
            </package>
            """,
        )
        archive.writestr("OEBPS/chapter.xhtml", body)


if __name__ == "__main__":
    unittest.main()
