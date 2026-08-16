import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { type ChangeEvent, type FormEvent, useCallback, useState } from "react";
import { toast } from "sonner";
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
import { adminLogin, getAdminSession } from "@/lib/access.functions";

export const Route = createFileRoute("/login")({
  loader: async () => {
    const session = await getAdminSession();
    if (session.ok) {
      throw redirect({ to: "/admin" });
    }
    return session;
  },
  component: Login,
});

function Login() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setBusy(true);
      try {
        const result = await adminLogin({ data: { password } });
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        await router.invalidate();
        await router.navigate({ to: "/admin" });
      } catch {
        toast.error("No se ha podido entrar.");
      } finally {
        setBusy(false);
      }
    },
    [password, router]
  );

  const onPasswordChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setPassword(event.target.value);
    },
    []
  );

  return (
    <main className="stagger-in flex flex-1 flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Gestión del acceso</CardTitle>
          <CardDescription>
            Introduce la contraseña para rotar códigos y ver el registro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-password">Contraseña</Label>
              <Input
                autoComplete="current-password"
                id="admin-password"
                minLength={8}
                name="password"
                onChange={onPasswordChange}
                required
                type="password"
                value={password}
              />
            </div>
            <Button disabled={busy} size="lg" type="submit">
              {busy ? (
                <LoaderCircle
                  className="animate-spin"
                  data-icon="inline-start"
                />
              ) : null}
              Entrar
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
