export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableDefinition<
  Row,
  Insert,
  Relationships extends Relationship[] = [],
> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: Relationships;
};

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type ClientesRow = {
  id: string;
  nombre: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
  contacto_nombre: string | null;
  contacto_correo: string | null;
  contacto_celular: string | null;
};

type EstadosProyectoRow = {
  id: string;
  codigo: number;
  nombre: string;
  orden: number;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
};

type EstadosTareaRow = EstadosProyectoRow;

type PersonasRow = {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
  administrador: boolean;
  rol: "admin" | "direccion" | "equipo" | "lector";
  fecha_creacion: string;
  fecha_actualizacion: string;
  auth_user_id: string | null;
};

type GoogleConnectionsRow = {
  id: string;
  persona_id: string;
  google_email: string | null;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  scope: string;
  expires_at: string;
  connected_at: string;
  fecha_actualizacion: string;
};

type PlantillasTareaRow = {
  id: string;
  nombre: string;
  orden: number;
  activa: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
};

type ProyectoVenuesRow = {
  id: string;
  proyecto_id: string;
  venue_id: string;
  fecha_creacion: string;
};

type ProyectoPresupuestosGaelRow = {
  id: string;
  proyecto_id: string;
  gael_presupuesto_id: number;
  nombre: string | null;
  estado: string | null;
  empresa_nombre: string | null;
  ucontrol_nombre: string | null;
  valor_proyectado: number | null;
  fecha_creacion_gael: string | null;
  fecha_importacion: string;
  fecha_actualizacion: string;
  creado_por_id: string | null;
  actualizado_por_id: string | null;
  raw: Json | null;
};

type ProyectoPresupuestoGaelLineasRow = {
  id: string;
  presupuesto_id: string;
  gael_linea_id: number;
  categoria: string | null;
  concepto: string | null;
  cantidad: number | null;
  veces: number | null;
  unitario: number | null;
  total_proyectado: number | null;
  operacion: string | null;
  orden: number;
  raw: Json | null;
};

type ProyectoPresupuestoGaelAccesosRow = {
  id: string;
  proyecto_id: string;
  persona_id: string;
  creado_por_id: string | null;
  fecha_creacion: string;
};

type ProyectosRow = {
  id: string;
  legacy_id: string | null;
  nombre: string;
  estado_id: string;
  tipo_id: string | null;
  responsable_id: string | null;
  cliente_id: string | null;
  prioridad: number | null;
  fecha_propuesta: string | null;
  fecha_evento_inicio: string | null;
  fecha_evento_termino: string | null;
  publico_esperado: number | null;
  valor_venta: number | null;
  notas: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
  creado_por_id: string | null;
  actualizado_por_id: string | null;
  eliminado: boolean;
  fecha_eliminacion: string | null;
  eliminado_por_id: string | null;
};

type TareasRow = {
  id: string;
  proyecto_id: string;
  plantilla_tarea_id: string | null;
  nombre: string;
  responsable_id: string | null;
  estado_id: string;
  fecha_comprometida: string | null;
  fecha_completada: string | null;
  url: string | null;
  orden: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
  comentario: string | null;
  creada_por_id: string | null;
  actualizada_por_id: string | null;
  eliminada: boolean;
  fecha_eliminacion: string | null;
  eliminada_por_id: string | null;
};

type TiposProyectoRow = {
  id: string;
  nombre: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
};

type VenuesRow = {
  id: string;
  nombre: string;
  direccion: string | null;
  comuna: string | null;
  ciudad: string | null;
  capacidad: number | null;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
  contacto_nombre: string | null;
  contacto_correo: string | null;
  contacto_celular: string | null;
};

