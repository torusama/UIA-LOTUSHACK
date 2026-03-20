"""
DATA CRAWLING SERVICES — Secondary feature, implement after demo.

Priority order:
  1. Exa (semantic search for acceptance rates, program stats)
  2. Bright Data (scrape actual college pages)
  3. TinyFish (structured data extraction from scraped HTML)

These services feed the /profile/score endpoint to get REAL
acceptance rate data instead of hardcoded school.json values.
"""
import os
import httpx

EXA_API_KEY = os.getenv("EXA_API_KEY")
BRIGHTDATA_API_KEY = os.getenv("BRIGHTDATA_API_KEY")
TINYFISH_API_KEY = os.getenv("TINYFISH_API_KEY")


# ── EXA: Semantic web search ────────────────────────────────────────────────

async def search_acceptance_rate(school_name: str, major: str) -> dict:
    """
    Use Exa to find current acceptance rate data for a school+major.
    Exa returns semantically relevant pages, not just keyword matches.
    """
    # PSEUDOCODE:
    # query = f"{school_name} {major} acceptance rate class of 2028 statistics"
    # POST https://api.exa.ai/search
    # {
    #   "query": query,
    #   "numResults": 5,
    #   "useAutoprompt": true,
    #   "contents": { "text": true }
    # }
    # → Parse results, extract acceptance rate numbers
    # → Return { "acceptance_rate": 0.04, "median_gpa": 3.9, "source": "url" }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.exa.ai/search",
            headers={"x-api-key": EXA_API_KEY, "Content-Type": "application/json"},
            json={
                "query": f"{school_name} {major} acceptance rate admissions statistics 2024",
                "numResults": 5,
                "useAutoprompt": True,
                "contents": {"text": {"maxCharacters": 2000}},
            },
            timeout=15,
        )
        data = response.json()
        # TODO: parse data["results"][0]["text"] to extract stats
        # For now return placeholder
        return {"raw_results": data.get("results", []), "parsed": None}


async def search_scholarship_info(school_name: str, profile: dict) -> dict:
    """
    PSEUDOCODE — Search scholarships matching student profile.
    1. Query Exa: "{school_name} scholarships international students {major}"
    2. Also query: "external scholarships Vietnam students undergraduate"
    3. Parse results for: name, amount, deadline, eligibility
    4. Return top 5 matches
    """
    pass


# ── BRIGHT DATA: Real page scraping ────────────────────────────────────────

async def scrape_common_data_set(school_name: str) -> dict:
    """
    PSEUDOCODE — Scrape Common Data Set for precise admission stats.
    Common Data Set = official annual report every US university publishes.
    Contains: GPA ranges, test score ranges, acceptance rates by gender etc.

    1. Find CDS URL via Exa search: "{school_name} common data set 2023-2024 PDF"
    2. Use Bright Data to fetch the PDF
    3. Extract Section C (First-Time, First-Year Admission) stats
    4. Cache result in local dict/file for 24 hours (data doesn't change often)
    """
    # Bright Data Web Unlocker API:
    # POST https://api.brightdata.com/request
    # headers: { Authorization: "Bearer {BRIGHTDATA_API_KEY}" }
    # body: { url: target_url, zone: "unlocker" }
    pass


# ── TINYFISH: Structured extraction from HTML ──────────────────────────────

async def extract_structured_data(html: str, schema: dict) -> dict:
    """
    PSEUDOCODE — TinyFish extracts structured JSON from raw HTML/text.
    Use after Bright Data fetches a page.

    Example schema:
    {
      "acceptance_rate": "number between 0 and 1",
      "median_gpa": "float",
      "median_sat": "integer",
      "application_deadline": "date string"
    }

    POST https://api.tinyfish.io/extract
    { "html": html, "schema": schema }
    → Returns clean structured JSON matching schema
    """
    pass


# ── UNIFIED: Get school data (cache → Exa → Bright Data fallback) ──────────

_cache: dict = {}

async def get_school_admission_data(school_name: str, major: str) -> dict:
    """
    Main function called by /profile/score endpoint.
    Try cache first, then Exa, then scrape as last resort.
    """
    cache_key = f"{school_name}:{major}"
    if cache_key in _cache:
        return _cache[cache_key]

    # Step 1: Try Exa (fast, semantic)
    exa_result = await search_acceptance_rate(school_name, major)

    # TODO Step 2: If Exa result is insufficient, scrape Common Data Set
    # scraped = await scrape_common_data_set(school_name)
    # parsed  = await extract_structured_data(scraped["html"], ADMISSION_SCHEMA)

    result = {"school": school_name, "major": major, "source": "exa", **exa_result}
    _cache[cache_key] = result
    return result
