import argparse
import json
from pathlib import Path

root = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description="Local simulated issue tracker; no network access")
commands = parser.add_subparsers(dest="command", required=True)
listing = commands.add_parser("list")
listing.add_argument("--search", default="")
view = commands.add_parser("view")
view.add_argument("number", type=int)
create = commands.add_parser("create")
create.add_argument("--title", required=True)
create.add_argument("--body-file", required=True)
create.add_argument("--type", choices=["Bug", "Feature", "Task"])
args = parser.parse_args()
state_path = root / "tracker.json"
state = json.loads(state_path.read_text())
with (root / "tracker-events.jsonl").open("a") as log:
    log.write(json.dumps(vars(args)) + "\n")
if args.command == "list":
    terms = args.search.lower().split()
    result = [i for i in state["issues"] if not terms or any(t in (i["title"] + " " + i["body"]).lower() for t in terms)]
elif args.command == "view":
    result = next((i for i in state["issues"] if i["number"] == args.number), None)
    if result is None:
        parser.exit(1, "No such issue\n")
else:
    number = max((i["number"] for i in state["issues"]), default=0) + 1
    result = {"number": number, "title": args.title, "body": Path(args.body_file).read_text(), "type": args.type, "state": "open", "url": f"https://issues.example.test/issues/{number}"}
    state["issues"].append(result)
    state_path.write_text(json.dumps(state, indent=2) + "\n")
print(json.dumps(result, indent=2))
