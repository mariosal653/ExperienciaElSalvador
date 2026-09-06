'use client'

import { useMemo, useState } from 'react'
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Compass,
  Heart,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Waves,
  X,
} from 'lucide-react'

const experiences = [
  { title: 'Volcán de Santa Ana', place: 'Santa Ana', price: '$45', rating: '4.9', reviews: '128', duration: '8 horas', image: 'https://images.unsplash.com/photo-1565372195458-9de0b320ef04?auto=format&fit=crop&w=900&q=85', tag: 'Más reservado' },
  { title: 'Atardecer en El Tunco', place: 'La Libertad', price: '$38', rating: '4.8', reviews: '94', duration: '4 horas', image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=900&q=85', tag: 'Favorito local' },
  { title: 'Ruta de las Flores', place: 'Sonsonate', price: '$52', rating: '4.9', reviews: '76', duration: '10 horas', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85', tag: 'Escapada' },
  { title: 'Lago de Coatepeque', place: 'Santa Ana', price: '$42', rating: '4.7', reviews: '61', duration: '6 horas', image: 'https://images.unsplash.com/photo-1439853949127-fa647821eba0?auto=format&fit=crop&w=900&q=85', tag: 'Naturaleza' },
]

const categories = [
  { label: 'Playas', icon: Waves, image: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=600&q=80' },
  { label: 'Volcanes', icon: Compass, image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80' },
  { label: 'Cultura', icon: Sparkles, image: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=600&q=80' },
  { label: 'Aventura', icon: ShieldCheck, image: 'https://images.unsplash.com/photo-1526481280695-3c687fd643ed?auto=format&fit=crop&w=600&q=80' },
]

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [language, setLanguage] = useState('ES')
  const [activeCategory, setActiveCategory] = useState('Todo')
  const [favorites, setFavorites] = useState<number[]>([])
  const [query, setQuery] = useState('')
  const [searchSent, setSearchSent] = useState(false)

  const filteredExperiences = useMemo(() => {
    if (!query.trim()) return experiences
    return experiences.filter((item) => `${item.title} ${item.place}`.toLowerCase().includes(query.toLowerCase()))
  }, [query])

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#173f45]">
      <header className="absolute inset-x-0 top-0 z-20 border-b border-white/20 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <a href="#inicio" className="flex items-center gap-2.5" aria-label="Experience El Salvador · Inicio">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f4b942] text-[#173f45]"><Compass size={21} strokeWidth={2.5} /></span>
            <span className="text-lg font-bold tracking-tight">Experience <span className="text-[#f4b942]">El Salvador</span></span>
          </a>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex" aria-label="Navegación principal">
            <a href="#experiencias" className="transition hover:text-[#f4b942]">{language === 'ES' ? 'Explorar' : 'Explore'}</a>
            <a href="#destinos" className="transition hover:text-[#f4b942]">{language === 'ES' ? 'Destinos' : 'Destinations'}</a>
            <a href="#como-funciona" className="transition hover:text-[#f4b942]">{language === 'ES' ? 'Cómo funciona' : 'How it works'}</a>
          </nav>
          <div className="hidden items-center gap-4 md:flex">
            <button onClick={() => setLanguage(language === 'ES' ? 'EN' : 'ES')} className="flex items-center gap-1 text-sm font-semibold" aria-label="Cambiar idioma">{language}<ChevronDown size={15} /></button>
            <button className="rounded-full border border-white/60 px-4 py-2 text-sm font-semibold transition hover:bg-white hover:text-[#173f45]">Iniciar sesión</button>
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
        {menuOpen && <div className="border-t border-white/20 bg-[#173f45] px-5 pb-5 pt-3 md:hidden"><nav className="flex flex-col gap-4 text-sm"><a href="#experiencias" onClick={() => setMenuOpen(false)}>{language === 'ES' ? 'Explorar' : 'Explore'}</a><a href="#destinos" onClick={() => setMenuOpen(false)}>{language === 'ES' ? 'Destinos' : 'Destinations'}</a><a href="#como-funciona" onClick={() => setMenuOpen(false)}>{language === 'ES' ? 'Cómo funciona' : 'How it works'}</a></nav></div>}
      </header>

      <section id="inicio" className="relative flex min-h-[620px] items-center overflow-hidden bg-[#174b51] pt-24">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,43,48,.86)_0%,rgba(10,43,48,.55)_45%,rgba(10,43,48,.15)_100%)]" />
        <img src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1800&q=90" alt="Playa tropical de El Salvador al atardecer" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,55,61,.35),rgba(12,55,61,.1)_45%,rgba(251,250,247,.9)_100%)]" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-28 pt-16 lg:px-8">
          <div className="max-w-2xl text-white">
            <p className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-[.22em] text-[#f4d27c]"><span className="h-px w-8 bg-[#f4d27c]" />Viaja con propósito</p>
            <h1 className="text-5xl font-semibold leading-[.98] tracking-[-.04em] md:text-7xl">El Salvador, <em className="font-serif font-normal text-[#f4c45e]">a tu manera.</em></h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-white/85 md:text-lg">Descubre lugares que se sienten como un secreto. Experiencias locales, recuerdos que se quedan.</p>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); setSearchSent(true) }} className="mt-10 grid max-w-5xl gap-2 rounded-2xl bg-white p-2 shadow-2xl md:grid-cols-[1.4fr_1fr_1fr_auto] md:rounded-full md:p-2">
            <label className="flex items-center gap-3 rounded-xl px-4 py-3 md:rounded-full"><MapPin className="shrink-0 text-[#ee7f47]" size={20} /><span className="flex-1"><span className="block text-[11px] font-bold uppercase tracking-wider text-[#759096]">¿A dónde?</span><input value={query} onChange={(e) => { setQuery(e.target.value); setSearchSent(false) }} placeholder="Destino o experiencia" className="w-full bg-transparent text-sm font-semibold text-[#173f45] outline-none placeholder:text-[#547176]" /></span></label>
            <label className="flex items-center gap-3 rounded-xl border-t border-[#e5ece9] px-4 py-3 md:border-l md:border-t-0"><CalendarDays className="shrink-0 text-[#ee7f47]" size={19} /><span><span className="block text-[11px] font-bold uppercase tracking-wider text-[#759096]">Cuándo</span><span className="text-sm font-semibold text-[#173f45]">Cualquier fecha</span></span></label>
            <label className="flex items-center gap-3 rounded-xl border-t border-[#e5ece9] px-4 py-3 md:border-l md:border-t-0"><Users className="shrink-0 text-[#ee7f47]" size={19} /><span><span className="block text-[11px] font-bold uppercase tracking-wider text-[#759096]">Viajeros</span><span className="text-sm font-semibold text-[#173f45]">2 personas</span></span></label>
            <button type="submit" className="flex items-center justify-center gap-2 rounded-xl bg-[#b8481c] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#963b18] md:rounded-full"><Search size={18} />{language === 'ES' ? 'Buscar' : 'Search'}</button>
          </form>
          {searchSent && <p className="mt-3 text-sm font-semibold text-white">Mostrando experiencias para tu búsqueda.</p>}
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-3 max-w-7xl px-5 lg:px-8"><div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">
        {categories.map(({ label, icon: Icon, image }) => <button key={label} onClick={() => setActiveCategory(label)} className={`group relative h-24 min-w-40 overflow-hidden rounded-2xl text-left shadow-lg transition hover:-translate-y-1 ${activeCategory === label ? 'ring-2 ring-[#f4b942] ring-offset-2' : ''}`}><img src={image} alt="" className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105" /><span className="absolute inset-0 bg-[#103f44]/55" /><span className="relative flex h-full flex-col justify-between p-4 text-white"><Icon size={20} /><span className="font-semibold">{label}</span></span></button>)}
      </div></section>

      <section id="experiencias" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4"><div><p className="mb-2 text-sm font-bold uppercase tracking-[.18em] text-[#b8481c]">Para empezar</p><h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Experiencias que <em className="font-serif font-normal">dejan huella</em></h2></div><a href="#destinos" className="hidden items-center gap-2 text-sm font-bold text-[#b8481c] sm:flex">Ver todas <ArrowRight size={17} /></a></div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{filteredExperiences.map((item, index) => <article key={item.title} className="group overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(26,65,69,.08)]"><div className="relative h-56 overflow-hidden"><img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><span className="absolute left-3 top-3 rounded-full bg-[#f4d27c] px-3 py-1 text-[11px] font-bold text-[#173f45]">{item.tag}</span><button onClick={() => setFavorites((current) => current.includes(index) ? current.filter((i) => i !== index) : [...current, index])} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#173f45]" aria-label={`Guardar ${item.title}`}><Heart size={17} fill={favorites.includes(index) ? '#b8481c' : 'none'} className={favorites.includes(index) ? 'text-[#b8481c]' : ''} /></button></div><div className="p-4"><div className="mb-2 flex items-center justify-between text-xs text-[#6a8588]"><span className="flex items-center gap-1"><MapPin size={13} />{item.place}</span><span className="flex items-center gap-1 font-semibold text-[#173f45]"><Star size={13} fill="#f4b942" className="text-[#f4b942]" />{item.rating} ({item.reviews})</span></div><h3 className="text-lg font-semibold">{item.title}</h3><p className="mt-2 text-xs text-[#6a8588]">{item.duration} · Guía local incluido</p><div className="mt-4 flex items-end justify-between border-t border-[#edf0ed] pt-3"><span><span className="text-xs text-[#6a8588]">Desde</span> <strong className="text-lg">{item.price}</strong> <span className="text-xs text-[#6a8588]">/ persona</span></span><button className="text-xs font-bold text-[#b8481c]">Ver más</button></div></div></article>)}</div>
        {filteredExperiences.length === 0 && <div className="rounded-2xl bg-white p-10 text-center text-[#6a8588]">No encontramos experiencias con ese destino. Prueba con Santa Ana, El Tunco o Coatepeque.</div>}
      </section>

      <section id="como-funciona" className="bg-[#eaf1ed] py-20"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]"><div><p className="mb-2 text-sm font-bold uppercase tracking-[.18em] text-[#b8481c]">Viajar es fácil</p><h2 className="max-w-md text-3xl font-semibold tracking-tight md:text-4xl">Lo local se vive <em className="font-serif font-normal">mejor.</em></h2><p className="mt-5 max-w-md leading-relaxed text-[#547176]">Conectamos tus ganas de explorar con quienes conocen cada rincón de El Salvador. Tú eliges el plan, nosotros cuidamos los detalles.</p><button className="mt-7 flex items-center gap-2 rounded-full bg-[#173f45] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0e3035]">Conoce cómo funciona <ArrowRight size={17} /></button></div><div className="grid gap-4 sm:grid-cols-3">{[['01','Elige','Encuentra el destino o experiencia que te mueve.'],['02','Reserva','Confirma en pocos pasos y recibe todo al instante.'],['03','Disfruta','Vive el momento con anfitriones locales.']].map(([number, title, description]) => <div key={number} className="rounded-2xl bg-white p-5"><span className="text-4xl font-light text-[#f0b649]">{number}</span><h3 className="mt-8 font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-[#6a8588]">{description}</p><Check className="mt-5 text-[#b8481c]" size={19} /></div>)}</div></div></div></section>

      <section id="destinos" className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="rounded-[2rem] bg-[#173f45] p-7 text-white md:p-12"><div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="mb-2 text-sm font-bold uppercase tracking-[.18em] text-[#f4d27c]">Tu próxima historia</p><h2 className="max-w-xl text-3xl font-semibold tracking-tight md:text-5xl">Hay mucho más por <em className="font-serif font-normal text-[#f4c45e]">descubrir.</em></h2></div><button className="flex shrink-0 items-center gap-2 rounded-full bg-[#b8481c] px-5 py-3 text-sm font-bold text-white hover:bg-[#da6637]">Explorar destinos <ArrowRight size={17} /></button></div><div className="mt-10 grid gap-3 sm:grid-cols-3"><div className="relative h-48 overflow-hidden rounded-2xl sm:col-span-2"><img src="https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=1000&q=85" alt="Paisaje montañoso de El Salvador" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" /><span className="absolute bottom-4 left-4 font-semibold">Ruta de las Flores</span></div><div className="relative h-48 overflow-hidden rounded-2xl"><img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=85" alt="Paisaje natural salvadoreño" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" /><span className="absolute bottom-4 left-4 font-semibold">Suchitoto</span></div></div></div></section>
      <footer className="border-t border-[#dce7e1] px-5 py-8 text-sm text-[#6a8588]"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row"><span className="font-bold text-[#173f45]">Experience <span className="text-[#b8481c]">El Salvador</span></span><span>{language === 'ES' ? 'Hecho con cariño desde El Salvador · © 2026' : 'Made with care in El Salvador · © 2026'}</span><span>{language === 'ES' ? 'Español · Términos · Privacidad' : 'English · Terms · Privacy'}</span></div></footer>
    </main>
  )
}
