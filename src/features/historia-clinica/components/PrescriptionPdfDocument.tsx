import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1e293b",
    backgroundColor: "#ffffff",
  },
  headerContainer: {
    borderBottomWidth: 2,
    borderBottomColor: "#0891b2",
    paddingBottom: 12,
    marginBottom: 16,
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
    color: "#0891b2",
    letterSpacing: 0.5,
  },
  clinicSubtitle: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 1.5,
  },
  rpBadge: {
    backgroundColor: "#ecfeff",
    borderColor: "#0891b2",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    textAlign: "right",
  },
  rpText: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0891b2",
  },
  dateText: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },
  patientBox: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 16,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  fieldCol: {
    width: "50%",
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textTransform: "uppercase",
  },
  fieldValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#0891b2",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 4,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  medicationCard: {
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  medHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  medName: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  medDuration: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0891b2",
    backgroundColor: "#ecfeff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  medDose: {
    fontSize: 9,
    color: "#334155",
    marginBottom: 2,
  },
  medIndications: {
    fontSize: 8.5,
    fontStyle: "italic",
    color: "#64748b",
  },
  instructionsBox: {
    backgroundColor: "#f0fdfa",
    borderColor: "#99f6e4",
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
    marginBottom: 14,
  },
  instructionsTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f766e",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  instructionsText: {
    fontSize: 8.5,
    color: "#134e4a",
    lineHeight: 1.3,
  },
  footerSignature: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  validityText: {
    fontSize: 7.5,
    color: "#94a3b8",
    width: "45%",
    lineHeight: 1.3,
  },
  signatureBox: {
    width: "45%",
    textAlign: "center",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#0f172a",
    marginBottom: 4,
  },
  docName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  docTitle: {
    fontSize: 7.5,
    color: "#64748b",
  },
});

export interface PrescriptionPdfProps {
  patient: {
    firstName: string;
    lastName: string;
    documentNumber: string;
    phone?: string;
  };
  doctorName: string;
  items: {
    medicamento: string;
    dosis: string;
    duracion: string;
    indicaciones?: string;
  }[];
  generalInstructions?: string;
  date?: string;
}

export const PrescriptionPdfDocument = ({
  patient,
  doctorName,
  items,
  generalInstructions,
  date = new Date().toLocaleDateString("es-CO"),
}: PrescriptionPdfProps) => {
  return (
    <Document title={`Formula_Medica_${patient.documentNumber}`}>
      <Page size="A5" orientation="portrait" style={styles.page}>
        {/* Cabecera de la Clínica con Logo */}
        <View style={styles.headerContainer}>
          <View style={styles.logoAndTitle}>
            <Image src="/nexus-odonto-logo.png" style={styles.logo} />
            <View>
              <Text style={styles.clinicTitle}>NEXUS ODONTO CLINIC</Text>
              <Text style={styles.clinicSubtitle}>Odontología Especializada & Salud Oral Integral</Text>
              <Text style={styles.clinicSubtitle}>Registro Prestador REPS-11001 • NIT: 901.452.889-1</Text>
            </View>
          </View>
          <View style={styles.rpBadge}>
            <Text style={styles.rpText}>RP (Recipe)</Text>
            <Text style={styles.dateText}>Fecha: {date}</Text>
          </View>
        </View>

        {/* Datos del Paciente */}
        <View style={styles.patientBox}>
          <View style={styles.fieldCol}>
            <Text style={styles.fieldLabel}>Paciente</Text>
            <Text style={styles.fieldValue}>{patient.firstName} {patient.lastName}</Text>
          </View>
          <View style={styles.fieldCol}>
            <Text style={styles.fieldLabel}>Identificación</Text>
            <Text style={styles.fieldValue}>CC: {patient.documentNumber}</Text>
          </View>
          <View style={styles.fieldCol}>
            <Text style={styles.fieldLabel}>Teléfono Contacto</Text>
            <Text style={styles.fieldValue}>{patient.phone || "No registrado"}</Text>
          </View>
          <View style={styles.fieldCol}>
            <Text style={styles.fieldLabel}>Odontólogo Tratante</Text>
            <Text style={styles.fieldValue}>{doctorName}</Text>
          </View>
        </View>

        {/* Sección RP: Medicamentos */}
        <Text style={styles.sectionTitle}>Prescripción Farmacológica (RP)</Text>
        {items.length === 0 ? (
          <Text style={{ fontSize: 9, color: "#94a3b8", fontStyle: "italic", marginBottom: 12 }}>
            No se han registrado medicamentos en esta fórmula médica.
          </Text>
        ) : (
          items.map((item, index) => (
            <View key={index} style={styles.medicationCard} wrap={false}>
              <View style={styles.medHeader}>
                <Text style={styles.medName}>{index + 1}. {item.medicamento}</Text>
                <Text style={styles.medDuration}>{item.duracion}</Text>
              </View>
              <Text style={styles.medDose}>Posología: {item.dosis}</Text>
              {item.indicaciones ? (
                <Text style={styles.medIndications}>Indicaciones: {item.indicaciones}</Text>
              ) : null}
            </View>
          ))
        )}

        {/* Indicaciones Generales */}
        {generalInstructions ? (
          <View style={styles.instructionsBox} wrap={false}>
            <Text style={styles.instructionsTitle}>Recomendaciones y Cuidados Generales</Text>
            <Text style={styles.instructionsText}>{generalInstructions}</Text>
          </View>
        ) : null}

        {/* Pie de página con Firma */}
        <View style={styles.footerSignature} wrap={false}>
          <Text style={styles.validityText}>
            Fórmula médica válida conforme a la resolución 1403 de 2007. Válida por 30 días calendario desde su fecha de expedición.
          </Text>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.docName}>{doctorName}</Text>
            <Text style={styles.docTitle}>Odontólogo(a) Tratante</Text>
            <Text style={styles.docTitle}>Reg. Profesional No. 45892 - Seccional Salud</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
