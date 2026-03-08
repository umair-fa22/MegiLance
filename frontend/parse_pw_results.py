"""Parse Playwright JSON results and print summary."""
import json, sys

data = json.load(sys.stdin)
stats = data["stats"]
expected = stats.get("expected", 0)
unexpected = stats.get("unexpected", 0)
skipped = stats.get("skipped", 0)
flaky = stats.get("flaky", 0)
total = expected + unexpected + skipped + flaky

print(f"Total: {total}")
print(f"Passed: {expected}")
print(f"Failed: {unexpected}")
print(f"Skipped: {skipped}")
print(f"Flaky: {flaky}")
print()

# Collect all failures
def collect_failures(suites, prefix=""):
    failures = []
    for suite in suites:
        name = prefix + suite.get("title", "") + " > " if suite.get("title") else prefix
        for spec in suite.get("specs", []):
            if not spec.get("ok", True):
                err = ""
                if spec.get("tests"):
                    for t in spec["tests"]:
                        for r in t.get("results", []):
                            if r.get("status") == "failed":
                                em = r.get("error", {}).get("message", "")
                                err = em[:200] if em else "unknown"
                                break
                failures.append(f"FAIL: {name}{spec['title']}\n      {err}")
        # Recurse into sub-suites
        failures.extend(collect_failures(suite.get("suites", []), name))
    return failures

fails = collect_failures(data.get("suites", []))
if fails:
    print("=== FAILURES ===")
    for f in fails:
        print(f)
else:
    print("ALL TESTS PASSED!")
