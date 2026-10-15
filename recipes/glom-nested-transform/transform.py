from glom import Assign, Coalesce, Flatten, Iter, S, T, glom

REPO_SPEC = {
    "repo_id": "id",
    "name": "name",
    "owner": Coalesce("owner.login", default="unknown"),
    "email": Coalesce("owner.contact.email", default=""),
    "stars": Coalesce("metrics.stars", default=0),
    "forks": Coalesce("metrics.forks", default=0),
}


def flatten_repos(payload):
    # Iter yields a generator, so wrap it in list() to get real records back.
    return glom(payload, (Iter(REPO_SPEC), list))


def explode_tags(payload):
    # Assign(S["repo"], T) stashes the parent repo in scope so the inner Iter
    # over "tags" can still read the parent's id.
    spec = (
        Iter(
            (
                Assign(S["repo"], T),
                ("tags", Iter({"repo_id": S.repo["id"], "tag": T})),
            )
        ),
        Flatten(),
        list,
    )
    return glom(payload, spec)
