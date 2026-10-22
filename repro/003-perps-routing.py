"""Read-only HTTP checks. Requires Python 3; uses the standard library only."""
import json
import pathlib
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


opener = urllib.request.build_opener(NoRedirect)


def trace(url):
    hops = []
    for _ in range(8):
        try:
            response = opener.open(url, timeout=20)
        except urllib.error.HTTPError as error:
            response = error
        location = response.headers.get("Location")
        hops.append({"url": url, "status": response.code, "location": location})
        response.close()
        if response.code not in (301, 302, 303, 307, 308) or not location:
            break
        url = urllib.parse.urljoin(url, location)
    return hops


result = {
    "collectedAtUtc": datetime.now(timezone.utc).isoformat(),
    "network": "Somnia Tokyo testnet",
    "wallet": None,
    "request": "GET, no cookies, no authentication, redirects recorded individually",
    "docsSource": "https://app.testnet.dreamdex.io/docs/developers/perps-testnet",
    "docsLink": trace("https://app.testnet.dreamdex.io/perps"),
    "navigationLink": trace("https://app.testnet.dreamdex.io/trade/perps/tokyo/BTC-PERP"),
    "spotControl": trace("https://app.testnet.dreamdex.io/trade/spot/tokyo/STT:USDso"),
}
pathlib.Path("evidence").mkdir(exist_ok=True)
pathlib.Path("evidence/003-perps-routing.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps(result, indent=2))
assert "/trade/spot/" in result["docsLink"][-1]["url"], "Issue not reproduced: docs link did not end on Spot"
assert "/trade/spot/" in result["navigationLink"][-1]["url"], "Issue not reproduced: navigation link did not end on Spot"
assert result["spotControl"][-1]["status"] == 200, "Control request failed"
print("BUG REPRODUCED. See evidence/003-perps-routing.json")
