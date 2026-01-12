from app.core.void_engine import VoidEngine
from app.core.memory import MemoryInterface
import os

# Singleton Instances
_memory = None
_engine = None

def get_memory() -> MemoryInterface:
    global _memory
    if _memory is None:
        # Ensure path exists
        mem_path = os.path.join(os.getcwd(), "ZeroApp", "backend", "data", "long_term.json")
        _memory = MemoryInterface(mem_path)
    return _memory

def get_engine() -> VoidEngine:
    global _engine
    if _engine is None:
        mem = get_memory()
        _engine = VoidEngine(memory_interface=mem)
        # Restore state from memory if available
        saved_state = mem.get("void_engine_state")
        if saved_state:
            _engine.void_level = saved_state.get("void_level", 100.0)
            _engine.carbon_level = saved_state.get("carbon_level", 0.0)
    return _engine

def save_engine_state():
    if _engine and _memory:
        state = {
            "void_level": _engine.void_level,
            "carbon_level": _engine.carbon_level
        }
        _memory.set("void_engine_state", state)
