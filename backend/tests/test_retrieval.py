import unittest
from unittest.mock import Mock, patch

import rag_chain


class SourceSnippetTests(unittest.TestCase):
    def test_short_snippets_normalize_whitespace(self):
        self.assertEqual(
            rag_chain._source_snippet("  Apply\n at   the barangay.  "),
            "Apply at the barangay.",
        )

    def test_long_snippets_end_at_a_complete_word(self):
        result = rag_chain._source_snippet("guidance " * 40)
        expected = ("guidance " * 26).strip() + "…"

        self.assertEqual(result, expected)
        self.assertLessEqual(len(result), 241)


class RetrievalTests(unittest.TestCase):
    def model(self, vector):
        model = Mock()
        model.encode.return_value.tolist.return_value = vector
        return model

    def test_indexed_sources_are_deduplicated(self):
        entries = (
            {"source": "guide.txt"},
            {"source": "guide.txt"},
            {"source": "faq.txt"},
        )

        with patch.object(rag_chain, "get_index", return_value=entries):
            result = rag_chain.get_indexed_sources()

        self.assertEqual(result, frozenset({"guide.txt", "faq.txt"}))

    def test_index_state_uses_the_validated_index_timestamp(self):
        signature = (1, 2, 123_456, 4)
        entries = (
            {"source": "guide.txt"},
            {"source": "guide.txt"},
            {"source": "faq.txt"},
        )

        with (
            patch.object(rag_chain, "_index_signature", return_value=signature),
            patch.object(rag_chain, "_load_index", return_value=entries) as load_index,
        ):
            result = rag_chain.get_index_state()

        self.assertEqual(result, (frozenset({"guide.txt", "faq.txt"}), 123_456))
        load_index.assert_called_once_with(signature)

    def test_source_is_current_only_when_indexed_after_its_last_edit(self):
        index_state = (frozenset({"guide.txt"}), 200)

        self.assertTrue(rag_chain.is_source_current("guide.txt", 200, index_state))
        self.assertFalse(rag_chain.is_source_current("guide.txt", 201, index_state))
        self.assertFalse(rag_chain.is_source_current("missing.txt", 100, index_state))

    def test_unsafe_index_source_names_are_rejected(self):
        invalid_sources = (
            ".",
            "..",
            "../guide.txt",
            "folder/guide.txt",
            "folder\\guide.txt",
            "guide\n.txt",
            " guide.txt",
            "guide.txt ",
            "a" * (rag_chain.MAX_SOURCE_NAME_LENGTH + 1),
        )
        entry = {
            "text": "Registration guidance",
            "embedding": [0.0] * rag_chain.EMBEDDING_DIMENSION,
        }

        for source in invalid_sources:
            with self.subTest(source=source):
                with self.assertRaisesRegex(ValueError, "Source name is invalid"):
                    rag_chain._validated_entry({**entry, "source": source}, None)

        validated, _ = rag_chain._validated_entry(
            {**entry, "source": "DTI_Gabay_Ñ.txt"}, None
        )
        self.assertEqual(validated["source"], "DTI_Gabay_Ñ.txt")

    def test_index_errors_skip_model_loading(self):
        for error in (FileNotFoundError("missing index"), ValueError("invalid index")):
            with self.subTest(error=type(error).__name__):
                model = self.model([0.0] * rag_chain.EMBEDDING_DIMENSION)
                with (
                    patch.object(rag_chain, "get_index", side_effect=error),
                    patch.object(rag_chain, "get_embedding_model", return_value=model) as load_model,
                ):
                    with self.assertRaises(type(error)) as raised:
                        rag_chain._retrieve("How do I register?")
                    self.assertIs(raised.exception, error)
                    load_model.assert_not_called()
                    model.encode.assert_not_called()

    def test_valid_index_keeps_ranking_and_limit(self):
        dimension = rag_chain.EMBEDDING_DIMENSION
        model = self.model([1.0] + [0.0] * (dimension - 1))
        entries = tuple(
            {"source": name, "text": name, "embedding": [score] + [0.0] * (dimension - 1)}
            for name, score in (("low.txt", 0.1), ("high.txt", 0.9), ("mid.txt", 0.5))
        )
        with (
            patch.object(rag_chain, "get_index", return_value=entries),
            patch.object(rag_chain, "get_embedding_model", return_value=model),
        ):
            result = rag_chain._retrieve("How do I register?", limit=2)
        self.assertEqual([entry["source"] for entry in result], ["high.txt", "mid.txt"])
        model.encode.assert_called_once_with(
            "How do I register?", normalize_embeddings=True, convert_to_numpy=True,
        )

    def test_invalid_query_values_are_rejected(self):
        for invalid_value in (float("nan"), 10**400, 1.01, -1.01):
            vector = [0.0] * (rag_chain.EMBEDDING_DIMENSION - 1) + [invalid_value]
            with self.subTest(invalid_value=invalid_value):
                with (
                    patch.object(rag_chain, "get_index", return_value=()),
                    patch.object(
                        rag_chain,
                        "get_embedding_model",
                        return_value=self.model(vector),
                    ),
                ):
                    with self.assertRaisesRegex(ValueError, "invalid query vector"):
                        rag_chain._retrieve("How do I register?")

    def test_overflowing_index_values_are_rejected(self):
        entry = {
            "source": "guide.txt",
            "text": "Registration guidance",
            "embedding": [0.0] * (rag_chain.EMBEDDING_DIMENSION - 1) + [10**400],
        }

        with self.assertRaisesRegex(ValueError, "invalid embedding value"):
            rag_chain._validated_entry(entry, None)

    def test_out_of_range_index_values_are_rejected(self):
        entry = {
            "source": "guide.txt",
            "text": "Registration guidance",
            "embedding": [0.0] * (rag_chain.EMBEDDING_DIMENSION - 1) + [1.01],
        }

        with self.assertRaisesRegex(ValueError, "invalid embedding value"):
            rag_chain._validated_entry(entry, None)


if __name__ == "__main__":
    unittest.main()
