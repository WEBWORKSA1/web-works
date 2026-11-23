#!/usr/bin/env python3
"""Encode a new form inbox for assets/js/config.js without ever writing it in plain text.

Usage: python scripts/encode_inbox.py "address-here"
Paste the printed _k and _v arrays into assets/js/config.js.
"""
import random
import sys

if len(sys.argv) != 2 or "@" not in sys.argv[1]:
    sys.exit("usage: encode_inbox.py ADDRESS")
addr = sys.argv[1].strip()
key = [random.randint(17, 230) for _ in range(7)]
enc = [ord(c) ^ key[i % len(key)] for i, c in enumerate(addr)][::-1]
print("_k:", key)
print("_v:", enc)
