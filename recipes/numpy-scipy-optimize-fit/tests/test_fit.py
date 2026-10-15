import numpy as np
import pytest
from scipy import stats

from fit import fit_curve, minimize_bounded, model

TRUE = np.array([2.5, 1.3, 0.5])


@pytest.fixture
def data():
    # Seeded Generator, not the global np.random.seed, so results are reproducible
    rng = np.random.default_rng(42)
    x = np.linspace(0, 5, 200)
    y = model(x, *TRUE) + rng.normal(0, 0.01, x.size)
    return x, y


def test_curve_fit_recovers_params(data):
    x, y = data
    params, _ = fit_curve(x, y)
    np.testing.assert_allclose(params, TRUE, rtol=0.05)


def test_std_errors_bracket_truth(data):
    x, y = data
    params, perr = fit_curve(x, y)
    assert np.all(perr > 0)
    assert np.all(np.abs(params - TRUE) < 5 * perr)


def test_bounds_are_enforced(data):
    x, y = data
    # true b = 1.3 lies outside the upper bound, so the fit must pin to 1.0
    bounds = ((0, 0, -np.inf), (np.inf, 1.0, np.inf))
    params, _ = fit_curve(x, y, bounds=bounds)
    assert params[1] <= 1.0 + 1e-12
    assert params[1] == pytest.approx(1.0, abs=1e-3)


def test_p0_outside_bounds_raises(data):
    x, y = data
    # curve_fit rejects an infeasible starting point; a=-1 violates the lower bound 0
    with pytest.raises(ValueError):
        fit_curve(x, y, p0=(-1.0, 1.0, 0.0))


def test_minimize_stops_at_bound():
    res = minimize_bounded(lambda x: (x[0] - 5) ** 2, x0=[1.0], bounds=[(0, 3)])
    np.testing.assert_allclose(res, [3.0], atol=1e-4)


def test_residuals_look_gaussian(data):
    x, y = data
    params, _ = fit_curve(x, y)
    resid = y - model(x, *params)
    loc, scale = stats.norm.fit(resid)
    # norm.fit is the MLE (ddof=0), so it must match np.std with default ddof
    np.testing.assert_allclose(scale, np.std(resid), rtol=1e-6)
    assert abs(loc) < 1e-3
    assert stats.shapiro(resid).pvalue > 0.001
