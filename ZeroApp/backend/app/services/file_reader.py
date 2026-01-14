import os
import aiofiles
from fastapi import UploadFile, HTTPException
from typing import Optional, Dict, Any
import logging

# Document Parsers
try:
    from pypdf import PdfReader
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

try:
    from docx import Document
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False

logger = logging.getLogger(__name__)

class FileReader:
    """
    A unified service to read content from various file types.
    Supports:
    - Text files (.txt, .md, .py, .json, .log, etc.)
    - PDF (.pdf)
    - Word (.docx)
    """

    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)

    async def save_and_read(self, file: UploadFile) -> Dict[str, Any]:
        """
        Saves the file locally and attempts to read its content.
        Returns a dict with metadata and content.
        """
        # Sanitize filename (handle Chinese characters)
        import urllib.parse
        filename = file.filename
        
        # If filename is empty or None, use a default
        if not filename:
             filename = "unnamed_file"

        # Ensure upload directory exists
        if not os.path.exists(self.upload_dir):
            os.makedirs(self.upload_dir)

        # 1. Save File
        try:
            # Handle filename with special characters
            import urllib.parse
            # Use safe filename if original contains risky chars, but try to keep extension
            safe_filename = "".join([c for c in filename if c.isalpha() or c.isdigit() or c in (' ', '.', '_', '-')]).strip()
            if not safe_filename:
                safe_filename = "unnamed_file" + os.path.splitext(filename)[1]
            
            file_path = os.path.join(self.upload_dir, safe_filename)

            async with aiofiles.open(file_path, 'wb') as out_file:
                # Read in chunks to avoid memory issues with large files
                while content := await file.read(1024 * 1024):  # 1MB chunks
                    await out_file.write(content)
                # Reset cursor for reading (not needed for UploadFile.read() usually but safe)
                await file.seek(0) 
        except Exception as e:
            logger.error(f"Failed to save file {filename}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

        # 2. Identify Type & Read
        file_ext = os.path.splitext(file_path)[1].lower()
        content_text = ""
        read_method = "unknown"

        try:
            if file_ext in ['.txt', '.md', '.py', '.js', '.ts', '.tsx', '.json', '.log', '.csv', '.yml', '.yaml', '.html', '.css', '.env']:
                content_text = await self._read_text(file_path)
                read_method = "text_direct"
            
            elif file_ext == '.pdf':
                if HAS_PYPDF:
                    content_text = self._read_pdf(file_path)
                    read_method = "pypdf"
                else:
                    content_text = "[Error] PDF parser (pypdf) not installed."
                    read_method = "missing_dependency"

            elif file_ext == '.docx':
                if HAS_DOCX:
                    content_text = self._read_docx(file_path)
                    read_method = "python-docx"
                else:
                    content_text = "[Error] Word parser (python-docx) not installed."
                    read_method = "missing_dependency"
            
            elif file_ext in ['.png', '.jpg', '.jpeg', '.gif', '.webp']:
                content_text = "[Image File] Visual content analysis is currently offline. (Zero Eye Module required)"
                read_method = "image_placeholder"

            else:
                # Try reading as text for unknown extensions, fallback to binary msg
                try:
                    content_text = await self._read_text(file_path)
                    read_method = "text_fallback"
                except:
                    content_text = f"[Binary File] Cannot read content of {file_ext} file."
                    read_method = "binary_skip"

        except Exception as e:
            logger.error(f"Error reading file {filename}: {str(e)}")
            content_text = f"[Error] Failed to read file content: {str(e)}"
            read_method = "error"

        return {
            "filename": filename,
            "path": file_path,
            "size": os.path.getsize(file_path),
            "type": file_ext,
            "read_method": read_method,
            "content": content_text
        }

    async def _read_text(self, path: str) -> str:
        async with aiofiles.open(path, 'r', encoding='utf-8', errors='ignore') as f:
            return await f.read()

    def _read_pdf(self, path: str) -> str:
        text = ""
        try:
            reader = PdfReader(path)
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        except Exception as e:
            text = f"[PDF Error] {str(e)}"
        
        # Fallback if text is empty (e.g. Scanned PDF)
        if not text.strip():
            text = "[PDF Content] This PDF appears to be empty or contains scanned images. OCR module is not active."
            
        return text

    def _read_docx(self, path: str) -> str:
        text = ""
        try:
            doc = Document(path)
            for para in doc.paragraphs:
                text += para.text + "\n"
        except Exception as e:
            text = f"[Docx Error] {str(e)}"
        return text
