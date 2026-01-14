from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import glob

router = APIRouter()

MODULES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "data", "modules")
os.makedirs(MODULES_DIR, exist_ok=True)

class ModuleCreate(BaseModel):
    name: str
    content: str

class ModuleUpdate(BaseModel):
    content: str

class ModuleResponse(BaseModel):
    name: str
    content: str

@router.get("/", response_model=list[ModuleResponse])
async def list_modules():
    """List all available modules and their content."""
    modules = []
    # Ensure default exists
    if not os.path.exists(os.path.join(MODULES_DIR, "default.md")):
        with open(os.path.join(MODULES_DIR, "default.md"), "w", encoding="utf-8") as f:
            f.write("Default operating mode.")
    
    for file_path in glob.glob(os.path.join(MODULES_DIR, "*.md")):
        name = os.path.basename(file_path).replace(".md", "")
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        modules.append(ModuleResponse(name=name, content=content))
    return modules

@router.post("/", response_model=ModuleResponse)
async def create_module(module: ModuleCreate):
    """Create a new module."""
    # Sanitize name
    safe_name = "".join([c for c in module.name if c.isalnum() or c in ('-', '_')]).lower()
    if not safe_name:
        raise HTTPException(status_code=400, detail="Invalid module name")
    
    file_path = os.path.join(MODULES_DIR, f"{safe_name}.md")
    if os.path.exists(file_path):
        raise HTTPException(status_code=400, detail="Module already exists")
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(module.content)
    
    return ModuleResponse(name=safe_name, content=module.content)

@router.put("/{name}", response_model=ModuleResponse)
async def update_module(name: str, module: ModuleUpdate):
    """Update an existing module."""
    file_path = os.path.join(MODULES_DIR, f"{name}.md")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Module not found")
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(module.content)
    
    return ModuleResponse(name=name, content=module.content)

@router.delete("/{name}")
async def delete_module(name: str):
    """Delete a module."""
    if name == "default":
        raise HTTPException(status_code=400, detail="Cannot delete default module")
        
    file_path = os.path.join(MODULES_DIR, f"{name}.md")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Module not found")
    
    os.remove(file_path)
    return {"message": "Module deleted successfully"}
