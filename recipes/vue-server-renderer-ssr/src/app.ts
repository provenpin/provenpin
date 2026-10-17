import {
  computed,
  createSSRApp,
  defineComponent,
  h,
  inject,
  provide,
  type InjectionKey,
  type PropType,
} from "vue";
import { renderToString } from "@vue/server-renderer";

export type Task = { id: string; label: string; done: boolean };

export const PrefixKey: InjectionKey<string> = Symbol("prefix");

export const ItemRow = defineComponent({
  name: "ItemRow",
  props: {
    label: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  setup(props) {
    const prefix = inject(PrefixKey, "");
    const text = computed(() => `${prefix}${props.label}`);
    return () => {
      const children = [h("span", { class: "label" }, text.value)];
      if (props.done) {
        children.push(h("span", { class: "check" }, " done"));
      }
      return h("li", { class: props.done ? "done" : "todo" }, children);
    };
  },
});

export const TaskList = defineComponent({
  name: "TaskList",
  props: {
    title: { type: String, default: "Tasks" },
    tasks: {
      type: Array as PropType<Task[]>,
      default: () => [] as Task[],
    },
  },
  setup(props) {
    provide(PrefixKey, "- ");
    const remaining = computed(() => props.tasks.filter((task) => !task.done).length);
    return () =>
      h("section", { class: "task-list" }, [
        h("h1", null, props.title),
        h(
          "ul",
          null,
          props.tasks.map((task) =>
            h(ItemRow, { key: task.id, label: task.label, done: task.done })
          )
        ),
        h("p", { class: "remaining" }, `${remaining.value} remaining`),
      ]);
  },
});

export function renderTaskList(options: { title?: string; tasks: Task[] }): Promise<string> {
  const app = createSSRApp({
    render: () => h(TaskList, { title: options.title, tasks: options.tasks }),
  });
  return renderToString(app);
}
