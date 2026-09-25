import axiosClient from './axiosClient';

export interface ConfiguracionClinica {
  nombreClinica: string;
  razonSocial: string;
  nit: string;
  telefono: string;
  whatsapp: string;
  email: string;
  direccion: string;
  ciudad: string;
  horaApertura: string;
  horaCierre: string;
  duracionCitaDefault: number;
  diasHabiles: string[];
  moneda: string;
  prefijoRecibo: string;
  notificarWhatsApp: boolean;
  notificarEmail: boolean;
  horasAnticipacionRecordatorio: number;
  backupAutomatico: boolean;
  updatedAt?: string;
}

export const CONFIG_CLINICA_DEFAULT: ConfiguracionClinica = {
  nombreClinica: "NexusOdonto Dental Clinic",
  razonSocial: "NexusOdonto Salud Oral S.A.S.",
  nit: "901.458.729-3",
  telefono: "+57 (601) 745-9000",
  whatsapp: "+57 324 6030217",
  email: "NexusOdonto@nexus.co",
  direccion: "Calle 100 # 15-20, Centro Médico Odontológico",
  ciudad: "Bogotá, Colombia",
  horaApertura: "08:00",
  horaCierre: "17:00",
  duracionCitaDefault: 45,
  diasHabiles: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
  moneda: "COP ($)",
  prefijoRecibo: "REC-",
  notificarWhatsApp: true,
  notificarEmail: true,
  horasAnticipacionRecordatorio: 24,
  backupAutomatico: true,
};

const STORAGE_KEY = 'nexus_configuracion_clinica';

export const clinicSettingsService = {
  getSettings: async (): Promise<ConfiguracionClinica> => {
    try {
      const response = await axiosClient.get<ConfiguracionClinica>('/v1/clinic-settings');
      if (response.data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data));
        return { ...CONFIG_CLINICA_DEFAULT, ...response.data };
      }
    } catch (_error) {
      // Fallback a localStorage si el backend no responde
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return { ...CONFIG_CLINICA_DEFAULT, ...JSON.parse(saved) };
        } catch {}
      }
    }
    return CONFIG_CLINICA_DEFAULT;
  },

  updateSettings: async (settings: ConfiguracionClinica): Promise<ConfiguracionClinica> => {
    // Guardar en localStorage de inmediato para respuesta instantánea
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('nexus_configuracion_actualizada'));

    try {
      const response = await axiosClient.put<ConfiguracionClinica>('/v1/clinic-settings', settings);
      if (response.data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data));
        return { ...CONFIG_CLINICA_DEFAULT, ...response.data };
      }
    } catch (_error) {
      // Si falla la petición de red, los cambios ya quedaron en localStorage
    }
    return settings;
  },
};
