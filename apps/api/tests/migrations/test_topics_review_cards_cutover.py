"""Regression tests for topics/review_cards cutover migration."""

from __future__ import annotations

from pathlib import Path
from urllib.parse import urlparse
from uuid import uuid4

import psycopg2
from psycopg2 import sql

from tests.conftest import filter_migration_sql

CUTOVER_MIGRATION = "20260304090000_topics_review_cards_cutover.sql"
TEST_USER_ID = "migration-test-user"


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[4]


def _migrations_dir() -> Path:
    return _repo_root() / "supabase" / "migrations"


def _build_database_url(base_url: str, database_name: str) -> str:
    parsed = urlparse(base_url)
    return parsed._replace(path=f"/{database_name}").geturl()


def _create_temp_database(sync_database_url: str) -> tuple[str, str]:
    parsed = urlparse(sync_database_url)
    base_database = parsed.path.lstrip("/")
    temp_database = f"cutover_test_{uuid4().hex[:8]}"

    admin_conn = psycopg2.connect(sync_database_url)
    admin_conn.autocommit = True
    try:
        with admin_conn.cursor() as cursor:
            cursor.execute(
                sql.SQL("CREATE DATABASE {}").format(sql.Identifier(temp_database))
            )
    finally:
        admin_conn.close()

    temp_url = _build_database_url(sync_database_url, temp_database)
    return base_database, temp_url


def _drop_temp_database(sync_database_url: str, temp_database: str) -> None:
    admin_conn = psycopg2.connect(sync_database_url)
    admin_conn.autocommit = True
    try:
        with admin_conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE datname = %s
                  AND pid <> pg_backend_pid()
                """,
                (temp_database,),
            )
            cursor.execute(
                sql.SQL("DROP DATABASE IF EXISTS {}").format(
                    sql.Identifier(temp_database)
                )
            )
    finally:
        admin_conn.close()


def _run_sql_script(database_url: str, script: str) -> None:
    conn = psycopg2.connect(database_url)
    conn.autocommit = True
    try:
        with conn.cursor() as cursor:
            cursor.execute(script)
    finally:
        conn.close()


def _apply_migration_files(database_url: str, migration_files: list[Path]) -> None:
    conn = psycopg2.connect(database_url)
    conn.autocommit = True
    try:
        with conn.cursor() as cursor:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS ltree")
            for migration_file in migration_files:
                sql_text = filter_migration_sql(migration_file.read_text())
                if sql_text.strip():
                    cursor.execute(sql_text)
    finally:
        conn.close()


def _seed_legacy_rows(database_url: str) -> None:
    _run_sql_script(
        database_url,
        f"""
        INSERT INTO notes (
          id,
          user_id,
          title,
          body,
          parent_id,
          archived,
          inserted_at,
          updated_at
        )
        OVERRIDING SYSTEM VALUE
        VALUES
          (1, '{TEST_USER_ID}', 'Topic Reviewed', 'topic body', NULL, false, '2025-01-01', '2025-01-02'),
          (2, '{TEST_USER_ID}', 'Source Reviewed', 'source body', NULL, false, '2025-01-03', '2025-01-04'),
          (3, '{TEST_USER_ID}', 'Practice Legacy', 'practice body', 1, false, '2025-01-05', '2025-01-06'),
          (4, '{TEST_USER_ID}', 'Collision Card', 'Collision Answer', 1, false, '2025-01-07', '2025-01-08'),
          (5, '{TEST_USER_ID}', 'Collision Card', 'Collision Answer', NULL, false, '2025-01-07', '2025-01-09');

        INSERT INTO note_tags (note_id, tag)
        VALUES
          (1, 'TOPIC'),
          (2, 'SOURCE'),
          (3, 'PRACTICE'),
          (5, 'SOURCE');

        INSERT INTO reviews (
          id,
          user_id,
          note_id,
          description,
          completed_at,
          rating
        )
        OVERRIDING SYSTEM VALUE
        VALUES
          (101, '{TEST_USER_ID}', 1, 'topic-reviewed', CURRENT_DATE - 3, 'good'),
          (102, '{TEST_USER_ID}', 2, 'source-reviewed', CURRENT_DATE - 2, 'hard'),
          (103, '{TEST_USER_ID}', 4, 'collision-reviewed', CURRENT_DATE - 1, 'easy');
        """,
    )


def test_cutover_migrates_reviewed_topic_source_notes_and_uses_deterministic_type_projection(
    sync_database_url: str,
):
    migrations_dir = _migrations_dir()
    cutover_path = migrations_dir / CUTOVER_MIGRATION
    assert cutover_path.exists()

    migration_files = sorted(migrations_dir.glob("*.sql"))
    pre_cutover_files = [m for m in migration_files if m.name < CUTOVER_MIGRATION]

    _, temp_url = _create_temp_database(sync_database_url)
    temp_database_name = urlparse(temp_url).path.lstrip("/")

    try:
        _apply_migration_files(temp_url, pre_cutover_files)
        _seed_legacy_rows(temp_url)
        _apply_migration_files(temp_url, [cutover_path])

        conn = psycopg2.connect(temp_url)
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT COUNT(*) FROM reviews WHERE review_card_id IS NULL"
                )
                unresolved = cursor.fetchone()[0]
                assert unresolved == 0

                cursor.execute(
                    """
                    SELECT rc.type
                    FROM reviews r
                    JOIN review_cards rc ON rc.id = r.review_card_id
                    WHERE r.description IN ('topic-reviewed', 'source-reviewed')
                    ORDER BY r.id
                    """
                )
                reviewed_topic_source_types = [row[0] for row in cursor.fetchall()]
                assert reviewed_topic_source_types == ["practice", "practice"]

                cursor.execute(
                    """
                    SELECT rc.id
                    FROM reviews r
                    JOIN review_cards rc ON rc.id = r.review_card_id
                    WHERE r.description = 'collision-reviewed'
                    """
                )
                collision_card_id = cursor.fetchone()[0]

                cursor.execute(
                    """
                    SELECT rct.type
                    FROM review_card_types rct
                    WHERE rct.review_card_id = %s
                    """,
                    (collision_card_id,),
                )
                collision_card_types = {row[0] for row in cursor.fetchall()}
                assert collision_card_types == {"flashcard"}
        finally:
            conn.close()
    finally:
        _drop_temp_database(sync_database_url, temp_database_name)
