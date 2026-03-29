# @AI-HINT: Email sending service using SMTP for transactional emails and notifications
# Email Service Configuration
# This module provides email sending capabilities using SMTP

from typing import List, Optional, Dict, Any
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import smtplib
import logging
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

class EmailService:
    """
    Email service for sending transactional and notification emails.
    Supports both plain text and HTML emails with attachments.
    """
    
    def __init__(self):
        self.smtp_server = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.FROM_EMAIL
        self.from_name = settings.FROM_NAME
        
        # Setup Jinja2 template environment
        template_dir = Path(__file__).parent.parent / "templates" / "emails"
        self.template_env = Environment(loader=FileSystemLoader(str(template_dir)))
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> bool:
        """
        Send an email using SMTP.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML content of the email
            text_content: Plain text fallback (optional)
            attachments: List of attachment dicts with 'filename' and 'content'
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            
            # Add text part if provided
            if text_content:
                text_part = MIMEText(text_content, 'plain')
                msg.attach(text_part)
            
            # Add HTML part
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Add attachments if any
            if attachments:
                for attachment in attachments:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment['content'])
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f"attachment; filename= {attachment['filename']}"
                    )
                    msg.attach(part)
            
            # Send email
            if self.smtp_server == "smtp.gmail.com" and not self.smtp_username:
                # Mock email sending if not configured
                logger.info("[MOCK EMAIL] To: %s, Subject: %s", to_email, subject)
                logger.debug("[MOCK EMAIL] Content: %s...", (text_content or html_content[:100]))
                return True

            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                if self.smtp_username and self.smtp_password:
                    server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            return True
            
        except Exception as e:
            logger.error("Failed to send email: %s", e)
            return False
    
    def render_template(self, template_name: str, context: Dict[str, Any]) -> str:
        """
        Render an email template with context data.
        
        Args:
            template_name: Name of the template file (e.g., 'welcome.html')
            context: Dictionary of context variables for template
            
        Returns:
            str: Rendered HTML content
        """
        template = self.template_env.get_template(template_name)
        return template.render(**context)
    
    # Convenience methods for common email types
    
    def send_welcome_email(self, to_email: str, user_name: str) -> bool:
        """Send welcome email to new user."""
        html_content = self.render_template('welcome.html', {
            'user_name': user_name,
            'app_name': 'MegiLance',
            'login_url': f"{settings.FRONTEND_URL}/login"
        })
        return self.send_email(
            to_email=to_email,
            subject="Welcome to MegiLance!",
            html_content=html_content
        )
    
    def send_verification_email(self, to_email: str, user_name: str, verification_token: str) -> bool:
        """Send email verification link."""
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
        html_content = self.render_template('email_verification.html', {
            'user_name': user_name,
            'verification_url': verification_url
        })
        return self.send_email(
            to_email=to_email,
            subject="Verify Your Email Address",
            html_content=html_content
        )
    
    def send_password_reset_email(self, to_email: str, user_name: str, reset_token: str) -> bool:
        """Send password reset link."""
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        html_content = self.render_template('password_reset.html', {
            'user_name': user_name,
            'reset_url': reset_url
        })
        return self.send_email(
            to_email=to_email,
            subject="Reset Your Password",
            html_content=html_content
        )
    
    def send_project_posted_notification(
        self, to_email: str, freelancer_name: str, project_title: str, project_id: int
    ) -> bool:
        """Notify freelancer of new project matching their skills."""
        project_url = f"{settings.FRONTEND_URL}/projects/{project_id}"
        html_content = self.render_template('project_posted.html', {
            'freelancer_name': freelancer_name,
            'project_title': project_title,
            'project_url': project_url
        })
        return self.send_email(
            to_email=to_email,
            subject=f"New Project: {project_title}",
            html_content=html_content
        )
    
    def send_proposal_received_notification(
        self, to_email: str, client_name: str, freelancer_name: str, project_title: str, proposal_id: int
    ) -> bool:
        """Notify client of new proposal."""
        proposal_url = f"{settings.FRONTEND_URL}/proposals/{proposal_id}"
        html_content = self.render_template('proposal_received.html', {
            'client_name': client_name,
            'freelancer_name': freelancer_name,
            'project_title': project_title,
            'proposal_url': proposal_url
        })
        return self.send_email(
            to_email=to_email,
            subject=f"New Proposal from {freelancer_name}",
            html_content=html_content
        )
    
    def send_proposal_accepted_notification(
        self, to_email: str, freelancer_name: str, project_title: str, contract_id: int
    ) -> bool:
        """Notify freelancer that proposal was accepted."""
        contract_url = f"{settings.FRONTEND_URL}/contracts/{contract_id}"
        html_content = self.render_template('proposal_accepted.html', {
            'freelancer_name': freelancer_name,
            'project_title': project_title,
            'contract_url': contract_url
        })
        return self.send_email(
            to_email=to_email,
            subject=f"Proposal Accepted - {project_title}",
            html_content=html_content
        )
    
    def send_contract_created_notification(
        self, to_email: str, user_name: str, project_title: str, contract_id: int
    ) -> bool:
        """Notify both parties of contract creation."""
        contract_url = f"{settings.FRONTEND_URL}/contracts/{contract_id}"
        html_content = self.render_template('contract_created.html', {
            'user_name': user_name,
            'project_title': project_title,
            'contract_url': contract_url
        })
        return self.send_email(
            to_email=to_email,
            subject=f"Contract Created - {project_title}",
            html_content=html_content
        )
    
    def send_milestone_submitted_notification(
        self, to_email: str, client_name: str, milestone_title: str, contract_id: int
    ) -> bool:
        """Notify client of milestone submission."""
        contract_url = f"{settings.FRONTEND_URL}/contracts/{contract_id}"
        html_content = self.render_template('milestone_submitted.html', {
            'client_name': client_name,
            'milestone_title': milestone_title,
            'contract_url': contract_url
        })
        return self.send_email(
            to_email=to_email,
            subject=f"Milestone Submitted - {milestone_title}",
            html_content=html_content
        )
    
    def send_milestone_approved_notification(
        self, to_email: str, freelancer_name: str, milestone_title: str, amount: float
    ) -> bool:
        """Notify freelancer of milestone approval and payment."""
        html_content = self.render_template('milestone_approved.html', {
            'freelancer_name': freelancer_name,
            'milestone_title': milestone_title,
            'amount': f"${amount:.2f}"
        })
        return self.send_email(
            to_email=to_email,
            subject="Milestone Approved - Payment Released",
            html_content=html_content
        )
    
    def send_payment_received_notification(
        self, to_email: str, user_name: str, amount: float, payment_id: int
    ) -> bool:
        """Notify user of payment receipt."""
        html_content = self.render_template('payment_received.html', {
            'user_name': user_name,
            'amount': f"${amount:.2f}",
            'payment_id': payment_id
        })
        return self.send_email(
            to_email=to_email,
            subject=f"Payment Received - ${amount:.2f}",
            html_content=html_content
        )
    
    def send_invoice_generated_notification(
        self, to_email: str, client_name: str, invoice_number: str, amount: float, invoice_id: int
    ) -> bool:
        """Notify client of new invoice."""
        invoice_url = f"{settings.FRONTEND_URL}/invoices/{invoice_id}"
        html_content = self.render_template('invoice_generated.html', {
            'client_name': client_name,
            'invoice_number': invoice_number,
            'amount': f"${amount:.2f}",
            'invoice_url': invoice_url
        })
        return self.send_email(
            to_email=to_email,
            subject=f"Invoice {invoice_number} - ${amount:.2f}",
            html_content=html_content
        )
    
    def send_invoice_paid_notification(
        self, to_email: str, freelancer_name: str, invoice_number: str, amount: float
    ) -> bool:
        """Notify freelancer of invoice payment."""
        html_content = self.render_template('invoice_paid.html', {
            'freelancer_name': freelancer_name,
            'invoice_number': invoice_number,
            'amount': f"${amount:.2f}"
        })
        return self.send_email(
            to_email=to_email,
            subject=f"Invoice Paid - {invoice_number}",
            html_content=html_content
        )
    
    def send_dispute_opened_notification(
        self, to_email: str, user_name: str, dispute_subject: str, dispute_id: int
    ) -> bool:
        """Notify parties of dispute opening."""
        dispute_url = f"{settings.FRONTEND_URL}/disputes/{dispute_id}"
        html_content = self.render_template('dispute_opened.html', {
            'user_name': user_name,
            'dispute_subject': dispute_subject,
            'dispute_url': dispute_url
        })
        return self.send_email(
            to_email=to_email,
            subject=f"Dispute Opened - {dispute_subject}",
            html_content=html_content
        )
    
    def send_review_received_notification(
        self, to_email: str, user_name: str, reviewer_name: str, rating: int, project_title: str
    ) -> bool:
        """Notify user of new review."""
        html_content = self.render_template('review_received.html', {
            'user_name': user_name,
            'reviewer_name': reviewer_name,
            'rating': rating,
            'project_title': project_title
        })
        return self.send_email(
            to_email=to_email,
            subject=f"New Review from {reviewer_name}",
            html_content=html_content
        )
    
    def send_message_notification(
        self, to_email: str, recipient_name: str, sender_name: str, message_preview: str
    ) -> bool:
        """Notify user of new message."""
        messages_url = f"{settings.FRONTEND_URL}/messages"
        html_content = self.render_template('message_received.html', {
            'recipient_name': recipient_name,
            'sender_name': sender_name,
            'message_preview': message_preview[:100],
            'messages_url': messages_url
        })
        return self.send_email(
            to_email=to_email,
            subject=f"New Message from {sender_name}",
            html_content=html_content
        )
    
    def send_support_ticket_update(
        self, to_email: str, user_name: str, ticket_subject: str, status: str, ticket_id: int
    ) -> bool:
        """Notify user of support ticket status change."""
        ticket_url = f"{settings.FRONTEND_URL}/support/{ticket_id}"
        html_content = self.render_template('support_ticket_update.html', {
            'user_name': user_name,
            'ticket_subject': ticket_subject,
            'status': status,
            'ticket_url': ticket_url
        })
        return self.send_email(
            to_email=to_email,
            subject=f"Support Ticket Update - {ticket_subject}",
            html_content=html_content
        )

# Global email service instance
email_service = EmailService()
