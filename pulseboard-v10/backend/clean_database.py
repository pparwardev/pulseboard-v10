"""PulseBoard V10 - Database cleanup script. Creates fresh DB with default manager."""
from app.core.security import hash_password
from app.core.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.team_member import TeamMember
from app.models.notification import Notification
from app.models.poll import Poll, PollOption, PollVote
from app.models.wall_of_fame import WallPost, WallReaction, WallComment
from app.models.ot_submission import OTSubmission
from app.models.leave_submission import LeaveSubmission
from app.models.upcoming_leave import UpcomingLeave

print("🧹 PulseBoard V10 - Cleaning database...")

# Create all tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Delete all data in correct order
db.query(PollVote).delete()
db.query(PollOption).delete()
db.query(Poll).delete()
db.query(WallComment).delete()
db.query(WallReaction).delete()
db.query(WallPost).delete()
db.query(UpcomingLeave).delete()
db.query(LeaveSubmission).delete()
db.query(OTSubmission).delete()
db.query(Notification).delete()
db.query(TeamMember).delete()
db.query(User).delete()

# Create default manager
manager = User(
    email="manager@pulseboard.com",
    login="manager",
    name="Team Manager",
    employee_id="MGR001",
    hashed_password=hash_password("Manager@123"),
    role="manager",
    team_name="LESC",
    is_active=True,
    is_approved=True,
    is_email_verified=True,
)
db.add(manager)
db.commit()

print("✅ Database cleaned!")
print("\n📋 Default Manager Credentials:")
print("   Email: manager@pulseboard.com")
print("   Password: Manager@123")
print("\n✨ Register new team members via the registration form")

db.close()
