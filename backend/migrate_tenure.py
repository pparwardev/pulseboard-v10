"""Parse 'team member tenurity.txt' and update User records by login."""
import re, sys, os
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))
from app.core.database import SessionLocal
from app.models.user import User

MONTH_MAP = {
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
    "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12,
}

def parse_date(s):
    m = re.match(r"(\w+)\s+(\d+),\s+(\d{4})", s.strip())
    if not m:
        return None
    month = MONTH_MAP.get(m.group(1).lower())
    return datetime(int(m.group(3)), month, int(m.group(2))) if month else None

def parse_file(path):
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    blocks = re.split(r"-{5,}", text)
    records = []
    for block in blocks:
        lines = [l.strip() for l in block.strip().splitlines() if l.strip()]
        data = {}
        for i, line in enumerate(lines):
            low = line.lower().rstrip(":")
            if low == "login" and i + 1 < len(lines):
                data["login"] = lines[i + 1]
            elif low == "employee id" and i + 1 < len(lines):
                data["employee_id"] = lines[i + 1]
            elif low == "latest hire date" and i + 1 < len(lines):
                data["hire_date"] = lines[i + 1]
            elif low == "total tenure" and i + 1 < len(lines):
                data["total_tenure"] = lines[i + 1]
            elif low == "location" and i + 1 < len(lines):
                data["location"] = lines[i + 1]
        if data.get("login"):
            records.append(data)
    return records

def main():
    path = os.path.join(os.path.dirname(__file__), "team member tenurity.txt")
    records = parse_file(path)
    print(f"Parsed {len(records)} records")

    db = SessionLocal()
    updated = 0
    for rec in records:
        user = db.query(User).filter(User.login == rec["login"]).first()
        if not user:
            print(f"  SKIP: '{rec['login']}' not found")
            continue
        if rec.get("employee_id"):
            user.employee_id = rec["employee_id"]
        if rec.get("hire_date"):
            user.created_at = parse_date(rec["hire_date"])
        if rec.get("total_tenure"):
            user.total_tenure = rec["total_tenure"]
        if rec.get("location"):
            user.location = rec["location"]
        updated += 1
        print(f"  OK: {rec['login']}")

    db.commit()
    db.close()
    print(f"\nDone! Updated {updated}/{len(records)} users.")

if __name__ == "__main__":
    main()
