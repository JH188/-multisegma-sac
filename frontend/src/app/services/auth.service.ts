import { Injectable } from '@angular/core';

export interface User {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private STORAGE_KEY = 'lisume-users';
  private CURRENT_KEY = 'lisume-current-user';

 private DEFAULT_ADMIN: User = {
  name: 'Administrador Multisegma',
  email: 'admin@multisegma.com',
  password: 'admin123',
  role: 'admin',
  createdAt: new Date().toISOString(),
};

  private ensureAdmin(): void {
  const raw = localStorage.getItem(this.STORAGE_KEY);

  if (!raw) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify([this.DEFAULT_ADMIN]));
    return;
  }

  const list = JSON.parse(raw) as User[];
  let changed = false;

  // Eliminar admin antiguo si existe
  const oldAdminIndex = list.findIndex(
    (u) => u.email.toLowerCase() === 'admin@lisume.com'
  );

  if (oldAdminIndex >= 0) {
    list.splice(oldAdminIndex, 1);
    changed = true;
  }

  // Verificar si ya existe el admin nuevo
  const adminIndex = list.findIndex(
    (u) => u.email.toLowerCase() === this.DEFAULT_ADMIN.email.toLowerCase()
  );

  if (adminIndex >= 0) {
    // Actualiza la contraseña y datos del admin nuevo
    list[adminIndex] = {
      ...list[adminIndex],
      name: this.DEFAULT_ADMIN.name,
      email: this.DEFAULT_ADMIN.email,
      password: this.DEFAULT_ADMIN.password,
      role: 'admin',
      createdAt: list[adminIndex].createdAt || new Date().toISOString(),
    };
    changed = true;
  } else {
    // Si no existe, lo crea
    list.push(this.DEFAULT_ADMIN);
    changed = true;
  }

  // Normalizar usuarios
  for (const u of list) {
    if (!u.createdAt) {
      u.createdAt = new Date().toISOString();
      changed = true;
    }

    if (!u.role) {
      u.role = 'user';
      changed = true;
    }
  }

  if (changed) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
  }
}

  private get users(): User[] {
    this.ensureAdmin();
    const raw = localStorage.getItem(this.STORAGE_KEY);
    return raw ? JSON.parse(raw) as User[] : [];
  }

  private set users(list: User[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
  }

  register(name: string, email: string, password: string): boolean {
    const list = this.users;

    if (list.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return false;
    }

    const nuevo: User = {
      name,
      email,
      password,
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    list.push(nuevo);
    this.users = list;
    return true;
  }

  login(email: string, password: string): boolean {
    const user = this.users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password
    );

    if (!user) {
      return false;
    }

    localStorage.setItem(this.CURRENT_KEY, JSON.stringify(user));
    return true;
  }

  logout(): void {
    localStorage.removeItem(this.CURRENT_KEY);
  }

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(this.CURRENT_KEY);
    return raw ? JSON.parse(raw) as User : null;
  }

  isLoggedIn(): boolean {
    return !!this.getCurrentUser();
  }

  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'admin';
  }

  getUserName(): string {
    return this.getCurrentUser()?.name ?? '';
  }

  getAllUsers(): User[] {
    return this.users;
  }
}