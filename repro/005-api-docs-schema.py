"""Check the published endpoint reference and its missing required parameter docs."""
import json
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
import urllib.error
import urllib.request


class ArticleParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_article = False
        self.text = []
        self.links = []

    def handle_starttag(self, tag, attrs):
        if tag == "article":
            self.in_article = True
        if self.in_article and tag in ("p", "h1", "h2", "h3", "h4", "pre", "li"):
            self.text.append("\n")
        if self.in_article and tag == "a":
            self.links.extend(v for k, v in attrs if k == "href")

    def handle_endtag(self, tag):
        if tag == "article":
            self.in_article = False

    def handle_data(self, data):
        if self.in_article:
            self.text.append(data)


docs = []
for host in ("app.testnet.dreamdex.io", "app.dreamdex.io"):
    url = "https://" + host + "/docs/developers/http-api/trading"
    with urllib.request.urlopen(url, timeout=20) as response:
        page = response.read().decode()
    parser = ArticleParser()
    parser.feed(page)
    text = "".join(parser.text)
    heading = "GET /v0/markets/{symbol}/candles"
    start = text.index(heading)
    end = text.index("Order Management", start)
    section = text[start:end].strip()
    docs.append({"url": url, "articleText": text, "articleLinks": parser.links, "candleSection": section, "onlyEndpointHeading": section == heading})

api_url = "https://api.dreamdex.io/v0/markets/SOMI:USDso/candles"
try:
    response = urllib.request.urlopen(api_url, timeout=20)
except urllib.error.HTTPError as error:
    response = error
api = {"url": api_url, "status": response.code, "response": json.loads(response.read())}
response.close()
result = {"collectedAtUtc": datetime.now(timezone.utc).isoformat(), "sdk": "not applicable", "wallet": None, "docs": docs, "api": api}
Path("evidence").mkdir(exist_ok=True)
Path("evidence/005-api-docs-schema.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
assert all(row["onlyEndpointHeading"] for row in docs), "Issue not reproduced: candle reference contains more than a heading"
assert api["status"] == 400 and "interval is required" in api["response"]["description"], "Required-parameter control changed"
print("DOC GAP REPRODUCED on both documentation hosts: no candle parameters or response schema; API requires interval.")
