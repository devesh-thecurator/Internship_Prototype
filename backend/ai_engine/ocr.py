import os
import re
import zipfile
from xml.etree import ElementTree

import fitz
import pdfplumber
import pytesseract
from PIL import Image

try:
    import pandas as pd
except Exception:
    pd = None

DEFAULT_TESSERACT = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
if os.path.exists(DEFAULT_TESSERACT):
    pytesseract.pytesseract.tesseract_cmd = os.getenv('TESSERACT_CMD', DEFAULT_TESSERACT)


def _extract_text_from_image_path(path: str) -> str:
    try:
        with Image.open(path) as image:
            return pytesseract.image_to_string(image)
    except Exception:
        return ''


def extract_text_from_pdf(path: str) -> str:
    text = []
    try:
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ''
                text.append(page_text)
    except Exception:
        pass

    if ''.join(text).strip():
        return '\n\n'.join(text)

    try:
        with fitz.open(path) as pdf:
            for page in pdf:
                pix = page.get_pixmap(dpi=200)
                img = Image.frombytes('RGB', [pix.width, pix.height], pix.samples)
                text.append(pytesseract.image_to_string(img))
    except Exception:
        pass

    return '\n\n'.join([block for block in text if block])


def extract_text_from_docx(path: str) -> str:
    try:
        with zipfile.ZipFile(path) as archive:
            document_parts = [
                name
                for name in archive.namelist()
                if name == 'word/document.xml' or name.startswith('word/header') or name.startswith('word/footer')
            ]
            blocks = []
            namespace = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            for part in document_parts:
                root = ElementTree.fromstring(archive.read(part))
                for paragraph in root.findall('.//w:p', namespace):
                    text = ''.join(node.text or '' for node in paragraph.findall('.//w:t', namespace)).strip()
                    if text:
                        blocks.append(text)
            return '\n'.join(blocks)
    except Exception:
        return ''


def extract_text_from_excel(path: str) -> str:
    if pd is None:
        return ''
    try:
        sheets = pd.read_excel(path, sheet_name=None, dtype=str)
    except Exception:
        return ''

    blocks = []
    for sheet_name, frame in sheets.items():
        blocks.append(f'Sheet: {sheet_name}')
        for row in frame.fillna('').astype(str).values.tolist():
            line = ' | '.join(value.strip() for value in row if value and value.strip())
            if line:
                blocks.append(line)
    return '\n'.join(blocks)


def extract_text_from_file(path: str) -> str:
    if not os.path.exists(path):
        return ''

    lowered = path.lower()
    if lowered.endswith('.pdf'):
        return extract_text_from_pdf(path)
    if lowered.endswith(('.png', '.jpg', '.jpeg', '.tiff', '.bmp')):
        return _extract_text_from_image_path(path)
    if lowered.endswith('.docx'):
        return extract_text_from_docx(path)
    if lowered.endswith(('.xlsx', '.xls')):
        return extract_text_from_excel(path)

    try:
        with open(path, 'r', encoding='utf-8', errors='ignore') as handle:
            return handle.read()
    except Exception:
        return ''
