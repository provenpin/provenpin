from tabulate import tabulate


def render(rows, columns=None, tablefmt="github", **kwargs):
    if columns is None:
        return tabulate(rows, headers="keys", tablefmt=tablefmt, **kwargs)
    headers = [label for _, label in columns]
    data = [[row.get(key) for key, _ in columns] for row in rows]
    return tabulate(data, headers=headers, tablefmt=tablefmt, **kwargs)


def markdown_report(rows, columns=None, **kwargs):
    return render(rows, columns, tablefmt="github", **kwargs)


def grid_report(rows, columns=None, **kwargs):
    return render(rows, columns, tablefmt="grid", **kwargs)
