from unidecode import unidecode
import re
import random
import string
import time
import base36


def normalize_hostname(raw: str) -> str:
    raw = raw.strip()
    raw = unidecode(raw)  # remove accents
    raw = raw.lower()
    raw = re.sub(r"[^a-z0-9-]", "-", raw)
    raw = re.sub(r"-+", "-", raw)
    return raw.strip("-")[:63]


def generate_order_number():
    timestamp = base36.dumps(int(time.time() * 1000)).upper()
    random_str = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"VPS-{timestamp}-{random_str}"
