import unittest
from unittest.mock import Mock, patch

import main


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
