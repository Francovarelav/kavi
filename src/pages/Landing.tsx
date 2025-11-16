import { useState, useEffect, useRef } from 'react'
import kavakLogo from '../assets/kavakBlack.png'
import { 
  Bot, BarChart3, Users, Shield, Zap, ArrowRight, 
  AlertCircle, TrendingUp, MessageSquare, Settings, Clock, Target, 
  Database, Globe, Lock, Activity, FileText, GitBranch,
  Mic, Send, Car, Building2, UserCheck, LineChart
} from 'lucide-react'

// Counter Component with animation
function Counter({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      setCount(Math.floor(progress * end))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame)
  }, [isVisible, end, duration])

  return <div ref={ref}>{count}{suffix}</div>
}

function Landing() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-xl z-50 border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-3">
            <img src={kavakLogo} alt="Kavak" className="h-8 w-auto" />
            <span className="text-2xl font-bold text-slate-800">
              Kavi <span className="text-blue-600">AI</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#platforms" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">Plataformas</a>
            <a href="#vendor" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">Vendedor</a>
            <a href="#admin" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">Admin</a>
            <a href="#benefits" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">Beneficios</a>
            <button className="px-6 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 font-semibold transform hover:scale-105 hover:shadow-lg transition-all duration-300 flex items-center gap-2">
              Acceder
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className={`text-center space-y-8 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm font-semibold mb-4">
              <Lock className="w-4 h-4" />
              Plataforma Interna Kavak • 100% Equipo Interno
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight text-slate-900">
              Dos Plataformas Poderosas
              <br />
              <span className="text-blue-600">
                para tu Equipo de Ventas
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
              Herramientas internas de IA para que <strong>vendedores</strong> gestionen clientes 
              y <strong>administradores</strong> controlen toda la operación de Kavak.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button className="group px-8 py-4 bg-blue-600 text-white rounded-full font-semibold text-lg hover:bg-blue-700 hover:shadow-xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2">
                Plataforma Vendedor
                <Users className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 bg-white text-slate-700 rounded-full font-semibold text-lg border-2 border-slate-200 hover:border-blue-500 hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-2">
                Plataforma Admin
                <BarChart3 className="w-5 h-5" />
              </button>
            </div>

            {/* Key Info */}
            <div className="pt-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 max-w-3xl mx-auto">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                <div className="text-left">
                  <h3 className="font-bold text-amber-900 mb-2">Importante: Uso Exclusivo Interno</h3>
                  <p className="text-amber-700 text-sm">
                    Estas plataformas son herramientas internas para el <strong>equipo de Kavak</strong>. 
                    No son de cara al cliente final. Los vendedores las usan para dar mejor servicio a sus clientes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section with Counter */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                <Counter end={2} />
              </div>
              <div className="text-slate-600 font-medium">Plataformas</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                <Counter end={75} suffix="%" />
              </div>
              <div className="text-slate-600 font-medium">Más Rápido</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                <Counter end={24} suffix="/7" />
              </div>
              <div className="text-slate-600 font-medium">Disponibilidad</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                <Counter end={100} suffix="%" />
              </div>
              <div className="text-slate-600 font-medium">Interno Leno</div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Platforms Overview */}
      <section id="platforms" className="py-20 px-6 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Dos Plataformas, Un Objetivo 🎯
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Herramientas especializadas para cada rol en tu equipo de ventas
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Platform 1: Vendor */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-10 text-white shadow-2xl transform hover:scale-105 transition-all duration-500">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold mb-4">
                Plataforma del Vendedor
              </h3>
              <p className="text-blue-50 mb-6 leading-relaxed">
                Herramienta para que <strong>vendedores de Kavak</strong> gestionen y den 
                seguimiento personalizado a sus clientes usando IA conversacional.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Mic className="w-4 h-4" />
                  </div>
                  <span className="text-sm">Envía audio o texto</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Car className="w-4 h-4" />
                  </div>
                  <span className="text-sm">Recomendaciones por sucursal</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-sm">Cotizaciones súper rápidas</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <GitBranch className="w-4 h-4" />
                  </div>
                  <span className="text-sm">Sincroniza con Portal Leno</span>
                </div>
              </div>

              <button className="w-full px-6 py-3 bg-white text-blue-600 rounded-full font-semibold hover:shadow-xl transform hover:scale-105 transition-all">
                Ver más →
              </button>
            </div>

            {/* Platform 2: Admin */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-10 text-white shadow-2xl transform hover:scale-105 transition-all duration-500">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold mb-4">
                Plataforma Admin
              </h3>
              <p className="text-purple-50 mb-6 leading-relaxed">
                Dashboard para que <strong>administradores</strong> gestionen reglas, 
                vean contexto completo y supervisen toda la operación.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <span className="text-sm">Ve contexto de todos los vendedores</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="text-sm">Configura reglas de negocio</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <LineChart className="w-4 h-4" />
                  </div>
                  <span className="text-sm">Analytics y reportes</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Database className="w-4 h-4" />
                  </div>
                  <span className="text-sm">Administra inventario</span>
                </div>
              </div>

              <button className="w-full px-6 py-3 bg-white text-purple-600 rounded-full font-semibold hover:shadow-xl transform hover:scale-105 transition-all">
                Ver más →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Vendor Platform - Detailed */}
      <section id="vendor" className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
              <Users className="w-4 h-4" />
              Plataforma 1
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Plataforma del Vendedor 👨‍💼
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Tu asistente IA para dar seguimiento personalizado a cada cliente
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-6">
                ¿Cómo funciona?
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-blue-600">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-2">Cliente te contacta</h4>
                    <p className="text-slate-600 text-sm">
                      Recibes consulta por llamada, WhatsApp o presencial. Abres la plataforma Kavi AI.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-blue-600">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-2">Envías audio o texto</h4>
                    <p className="text-slate-600 text-sm">
                      Describes lo que busca el cliente: "SUV familiar, presupuesto $500k, para ciudad"
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-blue-600">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-2">Kavi AI procesa y recomienda</h4>
                    <p className="text-slate-600 text-sm">
                      Recibes 3-5 opciones de autos de <strong>tu sucursal</strong> que coinciden con el perfil.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-blue-600">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-2">Generas cotización rápida</h4>
                    <p className="text-slate-600 text-sm">
                      Un clic y la cotización se envía automáticamente al <strong>Portal Leno</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                      <Bot className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Kavi AI</div>
                      <div className="text-blue-100 text-sm">Asistente de ventas</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="bg-white rounded-xl p-3 text-sm text-slate-700">
                      ¿Qué busca tu cliente?
                    </div>
                    <div className="bg-blue-100 rounded-xl p-3 text-sm text-slate-700 ml-8 flex items-center gap-2">
                      <Mic className="w-4 h-4 text-blue-600" />
                      <span className="italic">"SUV familiar, $500k, ciudad..."</span>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-sm text-slate-700">
                      <div className="font-semibold mb-2">✨ Recomendaciones para ti:</div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <Car className="w-3 h-3" />
                          <span>Honda CR-V 2021 - $480k</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Car className="w-3 h-3" />
                          <span>Mazda CX-5 2020 - $450k</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Car className="w-3 h-3" />
                          <span>Toyota RAV4 2021 - $520k</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button className="w-full px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg transition-all">
                    <Send className="w-4 h-4" />
                    Generar Cotización
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Vendor Features */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <Building2 className="w-10 h-10 text-blue-600 mb-4" />
              <h4 className="font-bold text-slate-900 mb-2">Por Sucursal</h4>
              <p className="text-slate-600 text-sm">
                Solo ves y recomiendas autos de tu sucursal asignada.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <Target className="w-10 h-10 text-blue-600 mb-4" />
              <h4 className="font-bold text-slate-900 mb-2">Personalizado</h4>
              <p className="text-slate-600 text-sm">
                Cada recomendación se adapta al perfil específico del cliente.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <Clock className="w-10 h-10 text-blue-600 mb-4" />
              <h4 className="font-bold text-slate-900 mb-2">75% Más Rápido</h4>
              <p className="text-slate-600 text-sm">
                Genera cotizaciones en segundos vs. proceso manual tradicional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Platform - Detailed */}
      <section id="admin" className="py-20 px-6 bg-gradient-to-b from-white to-purple-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
              <BarChart3 className="w-4 h-4" />
              Plataforma 2
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Plataforma Admin 📊
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Control total de la operación, reglas y análisis
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="text-white font-semibold mb-4">Dashboard Admin</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/20 rounded-xl p-4">
                      <Users className="w-6 h-6 text-white mb-2" />
                      <div className="text-2xl font-bold text-white"><Counter end={24} /></div>
                      <div className="text-purple-100 text-sm">Vendedores</div>
                    </div>
                    <div className="bg-white/20 rounded-xl p-4">
                      <MessageSquare className="w-6 h-6 text-white mb-2" />
                      <div className="text-2xl font-bold text-white"><Counter end={156} /></div>
                      <div className="text-purple-100 text-sm">Conversaciones</div>
                    </div>
                    <div className="bg-white/20 rounded-xl p-4">
                      <FileText className="w-6 h-6 text-white mb-2" />
                      <div className="text-2xl font-bold text-white"><Counter end={42} /></div>
                      <div className="text-purple-100 text-sm">Reglas Activas</div>
                    </div>
                    <div className="bg-white/20 rounded-xl p-4">
                      <TrendingUp className="w-6 h-6 text-white mb-2" />
                      <div className="text-2xl font-bold text-white"><Counter end={89} suffix="%" /></div>
                      <div className="text-purple-100 text-sm">Efectividad</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-6">
                ¿Qué puedes hacer?
              </h3>
              
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3">
                    <Globe className="w-6 h-6 text-purple-600 mt-1" />
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">Ver Contexto Completo</h4>
                      <p className="text-slate-600 text-sm">
                        Accede a todas las conversaciones de todos los vendedores. Ve el contexto completo de cada cliente.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3">
                    <Settings className="w-6 h-6 text-purple-600 mt-1" />
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">Gestionar Reglas</h4>
                      <p className="text-slate-600 text-sm">
                        Crea, edita y elimina reglas de afinidad, financiamiento y límites. Cambios en tiempo real.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3">
                    <LineChart className="w-6 h-6 text-purple-600 mt-1" />
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">Analytics Avanzados</h4>
                      <p className="text-slate-600 text-sm">
                        Métricas de desempeño por vendedor, análisis de conversiones, reportes detallados.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3">
                    <Database className="w-6 h-6 text-purple-600 mt-1" />
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">Administrar Inventario</h4>
                      <p className="text-slate-600 text-sm">
                        CRUD completo de autos, gestión de vendedores, configuración de sucursales.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Features */}
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">
              Control Total de la Operación
            </h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div className="font-semibold text-slate-900">Monitoreo</div>
                <div className="text-sm text-slate-600">Tiempo real</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="font-semibold text-slate-900">Auditoría</div>
                <div className="text-sm text-slate-600">Completa</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <GitBranch className="w-6 h-6 text-white" />
                </div>
                <div className="font-semibold text-slate-900">Integración</div>
                <div className="text-sm text-slate-600">Portal Leno</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <div className="font-semibold text-slate-900">Permisos</div>
                <div className="text-sm text-slate-600">Por rol</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Leno */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center text-white mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-white text-sm font-semibold mb-4">
              <GitBranch className="w-4 h-4" />
              Integración Crítica
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Sincronización con Portal Leno 🔗
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Cotizaciones automáticas para cada cliente
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-white font-bold mb-2">Vendedor Genera</h3>
                <p className="text-blue-100 text-sm">
                  Cotización creada en Kavi AI para un cliente específico
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <GitBranch className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-white font-bold mb-2">Sincronización Auto</h3>
                <p className="text-blue-100 text-sm">
                  Se envía automáticamente al Portal Leno en tiempo real
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-white font-bold mb-2">Admin Visualiza</h3>
                <p className="text-blue-100 text-sm">
                  Disponible en ambos sistemas para seguimiento completo
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Beneficios para tu Equipo ✨
            </h2>
            <p className="text-xl text-slate-600">
              Por qué implementar Kavi AI en Kavak
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white transform hover:scale-105 hover:shadow-2xl transition-all duration-300">
              <Zap className="w-10 h-10 mb-4" />
              <h3 className="text-xl font-bold mb-3">75% Más Rápido</h3>
              <p className="text-blue-50">
                Cotizaciones en segundos vs. proceso manual tradicional.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-8 text-white transform hover:scale-105 hover:shadow-2xl transition-all duration-300">
              <Target className="w-10 h-10 mb-4" />
              <h3 className="text-xl font-bold mb-3">Recomendaciones Precisas</h3>
              <p className="text-purple-50">
                IA entrenada con reglas de negocio para mejores resultados.
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-8 text-white transform hover:scale-105 hover:shadow-2xl transition-all duration-300">
              <UserCheck className="w-10 h-10 mb-4" />
              <h3 className="text-xl font-bold mb-3">Seguimiento Personalizado</h3>
              <p className="text-pink-50">
                Cada vendedor gestiona sus clientes con contexto completo.
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl p-8 text-white transform hover:scale-105 hover:shadow-2xl transition-all duration-300">
              <Activity className="w-10 h-10 mb-4" />
              <h3 className="text-xl font-bold mb-3">Trazabilidad Total</h3>
              <p className="text-cyan-50">
                Auditoría completa de todas las acciones y conversaciones.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 text-white transform hover:scale-105 hover:shadow-2xl transition-all duration-300">
              <Settings className="w-10 h-10 mb-4" />
              <h3 className="text-xl font-bold mb-3">Reglas Flexibles</h3>
              <p className="text-green-50">
                Admins configuran y ajustan reglas en tiempo real.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 text-white transform hover:scale-105 hover:shadow-2xl transition-all duration-300">
              <GitBranch className="w-10 h-10 mb-4" />
              <h3 className="text-xl font-bold mb-3">Integración Leno</h3>
              <p className="text-orange-50">
                Sincronización automática bidireccional con Portal Leno.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            ¿Listo para potenciar tu equipo? 🚀
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Únete al equipo interno de Kavak y experimenta el poder de Kavi AI
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="px-8 py-4 bg-white text-blue-600 rounded-full font-semibold text-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Plataforma Vendedor
            </button>
            <button className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-semibold text-lg hover:bg-white/10 transform hover:scale-105 transition-all duration-300 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Plataforma Admin
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src={kavakLogo} alt="Kavak" className="h-6 w-auto brightness-0 invert" />
                <span className="text-xl font-bold text-white">Kavi AI</span>
              </div>
              <p className="text-slate-400 text-sm">
                Plataformas internas de Kavak para optimización de ventas con IA.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Plataformas</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>Plataforma Vendedor</li>
                <li>Plataforma Admin</li>
                <li>Integración Portal Leno</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contacto</h4>
              <p className="text-sm text-slate-400">
                Para dudas o mejoras, contactar al equipo interno Kavak/product.
              </p>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-500">
            © 2024 Kavak • Plataformas Internas • 100% Equipo Interno
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing

