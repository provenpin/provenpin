import pluggy

from hookspecs import ProcessorSpec, project_name


def build_pm() -> pluggy.PluginManager:
    pm = pluggy.PluginManager(project_name)
    pm.add_hookspecs(ProcessorSpec)
    return pm


def process(pm: pluggy.PluginManager, record: dict) -> dict:
    pm.hook.enrich(record=record)
    record["score"] = pm.hook.score(record=record)
    pm.hook.audit(event="processed", payload=record)
    return record
