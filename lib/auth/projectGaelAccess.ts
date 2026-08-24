type Role = "admin" | "direccion" | "equipo" | "lector";

type Person = {
  id: string;
  rol: Role;
};

type ProjectGaelAccessInput = {
  person: Person | null;
  projectResponsibleId: string | null;
  explicitAccessPersonIds?: string[];
};

export function canTransferProjectResponsible({
  person,
  currentResponsibleId,
}: {
  person: Person | null;
  currentResponsibleId: string | null;
}) {
  if (!person || person.rol === "lector") {
    return false;
  }

  if (!currentResponsibleId) {
    return true;
  }

  return (
    person.rol === "admin" ||
    person.rol === "direccion" ||
    currentResponsibleId === person.id
  );
}

export function canViewProjectGaelBudgets({
  person,
  projectResponsibleId,
  explicitAccessPersonIds = [],
}: ProjectGaelAccessInput) {
  if (!person || person.rol === "lector") {
    return false;
  }

  return (
    person.rol === "admin" ||
    person.rol === "direccion" ||
    projectResponsibleId === person.id ||
    explicitAccessPersonIds.includes(person.id)
  );
}

export function canImportProjectGaelBudgets(
  input: ProjectGaelAccessInput
) {
  return canViewProjectGaelBudgets(input);
}

export function canCreateProjectGaelBudgetDraft(person: Person | null) {
  return Boolean(person && person.rol !== "lector");
}

export function canManageProjectGaelBudgetAccess({
  person,
  projectResponsibleId,
}: Pick<
  ProjectGaelAccessInput,
  "person" | "projectResponsibleId"
>) {
  if (!person || person.rol === "lector") {
    return false;
  }

  return (
    person.rol === "admin" ||
    person.rol === "direccion" ||
    projectResponsibleId === person.id
  );
}
