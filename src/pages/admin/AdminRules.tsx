import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, orderBy, query, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "@/components/admin-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { IconTrash, IconPlus, IconEdit, IconSparkles, IconFileText, IconCheck } from "@tabler/icons-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import heroImage from "@/assets/rulesDashboard.png";
import { Textarea } from "@/components/ui/textarea";

type RuleFile = {
  id: string;
  title: string;
  description: string;
  name: string;
  type: string;
  size: number;
  url: string;
  storagePath: string;
  createdAt: string;
  sourceType: "pdf" | "txt";
  status: "ready" | "pending_ocr";
  contentText?: string;
  summary?: string;
};

export default function AdminRules() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<RuleFile[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [textTitle, setTextTitle] = useState("");
  const [textDescription, setTextDescription] = useState("");
  const [textBody, setTextBody] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<RuleFile | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editSummarizing, setEditSummarizing] = useState(false);

  const summarizeWithGemini = async (text: string): Promise<string | undefined> => {
    const apiKey = "AIzaSyDnUMpfjOO0H39P0DfkBZRq7pyiLnAql1c";
    try {
      const genBody = {
        contents: [{
          parts: [
            { text: "Resume el siguiente texto en español en 6-10 bullets claros y accionables para un contexto de IA. Sé conciso y específico. NO incluyas frases introductorias como 'Aquí tienes', 'Claro', etc. Empieza directamente con los bullets:\n\n" + text }
          ]
        }]
      };
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(genBody)
      });
      if (!resp.ok) {
        console.error("Gemini API error:", resp.status, await resp.text());
        return undefined;
      }
      const data = await resp.json();
      let summary = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!summary) {
        console.error("Gemini no devolvió texto en la respuesta:", data);
        return undefined;
      }
      // Limpiar frases introductorias comunes
      summary = summary.replace(/^(Aquí tienes|Claro|Por supuesto|Perfecto|Entendido)[^\n]*\n*/i, "");
      summary = summary.replace(/^(Here you go|Sure|Of course)[^\n]*\n*/i, "");
      return summary.trim();
    } catch (err) {
      console.error("Error al llamar Gemini:", err);
      return undefined;
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const q = query(collection(db, "rules"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data: RuleFile[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RuleFile, "id">) }));
      setFiles(data);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  if (!userData) return null;

  const kpi = (() => {
    const total = files.length;
    const pdfs = files.filter(f => /pdf/i.test(f.type) || /\.pdf$/i.test(f.name)).length;
    const txts = files.filter(f => /text\/plain/i.test(f.type) || /\.txt$/i.test(f.name)).length;
    const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);
    return { total, pdfs, txts, totalSizeKb: (totalSize / 1024).toFixed(1) };
  })();

  const removeRule = async (id: string) => {
    if (!confirm("¿Eliminar esta regla?")) return;
    try {
      await deleteDoc(doc(db, "rules", id));
      setMessage("✅ Regla eliminada");
      await fetchRules();
    } catch (e: any) {
      setError(e?.message || "Error al eliminar regla");
    }
  };

  return (
    <SidebarProvider>
      <AdminSidebar
        user={{ name: userData.name, email: userData.email }}
        onLogout={handleLogout}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Reglas</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          {/* Hero Header */}
          <Card className="p-8 relative overflow-hidden border-none bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <div className="text-xs/5 uppercase tracking-wide opacity-80">Centro de Conocimiento</div>
                <h2 className="text-2xl md:text-4xl font-bold mt-1">Reglas y Guías del Agente</h2>
                <p className="mt-3 text-sm md:text-base opacity-90 max-w-2xl">
                  Agrega reglas en formato de texto. Generaremos un resumen breve para el contexto del agente.
                </p>
                <div className="mt-4">
                  <Dialog open={textDialogOpen} onOpenChange={setTextDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="secondary" className="ml-2">
                        <IconPlus className="h-4 w-4 mr-2" />
                        Nueva Regla de Texto
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[720px]">
                      <DialogHeader>
                        <DialogTitle>Agregar regla por texto</DialogTitle>
                        <DialogDescription>Pega el contenido completo; generaremos un resumen con Gemini.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="text-title">Título</Label>
                            <Input id="text-title" value={textTitle} onChange={(e)=>setTextTitle(e.target.value)} placeholder="Ej. Política de devoluciones" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="text-desc">Descripción</Label>
                            <Input id="text-desc" value={textDescription} onChange={(e)=>setTextDescription(e.target.value)} placeholder="Opcional" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="text-body">Contenido</Label>
                          <Textarea id="text-body" value={textBody} onChange={(e)=>setTextBody(e.target.value)} placeholder="Pega aquí el texto completo..." className="min-h-[240px]" />
                        </div>
                        {(message || error) && (
                          <div className="mt-1">
                            {message && <div className="text-green-600 text-sm">{message}</div>}
                            {error && <div className="text-destructive text-sm">{error}</div>}
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="secondary" onClick={()=>setTextDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={async ()=> {
                          if (!textTitle.trim() || !textBody.trim()) {
                            setError("Título y contenido son obligatorios");
                            return;
                          }
                          setError("");
                          setMessage("");
                          setSummarizing(true);
                          try {
                            const summary = await summarizeWithGemini(textBody);
                            await addDoc(collection(db, "rules"), {
                              title: textTitle.trim(),
                              description: textDescription.trim(),
                              name: `${Date.now()}_inline.txt`,
                              type: "text/plain",
                              size: textBody.length,
                              url: "",
                              storagePath: "",
                              createdAt: new Date().toISOString(),
                              sourceType: "txt",
                              status: "ready",
                              contentText: textBody,
                              ...(summary ? { summary } : {})
                            });
                            setMessage("✅ Regla de texto guardada");
                            setTextTitle("");
                            setTextDescription("");
                            setTextBody("");
                            setTextDialogOpen(false);
                            fetchRules();
                          } catch (e:any) {
                            setError(e?.message || "Error al guardar la regla de texto");
                          } finally {
                            setSummarizing(false);
                          }
                        }} disabled={summarizing}>
                          {summarizing ? "Resumiendo..." : "Guardar"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <img
                src={heroImage}
                alt="Rules hero"
                className="hidden md:block h-40 md:h-40 shrink-0"
                style={{
                  transform: "scale(2) translateX(-100px) !important",
                  transformOrigin: "center center",
                }}
              />
            </div>
          </Card>
          {/* KPI Header */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground uppercase">Reglas Totales</div>
              <div className="text-2xl font-bold mt-1">{kpi.total}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground uppercase">PDF</div>
              <div className="text-2xl font-bold mt-1">{kpi.pdfs}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground uppercase">TXT</div>
              <div className="text-2xl font-bold mt-1">{kpi.txts}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground uppercase">Tamaño total</div>
              <div className="text-2xl font-bold mt-1">{kpi.totalSizeKb} KB</div>
            </Card>
          </div>
          {/* Actions moved to hero modal */}

          {!!files.length && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Reglas cargadas ({files.length})</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {files.map((f) => (
                  <Card key={f.id} className="p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <IconFileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base truncate">{f.title || "Sin título"}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{f.description || "Sin descripción"}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-2 py-1 bg-muted rounded-md">{/pdf/i.test(f.type) ? "PDF" : "TXT"}</span>
                      <span className="flex items-center gap-1">
                        {f.status === "ready" ? (
                          <>
                            <IconCheck className="h-3 w-3 text-green-600" />
                            Listo
                          </>
                        ) : (
                          "Pendiente"
                        )}
                      </span>
                      <span>{(f.size / 1024).toFixed(1)} KB</span>
                      {f.summary && (
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <IconSparkles className="h-3 w-3" />
                          Con resumen
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setEditing(f);
                          setEditTitle(f.title || "");
                          setEditDescription(f.description || "");
                          setEditBody(f.contentText || "");
                          setEditOpen(true);
                        }}
                      >
                        <IconEdit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={async () => {
                          try {
                            setMessage("");
                            setError("");
                            if (!f.contentText) {
                              setError("No hay contenido para resumir");
                              return;
                            }
                            setSummarizing(true);
                            const summary = await summarizeWithGemini(f.contentText);
                            if (!summary) {
                              setError("Gemini no devolvió resumen (verifica VITE_GEMINI_API_KEY)");
                              setSummarizing(false);
                              return;
                            }
                            const dref = doc(db, "rules", f.id);
                            await updateDoc(dref, { summary });
                            setMessage("✅ Resumen generado y guardado");
                            fetchRules();
                            setSummarizing(false);
                          } catch (e:any) {
                            setError(e?.message || "Error al resumir con Gemini");
                            setSummarizing(false);
                          }
                        }}
                        disabled={summarizing}
                      >
                        <IconSparkles className="h-3 w-3 mr-1" />
                        Resumir
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeRule(f.id)}
                      >
                        <IconTrash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {/* Edit modal */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar regla</DialogTitle>
                <DialogDescription>Modifica el contenido y guarda. También puedes generar un resumen con Gemini.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Título</Label>
                    <Input id="edit-title" value={editTitle} onChange={(e)=>setEditTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-desc">Descripción</Label>
                    <Input id="edit-desc" value={editDescription} onChange={(e)=>setEditDescription(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-body">Contenido</Label>
                  <Textarea id="edit-body" value={editBody} onChange={(e)=>setEditBody(e.target.value)} className="min-h-[240px]" />
                </div>
                {editing?.summary && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <IconSparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Resumen IA</span>
                    </div>
                    <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap leading-relaxed">{editing.summary}</p>
                  </div>
                )}
                {(message || error) && (
                  <div className="mt-1">
                    {message && <div className="text-green-600 text-sm">{message}</div>}
                    {error && <div className="text-destructive text-sm">{error}</div>}
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="secondary" onClick={()=>setEditOpen(false)}>Cancelar</Button>
                <Button
                  variant="outline"
                  onClick={async ()=> {
                    try {
                      setEditSummarizing(true);
                      const summary = await summarizeWithGemini(editBody);
                      if (!summary) {
                        setError("Gemini no devolvió resumen (verifica VITE_GEMINI_API_KEY)");
                        return;
                      }
                      if (editing) {
                        const dref = doc(db, "rules", editing.id);
                        const { updateDoc } = await import("firebase/firestore");
                        await updateDoc(dref, { summary });
                        setMessage("✅ Resumen generado y guardado");
                        fetchRules();
                      }
                    } catch (e:any) {
                      setError(e?.message || "Error al resumir con Gemini");
                    } finally {
                      setEditSummarizing(false);
                    }
                  }}
                  disabled={editSummarizing}
                >
                  {editSummarizing ? "Resumiendo..." : "Resumir con AI"}
                </Button>
                <Button
                  onClick={async ()=> {
                    if (!editing) return;
                    try {
                      const dref = doc(db, "rules", editing.id);
                      const { updateDoc } = await import("firebase/firestore");
                      await updateDoc(dref, {
                        title: editTitle.trim(),
                        description: editDescription.trim(),
                        contentText: editBody
                      });
                      setMessage("✅ Regla actualizada");
                      setEditOpen(false);
                      fetchRules();
                    } catch (e:any) {
                      setError(e?.message || "Error al actualizar");
                    }
                  }}
                >
                  Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


