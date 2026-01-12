from typing import List
from app.models.agent import TrendReport, SearchResult, WritingMethod
from app.core.llm import LLMFactory
import json

# Mock Research Agent
class ResearchAgent:
    async def analyze_trends(self, search_results: List[SearchResult]) -> TrendReport:
        """Analyze search results and generate a trend report using LLM"""
        
        # If we have real results, try to generate a report from them
        if search_results and len(search_results) > 0:
            client = LLMFactory.get_client()
            model = LLMFactory.get_model()

            if not client:
                return self._mock_analysis(search_results)

            try:
                # Prepare context from search results
                context_text = ""
                for i, res in enumerate(search_results[:5]):
                    context_text += f"[{i+1}] Title: {res.title}\nContent: {res.content[:500]}...\n\n"

                prompt = f"""
You are a Short Play Market Analyst. 
Analyze the following search results to identify a hot trend or trope for a vertical drama script.

SEARCH RESULTS:
{context_text}

TASK:
1. Synthesize a core "Topic" (Catchy Title/Theme).
2. Extract 3-5 key "Keywords" relevant to the genre.
3. Write a concise "Summary" of why this trend is effective.
4. Propose 3 distinct "Inspiration Points" (Plot Hooks) based on this trend.

Output JSON format:
{{
  "topic": "string",
  "keywords": ["string", "string"],
  "summary": "string",
  "inspiration_points": ["string", "string", "string"]
}}
"""
                response = await client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    response_format={ "type": "json_object" }
                )
                
                data = json.loads(response.choices[0].message.content)
                return TrendReport(**data)

            except Exception as e:
                print(f"LLM Research Error: {e}")
                return self._mock_analysis(search_results)
            
        # Fallback if no results
        return self._mock_fallback_report()

    async def extract_methods(self, search_results: List[SearchResult]) -> List[WritingMethod]:
        """Extract writing methodologies from search results using LLM"""
        
        client = LLMFactory.get_client()
        model = LLMFactory.get_model()

        if client and search_results:
            try:
                # Prepare context
                context_text = ""
                for i, res in enumerate(search_results[:3]):
                    context_text += f"[{i+1}] {res.title}: {res.content[:300]}...\n"

                prompt = f"""
You are a Screenwriting Theorist.
Based on the provided content (or general knowledge of Short Plays), identify the most effective Writing Methodology.

Output JSON format:
{{
  "method_name": "string",
  "core_logic": "string",
  "structure_template": "string"
}}
"""
                response = await client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    response_format={ "type": "json_object" }
                )
                
                data = json.loads(response.choices[0].message.content)
                return [WritingMethod(**data)]
            except Exception as e:
                print(f"LLM Method Extraction Error: {e}")

        # Fallback Mock
        return [
            WritingMethod(
                method_name="Golden 3-Second Rule",
                core_logic="The first 3 seconds must present a core conflict. Visual impact and sharp dialogue are mandatory.",
                structure_template="Opening (0-3s): Intense Argument/Face Slap -> Development (3-45s): Background Setup -> Ending (45-60s): Hook/Cliffhanger"
            )
        ]

    def _mock_analysis(self, search_results: List[SearchResult]) -> TrendReport:
        # Simple heuristic analysis (Pseudo-LLM)
        top_result = search_results[0]
        all_text = " ".join([res.title for res in search_results])
        words = [w for w in all_text.split() if len(w) > 5]
        keywords = list(set(words))[:5] if words else ["Viral Trend", "Hot Topic"]
        summary_base = top_result.content[:200] + "..." if top_result.content else "Based on the latest internet trends..."
        
        return TrendReport(
            topic=f"Trend Analysis: {top_result.title[:30]}...",
            keywords=keywords,
            summary=f"Analysis of {len(search_results)} sources indicates: {summary_base}",
            inspiration_points=[
                f"Angle 1: Focus on '{keywords[0] if keywords else 'Topic'}' aspects.",
                f"Angle 2: Contrasting view from: {search_results[1].title if len(search_results) > 1 else 'Alternative source'}",
                "Angle 3: Twist the core concept with a reversal."
            ]
        )

    def _mock_fallback_report(self) -> TrendReport:
        return TrendReport(
            topic="Silver-Haired CEO & Flash Marriage",
            keywords=["Sunset Romance", "Wealthy Family", "Misunderstanding", "Doting Husband"],
            summary="Market acceptance for middle-aged/elderly themes is rising. Combining traditional CEO tropes with elderly characters creates 'Gap Moe'.",
            inspiration_points=[
                "Protagonist is a retired Group Chairman disguised as a security guard for blind dates.",
                "Female lead is a kind grandmother raising a grandchild alone, despised by her children.",
                "Conflict arises from the children's snobbery vs. the old CEO's low-key face-slapping."
            ]
        )
