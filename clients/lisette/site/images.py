"""Site image manifest for Marriage & Retirement Abroad.

INTERIM SET (2026-08-10): brand-matched Provence imagery generated with
Genasys's Higsfeild account (soul_2 model), hotlinked from the Higsfeild CDN.
The stock photo sites are unreachable from the build environment, so this is
the "for now" set per client direction. Every slot has a branded gradient
fallback if a URL ever breaks.

MIGRATION NOTE: download these from the Higsfeild library (or replace with
licensed stock / client photos), commit JPGs to clients/lisette/images/ on
this repo, and swap the URLs below for raw.githubusercontent.com URLs.
Bio/about slots are intentionally NOT in this manifest (client wants
placeholders until brand photos arrive).
"""

_CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_3HLF56fntoufkyqpyZylwksqwoM"

IMAGES = {
    # 3:4 lavender rows to farmhouse, golden hour (homepage hero arch)
    "hero":       f"{_CDN}/hf_20260810_163550_c1f3536d-142f-462d-8679-c024ea9c0a19.png",
    # 4:3 cafe terrace, coffee + croissants + lavender (offer card, trip gallery)
    "cafe":       f"{_CDN}/hf_20260810_163550_10e54926-f661-42fb-9f84-28d43346d2ad.png",
    # 4:3 Provencal market stall (trip gallery)
    "market":     f"{_CDN}/hf_20260810_163550_2d570a0c-c0a7-4ef7-a144-aa9af282b72a.png",
    # 16:9 Mediterranean cove at sunset (trip gallery)
    "coast":      f"{_CDN}/hf_20260810_163550_2fa9f87f-8bf8-4dc6-80de-3c6f58bba9f0.png",
    # 3:4 lavender door in stone wall (trip gallery tall)
    "door":       f"{_CDN}/hf_20260810_163550_5155a00a-a372-4282-a536-65f010e3edf5.png",
    # 16:9 long lunch table in olive grove (offer card, trip gallery)
    "table":      f"{_CDN}/hf_20260810_163550_79bcc52d-c742-423e-99c0-9f9e8d26b9dd.png",
    # 4:3 French flat lay, notebook + coffee + lavender (french offer card)
    "flatlay":    f"{_CDN}/hf_20260810_163550_63d3b0d2-d9a0-42c1-920e-1d87a032caba.png",
    # 4:3 hilltop Provence village at dusk (trip "why practice" split)
    "village":    f"{_CDN}/hf_20260810_164148_8616caf1-c6f2-416c-9d67-30556f079d3f.png",
    # 16:9 wide lavender field panorama (trip hero background)
    "field_wide": f"{_CDN}/hf_20260810_164148_30802121-2d4e-48c3-b174-1e455901197d.png",
}

# drop empty entries so builder.img() falls back to branded placeholders
IMAGES = {k: v for k, v in IMAGES.items() if v}
