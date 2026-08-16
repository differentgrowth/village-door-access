import {
  createFileRoute,
  isRedirect,
  Link,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import {
  ArchiveRestore,
  LoaderCircle,
  LogOut,
  Plus,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";
import { CodeDigits } from "@/components/code-digits";
import { LocationPicker } from "@/components/location-picker";
import { LocationQrCard } from "@/components/location-qr-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  type AccessCodeRow,
  adminLogout,
  archiveLocation,
  createLocation,
  getAdminSession,
  getAdminState,
  listAccessCodes,
  listVisits,
  renameLocation,
  restoreLocation,
  rotateCode,
  type VisitRow,
} from "@/lib/access.functions";
import { parseLocationSearch } from "@/lib/location-search";
import { rethrowPublic } from "@/lib/public-error";
import { formatDateTime, formatShortDateTime } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  validateSearch: parseLocationSearch,
  loaderDeps: ({ search }) => ({ locationId: search.location }),
  loader: async ({ deps }) => {
    try {
      const session = await getAdminSession();
      if (!session.ok) {
        throw redirect({ to: "/login" });
      }
      const state = await getAdminState({
        data: { locationId: deps.locationId },
      });
      const locationId = state.selectedLocationId;
      const [visitData, codeData] = locationId
        ? await Promise.all([
            listVisits({ data: { locationId } }),
            listAccessCodes({ data: { locationId } }),
          ])
        : [
            { visits: [] as VisitRow[], todayCount: 0, totalCount: 0 },
            { codes: [] as AccessCodeRow[] },
          ];
      return { session, state, visitData, codeData };
    } catch (err) {
      if (isRedirect(err)) {
        throw err;
      }
      rethrowPublic(err);
    }
  },
  component: AdminPage,
});

