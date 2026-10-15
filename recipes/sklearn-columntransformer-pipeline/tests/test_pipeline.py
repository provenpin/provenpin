import joblib
import pandas as pd
import pytest
from sklearn.model_selection import GridSearchCV
from sklearn.preprocessing import OneHotEncoder

from pipeline import build_pipeline, search

@pytest.fixture
def data():
    X = pd.DataFrame({
        "age": [22, 25, 47, 52, 46, 56, 23, 28, 49, 60, 31, 58],
        "income": [20, 25, 80, 90, 70, 95, 22, 30, 85, 100, 40, 88],
        "city": ["ny", "sf", "ny", "sf", "ny", "sf", "ny", "sf", "ny", "sf", "ny", "sf"],
    })
    y = [0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1]
    return X, y

def test_default_encoder_rejects_unseen_category():
    enc = OneHotEncoder(sparse_output=False).fit(pd.DataFrame({"city": ["ny", "sf"]}))
    with pytest.raises(ValueError, match="unknown categories"):
        enc.transform(pd.DataFrame({"city": ["tokyo"]}))

def test_pipeline_tolerates_unseen_city(data):
    X, y = data
    model = build_pipeline().fit(X, y)
    X_new = X.head(2).assign(city=["tokyo", "ny"])
    assert model.predict(X_new).shape == (2,)

def test_set_output_keeps_dataframe_names(data):
    X, _ = data
    pre = build_pipeline().named_steps["pre"]
    out = pre.fit_transform(X)
    assert isinstance(out, pd.DataFrame)
    assert list(out.columns) == ["num__age", "num__income", "cat__city_ny", "cat__city_sf"]
    assert out.index.equals(X.index)

def test_grid_search_needs_step_prefixed_keys(data):
    X, y = data
    with pytest.raises(ValueError):
        build_pipeline().set_params(C=1.0)
    gs = search(X, y)
    assert isinstance(gs, GridSearchCV)
    assert "clf__C" in gs.best_params_

def test_joblib_roundtrip(data, tmp_path):
    X, y = data
    model = search(X, y).best_estimator_
    path = tmp_path / "model.joblib"
    joblib.dump(model, path)
    loaded = joblib.load(path)
    assert (loaded.predict(X) == model.predict(X)).all()