export type Database = {
  public: {
    Tables: {
      clientes: TableDefinition<
        ClientesRow,
        {
          id?: string;
          nombre: string;
          activo?: boolean;
          fecha_creacion?: string;
          fecha_actualizacion?: string;
          contacto_nombre?: string | null;
          contacto_correo?: string | null;
          contacto_celular?: string | null;
        }
      >;
      estados_proyecto: TableDefinition<
        EstadosProyectoRow,
        {
          id?: string;
          codigo: number;
          nombre: string;
          orden: number;
          activo?: boolean;
          fecha_creacion?: string;
          fecha_actualizacion?: string;
        }
      >;
      estados_tarea: TableDefinition<
        EstadosTareaRow,
        {
          id?: string;
          codigo: number;
          nombre: string;
          orden: number;
          activo?: boolean;
          fecha_creacion?: string;
          fecha_actualizacion?: string;
        }
      >;
      google_connections: TableDefinition<
        GoogleConnectionsRow,
        {
          id?: string;
          persona_id: string;
          google_email?: string | null;
          access_token_encrypted: string;
          refresh_token_encrypted?: string | null;
          scope: string;
          expires_at: string;
          connected_at?: string;
          fecha_actualizacion?: string;
        },
        [
          {
            foreignKeyName: "google_connections_persona_id_fkey";
            columns: ["persona_id"];
            isOneToOne: true;
            referencedRelation: "personas";
            referencedColumns: ["id"];
          },
        ]
      >;
      personas: TableDefinition<
        PersonasRow,
        {
          id?: string;
          nombre: string;
          email: string;
          activo?: boolean;
          administrador?: boolean;
          rol?: "admin" | "direccion" | "equipo" | "lector";
          fecha_creacion?: string;
          fecha_actualizacion?: string;
          auth_user_id?: string | null;
        }
      >;
      plantillas_tarea: TableDefinition<
        PlantillasTareaRow,
        {
          id?: string;
          nombre: string;
          orden?: number;
          activa?: boolean;
          fecha_creacion?: string;
          fecha_actualizacion?: string;
        }
      >;
      proyecto_venues: TableDefinition<
        ProyectoVenuesRow,
        {
          id?: string;
          proyecto_id: string;
          venue_id: string;
          fecha_creacion?: string;
        },
        [
          {
            foreignKeyName: "proyecto_venues_proyecto_id_fkey";
            columns: ["proyecto_id"];
            isOneToOne: false;
            referencedRelation: "proyectos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proyecto_venues_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ]
      >;
      proyecto_presupuesto_gael_lineas: TableDefinition<
        ProyectoPresupuestoGaelLineasRow,
        {
          id?: string;
          presupuesto_id: string;
          gael_linea_id: number;
          categoria?: string | null;
          concepto?: string | null;
          cantidad?: number | null;
          veces?: number | null;
          unitario?: number | null;
          total_proyectado?: number | null;
          operacion?: string | null;
          orden?: number;
          raw?: Json | null;
        },
        [
          {
            foreignKeyName: "proyecto_presupuesto_gael_lineas_presupuesto_id_fkey";
            columns: ["presupuesto_id"];
            isOneToOne: false;
            referencedRelation: "proyecto_presupuestos_gael";
            referencedColumns: ["id"];
          },
        ]
      >;
      proyecto_presupuesto_gael_accesos: TableDefinition<
        ProyectoPresupuestoGaelAccesosRow,
        {
          id?: string;
          proyecto_id: string;
          persona_id: string;
          creado_por_id?: string | null;
          fecha_creacion?: string;
        },
        [
          {
            foreignKeyName: "proyecto_presupuesto_gael_accesos_proyecto_id_fkey";
            columns: ["proyecto_id"];
            isOneToOne: false;
            referencedRelation: "proyectos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proyecto_presupuesto_gael_accesos_persona_id_fkey";
            columns: ["persona_id"];
            isOneToOne: false;
            referencedRelation: "personas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proyecto_presupuesto_gael_accesos_creado_por_id_fkey";
            columns: ["creado_por_id"];
            isOneToOne: false;
            referencedRelation: "personas";
            referencedColumns: ["id"];
          },
        ]
      >;
      proyecto_presupuestos_gael: TableDefinition<
        ProyectoPresupuestosGaelRow,
        {
          id?: string;
          proyecto_id: string;
          gael_presupuesto_id: number;
          nombre?: string | null;
          estado?: string | null;
          empresa_nombre?: string | null;
          ucontrol_nombre?: string | null;
          valor_proyectado?: number | null;
          fecha_creacion_gael?: string | null;
          fecha_importacion?: string;
          fecha_actualizacion?: string;
          creado_por_id?: string | null;
          actualizado_por_id?: string | null;
          raw?: Json | null;
        },
        [
          {
            foreignKeyName: "proyecto_presupuestos_gael_proyecto_id_fkey";
            columns: ["proyecto_id"];
            isOneToOne: false;
            referencedRelation: "proyectos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proyecto_presupuestos_gael_creado_por_id_fkey";
            columns: ["creado_por_id"];
            isOneToOne: false;
            referencedRelation: "personas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proyecto_presupuestos_gael_actualizado_por_id_fkey";
            columns: ["actualizado_por_id"];
            isOneToOne: false;
            referencedRelation: "personas";
            referencedColumns: ["id"];
          },
        ]
      >;
      proyectos: TableDefinition<
        ProyectosRow,
        {
          id?: string;
          legacy_id?: string | null;
          nombre: string;
          estado_id: string;
          tipo_id?: string | null;
          responsable_id?: string | null;
          cliente_id?: string | null;
          prioridad?: number | null;
          fecha_propuesta?: string | null;
          fecha_evento_inicio?: string | null;
          fecha_evento_termino?: string | null;
          publico_esperado?: number | null;
          valor_venta?: number | null;
          notas?: string | null;
          fecha_creacion?: string;
          fecha_actualizacion?: string;
          creado_por_id?: string | null;
          actualizado_por_id?: string | null;
          eliminado?: boolean;
          fecha_eliminacion?: string | null;
          eliminado_por_id?: string | null;
        },
        [
          {
            foreignKeyName: "proyectos_actualizado_por_id_fkey";
            columns: ["actualizado_por_id"];
            isOneToOne: false;
            referencedRelation: "personas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proyectos_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proyectos_creado_por_id_fkey";
            columns: ["creado_por_id"];
            isOneToOne: false;
            referencedRelation: "personas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proyectos_eliminado_por_id_fkey";
            columns: ["eliminado_por_id"];
            isOneToOne: false;
            referencedRelation: "personas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proyectos_estado_id_fkey";
            columns: ["estado_id"];
            isOneToOne: false;
            referencedRelation: "estados_proyecto";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proyectos_responsable_id_fkey";
            columns: ["responsable_id"];
            isOneToOne: false;
            referencedRelation: "personas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proyectos_tipo_id_fkey";
            columns: ["tipo_id"];
            isOneToOne: false;
            referencedRelation: "tipos_proyecto";
            referencedColumns: ["id"];
          },
        ]
      >;
      tareas: TableDefinition<
        TareasRow,
        {
          id?: string;
          proyecto_id: string;
          plantilla_tarea_id?: string | null;
          nombre: string;
          responsable_id?: string | null;
          estado_id: string;
          fecha_comprometida?: string | null;
          fecha_completada?: string | null;
          url?: string | null;
          orden?: number;
          fecha_creacion?: string;
          fecha_actualizacion?: string;
          comentario?: string | null;
          creada_por_id?: string | null;
          actualizada_por_id?: string | null;
          eliminada?: boolean;
          fecha_eliminacion?: string | null;
          eliminada_por_id?: string | null;
        },
        [
          {
            foreignKeyName: "tareas_actualizada_por_id_fkey";
            columns: ["actualizada_por_id"];
            isOneToOne: false;
            referencedRelation: "personas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tareas_creada_por_id_fkey";
            columns: ["creada_por_id"];
            isOneToOne: false;
            referencedRelation: "personas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tareas_eliminada_por_id_fkey";
            columns: ["eliminada_por_id"];
            isOneToOne: false;
            referencedRelation: "personas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tareas_estado_id_fkey";
            columns: ["estado_id"];
            isOneToOne: false;
            referencedRelation: "estados_tarea";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tareas_plantilla_tarea_id_fkey";
            columns: ["plantilla_tarea_id"];
            isOneToOne: false;
            referencedRelation: "plantillas_tarea";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tareas_proyecto_id_fkey";
            columns: ["proyecto_id"];
            isOneToOne: false;
            referencedRelation: "proyectos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tareas_responsable_id_fkey";
            columns: ["responsable_id"];
            isOneToOne: false;
            referencedRelation: "personas";
            referencedColumns: ["id"];
          },
        ]
      >;
      tipos_proyecto: TableDefinition<
        TiposProyectoRow,
        {
          id?: string;
          nombre: string;
          activo?: boolean;
          fecha_creacion?: string;
          fecha_actualizacion?: string;
        }
      >;
      venues: TableDefinition<
        VenuesRow,
        {
          id?: string;
          nombre: string;
          direccion?: string | null;
          comuna?: string | null;
          ciudad?: string | null;
          capacidad?: number | null;
          activo?: boolean;
          fecha_creacion?: string;
          fecha_actualizacion?: string;
          contacto_nombre?: string | null;
          contacto_correo?: string | null;
          contacto_celular?: string | null;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      es_administrador: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      es_usuario_activo: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_active_person: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_editor_person: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      link_current_auth_user: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type PublicTableName = keyof Database["public"]["Tables"];
export type TableRow<TableName extends PublicTableName> =
  Database["public"]["Tables"][TableName]["Row"];
export type TableInsert<TableName extends PublicTableName> =
  Database["public"]["Tables"][TableName]["Insert"];
export type TableUpdate<TableName extends PublicTableName> =
  Database["public"]["Tables"][TableName]["Update"];
