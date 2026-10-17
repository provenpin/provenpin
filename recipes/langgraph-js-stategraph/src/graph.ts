import {
  Annotation,
  END,
  MemorySaver,
  START,
  StateGraph,
} from "@langchain/langgraph";

export const GraphState = Annotation.Root({
  input: Annotation<string>({
    reducer: (_left, right) => right,
    default: () => "",
  }),
  steps: Annotation<string[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  route: Annotation<string>({
    reducer: (_left, right) => right,
    default: () => "",
  }),
});

export type GraphStateType = typeof GraphState.State;

export function classify(state: GraphStateType): Partial<GraphStateType> {
  const route = state.input.length % 2 === 0 ? "even" : "odd";
  return { steps: [`classify:${state.input}=${route}`], route };
}

export function handle(state: GraphStateType): Partial<GraphStateType> {
  return { steps: [`handle:${state.input}`] };
}

export function buildGraph(checkpointer: MemorySaver = new MemorySaver()) {
  return new StateGraph(GraphState)
    .addNode("classify", classify)
    .addNode("handle", handle)
    .addEdge(START, "classify")
    .addConditionalEdges("classify", (state: GraphStateType) => state.route, {
      even: "handle",
      odd: END,
    })
    .addEdge("handle", END)
    .compile({ checkpointer });
}
