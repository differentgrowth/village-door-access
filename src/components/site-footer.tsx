import { Github, Heart } from "lucide-react";

const DESIGNER_HREF = "https://www.differentgrowth.com";
const REPO_HREF = "https://github.com/differentgrowth/village-door-access";

export function SiteFooter() {
  return (
    <footer className="mt-auto flex items-center justify-center gap-1 pt-12 text-muted-foreground text-xs">
      <a
        className="inline-flex min-h-11 items-center gap-1 rounded-md px-1.5 transition-colors hover:text-fg"
        href={DESIGNER_HREF}
        rel="noreferrer"
        target="_blank"
      >
        designed by Different Growth with
        <Heart aria-hidden="true" className="size-3.5 fill-current" />
      </a>
      <a
        aria-label="Repositorio en GitHub"
        className="inline-flex size-11 items-center justify-center rounded-md transition-colors hover:text-fg"
        href={REPO_HREF}
        rel="noreferrer"
        target="_blank"
      >
        <Github aria-hidden="true" className="size-4" />
      </a>
    </footer>
  );
}
