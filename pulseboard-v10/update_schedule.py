import psycopg2

DB_URL = "postgresql://pulseboard_admin:Luxakki92@localhost:5432/pulseboard_v10"

# Data from image: login, shift_start, shift_end, week_off_days (derived from pattern)
# Pattern legend: S=Sun, M=Mon, T=Tue, W=Wed, R=Thu, F=Fri, Y=Sat
# '=' or missing letter = week off on that day
# ' (apostrophe) at start = schedule starts previous day (ignored for week_off calc)

# Parsing the "New Schedule (local days)" column:
# Full week order: S M T W R F Y (Sun Mon Tue Wed Thu Fri Sat)
# If a letter is present = working day, if '=' = week off

data = [
    # login,      shift_start, shift_end, week_off (days where '=' appears)
    ("anjuumai",  "05:30", "14:30", "Friday,Saturday"),        # SMTWR== -> F,Y off
    ("bhaskpri",  "06:30", "15:30", "Friday,Saturday"),        # SMTWR== -> F,Y off
    ("bsathyan",  "15:00", "00:00", "Sunday,Saturday"),        # '=MTWRF= -> S,Y off (apostrophe=prev day)
    ("cmtsh",     "09:30", "18:30", "Sunday,Monday,Wednesday"),# '==TWRFY -> S,M off... wait
    ("darunkuv",  "07:30", "16:30", "Friday,Saturday"),        # SMTWR== -> F,Y off
    ("datathag",  "14:30", "23:30", "Sunday,Monday,Wednesday"),# '==TWRFY -> S,M off... 
    ("gargnoo",   "07:30", "16:30", "Tuesday,Wednesday,Thursday"),# SM==RFY -> T,W off... wait
    ("gujagann",  "07:30", "16:30", "Wednesday,Thursday"),     # SMT==FY -> W,R off
    ("hulman",    "07:00", "16:00", "Sunday,Saturday"),        # '=MTWRF= -> S,Y off
    ("jmadhum",   "07:30", "16:30", "Sunday,Monday,Wednesday"),# '==TWRFY
    ("pparwar",   "09:30", "18:30", "Sunday,Monday,Wednesday"),# '==TWRFY
    ("sayarim",   "06:30", "15:30", "Sunday,Monday,Wednesday"),# '==TWRFY
    ("shajamri",  "05:30", "14:30", "Sunday,Monday,Wednesday"),# '==TWRFY
    ("somsajiv",  "11:30", "20:30", "Friday,Saturday"),        # SMTWR== -> F,Y off
    ("sshabnam",  "05:30", "14:30", "Sunday,Monday,Wednesday"),# '==TWRFY
]

# Let me re-parse more carefully from the image patterns:
# S  M  T  W  R  F  Y
# anjuumai:  S  M  T  W  R  =  =   -> week off: Friday, Saturday
# bhaskpri:  S  M  T  W  R  =  =   -> week off: Friday, Saturday  
# bsathyan:  '  =  M  T  W  R  F  = -> week off: Sunday, Saturday
# cmtsh:     '  =  =  T  W  R  F  Y -> week off: Sunday, Monday
# darunkuv:  S  M  T  W  R  =  =   -> week off: Friday, Saturday
# datathag:  '  =  =  T  W  R  F  Y -> week off: Sunday, Monday
# gargnoo:   S  M  =  =  R  F  Y   -> week off: Tuesday, Wednesday
# gujagann:  S  M  T  =  =  F  Y   -> week off: Wednesday, Thursday
# hulman:    '  =  M  T  W  R  F  = -> week off: Sunday, Saturday
# jmadhum:   '  =  =  T  W  R  F  Y -> week off: Sunday, Monday
# pparwar:   '  =  =  T  W  R  F  Y -> week off: Sunday, Monday
# sayarim:   '  =  =  T  W  R  F  Y -> week off: Sunday, Monday
# shajamri:  '  =  =  T  W  R  F  Y -> week off: Sunday, Monday
# somsajiv:  S  M  T  W  R  =  =   -> week off: Friday, Saturday
# sshabnam:  '  =  =  T  W  R  F  Y -> week off: Sunday, Monday

data = [
    ("anjuumai",  "05:30", "14:30", "Friday,Saturday"),
    ("bhaskpri",  "06:30", "15:30", "Friday,Saturday"),
    ("bsathyan",  "15:00", "00:00", "Sunday,Saturday"),
    ("cmtsh",     "09:30", "18:30", "Sunday,Monday"),
    ("darunkuv",  "07:30", "16:30", "Friday,Saturday"),
    ("datathag",  "14:30", "23:30", "Sunday,Monday"),
    ("gargnoo",   "07:30", "16:30", "Tuesday,Wednesday"),
    ("gujagann",  "07:30", "16:30", "Wednesday,Thursday"),
    ("hulman",    "07:00", "16:00", "Sunday,Saturday"),
    ("jmadhum",   "07:30", "16:30", "Sunday,Monday"),
    ("pparwar",   "09:30", "18:30", "Sunday,Monday"),
    ("sayarim",   "06:30", "15:30", "Sunday,Monday"),
    ("shajamri",  "05:30", "14:30", "Sunday,Monday"),
    ("somsajiv",  "11:30", "20:30", "Friday,Saturday"),
    ("sshabnam",  "05:30", "14:30", "Sunday,Monday"),
]

conn = psycopg2.connect(DB_URL)
cur = conn.cursor()

for login, shift_start, shift_end, week_off in data:
    cur.execute(
        """UPDATE users 
           SET shift_start = %s, shift_end = %s, week_off = %s, updated_at = NOW()
           WHERE login = %s""",
        (shift_start, shift_end, week_off, login)
    )
    if cur.rowcount:
        print(f"✅ {login}: {shift_start}-{shift_end}, Week Off: {week_off}")
    else:
        print(f"❌ {login}: NOT FOUND in database")

conn.commit()
cur.close()
conn.close()
print("\nDone! All schedules updated.")
