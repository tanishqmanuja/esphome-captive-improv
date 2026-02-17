import color from "picocolors";

export type SubTaskState = "pending" | "success" | "error";

export function createSubTask(
  message: string,
  onChange: (state: SubTaskState) => void,
) {
  let state: SubTaskState = "pending";

  const render = (newMessage?: string) => {
    const prefix = color.gray("│  ↳");

    if (newMessage) {
      message = newMessage;
    }

    if (state === "success") {
      return `${prefix} ${color.gray(message)} ${color.gray("...")} ${color.green("DONE")}`;
    }

    if (state === "error") {
      return `${prefix} ${color.gray(message)} ${color.gray("...")} ${color.red("FAILED")}`;
    }

    return `${prefix} ${color.gray(message)}`;
  };

  return {
    success() {
      state = "success";
      onChange(state);
    },

    error() {
      state = "error";
      onChange(state);
    },

    render,
  };
}

export type SubTask = ReturnType<typeof createSubTask>;
