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


def generate_feedback(text: str, analysis: dict, user_role: str) -> dict:
    """Generate feedback based on the document text and the user's role.

    If user_role is 'freelancer' or 'influencer', generate feedback FOR the client.
    If user_role is 'client', generate feedback FOR the freelancer/influencer.
    """
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    party_a = analysis.get("party_a_name", "Unknown")
    party_a_role = analysis.get("party_a_role", "Unknown")
    party_b = analysis.get("party_b_name", "Unknown")
    party_b_role = analysis.get("party_b_role", "Unknown")
    summary = analysis.get("summary", "")

    if user_role in ("freelancer", "influencer"):
        feedback_target = "the client"
        feedback_perspective = f"a {user_role}"
    else:
        feedback_target = "the freelancer/influencer"
        feedback_perspective = "a client"

    system_prompt = (
        f"You are a professional feedback writer. "
        f"Based on the document provided, write a constructive and professional feedback "
        f"from the perspective of {feedback_perspective} about {feedback_target}.\n\n"
        f"Context:\n"
        f"- Party A: {party_a} ({party_a_role})\n"
        f"- Party B: {party_b} ({party_b_role})\n"
        f"- Document summary: {summary}\n\n"
        f"Write a detailed, honest, and professional feedback (3-5 sentences) that covers:\n"
        f"- Quality of work/collaboration\n"
        f"- Communication and professionalism\n"
        f"- Overall experience\n\n"
        f"Also suggest a rating from 1-5 (5 being excellent).\n\n"
        f"Return a JSON object with:\n"
        f'- "feedback_text": the feedback text\n'
        f'- "rating": integer 1-5\n'
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Generate feedback based on this document:\n\n{text}"},
        ],
        response_format={"type": "json_object"},
        temperature=0.4,
        max_tokens=1000,
    )

    result = json.loads(response.choices[0].message.content)

    return {
        "feedback_text": result.get("feedback_text", ""),
        "rating": max(1, min(5, int(result.get("rating", 3)))),
    }
