from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

NUM = ["age", "income"]
CAT = ["city"]

def build_pipeline() -> Pipeline:
    pre = ColumnTransformer(
        [
            ("num", StandardScaler(), NUM),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CAT),
        ]
    ).set_output(transform="pandas")
    return Pipeline([("pre", pre), ("clf", LogisticRegression(max_iter=1000))])

def search(X, y) -> GridSearchCV:
    # preprocessing is refit inside each CV fold, so no leakage from validation rows
    gs = GridSearchCV(build_pipeline(), {"clf__C": [0.1, 1.0, 10.0]}, cv=3)
    return gs.fit(X, y)
