import asyncio
import logging
from typing import List, Dict, Any, Optional
import google.generativeai as genai
try:
    from config import settings
except ImportError:
    from backend.config import settings

logger = logging.getLogger(__name__)

# Configure Gemini AI SDK
if settings.GEMINI_API_KEY:
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        logger.warning(f"Failed to configure Gemini SDK: {e}")

def _generate_domain_fallback(filename: str, risk_factors_summary: str) -> str:
    """
    Generates domain-tailored concrete recommendations matching the 3-bullet format when API is unreachable.
    """
    lower_fn = filename.lower()
    if any(k in lower_fn for k in ["auth", "token", "session", "crypto", "login"]):
        return "- What to do: Extract session validation and token refresh logic into an isolated auth middleware module.\n- What to replace: Replace manual JWT string decoding and cookie parsing with standard verification middleware.\n- Why: Eliminates race conditions during token expiration and centralizes security enforcement."
    elif any(k in lower_fn for k in ["pay", "checkout", "order", "calc", "billing", "cart"]):
        return "- What to do: Wrap payment execution routines in atomic transactions with unique idempotency keys.\n- What to replace: Replace inline floating-point calculations with a dedicated integer cent pricing utility.\n- Why: Prevents double charges on retries and guarantees rounding precision across currencies."
    elif any(k in lower_fn for k in ["db", "query", "database", "model", "schema"]):
        return "- What to do: Encapsulate complex database queries inside parameterized repository methods with explicit timeouts.\n- What to replace: Replace raw concatenated SQL strings with safe query builder methods.\n- Why: Mitigates deadlock hazards and prevents SQL injection vulnerabilities."
    elif any(k in lower_fn for k in ["worker", "sync", "stream", "socket", "queue"]):
        return "- What to do: Introduce exponential backoff retry and a dead-letter queue for failing background jobs.\n- What to replace: Replace unhandled async loop promises with structured batch worker pools.\n- Why: Prevents worker process starvation and ensures resilient error recovery."
    elif any(k in lower_fn for k in ["store", "state", "hook", "view", "modal", "table", "ui", "component"]):
        return "- What to do: Decouple global state mutation handlers from UI presentation components using custom hooks.\n- What to replace: Replace monolithic component state objects with localized atomic state selectors.\n- Why: Eliminates cascading re-renders and isolates UI rendering from stateful side-effects."
    else:
        return "- What to do: Break down high-complexity functions into modular, single-responsibility helper functions.\n- What to replace: Replace nested conditional branching with early guard clauses and lookup maps.\n- Why: Reduces cyclomatic complexity and makes edge cases independently unit-testable."

def _call_gemini_sync(prompt: str) -> str:
    """
    Synchronous helper to invoke Gemini model with available model names.
    """
    candidate_models = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"]
    
    for model_name in candidate_models:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.2,
                    max_output_tokens=300,
                )
            )
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            logger.debug(f"Gemini model {model_name} invocation skipped: {e}")
            continue
            
    return ""

async def generate_file_fix_suggestion(filename: str, risk_factors_summary: str) -> str:
    """
    Calls Gemini API to generate a concrete, structured 3-bullet fix recommendation.
    Falls back gracefully to domain-specific recommendations on timeout or error.
    """
    if not settings.GEMINI_API_KEY:
        return _generate_domain_fallback(filename, risk_factors_summary)

    prompt = f"""This file "{filename}" was flagged as high-risk by a bug prediction model.
Risk factors: {risk_factors_summary}

Provide a short, specific fix recommendation in this exact format:
- What to do: [one concrete action, e.g. "extract the validation logic into a separate helper function"]
- What to replace: [specific thing to replace/remove, e.g. "replace the inline regex checks with a validation library like Zod or Yup"]
- Why: [one short reason, e.g. "reduces cyclomatic complexity and centralizes validation logic for easier testing"]

Keep each line under 20 words. Be concrete and specific to this file type, not generic advice."""

    try:
        loop = asyncio.get_event_loop()
        suggestion = await asyncio.wait_for(
            loop.run_in_executor(None, _call_gemini_sync, prompt),
            timeout=8.0
        )
        if suggestion and len(suggestion.strip()) > 15:
            return suggestion.strip()
    except asyncio.TimeoutError:
        logger.info(f"Gemini API timed out for {filename}, using domain fallback.")
    except Exception as e:
        logger.warning(f"Error invoking Gemini for file {filename}: {e}")

    return _generate_domain_fallback(filename, risk_factors_summary)

async def enrich_risks_with_ai_suggestions(file_risks: List[Dict[str, Any]], top_n: int = 5) -> List[Dict[str, Any]]:
    """
    Takes the top 3-5 riskiest files and generates AI suggestions asynchronously.
    """
    if not file_risks:
        return file_risks

    count_to_enrich = min(top_n, len(file_risks))
    tasks = []
    top_indices = []

    for i in range(count_to_enrich):
        file_obj = file_risks[i]
        filename = file_obj.get("file_path", "unknown")
        reasons = file_obj.get("top_reasons", [])
        risk_factors_summary = ", ".join(reasons) if reasons else f"Risk Score {file_obj.get('risk_score', 0)}% with high code churn and frequent revisions"
        
        top_indices.append(i)
        tasks.append(generate_file_fix_suggestion(filename, risk_factors_summary))

    if tasks:
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for idx, result in zip(top_indices, results):
            if isinstance(result, str) and result:
                file_risks[idx]["fix_suggestion"] = result
            else:
                filename = file_risks[idx].get("file_path", "")
                reasons = ", ".join(file_risks[idx].get("top_reasons", []))
                file_risks[idx]["fix_suggestion"] = _generate_domain_fallback(filename, reasons)

    # For files beyond top_n, set fix_suggestion to None
    for i in range(count_to_enrich, len(file_risks)):
        if "fix_suggestion" not in file_risks[i]:
            file_risks[i]["fix_suggestion"] = None

    return file_risks
