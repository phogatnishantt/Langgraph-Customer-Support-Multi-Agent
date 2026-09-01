from datetime import datetime, timezone
from time import perf_counter

from backend.app.core.database import (
    agent_runs_collection,
)


def start_agent_run(
    agent_name: str,
    state: dict,
):
    run = {
        "agent": agent_name,
        "status": "running",
        "started_at": datetime.now(timezone.utc),
        "user_query": state.get("user_query"),
        "intent": state.get("intent"),
        "customer_id": state.get("customer_id"),
    }

    result = agent_runs_collection.insert_one(run)

    return result.inserted_id


def finish_agent_run(
    run_id,
    agent_name: str,
    state: dict,
    started_at: float,
):
    duration_ms = round(
        (perf_counter() - started_at) * 1000,
        2,
    )

    agent_runs_collection.update_one(
        {"_id": run_id},
        {
            "$set": {
                "agent": agent_name,
                "status": "completed",
                "duration_ms": duration_ms,
                "completed_at": datetime.now(
                    timezone.utc
                ),
                "intent": state.get("intent"),
                "action": state.get("action"),
                "answer_confidence": state.get(
                    "answer_confidence"
                ),
            }
        },
    )


def fail_agent_run(
    run_id,
    agent_name: str,
    error: Exception,
    started_at: float,
):
    duration_ms = round(
        (perf_counter() - started_at) * 1000,
        2,
    )

    agent_runs_collection.update_one(
        {"_id": run_id},
        {
            "$set": {
                "agent": agent_name,
                "status": "failed",
                "duration_ms": duration_ms,
                "completed_at": datetime.now(
                    timezone.utc
                ),
                "error": str(error),
            }
        },
    )