import resend

from app.config import settings


def send_otp_email(
    recipient: str,
    otp: str,
) -> None:
    """Send a login verification code through Resend."""

    if not settings.resend_api_key:
        raise RuntimeError("Resend API key is not configured.")

    resend.api_key = settings.resend_api_key

    params: resend.Emails.SendParams = {
        "from": settings.email_from,
        "to": [recipient],
        "subject": "Your Job Tracker verification code",
        "html": f"""
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
            <h2>Verify your login</h2>
            <p>Use this code to complete your Job Tracker login:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">
                {otp}
            </div>
            <p>This code expires in 5 minutes.</p>
            <p>If you didn't attempt to log in, you can ignore this email.</p>
        </div>
        """,
    }

    resend.Emails.send(params)