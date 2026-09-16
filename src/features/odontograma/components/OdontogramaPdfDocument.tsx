import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { ToothState, Quadrants } from "../types";
import { FDI_PERMANENT_QUADRANTS, FDI_TEMPORARY_QUADRANTS, DIAGNOSIS_LEGEND } from "../types";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1e293b",
    backgroundColor: "#ffffff",
  },
  headerContainer: {
    borderBottomWidth: 2,
    borderBottomColor: "#0f766e",
    paddingBottom: 10,
    marginBottom: 12,
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
    width: 44,
    height: 44,
    objectFit: "contain",
  },
  clinicTitle: {
    fontSize: 14,
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
    textAlign: "right",
  },
  folioText: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f766e",
  },
  dateText: {
    fontSize: 7.5,
    color: "#64748b",
    marginTop: 1.5,
  },
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderLeftWidth: 3,
    borderLeftColor: "#0f766e",
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginTop: 8,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  patientBox: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 5,
    padding: 8,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  col25: {
    width: "25%",
    marginBottom: 3,
  },
  col33: {
    width: "33.3%",
    marginBottom: 3,
  },
  col50: {
    width: "50%",
    marginBottom: 3,
  },
  fieldLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textTransform: "uppercase",
  },
  fieldValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginTop: 1,
  },
  chartContainer: {
    borderColor: "#cbd5e1",
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    backgroundColor: "#f8fafc",
    marginBottom: 8,
  },
  chartQuadrantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  chartQuadrantHalf: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 3,
  },
  toothCard: {
    width: 28,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 3,
    padding: 2,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  toothCardActive: {
    borderColor: "#0f766e",
    backgroundColor: "#f0fdfa",
  },
  toothNumber: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f766e",
    marginBottom: 2,
  },
  toothCrossContainer: {
    width: 20,
    height: 20,
    position: "relative",
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    overflow: "hidden",
  },
  toothFaceV: {
    position: "absolute",
    top: 0,
    left: 4,
    right: 4,
    height: 5,
  },
  toothFaceP: {
    position: "absolute",
    bottom: 0,
    left: 4,
    right: 4,
    height: 5,
  },
  toothFaceM: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 0,
    width: 5,
  },
  toothFaceD: {
    position: "absolute",
    top: 4,
    bottom: 4,
    right: 0,
    width: 5,
  },
  toothFaceO: {
    position: "absolute",
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    padding: 6,
    backgroundColor: "#ffffff",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 6,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: "23%",
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 6.5,
    color: "#334155",
    fontFamily: "Helvetica-Bold",
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    marginTop: 4,
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0f766e",
    color: "#ffffff",
    paddingVertical: 3.5,
    paddingHorizontal: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 3,
    paddingHorizontal: 6,
    fontSize: 7.5,
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: "#f8fafc",
  },
  notesBox: {
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 4,
    padding: 6,
    backgroundColor: "#f8fafc",
    fontSize: 7.5,
    color: "#334155",
    lineHeight: 1.3,
    minHeight: 36,
  },
  signatureContainer: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  signatureBox: {
    width: "45%",
    borderTopWidth: 1,
    borderTopColor: "#94a3b8",
    paddingTop: 4,
    textAlign: "center",
  },
  signatureName: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  signatureRole: {
    fontSize: 7,
    color: "#64748b",
    marginTop: 1,
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
    fontSize: 6.5,
    color: "#94a3b8",
  },
});

export interface OdontogramaPdfProps {
  patient: {
    nombre?: string;
    apellido?: string;
    name?: string;
    cedula?: string;
    documentNumber?: string;
    telefono?: string;
    phone?: string;
    email?: string;
  };
  doctorName: string;
  dentitionType: "permanent" | "temporary";
  teeth: Record<number, ToothState>;
  notasClinicas?: string;
  issuedDate?: string;
}

