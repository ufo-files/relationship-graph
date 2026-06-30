#!/usr/bin/env python3
"""Convert local EPUB files into public transcript-style TSV snippets.

EPUB files stay local. The generated TSV files contain short evidence windows
around extracted entities so build_graph.py can publish graph data and snippets
without publishing the full ebook text.
"""

from __future__ import annotations

import argparse
import csv
import html
import os
import posixpath
import re
import sys
import zipfile
from dataclasses import dataclass
from html.parser import HTMLParser
from collections.abc import Iterable
from pathlib import Path
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE_DATA_DIR = ROOT.parent / "data" / "data"
LEGACY_SOURCE_DATA_DIR = ROOT.parent / "uap-data" / "data"
CONFIGURED_SOURCE_DATA_DIR = os.environ.get("UFO_FILES_DATA_DIR") or os.environ.get("UAP_DATA_DIR")
DATA_DIR = Path(
    CONFIGURED_SOURCE_DATA_DIR
    or (
        DEFAULT_SOURCE_DATA_DIR
        if DEFAULT_SOURCE_DATA_DIR.exists()
        else LEGACY_SOURCE_DATA_DIR
        if LEGACY_SOURCE_DATA_DIR.exists()
        else ROOT / "data"
    )
)
if not DATA_DIR.is_absolute():
    DATA_DIR = ROOT / DATA_DIR
DATA_DIR = DATA_DIR.resolve()
DOCUMENTS_DIR = DATA_DIR / "documents"
TRANSCRIPTS_DIR = DATA_DIR / "transcripts"
OUTPUT_PREFIX = "ebook-"
SUPPORTED_EBOOKS = {".epub"}
SKIPPED_DOCUMENTS = {".pdf"}
COMMON_SNIPPET_TOKENS = {
    "and",
    "are",
    "but",
    "for",
    "from",
    "had",
    "has",
    "have",
    "his",
    "not",
    "section",
    "that",
    "the",
    "their",
    "this",
    "was",
    "were",
    "with",
}

sys.path.insert(0, str(ROOT))
import build_graph  # noqa: E402


@dataclass(frozen=True)
class ConvertedDocument:
    source: Path
    output: Path
    segments: int
    words: int


@dataclass(frozen=True)
class SnippetCandidate:
    text: str
    score: int


