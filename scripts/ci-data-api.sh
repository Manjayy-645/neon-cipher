#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
compose=(docker compose --project-name neon-cipher-ci --file scripts/ci-data-api/compose.yml)
if [[ "${1:-}" == stop ]]; then
  "${compose[@]}" down --volumes
  exit
fi
if [[ "${1:-}" != start || -z "${2:-}" ]]; then
  echo 'Usage: bash scripts/ci-data-api.sh start /tmp/neon-cipher-ci.env | stop' >&2
  exit 2
fi
"${compose[@]}" up --detach --wait --wait-timeout 120
python3 - "$2" <<'PY'
import base64, hashlib, hmac, json, pathlib, sys, time, urllib.request
encode = lambda data: base64.urlsafe_b64encode(data).rstrip(b'=').decode()
header = encode(json.dumps({'alg':'HS256','typ':'JWT'}).encode())
payload = encode(json.dumps({'role':'anon','iss':'local-ci-fixture','exp':4102444800}).encode())
message = header + '.' + payload
signature = encode(hmac.new(b'local-only-test-signing-secret-at-least-32-chars', message.encode(), hashlib.sha256).digest())
token = message + '.' + signature
url = 'http://127.0.0.1:54328'
request = urllib.request.Request(url + '/rest/v1/profiles?handle=eq.CI_RLS_FIXTURE&limit=1', headers={'Authorization':'Bearer ' + token})
for attempt in range(60):
    try:
        with urllib.request.urlopen(request, timeout=2) as response:
            assert response.status == 200
            assert json.load(response)[0]['handle'] == 'CI_RLS_FIXTURE'
        break
    except Exception:
        if attempt == 59:
            raise
        time.sleep(1)
user_payload = encode(json.dumps({'role':'authenticated','sub':'00000000-0000-4000-8000-000000000001','exp':4102444800}).encode())
user_message = header + '.' + user_payload
user_signature = encode(hmac.new(b'local-only-test-signing-secret-at-least-32-chars', user_message.encode(), hashlib.sha256).digest())
user_token = user_message + '.' + user_signature
pathlib.Path(sys.argv[1]).write_text('NEXT_PUBLIC_SUPABASE_URL=' + url + '\nNEXT_PUBLIC_SUPABASE_ANON_KEY=' + token + '\nSUPABASE_TEST_USER_JWT=' + user_token + '\n')
print('Disposable Data API and migrated RLS fixture ready.')
PY
