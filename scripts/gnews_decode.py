"""Decode Google News RSS redirect URLs into the publisher's real URL."""
import json, re, sys, urllib.parse, urllib.request

UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"}

def decode(url: str) -> str:
    art_id = urllib.parse.urlparse(url).path.split("/")[-1]
    html = urllib.request.urlopen(urllib.request.Request(f"https://news.google.com/articles/{art_id}", headers=UA), timeout=20).read().decode()
    sg = re.search(r'data-n-a-sg="([^"]+)"', html).group(1)
    ts = re.search(r'data-n-a-ts="([^"]+)"', html).group(1)
    inner = ["garturlreq", [["X", "X", ["X", "X"], None, None, 1, 1, "US:en", None, 1, None, None, None, None, None, 0, 1], "X", "X", 1, [1, 1, 1], 1, 1, None, 0, 0, None, 0], art_id, int(ts), sg]
    payload = [[["Fbv4je", json.dumps(inner), None, "generic"]]]
    body = urllib.parse.urlencode({"f.req": json.dumps(payload)}).encode()
    req = urllib.request.Request("https://news.google.com/_/DotsSplashUi/data/batchexecute", data=body,
                                 headers={**UA, "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"})
    text = urllib.request.urlopen(req, timeout=20).read().decode()
    data = json.loads(text.split("\n\n")[1])[:-2]
    return json.loads(data[0][2])[1]

if __name__ == "__main__":
    for line in sys.stdin:
        parts = line.strip().split(" ", 1)
        if len(parts) < 2: continue
        key, url = parts
        try:
            print(key, decode(url), flush=True)
        except Exception as e:
            print(key, "ERROR", e, flush=True)