class HtmlTextExtractor(HTMLParser):
    BLOCK_TAGS = {
        "address",
        "article",
        "aside",
        "blockquote",
        "br",
        "dd",
        "div",
        "dl",
        "dt",
        "figcaption",
        "footer",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "header",
        "hr",
        "li",
        "main",
        "nav",
        "ol",
        "p",
        "pre",
        "section",
        "table",
        "td",
        "th",
        "tr",
        "ul",
    }
    SKIP_TAGS = {"script", "style", "svg"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        if tag in self.SKIP_TAGS:
            self.skip_depth += 1
            return
        if tag in self.BLOCK_TAGS:
            self.parts.append("\n")
        if tag == "img":
            alt = dict(attrs).get("alt")
            if alt:
                self.parts.append(f" {alt} ")

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in self.SKIP_TAGS and self.skip_depth:
            self.skip_depth -= 1
            return
        if tag in self.BLOCK_TAGS:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if self.skip_depth:
            return
        if data.strip():
            self.parts.append(data)

    def text(self) -> str:
        return html.unescape("".join(self.parts))


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert local EPUB files into public data/transcripts snippet TSV sources.")
    parser.add_argument("--source-dir", type=Path, default=DOCUMENTS_DIR)
    parser.add_argument("--output-dir", type=Path, default=TRANSCRIPTS_DIR)
    parser.add_argument("--max-chars", type=int, default=900, help="Approximate maximum characters per public evidence window.")
    parser.add_argument("--max-segments-per-book", type=int, default=300, help="Maximum public evidence windows to emit per EPUB.")
    parser.add_argument("--max-segments-per-section", type=int, default=18, help="Maximum public evidence windows to emit from a single EPUB section.")
    parser.add_argument("--prefix", default=OUTPUT_PREFIX, help="Prefix for generated TSV filenames.")
    parser.add_argument("--keep-existing", action="store_true", help="Do not delete existing generated ebook TSV files first.")
    args = parser.parse_args()

    converted = convert_directory(
        source_dir=args.source_dir,
        output_dir=args.output_dir,
        max_chars=args.max_chars,
        max_segments_per_book=args.max_segments_per_book,
        max_segments_per_section=args.max_segments_per_section,
        prefix=args.prefix,
        keep_existing=args.keep_existing,
    )
    if not converted:
        print(f"No EPUB files converted from {relative(args.source_dir)}.")
        return 0

    total_segments = sum(item.segments for item in converted)
    total_words = sum(item.words for item in converted)
    print(f"Converted {len(converted)} EPUB files into {total_segments} public snippet segments ({total_words} words).")
    for item in converted:
        print(f"- {item.source.name} -> {relative(item.output)} ({item.segments} segments)")
    return 0


def convert_directory(
    source_dir: Path = DOCUMENTS_DIR,
    output_dir: Path = TRANSCRIPTS_DIR,
    max_chars: int = 1200,
    max_segments_per_book: int = 300,
    max_segments_per_section: int = 18,
    prefix: str = OUTPUT_PREFIX,
    keep_existing: bool = False,
) -> list[ConvertedDocument]:
    source_dir = source_dir.resolve()
    output_dir = output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    if not keep_existing:
        for path in sorted(output_dir.glob(f"{prefix}*.tsv")):
            path.unlink()

    converted: list[ConvertedDocument] = []
    for path in sorted(source_dir.iterdir()):
        if path.name.startswith(".") or path.is_dir():
            continue
        suffix = path.suffix.lower()
        if suffix in SKIPPED_DOCUMENTS:
            print(f"Skipping {path.name}: PDF OCR is not implemented in this converter.", file=sys.stderr)
            continue
        if suffix not in SUPPORTED_EBOOKS:
            continue
        try:
            converted.append(
                convert_epub_file(
                    path,
                    output_dir,
                    max_chars=max_chars,
                    max_segments_per_book=max_segments_per_book,
                    max_segments_per_section=max_segments_per_section,
                    prefix=prefix,
                )
            )
        except ValueError as exc:
            print(f"Skipping {path.name}: {exc}", file=sys.stderr)
    return converted


def convert_epub_file(
    path: Path,
    output_dir: Path,
    max_chars: int = 1200,
    max_segments_per_book: int = 300,
    max_segments_per_section: int = 18,
    prefix: str = OUTPUT_PREFIX,
) -> ConvertedDocument:
    sections = extract_epub_sections(path)
    rows = public_snippet_rows(
        path,
        sections,
        max_chars=max_chars,
        max_segments=max_segments_per_book,
        max_segments_per_section=max_segments_per_section,
    )
    if not rows:
        raise ValueError(f"No extractable text found in {path}")

    output = output_dir / f"{prefix}{build_graph.slugify(path.stem)}.tsv"
    with output.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["start", "end", "text"], delimiter="\t", lineterminator="\n")
        writer.writeheader()
        for index, text in enumerate(rows):
            writer.writerow({"start": index * 1000, "end": (index + 1) * 1000, "text": text})
    return ConvertedDocument(source=path, output=output, segments=len(rows), words=sum(len(row.split()) for row in rows))


def extract_epub_sections(path: Path) -> list[tuple[int, str]]:
    with zipfile.ZipFile(path) as archive:
        content_paths = epub_content_paths(archive)
        sections: list[tuple[int, str]] = []
        for content_path in content_paths:
            try:
                raw = archive.read(content_path)
            except KeyError:
                continue
            paragraphs = html_to_paragraphs(raw.decode("utf-8", errors="replace"))
            text = normalize_whitespace(" ".join(paragraphs))
            if text:
                sections.append((len(sections) + 1, text))
    return sections


def public_snippet_rows(
    path: Path,
    sections: list[tuple[int, str]],
    max_chars: int = 900,
    max_segments: int = 300,
    max_segments_per_section: int = 18,
) -> list[str]:
    registry = build_graph.read_registry()
    dictionaries, omit_terms = build_graph.build_dictionaries(registry)
    candidates: dict[str, SnippetCandidate] = {}
    transcript_id = build_graph.slugify(path.stem)
    transcript_title = build_graph.titleize(path.stem)

    for section_index, section_text in sections:
        if likely_back_matter_section(section_text):
            continue
        segment = build_graph.Segment(
            id=f"ebook-{transcript_id}-{section_index:05d}",
            transcript_id=transcript_id,
            transcript_title=transcript_title,
            source_file=path.name,
            start_ms=section_index * 1000,
            end_ms=(section_index + 1) * 1000,
            text=section_text,
        )
        mentions = build_graph.resolve_competing_mentions(build_graph.extract_mentions([segment], dictionaries, omit_terms))
        section_names = {build_graph.normalize_name(mention.name) for mention in mentions}
        section_candidates: dict[str, SnippetCandidate] = {}
        for mention in mentions:
            snippet = public_snippet(section_index, mention.excerpt, max_chars=max_chars)
            if skip_public_snippet(snippet):
                continue
            key = build_graph.normalize_name(snippet)
            score = snippet_score(snippet, section_names)
            existing = section_candidates.get(key)
            if not existing or score > existing.score:
                section_candidates[key] = SnippetCandidate(text=snippet, score=score)
        for key, candidate in top_unique_candidates(section_candidates.values(), max_segments_per_section):
            existing = candidates.get(key)
            if not existing or candidate.score > existing.score:
                candidates[key] = candidate
    return [candidate.text for _, candidate in top_unique_candidates(candidates.values(), max_segments)]


