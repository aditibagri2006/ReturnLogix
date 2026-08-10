import os
import psycopg2

DATABASE_URL = os.getenv("DATABASE_URL")

# We keep a module-level connection but always validate it before use.
# On free-tier hosts (e.g. Render) the server can sleep and the TCP
# connection to the database is silently dropped while idle.  A single
# bare `conn = psycopg2.connect(...)` at import-time will therefore raise
# "InterfaceError: connection already closed" on the next request that
# comes in after a sleep period.
#
# `get_conn()` detects that situation and transparently reconnects, so
# every route handler just calls `get_conn()` instead of using `conn`
# directly.

_conn = None


def get_conn():
    global _conn
    try:
        # A simple ping – if the connection is dead this will raise.
        if _conn is not None:
            _conn.cursor().execute("SELECT 1")
    except Exception:
        _conn = None

    if _conn is None or _conn.closed:
        _conn = psycopg2.connect(DATABASE_URL, sslmode="require")

    return _conn


# Keep the old `conn` name available for any code that still imports it
# directly (backward compat).  It points to the same object as get_conn()
# after the first call, but callers should prefer get_conn() so they
# always get a live connection.
conn = get_conn()