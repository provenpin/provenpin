from datetime import datetime

from cattrs import Converter
from cattrs.gen import make_dict_structure_fn, make_dict_unstructure_fn, override

from models import Job


def make_converter() -> Converter:
    c = Converter()
    c.register_unstructure_hook(datetime, datetime.isoformat)
    c.register_structure_hook(datetime, lambda s, _: datetime.fromisoformat(s))

    # wire name "jobId" <-> attribute "job_id", applied in both directions
    renames = {"job_id": override(rename="jobId")}
    c.register_structure_hook(Job, make_dict_structure_fn(Job, c, **renames))
    c.register_unstructure_hook(Job, make_dict_unstructure_fn(Job, c, **renames))
    return c
