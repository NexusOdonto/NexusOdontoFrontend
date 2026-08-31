export type Role = "ADMINISTRADOR" | "ODONTOLOGO" | "RECEPCIONISTA" | "PACIENTE";

export interface User {
  id: number | string;
  email: string;
  cedula: string;
  password: string;
  nombre: string;
  apellido: string;
  rol: Role;
  avatar?: string;
  telefono?: string;
  direccion?: string;
  sexo?: string;
}

export const MOCK_USERS: User[] = [
  {
    id: 1,
    email: "admin@nexusodonto.com",
    cedula: "1234567890",
    password: "Admin123!",
    nombre: "Carlos",
    apellido: "Administrador",
    rol: "ADMINISTRADOR",
    avatar: "https://api.dicebear.com/7.x/avatars/svg?seed=Carlos&backgroundColor=b6e3f4",
    telefono: "+57 300 123 4567",
    direccion: "Calle 100 # 15-20, Bogotá",
    sexo: "Masculino",
  },
  {
    id: 2,
    email: "odontologo@nexusodonto.com",
    cedula: "1098765432",
    password: "Doctor123!",
    nombre: "Laura",
    apellido: "Gómez",
    rol: "ODONTOLOGO",
    avatar: "https://api.dicebear.com/7.x/avatars/svg?seed=Laura&backgroundColor=ffdfbf",
    telefono: "+57 300 234 5678",
    direccion: "Carrera 7 # 120-40, Bogotá",
    sexo: "Femenino",
  },
  {
    id: 3,
    email: "recepcion@nexusodonto.com",
    cedula: "1087654321",
    password: "Recepcion123!",
    nombre: "María",
    apellido: "Rodríguez",
    rol: "RECEPCIONISTA",
    avatar: "https://api.dicebear.com/7.x/avatars/svg?seed=Maria&backgroundColor=c0aede",
    telefono: "+57 300 345 6789",
    direccion: "Avenida 68 # 45-30, Bogotá",
    sexo: "Femenino",
  },
  {
    id: 4,
    email: "paciente@nexusodonto.com",
    cedula: "1076543210",
    password: "Paciente123!",
    nombre: "Andrés",
    apellido: "Pérez",
    rol: "PACIENTE",
    avatar: "https://api.dicebear.com/7.x/avatars/svg?seed=Andres&backgroundColor=d1f4d9",
    telefono: "+57 300 456 7890",
    direccion: "Calle 45 # 28-10, Bogotá",
    sexo: "Masculino",
  },
];

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  ADMINISTRADOR: [
    "/dashboard",
    "/citas",
    "/agenda",
    "/pacientes",
    "/pacientes/nuevo",
    "/profesionales",
    "/servicios",
    "/historia-clinica",
    "/odontograma",
    "/usuarios",
    "/roles-permisos",
    "/configuracion",
    "/perfil",
  ],
  ODONTOLOGO: [
    "/dashboard",
    "/citas",
    "/agenda",
    "/pacientes",
    "/pacientes/nuevo",
    "/historia-clinica",
    "/odontograma",
    "/perfil",
  ],
  RECEPCIONISTA: [
    "/dashboard",
    "/citas",
    "/agenda",
    "/pacientes",
    "/pacientes/nuevo",
    "/profesionales",
    "/servicios",
    "/perfil",
  ],
  PACIENTE: [
    "/dashboard",
    "/citas",
    "/perfil",
  ],
};

export function hasPermission(role: Role, path: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(path) ?? false;
}

export function authenticateUser(identifier: string, password: string): User | null {
  const cleanIdentifier = identifier.trim().toLowerCase();
  const user = MOCK_USERS.find(
    (u) =>
      (u.email.toLowerCase() === cleanIdentifier || u.cedula === cleanIdentifier) &&
      u.password === password
  );
  return user || null;
}