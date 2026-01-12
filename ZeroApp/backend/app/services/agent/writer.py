from app.models.agent import TrendReport, WritingMethod
from app.core.llm import LLMFactory
import json

class WriterAgent:
    async def refine_script(self, script: str, instruction: str) -> str:
        """Refine the script based on user instruction using LLM"""
        client = LLMFactory.get_client()
        model = LLMFactory.get_model()
        
        if not client:
             # Fallback to mock if no client configured
            refined_script = script + f"\n\n[AI NOTE: Refined based on instruction: '{instruction}']\n[ADJUSTMENT: Enhanced dialogue punchlines and added visual cues.]"
            if "sarcastic" in instruction.lower() or "毒舌" in instruction:
                refined_script = refined_script.replace("Acidic", "Venomous")
                refined_script = refined_script.replace("Disdain", "Looking at garbage")
            return refined_script

        try:
            prompt = f"""
You are a top-tier Short Play (Reels/TikTok) Screenwriter.
Your task is to REFINE the following script based on the User's specific instruction.

ORIGINAL SCRIPT:
{script}

USER INSTRUCTION:
{instruction}

REQUIREMENTS:
1. Maintain the original format (Title, Scene headers, etc.).
2. Apply the requested changes creatively.
3. Keep the pacing fast (Golden 3 seconds, etc.).
4. Output ONLY the refined script content.
"""
            response = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"LLM Refine Error: {e}")
            return script + f"\n\n[System Error during refinement: {str(e)}]"

    async def write_script(self, trend: TrendReport, method: WritingMethod) -> str:
        """Generate a script based on trend and methodology using LLM"""
        client = LLMFactory.get_client()
        model = LLMFactory.get_model()

        if not client:
            # Fallback Mock
            return self._mock_script(trend, method)

        try:
            prompt = f"""
You are a professional Short Play (Vertical Drama) Screenwriter.
Create a high-retention 1-minute script based on the following analysis.

TOPIC/TREND: {trend.topic}
KEYWORDS: {", ".join(trend.keywords)}
SUMMARY: {trend.summary}
INSPIRATION: {", ".join(trend.inspiration_points)}

METHODOLOGY: {method.method_name}
CORE LOGIC: {method.core_logic}
STRUCTURE: {method.structure_template}

REQUIREMENTS:
1. Format: Standard Screenplay (Scene Headings, Character names, Dialogue, Parentheticals).
2. Pacing: Extremely fast. Conflict must start in 0-3 seconds.
3. Tone: Emotional, Dramatic, or Face-slapping (Shuangwen).
4. Output ONLY the script content.
"""
            response = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"LLM Write Error: {e}")
            return self._mock_script(trend, method)

    def _mock_script(self, trend: TrendReport, method: WritingMethod) -> str:
        return f"""
# Title: 《{trend.topic}》 (MOCK GENERATED - CONFIGURE API KEY FOR REAL AI)
# Core Trope: {trend.inspiration_points[0]}
# Methodology: {method.method_name}

【Episode 1】
【Scene】 Park Matchmaking Corner | Day | Outdoor
【Characters】 Li Xiulan (55, Plain), Lin Zhentian (60, Security Uniform, actually Richest Man)

(0-3s Golden Opening)
(Li Xiulan holds a crumpled matchmaking ad, pushed by a heavily made-up older woman)
Aunt Wang: (Acidic) With your shabby look, you want a man with a pension? Look in the mirror!
Li Xiulan: (Stumbling) I... I just want a companion...

(3-15s Development)
(Lin Zhentian steps forward, supporting Li Xiulan. Old uniform, but sharp eyes)
Lin Zhentian: Sister, are you alright?
Aunt Wang: (Disdain) Oh, a scavenger matches a street sweeper. Perfect match!
Lin Zhentian: (Sneer) Who is trash is yet to be seen.

(15-45s Conflict Escalation)
(Aunt Wang shows off her gold bracelet)
Aunt Wang: See this? My son-in-law gave it! You low-class people never saw this, right?
(Lin Zhentian glances at his watch - a Patek Philippe Limited Edition)
Lin Zhentian: (Internal Monologue) Such trash dares to show off in front of me?

(45-60s Ending Hook)
(A Rolls Royce slowly stops at the park gate. The driver runs over respectfully)
Driver: (Shouting) Chairman! That multi-billion contract...
(Everyone looks over. Lin Zhentian winks at the driver)
Lin Zhentian: (Pretending) Wrong person? I'm just a gatekeeper.
(Li Xiulan looks at Lin Zhentian gratefully, Aunt Wang looks suspicious)
【End of Episode】 Hook: How will Lin Zhentian keep his identity? How will Aunt Wang make trouble?
"""
