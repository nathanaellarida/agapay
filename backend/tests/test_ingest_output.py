import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

import ingest


class IndexOutputLimitTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.index_path = Path(self.directory.name) / "index.json"
        self.path_patch = patch.object(ingest, "INDEX_PATH", self.index_path)
        self.path_patch.start()
        self.addCleanup(self.path_patch.stop)
        self.entries = [{"source": "guide.txt", "text": "Café ₱", "embedding": [0.5]}]

    def serialized(self):
        return json.dumps({
            "schema_version": ingest.INDEX_SCHEMA_VERSION,
            "model": {
                "name": ingest.EMBEDDING_MODEL,
                "revision": ingest.EMBEDDING_MODEL_REVISION,
            },
            "entries": self.entries,
        }, ensure_ascii=False, allow_nan=False, separators=(",", ":")).encode("utf-8")

    def test_output_at_byte_limit_is_published(self):
        expected = self.serialized()
        with patch.object(ingest, "MAX_INDEX_BYTES", len(expected)):
            ingest.write_index(self.entries)
        self.assertEqual(self.index_path.read_bytes(), expected)
        self.assertEqual(list(self.index_path.parent.iterdir()), [self.index_path])

    def test_missing_configured_parent_directories_are_created(self):
        nested_index_path = (
            Path(self.directory.name) / "cache" / "indexes" / "index.json"
        )

        with patch.object(ingest, "INDEX_PATH", nested_index_path):
            ingest.write_index(self.entries)

        self.assertEqual(nested_index_path.read_bytes(), self.serialized())
        self.assertEqual(list(nested_index_path.parent.iterdir()), [nested_index_path])

    def test_output_and_directory_are_flushed_around_publication(self):
        if not hasattr(ingest.os, "O_DIRECTORY"):
            self.skipTest("directory synchronization is not supported")

        events = []
        fsync = ingest.os.fsync
        open_directory = ingest.os.open
        close_directory = ingest.os.close
        replace = ingest.os.replace

        def record_fsync(file_descriptor):
            events.append("fsync")
            fsync(file_descriptor)

        def record_replace(source, destination):
            events.append("replace")
            replace(source, destination)

        def record_open(path, flags):
            events.append("open-directory")
            return open_directory(path, flags)

        def record_close(file_descriptor):
            events.append("close-directory")
            close_directory(file_descriptor)

        with (
            patch.object(ingest.os, "fsync", side_effect=record_fsync),
            patch.object(ingest.os, "open", side_effect=record_open),
            patch.object(ingest.os, "close", side_effect=record_close),
            patch.object(ingest.os, "replace", side_effect=record_replace),
        ):
            ingest.write_index(self.entries)

        self.assertEqual(
            events,
            ["fsync", "replace", "open-directory", "fsync", "close-directory"],
        )
        self.assertEqual(self.index_path.read_bytes(), self.serialized())

    def test_oversized_output_preserves_previous_index(self):
        self.index_path.write_bytes(b"previous index")
        with patch.object(ingest, "MAX_INDEX_BYTES", len(self.serialized()) - 1):
            with self.assertRaisesRegex(ValueError, "size limit"):
                ingest.write_index(self.entries)
        self.assertEqual(self.index_path.read_bytes(), b"previous index")
        self.assertEqual(list(self.index_path.parent.iterdir()), [self.index_path])

    def test_limit_counts_utf8_bytes_not_characters(self):
        character_count = len(self.serialized().decode("utf-8"))
        self.assertGreater(len(self.serialized()), character_count)
        with patch.object(ingest, "MAX_INDEX_BYTES", character_count):
            with self.assertRaisesRegex(ValueError, "size limit"):
                ingest.write_index(self.entries)
        self.assertEqual(list(self.index_path.parent.iterdir()), [])


