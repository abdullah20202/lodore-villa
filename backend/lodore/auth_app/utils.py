"""
Phone number normalization utilities for Saudi Arabia numbers.

Accepted formats:
  05xxxxxxxx   → 05xxxxxxxx   (already normalized)
  5xxxxxxxx    → 05xxxxxxxx
  9665xxxxxxxx → 05xxxxxxxx
  +9665xxxxxxxx → 05xxxxxxxx

All output is stored and compared as 05xxxxxxxx (10 digits).
"""
import re
import logging

logger = logging.getLogger("lodore")


def normalize_phone(raw: str) -> str | None:
    """
    Normalize a Saudi phone number to 05xxxxxxxx format.
    Returns None if the number cannot be normalized.
    """
    if not raw:
        return None

    # Strip whitespace and common separators
    phone = re.sub(r"[\s\-\(\)]", "", str(raw).strip())

    # Remove leading +
    if phone.startswith("+"):
        phone = phone[1:]

    # Handle 966XXXXXXXXXX (13 digits) or 966XXXXXXXXX (12 digits)
    if phone.startswith("966"):
        phone = "0" + phone[3:]

    # Now we expect either 05xxxxxxxxx (11 digits), 05xxxxxxxx (10 digits), or 5xxxxxxxxx (10 digits), or 5xxxxxxxx (9 digits)
    if re.fullmatch(r"5\d{9}", phone):  # 5xxxxxxxxx (10 digits)
        phone = "0" + phone
    elif re.fullmatch(r"5\d{8}", phone):  # 5xxxxxxxx (9 digits)
        phone = "0" + phone

    # Validate final form: 05xxxxxxxxx (11 digits) or 05xxxxxxxx (10 digits)
    if re.fullmatch(r"05\d{9}", phone) or re.fullmatch(r"05\d{8}", phone):
        return phone

    logger.warning("Could not normalize phone: %s", raw)
    return None


def is_valid_normalized_phone(phone: str) -> bool:
    return bool(phone and re.fullmatch(r"05\d{8}", phone))
