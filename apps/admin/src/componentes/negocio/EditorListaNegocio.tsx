import { useState } from "react";
import { FICHAS, Negocio } from "@app-vecinos/tipos";
import { LuArrowLeft, LuArrowRight, LuPlus, LuX } from "react-icons/lu";
import { useNegocios } from "../../estado/useNegocios";
import { useCategorias } from "../../estado/useCategorias";
import { useSesionAdmin } from "../../estado/useSesionAdmin";
import { useToasts } from "../../estado/useToasts";
import { fichaDelNegocio } from "../../utilidades/fichaNegocio";
import { TelefonoFicha } from "../fichas/TelefonoFicha";

const CONFIG = {
  rubros: {
    ficha: "rubros" as const,
    campoNegocio: "rubrosDisponibles" as const,
    singular: "rubro",
    plural: "rubros",
    ayuda: "Lo que maneja el local, sin precios: los vecinos preguntan por WhatsApp si tienen lo que buscan.",
    ejemplo: "Ej. Pinturas",
    sugerencias: ["Pinturas", "Electricidad", "Gasfitería", "Herramientas", "Cerrajería", "Jardinería", "Limpieza", "Menaje", "Iluminación", "Ferretería"],
  },
  pasillos: {
    ficha: "ofertas" as const,
    campoNegocio: "pasillos" as const,
    singular: "pasillo",
    plural: "pasillos",
    ayuda: "Las secciones del local. Se muestran debajo de las ofertas de la semana.",
    ejemplo: "Ej. Lácteos y huevos",
    sugerencias: ["Abarrotes", "Lácteos y huevos", "Frutas y verduras", "Panadería", "Carnes", "Bebidas", "Limpieza", "Cuidado personal", "Congelados"],
  },
};

/**
 * Una lista de nombres cortos del negocio: los rubros (ficha "Rubros") o los pasillos (ficha
 * "Ofertas y pasillos"). Se guarda la lista entera. Compartido entre admin y dueño.
 */
export function EditorListaNegocio({ negocio, lista, conTelefono = true }: { negocio: Negocio; lista: "rubros" | "pasillos"; conTelefono?: boolean }) {
  const cfg = CONFIG[lista];
  const token = useSesionAdmin((e) => e.token)!;
  const categorias = useCategorias((e) => e.categorias);
  const guardarLista = useNegocios((e) => e.guardarLista);
  const avisos = useToasts((e) => e.mostrar);

  const guardados = negocio[cfg.campoNegocio] ?? [];
  const [items, setItems] = useState<string[]>(guardados);
  const [nuevo, setNuevo] = useState("");
  const [guardando, setGuardando] = useState(false);

  const { ficha, categoria, titulo } = fichaDelNegocio(negocio, categorias);
  const huboCambio = JSON.stringify(items) !== JSON.stringify(guardados);
  const existe = (t: string) => items.some((i) => i.toLowerCase() === t.trim().toLowerCase());

  function agregar(texto: string) {
    const t = texto.trim().slice(0, 40);
    if (!t || existe(t) || items.length >= 30) return;
    setItems((l) => [...l, t]);
    setNuevo("");
  }
  function mover(i: number, delta: number) {
    setItems((l) => {
      const j = i + delta;
      if (j < 0 || j >= l.length) return l;
      const copia = [...l];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return copia;
    });
  }
  async function guardar() {
    setGuardando(true);
    const ok = await guardarLista(negocio.id, lista, items, token);
    setGuardando(false);
    avisos(ok ? `${cfg.plural[0].toUpperCase()}${cfg.plural.slice(1)} guardados` : `No se pudieron guardar los ${cfg.plural}.`, ok ? "exito" : "error");
  }

  const editor = (
    <div className="tarjeta">
      {ficha === cfg.ficha ? null : (
        <div className="nota-alerta">
          La ficha de este negocio es <b>{FICHAS[ficha].nombre}</b>, así que los {cfg.plural} todavía no se muestran en la
          app. Se pueden dejar listos por si su categoría cambia a {FICHAS[cfg.ficha].nombre}.
        </div>
      )}
      <p className="ayuda-lista">{cfg.ayuda}</p>

      {items.length ? (
        <div className="chips-editor">
          {items.map((it, i) => (
            <span className="chip-editor" key={it}>
              <button type="button" aria-label={`Mover ${it} antes`} disabled={i === 0} onClick={() => mover(i, -1)}>
                <LuArrowLeft />
              </button>
              {it}
              <button type="button" aria-label={`Mover ${it} después`} disabled={i === items.length - 1} onClick={() => mover(i, 1)}>
                <LuArrowRight />
              </button>
              <button type="button" aria-label={`Quitar ${it}`} onClick={() => setItems((l) => l.filter((_, j) => j !== i))}>
                <LuX />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="vacio-editor">Todavía no hay {cfg.plural}.</p>
      )}

      <form
        className="agregar-lista"
        onSubmit={(e) => {
          e.preventDefault();
          agregar(nuevo);
        }}
      >
        <input aria-label={`Nuevo ${cfg.singular}`} value={nuevo} maxLength={40} placeholder={cfg.ejemplo} onChange={(e) => setNuevo(e.target.value)} />
        <button type="submit" className="btn-accion-mini" disabled={!nuevo.trim() || existe(nuevo) || items.length >= 30}>
          <LuPlus /> Agregar
        </button>
      </form>

      {cfg.sugerencias.some((s) => !existe(s)) ? (
        <div className="sugerencias-lista">
          <span>Sugerencias:</span>
          {cfg.sugerencias
            .filter((s) => !existe(s))
            .map((s) => (
              <button type="button" key={s} onClick={() => agregar(s)}>
                + {s}
              </button>
            ))}
        </div>
      ) : null}

      <div className="pie-editor-lista">
        <span className="espaciador" />
        {huboCambio ? <span className="aviso-sin-guardar">Cambios sin guardar</span> : null}
        <button type="button" className="btn btn-primario" disabled={!huboCambio || guardando} onClick={guardar}>
          {guardando ? "Guardando…" : `Guardar ${cfg.plural}`}
        </button>
      </div>
    </div>
  );

  if (!conTelefono) return editor;
  return (
    <div className="layout-editor con-tf">
      {editor}
      <div className="panel-referencia">
        <h3>Así se ve en la app</h3>
        <p className="sub-ref">Se actualiza mientras editas; los vecinos lo ven al guardar.</p>
        <TelefonoFicha
          ficha={cfg.ficha}
          titulo={ficha === cfg.ficha ? titulo : FICHAS[cfg.ficha].tituloPorDefecto}
          campos={[]}
          rotulo={categoria?.nombre ?? ""}
          negocio={{ ...negocio, [cfg.campoNegocio]: items }}
          productos={[]}
          cargando={false}
        />
      </div>
    </div>
  );
}
