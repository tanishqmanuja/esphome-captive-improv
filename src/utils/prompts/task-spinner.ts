import { spinner, log, type SpinnerOptions } from "@clack/prompts";
import { createSubTask, type SubTask } from "./sub-task";

export type TaskSpinnerOptions = SpinnerOptions;

export function taskSpinner(opts: TaskSpinnerOptions = {}) {
  const s = spinner(opts);

  let title = "";
  const subTasks: SubTask[] = [];

  function render() {
    s.message([title, ...subTasks.map((t) => t.render())].join("\n") + " ");
  }

  return {
    start(msg = "") {
      title = msg;
      s.start(title);
    },

    update(msg: string) {
      title = msg;
      render();
    },

    subTask(msg: string) {
      const task = createSubTask(msg, render);
      subTasks.push(task);
      render();
      return {
        error: task.error,
        success: task.success,
        message: (text?: string) => task.render(text),
      };
    },

    stop(msg?: string) {
      s.clear();

      log.success(msg ?? title, { spacing: 0 });
      for (const t of subTasks) {
        console.log(t.render());
      }
    },

    error(msg?: string) {
      s.clear();

      log.error(msg ?? title, { spacing: 0 });
      for (const t of subTasks) {
        console.log(t.render());
      }
    },
  };
}
