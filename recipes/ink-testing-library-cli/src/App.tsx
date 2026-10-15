import { useState, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";

export type Task = { id: string; title: string };

/** Interactive checklist: arrows move, space toggles, enter submits, q quits. */
export function Checklist({ tasks, onSubmit }: { tasks: Task[]; onSubmit: (done: string[]) => void }) {
  const [cursor, setCursor] = useState(0);
  const [done, setDone] = useState<Set<string>>(new Set());
  const { exit } = useApp();
  useInput((input, key) => {
    if (key.downArrow) setCursor((c) => Math.min(c + 1, tasks.length - 1));
    if (key.upArrow) setCursor((c) => Math.max(c - 1, 0));
    if (input === " ") {
      const id = tasks[cursor].id;
      setDone((d) => { const n = new Set(d); n.has(id) ? n.delete(id) : n.add(id); return n; });
    }
    if (key.return) onSubmit(tasks.filter((t) => done.has(t.id)).map((t) => t.id));
    if (input === "q") exit();
  });
  return (
    <Box flexDirection="column">
      <Text bold>Pre-shift checklist ({done.size}/{tasks.length})</Text>
      {tasks.map((t, i) => (
        <Text key={t.id} color={i === cursor ? "cyan" : undefined}>
          {i === cursor ? ">" : " "} [{done.has(t.id) ? "x" : " "}] {t.title}
        </Text>
      ))}
    </Box>
  );
}

export function Countdown({ from, onDone }: { from: number; onDone: () => void }) {
  const [n, setN] = useState(from);
  useEffect(() => {
    if (n === 0) { onDone(); return; }
    const t = setTimeout(() => setN(n - 1), 10);
    return () => clearTimeout(t);
  }, [n]);
  return <Text>{n === 0 ? "Go!" : `Starting in ${n}`}</Text>;
}
