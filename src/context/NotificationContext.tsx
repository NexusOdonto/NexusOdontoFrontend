import { chatbotService, CONVERSATION_STATUS_IDS, TICKET_STATUS_IDS } from '../api/chatbotService';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { getUserRole } from '../utils/routePermissions';
import { appointmentService, type AppointmentResponseDto } from '../api/appointmentService';
import { professionalService } from '../api/professionalService';
import { patientService } from '../api/patientService';
import { personService } from '../api/personService';
import { areGuidsEqual } from '../utils/roleUtils';
import { signalRService } from '../api/signalrService';

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

const getReadNotifIds = (): Set<string> => {
  try {
    const raw = sessionStorage.getItem('nexus_read_notif_ids');
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveReadNotifId = (id: string) => {
  try {
    const current = getReadNotifIds();
    current.add(id);
    sessionStorage.setItem('nexus_read_notif_ids', JSON.stringify(Array.from(current)));
  } catch {
    // Ignore
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const role = getUserRole(user);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [pendingAppointmentsCount, setPendingAppointmentsCount] = useState<number>(0);

  const addNotification = useCallback(
    (notif: { title: string; message: string; link?: string; type?: 'system' | 'whatsapp_escalated' | 'appointment_confirmed' | 'appointment_pending' }) => {
      const newNotif: SystemNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: notif.title,
        message: notif.message,
        time: 'Ahora',
        read: false,
        type: notif.type || 'system',
        link: notif.link || '/agenda',
      };

      setNotifications((prev) => {
        if (prev.some((n) => n.title === newNotif.title && n.message === newNotif.message && !n.read)) {
          return prev;
        }
        return [newNotif, ...prev];
      });
    },
    []
  );

  const refreshNotifications = useCallback(async () => {
    if (!user || !localStorage.getItem('auth_token')) return;

    try {
      const isStaff = role === 'RECEPCIONISTA' || role === 'ADMINISTRADOR';
      const isDoctor = role === 'ODONTOLOGO';
      const readIds = getReadNotifIds();

      // 1. Consultar citas desde backend API o local storage
      const appointments: AppointmentResponseDto[] = await appointmentService.getAll().catch(() => []);
      
      let pendingList: AppointmentResponseDto[] = [];
      if (appointments && appointments.length > 0) {
        pendingList = appointments.filter(
          (a) => !a.cancelledAt && (!a.professionalId || a.professionalId === '00000000-0000-0000-0000-000000000000')
        );
      } else {
        // Fallback local
        const local = localStorage.getItem('nexus_citas');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed)) {
              pendingList = parsed.filter((c: any) => c.estado === 'Pendiente');
            }
          } catch {
            pendingList = [];
          }
        }
      }

      setPendingAppointmentsCount(isStaff ? pendingList.length : 0);

      // Fetch Escalated WhatsApp conversations
      let waNotifs: SystemNotification[] = [];
      if (isStaff) {
        try {
          const convs = await chatbotService.getConversations().catch(() => []);
          const tickets = await chatbotService.getSupportTickets().catch(() => []);
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
              read: readIds.has(notifId),
              type: 'whatsapp_escalated' as const,
              link: '/atencion-chat',
            };
          });
        } catch {
          waNotifs = [];
        }
      }

      // 2. Generar lista de notificaciones para recepción / admin
      if (isStaff && pendingList.length > 0) {
        const notifId = `pending-appointments-alert-${pendingList.length}`;
        const notif: SystemNotification = {
          id: notifId,
          title: 'Solicitudes de Citas Pendientes',
          message: `Tienes ${pendingList.length} ${
            pendingList.length === 1 ? 'nueva solicitud de cita' : 'nuevas solicitudes de citas'
          } por revisar y asignar odontólogo.`,
          time: 'Ahora',
          read: readIds.has(notifId) || readIds.has('pending-appointments-alert'),
          type: 'appointment_pending',
          link: '/citas?filtro=Pendiente',
        };
        setNotifications((prev) => {
          const liveNotifs = prev.filter((n) => n.id.startsWith('notif-'));
          return [...liveNotifs, notif, ...waNotifs];
        });
      } else if (isDoctor) {
        // 3. Notificaciones específicas para Odontólogos
        const docName = (user.name || user.nombre || '').toLowerCase().trim();
        const userPersonId = (user.personId || '').toLowerCase().trim();

        // Obtener lista de profesionales para mapear al doctor logueado
        let myProfId = '';
        try {
          const profs = await professionalService.getAll().catch(() => []);
          const profsList = Array.isArray(profs) ? profs : (profs as any)?.data || [];
          const matchedProf = profsList.find((p: any) => {
            const pPersonId = String(p.personId || '').toLowerCase().trim();
            if (userPersonId && pPersonId && pPersonId === userPersonId) return true;
            const pName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase().trim();
            return docName && pName && (pName.includes(docName) || docName.includes(pName));
          });
          if (matchedProf?.id) {
            myProfId = String(matchedProf.id);
          }
        } catch {
          // ignore
        }

        // Obtener nombres de personas / pacientes
        const personMap = new Map<string, string>();
        try {
          const persons = await personService.getAll().catch(() => []);
          const personsList = Array.isArray(persons) ? persons : (persons as any)?.data || [];
          personsList.forEach((p: any) => {
            if (p.id) personMap.set(String(p.id).toLowerCase(), `${p.firstName || ''} ${p.lastName || ''}`.trim());
          });
        } catch {
          // ignore
        }

        const patientMap = new Map<string, string>();
        try {
          const patients = await patientService.getAll().catch(() => []);
          const patientsList = Array.isArray(patients) ? patients : (patients as any)?.data || [];
          patientsList.forEach((pt: any) => {
            if (pt.id) {
              const name = pt.personId ? personMap.get(String(pt.personId).toLowerCase()) : `${pt.firstName || ''} ${pt.lastName || ''}`.trim();
              if (name) patientMap.set(String(pt.id).toLowerCase(), name);
            }
          });
        } catch {
          // ignore
        }

        // Filtrar citas del doctor
        const docAppointments = appointments.filter((a) => {
          if (a.cancelledAt) return false;
          if (myProfId && a.professionalId && areGuidsEqual(a.professionalId, myProfId)) return true;
          if (user.id && a.professionalId && areGuidsEqual(a.professionalId, user.id)) return true;
          return false;
        });

        // Citas locales
        let localDocCitas: any[] = [];
        const local = localStorage.getItem('nexus_citas');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed)) {
              localDocCitas = parsed.filter((c: any) => {
                const cProf = (c.profesional || c.odontologo || '').toLowerCase().trim();
                return docName && cProf && (cProf.includes(docName) || docName.includes(cProf));
              });
            }
          } catch {
            localDocCitas = [];
          }
        }

        const docNotifs: SystemNotification[] = [];

        // Notificación resumen de citas de hoy
        const todayStr = new Date().toISOString().split('T')[0];
        const todayDocAppts = docAppointments.filter((a) => a.startsAt && a.startsAt.startsWith(todayStr));
        const todayLocalCitas = localDocCitas.filter((c) => c.fecha === todayStr);
        const totalHoy = Math.max(todayDocAppts.length, todayLocalCitas.length);

        if (totalHoy > 0) {
          const notifId = `doc-today-summary-${todayStr}-${totalHoy}`;
          docNotifs.push({
            id: notifId,
            title: 'Agenda del Día',
            message: `Tienes ${totalHoy} ${totalHoy === 1 ? 'paciente programado' : 'pacientes programados'} para hoy.`,
            time: 'Hoy',
            read: readIds.has(notifId),
            type: 'appointment_confirmed',
            link: '/agenda',
          });
        }

        // Notificaciones individuales de citas asignadas al odontólogo
        docAppointments.slice(0, 8).forEach((a) => {
          const notifId = `doc-appt-${a.id}`;
          const starts = a.startsAt ? new Date(a.startsAt) : null;
          const fechaStr = starts ? starts.toLocaleDateString('es-CO') : 'próximamente';
          const horaStr = starts ? starts.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '';
          const pName = (a.patientId && patientMap.get(String(a.patientId).toLowerCase())) || 'Paciente';

          docNotifs.push({
            id: notifId,
            title: 'Cita Asignada en Agenda',
            message: `Consulta con ${pName} programada para el ${fechaStr} a las ${horaStr}.`,
            time: fechaStr,
            read: readIds.has(notifId),
            type: 'appointment_confirmed',
            link: '/agenda',
          });
        });

        localDocCitas.slice(0, 5).forEach((c: any) => {
          const notifId = `doc-local-${c.id}`;
          if (!docNotifs.some((n) => n.id === notifId)) {
            docNotifs.push({
              id: notifId,
              title: 'Cita en Agenda',
              message: `Cita con ${c.paciente || 'Paciente'} el ${c.fecha || ''} a las ${c.hora || ''}.`,
              time: c.fecha || 'Agenda',
              read: readIds.has(notifId),
              type: 'appointment_confirmed',
              link: '/agenda',
            });
          }
        });

        setNotifications((prev) => {
          const liveNotifs = prev.filter((n) => n.id.startsWith('notif-'));
          const combined = [...liveNotifs, ...docNotifs];
          return combined.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i).slice(0, 15);
        });
      } else if (role === 'PACIENTE') {
        const local = localStorage.getItem('nexus_citas');
        let ownPending = 0;
        if (local) {
          try {
            const parsed = JSON.parse(local);
            const pName = (user.name || user.nombre || '').toLowerCase();
            ownPending = parsed.filter((c: any) => c.estado === 'Pendiente' && c.paciente.toLowerCase().includes(pName)).length;
          } catch {
            ownPending = 0;
          }
        }
        if (ownPending > 0) {
          const notifId = `patient-pending-alert-${ownPending}`;
          setNotifications((prev) => {
            const liveNotifs = prev.filter((n) => n.id.startsWith('notif-'));
            return [
              ...liveNotifs,
              {
                id: notifId,
                title: 'Cita en Proceso de Aprobación',
                message: `Tu solicitud de cita está siendo evaluada por recepción.`,
                time: 'Reciente',
                read: readIds.has(notifId) || readIds.has('patient-pending-alert'),
                type: 'appointment_pending',
                link: '/citas',
              },
            ];
          });
        } else {
          setNotifications((prev) => prev.filter((n) => n.id.startsWith('notif-')));
        }
      } else {
        setNotifications((prev) => prev.filter((n) => n.id.startsWith('notif-')));
      }
    } catch (err) {
      console.warn('Could not refresh notifications from API:', err);
    }
  }, [user, role]);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 20000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;

    let isSubscribed = true;
    const setupSignalR = async () => {
      const conn = await signalRService.startConnection();
      if (conn && isSubscribed) {
        const handlePushEvent = (payload?: any) => {
          if (payload && payload.title) {
            addNotification({
              title: payload.title,
              message: payload.message || 'Nueva actualización en tu agenda clínica.',
              link: payload.link || '/agenda',
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
  }, [userId, refreshNotifications, addNotification]);

  const markAsRead = (id: string) => {
    saveReadNotifId(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    notifications.forEach((n) => saveReadNotifId(n.id));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

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
