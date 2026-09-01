import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { getUserRole } from '../utils/routePermissions';
import { appointmentService, type AppointmentResponseDto } from '../api/appointmentService';

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'appointment_pending' | 'appointment_confirmed' | 'system';
  link?: string;
}

interface NotificationContextType {
  notifications: SystemNotification[];
  unreadCount: number;
  pendingAppointmentsCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const role = getUserRole(user);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [pendingAppointmentsCount, setPendingAppointmentsCount] = useState<number>(0);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const isStaff = role === 'RECEPCIONISTA' || role === 'ADMINISTRADOR';

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

      setPendingAppointmentsCount(pendingList.length);

      // 2. Generar lista de notificaciones para recepción / admin
      if (isStaff && pendingList.length > 0) {
        const notif: SystemNotification = {
          id: 'pending-appointments-alert',
          title: 'Solicitudes de Citas Pendientes',
          message: `Tienes ${pendingList.length} ${
            pendingList.length === 1 ? 'nueva solicitud de cita' : 'nuevas solicitudes de citas'
          } por revisar y asignar odontólogo.`,
          time: 'Ahora',
          read: false,
          type: 'appointment_pending',
          link: '/citas?filtro=Pendiente',
        };
        setNotifications([notif]);
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
          setNotifications([
            {
              id: 'patient-pending-alert',
              title: 'Cita en Proceso de Aprobación',
              message: `Tu solicitud de cita está siendo evaluada por recepción.`,
              time: 'Reciente',
              read: false,
              type: 'appointment_pending',
              link: '/citas',
            },
          ]);
        } else {
          setNotifications([]);
        }
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.warn('Could not refresh notifications from API:', err);
    }
  }, [user, role]);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 15000); // Polling cada 15 segundos
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
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
