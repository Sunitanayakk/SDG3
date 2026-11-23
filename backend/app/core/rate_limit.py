import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

from app.core.config import settings

_windows = defaultdict(deque)


def limit(request: Request):
    now = time.monotonic()
    key = request.client.host if request.client else "local"
    # Only trust the socket address; deploy one worker with platform ingress protection.
    for old in list(_windows):
        if not _windows[old] or now - _windows[old][-1] > 60:
            del _windows[old]
    window = _windows[key]
    while window and now - window[0] > 60:
        window.popleft()
    if len(window) >= settings().rate_limit:
        raise HTTPException(429, "Too many requests. Retry in one minute.", headers={"Retry-After": "60"})
    window.append(now)
