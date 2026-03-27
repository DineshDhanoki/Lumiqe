"""
Lumiqe — Retention & Product Tests (Phase 5 TDD).

Tests for payment failure emails, chat history persistence,
trial expiration reminders, and share tracking.
"""

import inspect


# ─── Task 5.2: Payment failed must send email notification ───


class TestPaymentFailedEmail:
    """Stripe payment_failed webhook must notify the user."""

    def test_payment_failed_handler_sends_email(self):
        """invoice.payment_failed handler must call an email function."""
        from app.api import stripe as stripe_module
        source = inspect.getsource(stripe_module)

        # Find the payment_failed section
        pf_pos = source.find("invoice.payment_failed")
        assert pf_pos != -1, "invoice.payment_failed handler not found"

        # Check the code after this handler for email sending
        pf_section = source[pf_pos:pf_pos + 600]
        has_email = any(pattern in pf_section for pattern in [
            "send_payment_failed_email",
            "send_dunning_email",
            "send_",  # any email send function
        ])
        assert has_email, (
            "invoice.payment_failed handler logs the event but never sends "
            "an email notification to the user. Users won't know their payment failed."
        )

    def test_payment_failed_email_function_exists(self):
        """A dedicated payment failed email template must exist."""
        from app.services import email as email_module
        assert hasattr(email_module, "send_payment_failed_email"), (
            "send_payment_failed_email function not found in email service"
        )


# ─── Task 5.5: Chat history must be stored server-side ───────


class TestChatHistoryPersistence:
    """Chat history must be stored on the server for returning users."""

    def test_chat_endpoint_stores_history(self):
        """color_chat module must have a save/store mechanism for history."""
        from app.api import color_chat as chat_module
        source = inspect.getsource(chat_module)

        has_persistence = any(pattern in source for pattern in [
            "store_chat_history",
            "save_chat",
            "redis",
            "chat_history",
            "_store_history",
        ])
        assert has_persistence, (
            "Chat endpoint has no server-side history storage. "
            "Conversations are lost on page refresh."
        )

    def test_chat_endpoint_loads_history(self):
        """Chat endpoint must load previous history for returning users."""
        from app.api import color_chat as chat_module
        source = inspect.getsource(chat_module)

        has_loading = any(pattern in source for pattern in [
            "load_chat_history",
            "get_chat_history",
            "retrieve_chat",
            "_load_history",
        ])
        assert has_loading, (
            "Chat endpoint has no history loading. "
            "Users can't continue previous conversations."
        )


# ─── Task 5.6: Trial expiration reminder email ──────────────


class TestTrialExpirationReminder:
    """Trial users must receive reminder emails before expiration."""

    def test_trial_reminder_email_function_exists(self):
        """A trial expiration reminder email template must exist."""
        from app.services import email as email_module
        has_trial_email = (
            hasattr(email_module, "send_trial_expiring_email")
            or hasattr(email_module, "send_trial_reminder_email")
        )
        assert has_trial_email, (
            "No trial expiration email function found in email service. "
            "Need send_trial_expiring_email or send_trial_reminder_email."
        )