function AdminPage() {
  const initial = Route.useLoaderData();
  const router = useRouter();
  const navigate = Route.useNavigate();
  const [state, setState] = useState(initial.state);
  const [busy, setBusy] = useState(false);
  const [visits, setVisits] = useState<VisitRow[]>(initial.visitData.visits);
  const [todayCount, setTodayCount] = useState(initial.visitData.todayCount);
  const [totalCount, setTotalCount] = useState(initial.visitData.totalCount);
  const [codes, setCodes] = useState<AccessCodeRow[]>(initial.codeData.codes);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [loadingLists, setLoadingLists] = useState(false);
  const [newName, setNewName] = useState("");
  const [renameValue, setRenameValue] = useState(
    initial.state.locations.find(
      (row) => row.id === initial.state.selectedLocationId
    )?.name ?? ""
  );

  const selectedId = state.selectedLocationId ?? "";
  const selected = state.locations.find((row) => row.id === selectedId);

  useEffect(() => {
    setState(initial.state);
    setVisits(initial.visitData.visits);
    setTodayCount(initial.visitData.todayCount);
    setTotalCount(initial.visitData.totalCount);
    setCodes(initial.codeData.codes);
    setRenameValue(
      initial.state.locations.find(
        (row) => row.id === initial.state.selectedLocationId
      )?.name ?? ""
    );
  }, [initial.state, initial.visitData, initial.codeData]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    let cancelled = false;
    setLoadingLists(true);
    Promise.all([
      listVisits({ data: { locationId: selectedId } }),
      listAccessCodes({ data: { locationId: selectedId } }),
    ])
      .then(([visitData, codeData]) => {
        if (cancelled) {
          return;
        }
        setVisits(visitData.visits);
        setTodayCount(visitData.todayCount);
        setTotalCount(visitData.totalCount);
        setCodes(codeData.codes);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("No se ha podido cargar el registro.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingLists(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const refreshState = useCallback(
    async (locationId = selectedId) => {
      const next = await getAdminState({ data: { locationId } });
      setState(next);
      setRenameValue(
        next.locations.find((row) => row.id === next.selectedLocationId)
          ?.name ?? ""
      );
      return next;
    },
    [selectedId]
  );

  const onSelectLocation = useCallback(
    async (locationId: string) => {
      setConfirmRotate(false);
      await navigate({ search: { location: locationId } });
    },
    [navigate]
  );

  const onRenameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setRenameValue(event.target.value);
  }, []);

  const onNewNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setNewName(event.target.value);
    },
    []
  );

  const onRotate = useCallback(async () => {
    if (!selectedId || selected?.archived) {
      return;
    }
    if (!confirmRotate) {
      setConfirmRotate(true);
      window.setTimeout(() => setConfirmRotate(false), 4000);
      return;
    }
    setBusy(true);
    try {
      const next = await rotateCode({ data: { locationId: selectedId } });
      setState((prev) => ({
        ...prev,
        code: next.code,
        rotatedAt: next.rotatedAt,
      }));
      setConfirmRotate(false);
      const codeData = await listAccessCodes({
        data: { locationId: selectedId },
      });
      setCodes(codeData.codes);
      toast.success("Código nuevo generado.");
      await router.invalidate();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se ha podido rotar el código."
      );
    } finally {
      setBusy(false);
    }
  }, [confirmRotate, router, selected?.archived, selectedId]);

  const onLogout = useCallback(async () => {
    await adminLogout();
    await router.invalidate();
    await router.navigate({ to: "/login" });
  }, [router]);

  const onCreate = useCallback(async () => {
    setBusy(true);
    try {
      const result = await createLocation({ data: { name: newName } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setNewName("");
      toast.success("Ubicación creada.");
      await refreshState(result.location.id);
      await navigate({ search: { location: result.location.id } });
      await router.invalidate();
    } catch {
      toast.error("No se ha podido crear la ubicación.");
    } finally {
      setBusy(false);
    }
  }, [navigate, newName, refreshState, router]);

  const onCreateSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      await onCreate();
    },
    [onCreate]
  );

  const onRename = useCallback(async () => {
    if (!selectedId) {
      return;
    }
    setBusy(true);
    try {
      const result = await renameLocation({
        data: { locationId: selectedId, name: renameValue },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Nombre actualizado.");
      await refreshState(selectedId);
      await router.invalidate();
    } catch {
      toast.error("No se ha podido cambiar el nombre.");
    } finally {
      setBusy(false);
    }
  }, [refreshState, renameValue, router, selectedId]);

  const onArchiveToggle = useCallback(async () => {
    if (!(selectedId && selected)) {
      return;
    }
    setBusy(true);
    try {
      const result = selected.archived
        ? await restoreLocation({ data: { locationId: selectedId } })
        : await archiveLocation({ data: { locationId: selectedId } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        selected.archived ? "Ubicación restaurada." : "Ubicación archivada."
      );
      const next = await refreshState(selectedId);
      await navigate({
        search: { location: next.selectedLocationId ?? undefined },
      });
      await router.invalidate();
    } catch {
      toast.error("No se ha podido actualizar la ubicación.");
    } finally {
      setBusy(false);
    }
  }, [navigate, refreshState, router, selected, selectedId]);

  const activeCount = state.locations.filter((row) => !row.archived).length;

  return (
    <main className="stagger-in flex flex-1 flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-medium text-2xl tracking-tight">
            Gestión
          </h1>
          <p className="text-muted-foreground text-sm">
            Hoy: {todayCount} {todayCount === 1 ? "visita" : "visitas"}
            {" · "}
            Total: {totalCount}
          </p>
        </div>
        <Button onClick={onLogout} size="sm" type="button" variant="ghost">
          <LogOut data-icon="inline-start" />
          Salir
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ubicaciones</CardTitle>
          <CardDescription>
            Cada ubicación es una puerta, con su propio código.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <LocationPicker
            locations={state.locations}
            onChange={onSelectLocation}
            value={selectedId}
          />
          <div className="flex flex-col gap-2">
            <Label htmlFor="rename-location">Nombre</Label>
            <div className="flex gap-2">
              <Input
                id="rename-location"
                maxLength={40}
                onChange={onRenameChange}
                value={renameValue}
              />
              <Button
                className="h-11"
                disabled={busy || renameValue.trim() === selected?.name}
                onClick={onRename}
                type="button"
                variant="outline"
              >
                Guardar
              </Button>
            </div>
          </div>
          <div>
            <Button
              disabled={busy || (!selected?.archived && activeCount <= 1)}
              onClick={onArchiveToggle}
              size="sm"
              type="button"
              variant="ghost"
            >
              <ArchiveRestore data-icon="inline-start" />
              {selected?.archived ? "Restaurar" : "Archivar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {selected && !selected.archived ? (
        <LocationQrCard locationId={selected.id} locationName={selected.name} />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Código actual</CardTitle>
          <CardDescription>
            Rotado el {formatDateTime(state.rotatedAt)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeDigits code={state.code} size="md" />
          {state.archived ? (
            <p className="mt-3 text-muted-foreground text-sm">
              Esta ubicación está archivada. No aparece en la entrada.
            </p>
          ) : (
            <>
              <Button
                className="mt-4 w-full"
                disabled={busy}
                onClick={onRotate}
                size="lg"
                type="button"
                variant={confirmRotate ? "destructive" : "default"}
              >
                <RotateIcon busy={busy} confirm={confirmRotate} />
                Rotar código
              </Button>
              {confirmRotate ? (
                <p className="mt-2 text-muted-foreground text-xs">
                  El código anterior dejará de abrir la puerta.
                </p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      {initial.session.emailConfigured ? (
        <p className="rounded-xl bg-chip px-4 py-3 text-muted-foreground text-xs leading-relaxed">
          Cada visita envía un correo con el nombre, la ubicación, el código y
          la fecha.
        </p>
      ) : null}

      <HistorySection
        emptyDescription="Cada vez que se rote el código, quedará aquí."
        emptyTitle="Todavía no hay historial"
        loading={loadingLists && codes.length === 0}
        title="Códigos"
      >
        {codes.map((item) => (
          <li
            className="rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-paper)]"
            key={item.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display font-medium text-xl tabular-nums tracking-wide">
                  {item.code}
                </p>
                <p className="text-muted-foreground text-xs">
                  {item.endedAt
                    ? `${formatShortDateTime(item.startedAt)} — ${formatShortDateTime(item.endedAt)}`
                    : `Desde ${formatShortDateTime(item.startedAt)}`}
                </p>
              </div>
              {item.endedAt ? null : (
                <span className="shrink-0 rounded-full bg-chip px-2 py-0.5 font-medium text-ok text-xs uppercase tracking-wide">
                  Vigente
                </span>
              )}
            </div>
          </li>
        ))}
      </HistorySection>

      <HistorySection
        emptyDescription="Cuando alguien deje su nombre en la entrada, aparecerá aquí."
        emptyTitle="Todavía no hay visitas"
        loading={loadingLists && visits.length === 0}
        title="Registro de visitas"
      >
        {visits.map((visit) => (
          <li
            className="rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-paper)]"
            key={visit.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{visit.name}</p>
                <p className="text-muted-foreground text-xs">
                  {formatShortDateTime(visit.visitedAt)} · código {visit.code}
                </p>
              </div>
              <span
                className={
                  visit.emailSent
                    ? "shrink-0 rounded-full bg-chip px-2 py-0.5 font-medium text-ok text-xs uppercase tracking-wide"
                    : "shrink-0 rounded-full bg-chip px-2 py-0.5 font-medium text-muted-foreground text-xs uppercase tracking-wide"
                }
              >
                {visit.emailSent ? "Enviado" : "Guardado"}
              </span>
            </div>
          </li>
        ))}
      </HistorySection>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nueva ubicación</CardTitle>
          <CardDescription>
            Añade otra puerta, con su propio código.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2" onSubmit={onCreateSubmit}>
            <Input
              id="new-location"
              maxLength={40}
              onChange={onNewNameChange}
              placeholder="Pabellón"
              value={newName}
            />
            <Button
              aria-label="Añadir ubicación"
              className="h-11"
              disabled={busy || newName.trim().length < 2}
              type="submit"
              variant="outline"
            >
              <Plus data-icon="inline-start" />
              Añadir
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-muted-foreground text-xs">
        <Link className="underline-offset-2 hover:underline" to="/">
          Volver al código
        </Link>
      </p>
    </main>
  );
}

function HistorySection({
  title,
  loading,
  emptyTitle,
  emptyDescription,
  children,
}: {
  title: string;
  loading: boolean;
  emptyTitle: string;
  emptyDescription: string;
  children: ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  const count = items.filter(Boolean).length;
  let body: ReactNode;
  if (loading) {
    body = <p className="text-muted-foreground text-sm">Cargando registro…</p>;
  } else if (count === 0) {
    body = (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{emptyTitle}</CardTitle>
          <CardDescription>{emptyDescription}</CardDescription>
        </CardHeader>
      </Card>
    );
  } else {
    body = (
      <ScrollArea viewportClassName="max-h-history overflow-y-auto! p-3">
        <ul className="flex flex-col gap-2 pe-4">{children}</ul>
      </ScrollArea>
    );
  }
  return (
    <section>
      <h2 className="mb-3 font-display font-medium text-lg">{title}</h2>
      {body}
    </section>
  );
}

function RotateIcon({ busy, confirm }: { busy: boolean; confirm: boolean }) {
  if (busy) {
    return <LoaderCircle className="animate-spin" data-icon="inline-start" />;
  }
  if (confirm) {
    return <TriangleAlert data-icon="inline-start" />;
  }
  return <RefreshCw data-icon="inline-start" />;
}