class DocumentInputTests(unittest.TestCase):
    def test_invalid_utf8_identifies_the_source_document(self):
        with tempfile.TemporaryDirectory() as directory:
            data_dir = Path(directory)
            (data_dir / "Broken.txt").write_bytes(b"Registration \xff guidance")

            with patch.object(ingest, "DATA_DIR", data_dir):
                with self.assertRaisesRegex(
                    ValueError,
                    r"not valid UTF-8: Broken\.txt",
                ):
                    ingest.load_documents()

    def test_nul_characters_identify_the_source_document(self):
        with tempfile.TemporaryDirectory() as directory:
            data_dir = Path(directory)
            (data_dir / "Misencoded.txt").write_bytes(
                b"R\x00e\x00g\x00i\x00s\x00t\x00r\x00a\x00t\x00i\x00o\x00n\x00"
            )

            with patch.object(ingest, "DATA_DIR", data_dir):
                with self.assertRaisesRegex(
                    ValueError,
                    r"NUL characters: Misencoded\.txt",
                ):
                    ingest.load_documents()

    def test_case_insensitive_duplicate_filenames_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            data_dir = Path(directory)
            (data_dir / "Guide.txt").write_text(
                "Registration guidance", encoding="utf-8"
            )
            (data_dir / "guide.TXT").write_text(
                "Funding guidance", encoding="utf-8"
            )

            with patch.object(ingest, "DATA_DIR", data_dir):
                with self.assertRaisesRegex(ValueError, "unique.*letter case"):
                    ingest.load_documents()

    def test_unicode_equivalent_duplicate_filenames_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            data_dir = Path(directory)
            (data_dir / "Café.txt").write_text(
                "Registration guidance", encoding="utf-8"
            )
            (data_dir / "Cafe\u0301.txt").write_text(
                "Funding guidance", encoding="utf-8"
            )

            with patch.object(ingest, "DATA_DIR", data_dir):
                with self.assertRaisesRegex(ValueError, "Unicode normalization"):
                    ingest.load_documents()


class TextSplittingTests(unittest.TestCase):
    def test_overlapping_chunks_start_and_end_at_word_boundaries(self):
        chunks = ingest.split_text("guidance " * 220)

        self.assertGreater(len(chunks), 1)
        self.assertTrue(all(chunk.startswith("guidance") for chunk in chunks))
        self.assertTrue(all(chunk.endswith("guidance") for chunk in chunks))
        self.assertTrue(all(len(chunk) <= ingest.CHUNK_SIZE for chunk in chunks))


class GeneratedEmbeddingTests(unittest.TestCase):
    class Array:
        def __init__(self, values):
            self.values = values

        def tolist(self):
            return self.values

    def test_invalid_generated_embeddings_are_rejected(self):
        invalid_vectors = (
            [0.0] * (ingest.EMBEDDING_DIMENSION - 1),
            [0.0] * ingest.EMBEDDING_DIMENSION,
            [0.5] + [0.0] * (ingest.EMBEDDING_DIMENSION - 1),
            [0.0] * (ingest.EMBEDDING_DIMENSION - 1) + [float("nan")],
            [0.0] * (ingest.EMBEDDING_DIMENSION - 1) + [True],
            [0.0] * (ingest.EMBEDDING_DIMENSION - 1) + [10**400],
            [0.0] * (ingest.EMBEDDING_DIMENSION - 1) + [1.01],
            [0.0] * (ingest.EMBEDDING_DIMENSION - 1) + [-1.01],
        )

        for vector in invalid_vectors:
            with self.subTest(last_value=vector[-1]):
                with self.assertRaisesRegex(ValueError, "invalid document vector"):
                    ingest.validate_generated_embedding(self.Array(vector))

    def test_valid_generated_embedding_is_normalized_to_floats(self):
        vector = [1] + [0] * (ingest.EMBEDDING_DIMENSION - 1)

        result = ingest.validate_generated_embedding(self.Array(vector))

        self.assertEqual(
            result,
            [1.0] + [0.0] * (ingest.EMBEDDING_DIMENSION - 1),
        )

    def test_build_entries_rejects_invalid_model_output(self):
        model = Mock()
        model.encode.return_value = [
            self.Array([0.0] * (ingest.EMBEDDING_DIMENSION - 1))
        ]

        with patch.object(ingest, "get_embedding_model", return_value=model):
            with self.assertRaisesRegex(ValueError, "invalid document vector"):
                ingest.build_entries([("guide.txt", "Registration guidance")])


if __name__ == "__main__":
    unittest.main()
