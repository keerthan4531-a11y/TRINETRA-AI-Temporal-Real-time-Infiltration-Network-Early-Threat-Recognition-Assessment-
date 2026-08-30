import pytest
import torch
from model.world_model import NetworkWorldModel
from model.rollout import ForwardRolloutEngine


def test_world_model_forward_pass_dimensions():
    batch_size = 4
    seq_len = 10
    input_dim = 22
    model = NetworkWorldModel(input_dim=input_dim, hidden_dim=64, num_layers=2)

    x = torch.randn(batch_size, seq_len, input_dim)
    next_state, infil_prob, stage_logits = model(x)

    assert next_state.shape == (batch_size, input_dim)
    assert infil_prob.shape == (batch_size, 1)
    assert stage_logits.shape == (batch_size, 5)


def test_forward_rollout_k_steps():
    seq_len = 10
    input_dim = 22
    k_steps = 5
    model = NetworkWorldModel(input_dim=input_dim, hidden_dim=32, num_layers=1)
    rollout_engine = ForwardRolloutEngine(model, k_steps=k_steps)

    seq = torch.randn(seq_len, input_dim).numpy()
    res = rollout_engine.rollout(seq)

    assert len(res["future_probabilities"]) == k_steps
    assert len(res["future_stages"]) == k_steps
    assert res["trajectory_states"].shape == (k_steps, input_dim)
