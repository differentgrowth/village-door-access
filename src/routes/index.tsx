import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, LoaderCircle } from "lucide-react";
import { type ChangeEvent, type FormEvent, useCallback, useState } from "react";
import { toast } from "sonner";
import { CodeDigits } from "@/components/code-digits";
import { LocationPicker } from "@/components/location-picker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPublicState, registerVisit } from "@/lib/access.functions";
import { parseLocationSearch } from "@/lib/location-search";
import { rethrowPublic } from "@/lib/public-error";
import { formatDateTime } from "@/lib/utils";

export const Route = createFileRoute("/")({
  validateSearch: parseLocationSearch,
  loaderDeps: ({ search }) => ({ locationId: search.location }),
  loader: ({ deps }) =>
    getPublicState({ data: { locationId: deps.locationId } }).catch(
      rethrowPublic
    ),
  component: Home,
});

function Home() {
  const state = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const selectedId = state.selectedLocationId ?? "";
  const requestedUnavailable = Boolean(search.location) && !selectedId;
  const [name, setName] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [revealed, setRevealed] = useState<{
    locationId: string;
    code: string;
    at: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    if (!revealed) {
      return;
    }
    try {
      await navigator.clipboard.writeText(revealed.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("No se pudo copiar. Anótalo a mano.");
    }
  }, [revealed]);

  const onSelectLocation = useCallback(
    async (locationId: string) => {
      setRevealed(null);
      await navigate({ search: { location: locationId } });
    },
    [navigate]
  );

  const onNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  }, []);

  const onHoneypotChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setHoneypot(event.target.value);
    },
    []
  );

  const onSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!selectedId) {
        toast.error("Elige una ubicación.");
        return;
      }
      setSubmitting(true);
      const toastId = toast.loading("Registrando la visita…");
      try {
        const result = await registerVisit({
          data: { name, locationId: selectedId, website: honeypot },
        });
        if (!result.ok) {
          toast.error(result.error, { id: toastId });
          return;
        }
        setRevealed({
          locationId: selectedId,
          code: result.code,
          at: result.visitedAt,
        });
        setName("");
        toast.success("Visita registrada", {
          id: toastId,
          description: result.emailSent
            ? `Aviso enviado · ${formatDateTime(result.visitedAt)}`
            : `Queda constancia · ${formatDateTime(result.visitedAt)}`,
        });
      } catch {
        toast.error("No se ha podido registrar. Inténtalo de nuevo.", {
          id: toastId,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [honeypot, name, selectedId]
  );

  const codeVisible = revealed && revealed.locationId === selectedId;

  return (
    <main className="stagger-in flex flex-1 flex-col gap-5 lg:grid lg:grid-cols-2 lg:content-start lg:items-start">
      <Card>
        <CardHeader>
          <CardTitle>Registra tu visita</CardTitle>
          <CardDescription>
            {state.emailConfigured
              ? "Elige la puerta, deja tu nombre y verás el código. Se enviará un aviso con la fecha."
              : "Elige la puerta, deja tu nombre y verás el código. Queda constancia en el registro."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            {requestedUnavailable ? (
              <p className="text-danger text-sm">
                Esta puerta no está disponible.
              </p>
            ) : null}
            <LocationPicker
              locations={state.locations}
              onChange={onSelectLocation}
              value={selectedId}
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor="visitor-name">Nombre y apellidos</Label>
              <Input
                autoComplete="name"
                id="visitor-name"
                maxLength={80}
                minLength={2}
                name="name"
                onChange={onNameChange}
                placeholder="María López"
                required
                value={name}
              />
            </div>
            <div
              aria-hidden="true"
              className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
            >
              <label htmlFor="website">Sitio web</label>
              <input
                autoComplete="off"
                id="website"
                name="website"
                onChange={onHoneypotChange}
                tabIndex={-1}
                value={honeypot}
              />
            </div>
            <Button
              disabled={submitting || !selectedId}
              size="lg"
              type="submit"
            >
              {submitting ? (
                <LoaderCircle
                  className="animate-spin"
                  data-icon="inline-start"
                />
              ) : null}
              Registrar visita
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Código de la puerta</CardTitle>
          <CardDescription>
            {codeVisible
              ? `Visible desde ${formatDateTime(revealed.at)}`
              : "Se muestra al registrar la visita"}
          </CardDescription>
          {codeVisible ? (
            <CardAction>
              <Button
                aria-label="Copiar código"
                className="size-11"
                onClick={onCopy}
                size="icon"
                type="button"
                variant="outline"
              >
                {copied ? <Check /> : <Copy />}
              </Button>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          <CodeDigits code={revealed?.code} masked={!codeVisible} />
        </CardContent>
      </Card>

      <p className="px-1 text-center text-muted-foreground text-xs leading-relaxed lg:col-span-2">
        El código lo rota quien gestiona el acceso. Si no abre, espera un
        momento o avisa en el ayuntamiento.
      </p>
      <p className="px-1 text-center text-muted-foreground text-xs leading-relaxed lg:col-span-2">
        El nombre se usa solo para el registro de acceso y se borra a los 90
        días. Responsable: Ayuntamiento de Aldearrodrigo.
      </p>
    </main>
  );
}
