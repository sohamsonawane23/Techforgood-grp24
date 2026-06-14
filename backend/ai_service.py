import google.generativeai as genai
import os
import json

# Ensure to set GEMINI_API_KEY environment variable
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "YOUR_API_KEY"))

def classify_complaint(title: str, description: str):
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
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
        return "Uncategorized", "Medium"
