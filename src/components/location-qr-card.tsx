import { ChevronDown, Download, Printer } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  encodeLocationQr,
  locationQrPath,
  locationVisitUrl,
  QR_FONT,
  QR_INK,
  QR_MUTED,
  QR_PAPER,
  QR_SHEET,
  stickerFilename,
} from "@/lib/location-qr";

function usePageOrigin(): string {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  return origin;
}

async function downloadStickerPng(name: string, url: string) {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  const { modules, size } = encodeLocationQr(url);
  const modulePx = 8;
  const padding = 48;
  const markBand = 36;
  const nameBand = 52;
  const wellPad = 20;
  const qrPx = size * modulePx;
  const well = qrPx + wellPad * 2;
  const width = Math.max(well + padding * 2, 520);
  const height = padding + markBand + nameBand + well + padding;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    toast.error("No se ha podido crear la imagen.");
    return;
  }
  const radius = 24;
  ctx.fillStyle = QR_SHEET;
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, radius);
  ctx.fill();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = QR_MUTED;
  ctx.font = `500 13px ${QR_FONT}`;
  ctx.fillText("ACCESO", width / 2, padding + 14);
  ctx.fillStyle = QR_INK;
  let fontSize = 30;
  ctx.font = `500 ${fontSize}px ${QR_FONT}`;
  const maxNameWidth = width - padding * 2;
  while (fontSize > 18 && ctx.measureText(name).width > maxNameWidth) {
    fontSize -= 1;
    ctx.font = `500 ${fontSize}px ${QR_FONT}`;
  }
  ctx.fillText(name, width / 2, padding + markBand + 22, maxNameWidth);
  const wellLeft = Math.round((width - well) / 2);
  const wellTop = padding + markBand + nameBand;
  ctx.fillStyle = QR_PAPER;
  ctx.beginPath();
  ctx.roundRect(wellLeft, wellTop, well, well, 16);
  ctx.fill();
  const qrLeft = wellLeft + wellPad;
  const qrTop = wellTop + wellPad;
  ctx.fillStyle = QR_INK;
  for (let y = 0; y < size; y += 1) {
    const row = modules[y];
    if (!row) {
      continue;
    }
    for (let x = 0; x < size; x += 1) {
      if (row[x]) {
        ctx.fillRect(
          qrLeft + x * modulePx,
          qrTop + y * modulePx,
          modulePx,
          modulePx
        );
      }
    }
  }
  canvas.toBlob((blob) => {
    if (!blob) {
      toast.error("No se ha podido crear la imagen.");
      return;
    }
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = stickerFilename(name);
    link.href = href;
    link.click();
    URL.revokeObjectURL(href);
  }, "image/png");
}

function appendQrSvg(parent: Element, url: string, doc: Document) {
  const { d, size } = locationQrPath(url);
  const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  const paper = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
  paper.setAttribute("width", String(size));
  paper.setAttribute("height", String(size));
  paper.setAttribute("fill", QR_PAPER);
  const ink = doc.createElementNS("http://www.w3.org/2000/svg", "path");
  ink.setAttribute("d", d);
  ink.setAttribute("fill", QR_INK);
  svg.append(paper, ink);
  parent.append(svg);
}

function printSticker(name: string, url: string) {
  const popup = window.open("", "_blank");
  if (!popup) {
    toast.error("Permite las ventanas emergentes para imprimir.");
    return;
  }
  const doc = popup.document;
  doc.title = name;
  const font = doc.createElement("link");
  font.rel = "stylesheet";
  font.href =
    "https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600&display=swap";
  const style = doc.createElement("style");
  style.textContent = `
    @page { margin: 12mm; }
    html, body { margin: 0; background: ${QR_SHEET}; color: ${QR_INK}; }
    body {
      font-family: ${QR_FONT};
      text-align: center;
      padding: 18mm 16mm;
    }
    .mark {
      color: ${QR_MUTED};
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.18em;
      margin: 0 0 6mm;
      text-transform: uppercase;
    }
    h1 { font-size: 26px; font-weight: 500; letter-spacing: -0.02em; margin: 0 0 10mm; }
    .well {
      background: ${QR_PAPER};
      border-radius: 8mm;
      display: inline-block;
      padding: 6mm;
    }
    .qr { width: 68mm; height: 68mm; margin: 0 auto; }
    .qr svg { display: block; height: 100%; width: 100%; }
  `;
  doc.head.append(font, style);
  const mark = doc.createElement("p");
  mark.className = "mark";
  mark.textContent = "Acceso";
  const heading = doc.createElement("h1");
  heading.textContent = name;
  const well = doc.createElement("div");
  well.className = "well";
  const wrap = doc.createElement("div");
  wrap.className = "qr";
  appendQrSvg(wrap, url, doc);
  well.append(wrap);
  doc.body.replaceChildren(mark, heading, well);
  const printNow = () => {
    popup.focus();
    popup.print();
    popup.close();
  };
  Promise.race([
    doc.fonts?.ready ?? Promise.resolve(),
    new Promise((resolve) => {
      window.setTimeout(resolve, 800);
    }),
  ]).then(printNow);
}

function LocationQrImage({ label, url }: { label: string; url: string }) {
  const { d, size } = locationQrPath(url);
  return (
    <svg
      aria-label={label}
      className="size-48"
      role="img"
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill={QR_PAPER} height={size} width={size} />
      <path d={d} fill={QR_INK} />
    </svg>
  );
}

export function LocationQrCard({
  locationId,
  locationName,
}: {
  locationId: string;
  locationName: string;
}) {
  const origin = usePageOrigin();
  const url = useMemo(
    () => (origin ? locationVisitUrl(origin, locationId) : ""),
    [locationId, origin]
  );

  const onDownload = useCallback(() => {
    if (!url) {
      return;
    }
    downloadStickerPng(locationName, url).catch(() => {
      toast.error("No se ha podido crear la imagen.");
    });
  }, [locationName, url]);

  const onPrint = useCallback(() => {
    if (!url) {
      return;
    }
    printSticker(locationName, url);
  }, [locationName, url]);

  return (
    <Card>
      <Collapsible>
        <CollapsibleTrigger className="group/qr flex min-h-11 w-full items-start justify-between gap-3 px-(--card-spacing) text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <CardHeader className="flex-1 px-0">
            <CardTitle>Pegatina QR</CardTitle>
            <CardDescription>
              Imprímela y pégala en esta puerta.
            </CardDescription>
          </CardHeader>
          <ChevronDown className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]/qr:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-4 rounded-xl bg-bg px-5 py-7 text-fg">
              <div className="text-center">
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-widest">
                  Acceso
                </p>
                <p className="mt-1 font-medium text-lg tracking-tight">
                  {locationName}
                </p>
              </div>
              <div className="rounded-lg bg-surface p-3 shadow-[var(--shadow-paper)]">
                {url ? (
                  <LocationQrImage label={`QR de ${locationName}`} url={url} />
                ) : (
                  <div className="size-48" />
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                className="h-11 flex-1"
                disabled={!url}
                onClick={onDownload}
                type="button"
                variant="outline"
              >
                <Download data-icon="inline-start" />
                Descargar
              </Button>
              <Button
                className="h-11 flex-1"
                disabled={!url}
                onClick={onPrint}
                type="button"
                variant="outline"
              >
                <Printer data-icon="inline-start" />
                Imprimir
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
