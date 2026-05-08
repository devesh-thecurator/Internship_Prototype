import os
import re

import fitz
import pdfplumber
import pytesseract
from PIL import Image

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


def extract_text_from_file(path: str) -> str:
    if not os.path.exists(path):
        return ''

    lowered = path.lower()
    if lowered.endswith('.pdf'):
        return extract_text_from_pdf(path)
    if lowered.endswith(('.png', '.jpg', '.jpeg', '.tiff', '.bmp')):
        return _extract_text_from_image_path(path)

    try:
        with open(path, 'r', encoding='utf-8', errors='ignore') as handle:
            return handle.read()
    except Exception:
        return ''
