import asyncio
import unittest
from unittest.mock import Mock, patch

import main
from pydantic import ValidationError
from starlette.requests import Request
from starlette.responses import JSONResponse


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
        for question in ("\u200b\u200b", "A\u200b"):
            with self.subTest(question=repr(question)):
                with self.assertRaisesRegex(ValidationError, "visible characters"):
                    main.QueryRequest(question=question)

    def test_control_characters_are_rejected_without_blocking_layout_whitespace(self):
        for question in ("A\x00B", "A\x07B", "A\x85B"):
            with self.subTest(question=repr(question)):
                with self.assertRaisesRegex(ValidationError, "control characters"):
                    main.QueryRequest(question=question)

        for question in ("A\nB", "A\r\nB", "A\tB"):
            with self.subTest(question=repr(question)):
                request = main.QueryRequest(question=question)
                self.assertEqual(request.question, question)


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


class QueryRequestBodyLimitTests(unittest.TestCase):
    @staticmethod
    def request(chunks, content_length=None):
        messages = [
            {
                "type": "http.request",
                "body": chunk,
                "more_body": index < len(chunks) - 1,
            }
            for index, chunk in enumerate(chunks)
        ]

        async def receive():
            return messages.pop(0)

        headers = []
        if content_length is not None:
            headers.append((b"content-length", str(content_length).encode("ascii")))
        return Request(
            {
                "type": "http",
                "method": "POST",
                "scheme": "http",
                "path": "/query",
                "raw_path": b"/query",
                "query_string": b"",
                "headers": headers,
                "client": ("127.0.0.1", 1),
                "server": ("127.0.0.1", 8000),
            },
            receive,
        )

    def test_valid_query_body_is_preserved_for_json_parsing(self):
        payload = b'{"question":"How do I register?","persona":"tech"}'
        request = self.request([payload[:20], payload[20:]])
        received = None

        async def call_next(limited_request):
            nonlocal received
            received = await limited_request.body()
            return JSONResponse({"ok": True})

        response = asyncio.run(main.limit_query_request_body(request, call_next))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(received, payload)

    def test_declared_oversized_query_body_is_rejected_before_reading(self):
        request = self.request(
            [b"not read"],
            content_length=main.MAX_QUERY_BODY_BYTES + 1,
        )
        call_next = Mock()

        response = asyncio.run(main.limit_query_request_body(request, call_next))

        self.assertEqual(response.status_code, 413)
        call_next.assert_not_called()

    def test_chunked_oversized_query_body_is_rejected(self):
        request = self.request(
            [b"a" * main.MAX_QUERY_BODY_BYTES, b"b"],
        )
        call_next = Mock()

        response = asyncio.run(main.limit_query_request_body(request, call_next))

        self.assertEqual(response.status_code, 413)
        call_next.assert_not_called()


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

    def test_invalid_source_names_are_not_exposed(self):
        invalid_path = Mock()
        invalid_path.name = "Unsafe\nGuide.txt"
        invalid_path.suffix = ".txt"
        invalid_path.is_file.return_value = True
        invalid_path.is_symlink.return_value = False

        readable_path = Mock()
        readable_path.name = "Guide.txt"
        readable_path.suffix = ".txt"
        readable_path.is_file.return_value = True
        readable_path.is_symlink.return_value = False
        readable_path.stat.return_value = Mock(st_mtime=0, st_mtime_ns=0)

        data_dir = Mock()
        data_dir.is_dir.return_value = True
        data_dir.iterdir.return_value = [invalid_path, readable_path]

        with (
            patch.object(main, "DATA_DIR", data_dir),
            patch.object(main, "get_index_state", return_value=(frozenset(), -1)),
        ):
            documents = main.library()

        self.assertEqual(
            [document.filename for document in documents],
            ["Guide.txt"],
        )
        invalid_path.stat.assert_not_called()

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