def top_unique_candidates(candidates: Iterable[SnippetCandidate], limit: int) -> list[tuple[str, SnippetCandidate]]:
    selected: list[tuple[str, SnippetCandidate]] = []
    seen_token_sets: list[set[str]] = []
    sorted_candidates = sorted(candidates, key=lambda item: (-item.score, item.text.lower()))
    for candidate in sorted_candidates:
        key = build_graph.normalize_name(candidate.text)
        tokens = snippet_tokens(candidate.text)
        if any(near_duplicate_tokens(tokens, seen) for seen in seen_token_sets):
            continue
        selected.append((key, candidate))
        seen_token_sets.append(tokens)
        if len(selected) >= limit:
            break
    return selected


def snippet_tokens(snippet: str) -> set[str]:
    body = re.sub(r"^Section \d+:\s*", "", snippet).lower()
    return {token for token in re.findall(r"[a-z0-9]{3,}", body) if token not in COMMON_SNIPPET_TOKENS}


def near_duplicate_tokens(left: set[str], right: set[str]) -> bool:
    if not left or not right:
        return False
    overlap = len(left & right)
    smaller = min(len(left), len(right))
    larger = max(len(left), len(right))
    return overlap / smaller >= 0.72 or overlap / larger >= 0.62


def snippet_score(snippet: str, names: set[str]) -> int:
    normalized = build_graph.normalize_name(snippet)
    entity_score = sum(1 for name in names if name and name in normalized) * 20
    return entity_score - citation_noise_score(snippet)


def skip_public_snippet(snippet: str) -> bool:
    body = re.sub(r"^Section \d+:\s*", "", snippet).strip()
    if len(body) < 40:
        return True
    if likely_contents_snippet(body):
        return True
    if re.search(r"(?:^|\s)/[\w./-]{12,}\.(?:pdf|epub|html?)\b", body, re.I):
        return True
    if re.search(r"/input/import-\d+/.*\.(pdf|epub)\b", body, re.I):
        return True
    if citation_noise_score(body) > 34:
        return True
    if len(re.findall(r"\b\d{1,3}(?:[–-]\d{1,3})?\b", body)) >= 14:
        return True
    return False


def likely_back_matter_section(text: str) -> bool:
    sample = normalize_whitespace(text[:5000])
    lowered = sample.lower()
    starts_like_back_matter = re.match(r"^(notes?|endnotes?|bibliography|references|works cited|index|contents|acknowledgments?|acknowledgements?|about the author)\b", lowered)
    if starts_like_back_matter:
        return True
    if re.search(r"\b(notes?|endnotes?|bibliography|references|works cited|index|contents|photo section)\b", lowered[:220]):
        return True
    if re.search(r"\b(acknowledgments?|acknowledgements?|glossary|abbreviations?|acronyms?)\b", lowered[:700]):
        return True
    if likely_contents_snippet(sample[:1600]):
        return True

    words = max(1, len(sample.split()))
    page_refs = len(re.findall(r"\b\d{1,3}(?:[–-]\d{1,3})?\b", sample))
    dense_citations = citation_noise_score(sample) / words > 0.25
    many_reference_markers = len(re.findall(r"\b(university press|journal|vol\.|no\.|pp\.|ibid\.|bibliography|references|doi:|https?://|www\.)\b", lowered)) >= 8
    many_page_refs = page_refs >= 35
    index_like = page_refs >= 28 and (lowered.count(" see") >= 4 or sample.count(",") >= 34)
    first_page = sample[:1600]
    acronym_count = len(re.findall(r"\b[A-Z]{2,10}\b", first_page))
    acronym_definition_pairs = len(re.findall(r"\b[A-Z]{2,10}\b\s+[A-Z][A-Za-z]+(?:\s+[A-Za-z][A-Za-z'-]+){2,}", first_page))
    glossary_like = acronym_count >= 18 and acronym_definition_pairs >= 8
    return index_like or glossary_like or (dense_citations and (many_reference_markers or many_page_refs))


