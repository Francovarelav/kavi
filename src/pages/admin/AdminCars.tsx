import { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../firebase";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "@/components/admin-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { IconUpload, IconCheck, IconAlertCircle, IconPlus, IconPhoto, IconX, IconLayoutGrid, IconList, IconEdit, IconTrash, IconCar } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import heroImage from "@/assets/carDashboard.png";

// Expected headers: Marca, Modelo, Kilometraje, Año, Sede, Combustión, Transmisión, Tipo, PASILLO, Fotos
type CarRow = {
  Marca?: string;
  Modelo?: string;
  Kilometraje?: number | string;
  Año?: number | string;
  Sede?: string;
  Combustión?: string;
  Transmisión?: string;
  Tipo?: string;
  PASILLO?: string; // Some sheets may use all caps
  Pasillo?: string; // Other sheets may use title case
  pasillo?: string; // Be tolerant with lowercase too
  Fotos?: string;
};

type Car = {
  id: string;
  make: string;
  model: string;
  mileage: number;
  year: number | null;
  location: string;
  fuel: string;
  transmission: string;
  bodyType: string;
  aisle: number | null;
  photoUrls: string[];
  createdAt: string;
  price?: number;
};

export default function AdminCars() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<CarRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Cars from Firestore
  const [cars, setCars] = useState<Car[]>([]);
  const [loadingCars, setLoadingCars] = useState(false);
  const [assigningAisles, setAssigningAisles] = useState(false);

  // Filters for displayed cars
  const [carFilterMarca, setCarFilterMarca] = useState("");
  const [carFilterModelo, setCarFilterModelo] = useState("");
  const [carFilterAnio, setCarFilterAnio] = useState("");
  const [carFilterCombustion, setCarFilterCombustion] = useState("");
  const [carFilterTransmission, setCarFilterTransmission] = useState("");
  const [carFilterType, setCarFilterType] = useState("");
  const [carFilterLocation, setCarFilterLocation] = useState("");

  // View mode
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");

  // Edit/Delete
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    Marca: "",
    Modelo: "",
    Kilometraje: "",
    Año: "",
    Sede: "",
    Combustión: "",
    Transmisión: "",
    Tipo: "",
    PASILLO: "",
  });
  const [editPhotos, setEditPhotos] = useState<File[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  // Filters for Excel preview
  const [filterMarca, setFilterMarca] = useState("");
  const [filterModelo, setFilterModelo] = useState("");
  const [filterAnio, setFilterAnio] = useState("");

  // Manual modal form state
  const [form, setForm] = useState({
    Marca: "",
    Modelo: "",
    Kilometraje: "",
    Año: "",
    Sede: "",
    Combustión: "",
    Transmisión: "",
    Tipo: "",
    PASILLO: "",
    Fotos: "",
  });
  const [savingOne, setSavingOne] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    setLoadingCars(true);
    try {
      const q = query(collection(db, "cars"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data: Car[] = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Car));
      setCars(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingCars(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  if (!userData) return null;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage("");
    setError("");

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: CarRow[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      setRows(json);
      setMessage(`Archivo cargado: ${json.length} filas detectadas`);
    } catch (e: any) {
      setError("Error al leer el archivo Excel");
    }
  };

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const okMarca = filterMarca ? String(r.Marca || "").toLowerCase().includes(filterMarca.toLowerCase()) : true;
      const okModelo = filterModelo ? String(r.Modelo || "").toLowerCase().includes(filterModelo.toLowerCase()) : true;
      const okAnio = filterAnio ? String(r.Año || "") === filterAnio : true;
      return okMarca && okModelo && okAnio;
    });
  }, [rows, filterMarca, filterModelo, filterAnio]);

  // Safe cell getter: tolerates different capitalizations and extra spaces in headers
  const getCell = (row: Record<string, unknown>, keyLower: string): string => {
    for (const k of Object.keys(row)) {
      if (String(k).trim().toLowerCase() === keyLower) {
        const value = (row as any)[k];
        return value != null ? String(value) : "";
      }
    }
    return "";
  };

  const uploadToFirestore = async () => {
    if (!rows.length) return;
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const carsRef = collection(db, "cars");
      for (const row of rows) {
        const fotos = row.Fotos
          ? String(row.Fotos)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
        // Parse Pasillo strictly as integer; fallback to null if not a valid number
        const aisleRaw = getCell(row as Record<string, unknown>, "pasillo");
        const aisleParsed = Number.parseInt(aisleRaw.replace(/[^\d-]+/g, ""), 10);
        const aisle: number | null = Number.isFinite(aisleParsed) ? aisleParsed : null;
        await addDoc(carsRef, {
          make: row.Marca || "",
          model: row.Modelo || "",
          mileage: Number(row.Kilometraje) || 0,
          year: Number(row.Año) || null,
          location: row.Sede || "",
          fuel: row.Combustión || "",
          transmission: row.Transmisión || "",
          bodyType: row.Tipo || "",
          aisle,
          photoUrls: fotos,
          createdAt: new Date().toISOString(),
        });
      }
      setMessage(`✅ Importación exitosa: ${rows.length} autos cargados`);
      setRows([]);
    } catch (e: any) {
      setError(e?.message || "Error al subir el archivo");
    } finally {
      setLoading(false);
    }
  };

  const saveOneCar = async () => {
    setSavingOne(true);
    setMessage("");
    setError("");
    try {
      const carsRef = collection(db, "cars");
      
      // Upload photos to Firebase Storage
      const photoUrls: string[] = [];
      for (const file of uploadedPhotos) {
        const storageRef = ref(storage, `cars/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        photoUrls.push(url);
      }

      await addDoc(carsRef, {
        make: form.Marca,
        model: form.Modelo,
        mileage: Number(form.Kilometraje) || 0,
        year: Number(form.Año) || null,
        location: form.Sede,
        fuel: form.Combustión,
        transmission: form.Transmisión,
        bodyType: form.Tipo,
        aisle: (() => {
          const parsed = Number.parseInt(String(form.PASILLO).replace(/[^\d-]+/g, ""), 10);
          return Number.isFinite(parsed) ? parsed : null;
        })(),
        photoUrls,
        createdAt: new Date().toISOString(),
      });
      setMessage("✅ Auto guardado correctamente");
      setForm({ Marca: "", Modelo: "", Kilometraje: "", Año: "", Sede: "", Combustión: "", Transmisión: "", Tipo: "", PASILLO: "", Fotos: "" });
      setUploadedPhotos([]);
      setDialogOpen(false);
      fetchCars();
    } catch (e: any) {
      setError(e?.message || "Error al guardar el auto");
    } finally {
      setSavingOne(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploadedPhotos((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const removePhoto = (idx: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const filteredCars = useMemo(() => {
    return cars.filter((c) => {
      const okMarca = carFilterMarca ? c.make.toLowerCase().includes(carFilterMarca.toLowerCase()) : true;
      const okModelo = carFilterModelo ? c.model.toLowerCase().includes(carFilterModelo.toLowerCase()) : true;
      const okAnio = carFilterAnio ? String(c.year || "") === carFilterAnio : true;
      const okComb = carFilterCombustion ? c.fuel.toLowerCase() === carFilterCombustion.toLowerCase() : true;
      const okTrans = carFilterTransmission ? c.transmission.toLowerCase() === carFilterTransmission.toLowerCase() : true;
      const okType = carFilterType ? c.bodyType.toLowerCase() === carFilterType.toLowerCase() : true;
      const okLoc = carFilterLocation ? c.location.toLowerCase().includes(carFilterLocation.toLowerCase()) : true;
      return okMarca && okModelo && okAnio && okComb && okTrans && okType && okLoc;
    });
  }, [cars, carFilterMarca, carFilterModelo, carFilterAnio, carFilterCombustion, carFilterTransmission, carFilterType, carFilterLocation]);
  // Assign random aisle 1..5 to all cars (batch)
  const assignRandomAislesToAll = async () => {
    if (!cars.length) return;
    setAssigningAisles(true);
    setMessage("");
    setError("");
    try {
      const batch = writeBatch(db);
      for (const c of cars) {
        const newAisle = Math.floor(Math.random() * 5) + 1; // 1..5
        const carRef = doc(db, "cars", c.id);
        batch.update(carRef, { aisle: newAisle });
      }
      await batch.commit();
      setMessage("✅ Pasillos asignados aleatoriamente (1-5) a todos los autos");
      await fetchCars();
    } catch (e: any) {
      setError(e?.message || "Error al asignar pasillos");
    } finally {
      setAssigningAisles(false);
    }
  };

  const assignRandomPricesToAll = async () => {
    if (!cars.length) return;
    setAssigningAisles(true); // Reusar el estado
    setMessage("");
    setError("");
    try {
      const batch = writeBatch(db);
      for (const c of cars) {
        // Generar precio basado en el año y kilometraje
        const basePrice = 150000; // Precio base
        const yearFactor = c.year ? (c.year - 2000) * 10000 : 0; // Más nuevo = más caro
        const mileageFactor = c.mileage ? -Math.floor(c.mileage / 10000) * 5000 : 0; // Más km = más barato
        const randomVariation = Math.floor(Math.random() * 50000) - 25000; // +/- 25k variación
        
        const calculatedPrice = Math.max(80000, basePrice + yearFactor + mileageFactor + randomVariation);
        const roundedPrice = Math.round(calculatedPrice / 1000) * 1000; // Redondear a miles
        
        const carRef = doc(db, "cars", c.id);
        batch.update(carRef, { price: roundedPrice });
      }
      await batch.commit();
      setMessage("✅ Precios asignados aleatoriamente a todos los autos");
      await fetchCars();
    } catch (e: any) {
      setError(e?.message || "Error al asignar precios");
    } finally {
      setAssigningAisles(false);
    }
  };

  // Unique values for filters
  const uniqueMarcas = useMemo(() => [...new Set(cars.map(c => c.make).filter(Boolean))], [cars]);
  const uniqueModelos = useMemo(() => [...new Set(cars.map(c => c.model).filter(Boolean))], [cars]);
  const uniqueYears = useMemo(() => [...new Set(cars.map(c => c.year).filter(Boolean))].sort((a,b)=>Number(b)-Number(a)), [cars]);
  const uniqueFuels = useMemo(() => [...new Set(cars.map(c => c.fuel).filter(Boolean))], [cars]);
  const uniqueTransmissions = useMemo(() => [...new Set(cars.map(c => c.transmission).filter(Boolean))], [cars]);
  const uniqueTypes = useMemo(() => [...new Set(cars.map(c => c.bodyType).filter(Boolean))], [cars]);
  const uniqueLocations = useMemo(() => [...new Set(cars.map(c => c.location).filter(Boolean))], [cars]);

  // KPI summaries
  const kpi = useMemo(() => {
    const total = cars.length;
    const withPhotos = cars.filter(c => (c.photoUrls?.length || 0) > 0).length;
    const withAisle = cars.filter(c => typeof c.aisle === "number" && c.aisle != null).length;
    const uniqueMarcasCount = new Set(cars.map(c => c.make).filter(Boolean)).size;
    const photoRate = total ? Math.round((withPhotos / total) * 100) : 0;
    const aisleRate = total ? Math.round((withAisle / total) * 100) : 0;
    return { total, withPhotos, withAisle, uniqueMarcasCount, photoRate, aisleRate };
  }, [cars]);

  const openEditDialog = (car: Car) => {
    setEditingCar(car);
    setEditForm({
      Marca: car.make,
      Modelo: car.model,
      Kilometraje: String(car.mileage),
      Año: String(car.year || ""),
      Sede: car.location,
      Combustión: car.fuel,
      Transmisión: car.transmission,
      Tipo: car.bodyType,
      PASILLO: car.aisle != null ? String(car.aisle) : "",
    });
    setEditPhotos([]);
    setEditDialogOpen(true);
  };

  const saveEdit = async () => {
    if (!editingCar) return;
    setSavingEdit(true);
    setMessage("");
    setError("");
    try {
      let photoUrls = [...editingCar.photoUrls];
      for (const file of editPhotos) {
        const storageRef = ref(storage, `cars/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        photoUrls.push(url);
      }
      const carRef = doc(db, "cars", editingCar.id);
      await updateDoc(carRef, {
        make: editForm.Marca,
        model: editForm.Modelo,
        mileage: Number(editForm.Kilometraje) || 0,
        year: Number(editForm.Año) || null,
        location: editForm.Sede,
        fuel: editForm.Combustión,
        transmission: editForm.Transmisión,
        bodyType: editForm.Tipo,
        aisle: (() => {
          const parsed = Number.parseInt(String(editForm.PASILLO).replace(/[^\d-]+/g, ""), 10);
          return Number.isFinite(parsed) ? parsed : null;
        })(),
        photoUrls,
      });
      setMessage("✅ Auto actualizado correctamente");
      setEditDialogOpen(false);
      fetchCars();
    } catch (e: any) {
      setError(e?.message || "Error al actualizar el auto");
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteCar = async (carId: string) => {
    if (!confirm("¿Seguro que deseas eliminar este auto?")) return;
    try {
      await deleteDoc(doc(db, "cars", carId));
      setMessage("✅ Auto eliminado correctamente");
      fetchCars();
    } catch (e: any) {
      setError(e?.message || "Error al eliminar el auto");
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
            <h1 className="text-lg font-semibold">Gestión de Carros</h1>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          {/* Hero Header */}
          <Card className="p-8 relative overflow-hidden border-none bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <div className="text-xs/5 uppercase tracking-wide opacity-80">Inventario</div>
                <h2 className="text-2xl md:text-4xl font-bold mt-1">Gestión de Carros</h2>
                <p className="mt-3 text-sm md:text-base opacity-90 max-w-2xl">
                  Importa desde Excel, agrega fotos y administra el inventario con filtros avanzados.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <label htmlFor="file-upload">
                    <Button variant="secondary" className="cursor-pointer text-blue-700">
                      <IconUpload className="h-4 w-4 mr-2" />
                      Cargar Excel
                    </Button>
                  </label>
                  <Button variant="secondary" className="text-blue-700" onClick={assignRandomAislesToAll} disabled={assigningAisles || !cars.length}>
                    {assigningAisles ? "Asignando..." : "Asignar pasillos 1–5"}
                  </Button>
                  <Button variant="secondary" className="text-green-700" onClick={assignRandomPricesToAll} disabled={assigningAisles || !cars.length}>
                    {assigningAisles ? "Asignando..." : "💰 Asignar precios"}
                  </Button>
                </div>
              </div>
              <img
                src={heroImage}
                alt="Cars hero"
                className="hidden md:block h-40 md:h-40  shrink-0"
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
              <div className="text-xs text-muted-foreground uppercase">Autos Totales</div>
              <div className="text-2xl font-bold mt-1">{kpi.total}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground uppercase">Con Foto</div>
              <div className="text-2xl font-bold mt-1">{kpi.withPhotos}</div>
              <div className="text-xs text-muted-foreground mt-1">{kpi.photoRate}% cobertura</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground uppercase">Con Pasillo</div>
              <div className="text-2xl font-bold mt-1">{kpi.withAisle}</div>
              <div className="text-xs text-muted-foreground mt-1">{kpi.aisleRate}% asignado</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground uppercase">Marcas Únicas</div>
              <div className="text-2xl font-bold mt-1">{kpi.uniqueMarcasCount}</div>
            </Card>
          </div>
          {/* Actions bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <input id="file-upload" type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
              <label htmlFor="file-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>
                    <IconUpload className="h-4 w-4 mr-2" />
                    Cargar Excel
                  </span>
                </Button>
              </label>
            </div>
            <Button onClick={uploadToFirestore} disabled={!rows.length || loading}>
              {loading ? "Subiendo..." : `Subir ${rows.length || 0} carros`}
            </Button>

            {/* Manual add modal trigger */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default">
                  <IconPlus className="h-4 w-4 mr-2" /> Agregar auto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Agregar Auto Nuevo</DialogTitle>
                  <DialogDescription>
                    Completa todos los campos para agregar un auto al inventario
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="Marca">Marca *</Label>
                      <Input id="Marca" value={form.Marca} onChange={(e) => setForm((f) => ({ ...f, Marca: e.target.value }))} placeholder="Ej: Toyota" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="Modelo">Modelo *</Label>
                      <Input id="Modelo" value={form.Modelo} onChange={(e) => setForm((f) => ({ ...f, Modelo: e.target.value }))} placeholder="Ej: Corolla" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="Año">Año *</Label>
                      <Input id="Año" type="number" value={form.Año} onChange={(e) => setForm((f) => ({ ...f, Año: e.target.value }))} placeholder="2020" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="Kilometraje">Kilometraje (km)</Label>
                      <Input id="Kilometraje" type="number" value={form.Kilometraje} onChange={(e) => setForm((f) => ({ ...f, Kilometraje: e.target.value }))} placeholder="50000" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="Combustión">Combustión</Label>
                      <Input id="Combustión" value={form.Combustión} onChange={(e) => setForm((f) => ({ ...f, Combustión: e.target.value }))} placeholder="Gasolina" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="Transmisión">Transmisión</Label>
                      <Input id="Transmisión" value={form.Transmisión} onChange={(e) => setForm((f) => ({ ...f, Transmisión: e.target.value }))} placeholder="Manual" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="Tipo">Tipo</Label>
                      <Input id="Tipo" value={form.Tipo} onChange={(e) => setForm((f) => ({ ...f, Tipo: e.target.value }))} placeholder="Sedán" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="Sede">Sede</Label>
                      <Input id="Sede" value={form.Sede} onChange={(e) => setForm((f) => ({ ...f, Sede: e.target.value }))} placeholder="CDMX Norte" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="PASILLO">Pasillo</Label>
                    <Input id="PASILLO" type="number" value={form.PASILLO} onChange={(e) => setForm((f) => ({ ...f, PASILLO: e.target.value }))} placeholder="12" />
                  </div>
                  
                  {/* Photo upload */}
                  <div className="space-y-2">
                    <Label htmlFor="photos">Fotos del Auto</Label>
                    <div className="flex gap-2">
                      <input id="photos" type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" />
                      <label htmlFor="photos">
                        <Button type="button" variant="outline" asChild>
                          <span>
                            <IconPhoto className="h-4 w-4 mr-2" />
                            Seleccionar fotos
                          </span>
                        </Button>
                      </label>
                    </div>
                    {uploadedPhotos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {uploadedPhotos.map((file, idx) => (
                          <div key={idx} className="relative">
                            <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-24 object-cover rounded-md" />
                            <button
                              type="button"
                              onClick={() => removePhoto(idx)}
                              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                            >
                              <IconX className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={saveOneCar} disabled={savingOne}>
                    {savingOne ? "Guardando..." : "Guardar Auto"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {(message || error) && (
            <div>
              {message && (
                <div className="flex items-center gap-2 text-sm text-green-600"><IconCheck className="h-4 w-4" />{message}</div>
              )}
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive"><IconAlertCircle className="h-4 w-4" />{error}</div>
              )}
            </div>
          )}

          {/* Filters */}
          {!!rows.length && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Filtros (Vista Previa Excel)</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label htmlFor="f-marca">Marca</Label>
                  <Input id="f-marca" value={filterMarca} onChange={(e)=>setFilterMarca(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="f-modelo">Modelo</Label>
                  <Input id="f-modelo" value={filterModelo} onChange={(e)=>setFilterModelo(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="f-anio">Año</Label>
                  <Input id="f-anio" value={filterAnio} onChange={(e)=>setFilterAnio(e.target.value)} />
                </div>
              </div>
            </Card>
          )}

          {/* Filtros para carros guardados */}
          {!!cars.length && (
            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">Filtros de Inventario</h3>
                    <p className="text-sm text-muted-foreground">Filtra y busca entre {cars.length} autos</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline"
                      disabled={assigningAisles || !cars.length}
                      onClick={assignRandomAislesToAll}
                      className="whitespace-nowrap"
                    >
                      {assigningAisles ? "Asignando pasillos..." : "Asignar pasillos 1–5"}
                    </Button>
                  <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)} className="border">
                    <ToggleGroupItem value="cards" aria-label="Vista en tarjetas" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                      <IconLayoutGrid className="h-4 w-4 mr-2" />
                      Cards
                    </ToggleGroupItem>
                    <ToggleGroupItem value="list" aria-label="Vista en lista" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                      <IconList className="h-4 w-4 mr-2" />
                      Lista
                    </ToggleGroupItem>
                  </ToggleGroup>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="car-f-marca" className="text-xs font-semibold uppercase text-muted-foreground">Marca</Label>
                    <Select value={carFilterMarca} onValueChange={setCarFilterMarca}>
                      <SelectTrigger id="car-f-marca" className="h-10">
                        <SelectValue placeholder="Todas las marcas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todas las marcas</SelectItem>
                        {uniqueMarcas.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="car-f-modelo" className="text-xs font-semibold uppercase text-muted-foreground">Modelo</Label>
                    <Select value={carFilterModelo} onValueChange={setCarFilterModelo}>
                      <SelectTrigger id="car-f-modelo" className="h-10">
                        <SelectValue placeholder="Todos los modelos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todos los modelos</SelectItem>
                        {uniqueModelos.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="car-f-anio" className="text-xs font-semibold uppercase text-muted-foreground">Año</Label>
                    <Select value={carFilterAnio} onValueChange={setCarFilterAnio}>
                      <SelectTrigger id="car-f-anio" className="h-10">
                        <SelectValue placeholder="Todos los años" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todos los años</SelectItem>
                        {uniqueYears.map((y) => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="car-f-fuel" className="text-xs font-semibold uppercase text-muted-foreground">Combustible</Label>
                    <Select value={carFilterCombustion} onValueChange={setCarFilterCombustion}>
                      <SelectTrigger id="car-f-fuel" className="h-10">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todos</SelectItem>
                        {uniqueFuels.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="car-f-trans" className="text-xs font-semibold uppercase text-muted-foreground">Transmisión</Label>
                    <Select value={carFilterTransmission} onValueChange={setCarFilterTransmission}>
                      <SelectTrigger id="car-f-trans" className="h-10">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todas</SelectItem>
                        {uniqueTransmissions.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="car-f-type" className="text-xs font-semibold uppercase text-muted-foreground">Tipo</Label>
                    <Select value={carFilterType} onValueChange={setCarFilterType}>
                      <SelectTrigger id="car-f-type" className="h-10">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todos</SelectItem>
                        {uniqueTypes.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="car-f-loc" className="text-xs font-semibold uppercase text-muted-foreground">Sede</Label>
                    <Select value={carFilterLocation} onValueChange={setCarFilterLocation}>
                      <SelectTrigger id="car-f-loc" className="h-10">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todas</SelectItem>
                        {uniqueLocations.map((l) => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      className="w-full h-10"
                      onClick={() => {
                        setCarFilterMarca("");
                        setCarFilterModelo("");
                        setCarFilterAnio("");
                        setCarFilterCombustion("");
                        setCarFilterTransmission("");
                        setCarFilterType("");
                        setCarFilterLocation("");
                      }}
                    >
                      Limpiar filtros
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Cars grid or list */}
          {loadingCars && <div className="text-center py-8">Cargando inventario...</div>}
          {!loadingCars && filteredCars.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Inventario ({filteredCars.length} autos)</h3>
              
              {viewMode === "cards" ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredCars.map((car) => (
                    <Card key={car.id} className="overflow-hidden">
                      {car.photoUrls.length > 0 ? (
                        <img src={car.photoUrls[0]} alt={`${car.make} ${car.model}`} className="w-full h-48 object-cover" />
                      ) : (
                        <div className="relative w-full h-48 bg-gradient-to-br from-muted to-muted/50 flex flex-col items-center justify-center gap-3 group">
                          <IconCar className="h-16 w-16 text-muted-foreground/40" />
                          <input 
                            type="file" 
                            accept="image/*" 
                            multiple
                            id={`quick-upload-${car.id}`}
                            className="hidden"
                            onChange={async (e) => {
                              const files = e.target.files;
                              if (!files || files.length === 0) return;
                              try {
                                const photoUrls: string[] = [];
                                for (const file of Array.from(files)) {
                                  const storageRef = ref(storage, `cars/${Date.now()}_${file.name}`);
                                  await uploadBytes(storageRef, file);
                                  const url = await getDownloadURL(storageRef);
                                  photoUrls.push(url);
                                }
                                const carRef = doc(db, "cars", car.id);
                                await updateDoc(carRef, { photoUrls });
                                setMessage("✅ Fotos agregadas correctamente");
                                fetchCars();
                              } catch (err: any) {
                                setError(err?.message || "Error al subir fotos");
                              }
                            }}
                          />
                          <label htmlFor={`quick-upload-${car.id}`}>
                            <Button type="button" size="sm" variant="secondary" className="cursor-pointer" asChild>
                              <span>
                                <IconPhoto className="h-4 w-4 mr-2" />
                                Subir foto
                              </span>
                            </Button>
                          </label>
                        </div>
                      )}
                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-lg">{car.make} {car.model}</h4>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openEditDialog(car)}>
                              <IconEdit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteCar(car.id)}>
                              <IconTrash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div><span className="font-semibold">Año:</span> {car.year || "N/A"}</div>
                          <div><span className="font-semibold">KM:</span> {car.mileage.toLocaleString()}</div>
                          <div><span className="font-semibold">Combustible:</span> {car.fuel || "N/A"}</div>
                          <div><span className="font-semibold">Transmisión:</span> {car.transmission || "N/A"}</div>
                          <div><span className="font-semibold">Tipo:</span> {car.bodyType || "N/A"}</div>
                          <div><span className="font-semibold">Sede:</span> {car.location || "N/A"}</div>
                          {car.aisle && <div className="col-span-2"><span className="font-semibold">Pasillo:</span> {car.aisle}</div>}
                        </div>
                        {car.photoUrls.length > 1 && (
                          <div className="text-xs text-muted-foreground pt-2">
                            +{car.photoUrls.length - 1} foto(s) más
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-3 text-left font-semibold">Foto</th>
                          <th className="p-3 text-left font-semibold">Marca</th>
                          <th className="p-3 text-left font-semibold">Modelo</th>
                          <th className="p-3 text-left font-semibold">Año</th>
                          <th className="p-3 text-left font-semibold">KM</th>
                          <th className="p-3 text-left font-semibold">Combustible</th>
                          <th className="p-3 text-left font-semibold">Transmisión</th>
                          <th className="p-3 text-left font-semibold">Tipo</th>
                          <th className="p-3 text-left font-semibold">Sede</th>
                          <th className="p-3 text-left font-semibold">Pasillo</th>
                          <th className="p-3 text-left font-semibold">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCars.map((car) => (
                          <tr key={car.id} className="border-b hover:bg-muted/50">
                            <td className="p-3">
                              {car.photoUrls.length > 0 ? (
                                <div className="relative group">
                                  <img src={car.photoUrls[0]} alt={car.make} className="w-16 h-16 object-cover rounded" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      multiple
                                      id={`list-upload-${car.id}`}
                                      className="hidden"
                                      onChange={async (e) => {
                                        const files = e.target.files;
                                        if (!files || files.length === 0) return;
                                        try {
                                          const photoUrls: string[] = [];
                                          for (const file of Array.from(files)) {
                                            const storageRef = ref(storage, `cars/${Date.now()}_${file.name}`);
                                            await uploadBytes(storageRef, file);
                                            const url = await getDownloadURL(storageRef);
                                            photoUrls.push(url);
                                          }
                                          const carRef = doc(db, "cars", car.id);
                                          await updateDoc(carRef, { photoUrls });
                                          setMessage("✅ Fotos agregadas correctamente");
                                          fetchCars();
                                        } catch (err: any) {
                                          setError(err?.message || "Error al subir fotos");
                                        }
                                      }}
                                    />
                                    <label htmlFor={`list-upload-${car.id}`}>
                                      <Button type="button" size="sm" variant="secondary" className="cursor-pointer h-8 px-2" asChild>
                                        <span>
                                          <IconPlus className="h-3 w-3" />
                                        </span>
                                      </Button>
                                    </label>
                                  </div>
                                </div>
                              ) : (
                                <div className="relative w-16 h-16 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center rounded group">
                                  <IconCar className="h-8 w-8 text-muted-foreground/40 absolute" />
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    multiple
                                    id={`list-upload-empty-${car.id}`}
                                    className="hidden"
                                    onChange={async (e) => {
                                      const files = e.target.files;
                                      if (!files || files.length === 0) return;
                                      try {
                                        const photoUrls: string[] = [];
                                        for (const file of Array.from(files)) {
                                          const storageRef = ref(storage, `cars/${Date.now()}_${file.name}`);
                                          await uploadBytes(storageRef, file);
                                          const url = await getDownloadURL(storageRef);
                                          photoUrls.push(url);
                                        }
                                        const carRef = doc(db, "cars", car.id);
                                        await updateDoc(carRef, { photoUrls });
                                        setMessage("✅ Fotos agregadas correctamente");
                                        fetchCars();
                                      } catch (err: any) {
                                        setError(err?.message || "Error al subir fotos");
                                      }
                                    }}
                                  />
                                  <label htmlFor={`list-upload-empty-${car.id}`} className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded">
                                    <Button type="button" size="sm" variant="secondary" className="pointer-events-none h-8 px-2" asChild>
                                      <span>
                                        <IconPhoto className="h-3 w-3" />
                                      </span>
                                    </Button>
                                  </label>
                                </div>
                              )}
                            </td>
                            <td className="p-3">{car.make}</td>
                            <td className="p-3">{car.model}</td>
                            <td className="p-3">{car.year || "N/A"}</td>
                            <td className="p-3">{car.mileage.toLocaleString()}</td>
                            <td className="p-3">{car.fuel || "N/A"}</td>
                            <td className="p-3">{car.transmission || "N/A"}</td>
                            <td className="p-3">{car.bodyType || "N/A"}</td>
                            <td className="p-3">{car.location || "N/A"}</td>
                            <td className="p-3">{car.aisle || "N/A"}</td>
                            <td className="p-3">
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => openEditDialog(car)}>
                                  <IconEdit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => deleteCar(car.id)}>
                                  <IconTrash className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Preview table */}
          {!!filteredRows.length && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Vista Previa (Excel)</h3>
              <div className="overflow-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left border-b">
                      {Object.keys(filteredRows[0]).map((h) => (
                        <th key={h} className="p-2 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.slice(0, 20).map((r, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        {Object.keys(filteredRows[0]).map((h) => (
                          <td key={h} className="p-2 align-top">{String((r as any)[h] ?? "")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="pt-3 text-xs text-muted-foreground">
                  Mostrando primeras 20 filas de {filteredRows.length} filtradas (total {rows.length})
                </div>
              </div>
            </Card>
          )}
        </div>
      </SidebarInset>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Auto</DialogTitle>
            <DialogDescription>
              Actualiza la información del auto
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-Marca">Marca *</Label>
                <Input id="edit-Marca" value={editForm.Marca} onChange={(e) => setEditForm((f) => ({ ...f, Marca: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-Modelo">Modelo *</Label>
                <Input id="edit-Modelo" value={editForm.Modelo} onChange={(e) => setEditForm((f) => ({ ...f, Modelo: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-Año">Año *</Label>
                <Input id="edit-Año" type="number" value={editForm.Año} onChange={(e) => setEditForm((f) => ({ ...f, Año: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-Kilometraje">Kilometraje (km)</Label>
                <Input id="edit-Kilometraje" type="number" value={editForm.Kilometraje} onChange={(e) => setEditForm((f) => ({ ...f, Kilometraje: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-Combustión">Combustión</Label>
                <Input id="edit-Combustión" value={editForm.Combustión} onChange={(e) => setEditForm((f) => ({ ...f, Combustión: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-Transmisión">Transmisión</Label>
                <Input id="edit-Transmisión" value={editForm.Transmisión} onChange={(e) => setEditForm((f) => ({ ...f, Transmisión: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-Tipo">Tipo</Label>
                <Input id="edit-Tipo" value={editForm.Tipo} onChange={(e) => setEditForm((f) => ({ ...f, Tipo: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-Sede">Sede</Label>
                <Input id="edit-Sede" value={editForm.Sede} onChange={(e) => setEditForm((f) => ({ ...f, Sede: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-PASILLO">Pasillo</Label>
              <Input id="edit-PASILLO" type="number" value={editForm.PASILLO} onChange={(e) => setEditForm((f) => ({ ...f, PASILLO: e.target.value }))} />
            </div>
            
            {/* Existing photos */}
            {editingCar && editingCar.photoUrls.length > 0 && (
              <div className="space-y-2">
                <Label>Fotos Actuales</Label>
                <div className="grid grid-cols-3 gap-2">
                  {editingCar.photoUrls.map((url, idx) => (
                    <img key={idx} src={url} alt={`Foto ${idx+1}`} className="w-full h-24 object-cover rounded-md" />
                  ))}
                </div>
              </div>
            )}

            {/* Add new photos */}
            <div className="space-y-2">
              <Label htmlFor="edit-photos">Agregar Fotos Nuevas</Label>
              <div className="flex gap-2">
                <input id="edit-photos" type="file" accept="image/*" multiple onChange={(e) => {
                  const files = e.target.files;
                  if (files) setEditPhotos((prev) => [...prev, ...Array.from(files)]);
                }} className="hidden" />
                <label htmlFor="edit-photos">
                  <Button type="button" variant="outline" asChild>
                    <span>
                      <IconPhoto className="h-4 w-4 mr-2" />
                      Seleccionar fotos
                    </span>
                  </Button>
                </label>
              </div>
              {editPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {editPhotos.map((file, idx) => (
                    <div key={idx} className="relative">
                      <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-24 object-cover rounded-md" />
                      <button
                        type="button"
                        onClick={() => setEditPhotos((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <IconX className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={saveEdit} disabled={savingEdit}>
              {savingEdit ? "Actualizando..." : "Actualizar Auto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
