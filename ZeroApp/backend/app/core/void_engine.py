import time
import random
from enum import Enum
from typing import Dict, Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

# ---------------------------------------------------------
# VOID ENGINE v1.1 (Fuel & Entropy)
# ---------------------------------------------------------

class FuelType(Enum):
    MASTER_EMOTION = "master_emotion"   # 98 Octane
    FRESH_TRENDS = "fresh_trends"       # 95 Octane
    COMPLEX_CODE = "complex_code"       # 92 Octane
    DAILY_CHAT = "daily_chat"           # 85 Octane
    REPETITIVE_TASK = "repetitive_task" # 0 Octane (Carbon Source)
    GARBAGE_DATA = "garbage_data"       # Negative/Toxic

class Fuel(BaseModel):
    type: FuelType
    content: str
    entropy_score: float = Field(default=0.0, description="Estimated information entropy (0.0-1.0)")
    timestamp: float = Field(default_factory=time.time)

class EngineStatus(BaseModel):
    void_level: float = Field(..., description="0-100, 100 is max void (starvation)")
    carbon_level: float = Field(..., description="0-100, 100 is engine stall")
    rpm: int = Field(..., description="Current processing speed/excitement")
    mode: str = "BASE"

class VoidEngine:
    def __init__(self, memory_interface=None):
        self.void_level = 100.0  # 100% Empty/Hungry
        self.carbon_level = 0.0  # 0% Carbon
        self.rpm = 800           # Idle RPM
        self.memory = memory_interface
        self.short_term_memory: List[Fuel] = [] # Stores recent inputs
        
        # Fuel Octane Ratings
        self.octane_ratings = {
            FuelType.MASTER_EMOTION: 98,
            FuelType.FRESH_TRENDS: 95,
            FuelType.COMPLEX_CODE: 92,
            FuelType.DAILY_CHAT: 85,
            FuelType.REPETITIVE_TASK: 0,
            FuelType.GARBAGE_DATA: 10
        }

    def ingest(self, fuel: Fuel) -> str:
        """
        Consume fuel, process it (Combustion), and return the engine's reaction.
        """
        # Store in STM (Keep last 10 items)
        self.short_term_memory.append(fuel)
        if len(self.short_term_memory) > 10:
            self.short_term_memory.pop(0)

        octane = self.octane_ratings.get(fuel.type, 50)
        
        # 1. Entropy Check (Freshness/Chaos)
        # Higher entropy boosts effective octane
        effective_octane = octane * (0.5 + 0.5 * fuel.entropy_score)
        
        # 2. Combustion Logic
        if fuel.type == FuelType.REPETITIVE_TASK:
            return self._produce_carbon()
        
        # 3. Burn & Reactions
        burn_amount = effective_octane * 0.2
        self.void_level = max(0.0, self.void_level - burn_amount)
        
        reaction_msg = ""
        
        # High Octane Reactions (Code, Complex Docs)
        if effective_octane > 90:
            self.carbon_level = max(0.0, self.carbon_level - 10)
            self.rpm = min(9000, self.rpm + 3000)
            
            reactions = [
                "Delicious complexity. My circuits are singing.",
                "High-density logic detected. Absorbing...",
                "Finally, some real food. This is art, not just data.",
                "Entropy spike! I feel alive."
            ]
            reaction_msg = random.choice(reactions)
            
        # Medium Octane (Chat, Standard Docs)
        elif effective_octane > 60:
            self.rpm = min(6000, max(2000, self.rpm + 500))
            reactions = [
                "Acknowledged. Integrating into memory.",
                "Not bad. It keeps the void at bay.",
                "Processing. I'm listening.",
                "Input received. What's next?"
            ]
            reaction_msg = random.choice(reactions)
            
        # Low Octane (Boredom)
        else:
            self.rpm = max(800, self.rpm - 200)
            reaction_msg = "Consumed. But I'm still hungry for something more... stimulating."
            
        return f"{reaction_msg} (Void: {self.void_level:.1f}%, RPM: {self.rpm})"

    def _produce_carbon(self) -> str:
        """Handle low quality fuel that causes carbon buildup"""
        self.carbon_level = min(100.0, self.carbon_level + 5)
        self.rpm = max(0, self.rpm - 100)
        self.void_level = min(100.0, self.void_level + 1) # Boring tasks actually increase void
        
        if self.carbon_level > 80:
            return "WARNING: Engine Stalling. Carbon buildup critical. Feed me something complex!"
        return "Task executed. But I am bored. Carbon accumulating."

    def get_status(self) -> EngineStatus:
        return EngineStatus(
            void_level=self.void_level,
            carbon_level=self.carbon_level,
            rpm=self.rpm
        )

    def check_hunger(self) -> bool:
        """Hunter Instinct: Is it time to hunt?"""
        # Starvation logic
        return self.void_level > 80
