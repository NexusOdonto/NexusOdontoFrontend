import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: "#1e293b",
    backgroundColor: "#ffffff",
  },
  headerContainer: {
    borderBottomWidth: 2,
    borderBottomColor: "#0f766e",
    paddingBottom: 10,
    marginBottom: 14,
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
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: "#0f766e",
    letterSpacing: 0.5,
  },
  clinicSubtitle: {
    fontSize: 8,
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
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f766e",
  },
  dateText: {
    fontSize: 7.5,
    color: "#64748b",
    marginTop: 1.5,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderLeftWidth: 3,
    borderLeftColor: "#0f766e",
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginTop: 10,
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
    marginBottom: 4,
  },
  col33: {
    width: "33.3%",
    marginBottom: 4,
  },
  col50: {
    width: "50%",
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textTransform: "uppercase",
  },
  fieldValue: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginTop: 1,
  },
  alertCard: {
    borderColor: "#fecdd3",
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderRadius: 4,
    padding: 6,
    marginTop: 6,
    marginBottom: 6,
  },
  alertTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#9f1239",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  alertText: {
    fontSize: 8,
    color: "#881337",
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    marginTop: 4,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0f766e",
    color: "#ffffff",
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 7.5,
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: "#f8fafc",
  },
  attentionCard: {
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 5,
    padding: 8,
    marginBottom: 6,
    backgroundColor: "#ffffff",
  },
  attHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 4,
    marginBottom: 4,
  },
  attTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0f766e",
  },
  attDate: {
    fontSize: 7.5,
    color: "#64748b",
  },
  attDoctor: {
    fontSize: 7.5,
    color: "#475569",
    fontFamily: "Helvetica-Bold",
    marginTop: 1,
  },
  attBody: {
    fontSize: 8,
    color: "#334155",
    lineHeight: 1.25,
    marginTop: 2,
  },
  signatureContainer: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  signatureBox: {
    width: "45%",
    borderTopWidth: 1,
    borderTopColor: "#94a3b8",
    paddingTop: 6,
    textAlign: "center",
  },
  signatureName: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  signatureRole: {
    fontSize: 7.5,
    color: "#64748b",
    marginTop: 1,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#94a3b8",
  },
});

export interface ExpedienteClinicoPdfProps {
  patient: {
    firstName: string;
    lastName: string;
    documentNumber: string;
    phone?: string;
    email?: string;
    birthDate?: string;
    gender?: string;
    bloodType?: string;
    allergies?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    chronicDiseases?: string;
    currentMedications?: string;
  };
  doctorName: string;
  attentions: {
    id: string;
    fecha: string;
    profesional: string;
    motivo: string;
    enfermedadActual: string;
    examenFisico: string;
    diagnostico: string;
    cie10: string;
    planTratamiento: string;
    observaciones?: string;
  }[];
  diagnoses: {
    cie10Code?: string;
    description?: string;
    diagnosisType?: string;
  }[];
  procedures: {
    codigo: string;
    nombre: string;
    notas?: string;
  }[];
  odontogramSummary?: string;
  issuedDate?: string;
}

