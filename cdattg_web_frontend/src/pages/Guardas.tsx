/**
 * @module pages/Guardas
 * @description Página de Guardas: CRUD e importación (compone el feature personalRol).
 * @author JDTWOR
 * @created 2026-08-14
 */
import { guardasConfig } from '../features/personalRol/config';
import { PersonalRolPage } from '../features/personalRol/PersonalRolPage';

export const Guardas = () => <PersonalRolPage config={guardasConfig} />;