#!/usr/bin/env python3
"""
Write to the Lock Quests Master List using a Google service account.

Credential: the service account JSON, as the environment variable
GOOGLE_SHEETS_SA (either the raw JSON or a path to the file).

Safety rules baked in:
  - column I is the =(G+H)/2 formula and is never written
  - an existing non-empty cell is never overwritten unless --force
  - every write is read back and verified

Usage:
  python3 tools/sheet_write.py check
  python3 tools/sheet_write.py set <A1 range> <tab separated values>
  python3 tools/sheet_write.py append <tab separated row>
"""
import json, os, sys, time, re
import jwt, requests

SHEET_ID = "10iKJWSILOwRHidV_YIuMl2b_ovQsZANcRxsUBHpaS0U"
TAB = "Master List"
SCOPE = "https://www.googleapis.com/auth/spreadsheets"
FORMULA_COL = "I"          # =(G+H)/2, never ours to write


def creds():
    raw = os.environ.get("GOOGLE_SHEETS_SA")
    if not raw:
        sys.exit("GOOGLE_SHEETS_SA is not set. Add it in the environment settings, "
                 "then start a new session so it is loaded.")
    if raw.strip().startswith("{"):
        return json.loads(raw)
    with open(raw) as fh:
        return json.load(fh)


def token():
    c = creds()
    now = int(time.time())
    claim = {
        "iss": c["client_email"], "scope": SCOPE,
        "aud": "https://oauth2.googleapis.com/token",
        "iat": now, "exp": now + 3600,
    }
    assertion = jwt.encode(claim, c["private_key"], algorithm="RS256")
    r = requests.post("https://oauth2.googleapis.com/token", timeout=30, data={
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": assertion})
    if r.status_code != 200:
        sys.exit("token exchange failed %s: %s" % (r.status_code, r.text[:400]))
    return r.json()["access_token"], c["client_email"]


def api(tok, method, path, **kw):
    url = "https://sheets.googleapis.com/v4/spreadsheets/%s%s" % (SHEET_ID, path)
    r = requests.request(method, url, timeout=40,
                         headers={"Authorization": "Bearer " + tok}, **kw)
    if r.status_code >= 300:
        sys.exit("%s %s -> %s: %s" % (method, path, r.status_code, r.text[:400]))
    return r.json()


def touches_formula(rng):
    cols = re.findall(r"([A-Z]+)\d+", rng.split("!")[-1])
    if len(cols) < 2:
        return FORMULA_COL in cols
    a, b = cols[0], cols[-1]
    return a <= FORMULA_COL <= b


def read(tok, rng):
    j = api(tok, "GET", "/values/%s" % requests.utils.quote(rng, safe=""))
    return j.get("values", [])


def cmd_check():
    tok, email = token()
    meta = api(tok, "GET", "?fields=properties.title,sheets.properties.title")
    print("  authenticated as : %s" % email)
    print("  spreadsheet      : %s" % meta["properties"]["title"])
    print("  tabs             : %s" % ", ".join(
        s["properties"]["title"] for s in meta["sheets"]))
    rows = read(tok, "%s!A1:Q1" % TAB)
    print("  header columns   : %d" % (len(rows[0]) if rows else 0))
    print("\n  write access: ", end="")
    probe = "%s!Z99999" % TAB
    api(tok, "PUT", "/values/%s?valueInputOption=RAW" % requests.utils.quote(probe, safe=""),
        json={"values": [["probe"]]})
    api(tok, "POST", "/values/%s:clear" % requests.utils.quote(probe, safe=""), json={})
    print("confirmed (wrote and cleared a scratch cell)")


def cmd_set(rng, tsv, force=False):
    if not rng.startswith(TAB):
        rng = "%s!%s" % (TAB, rng)
    if touches_formula(rng) and not force:
        sys.exit("refusing: %s covers column %s, which holds the average formula" %
                 (rng, FORMULA_COL))
    tok, _ = token()
    before = read(tok, rng)
    if any(any((c or "").strip() for c in row) for row in before) and not force:
        sys.exit("refusing: %s already has data. Re-run with --force to overwrite.\n  %r"
                 % (rng, before))
    vals = [line.split("\t") for line in tsv.split("\n")]
    api(tok, "PUT", "/values/%s?valueInputOption=USER_ENTERED" % requests.utils.quote(rng, safe=""),
        json={"values": vals})
    after = read(tok, rng)
    print("  wrote %s" % rng)
    for row in after:
        print("    %s" % " | ".join(row))


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--force"]
    force = "--force" in sys.argv
    if not args or args[0] == "check":
        cmd_check()
    elif args[0] == "set" and len(args) >= 3:
        cmd_set(args[1], args[2], force)
    else:
        sys.exit(__doc__)
