"""Set shift & week_off from schedule image data (skip cmtsh)."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app.core.database import SessionLocal
from app.models.user import User

# SMTWRFY = Sun(0) Mon(1) Tue(2) Wed(3) Thu(4) Fri(5) Sat(6)
# '=' means OFF day, letter means working day
# ' at start is just artifact from image

SCHEDULE = [
    # (login, shift_start, shift_end, days_pattern)
    ("anjuumai", "05:30", "14:30", "SMTWR=="),
    ("bhaskpri", "06:30", "15:30", "SMTWR=="),
    ("bsathyan", "15:00", "00:00", "=MTWRF="),
    # cmtsh skipped
    ("darunkuv", "07:30", "16:30", "SMTWR=="),
    ("datathag", "14:30", "23:30", "==TWRFY"),
    ("gargnoo",  "07:30", "16:30", "SM==RFY"),
    ("gujagann", "07:30", "16:30", "SMT==FY"),
    ("hulman",   "07:00", "16:00", "=MTWRF="),
    ("jmadhum",  "07:30", "16:30", "==TWRFY"),
    ("pparwar",  "09:30", "18:30", "==TWRFY"),
    ("sayarim",  "06:30", "15:30", "==TWRFY"),
    ("shajamri", "05:30", "14:30", "==TWRFY"),
    ("somsajiv", "11:30", "20:30", "SMTWR=="),
    ("sshabnam", "05:30", "14:30", "==TWRFY"),
]

# Position index: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
def get_week_off(pattern):
    """Return comma-separated indices of off days (where '=' appears)."""
    off = [str(i) for i, c in enumerate(pattern) if c == '=']
    return ','.join(off)

def main():
    db = SessionLocal()
    updated = 0
    for login, start, end, pattern in SCHEDULE:
        user = db.query(User).filter(User.login == login).first()
        if not user:
            print(f"  SKIP: '{login}' not found")
            continue
        user.shift_start = start
        user.shift_end = end
        user.week_off = get_week_off(pattern)
        updated += 1
        print(f"  OK: {login} -> {start}-{end}, off={user.week_off}")

    db.commit()
    db.close()
    print(f"\nDone! Updated {updated}/{len(SCHEDULE)} users.")

if __name__ == "__main__":
    main()
