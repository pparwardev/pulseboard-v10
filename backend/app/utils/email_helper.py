"""Email helper for sending leave announcement emails via Amazon SES SMTP."""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)

NOTIFY_EMAIL = "pparwar@amazon.com"


def send_leave_announce_email(
    sender_email: str, login_id: str, user_name: str,
    leave_start: str, leave_end: str, return_date: str,
):
    """Send OOO announcement email from the user's own registered email."""
    subject = f"{login_id} OOTO from {leave_start} to {leave_end}"

    body = (
        f"Hello,\n\n"
        f"I will be out of the office from {leave_start} through {leave_end} "
        f"and will have limited access to communications during this time.\n\n"
        f"For immediate assistance, please contact my direct manager.\n\n"
        f"For non-urgent matters, I will respond to messages upon my return on {return_date}.\n\n"
        f"Regards,\n"
        f"{user_name}\n"
        f"SPS Account Manager, Leadership Escalations [LESC]\n"
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender_email
    msg["To"] = NOTIFY_EMAIL
    msg.attach(MIMEText(body, "plain"))

    try:
        print(f"[EMAIL] Sending from {sender_email} to {NOTIFY_EMAIL}...")
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_TLS:
                server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(sender_email, [NOTIFY_EMAIL], msg.as_string())
        print(f"[EMAIL] SUCCESS - sent from {sender_email}")
        return True
    except Exception as e:
        print(f"[EMAIL] FAILED - {e}")
        return False


def verify_ses_email(email: str):
    """Verify an email address in SES so it can be used as sender."""
    try:
        import boto3
        ses = boto3.client("ses", region_name="ap-south-1")
        ses.verify_email_identity(EmailAddress=email)
        logger.info(f"SES verification email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send SES verification for {email}: {e}")
        return False
