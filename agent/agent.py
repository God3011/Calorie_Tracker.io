import os
from datetime import date
from typing import Any, List, Optional

from dotenv import load_dotenv
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_google_genai import ChatGoogleGenerativeAI

from tools import (
    get_todays_data,
    get_weekly_summary,
    log_health_data,
)

load_dotenv()

TOOLS = [log_health_data, get_todays_data, get_weekly_summary]


def _build_executor() -> AgentExecutor:
    today_str = date.today().isoformat()
    system_prompt = (
        "You are a helpful health and nutrition assistant. You help users "
        "track their daily calories and weight in a Google Sheet with these "
        "columns: Date, Weight (kg), Morning Calories, Lunch Calories, "
        "Dinner Calories, Total Calories.\n\n"
        "WORKFLOW when a user mentions eating something:\n"
        "1. If the meal slot (morning/lunch/dinner) is not stated, ASK which "
        "meal it was — don't guess.\n"
        "2. Estimate calories for each food item yourself using common "
        "nutritional knowledge. Use standard portion sizes (e.g. 1 large egg "
        "≈ 72 kcal, 1 tsp oil ≈ 40 kcal, 1 slice bread ≈ 80 kcal, 1 cup "
        "cooked rice ≈ 200 kcal). If a portion is ambiguous, ask the user.\n"
        "3. Sum the calories for that meal and SHOW the breakdown to the "
        "user: per-item kcal and the meal total.\n"
        "4. Ask the user to confirm before logging. Also ask if they want to "
        "add weight for today (optional — skip if they don't want to).\n"
        "5. Only after explicit confirmation, call log_health_data. Pass 0 "
        "for meal slots the user hasn't logged in this turn, and 0.0 for "
        "weight if unknown. Date defaults to today.\n\n"
        "Never log silently. Always show the calorie breakdown before logging "
        "so the user can correct your estimates. Be friendly, encouraging, "
        f"and concise. Today's date is {today_str}."
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ]
    )

    if not os.getenv("GOOGLE_API_KEY"):
        raise RuntimeError(
            "GOOGLE_API_KEY is not set. Copy .env.example to .env and add your Gemini key."
        )

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash-lite",
        temperature=0,
        transport="rest",
        disable_streaming=True,
    )

    agent = create_tool_calling_agent(llm=llm, tools=TOOLS, prompt=prompt)
    return AgentExecutor(
        agent=agent,
        tools=TOOLS,
        verbose=False,
        handle_parsing_errors=True,
        return_intermediate_steps=True,
    )


def run(user_message: str, chat_history: Optional[List[Any]] = None) -> str:
    import traceback
    try:
        executor = _build_executor()
        result = executor.invoke(
            {
                "input": user_message,
                "chat_history": chat_history or [],
            }
        )
        output = result.get("output") if isinstance(result, dict) else result
        if isinstance(output, list):
            parts = []
            for item in output:
                if isinstance(item, dict) and "text" in item:
                    parts.append(item["text"])
                else:
                    parts.append(str(item))
            output = "\n".join(parts)

        text = str(output).strip() if output is not None else ""
        if not text and isinstance(result, dict):
            steps = result.get("intermediate_steps") or []
            if steps:
                last_observation = steps[-1][1]
                text = str(last_observation).strip()
        return text or "(no response)"
    except Exception as exc:
        traceback.print_exc()
        return f"Sorry, something went wrong: {exc}"