export const ExpedienteClinicoPdfDocument = ({
  patient,
  doctorName,
  attentions,
  diagnoses,
  procedures,
  odontogramSummary,
  issuedDate = new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }),
}: ExpedienteClinicoPdfProps) => {
  return (
    <Document title={`Expediente_Clinico_${patient.documentNumber}`} author="Nexus Odonto">
      <Page size="A4" style={styles.page}>
        {/* HEADER CON LOGO */}
        <View style={styles.headerContainer}>
          <View style={styles.logoAndTitle}>
            <Image src="/nexus-odonto-logo.png" style={styles.logo} />
            <View>
              <Text style={styles.clinicTitle}>NEXUS ODONTO CLINIC & SPECIALISTS</Text>
              <Text style={styles.clinicSubtitle}>Registro Único Seccional de Salud No. 05001-2234 • NIT: 901.452.889-1</Text>
              <Text style={styles.clinicSubtitle}>Bogotá D.C., Colombia • Sede Principal</Text>
            </View>
          </View>
          <View style={styles.folioBadge}>
            <Text style={styles.folioText}>EXPEDIENTE CLÍNICO</Text>
            <Text style={styles.dateText}>Folio: HC-{patient.documentNumber}</Text>
            <Text style={styles.dateText}>Emisión: {issuedDate}</Text>
          </View>
        </View>

        {/* 1. DATOS DE IDENTIFICACIÓN DEL PACIENTE */}
        <Text style={styles.sectionTitle}>1. Identificación y Ficha Sociodemográfica</Text>
        <View style={styles.patientBox}>
          <View style={styles.col50}>
            <Text style={styles.fieldLabel}>Nombre Completo</Text>
            <Text style={styles.fieldValue}>{patient.firstName} {patient.lastName}</Text>
          </View>
          <View style={styles.col25}>
            <Text style={styles.fieldLabel}>Documento (CC)</Text>
            <Text style={styles.fieldValue}>{patient.documentNumber}</Text>
          </View>
          <View style={styles.col25}>
            <Text style={styles.fieldLabel}>Teléfono</Text>
            <Text style={styles.fieldValue}>{patient.phone || "No registrado"}</Text>
          </View>

          <View style={styles.col50}>
            <Text style={styles.fieldLabel}>Correo Electrónico</Text>
            <Text style={styles.fieldValue}>{patient.email || "No registrado"}</Text>
          </View>
          <View style={styles.col25}>
            <Text style={styles.fieldLabel}>Contacto Emergencia</Text>
            <Text style={styles.fieldValue}>{patient.emergencyContactName || "Familiar Responsable"}</Text>
          </View>
          <View style={styles.col25}>
            <Text style={styles.fieldLabel}>Tel. Emergencia</Text>
            <Text style={styles.fieldValue}>{patient.emergencyContactPhone || patient.phone || "No registra"}</Text>
          </View>
        </View>

        {/* 2. ANTECEDENTES Y ALERTAS */}
        <Text style={styles.sectionTitle}>2. Antecedentes Médicos y Alertas de Bioseguridad</Text>
        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>Alertas Críticas y Alergias Declaradas:</Text>
          <Text style={styles.alertText}>
            Alergias: {patient.allergies || "Ninguna conocida"} • Patologías de base: {patient.chronicDiseases || "Ninguna declarada"} • Farmacoterapia permanente: {patient.currentMedications || "Sin medicamentos permanentes"}
          </Text>
        </View>

        {/* 3. EVOLUCIONES CLÍNICAS */}
        <Text style={styles.sectionTitle}>3. Registro Cronológico de Evoluciones Clínicas</Text>
        {attentions.length === 0 ? (
          <Text style={{ fontSize: 8, color: "#94a3b8", fontStyle: "italic", marginBottom: 6 }}>
            No se registran atenciones clínicas previas para este expediente.
          </Text>
        ) : (
          attentions.slice(0, 4).map((att, index) => (
            <View key={att.id || index} style={styles.attentionCard} wrap={false}>
              <View style={styles.attHeader}>
                <Text style={styles.attTitle}>{index + 1}. {att.motivo || "Consulta General de Control"}</Text>
                <Text style={styles.attDate}>{att.fecha}{att.cie10 ? ` • CIE-10: ${att.cie10}` : ""}</Text>
              </View>
              <Text style={styles.attDoctor}>Tratante: Dr(a). {att.profesional}</Text>
              <Text style={styles.attBody}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>Diagnóstico/Enfermedad: </Text>
                {att.diagnostico || att.enfermedadActual || "Sin notas"}
              </Text>
              {att.planTratamiento ? (
                <Text style={styles.attBody}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>Plan de Manejo: </Text>
                  {att.planTratamiento}
                </Text>
              ) : null}
            </View>
          ))
        )}

        {/* 4. DIAGNÓSTICOS CIE-10 Y PROCEDIMIENTOS */}
        <Text style={styles.sectionTitle}>4. Diagnósticos y Procedimientos Odontológicos</Text>
        {odontogramSummary ? (
          <View style={[styles.alertCard, { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0", marginBottom: 6 }]}>
            <Text style={[styles.alertTitle, { color: "#166534" }]}>Mapeo y Estado Odontológico Activo:</Text>
            <Text style={[styles.alertText, { color: "#14532d" }]}>{odontogramSummary}</Text>
          </View>
        ) : null}
        {diagnoses.length === 0 && procedures.length === 0 ? (
          <Text style={{ fontSize: 8, color: "#94a3b8", fontStyle: "italic", marginBottom: 8 }}>
            No se registran diagnósticos codificados ni procedimientos clínicos adicionales para este paciente.
          </Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ width: "25%" }}>CÓDIGO</Text>
              <Text style={{ width: "50%" }}>DESCRIPCIÓN / PROCEDIMIENTO</Text>
              <Text style={{ width: "25%" }}>TIPO / NOTAS</Text>
            </View>
            {diagnoses.map((d, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={{ width: "25%", fontFamily: "Helvetica-Bold", color: "#0f766e" }}>{d.cie10Code || "CIE-10"}</Text>
                <Text style={{ width: "50%" }}>{d.description || "Diagnóstico Clínico"}</Text>
                <Text style={{ width: "25%", color: "#64748b" }}>{d.diagnosisType || "DENTAL"}</Text>
              </View>
            ))}
            {procedures.map((p, i) => (
              <View key={`proc-${i}`} style={[styles.tableRow, (i + diagnoses.length) % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={{ width: "25%", fontFamily: "Helvetica-Bold", color: "#0891b2" }}>{p.codigo}</Text>
                <Text style={{ width: "50%" }}>{p.nombre}</Text>
                <Text style={{ width: "25%", color: "#64748b" }}>{p.notas || "Realizado"}</Text>
              </View>
            ))}
          </View>
        )}

        {/* FIRMA Y CERTIFICACIÓN */}
        <View style={styles.signatureContainer} wrap={false}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureName}>Dr(a). {doctorName.replace(/^Dr\(a\)\.\s*/i, "")}</Text>
            <Text style={styles.signatureRole}>Odontólogo(a) Tratante • Reg. 45892</Text>
            <Text style={styles.signatureRole}>Nexus Odonto Clinic</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureName}>{patient.firstName} {patient.lastName}</Text>
            <Text style={styles.signatureRole}>Firma del Paciente / Titular HC</Text>
            <Text style={styles.signatureRole}>CC: {patient.documentNumber}</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text>Documento médico-legal confidencial generado por Nexus Odonto - Ley 1581 de 2012 / Res. 1995 de 1999</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};
