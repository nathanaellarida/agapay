import unittest
from unittest.mock import Mock, patch

import main
from pydantic import ValidationError


class QueryRequestTests(unittest.TestCase):
    def test_unknown_request_fields_are_rejected(self):
        with self.assertRaisesRegex(ValidationError, "Extra inputs are not permitted"):
            main.QueryRequest(
                question="How do I register?",
                person="online",
            )

    def test_question_length_is_checked_after_trimming(self):
        request = main.QueryRequest(question="ok" + (" " * 2000))

        self.assertEqual(request.question, "ok")

    def test_meaningful_question_still_respects_maximum_length(self):
        with self.assertRaises(ValidationError):
            main.QueryRequest(question="x" * 2001)

    def test_invisible_characters_do_not_satisfy_the_minimum_length(self):
        for question in ("\u200b\u200b", "A\u200b", "A\x00"):
            with self.subTest(question=repr(question)):
                with self.assertRaisesRegex(ValidationError, "visible characters"):
                    main.QueryRequest(question=question)

        request = main.QueryRequest(question="A\nB")
        self.assertEqual(request.question, "A\nB")


class QueryApiTests(unittest.TestCase):
    def test_temporary_failures_include_retry_guidance(self):
        request = main.QueryRequest(question="How do I register?")

        with patch.object(
            main,
            "answer_question",
            side_effect=RuntimeError("provider unavailable"),
        ):
            with self.assertRaises(main.HTTPException) as raised:
                main.query(request)

        self.assertEqual(raised.exception.status_code, 503)
        self.assertEqual(
            raised.exception.headers,
            {"Retry-After": str(main.RETRY_AFTER_SECONDS)},
        )


class CorsConfigurationTests(unittest.TestCase):
    def test_origins_are_normalized_and_deduplicated(self):
        self.assertEqual(
            main.parse_cors_origins(
                " https://founder.example/ ,http://localhost:5173,https://founder.example "
            ),
            ["https://founder.example", "http://localhost:5173"],
        )

    def test_malformed_origins_are_rejected(self):
        invalid_values = (
            "",
            "*",
            "founder.example",
            "ftp://founder.example",
            "https://user:secret@founder.example",
            "https://founder.example/path",
            "https://founder.example?preview=true",
            "https://founder.example#preview",
            "https://founder example",
            "https://founder.example:invalid",
        )

        for value in invalid_values:
            with self.subTest(value=value):
                with self.assertRaisesRegex(ValueError, "CORS_ORIGINS"):
                    main.parse_cors_origins(value)


class LibraryApiTests(unittest.TestCase):
    def test_invalid_document_timestamp_uses_a_safe_fallback(self):
        self.assertEqual(main.format_last_updated(0), "1970-01-01")

        invalid_datetime = Mock()
        invalid_datetime.fromtimestamp.side_effect = OSError("timestamp out of range")

        with patch.object(main, "datetime", invalid_datetime):
            self.assertEqual(main.format_last_updated(0), "Unknown")

    def test_unreadable_document_is_skipped(self):
        blocked_path = Mock()
        blocked_path.name = "Blocked.txt"
        blocked_path.suffix = ".txt"
        blocked_path.is_file.return_value = True
        blocked_path.is_symlink.return_value = False
        blocked_path.stat.side_effect = PermissionError("file is unreadable")

        readable_path = Mock()
        readable_path.name = "Guide.txt"
        readable_path.suffix = ".txt"
        readable_path.is_file.return_value = True
        readable_path.is_symlink.return_value = False
        readable_path.stat.return_value = Mock(st_mtime=0, st_mtime_ns=0)

        data_dir = Mock()
        data_dir.is_dir.return_value = True
        data_dir.iterdir.return_value = [blocked_path, readable_path]

        with (
            patch.object(main, "DATA_DIR", data_dir),
            patch.object(main, "get_index_state", return_value=(frozenset(), -1)),
        ):
            documents = main.library()

        self.assertEqual(
            [document.filename for document in documents],
            ["Guide.txt"],
        )

    def test_unreadable_data_directory_returns_an_empty_library(self):
        data_dir = Mock()
        data_dir.is_dir.return_value = True
        data_dir.iterdir.side_effect = PermissionError("directory is unreadable")

        with (
            patch.object(main, "DATA_DIR", data_dir),
            patch.object(main, "get_index_state", return_value=(frozenset(), -1)),
        ):
            self.assertEqual(main.library(), [])


if __name__ == "__main__":
    unittest.main()
