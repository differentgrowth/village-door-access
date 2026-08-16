import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { publicErrorMessage } from "@/lib/public-error";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <span aria-hidden="true" className="text-danger">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="font-display font-medium text-xl">Algo ha fallado</h1>
      <p className="max-w-md break-words text-muted-foreground text-sm">
        {publicErrorMessage(error.message)}
      </p>
    </main>
  );
}
