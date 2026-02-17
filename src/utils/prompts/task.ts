import { spinner, type SpinnerResult } from "@clack/prompts";
import chalk from "chalk";

export type TaskOptions<T> = {
  title: string;
  fn: (spinner: SpinnerResult) => Promise<T>;
  onSuccess?: (spinner: SpinnerResult, result: T) => void;
  onError?: (spinner: SpinnerResult, err: any) => void;
};

export async function task<T>(opts: TaskOptions<T>): Promise<T> {
  const s = spinner();
  s.start(opts.title);

  try {
    const result = await opts.fn(s);
    if (opts.onSuccess) {
      opts.onSuccess(s, result);
    } else {
      s.stop(`${opts.title}... ${chalk.green("Done")}`);
    }
    return result;
  } catch (err) {
    if (opts.onError) {
      opts.onError(s, err);
    } else {
      s.stop(`${opts.title}... ${chalk.red("Failed")}`);
    }
    throw err;
  }
}
