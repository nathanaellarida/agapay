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


class GeneratedEmbeddingTests(unittest.TestCase):
    class Array:
        def __init__(self, values):
            self.values = values

        def tolist(self):
            return self.values

    def test_invalid_generated_embeddings_are_rejected(self):
        invalid_vectors = (
            [0.0] * (ingest.EMBEDDING_DIMENSION - 1),
            [0.0] * (ingest.EMBEDDING_DIMENSION - 1) + [float("nan")],
            [0.0] * (ingest.EMBEDDING_DIMENSION - 1) + [True],
        )

        for vector in invalid_vectors:
            with self.subTest(last_value=vector[-1]):
                with self.assertRaisesRegex(ValueError, "invalid document vector"):
                    ingest.validate_generated_embedding(self.Array(vector))

    def test_valid_generated_embedding_is_normalized_to_floats(self):
        vector = [0] * ingest.EMBEDDING_DIMENSION

        result = ingest.validate_generated_embedding(self.Array(vector))

        self.assertEqual(result, [0.0] * ingest.EMBEDDING_DIMENSION)

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
