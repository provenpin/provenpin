import numpy as np
from scipy import optimize


def model(x, a, b, c):
    return a * np.exp(-b * x) + c


def fit_curve(x, y, p0=(1.0, 1.0, 0.0), bounds=((0, 0, -np.inf), (np.inf, np.inf, np.inf))):
    """Return fitted parameters and 1-sigma standard errors."""
    params, pcov = optimize.curve_fit(model, x, y, p0=p0, bounds=bounds)
    # pcov is the covariance matrix; standard errors are the sqrt of its diagonal
    return params, np.sqrt(np.diag(pcov))


def minimize_bounded(fun, x0, bounds):
    # bounds: sequence of (low, high) pairs; use None for an open side
    res = optimize.minimize(fun, x0, method="L-BFGS-B", bounds=bounds)
    if not res.success:
        raise RuntimeError(res.message)
    return res.x
