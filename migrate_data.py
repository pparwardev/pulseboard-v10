"""Migrate LESC team data from pulseboard (v1) to pulseboard_v10"""
import psycopg2

V1 = "postgresql://pulseboard_admin:Luxakki92@localhost:5432/pulseboard"
V10 = "postgresql://pulseboard_admin:Luxakki92@localhost:5432/pulseboard_v10"
EXCLUDE_LOGINS = ('kooliyad', 'kukir', 'routrays')

v1 = psycopg2.connect(V1)
v10 = psycopg2.connect(V10)
c1, c10 = v1.cursor(), v10.cursor()

# Build login -> v10_id mapping
c10.execute("SELECT login, id FROM users")
v10_map = dict(c10.fetchall())

# Build v1_id -> login mapping
c1.execute("SELECT id, login FROM users WHERE id BETWEEN 116 AND 140")
v1_login = dict(c1.fetchall())

def v1_to_v10(v1_id):
    login = v1_login.get(v1_id)
    if login and login not in EXCLUDE_LOGINS:
        return v10_map.get(login)
    return None

# 1. UPCOMING LEAVES
print("Importing upcoming_leaves...")
c1.execute("SELECT user_id, leave_date, end_date, leave_type, reason, is_announced, is_processed, created_at FROM upcoming_leaves WHERE user_id BETWEEN 116 AND 140")
count = 0
for row in c1.fetchall():
    new_uid = v1_to_v10(row[0])
    if new_uid:
        c10.execute("INSERT INTO upcoming_leaves (user_id, leave_date, end_date, leave_type, reason, is_announced, is_processed, created_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                     (new_uid, *row[1:]))
        count += 1
print(f"  ✅ {count} rows")

# 2. LEAVE SUBMISSIONS (v1: start_date -> v10: leave_date)
print("Importing leave_submissions...")
c1.execute("SELECT user_id, start_date, leave_type, reason, is_delivered, is_viewed, created_at FROM leave_submissions WHERE user_id BETWEEN 116 AND 140")
count = 0
for row in c1.fetchall():
    new_uid = v1_to_v10(row[0])
    if new_uid:
        c10.execute("INSERT INTO leave_submissions (user_id, leave_date, leave_type, reason, is_delivered, is_viewed, created_at) VALUES (%s,%s,%s,%s,%s,%s,%s)",
                     (new_uid, *row[1:]))
        count += 1
print(f"  ✅ {count} rows")

# 3. OT SUBMISSIONS
print("Importing ot_submissions...")
c1.execute("SELECT user_id, date, start_time, end_time, hours, ot_type, reason, status, rejection_reason, is_delivered, is_viewed, created_at, reviewed_at FROM ot_submissions WHERE user_id BETWEEN 116 AND 140")
count = 0
for row in c1.fetchall():
    new_uid = v1_to_v10(row[0])
    if new_uid:
        c10.execute("INSERT INTO ot_submissions (user_id, date, start_time, end_time, hours, ot_type, reason, status, rejection_reason, is_delivered, is_viewed, created_at, reviewed_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                     (new_uid, *row[1:]))
        count += 1
print(f"  ✅ {count} rows")

# 4. NOTIFICATIONS
print("Importing notifications...")
c1.execute("SELECT user_id, title, message, type, is_read, created_at FROM notifications WHERE user_id BETWEEN 116 AND 140")
count = 0
for row in c1.fetchall():
    new_uid = v1_to_v10(row[0])
    if new_uid:
        c10.execute("INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES (%s,%s,%s,%s,%s,%s)",
                     (new_uid, *row[1:]))
        count += 1
print(f"  ✅ {count} rows")

# 5. POLLS + OPTIONS + VOTES
print("Importing polls...")
c1.execute("SELECT id, question, created_by, created_at, is_active FROM polls WHERE created_by BETWEEN 116 AND 140")
poll_map = {}
count = 0
for row in c1.fetchall():
    new_uid = v1_to_v10(row[2])
    if new_uid:
        c10.execute("INSERT INTO polls (question, created_by, created_at, is_active) VALUES (%s,%s,%s,%s) RETURNING id",
                     (row[1], new_uid, row[3], row[4]))
        poll_map[row[0]] = c10.fetchone()[0]
        count += 1
print(f"  ✅ {count} polls")

print("Importing poll_options...")
option_map = {}
count = 0
for v1_poll_id, v10_poll_id in poll_map.items():
    c1.execute("SELECT id, option_text FROM poll_options WHERE poll_id = %s", (v1_poll_id,))
    for opt in c1.fetchall():
        c10.execute("INSERT INTO poll_options (poll_id, option_text) VALUES (%s,%s) RETURNING id",
                     (v10_poll_id, opt[1]))
        option_map[opt[0]] = c10.fetchone()[0]
        count += 1
print(f"  ✅ {count} options")

print("Importing poll_votes...")
count = 0
for v1_poll_id, v10_poll_id in poll_map.items():
    c1.execute("SELECT user_id, option_id, voted_at FROM poll_votes WHERE poll_id = %s", (v1_poll_id,))
    for vote in c1.fetchall():
        new_uid = v1_to_v10(vote[0])
        new_opt = option_map.get(vote[1])
        if new_uid and new_opt:
            c10.execute("INSERT INTO poll_votes (poll_id, option_id, user_id, voted_at) VALUES (%s,%s,%s,%s)",
                         (v10_poll_id, new_opt, new_uid, vote[2]))
            count += 1
print(f"  ✅ {count} votes")

# 6. WALL POSTS
print("Importing wall_posts...")
c1.execute("SELECT id, user_id, post_type, content, emoji, gif_url, badge, recipient_ids, leadership_principles, week_number, year, image_url, is_pinned, created_at FROM wall_posts WHERE user_id BETWEEN 116 AND 140")
post_map = {}
count = 0
for row in c1.fetchall():
    new_uid = v1_to_v10(row[1])
    if new_uid:
        c10.execute("INSERT INTO wall_posts (user_id, post_type, content, emoji, gif_url, badge, recipient_ids, leadership_principles, week_number, year, image_url, is_pinned, created_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                     (new_uid, *row[2:]))
        post_map[row[0]] = c10.fetchone()[0]
        count += 1
print(f"  ✅ {count} posts")

# 7. WALL REACTIONS
print("Importing wall_reactions...")
c1.execute("SELECT post_id, user_id, reaction, created_at FROM wall_reactions WHERE user_id BETWEEN 116 AND 140")
count = 0
for row in c1.fetchall():
    new_post = post_map.get(row[0])
    new_uid = v1_to_v10(row[1])
    if new_post and new_uid:
        c10.execute("INSERT INTO wall_reactions (post_id, user_id, reaction, created_at) VALUES (%s,%s,%s,%s)",
                     (new_post, new_uid, row[2], row[3]))
        count += 1
print(f"  ✅ {count} reactions")

v10.commit()
v1.close()
v10.close()
print("\n🎉 All LESC team data migrated successfully!")
