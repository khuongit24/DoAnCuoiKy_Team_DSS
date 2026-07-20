import psycopg2
from psycopg2.extras import RealDictCursor
from .settings import settings
import logging

logger = logging.getLogger(__name__)

def get_db_connection():
    try:
        conn = psycopg2.connect(
            settings.database_url,
            cursor_factory=RealDictCursor
        )
        return conn
    except Exception as e:
        logger.error(f"Error connecting to database: {e}")
        raise e

def query_db(query: str, params: tuple = ()):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(query, params)
            if query.strip().upper().startswith(("INSERT", "UPDATE", "DELETE", "TRUNCATE", "ALTER", "DROP", "CREATE")):
                conn.commit()
                # Try to fetch returning rows if any
                try:
                    return cur.fetchall()
                except Exception:
                    return []
            
            try:
                return cur.fetchall()
            except Exception:
                return []
    except Exception as e:
        logger.error(f"Database query error: {e}")
        raise e
    finally:
        if conn is not None:
            conn.close()
