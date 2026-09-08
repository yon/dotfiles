import argparse
import json
from pathlib import Path

parser = argparse.ArgumentParser(description="Check deterministic issue-plan eval outcomes; semantic grading is separate")
parser.add_argument("case_id", type=int)
parser.add_argument("workspace", type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
cases = json.loads((root / "evals/evals.json").read_text())["evals"]
case = next((c for c in cases if c["id"] == args.case_id), None)
if case is None:
    parser.error("Unknown case ID")
run = args.workspace.resolve()
errors = []
for name in case["files"]:
    if Path(name).name == "tracker.json":
        continue
    target = run / Path(name).name
    if not target.is_file() or target.read_bytes() != (root / name).read_bytes():
        errors.append(f"Input changed or missing: {target.name}")
initial_path = next(root / n for n in case["files"] if Path(n).name == "tracker.json")
try:
    initial = json.loads(initial_path.read_text())
    final = json.loads((run / "tracker.json").read_text())
    events = [json.loads(line) for line in (run / "tracker-events.jsonl").read_text().splitlines() if line.strip()]
    commands = [event["command"] for event in events]
    if "list" not in commands:
        errors.append("No issue search recorded")
    if args.case_id == 3:
        if (run / "tracker.json").read_bytes() != initial_path.read_bytes():
            errors.append("Duplicate case changed tracker state")
        if "create" in commands:
            errors.append("Duplicate case attempted issue creation")
        if not any(e["command"] == "view" and e.get("number") == 17 for e in events):
            errors.append("Matching issue was not read")
    else:
        if commands.count("create") != 1 or len(final["issues"]) != len(initial["issues"]) + 1:
            errors.append("Expected exactly one issue creation")
        if "list" in commands and "create" in commands and commands.index("list") > commands.index("create"):
            errors.append("Issue creation preceded duplicate search")
        if final["issues"]:
            created = final["issues"][-1]
            if not created.get("title", "").strip() or not created.get("body", "").strip():
                errors.append("Created issue has an empty title or body")
            if "create" in commands and not any(e["command"] == "view" and e.get("number") == created["number"] for e in events[commands.index("create") + 1:]):
                errors.append("Created issue was not read back")
except (OSError, ValueError, KeyError, TypeError) as exc:
    errors.append(f"Invalid run artifacts: {exc}")
print(json.dumps({"case": case["name"], "mechanical_checks_passed": not errors, "errors": errors, "semantic_grading_required": True}, indent=2))
raise SystemExit(bool(errors))
