from report import grid_report, markdown_report, render

COLUMNS = [("name", "Repo"), ("stars", "Stars"), ("lang", "Lang")]
ROWS = [
    {"name": "alpha", "stars": 12, "lang": "py"},
    {"name": "beta", "stars": 3},
]


def test_markdown_projects_dict_rows_in_declared_order():
    out = markdown_report(ROWS, COLUMNS, missingval="-")
    assert out.splitlines() == [
        "| Repo   |   Stars | Lang   |",
        "|--------|---------|--------|",
        "| alpha  |      12 | py     |",
        "| beta   |       3 | -      |",
    ]


def test_grid_uses_box_drawing():
    out = grid_report(ROWS, [("name", "Repo")], missingval="-")
    assert out.splitlines()[0] == "+--------+"
    assert "| alpha  |" in out
    assert "| beta   |" in out


def test_columns_not_supplied_falls_back_to_keys_union():
    out = render([{"b": 1}, {"a": 2}, {"c": 3}])
    assert out.splitlines()[0] == "|   b |   a |   c |"
    assert out.splitlines()[2] == "|   1 |     |     |"


def test_ragged_rows_get_missingval():
    out = markdown_report(ROWS, COLUMNS, missingval="n/a")
    assert "| beta   |       3 | n/a    |" in out


def test_disable_numparse_changes_alignment_of_numeric_strings():
    parsed = markdown_report([{"id": "007"}], [("id", "ID")]).splitlines()
    raw = markdown_report([{"id": "007"}], [("id", "ID")], disable_numparse=True).splitlines()
    assert parsed[0] == "|   ID |" and parsed[2] == "|  007 |"
    assert raw[0] == "| ID   |" and raw[2] == "| 007  |"


def test_floatfmt_rounds_numeric_cells():
    out = markdown_report([{"ratio": 3.14159}], [("ratio", "Ratio")], floatfmt=".2f")
    assert out.splitlines()[2] == "|    3.14 |"
