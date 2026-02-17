import type { SubTask } from "./sub-task";
import { taskSpinner } from "./task-spinner";
import color from "picocolors";

export type TaskOptions = {
  title: string;
  tasks: Array<{
    title: string;
    fn: (subTask: Omit<SubTask, "render">) => Promise<unknown>;
  }>;
  errorHandler?: (err: unknown) => void;
};

export async function task<T>(opts: TaskOptions): Promise<void> {
  const s = taskSpinner();
  s.start(opts.title);

  try {
    for (const task of opts.tasks) {
      const subTask = s.subTask(task.title);
      await task
        .fn(subTask)
        .then(() => subTask.success())
        .catch((err) => {
          subTask.error();
          throw err;
        });
    }
    s.stop();
  } catch (err) {
    s.error(color.red(`${opts.title}`));
    if (opts.errorHandler) {
      opts.errorHandler(err);
    } else {
      throw err;
    }
  }
}
