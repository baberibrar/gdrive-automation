import json

from openai import OpenAI

from app.config import settings


def analyze_parties(text: str) -> dict:
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    system_prompt = (
        "You are a contract and document analysis assistant. "
        "Given the text of a document (such as a contract, agreement, or correspondence), "
        "identify the two main parties involved and their roles.\n\n"
        "You must return a JSON object with exactly these fields:\n"
        '- "party_a_name": The name of the first party\n'
        '- "party_a_role": The role of the first party (e.g., client, freelancer, influencer, agency, vendor, employer, contractor)\n'
        '- "party_b_name": The name of the second party\n'
        '- "party_b_role": The role of the second party\n'
        '- "summary": A brief 2-3 sentence summary of the document and the relationship between the parties\n\n'
        "If you cannot determine a field, use a reasonable placeholder like \"Unknown\"."
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Analyze the following document text:\n\n{text}"},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
        max_tokens=1000,
    )

    result = json.loads(response.choices[0].message.content)

    return {
        "party_a_name": result.get("party_a_name", "Unknown"),
        "party_a_role": result.get("party_a_role", "Unknown"),
        "party_b_name": result.get("party_b_name", "Unknown"),
        "party_b_role": result.get("party_b_role", "Unknown"),
        "summary": result.get("summary", "No summary available."),
    }
