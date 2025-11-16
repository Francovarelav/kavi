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
import signupImage from "@/assets/signup.png";

export default function UserSignup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      return setError("La contraseña debe tener al menos 8 caracteres");
    }

    try {
      setError("");
      setLoading(true);
      await signUp(email, password, name, "user");
      navigate("/user/dashboard");
    } catch (err: any) {
      setError(err.message || "Error al crear la cuenta");
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
                  <h1 className="text-2xl font-bold">Crear Cuenta de Vendedor</h1>
                  <p className="text-muted-foreground text-sm text-balance">
                    Completa el formulario para crear tu cuenta de vendedor
                  </p>
                </div>
                
                {error && (
                  <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <Field>
                  <FieldLabel htmlFor="name">Nombre Completo</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Juan Pérez"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
                
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
                  <FieldDescription>
                    Este será tu correo de acceso como vendedor
                  </FieldDescription>
                </Field>
                
                <Field>
                  <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <FieldDescription>
                    Debe tener al menos 8 caracteres.
                  </FieldDescription>
                </Field>
                
                <Field>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creando Cuenta..." : "Crear Cuenta de Vendedor"}
                  </Button>
                </Field>
                
                <FieldDescription className="text-center">
                  ¿Ya tienes una cuenta?{" "}
                  <a href="/user/login" className="underline underline-offset-4">
                    Inicia sesión aquí
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
          backgroundImage: `url(${signupImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
    </div>
  );
}

