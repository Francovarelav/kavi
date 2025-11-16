import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import loginImage from "@/assets/login.png";

export default function UserLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);
      await login(email, password);
      navigate("/user/dashboard");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Form Section */}
      <div 
        className="flex items-center justify-center" 
        style={{ 
          width: '50%', 
          height: '100vh', 
          overflowY: 'auto',
          padding: '2rem'
        }}
      >
          <div className="w-full max-w-md">
            <form className={cn("flex flex-col gap-6")} onSubmit={handleSubmit}>
              <FieldGroup>
                <div className="flex flex-col items-center gap-1 text-center">
                  <h1 className="text-2xl font-bold">Inicio de Sesión Vendedor</h1>
                  <p className="text-muted-foreground text-sm text-balance">
                    Ingresa tus credenciales para acceder a tu cuenta de vendedor
                  </p>
                </div>
                
                {error && (
                  <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <Field>
                  <FieldLabel htmlFor="email">Correo Electrónico</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="vendedor@ejemplo.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
                
                <Field>
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                    <a
                      href="#"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
                
                <Field>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                </Field>
                
                <FieldDescription className="text-center">
                  ¿No tienes una cuenta?{" "}
                  <a href="/user/signup" className="underline underline-offset-4">
                    Regístrate
                  </a>
                </FieldDescription>
              </FieldGroup>
            </form>
          </div>
      </div>

      {/* Image Section */}
      <div 
        style={{
          width: '50%',
          height: '100vh',
          backgroundImage: `url(${loginImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
    </div>
  );
}