const DIAGNOSIS_HEX_MAP: Record<string, string> = {
  caries: "#EF4444",
  restoration: "#3B82F6",
  sealant: "#F59E0B",
  endodontic: "#A855F7",
  crown: "#10B981",
  bridge: "#06B6D4",
  implant: "#14B8A6",
  extraction: "#1E293B",
  fracture: "#F97316",
  mobility: "#EAB308",
  none: "#E2E8F0",
};

const DIAGNOSIS_NAME_MAP: Record<string, string> = {
  caries: "Caries",
  restoration: "Obturación",
  sealant: "Sellante",
  endodontic: "Endodoncia",
  crown: "Corona",
  bridge: "Puente",
  implant: "Implante",
  extraction: "Extracción",
  fracture: "Fractura",
  mobility: "Movilidad",
  none: "Sano",
};

const SURFACE_NAME_MAP: Record<string, string> = {
  vestibular: "Vestibular (V)",
  palatino: "Palatino/Lingual (P/L)",
  mesial: "Mesial (M)",
  distal: "Distal (D)",
  oclusal: "Oclusal/Incisal (O)",
};

function getFaceColor(diagnosis?: string): string {
  if (!diagnosis || diagnosis === "none") return "#ffffff";
  return DIAGNOSIS_HEX_MAP[diagnosis] || "#ffffff";
}

