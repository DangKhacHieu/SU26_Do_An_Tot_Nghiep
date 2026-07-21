import json
import re

transcript_path = r"C:\Users\VivoBook\.gemini\antigravity\brain\f90a202f-e2a4-4d20-984b-663c36494afb\.system_generated\logs\transcript_full.jsonl"
with open(transcript_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for line in lines:
    try:
        data = json.loads(line)
        if data.get("type") == "TOOL_RESPONSE" and "MarketAreaList.jsx" in data.get("content", ""):
            if "Showing lines 1 to 900" in data["content"] or "Total Lines:" in data["content"]:
                # write out to a file so we can inspect
                with open("extracted_responses.txt", "a", encoding="utf-8") as out:
                    out.write(data["content"] + "\n\n" + "="*80 + "\n\n")
    except Exception as e:
        pass
