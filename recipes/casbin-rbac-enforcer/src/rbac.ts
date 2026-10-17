import { newEnforcer, newModelFromString, type Enforcer } from "casbin";

export const RBAC_MODEL = `
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act, eft

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow)) && !some(where (p.eft == deny))

[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act
`;

export const ALLOW = "allow";
export const DENY = "deny";

export async function createEnforcer(): Promise<Enforcer> {
  const model = newModelFromString(RBAC_MODEL);
  const enforcer = await newEnforcer(model);

  await enforcer.addPolicy("alice", "data1", "read", ALLOW);
  await enforcer.addPolicy("alice", "data1", "write", ALLOW);
  await enforcer.addPolicy("data_admin", "data2", "read", ALLOW);
  await enforcer.addPolicy("data_admin", "data2", "write", ALLOW);
  await enforcer.addPolicy("banned", "data2", "read", DENY);

  await enforcer.addGroupingPolicy("bob", "data_admin");
  await enforcer.addGroupingPolicy("carol", "data_admin");
  await enforcer.addGroupingPolicy("dave", "carol");
  await enforcer.addGroupingPolicy("eve", "banned");

  return enforcer;
}

export async function can(
  enforcer: Enforcer,
  sub: string,
  obj: string,
  act: string,
): Promise<boolean> {
  return enforcer.enforce(sub, obj, act);
}