export const OdontogramaPdfDocument = ({
  patient,
  doctorName,
  dentitionType,
  teeth,
  notasClinicas = "",
  issuedDate = new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }),
}: OdontogramaPdfProps) => {
  const patientName = `${patient.nombre || patient.name || ""} ${patient.apellido || ""}`.trim() || "Paciente Sin Nombre";
  const docNumber = patient.cedula || patient.documentNumber || "N/A";
  const phone = patient.telefono || patient.phone || "N/A";
  const email = patient.email || "N/A";

  const quadrants: Quadrants =
    dentitionType === "permanent" ? FDI_PERMANENT_QUADRANTS : FDI_TEMPORARY_QUADRANTS;

  // Extract all findings
  const findings: Array<{
    toothNumber: number;
    surface: string;
    diagnosis: string;
    label: string;
    hex: string;
  }> = [];

  Object.values(teeth || {}).forEach((t) => {
    if (!t) return;
    if (t.faces) {
      Object.entries(t.faces).forEach(([surf, faceState]) => {
        if (faceState && faceState.diagnosis && faceState.diagnosis !== "none") {
          findings.push({
            toothNumber: t.toothNumber,
            surface: SURFACE_NAME_MAP[surf] || surf,
            diagnosis: faceState.diagnosis,
            label: DIAGNOSIS_NAME_MAP[faceState.diagnosis] || faceState.diagnosis,
            hex: DIAGNOSIS_HEX_MAP[faceState.diagnosis] || "#0f766e",
          });
        }
      });
    }
  });

  const renderQuadrantRow = (teethList: number[]) => {
    return teethList.map((num) => {
      const tooth = teeth[num];
      const hasFinding = tooth?.faces && Object.values(tooth.faces).some((f) => f && f.diagnosis !== "none");
      const vCol = getFaceColor(tooth?.faces?.vestibular?.diagnosis);
      const pCol = getFaceColor(tooth?.faces?.palatino?.diagnosis);
      const mCol = getFaceColor(tooth?.faces?.mesial?.diagnosis);
      const dCol = getFaceColor(tooth?.faces?.distal?.diagnosis);
      const oCol = getFaceColor(tooth?.faces?.oclusal?.diagnosis);

      return (
        <View key={num} style={[styles.toothCard, hasFinding ? styles.toothCardActive : {}]}>
          <Text style={styles.toothNumber}>{num}</Text>
          <View style={styles.toothCrossContainer}>
            <View style={[styles.toothFaceV, { backgroundColor: vCol }]} />
            <View style={[styles.toothFaceP, { backgroundColor: pCol }]} />
            <View style={[styles.toothFaceM, { backgroundColor: mCol }]} />
            <View style={[styles.toothFaceD, { backgroundColor: dCol }]} />
            <View style={[styles.toothFaceO, { backgroundColor: oCol }]} />
          </View>
        </View>
      );
    });
  };

  return (
    <Document title={`Odontograma_${docNumber}`} author="Nexus Odonto">
      <Page size="A4" style={styles.page}>
        {/* HEADER CON LOGO */}
        <View style={styles.headerContainer}>
          <View style={styles.logoAndTitle}>
            <Image src="/nexus-odonto-logo.png" style={styles.logo} />
            <View>
              <Text style={styles.clinicTitle}>NEXUS ODONTO CLINIC & SPECIALISTS</Text>
              <Text style={styles.clinicSubtitle}>Registro Único Seccional de Salud No. 05001-2234 • NIT: 901.452.889-1</Text>
              <Text style={styles.clinicSubtitle}>Bogotá D.C., Colombia • Odontología Digital Especializada</Text>
            </View>
          </View>
          <View style={styles.folioBadge}>
            <Text style={styles.folioText}>REPORTE DE ODONTOGRAMA</Text>
            <Text style={styles.dateText}>ID: OD-{docNumber}</Text>
            <Text style={styles.dateText}>Emisión: {issuedDate}</Text>
          </View>
        </View>

        {/* INFORMACIÓN DEL PACIENTE Y PROFESIONAL */}
        <Text style={styles.sectionTitle}>1. Información General del Paciente</Text>
        <View style={styles.patientBox}>
          <View style={styles.col50}>
            <Text style={styles.fieldLabel}>Paciente</Text>
            <Text style={styles.fieldValue}>{patientName}</Text>
          </View>
          <View style={styles.col25}>
            <Text style={styles.fieldLabel}>Documento</Text>
            <Text style={styles.fieldValue}>{docNumber}</Text>
          </View>
          <View style={styles.col25}>
            <Text style={styles.fieldLabel}>Teléfono / Email</Text>
            <Text style={styles.fieldValue}>{phone}{email !== "N/A" ? ` • ${email}` : ""}</Text>
          </View>
          <View style={styles.col50}>
            <Text style={styles.fieldLabel}>Odontólogo / Especialista Tratante</Text>
            <Text style={styles.fieldValue}>{doctorName || "Dr. Especialista Nexus Odonto"}</Text>
          </View>
          <View style={styles.col25}>
            <Text style={styles.fieldLabel}>Dentición Evaluada</Text>
            <Text style={styles.fieldValue}>
              {dentitionType === "permanent" ? "Permanente FDI (32)" : "Temporal FDI (20)"}
            </Text>
          </View>
          <View style={styles.col25}>
            <Text style={styles.fieldLabel}>Hallazgos Totales</Text>
            <Text style={styles.fieldValue}>{findings.length} patologías/tratamientos</Text>
          </View>
        </View>

        {/* MAPA VISUAL DEL ODONTOGRAMA (FDI) */}
        <Text style={styles.sectionTitle}>2. Esquema Dental FDI (Arcadas Superior e Inferior)</Text>
        <View style={styles.chartContainer}>
          {/* Arcada Superior: Cuadrante 1 y Cuadrante 2 */}
          <Text style={{ fontSize: 7, color: "#64748b", fontFamily: "Helvetica-Bold", marginBottom: 3 }}>
            ARCADAS SUPERIORES (Cuadrantes {dentitionType === "permanent" ? "18-11 y 21-28" : "55-51 y 61-65"})
          </Text>
          <View style={styles.chartQuadrantRow}>
            <View style={styles.chartQuadrantHalf}>{renderQuadrantRow(quadrants.topRight)}</View>
            <View style={styles.chartQuadrantHalf}>{renderQuadrantRow(quadrants.topLeft)}</View>
          </View>

          {/* Arcada Inferior: Cuadrante 4 y Cuadrante 3 */}
          <Text style={{ fontSize: 7, color: "#64748b", fontFamily: "Helvetica-Bold", marginTop: 4, marginBottom: 3 }}>
            ARCADAS INFERIORES (Cuadrantes {dentitionType === "permanent" ? "48-41 y 31-38" : "85-81 y 71-75"})
          </Text>
          <View style={styles.chartQuadrantRow}>
            <View style={styles.chartQuadrantHalf}>{renderQuadrantRow(quadrants.bottomRight)}</View>
            <View style={styles.chartQuadrantHalf}>{renderQuadrantRow(quadrants.bottomLeft)}</View>
          </View>
        </View>

        {/* CONVENCIONES Y SIMBOLOGÍA */}
        <View style={styles.legendGrid}>
          {DIAGNOSIS_LEGEND.slice(0, 8).map((leg) => (
            <View key={leg.diagnosis} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: leg.hex }]} />
              <Text style={styles.legendLabel}>{leg.label}</Text>
            </View>
          ))}
        </View>

        {/* TABLA DETALLADA DE HALLAZGOS CLÍNICOS */}
        <Text style={styles.sectionTitle}>3. Registro de Hallazgos y Diagnósticos Dentales</Text>
        {findings.length === 0 ? (
          <View style={[styles.patientBox, { marginBottom: 6 }]}>
            <Text style={{ fontSize: 7.5, color: "#059669", fontFamily: "Helvetica-Bold" }}>
              ✓ No se registraron anomalías ni patologías activas. Todas las piezas dentales evaluadas se encuentran en estado SANO.
            </Text>
          </View>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ width: "20%" }}>Pieza FDI</Text>
              <Text style={{ width: "35%" }}>Cara / Superficie</Text>
              <Text style={{ width: "30%" }}>Diagnóstico / Hallazgo</Text>
              <Text style={{ width: "15%", textAlign: "right" }}>Estado</Text>
            </View>
            {findings.slice(0, 12).map((item, index) => (
              <View
                key={`${item.toothNumber}-${item.surface}-${index}`}
                style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                <Text style={{ width: "20%", fontFamily: "Helvetica-Bold", color: "#0f766e" }}>
                  Diente #{item.toothNumber}
                </Text>
                <Text style={{ width: "35%", color: "#334155" }}>{item.surface}</Text>
                <Text style={{ width: "30%", fontFamily: "Helvetica-Bold", color: item.hex }}>
                  {item.label}
                </Text>
                <Text style={{ width: "15%", textAlign: "right", color: "#64748b", fontSize: 7 }}>
                  Identificado
                </Text>
              </View>
            ))}
            {findings.length > 12 && (
              <View style={[styles.tableRow, { backgroundColor: "#f8fafc" }]}>
                <Text style={{ width: "100%", textAlign: "center", color: "#64748b", fontSize: 7 }}>
                  ... y {findings.length - 12} hallazgos adicionales registrados en el expediente.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* NOTAS CLÍNICAS */}
        <Text style={styles.sectionTitle}>4. Observaciones y Plan de Tratamiento Odontológico</Text>
        <View style={styles.notesBox}>
          <Text>{notasClinicas.trim() || "Sin observaciones adicionales registradas para este control clínico."}</Text>
        </View>

        {/* FIRMAS */}
        <View style={styles.signatureContainer}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureName}>{doctorName || "Dr. Odontólogo Especialista"}</Text>
            <Text style={styles.signatureRole}>Odontólogo Tratante • R.P. No. 1102-CO</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureName}>{patientName}</Text>
            <Text style={styles.signatureRole}>Firma del Paciente / Acudiente</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text>Nexus Odonto Software Clínico • Reporte Oficial Odontograma</Text>
          <Text>Página 1 de 1</Text>
        </View>
      </Page>
    </Document>
  );
};
