import { EditableField } from "@/components/forms/EditableField";
import { SearchSelect } from "@/components/forms/SearchSelect";
import {
  getProjectById,
  getProjectEditOptions,
} from "@/lib/services/project.service";
import { updateProjectField } from "./actions";

type ProjectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectPage({
  params,
}: ProjectPageProps) {
  const { id } = await params;

  const project = await getProjectById(id);
  const editOptions = await getProjectEditOptions();

  const priorityOptions = [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
    { value: "6", label: "6" },
    { value: "7", label: "7" },
    { value: "8", label: "8" },
    { value: "9", label: "9" },
  ];

  const statusOptions = editOptions.statuses.map((status) => ({
    value: status.id,
    label: status.nombre,
  }));

  const typeOptions = editOptions.types.map((type) => ({
    value: type.id,
    label: type.nombre,
  }));

  const peopleOptions = editOptions.people.map((person) => ({
    value: person.id,
    label: person.nombre,
  }));

  const clientOptions = editOptions.clients.map((client) => ({
    value: client.id,
    label: client.nombre,
  }));

  const saveField = (
    field:
      | "nombre"
      | "prioridad"
      | "estado_id"
      | "tipo_id"
      | "responsable_id"
      | "cliente_id"
      | "fecha_propuesta"
      | "fecha_evento_inicio"
      | "fecha_evento_termino"
      | "publico_esperado"
      | "valor_venta"
      | "notas"
  ) => updateProjectField.bind(null, project.id, field);

  return (
    <main className="p-8">
      <div className="mb-8">
        <a
          href="/proyectos"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Proyectos
        </a>
      </div>

      <EditableField
        label="Nombre"
        value={project.nombre}
        type="text"
        onSave={saveField("nombre")}
      />

      <div className="mt-3 max-w-xl">
        <SearchSelect
          label="Cliente"
          value={project.clientes?.id ?? null}
          options={clientOptions}
          placeholder="Sin cliente"
          onSave={saveField("cliente_id")}
        />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Información general
          </h2>

          <div className="space-y-5">
            <EditableField
              label="Estado"
              value={project.estados_proyecto?.id ?? null}
              type="select"
              options={statusOptions}
              placeholder="Sin estado"
              onSave={saveField("estado_id")}
            />

            <EditableField
              label="Tipo"
              value={project.tipos_proyecto?.id ?? null}
              type="select"
              options={typeOptions}
              placeholder="Sin tipo"
              onSave={saveField("tipo_id")}
            />

            <SearchSelect
              label="Responsable"
              value={project.responsable?.id ?? null}
              options={peopleOptions}
              placeholder="Sin responsable"
              required
              onSave={saveField("responsable_id")}
            />

            <EditableField
              label="Prioridad"
              value={project.prioridad}
              type="select"
              options={priorityOptions}
              placeholder="Sin prioridad"
              onSave={saveField("prioridad")}
            />

            <EditableField
              label="Público esperado"
              value={project.publico_esperado}
              type="number"
              placeholder="Sin público esperado"
              onSave={saveField("publico_esperado")}
            />

            <EditableField
              label="Valor venta"
              value={project.valor_venta}
              type="currency"
              placeholder="Sin valor de venta"
              onSave={saveField("valor_venta")}
            />

            <EditableField
              label="Notas"
              value={project.notas}
              type="textarea"
              placeholder="Sin notas"
              onSave={saveField("notas")}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Fechas
          </h2>

          <div className="space-y-5">
            <EditableField
              label="Fecha propuesta"
              value={project.fecha_propuesta}
              type="date"
              placeholder="Sin fecha de propuesta"
              onSave={saveField("fecha_propuesta")}
            />

            <EditableField
              label="Inicio del evento"
              value={project.fecha_evento_inicio}
              type="date"
              placeholder="Sin fecha de inicio"
              onSave={saveField("fecha_evento_inicio")}
            />

            <EditableField
              label="Término del evento"
              value={project.fecha_evento_termino}
              type="date"
              placeholder="Misma fecha de inicio"
              onSave={saveField("fecha_evento_termino")}
            />
          </div>
        </section>
      </div>
    </main>
  );
}