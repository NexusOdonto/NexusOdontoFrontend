import { type SelectOption } from "../components/common/SelectOrWriteInput";

export interface SpecialtyMatchResult {
  category: string;
  specialtyName: string;
  filteredDoctors: SelectOption[];
  isFiltered: boolean;
  totalAvailable: number;
}

/**
 * Mapeo inteligente de servicios y tratamientos dentales con sus especialidades correspondientes.
 */
export function getSpecialtyCategoryForService(serviceName: string): {
  key: string;
  label: string;
  keywords: string[];
} {
  if (!serviceName) {
    return {
      key: "general",
      label: "Odontología General",
      keywords: ["general", "integral", "valoracion", "valoración"],
    };
  }

  const norm = serviceName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // 1. Ortodoncia
  if (
    norm.includes("ortodoncia") ||
    norm.includes("bracket") ||
    norm.includes("alineador") ||
    norm.includes("frenillo") ||
    norm.includes("retenedor")
  ) {
    return {
      key: "ortodoncia",
      label: "Ortodoncia y Estética",
      keywords: ["ortodoncia", "ortodoncista", "estetica", "estética", "alineador"],
    };
  }

  // 2. Endodoncia
  if (
    norm.includes("endodoncia") ||
    norm.includes("conducto") ||
    norm.includes("apicectomia") ||
    norm.includes("pulpectomia") ||
    norm.includes("pulpar") ||
    norm.includes("microscopica")
  ) {
    return {
      key: "endodoncia",
      label: "Endodoncia",
      keywords: ["endodoncia", "endodoncista", "conducto", "microscopica", "microscópica"],
    };
  }

  // 3. Periodoncia
  if (
    norm.includes("periodoncia") ||
    norm.includes("limpieza profunda") ||
    norm.includes("injerto de encia") ||
    norm.includes("injerto de encía") ||
    norm.includes("encia") ||
    norm.includes("gingiv") ||
    norm.includes("raspado") ||
    norm.includes("alisado")
  ) {
    return {
      key: "periodoncia",
      label: "Periodoncia",
      keywords: ["periodoncia", "periodoncista", "encia", "gingiv"],
    };
  }

  // 4. Cirugía Oral / Implantología
  if (
    norm.includes("cirugia") ||
    norm.includes("extraccion") ||
    norm.includes("cordal") ||
    norm.includes("muela del juicio") ||
    norm.includes("implante") ||
    norm.includes("implantologia") ||
    norm.includes("injerto oseo") ||
    norm.includes("injerto óseo") ||
    norm.includes("maxilofacial")
  ) {
    return {
      key: "cirugia",
      label: "Cirugía Oral e Implantología",
      keywords: ["cirugia", "cirugía", "implantologia", "implantología", "maxilofacial", "extraccion"],
    };
  }

  // 5. Odontopediatría
  if (
    norm.includes("odontopediatria") ||
    norm.includes("pediatria") ||
    norm.includes("infantil") ||
    norm.includes("nino") ||
    norm.includes("niño") ||
    norm.includes("sellante") ||
    norm.includes("fluor")
  ) {
    return {
      key: "odontopediatria",
      label: "Odontopediatría",
      keywords: ["odontopediatria", "odontopediatría", "pediatria", "pediatría", "infantil"],
    };
  }

  // 6. Odontología General / Estética / Preventiva
  return {
    key: "general",
    label: "Odontología General e Integral",
    keywords: ["general", "integral", "estetica", "estética", "restauracion", "blanqueamiento", "profilaxis", "limpieza"],
  };
}

/**
 * Filtra la lista de odontólogos disponibles según el servicio o tratamiento seleccionado.
 */
export function filterDoctorsByService(
  doctors: SelectOption[],
  serviceName: string
): SpecialtyMatchResult {
  if (!doctors || doctors.length === 0) {
    return {
      category: "general",
      specialtyName: "Odontología General",
      filteredDoctors: [],
      isFiltered: false,
      totalAvailable: 0,
    };
  }

  const specCat = getSpecialtyCategoryForService(serviceName);

  // Si es Odontología General, pueden atender odontólogos generales, integrales o todos los disponibles
  if (specCat.key === "general") {
    return {
      category: specCat.key,
      specialtyName: specCat.label,
      filteredDoctors: doctors,
      isFiltered: false,
      totalAvailable: doctors.length,
    };
  }

  // Filtrar doctores cuya especialidad o subLabel coincida con las palabras clave de la especialidad
  const matches = doctors.filter((doc) => {
    const docSpec = (doc.subLabel || (doc.data as any)?.specialty || doc.label || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    return specCat.keywords.some((kw) => {
      const kwNorm = kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return docSpec.includes(kwNorm);
    });
  });

  // Si hay especialistas específicos, retornamos solo esos especialistas
  if (matches.length > 0) {
    return {
      category: specCat.key,
      specialtyName: specCat.label,
      filteredDoctors: matches,
      isFiltered: true,
      totalAvailable: matches.length,
    };
  }

  // Si no se encontraron especialistas específicos registrados para esa rama, mostramos todos los doctores
  // para no bloquear al usuario, indicando que están disponibles los profesionales de la clínica.
  return {
    category: specCat.key,
    specialtyName: specCat.label,
    filteredDoctors: doctors,
    isFiltered: false,
    totalAvailable: doctors.length,
  };
}
