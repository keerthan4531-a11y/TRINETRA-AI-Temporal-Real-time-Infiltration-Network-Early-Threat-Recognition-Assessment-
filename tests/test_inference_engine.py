import pytest
import numpy as np
from inference.engine import InferenceEngine


def test_inference_engine_fails_on_empty():
    engine = InferenceEngine()
    with pytest.raises(ValueError):
        engine.process_window(np.array([]))


def test_inference_engine_sequence_warmup():
    engine = InferenceEngine()
    engine.reset_buffer()
    dummy_vec = np.ones(engine.input_dim)

    # Push fewer than seq_len
    for i in range(engine.seq_len - 1):
        res = engine.process_window(dummy_vec, timestamp_epoch=float(i))
        assert res is None # Warming up buffer

    # On reaching seq_len, generates real prediction
    res = engine.process_window(dummy_vec, timestamp_epoch=float(engine.seq_len))
    assert res is not None
    assert "current_infil_probability" in res
    assert "future_trajectory" in res
    assert len(res["future_trajectory"]) == engine.k_steps
    assert "top_driving_features" in res
