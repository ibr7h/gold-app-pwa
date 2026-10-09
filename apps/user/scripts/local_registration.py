"""Consume a private, test-only email capture from the disposable Nest fixture."""
import json
from pathlib import Path
import secrets
from urllib.parse import urlparse


def register_local(request, api, email, password, mailbox_file):
    assert urlparse(api).hostname in ('127.0.0.1', 'localhost'), 'Local fixtures only'
    try:
        phone = '+9665' + str(secrets.randbelow(100000000)).zfill(8)
        initial = request.post(api + '/auth/register', data={'email': email, 'password': password, 'phone': phone})
        assert initial.status == 201
        challenge = initial.json()
        assert 'accessToken' not in challenge and 'registrationId' in challenge
        code = json.loads(Path(mailbox_file).read_text())[email]
        verified = request.post(api + '/auth/register/verify', data={'registrationId': challenge['registrationId'], 'code': code})
        assert verified.status == 201
        return verified.json()
    except Exception:
        raise RuntimeError('Local registration fixture failed; credentials and verification codes withheld') from None
