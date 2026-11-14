import re
from pathlib import Path

import pandas as pd

from app.services.ingestion.tokens import normalize_text
from app.services.ingestion.types import TextBlock

ALLOWED_EXTENSIONS = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".markdown": "text/markdown",
    ".csv": "text/csv",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


def parse_file(path: Path, filename: str) -> list[TextBlock]:
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        return _parse_pdf(path)
    if ext == ".docx":
        return _parse_docx(path)
    if ext in {".md", ".markdown"}:
        return _parse_markdown(path.read_text(encoding="utf-8"))
    if ext == ".csv":
        frame = pd.read_csv(path)
        return [TextBlock(_frame_to_text(frame, "CSV"), None, "CSV")]
    if ext == ".xlsx":
        sheets = pd.read_excel(path, sheet_name=None)
        blocks = []
        for name, frame in sheets.items():
            blocks.append(TextBlock(_frame_to_text(frame, str(name)), None, str(name)))
        return blocks
    return _parse_plain(path.read_text(encoding="utf-8"))


def _parse_pdf(path: Path) -> list[TextBlock]:
    import fitz

    blocks: list[TextBlock] = []
    with fitz.open(path) as document:
        for index, page in enumerate(document, start=1):
            text = normalize_text(page.get_text("text") or "")
            if text:
                blocks.append(TextBlock(text, index, None))
    return blocks


def _parse_docx(path: Path) -> list[TextBlock]:
    from docx import Document
    from docx.oxml.table import CT_Tbl
    from docx.oxml.text.paragraph import CT_P
    from docx.table import Table
    from docx.text.paragraph import Paragraph

    document = Document(str(path))
    blocks: list[TextBlock] = []
    section: str | None = None
    buffer: list[str] = []

    def emit() -> None:
        nonlocal buffer
        text = normalize_text("\n".join(buffer))
        if text:
            blocks.append(TextBlock(text, None, section))
        buffer = []

    for child in document.element.body.iterchildren():
        if isinstance(child, CT_P):
            paragraph = Paragraph(child, document)
            style = paragraph.style.name if paragraph.style is not None else ""
            if style.startswith("Heading"):
                emit()
                section = paragraph.text.strip() or section
                if paragraph.text.strip():
                    buffer.append(paragraph.text)
            elif paragraph.text.strip():
                buffer.append(paragraph.text)
        elif isinstance(child, CT_Tbl):
            emit()
            table = Table(child, document)
            rows = []
            for row in table.rows:
                cells = [cell.text.strip() for cell in row.cells]
                rows.append(" | ".join(cells))
            text = normalize_text("\n".join(rows))
            if text:
                blocks.append(TextBlock(text, None, section))
    emit()
    return blocks


def _parse_markdown(text: str) -> list[TextBlock]:
    blocks: list[TextBlock] = []
    section: str | None = None
    buffer: list[str] = []

    def emit() -> None:
        nonlocal buffer
        joined = normalize_text("\n".join(buffer))
        if joined:
            blocks.append(TextBlock(joined, None, section))
        buffer = []

    for line in text.splitlines():
        match = re.match(r"^(#{1,6})\s+(.*)$", line)
        if match:
            emit()
            section = match.group(2).strip()
            buffer.append(line)
        else:
            buffer.append(line)
    emit()
    return blocks


def _parse_plain(text: str) -> list[TextBlock]:
    parts = re.split(r"\n\s*\n", text)
    blocks = [TextBlock(normalize_text(part), None, None) for part in parts if normalize_text(part)]
    return blocks or [TextBlock(normalize_text(text), None, None)]


def _frame_to_text(frame: pd.DataFrame, title: str) -> str:
    frame = frame.fillna("")
    lines = [f"# {title}"]
    for index, row in frame.iterrows():
        pairs = [f"{column}: {row[column]}" for column in frame.columns]
        lines.append(f"Row {int(index) + 1 if str(index).isdigit() else index}: " + "; ".join(pairs))
    return "\n".join(lines)
