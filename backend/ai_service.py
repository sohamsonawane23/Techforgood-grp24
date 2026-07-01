import google.generativeai as genai
import os
import json

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print(
        "WARNING: GEMINI_API_KEY environment variable is not set. "
        "Text-based complaint classification will fall back to "
        "'Uncategorized' / 'Medium' for every request until it is set."
    )

# Google periodically deprecates/shuts down specific Gemini model
# versions (e.g. the entire 1.5 line, then 2.0 Flash, were both shut
# down in 2026), which breaks any code that hardcodes one model name.
# To avoid this app breaking every time that happens, we ask the API
# at runtime which models are actually available and pick a sensible
# one, instead of trusting a name baked into the code. This list is
# only used as a fallback if that discovery call itself fails (e.g. no
# network) - ordered roughly newest/cheapest-first based on what's
# documented as current at the time of writing, but the order doesn't
# matter much since discovery is tried first.
FALLBACK_MODEL_NAMES = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-flash-latest",
]

_cached_model_name = None


def _discover_model_name() -> str | None:
    """Ask the Gemini API which models currently support generateContent
    and return the first usable one, preferring lightweight/"flash"
    models since this app only needs short JSON classification, not
    heavy reasoning. Returns None if discovery fails for any reason
    (network issue, key problem, library mismatch, etc.) so the caller
    can fall back to the hardcoded list instead."""
    try:
        candidates = []
        for m in genai.list_models():
            methods = getattr(m, "supported_generation_methods", []) or []
            if "generateContent" in methods:
                candidates.append(m.name)  # e.g. "models/gemini-2.5-flash"

        if not candidates:
            return None

        # Prefer "flash" (fast/cheap) models over "pro" for this simple
        # classification task; otherwise just take the first available.
        flash_candidates = [c for c in candidates if "flash" in c.lower()]
        return (flash_candidates or candidates)[0]
    except Exception as e:
        print(f"Model discovery failed, will try fallback list instead: {e}")
        return None


def _get_model_name() -> str | None:
    global _cached_model_name
    if _cached_model_name:
        return _cached_model_name

    discovered = _discover_model_name()
    if discovered:
        _cached_model_name = discovered
        print(f"Using Gemini model: {discovered}")
        return _cached_model_name

    # Discovery failed - try each fallback name directly. We don't know
    # for sure these work, so the actual generate_content() call below
    # is still wrapped in try/except.
    for name in FALLBACK_MODEL_NAMES:
        _cached_model_name = name
        print(f"Using fallback Gemini model guess: {name}")
        return _cached_model_name

    return None


def classify_complaint(title: str, description: str):
    if not GEMINI_API_KEY:
        # Don't even attempt the API call with a placeholder key - fail
        # fast and predictably instead of letting the SDK raise deep
        # inside generate_content().
        return "Uncategorized", "Medium"

    model_name = _get_model_name()
    if not model_name:
        print("AI Classification Error: no usable Gemini model found.")
        return "Uncategorized", "Medium"

    try:
        model = genai.GenerativeModel(model_name)
        prompt = f"""
        Analyze the following civic complaint and provide a JSON response with 'category' and 'priority'.
        Possible Categories: Pothole, Garbage, Drainage, Streetlight, Traffic, Water Supply, Other.
        Possible Priorities: Low, Medium, High.
        
        Title: {title}
        Description: {description}
        
        JSON response format:
        {{"category": "CategoryName", "priority": "PriorityLevel"}}
        """
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        data = json.loads(text)
        return data.get("category", "Uncategorized"), data.get("priority", "Medium")
    except Exception as e:
        print(f"AI Classification Error: {e}")
        # If the cached model name turned out to be wrong (e.g. a
        # fallback guess that doesn't actually exist), clear the cache
        # so the next request tries discovery again rather than
        # repeating the same failure forever.
        global _cached_model_name
        _cached_model_name = None
        return "Uncategorized", "Medium"
