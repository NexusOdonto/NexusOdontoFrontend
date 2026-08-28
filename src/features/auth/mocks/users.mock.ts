export type Role = "ADMIN" | "ODONTOLOGO" | "RECEPCIONISTA";

export interface User {
  id: number;
  email: string;
  cedula?: string;
  password: string;
  nombre: string;
  apellido: string;
  rol: Role;
  avatar?: string;
  telefono?: string;
}

export const MOCK_USERS: User[] = [
  {
    id: 1,
    email: "admin@nexusodonto.com",
    cedula: "123456789",
    password: "admin123",
    nombre: "Carlos",
    apellido: "Administrador",
    rol: "ADMIN",
    avatar: "https://api.dicebear.com/7.x/avatars/svg?seed=Carlos&backgroundColor=b6e3f4",
    telefono: "+57 300 123 4567",
  },
  {
    id: 2,
    email: "doctor@nexusodonto.com",
    cedula: "987654321",
    password: "doctor123",
    nombre: "Laura",
    apellido: "Gómez",
    rol: "ODONTOLOGO",
    avatar: "https://api.dicebear.com/7.x/avatars/svg?seed=Laura&backgroundColor=ffdfbf",
    telefono: "+57 300 234 5678",
  },
  {
    id: 3,
    email: "recepcion@nexusodonto.com",
    cedula: "456789123",
    password: "recepcion123",
    nombre: "María",
    apellido: "Rodríguez",
    rol: "RECEPCIONISTA",
    avatar: "https://api.dicebear.com/7.x/avatars/svg?seed=Maria&backgroundColor=c0aede",
    telefono: "+57 300 345 6789",
  },
];

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  ADMIN: ["/dashboard", "/citas", "/pacientes", "/servicios", "/usuarios", "/odontograma", "/agenda", "/configuracion"],
  ODONTOLOGO: ["/dashboard", "/citas", "/pacientes", "/odontograma", "/agenda"],
  RECEPCIONISTA: ["/dashboard", "/citas", "/pacientes", "/agenda"],
};

export function hasPermission(role: Role, path: string): boolean {
  return ROLE_PERMISSIONS[role].includes(path);
}

export function authenticateUser(identifier: string, password: string): User | null {
  const user = MOCK_USERS.find(
    (u) => (u.email === identifier || u.cedula === identifier) && u.password === password
  );
  return user || null;
}
