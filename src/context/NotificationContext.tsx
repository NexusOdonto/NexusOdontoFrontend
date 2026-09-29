import { chatbotService, CONVERSATION_STATUS_IDS, TICKET_STATUS_IDS } from '../api/chatbotService';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { getUserRole } from '../utils/routePermissions';
import { appointmentService, type AppointmentResponseDto } from '../api/appointmentService';
import { professionalService } from '../api/professionalService';
import { patientService } from '../api/patientService';
import { personService } from '../api/personService';
import { serviceCatalogService } from '../api/serviceCatalogService';
import { areGuidsEqual } from '../utils/roleUtils';
import { signalRService } from '../api/signalrService';
import { hubNotificationService, type HubNotificationDto } from '../api/hubNotificationService';

/** La API guarda CreatedAt en UTC sin zona; se interpreta como UTC. */
const formatHubTime = (createdAt: string): string => {
  const iso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(createdAt) ? createdAt : `${createdAt}Z`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Reciente';
  return d.toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'appointment_pending' | 'appointment_confirmed' | 'system' | 'whatsapp_escalated';
  link?: string;
}

interface NotificationContextType {
  notifications: SystemNotification[];
  unreadCount: number;
  pendingAppointmentsCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => Promise<void>;
  addNotification: (notif: { title: string; message: string; link?: string; type?: 'system' | 'whatsapp_escalated' | 'appointment_confirmed' | 'appointment_pending' }) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/** Legacy global key — never reuse; read/write is always per authenticated user. */
const LEGACY_READ_NOTIF_KEY = 'nexus_read_notif_ids';

const readNotifStorageKey = (userId: string) => `nexus_read_notif_ids:${userId}`;

const getReadNotifIds = (userId: string | null | undefined): Set<string> => {
  if (!userId) return new Set();
  try {
    const key = readNotifStorageKey(userId);
    const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveReadNotifId = (userId: string | null | undefined, id: string) => {
  if (!userId) return;
  try {
    const current = getReadNotifIds(userId);
    current.add(id);
    // Stable aliases so summary IDs that embed a count stay marked after refresh.
    if (id.startsWith('pending-appointments-summary')) {
      current.add('pending-appointments-summary');
    }
    if (id.startsWith('doc-today-summary-')) {
      current.add(`doc-today-summary-${new Date().toISOString().split('T')[0]}`);
    }
    const serialized = JSON.stringify(Array.from(current));
    const key = readNotifStorageKey(userId);
    sessionStorage.setItem(key, serialized);
    localStorage.setItem(key, serialized);
    // Drop legacy shared key so other accounts cannot inherit read state.
    sessionStorage.removeItem(LEGACY_READ_NOTIF_KEY);
    localStorage.removeItem(LEGACY_READ_NOTIF_KEY);
  } catch {
    // Ignore
  }
};

/** Prefer sessionStorage + in-memory read flags so in-flight refresh cannot resurrect unread badges. */
const isNotifRead = (
  id: string,
  readIds: Set<string>,
  prev: SystemNotification[],
): boolean => {
  if (readIds.has(id)) return true;
  if (id.startsWith('pending-appointments-summary') && readIds.has('pending-appointments-summary')) {
    return true;
  }
  if (id.startsWith('doc-today-summary-')) {
    const dayKey = `doc-today-summary-${new Date().toISOString().split('T')[0]}`;
    if (readIds.has(dayKey)) return true;
  }
  return prev.some((n) => n.id === id && n.read);
};

const applyReadFlags = (
  items: SystemNotification[],
  readIds: Set<string>,
  prev: SystemNotification[],
): SystemNotification[] =>
  items.map((n) => ({ ...n, read: n.read || isNotifRead(n.id, readIds, prev) }));

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const role = getUserRole(user);
  const userId = user?.id ? String(user.id) : null;
  const userIdRef = React.useRef(userId);
  userIdRef.current = userId;
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [pendingAppointmentsCount, setPendingAppointmentsCount] = useState<number>(0);

  // New / switched accounts must never inherit another user's in-memory list or global read flags.
  useEffect(() => {
    setNotifications([]);
    setPendingAppointmentsCount(0);
    try {
      sessionStorage.removeItem(LEGACY_READ_NOTIF_KEY);
      localStorage.removeItem(LEGACY_READ_NOTIF_KEY);
    } catch {
      // Ignore
    }
  }, [userId]);

  const addNotification = useCallback(
    (notif: { title: string; message: string; link?: string; type?: 'system' | 'whatsapp_escalated' | 'appointment_confirmed' | 'appointment_pending' }) => {
      if (!userId) return;

      // Si el usuario es paciente, nunca admitir notificaciones de staff ni enlaces a /agenda
      if (role === 'PACIENTE') {
        if (notif.type === 'whatsapp_escalated') return;
        if (notif.type === 'appointment_pending' && notif.link === '/agenda') return;
      }

      const safeLink = role === 'PACIENTE' ? '/citas' : (notif.link || '/agenda');

      const newNotif: SystemNotification = {
        id: `notif-${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: notif.title,
        message: notif.message,
        time: 'Ahora',
        read: false,
        type: notif.type || 'system',
        link: safeLink,
      };

      setNotifications((prev) => {
        if (prev.some((n) => n.title === newNotif.title && n.message === newNotif.message && !n.read)) {
          return prev;
        }
        return [newNotif, ...prev];
      });
    },
    [role, userId]
  );

  const refreshNotifications = useCallback(async () => {
    if (!user || !userId || !localStorage.getItem('auth_token')) return;
    const refreshForUserId = userId;

    try {
      const isStaff = role === 'RECEPCIONISTA' || role === 'ADMINISTRADOR';
      const isDoctor = role === 'ODONTOLOGO';
      const isPatient = role === 'PACIENTE';

      // 1. Consultar catálogos y citas desde backend API y local storage
      const [apiAppsRes, profsRes, personsRes, srvsRes, hubRes] = await Promise.allSettled([
        appointmentService.getAll(),
        professionalService.getAll(),
        personService.getAll(),
        serviceCatalogService.getAll(),
        hubNotificationService.getMine(),
      ]);

      if (refreshForUserId !== userIdRef.current) return;

      // Persisted panel notifications (e.g. schedule changes) so they show even if the user was offline.
      // The `notif-${userId}-` prefix keeps them in every role's merge below.
      const hubItems: HubNotificationDto[] =
        hubRes.status === 'fulfilled' && Array.isArray(hubRes.value) ? hubRes.value : [];
      if (hubItems.length > 0) {
        const hubNotifs: SystemNotification[] = hubItems.map((h) => ({
          id: `notif-${userId}-hub-${h.id}`,
          title: h.title,
          message: h.content,
          time: formatHubTime(h.createdAt),
          read: false,
          type: 'system',
          link:
            role === 'PACIENTE'
              ? '/citas'
              : h.entityType === 'PROFESSIONAL_SCHEDULE'
                ? '/profesionales'
                : '/agenda',
        }));
        setNotifications((prev) => {
          const hubKeys = new Set(hubNotifs.map((n) => `${n.title}\u0000${n.message}`));
          // Drop the live SignalR copy of the same notification; keep its read state.
          const liveReadKeys = new Set(
            prev.filter((n) => n.read && hubKeys.has(`${n.title}\u0000${n.message}`)).map((n) => `${n.title}\u0000${n.message}`)
          );
          const rest = prev.filter(
            (n) => n.id.includes('-hub-') || !hubKeys.has(`${n.title}\u0000${n.message}`)
          );
          const fresh = hubNotifs
            .filter((n) => !rest.some((r) => r.id === n.id))
            .map((n) => ({ ...n, read: liveReadKeys.has(`${n.title}\u0000${n.message}`) }));
          return applyReadFlags([...fresh, ...rest], getReadNotifIds(userId), prev);
        });
      }

      const appointments: AppointmentResponseDto[] =
        apiAppsRes.status === 'fulfilled' && Array.isArray(apiAppsRes.value) ? apiAppsRes.value : [];
      const profsList =
        profsRes.status === 'fulfilled' && Array.isArray(profsRes.value) ? profsRes.value : [];
      const personsList =
        personsRes.status === 'fulfilled' && Array.isArray(personsRes.value) ? personsRes.value : [];
      const srvsList =
        srvsRes.status === 'fulfilled' && Array.isArray(srvsRes.value) ? srvsRes.value : [];

      const personsMap = new Map<string, any>();
      personsList.forEach((p) => {
        if (p.id) personsMap.set(String(p.id).toLowerCase(), p);
      });

      const profsMap = new Map<string, string>();
      profsList.forEach((pr: any) => {
        if (pr.id) {
          const person = pr.personId ? personsMap.get(String(pr.personId).toLowerCase()) : null;
          const name = person
            ? `Dr(a). ${person.firstName || ''} ${person.lastName || ''}`.trim()
            : (pr.fullName || (pr.firstName ? `Dr(a). ${pr.firstName} ${pr.lastName || ''}`.trim() : 'Odontólogo'));
          profsMap.set(String(pr.id).toLowerCase(), name);
        }
      });

      const srvMap = new Map<string, string>();
      srvsList.forEach((s) => {
        if (s.id) srvMap.set(String(s.id).toLowerCase(), s.name);
      });

      // Cargar citas locales de respaldo
      let localCitas: any[] = [];
      const local = localStorage.getItem('nexus_citas');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) localCitas = parsed;
        } catch {
          localCitas = [];
        }
      }

      // Identificar citas pendientes (estado "Pendiente" / "AGENDADA" / statusId 10000000-0000-0000-0000-000000000001 o sin odontólogo)
      const isAppointmentPending = (a: any) => {
        if (a.cancelledAt || a.estado === 'Cancelada' || a.estado === 'Completada') return false;
        const statusId = String(a.appointmentStatusId || '').toLowerCase();
        const statusName = String(a.statusName || a.estado || '').toLowerCase();
        return (
          statusId === '10000000-0000-0000-0000-000000000001' ||
          statusName.includes('pend') ||
          statusName.includes('agend') ||
          statusName.includes('sched') ||
          !a.professionalId ||
          a.professionalId === '00000000-0000-0000-0000-000000000000' ||
          a.estado === 'Pendiente'
        );
      };

      const pendingApiApps = appointments.filter(isAppointmentPending);
      const pendingLocalApps = localCitas.filter(isAppointmentPending);

      // Combinar citas pendientes sin duplicar
      const combinedPending = [...pendingApiApps];
      pendingLocalApps.forEach((lc) => {
        if (!combinedPending.some((ca) => ca.id === lc.id || ca.id === lc.appointmentId)) {
          combinedPending.push(lc);
        }
      });

      // Stale poll after logout / account switch — discard.
      if (refreshForUserId !== userIdRef.current) return;

      setPendingAppointmentsCount(isStaff ? combinedPending.length : 0);

      // Fetch Escalated WhatsApp conversations
      let waNotifs: SystemNotification[] = [];
      if (isStaff) {
        try {
          const convs = await chatbotService.getConversations().catch(() => []);
          const tickets = await chatbotService.getSupportTickets().catch(() => []);
          if (refreshForUserId !== userIdRef.current) return;
          const escalatedConvs = convs.filter(
            (c) =>
              c.conversationStatusId === CONVERSATION_STATUS_IDS.ESCALADA ||
              tickets.some(
                (t) =>
                  t.chatbotConversationId === c.id &&
                  t.ticketStatusId !== TICKET_STATUS_IDS.CERRADO
              )
          );

          waNotifs = escalatedConvs.map((c) => {
            const notifId = `wa-escalated-${c.id}`;
            return {
              id: notifId,
              title: 'Atención requerida en WhatsApp',
              message: `El contacto ${c.chatIdentifier} requiere intervención de un asesor humano.`,
              time: 'Reciente',
              read: false,
              type: 'whatsapp_escalated' as const,
              link: '/atencion-chat',
            };
          });
        } catch {
          waNotifs = [];
        }
      }

      if (refreshForUserId !== userIdRef.current) return;

      // 2. Generar lista de notificaciones para recepción / admin
      if (isStaff) {
        const staffNotifs: SystemNotification[] = [];

        if (combinedPending.length > 0) {
          // Stable id so mark-as-read survives pending-count changes on refresh.
          const summaryNotifId = 'pending-appointments-summary';
          staffNotifs.push({
            id: summaryNotifId,
            title: 'Solicitudes de Citas Pendientes',
            message: `Tienes ${combinedPending.length} ${
              combinedPending.length === 1 ? 'nueva cita pendiente' : 'nuevas citas pendientes'
            } por revisar y gestionar en la agenda.`,
            time: 'Ahora',
            read: false,
            type: 'appointment_pending',
            link: '/agenda',
          });

          // Notificaciones individuales de las citas pendientes más recientes (hasta 6)
          combinedPending.slice(0, 6).forEach((app: any, idx: number) => {
            const notifId = `pending-appt-${app.id || app.appointmentId || idx}`;
            const pName = app.paciente || app.patientName || 'Paciente';
            const sName = app.servicio || (app.serviceId ? srvMap.get(String(app.serviceId).toLowerCase()) : '') || app.serviceName || 'Consulta Odontológica';
            const dName = app.odontologo || app.profesional || (app.professionalId ? profsMap.get(String(app.professionalId).toLowerCase()) : '') || 'Odontólogo asignado';
            const starts = app.startsAt ? new Date(app.startsAt) : null;
            const fechaStr = app.fecha || (starts ? starts.toLocaleDateString('es-CO') : 'Hoy');
            const horaStr = app.hora || app.horaInicio || (starts ? starts.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '');

            staffNotifs.push({
              id: notifId,
              title: `Cita Pendiente • ${pName}`,
              message: `${sName} para el ${fechaStr}${horaStr ? ` a las ${horaStr}` : ''} con ${dName}.`,
              time: horaStr || 'Reciente',
              read: false,
              type: 'appointment_pending',
              link: '/agenda',
            });
          });
        }

        setNotifications((prev) => {
          // Re-read after awaits so mark-as-read during refresh is not lost.
          const freshReadIds = getReadNotifIds(userId);
          const scopedLive = applyReadFlags(
            prev.filter((n) => n.id.startsWith(`notif-${userId}-`)),
            freshReadIds,
            prev,
          );
          const merged = applyReadFlags(
            [...scopedLive, ...staffNotifs, ...waNotifs],
            freshReadIds,
            prev,
          );
          return merged.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i).slice(0, 20);
        });
      } else if (isDoctor) {
        // 3. Notificaciones específicas para Odontólogos
        const docName = (user.name || user.nombre || '').toLowerCase().trim();
        const userPersonId = (user.personId || '').toLowerCase().trim();

        let myProfId = '';
        const matchedProf = profsList.find((p: any) => {
          const pPersonId = String(p.personId || '').toLowerCase().trim();
          if (userPersonId && pPersonId && pPersonId === userPersonId) return true;
          const pName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase().trim();
          return docName && pName && (pName.includes(docName) || docName.includes(pName));
        });
        if (matchedProf?.id) {
          myProfId = String(matchedProf.id);
        }

        const patientMap = new Map<string, string>();
        try {
          const patients = await patientService.getAll().catch(() => []);
          if (refreshForUserId !== userIdRef.current) return;
          const patientsList = Array.isArray(patients) ? patients : (patients as any)?.data || [];
          patientsList.forEach((pt: any) => {
            if (pt.id) {
              const person = pt.personId ? personsMap.get(String(pt.personId).toLowerCase()) : null;
              const name = person ? `${person.firstName || ''} ${person.lastName || ''}`.trim() : (pt.name || 'Paciente');
              patientMap.set(String(pt.id).toLowerCase(), name);
            }
          });
        } catch {
          // ignore
        }

        const docAppointments = appointments.filter((a) => {
          if (a.cancelledAt) return false;
          if (myProfId && a.professionalId && areGuidsEqual(a.professionalId, myProfId)) return true;
          if (user.id && a.professionalId && areGuidsEqual(a.professionalId, user.id)) return true;
          return false;
        });

        const localDocCitas = localCitas.filter((c: any) => {
          const cProf = (c.profesional || c.odontologo || '').toLowerCase().trim();
          return docName && cProf && (cProf.includes(docName) || docName.includes(cProf));
        });

        const docNotifs: SystemNotification[] = [];
        const todayStr = new Date().toISOString().split('T')[0];
        const todayDocAppts = docAppointments.filter((a) => a.startsAt && a.startsAt.startsWith(todayStr));
        const todayLocalCitas = localDocCitas.filter((c) => c.fecha === todayStr);
        const totalHoy = Math.max(todayDocAppts.length, todayLocalCitas.length);

        if (totalHoy > 0) {
          const notifId = `doc-today-summary-${todayStr}`;
          docNotifs.push({
            id: notifId,
            title: 'Agenda del Día',
            message: `Tienes ${totalHoy} ${totalHoy === 1 ? 'paciente programado' : 'pacientes programados'} para hoy.`,
            time: 'Hoy',
            read: false,
            type: 'appointment_confirmed',
            link: '/agenda',
          });
        }

        docAppointments.slice(0, 8).forEach((a) => {
          const notifId = `doc-appt-${a.id}`;
          const starts = a.startsAt ? new Date(a.startsAt) : null;
          const fechaStr = starts ? starts.toLocaleDateString('es-CO') : 'próximamente';
          const horaStr = starts ? starts.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '';
          const pName = (a.patientId && patientMap.get(String(a.patientId).toLowerCase())) || a.patientName || 'Paciente';

          docNotifs.push({
            id: notifId,
            title: 'Cita Asignada en Agenda',
            message: `Consulta con ${pName} programada para el ${fechaStr} a las ${horaStr}.`,
            time: fechaStr,
            read: false,
            type: 'appointment_confirmed',
            link: '/agenda',
          });
        });

        localDocCitas.slice(0, 5).forEach((c: any) => {
          const notifId = `doc-local-${c.id || c.appointmentId}`;
          if (!docNotifs.some((n) => n.id === notifId)) {
            docNotifs.push({
              id: notifId,
              title: 'Cita en Agenda',
              message: `Cita con ${c.paciente || 'Paciente'} el ${c.fecha || ''} a las ${c.hora || c.horaInicio || ''}.`,
              time: c.fecha || 'Agenda',
              read: false,
              type: 'appointment_confirmed',
              link: '/agenda',
            });
          }
        });

        setNotifications((prev) => {
          const freshReadIds = getReadNotifIds(userId);
          const scopedLive = applyReadFlags(
            prev.filter((n) => n.id.startsWith(`notif-${userId}-`)),
            freshReadIds,
            prev,
          );
          const combined = applyReadFlags([...scopedLive, ...docNotifs], freshReadIds, prev);
          return combined.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i).slice(0, 15);
        });
      } else if (isPatient) {
        const patientClinicalId = String(user.patientId || '').toLowerCase().trim();
        const patientPersonId = String(user.personId || '').toLowerCase().trim();
        const patientUserId = String(user.id || '').toLowerCase().trim();
        const patientDoc = String(user.cedula || '').trim();
        const patientEmail = String(user.email || '').toLowerCase().trim();

        // Strict ownership only — never fuzzy name match (that leaked other users' citas).
        const isMyAppointment = (a: any) => {
          const aPatientId = String(a.patientId || '').toLowerCase().trim();
          const aPersonId = String(a.personId || '').toLowerCase().trim();
          const aDoc = String(a.documentNumber || a.patientDocument || a.documento || '').trim();
          const aEmail = String(a.email || a.patientEmail || '').toLowerCase().trim();

          if (patientClinicalId && aPatientId && areGuidsEqual(aPatientId, patientClinicalId)) return true;
          if (patientPersonId && aPersonId && areGuidsEqual(aPersonId, patientPersonId)) return true;
          if (patientPersonId && aPatientId && areGuidsEqual(aPatientId, patientPersonId)) return true;
          if (patientUserId && aPatientId && areGuidsEqual(aPatientId, patientUserId)) return true;
          if (patientDoc && aDoc && aDoc === patientDoc) return true;
          if (patientEmail && aEmail && aEmail === patientEmail) return true;
          return false;
        };

        const myApiAppointments = appointments.filter(isMyAppointment);
        const myLocalCitas = localCitas.filter(isMyAppointment);

        // Combinar citas del paciente sin duplicar
        const allMyAppointments: any[] = [...myApiAppointments];
        myLocalCitas.forEach((lc) => {
          if (!allMyAppointments.some((ma) => ma.id === lc.id || ma.id === lc.appointmentId)) {
            allMyAppointments.push(lc);
          }
        });

        const patientNotifs: SystemNotification[] = [];

        allMyAppointments.slice(0, 10).forEach((app: any, idx: number) => {
          const notifId = `patient-appt-${app.id || app.appointmentId || idx}`;
          const sName = app.servicio || (app.serviceId ? srvMap.get(String(app.serviceId).toLowerCase()) : '') || app.serviceName || 'Consulta Odontológica';
          const dName = app.odontologo || app.profesional || (app.professionalId ? profsMap.get(String(app.professionalId).toLowerCase()) : '') || 'Odontólogo especialista';
          const starts = app.startsAt ? new Date(app.startsAt) : null;
          const fechaStr = app.fecha || (starts ? starts.toLocaleDateString('es-CO') : 'próximamente');
          const horaStr = app.hora || app.horaInicio || (starts ? starts.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '');

          const isPending = isAppointmentPending(app);
          const isCancelled = Boolean(app.cancelledAt || app.estado === 'Cancelada');
          const isCompleted = app.estado === 'Completada';

          if (isPending) {
            patientNotifs.push({
              id: notifId,
              title: 'Cita en Proceso de Aprobación',
              message: `Tu solicitud para ${sName} el ${fechaStr}${horaStr ? ` a las ${horaStr}` : ''} está siendo evaluada por recepción.`,
              time: horaStr || 'Reciente',
              read: false,
              type: 'appointment_pending',
              link: '/citas',
            });
          } else if (isCancelled) {
            patientNotifs.push({
              id: notifId,
              title: 'Cita Cancelada',
              message: `Tu cita para ${sName} el ${fechaStr} ha sido cancelada.`,
              time: fechaStr,
              read: false,
              type: 'appointment_confirmed',
              link: '/citas',
            });
          } else if (isCompleted) {
            patientNotifs.push({
              id: notifId,
              title: 'Atención Odontológica Completada',
              message: `Tu cita para ${sName} del ${fechaStr} fue atendida con éxito.`,
              time: fechaStr,
              read: false,
              type: 'appointment_confirmed',
              link: '/citas',
            });
          } else {
            patientNotifs.push({
              id: notifId,
              title: 'Cita Confirmada en Clínica',
              message: `Tu cita para ${sName} está programada para el ${fechaStr}${horaStr ? ` a las ${horaStr}` : ''} con ${dName}.`,
              time: fechaStr,
              read: false,
              type: 'appointment_confirmed',
              link: '/citas',
            });
          }
        });

        setNotifications((prev) => {
          const freshReadIds = getReadNotifIds(userId);
          const scopedLive = applyReadFlags(
            prev
              .filter((n) => n.id.startsWith(`notif-${userId}-`))
              .map((n) => ({ ...n, link: '/citas' })),
            freshReadIds,
            prev,
          );
          const combined = applyReadFlags([...scopedLive, ...patientNotifs], freshReadIds, prev);
          return combined.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i).slice(0, 15);
        });
      } else {
        setNotifications((prev) => {
          const freshReadIds = getReadNotifIds(userId);
          return applyReadFlags(
            prev.filter((n) => n.id.startsWith(`notif-${userId}-`)),
            freshReadIds,
            prev,
          );
        });
      }
    } catch (err) {
      console.warn('Could not refresh notifications from API:', err);
    }
  }, [user, userId, role]);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 12000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  // Escuchar eventos globales de creación de citas para refrescar en tiempo real
  useEffect(() => {
    const handleEvent = () => {
      refreshNotifications();
    };

    window.addEventListener('nexus_appointment_changed', handleEvent);
    window.addEventListener('nexus_refresh_notifications', handleEvent);
    window.addEventListener('storage', handleEvent);

    return () => {
      window.removeEventListener('nexus_appointment_changed', handleEvent);
      window.removeEventListener('nexus_refresh_notifications', handleEvent);
      window.removeEventListener('storage', handleEvent);
    };
  }, [refreshNotifications]);

  useEffect(() => {
    if (!userId) return;

    let isSubscribed = true;
    const setupSignalR = async () => {
      const conn = await signalRService.startConnection();
      if (conn && isSubscribed) {
        const handlePushEvent = (payload?: any) => {
          if (!payload) {
            refreshNotifications();
            return;
          }

          // Hub DTOs use PascalCase; ignore pushes meant for another user/role.
          const recipientUserId = String(
            payload.recipientUserId || payload.RecipientUserId || '',
          ).toLowerCase();
          if (recipientUserId && userId && !areGuidsEqual(recipientUserId, userId)) {
            return;
          }
          const recipientRoleId = String(
            payload.recipientRoleId || payload.RecipientRoleId || '',
          ).toLowerCase();
          if (recipientRoleId && user?.roleIds?.length) {
            const myRoles = user.roleIds.map((r) => String(r).toLowerCase());
            if (!myRoles.some((r) => areGuidsEqual(r, recipientRoleId))) {
              return;
            }
          }

          const title = payload.title || payload.Title;
          const message = payload.message || payload.Content || payload.content;
          if (title) {
            addNotification({
              title,
              message: message || 'Nueva actualización en tu agenda clínica.',
              link: payload.link || (role === 'PACIENTE' ? '/citas' : '/agenda'),
              type: payload.type || 'appointment_confirmed',
            });
          }
          refreshNotifications();
        };

        signalRService.on('ReceiveNotification', handlePushEvent);
        signalRService.on('AppointmentCreated', handlePushEvent);
        signalRService.on('AppointmentUpdated', handlePushEvent);
        signalRService.on('StatusChanged', handlePushEvent);
      }
    };

    setupSignalR();

    return () => {
      isSubscribed = false;
    };
  }, [userId, user?.roleIds, role, refreshNotifications, addNotification]);

  const markAsRead = useCallback((id: string) => {
    saveReadNotifId(userId, id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, [userId]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      prev.forEach((n) => saveReadNotifId(userId, n.id));
      saveReadNotifId(userId, 'pending-appointments-summary');
      saveReadNotifId(userId, `pending-appointments-summary-${pendingAppointmentsCount}`);
      return prev.map((n) => ({ ...n, read: true }));
    });
  }, [pendingAppointmentsCount, userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        pendingAppointmentsCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
