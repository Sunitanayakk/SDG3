"""Verify built web/APK assets do not contain configured server credentials."""

import json
from pathlib import Path
from urllib.parse import unquote, urlsplit
from zipfile import ZipFile

from dotenv import dotenv_values


def main():
    root = Path(__file__).resolve().parents[2]
    server = dotenv_values(root / "backend/.env")
    admin = dotenv_values(root / "backend/.env.admin.local")
    values = [server.get(k) for k in ("NVIDIA_API_KEY", "SUPABASE_SERVICE_ROLE_KEY", "EMBEDDING_API_KEY")]
    values += [admin.get("SUPABASE_ADMIN_PASSWORD"), server.get("DATABASE_URL")]
    if server.get("DATABASE_URL"):
        values.append(unquote(urlsplit(server["DATABASE_URL"]).password or ""))
    private = [v.encode() for v in values if v and len(v) >= 8]
    if not private:
        raise SystemExit("No local server credentials available for comparison")
    leaked, checked = [], 0
    web = root / "apps/web/dist"
    if not (web / "index.html").exists():
        raise SystemExit("Build the web application first")
    for file in web.rglob("*"):
        if file.is_file():
            checked += 1
            if any(value in file.read_bytes() for value in private):
                leaked.append(str(file.relative_to(root)))
    apk = root / "artifacts/SwasthyaSetu-AI-demo-arm64.apk"
    with ZipFile(apk) as archive:
        embedded_bundle = "assets/index.android.bundle" in archive.namelist()
        for name in archive.namelist():
            if name.startswith("assets/") and not name.endswith("/"):
                checked += 1
                if any(value in archive.read(name) for value in private):
                    leaked.append("APK asset: " + name)
    report = {
        "server_secrets_absent": not leaked,
        "assets_checked": checked,
        "apk_embedded_bundle_present": embedded_bundle,
        "leaked_asset_paths": leaked,
    }
    (root / "artifacts/client-secret-check.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report))
    if leaked or not embedded_bundle:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
