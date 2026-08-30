import pytest
import numpy as np
import pandas as pd
from features.flow_features import FlowFeatureExtractor
from features.windowing import TimeWindowAggregator


def test_flow_feature_extractor_empty_fails_loudly():
    extractor = FlowFeatureExtractor()
    with pytest.raises(ValueError):
        extractor.extract_from_dataframe(pd.DataFrame())


def test_flow_feature_extractor_valid_structure():
    extractor = FlowFeatureExtractor()
    sample_data = {
        "flow_duration": [100000, 200000],
        "tot_fwd_pkts": [10, 20],
        "tot_bwd_pkts": [5, 10],
        "totlen_fwd_pkts": [1500, 3000],
        "totlen_bwd_pkts": [500, 1000],
        "pkt_len_mean": [100.0, 150.0],
        "flow_iat_mean": [500.0, 600.0],
        "dst_port": [80, 443]
    }
    df = pd.DataFrame(sample_data)
    res = extractor.extract_from_dataframe(df)
    assert len(res) == 2
    assert "flow_duration_ms" in res.columns
    assert "fwd_bwd_byte_ratio" in res.columns
