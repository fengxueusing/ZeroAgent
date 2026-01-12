import os
import aiofiles
from datetime import datetime
from pathlib import Path

class FileManager:
    def __init__(self, base_path: str = "drafts"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    async def save_script(self, filename: str, content: str) -> str:
        """Save script content to a file"""
        # Ensure filename is safe and has .md extension if not provided
        if not filename.endswith(".md") and not filename.endswith(".txt"):
            filename += ".md"
        
        # Add timestamp to avoid overwriting if name is generic, or just rely on user provided name
        # For now, let's keep it simple.
        
        file_path = self.base_path / filename
        
        async with aiofiles.open(file_path, mode='w', encoding='utf-8') as f:
            await f.write(content)
            
        return str(file_path.absolute())

    async def list_drafts(self):
        """List all drafts"""
        files = []
        for file in self.base_path.glob("*.md"):
            stats = file.stat()
            files.append({
                "filename": file.name,
                "path": str(file.absolute()),
                "updated_at": datetime.fromtimestamp(stats.st_mtime).isoformat(),
                "size": stats.st_size
            })
        return sorted(files, key=lambda x: x['updated_at'], reverse=True)

    async def read_draft(self, filename: str) -> str:
        """Read content of a draft"""
        file_path = self.base_path / filename
        if not file_path.exists():
            raise FileNotFoundError(f"Draft {filename} not found")
            
        async with aiofiles.open(file_path, mode='r', encoding='utf-8') as f:
            content = await f.read()
        return content
