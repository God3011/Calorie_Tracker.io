import os
from datetime import date as _date
from typing import Any, Dict, List

import requests
from dotenv import load_dotenv
from langchain.tools import tool

load_dotenv()

GOOGLE_SCRIPT_URL = os.getenv("GOOGLE_SCRIPT_URL", "")
REQUEST_TIMEOUT = 15


def _fetch_sheet_rows() -> List[Dict[str, Any]]:
    if not GOOGLE_SCRIPT_URL:
        raise RuntimeError("GOOGLE_SCRIPT_URL is not set in environment.")
    response = requests.get(GOOGLE_SCRIPT_URL, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    data = response.json()
    if isinstance(data, dict):
        for key in ("data", "rows", "records", "result"):
            if key in data and isinstance(data[key], list):
                return data[key]
        return []
    if isinstance(data, list):
        return data
    return []


def _row_get(row: dict[str, Any], *keys: str, default: Any = None) -> Any:
    for key in keys:
        if key in row and row[key] not in (None, ""):
            return row[key]
    return default


def _to_float(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _to_int(value: Any) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def _normalise_date(value: Any) -> str:
    if not value:
        return ""
    text = str(value)
    if "T" in text:
        text = text.split("T", 1)[0]
    return text.strip()[:10]


@tool
def log_health_data(
    date: str = "",
    weight: float = 0.0,
    morning_cal: int = 0,
    lunch_cal: int = 0,
    dinner_cal: int = 0,
) -> str:
    """Use this to log daily health data to the tracker. Pass only the fields the user has provided — unspecified meals default to 0. If weight is 0 or omitted, the most recent logged weight is reused (the sheet requires weight > 0). If date is empty, today is used. Call this AFTER the user confirms the values."""
    try:
        if not GOOGLE_SCRIPT_URL:
            return "GOOGLE_SCRIPT_URL is not configured."

        if not date:
            date = _date.today().isoformat()

        effective_weight = float(weight) if weight else 0.0
        weight_note = ""
        if effective_weight <= 0:
            try:
                rows = _fetch_sheet_rows()
                weighted = [
                    (_normalise_date(_row_get(r, "Date", "date")),
                     _to_float(_row_get(r, "Weight (kg)", "weight", "Weight")))
                    for r in rows
                ]
                weighted = [(d, w) for d, w in weighted if d and w > 0]
                weighted.sort(key=lambda x: x[0], reverse=True)
                if weighted:
                    effective_weight = weighted[0][1]
                    weight_note = f" (reused last logged weight from {weighted[0][0]})"
            except Exception:
                pass

        if effective_weight <= 0:
            return (
                "I need a weight value to log this — the sheet requires weight > 0 "
                "and there's no previous weight on record. Please tell me your "
                "current weight in kg and I'll log everything together."
            )

        total = int(morning_cal) + int(lunch_cal) + int(dinner_cal)
        payload = {
            "date": date,
            "weight": effective_weight,
            "morningCalories": int(morning_cal),
            "lunchCalories": int(lunch_cal),
            "dinnerCalories": int(dinner_cal),
            "totalCalories": total,
        }
        response = requests.post(
            GOOGLE_SCRIPT_URL,
            json=payload,
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        return (
            f"Logged for {date}: weight={payload['weight']} kg{weight_note}, "
            f"morning={morning_cal} kcal, lunch={lunch_cal} kcal, "
            f"dinner={dinner_cal} kcal, total={total} kcal."
        )
    except requests.RequestException as exc:
        return f"Network error while logging health data: {exc}"
    except Exception as exc:
        return f"Failed to log health data: {exc}"


@tool
def get_todays_data() -> str:
    """Use this to retrieve today's logged health data including weight and calories"""
    try:
        rows = _fetch_sheet_rows()
        today = _date.today().isoformat()
        todays_row = None
        for row in rows:
            row_date = _normalise_date(
                _row_get(row, "Date", "date")
            )
            if row_date == today:
                todays_row = row
                break

        if not todays_row:
            return "No data logged for today yet"

        weight = _to_float(_row_get(todays_row, "Weight (kg)", "weight", "Weight"))
        morning = _to_int(_row_get(todays_row, "Morning Calories", "morningCalories"))
        lunch = _to_int(_row_get(todays_row, "Lunch Calories", "lunchCalories"))
        dinner = _to_int(_row_get(todays_row, "Dinner Calories", "dinnerCalories"))
        total = _to_int(
            _row_get(todays_row, "Total Calories", "totalCalories")
        ) or (morning + lunch + dinner)

        return (
            f"Today ({today}):\n"
            f"- Weight: {weight} kg\n"
            f"- Morning: {morning} kcal\n"
            f"- Lunch: {lunch} kcal\n"
            f"- Dinner: {dinner} kcal\n"
            f"- Total: {total} kcal"
        )
    except requests.RequestException as exc:
        return f"Network error retrieving today's data: {exc}"
    except Exception as exc:
        return f"Could not retrieve today's data: {exc}"


@tool
def get_weekly_summary() -> str:
    """Use this to get a weekly summary of health metrics including average calories and weight trends"""
    try:
        rows = _fetch_sheet_rows()
        if not rows:
            return "No data available to summarise."

        parsed = []
        for row in rows:
            row_date = _normalise_date(_row_get(row, "Date", "date"))
            if not row_date:
                continue
            total = _to_int(
                _row_get(row, "Total Calories", "totalCalories")
            )
            if total == 0:
                total = (
                    _to_int(_row_get(row, "Morning Calories", "morningCalories"))
                    + _to_int(_row_get(row, "Lunch Calories", "lunchCalories"))
                    + _to_int(_row_get(row, "Dinner Calories", "dinnerCalories"))
                )
            weight = _to_float(_row_get(row, "Weight (kg)", "weight", "Weight"))
            parsed.append({"date": row_date, "total": total, "weight": weight})

        if not parsed:
            return "No valid rows found for weekly summary."

        parsed.sort(key=lambda r: r["date"], reverse=True)
        last_week = parsed[:7]

        avg_cal = sum(r["total"] for r in last_week) / len(last_week)
        weights = [r["weight"] for r in last_week if r["weight"] > 0]
        avg_weight = sum(weights) / len(weights) if weights else 0.0
        highest = max(last_week, key=lambda r: r["total"])
        lowest = min(last_week, key=lambda r: r["total"])

        return (
            f"Weekly summary (last {len(last_week)} days):\n"
            f"- Average calories: {avg_cal:.0f} kcal/day\n"
            f"- Average weight: {avg_weight:.1f} kg\n"
            f"- Highest calorie day: {highest['date']} ({highest['total']} kcal)\n"
            f"- Lowest calorie day: {lowest['date']} ({lowest['total']} kcal)"
        )
    except requests.RequestException as exc:
        return f"Network error retrieving weekly summary: {exc}"
    except Exception as exc:
        return f"Could not build weekly summary: {exc}"
