import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { Paciente } from "../../../types/pacientes";

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 32,
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#1e293b",
    backgroundColor: "#ffffff",
  },
  headerContainer: {
    borderBottomWidth: 2,
    borderBottomColor: "#0f766e",
    paddingBottom: 8,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoAndTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 42,
    height: 42,
    objectFit: "contain",
  },
  clinicTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#0f766e",
    letterSpacing: 0.5,
  },
  clinicSubtitle: {
    fontSize: 7.5,
    color: "#64748b",
    marginTop: 1.5,
  },
  folioBadge: {
    backgroundColor: "#f0fdf4",
    borderColor: "#0f766e",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: "flex-end",
  },
  folioText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0f766e",
  },
  dateText: {
    fontSize: 7.5,
    color: "#64748b",
    marginTop: 1.5,
  },
  metaBanner: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaItem: {
    fontSize: 7.5,
    color: "#475569",
  },
  metaBold: {
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 4,
    padding: 6,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0f766e",
  },
  statLabel: {
    fontSize: 7,
    color: "#64748b",
    marginTop: 1,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    backgroundColor: "#f1f5f9",
    borderLeftWidth: 3,
    borderLeftColor: "#0f766e",
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0f766e",
    paddingVertical: 5,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  thText: {
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: "center",
    fontSize: 7.5,
  },
  tableRowAlt: {
    backgroundColor: "#f8fafc",
  },
  colIndex: { width: "6%", textAlign: "center", color: "#64748b" },
  colPaciente: { width: "36%", flexDirection: "row", alignItems: "center" },
  colDocumento: { width: "18%", color: "#334155" },
  colTelefono: { width: "18%", color: "#334155" },
  colCorreo: { width: "22%", color: "#475569" },
  avatarWrapper: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: "hidden",
    marginRight: 6,
    backgroundColor: "#e2e8f0",
  },
  avatarImg: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  avatarContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  avatarInitials: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  pacienteName: {
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    fontSize: 7.5,
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 32,
    right: 32,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: "#94a3b8",
  },
});

function getInitials(name: string): string {
  if (!name) return "P";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

function getAvatarBgColor(name: string): string {
  const palette = [
    "#0f766e", // teal
    "#0284c7", // sky
    "#4f46e5", // indigo
    "#7c3aed", // violet
    "#059669", // emerald
    "#d97706", // amber
    "#0891b2", // cyan
    "#e11d48", // rose
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

export interface PacientesPdfDocumentProps {
  pacientes: Paciente[];
  avatarMap?: Record<string, string>;
  generatedBy?: string;
  logoUrl?: string;
}

export function PacientesPdfDocument({
  pacientes,
  avatarMap = {},
  generatedBy = "Administración",
  logoUrl = "/nexus-odonto-logo.png",
}: PacientesPdfDocumentProps) {
  const total = pacientes.length;
  const conDoc = pacientes.filter((p) => Boolean(p.documento && p.documento !== "—")).length;
  const conTel = pacientes.filter((p) => Boolean(p.telefono && p.telefono !== "—")).length;
  const conEmail = pacientes.filter((p) => Boolean(p.correo && p.correo !== "—")).length;

  const currentDate = new Date().toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const currentHour = new Date().toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Document title="Directorio_Pacientes_NexusOdonto" author="Nexus Odonto">
      <Page size="A4" style={styles.page} wrap>
        {/* ENCABEZADO CLÍNICO CON LOGO */}
        <View style={styles.headerContainer}>
          <View style={styles.logoAndTitle}>
            <Image src={logoUrl} style={styles.logo} />
            <View>
              <Text style={styles.clinicTitle}>NEXUS ODONTO CLINIC & SPECIALISTS</Text>
              <Text style={styles.clinicSubtitle}>
                Registro Único Seccional de Salud No. 05001-2234 • NIT: 901.452.889-1
              </Text>
              <Text style={styles.clinicSubtitle}>
                Bogotá D.C., Colombia • Directorio Clínico General
              </Text>
            </View>
          </View>

          <View style={styles.folioBadge}>
            <Text style={styles.folioText}>DIRECTORIO DE PACIENTES</Text>
            <Text style={styles.dateText}>Folio: DIR-{new Date().getFullYear()}</Text>
            <Text style={styles.dateText}>
              {currentDate} • {currentHour}
            </Text>
          </View>
        </View>

        {/* METADATOS Y RESPONSABLE */}
        <View style={styles.metaBanner}>
          <Text style={styles.metaItem}>
            Generado por: <Text style={styles.metaBold}>{generatedBy}</Text>
          </Text>
          <Text style={styles.metaItem}>
            Alcance: <Text style={styles.metaBold}>Fichas Clínicas Consolidadas (Todas las páginas)</Text>
          </Text>
        </View>

        {/* RESUMEN ESTADÍSTICO */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{total}</Text>
            <Text style={styles.statLabel}>Total Pacientes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: "#0284c7" }]}>{conDoc}</Text>
            <Text style={styles.statLabel}>Con Documento</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: "#16a34a" }]}>{conTel}</Text>
            <Text style={styles.statLabel}>Con Teléfono</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: "#7c3aed" }]}>{conEmail}</Text>
            <Text style={styles.statLabel}>Con Correo</Text>
          </View>
        </View>

        {/* TÍTULO DE SECCIÓN */}
        <Text style={styles.sectionTitle}>
          Listado Consolidado de Pacientes ({total} registros)
        </Text>

        {/* TABLA DE PACIENTES CON ENCABEZADOS REPETIDOS */}
        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            <Text style={[styles.colIndex, styles.thText]}>#</Text>
            <Text style={[styles.colPaciente, styles.thText]}>PACIENTE</Text>
            <Text style={[styles.colDocumento, styles.thText]}>DOCUMENTO</Text>
            <Text style={[styles.colTelefono, styles.thText]}>TELÉFONO</Text>
            <Text style={[styles.colCorreo, styles.thText]}>CORREO ELECTRÓNICO</Text>
          </View>

          {pacientes.map((p, idx) => {
            const isAlt = idx % 2 === 1;
            const initials = getInitials(p.nombre);
            const bgColor = getAvatarBgColor(p.nombre);
            const avatarSrc = avatarMap[p.id];

            return (
              <View
                key={p.id || idx}
                style={[styles.tableRow, isAlt ? styles.tableRowAlt : {}]}
                wrap={false}
              >
                <Text style={styles.colIndex}>{idx + 1}</Text>
                <View style={styles.colPaciente}>
                  {avatarSrc ? (
                    <View style={styles.avatarWrapper}>
                      <Image src={avatarSrc} style={styles.avatarImg} />
                    </View>
                  ) : (
                    <View style={[styles.avatarContainer, { backgroundColor: bgColor }]}>
                      <Text style={styles.avatarInitials}>{initials}</Text>
                    </View>
                  )}
                  <Text style={styles.pacienteName}>{p.nombre}</Text>
                </View>
                <Text style={styles.colDocumento}>{p.documento || "—"}</Text>
                <Text style={styles.colTelefono}>{p.telefono || "—"}</Text>
                <Text style={styles.colCorreo}>{p.correo || "—"}</Text>
              </View>
            );
          })}
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            NexusOdonto Cloud • Documento Confidencial de Uso Clínico y Administrativo
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
