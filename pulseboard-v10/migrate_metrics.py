"""Migrate metric_goals + member_performance_metrics from pulseboard v1 to v10"""
import psycopg2

V1 = "postgresql://pulseboard_admin:Luxakki92@localhost:5432/pulseboard"
V10 = "postgresql://pulseboard_admin:Luxakki92@localhost:5432/pulseboard_v10"

v1 = psycopg2.connect(V1)
v10 = psycopg2.connect(V10)
c1, c10 = v1.cursor(), v10.cursor()

# 1. Create metric_goals table in v10
print("Creating metric_goals table...")
c10.execute("""
CREATE TABLE IF NOT EXISTS metric_goals (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_code VARCHAR(50) NOT NULL,
    goal_value FLOAT NOT NULL,
    green_threshold FLOAT,
    yellow_threshold FLOAT,
    red_threshold FLOAT,
    goal_direction VARCHAR(50) DEFAULT 'higher_is_better',
    weight FLOAT DEFAULT 25,
    unit VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
)
""")

# 2. Insert the 4 metrics from screenshot
print("Inserting 4 LESC metrics...")
metrics = [
    ('Reopen On Resolve', 'ROR', 2, 3, 6, 10, 'lower_is_better', 25, '%'),
    ('Quality Assurance', 'QA', 100, 85, 75, 70, 'higher_is_better', 25, '%'),
    ('Average Contact Handling Time', 'ACHT', 17.7, 12, 15, 20, 'lower_is_better', 25, 'minutes'),
    ('Missed Contact', 'Missed', 2, 2, 5, 10, 'lower_is_better', 25, '%'),
]
for m in metrics:
    c10.execute("""INSERT INTO metric_goals (metric_name, metric_code, goal_value, green_threshold, yellow_threshold, red_threshold, goal_direction, weight, unit)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""", m)
print("  ✅ 4 metrics inserted")

# 3. Create member_performance_metrics table in v10
print("Creating member_performance_metrics table...")
c10.execute("""
CREATE TABLE IF NOT EXISTS member_performance_metrics (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES team_members(id),
    metric_code VARCHAR(50) NOT NULL,
    metric_value FLOAT,
    normalized_score FLOAT,
    week_number INTEGER,
    month_number INTEGER,
    year INTEGER,
    period_start DATE,
    period_end DATE,
    source_file VARCHAR(500),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
)
""")

# 4. Build member_id mapping (v1 team_members.employee_id -> v10 team_members.id)
c1.execute("SELECT id, employee_id FROM team_members WHERE id BETWEEN 100 AND 122 AND employee_id != 'kooliyad'")
v1_members = dict(c1.fetchall())  # v1_member_id -> employee_id

c10.execute("SELECT employee_id, id FROM team_members")
v10_members = dict(c10.fetchall())  # employee_id -> v10_member_id

member_map = {}
for v1_id, emp_id in v1_members.items():
    if emp_id in v10_members:
        member_map[v1_id] = v10_members[emp_id]

# 5. Copy performance data
print("Copying performance data...")
c1.execute("""
SELECT member_id, metric_code, metric_value, normalized_score, week_number, month_number, year, period_start, period_end, source_file, uploaded_at, created_at
FROM member_performance_metrics
WHERE member_id BETWEEN 100 AND 122 AND member_id != 121
AND metric_code IN ('ROR','QA','ACHT','Missed')
""")

count = 0
for row in c1.fetchall():
    new_member_id = member_map.get(row[0])
    if new_member_id:
        c10.execute("""INSERT INTO member_performance_metrics
            (member_id, metric_code, metric_value, normalized_score, week_number, month_number, year, period_start, period_end, source_file, uploaded_at, created_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (new_member_id, *row[1:]))
        count += 1

v10.commit()
v1.close()
v10.close()
print(f"  ✅ {count} performance records copied")
print("\n🎉 Metrics migration complete!")
