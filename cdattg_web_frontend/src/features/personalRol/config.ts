/**
 * @module features/personalRol/config
 * @description Configuración por rol (Guardas / Personal Administrativo) para páginas CRUD e importación.
 * @author JDTWOR
 * @created 2026-08-14
 */
import type { ComponentType } from 'react';
import { ShieldCheckIcon, UsersIcon } from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { guardasPaths, personalAdministrativoPaths } from '../../routes/paths';
import type { PaginatedResponse } from '../../types';
import type { PersonalRolImportLogItem, PersonalRolImportResult, PersonalRolItem } from './types';

export interface PersonalRolModuleConfig {
  /** Nombre singular del rol (guarda, personal administrativo). */
  objectName: string;
  /** Ruta hacia la página de importación. */
  importPath: string;
  /** Nombre sugerido al descargar la plantilla. */
  templateFilename: string;
  /** Icono del encabezado de la página de importación. */
  importIcon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  labels: {
    title: string;
    subtitle: string;
    nuevo: string;
    crear: string;
    crearModalTitle: string;
    editarModalTitle: string;
    verModalTitle: string;
    eliminarModalTitle: string;
    eliminarConfirm: (nombre: string) => string;
    importar: string;
    importarTitle: string;
    importarDescription: string;
    nivelSingular: string;
    buenasPracticas: string[];
  };
  api: {
    list(page: number, pageSize: number, search?: string): Promise<PaginatedResponse<PersonalRolItem>>;
    create(personaId: number): Promise<PersonalRolItem>;
    update(id: number, estado: boolean): Promise<PersonalRolItem>;
    remove(id: number): Promise<void>;
    listImports(): Promise<PersonalRolImportLogItem[]>;
    upload(file: File): Promise<PersonalRolImportResult>;
    downloadTemplate(): Promise<Blob>;
  };
}

export const guardasConfig: PersonalRolModuleConfig = {
  objectName: 'guarda',
  importPath: guardasPaths.importar,
  templateFilename: 'plantilla_importar_guardas.xlsx',
  importIcon: ShieldCheckIcon,
  labels: {
    title: 'Guardas',
    subtitle: 'Gestiona y administra las guardas de seguridad del SENA',
    nuevo: 'Nueva Guarda',
    crear: 'Crear Guarda',
    crearModalTitle: 'Crear Guarda',
    editarModalTitle: 'Editar guarda',
    verModalTitle: 'Detalle de la guarda',
    eliminarModalTitle: 'Eliminar guarda',
    eliminarConfirm: (nombre) =>
      `¿Está seguro de eliminar a la guarda ${nombre}? Esta acción no se puede deshacer.`,
    importar: 'Importar guardas',
    importarTitle: 'Importar Guardas',
    importarDescription:
      'Carga masiva de guardas desde Excel. Se crean personas si no existen y se vinculan como guardas.',
    nivelSingular: 'guarda',
    buenasPracticas: [
      'La primera fila debe ser encabezados: NOMBRES Y APELLIDOS COMPLETO, TIPO DOCUMENTO, IDENTIFICACIÓN, NUMERO TELEFONO, CORREO PERSONAL, FECHA DE NACIMIENTO, GÉNERO.',
      'Tipo de documento: use "Cédula de Ciudadanía", "CC", o el nombre completo del tipo según el catálogo.',
      'Si la persona no existe se crea; si ya es guarda se cuenta como duplicado y no se genera error.',
    ],
  },
  api: {
    list: (page, pageSize, search) => apiService.getGuardas(page, pageSize, search),
    create: (personaId) => apiService.createGuardaFromPersona({ persona_id: personaId }),
    update: (id, estado) => apiService.updateGuarda(id, { estado }),
    remove: (id) => apiService.deleteGuarda(id),
    listImports: () => apiService.getGuardaImports(50),
    upload: (file) => apiService.uploadGuardasImport(file),
    downloadTemplate: () => apiService.downloadGuardaImportTemplate(),
  },
};

export const personalAdministrativoConfig: PersonalRolModuleConfig = {
  objectName: 'personal administrativo',
  importPath: personalAdministrativoPaths.importar,
  templateFilename: 'plantilla_importar_personal_administrativo.xlsx',
  importIcon: UsersIcon,
  labels: {
    title: 'Personal Administrativo',
    subtitle: 'Gestiona y administra el personal administrativo del SENA',
    nuevo: 'Nuevo Personal Administrativo',
    crear: 'Crear Personal Administrativo',
    crearModalTitle: 'Crear Personal Administrativo',
    editarModalTitle: 'Editar personal administrativo',
    verModalTitle: 'Detalle del personal administrativo',
    eliminarModalTitle: 'Eliminar personal administrativo',
    eliminarConfirm: (nombre) =>
      `¿Está seguro de eliminar al personal administrativo ${nombre}? Esta acción no se puede deshacer.`,
    importar: 'Importar personal administrativo',
    importarTitle: 'Importar Personal Administrativo',
    importarDescription:
      'Carga masiva de personal administrativo desde Excel. Se crean personas si no existen y se vinculan.',
    nivelSingular: 'personal administrativo',
    buenasPracticas: [
      'La primera fila debe ser encabezados: NOMBRES Y APELLIDOS COMPLETO, TIPO DOCUMENTO, IDENTIFICACIÓN, NUMERO TELEFONO, CORREO PERSONAL, FECHA DE NACIMIENTO, GÉNERO.',
      'Tipo de documento: use "Cédula de Ciudadanía", "CC", o el nombre completo del tipo según el catálogo.',
      'Si la persona no existe se crea; si ya es personal administrativo se cuenta como duplicado y no se genera error.',
    ],
  },
  api: {
    list: (page, pageSize, search) => apiService.getPersonalAdministrativo(page, pageSize, search),
    create: (personaId) => apiService.createPersonalAdministrativoFromPersona({ persona_id: personaId }),
    update: (id, estado) => apiService.updatePersonalAdministrativo(id, { estado }),
    remove: (id) => apiService.deletePersonalAdministrativo(id),
    listImports: () => apiService.getPersonalAdministrativoImports(50),
    upload: (file) => apiService.uploadPersonalAdministrativoImport(file),
    downloadTemplate: () => apiService.downloadPersonalAdministrativoImportTemplate(),
  },
};