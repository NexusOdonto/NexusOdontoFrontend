import React from "react";
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
    marginBottom: 12,
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
  recordCard: {
    borderColor: "#cbd5e1",
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#ffffff",
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 6,
    marginBottom: 6,
  },
  recordCategory: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f766e",
    backgroundColor: "#ccfbf1",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    textTransform: "uppercase",
  },
  recordTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginTop: 3,
  },
  recordStatus: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#047857",
    backgroundColor: "#d1fae5",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    fontSize: 8,
    color: "#64748b",
    marginBottom: 6,
  },
  resumenBox: {
    backgroundColor: "#f0fdfa",
    borderColor: "#99f6e4",
    borderWidth: 1,
    borderRadius: 4,
    padding: 6,
    marginBottom: 6,
  },
  resumenLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#0f766e",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  resumenText: {
    fontSize: 8.5,
    color: "#134e4a",
    lineHeight: 1.3,
  },
  detailGrid: {
    marginTop: 4,
    gap: 4,
  },
  detailItem: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 4,
    padding: 5,
    marginBottom: 3,
  },
  detailKey: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    textTransform: "uppercase",
  },
  detailVal: {
    fontSize: 8,
    color: "#0f172a",
    marginTop: 1,
    lineHeight: 1.25,
  },
  signatureContainer: {
    marginTop: 20,
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

export interface ClinicalRecordItem {
  id?: string;
  titulo: string;
  fecha: string;
  profesional: string;
  categoria: string;
  resumen?: string;
  estado?: string;
  detalles?: Record<string, any>;
}

export interface RegistroIndividualPdfProps {
  patient: {
    firstName?: string;
    lastName?: string;
    documentNumber?: string;
    documentType?: string;
    phone?: string;
    email?: string;
    birthDate?: string;
    gender?: string;
    bloodType?: string;
    allergies?: string;
  };
  records: ClinicalRecordItem[];
  clinicName?: string;
  issuedDate?: string;
}

export const RegistroIndividualPdfDocument: React.FC<RegistroIndividualPdfProps> = ({
  patient,
  records,
  clinicName = "NEXUS ODONTO CLINIC & SPECIALISTS",
  issuedDate = new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }),
}) => {
  const patientFullName = `${patient?.firstName || "Paciente"} ${patient?.lastName || ""}`.trim();
  const docNumber = patient?.documentNumber || "No especificado";
  const docType = patient?.documentType || "CC";

  return (
    <Document title={`Registro_Clinico_${docNumber}_${records.length > 1 ? "Seleccionados" : "Individual"}`} author="Nexus Odonto">
      <Page size="A4" style={styles.page}>
        {/* HEADER CON LOGO */}
        <View style={styles.headerContainer}>
          <View style={styles.logoAndTitle}>
            <Image src="/nexus-odonto-logo.png" style={styles.logo} />
            <View>
              <Text style={styles.clinicTitle}>{clinicName}</Text>
              <Text style={styles.clinicSubtitle}>Sistema de Gestión Clínica Odontológica Especializada</Text>
              <Text style={styles.clinicSubtitle}>NIT: 901.452.889-1 • Registro Seccional de Salud No. 05001-2234</Text>
            </View>
          </View>
          <View style={styles.folioBadge}>
            <Text style={styles.folioText}>
              {records.length === 1 ? "REGISTRO CLÍNICO" : `DOCUMENTO (${records.length} REGISTROS)`}
            </Text>
            <Text style={styles.dateText}>Expedición: {issuedDate}</Text>
          </View>
        </View>

        {/* DATOS DEL PACIENTE */}
        <Text style={styles.sectionTitle}>1. Identificación del Paciente</Text>
        <View style={styles.patientBox}>
          <View style={styles.col50}>
            <Text style={styles.fieldLabel}>Nombre Completo</Text>
            <Text style={styles.fieldValue}>{patientFullName}</Text>
          </View>
          <View style={styles.col25}>
            <Text style={styles.fieldLabel}>Identificación</Text>
            <Text style={styles.fieldValue}>{docType}: {docNumber}</Text>
          </View>
          <View style={styles.col25}>
            <Text style={styles.fieldLabel}>Teléfono</Text>
            <Text style={styles.fieldValue}>{patient?.phone || "No registra"}</Text>
          </View>
          <View style={styles.col50}>
            <Text style={styles.fieldLabel}>Correo Electrónico</Text>
            <Text style={styles.fieldValue}>{patient?.email || "No registra"}</Text>
          </View>
          <View style={styles.col25}>
            <Text style={styles.fieldLabel}>Alergias / Alertas</Text>
            <Text style={[styles.fieldValue, { color: patient?.allergies ? "#b91c1c" : "#047857" }]}>
              {patient?.allergies || "Sin alergias declaradas"}
            </Text>
          </View>
          <View style={styles.col25}>
            <Text style={styles.fieldLabel}>Folio Historia</Text>
            <Text style={styles.fieldValue}>HC-{docNumber}</Text>
          </View>
        </View>

        {/* REGISTRO(S) SELECCIONADO(S) */}
        <Text style={styles.sectionTitle}>
          {records.length === 1
            ? `2. Detalle del Registro: ${records[0].categoria}`
            : `2. Registros Clínicos Seleccionados (${records.length})`}
        </Text>

        {records.map((rec, index) => (
          <View key={index} style={styles.recordCard} wrap={false}>
            <View style={styles.recordHeader}>
              <View>
                <Text style={styles.recordCategory}>{rec.categoria || "Registro Clínico"}</Text>
                <Text style={styles.recordTitle}>{rec.titulo || "Consulta Odontológica"}</Text>
              </View>
              <Text style={styles.recordStatus}>{rec.estado || "Completado"}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text>Fecha: {rec.fecha || issuedDate}</Text>
              <Text>•</Text>
              <Text>Profesional: {rec.profesional || "Odontólogo Tratante"}</Text>
            </View>

            {rec.resumen ? (
              <View style={styles.resumenBox}>
                <Text style={styles.resumenLabel}>Resumen / Motivo de Consulta:</Text>
                <Text style={styles.resumenText}>{rec.resumen}</Text>
              </View>
            ) : null}

            {rec.detalles && Object.keys(rec.detalles).length > 0 ? (
              <View style={styles.detailGrid}>
                {Object.entries(rec.detalles).map(([k, v]) => (
                  <View key={k} style={styles.detailItem}>
                    <Text style={styles.detailKey}>{k}:</Text>
                    <Text style={styles.detailVal}>{String(v || "Sin datos")}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ))}

        {/* FIRMA Y CERTIFICACIÓN */}
        <View style={styles.signatureContainer} wrap={false}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureName}>
              {records[0]?.profesional ? `Dr(a). ${records[0].profesional.replace(/^Dr\(a\)\.\s*/i, "")}` : "Dr(a). Odontólogo Tratante"}
            </Text>
            <Text style={styles.signatureRole}>Odontólogo(a) Especialista • Reg. Profesional No. 45892</Text>
            <Text style={styles.signatureRole}>Nexus Odonto Clinic</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureName}>{patientFullName}</Text>
            <Text style={styles.signatureRole}>Firma del Paciente / Acudiente</Text>
            <Text style={styles.signatureRole}>{docType}: {docNumber}</Text>
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
