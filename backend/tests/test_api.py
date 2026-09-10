import unittest
from unittest.mock import Mock, patch

import main
from pydantic import ValidationError


class QueryRequestTests(unittest.TestCase):
    def test_question_length_is_checked_after_trimming(self):
        request = main.QueryRequest(question="ok" + (" " * 2000))

        self.assertEqual(request.question, "ok")

    def test_meaningful_question_still_respects_maximum_length(self):
        with self.assertRaises(ValidationError):
            main.QueryRequest(question="x" * 2001)


class LibraryApiTests(unittest.TestCase):
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
