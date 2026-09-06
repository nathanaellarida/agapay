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

    def test_invalid_query_vector_is_still_rejected(self):
        with (
            patch.object(rag_chain, "get_index", return_value=()),
            patch.object(rag_chain, "get_embedding_model", return_value=self.model([float("nan")])),
        ):
            with self.assertRaisesRegex(ValueError, "invalid query vector"):
                rag_chain._retrieve("How do I register?")


if __name__ == "__main__":
    unittest.main()