def likely_contents_snippet(text: str) -> bool:
    lowered = text.lower()
    if "contents" not in lowered[:180]:
        return False
    chapter_markers = len(re.findall(r"\b(?:chapter\s+)?\d{1,2}[.:]\s*[A-Z]", text))
    title_case_runs = len(re.findall(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){2,}", text))
    return chapter_markers >= 4 or title_case_runs >= 8


def citation_noise_score(snippet: str) -> int:
    lowered = snippet.lower()
    score = 0
    score += 40 * len(re.findall(r"https?://|www\.|doi:|/[\w./-]{12,}\.(?:pdf|epub|html?)\b", lowered))
    score += 8 * len(re.findall(r"\b(19|20)\d{2}\b", lowered))
    score += 12 * len(re.findall(r"\b(university press|journal|vol\.|no\.|pp\.|ibid\.|bibliography|references|works cited|endnotes?)\b", lowered))
    score += 5 * len(re.findall(r"\b(new york|london|oxford|cambridge):", lowered))
    return score


def public_snippet(section_index: int, text: str, max_chars: int = 420) -> str:
    snippet = normalize_whitespace(text).strip("… ")
    if len(snippet) > max_chars:
        snippet = snippet[:max_chars].rsplit(" ", 1)[0].strip() + "…"
    return f"Section {section_index}: {snippet}"


def epub_content_paths(archive: zipfile.ZipFile) -> list[str]:
    rootfile = "META-INF/container.xml"
    if rootfile not in archive.namelist():
        return fallback_html_paths(archive)

    container = ElementTree.fromstring(archive.read(rootfile))
    root = container.find(".//{*}rootfile")
    if root is None or not root.attrib.get("full-path"):
        return fallback_html_paths(archive)

    opf_path = root.attrib["full-path"]
    opf_dir = posixpath.dirname(opf_path)
    opf = ElementTree.fromstring(archive.read(opf_path))
    manifest: dict[str, tuple[str, str, str]] = {}
    for item in opf.findall(".//{*}manifest/{*}item"):
        item_id = item.attrib.get("id")
        href = item.attrib.get("href")
        if not item_id or not href:
            continue
        media_type = item.attrib.get("media-type", "")
        properties = item.attrib.get("properties", "")
        full_path = posixpath.normpath(posixpath.join(opf_dir, href))
        manifest[item_id] = (full_path, media_type, properties)

    ordered: list[str] = []
    seen: set[str] = set()
    for itemref in opf.findall(".//{*}spine/{*}itemref"):
        item_id = itemref.attrib.get("idref", "")
        full_path, media_type, properties = manifest.get(item_id, ("", "", ""))
        if not is_content_document(full_path, media_type, properties):
            continue
        if full_path not in seen:
            ordered.append(full_path)
            seen.add(full_path)

    if ordered:
        return ordered
    return fallback_html_paths(archive)


def fallback_html_paths(archive: zipfile.ZipFile) -> list[str]:
    return sorted(
        name
        for name in archive.namelist()
        if name.lower().endswith((".html", ".htm", ".xhtml")) and not likely_epub_nav_file(name)
    )


def is_content_document(path: str, media_type: str, properties: str) -> bool:
    if not path or likely_epub_nav_file(path):
        return False
    if "nav" in properties.split():
        return False
    return media_type in {"application/xhtml+xml", "text/html"} or path.lower().endswith((".html", ".htm", ".xhtml"))


def likely_epub_nav_file(path: str) -> bool:
    name = posixpath.basename(path).lower()
    return name in {"toc.xhtml", "toc.html", "nav.xhtml", "nav.html"} or "cover" in name


def html_to_paragraphs(raw_html: str) -> list[str]:
    extractor = HtmlTextExtractor()
    extractor.feed(raw_html)
    return normalize_paragraphs(extractor.text())


def normalize_paragraphs(text: str) -> list[str]:
    text = text.replace("\r", "\n")
    lines = [normalize_whitespace(line) for line in text.splitlines()]
    paragraphs: list[str] = []
    current: list[str] = []
    for line in lines:
        if not line:
            if current:
                paragraphs.append(clean_paragraph(" ".join(current)))
                current = []
            continue
        current.append(line)
    if current:
        paragraphs.append(clean_paragraph(" ".join(current)))
    return [paragraph for paragraph in paragraphs if keep_paragraph(paragraph)]


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def clean_paragraph(text: str) -> str:
    text = normalize_whitespace(text)
    text = re.sub(r"([a-z])-\s+([a-z])", r"\1\2", text)
    return text


def keep_paragraph(text: str) -> bool:
    if len(text) < 24:
        return False
    if not re.search(r"[A-Za-z]", text):
        return False
    return True


def relative(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(ROOT))
    except ValueError:
        return os.path.relpath(path.resolve(), ROOT)


if __name__ == "__main__":
    raise SystemExit(main())
