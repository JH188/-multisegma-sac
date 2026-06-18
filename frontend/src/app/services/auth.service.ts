import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, tap } from 'rxjs';


export interface User {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly USERS_KEY = 'lisume-users';
private readonly CURRENT_KEY = 'lisume-current-user';
  private STORAGE_KEY = 'lisume-users';
  private USER_KEY = 'multisegma-current-user';
private ADMIN_KEY = 'multisegma-current-admin';
  private API_URL = 'https://multisegma-sac-production.up.railway.app/api/auth';
  constructor(private http: HttpClient) {}
  private DEFAULT_ADMIN: User = {
    name: 'Administrador Multisegma',
    email: 'admin@multisegma.com',
    password: 'admin123',
    role: 'admin',
    createdAt: new Date().toISOString(),
  };
  private toSafeUser(user: any): Omit<User, 'password'> {
  const normalized = this.normalizeUser(user);

  return {
    name: normalized.name,
    email: normalized.email,
    role: normalized.role,
    createdAt: normalized.createdAt,
  };
}

  private normalizeUser(user: any): User {
    return {
      name:
        user?.name ||
        user?.nombre ||
        user?.customerName ||
        user?.cliente ||
        'Cliente',
      email: String(user?.email || user?.correo || user?.customerEmail || '')
        .trim()
        .toLowerCase(),
      password: String(user?.password || ''),
      role: user?.role === 'admin' ? 'admin' : 'user',
      createdAt: user?.createdAt || new Date().toISOString(),
    };
  }

  private ensureAdmin(): void {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    let list: User[] = [];

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        list = Array.isArray(parsed) ? parsed.map((u) => this.normalizeUser(u)) : [];
      } catch {
        list = [];
      }
    }

    // Eliminar admin antiguo
    list = list.filter(
      (u) => u.email.toLowerCase() !== 'admin@lisume.com'
    );

    const adminIndex = list.findIndex(
      (u) => u.email.toLowerCase() === this.DEFAULT_ADMIN.email.toLowerCase()
    );

    if (adminIndex >= 0) {
      list[adminIndex] = {
        ...list[adminIndex],
        name: this.DEFAULT_ADMIN.name,
        email: this.DEFAULT_ADMIN.email,
        password: this.DEFAULT_ADMIN.password,
        role: 'admin',
        createdAt: list[adminIndex].createdAt || new Date().toISOString(),
      };
    } else {
      list.push(this.DEFAULT_ADMIN);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
  }

  private get users(): User[] {
    this.ensureAdmin();

    const raw = localStorage.getItem(this.STORAGE_KEY);

    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map((u) => this.normalizeUser(u)) : [];
    } catch {
      return [];
    }
  }

  private set users(list: User[]) {
    const normalized = list.map((u) => this.normalizeUser(u));
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(normalized));
  }

 registerBackend(name: string, email: string, password: string): Observable<boolean> {
  const body = {
    name: String(name || '').trim(),
    nombre: String(name || '').trim(),
    email: String(email || '').trim().toLowerCase(),
    correo: String(email || '').trim().toLowerCase(),
    password: String(password || '').trim(),
  };

  return this.http.post<any>(`${this.API_URL}/register`, body).pipe(
    tap((user) => {
  const safeUser = this.toSafeUser(user);
  localStorage.setItem(this.USER_KEY, JSON.stringify(safeUser));
}),
    map(() => true),
    catchError((error) => {
      console.error('Error registrando usuario en backend:', error);
      return of(false);
    })
  );
}

loginBackend(email: string, password: string): Observable<boolean> {
  const body = {
    email: String(email || '').trim().toLowerCase(),
    correo: String(email || '').trim().toLowerCase(),
    password: String(password || '').trim(),
  };

  return this.http.post<any>(`${this.API_URL}/login`, body).pipe(
    tap((user) => {
  const safeUser = this.toSafeUser(user);

  if (safeUser.role === 'admin') {
    localStorage.setItem(this.ADMIN_KEY, JSON.stringify(safeUser));
  } else {
    localStorage.setItem(this.USER_KEY, JSON.stringify(safeUser));
  }
}),
    map(() => true),
    catchError((error) => {
      console.error('Error iniciando sesión en backend:', error);
      return of(false);
    })
  );
}

  login(email: string, password: string): boolean {
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    const user = this.users.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail &&
        u.password === cleanPassword
    );

    if (!user) {
      return false;
    }

    const safeUser = this.toSafeUser(user);

    if (safeUser.role === 'admin') {
      localStorage.setItem(this.ADMIN_KEY, JSON.stringify(safeUser));
    } else {
      localStorage.setItem(this.USER_KEY, JSON.stringify(safeUser));
    }

    return true;
  }

  logout(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  logoutAdmin(): void {
    localStorage.removeItem(this.ADMIN_KEY);
  }

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);

    if (!raw) return null;

    try {
      const current = this.normalizeUser(JSON.parse(raw));

      if (!current.email) {
        localStorage.removeItem(this.USER_KEY);
        return null;
      }

      const userFromList = this.users.find(
        (u) => u.email.toLowerCase() === current.email.toLowerCase()
      );

      const finalUser = userFromList
        ? this.normalizeUser({
            ...current,
            ...userFromList,
          })
        : current;

      const safeUser = this.toSafeUser(finalUser);
      localStorage.setItem(this.USER_KEY, JSON.stringify(safeUser));

      return this.normalizeUser(safeUser);
    } catch {
      localStorage.removeItem(this.USER_KEY);
      return null;
    }
  }

  getCurrentAdmin(): User | null {
    const raw = localStorage.getItem(this.ADMIN_KEY);

    if (!raw) return null;

    try {
      const current = this.normalizeUser(JSON.parse(raw));

      if (!current.email || current.role !== 'admin') {
        localStorage.removeItem(this.ADMIN_KEY);
        return null;
      }

      return current;
    } catch {
      localStorage.removeItem(this.ADMIN_KEY);
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getCurrentUser();
  }

  isAdmin(): boolean {
    return this.getCurrentAdmin()?.role === 'admin';
  }

  getUserName(): string {
    return this.getCurrentUser()?.name || '';
  }

  getUserEmail(): string {
    return this.getCurrentUser()?.email || '';
  }

  getBackendUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/users`);
  }

  getAllUsers(): User[] {
    return this.users;
  }
  // ==============================
// CLIENTE: RESTABLECER CONTRASEÑA
// ==============================
resetPassword(email: string, newPassword: string): Observable<boolean> {
  const cleanEmail = email.trim().toLowerCase();

  const usersRaw = localStorage.getItem(this.USERS_KEY);
  const users = usersRaw ? JSON.parse(usersRaw) : [];

  const index = users.findIndex(
    (u: any) => (u.email || '').trim().toLowerCase() === cleanEmail
  );

  if (index === -1) {
    return of(false);
  }

  users[index].password = newPassword;

  localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

  return of(true);
}
forgotPassword(email: string): Observable<any> {
  return this.http.post<any>(`${this.API_URL}/forgot-password`, {
    email,
  });
}

resetPasswordWithCode(
  email: string,
  code: string,
  newPassword: string
): Observable<any> {
  return this.http.post<any>(`${this.API_URL}/reset-password`, {
    email,
    code,
    newPassword,
  });
}
}