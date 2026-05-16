import os
import re
from typing import Dict, Tuple, Union

import requests
import streamlit as st
from dotenv import load_dotenv
from langchain_core.messages import AIMessage, HumanMessage

import agent
from tools import get_todays_data, get_weekly_summary

load_dotenv()


def _check_sheet_connection() -> Tuple[bool, str]:
    url = os.getenv("GOOGLE_SCRIPT_URL", "")
    if not url:
        return False, "GOOGLE_SCRIPT_URL not set"
    if not url.startswith("http"):
        return False, "URL invalid — needs the full /exec Web App URL"
    try:
        r = requests.get(url, timeout=8)
        if r.status_code != 200:
            return False, f"HTTP {r.status_code}"
        try:
            r.json()
        except ValueError:
            return False, "Response is not JSON"
        return True, "Connected"
    except requests.Timeout:
        return False, "Timeout"
    except requests.RequestException as exc:
        return False, f"{type(exc).__name__}"


def _check_gemini_connection() -> Tuple[bool, str]:
    key = os.getenv("GOOGLE_API_KEY", "")
    if not key:
        return False, "GOOGLE_API_KEY not set"
    try:
        import google.generativeai as genai

        genai.configure(api_key=key)
        models = list(genai.list_models())
        if not models:
            return False, "No models returned"
        return True, f"Connected ({len(models)} models)"
    except Exception as exc:
        msg = str(exc)
        if "API_KEY_INVALID" in msg or "API key not valid" in msg:
            return False, "Invalid API key"
        return False, f"{type(exc).__name__}"

st.set_page_config(page_title="Health AI Agent", layout="centered")

st.title("🥗 Health AI Agent")
st.caption("Your personal nutrition and calorie tracking assistant")


def _parse_todays_data(text: str) -> Dict[str, Union[float, int, str]]:
    parsed: Dict[str, Union[float, int, str]] = {}
    patterns = {
        "weight": r"Weight:\s*([\d.]+)",
        "morning": r"Morning:\s*([\d.]+)",
        "lunch": r"Lunch:\s*([\d.]+)",
        "dinner": r"Dinner:\s*([\d.]+)",
        "total": r"Total:\s*([\d.]+)",
    }
    for key, pattern in patterns.items():
        match = re.search(pattern, text)
        if match:
            try:
                parsed[key] = float(match.group(1))
            except ValueError:
                pass
    return parsed


with st.sidebar:
    st.title("🔌 Connection Status")

    if "conn_status" not in st.session_state:
        st.session_state.conn_status = {
            "sheet": _check_sheet_connection(),
            "gemini": _check_gemini_connection(),
        }

    sheet_ok, sheet_msg = st.session_state.conn_status["sheet"]
    gem_ok, gem_msg = st.session_state.conn_status["gemini"]

    st.markdown(
        f"{'🟢' if sheet_ok else '🔴'} **Google Sheets** — {sheet_msg}"
    )
    st.markdown(
        f"{'🟢' if gem_ok else '🔴'} **Gemini API** — {gem_msg}"
    )

    if st.button("🔄 Recheck connections", use_container_width=True):
        with st.spinner("Checking..."):
            st.session_state.conn_status = {
                "sheet": _check_sheet_connection(),
                "gemini": _check_gemini_connection(),
            }
        st.rerun()

    st.divider()

    st.title("📊 Quick Stats")

    if st.button("Refresh Today's Data", use_container_width=True):
        raw = get_todays_data.invoke({})
        if "No data logged" in raw or "Network error" in raw or "Could not" in raw:
            st.info(raw)
        else:
            stats = _parse_todays_data(raw)
            st.metric("Today's Total Calories", f"{int(stats.get('total', 0))} kcal")
            col1, col2, col3 = st.columns(3)
            col1.metric("Morning", f"{int(stats.get('morning', 0))} kcal")
            col2.metric("Lunch", f"{int(stats.get('lunch', 0))} kcal")
            col3.metric("Dinner", f"{int(stats.get('dinner', 0))} kcal")
            weight = stats.get("weight", 0)
            if weight:
                st.metric("Weight", f"{weight} kg")

    st.divider()

    if st.button("📈 Weekly Summary", use_container_width=True):
        summary = get_weekly_summary.invoke({})
        st.write(summary)


if "messages" not in st.session_state:
    st.session_state.messages = [
        {
            "role": "assistant",
            "content": (
                "Hi! I'm your health tracking assistant. I can help you:\n"
                "• Log your meals and weight for today\n"
                "• Look up nutrition info for any food\n"
                "• Check your daily and weekly progress\n\n"
                "What did you eat today?"
            ),
        }
    ]

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])


user_input = st.chat_input("e.g. I had 2 eggs and toast for breakfast")

if user_input:
    st.session_state.messages.append({"role": "user", "content": user_input})

    chat_history: list = []
    for msg in st.session_state.messages[:-1]:
        if msg["role"] == "user":
            chat_history.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            chat_history.append(AIMessage(content=msg["content"]))

    with st.spinner("Analysing..."):
        response = agent.run(user_input, chat_history)

    st.session_state.messages.append({"role": "assistant", "content": response})
    st.rerun()
