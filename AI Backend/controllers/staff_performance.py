import json
import os
import re
from typing import Any

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()


class StaffPerformanceController:
    """AI evaluator for staff support performance metric bundles."""

    def __init__(self):
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        if self.google_api_key:
            os.environ["GOOGLE_API_KEY"] = self.google_api_key

        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-lite",
            temperature=0.2,
            convert_system_message_to_human=True,
        )

    def _clean_json(self, value: str) -> str:
        cleaned = value.strip()
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned).strip()
        return cleaned

    def evaluate(self, staff_metrics: list[dict[str, Any]]) -> dict[str, Any]:
        prompt = [
            SystemMessage(
                content="""You evaluate customer-support staff performance for organization managers.
Return ONLY valid JSON with this shape:
{"evaluations":[{"staffId":"string","overallScore":0-100,"qualityScore":0-100,"speedScore":0-100,"reliabilityScore":0-100,"customerSatisfactionScore":0-100,"strengths":["short"],"coachingTips":["short"],"riskFlags":["short"],"summary":"short"}]}

Rules:
- Be fair and evidence-based.
- Scores must be integers from 0 to 100.
- Do not recommend firing, punishment, or HR action.
- Use tickets, chat transcript summaries, and ratings when available.
- If data is sparse, say so and keep scores moderate.
- Keep summaries and tips concise for a manager dashboard."""
            ),
            HumanMessage(content=json.dumps({"staff": staff_metrics}, ensure_ascii=False)),
        ]

        response = self.llm.invoke(prompt)
        raw = self._clean_json(response.content)
        return json.loads(raw)


staff_performance_controller = StaffPerformanceController()
