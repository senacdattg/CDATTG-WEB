/**
 * @module pages/ImportarGuardas
 * @description Página de importación masiva de Guardas desde Excel (compone el feature personalRol).
 * @author JDTWOR
 * @created 2026-08-14
 */
import { guardasConfig } from '../features/personalRol/config';
import { PersonalRolImportPage } from '../features/personalRol/PersonalRolImportPage';

export const ImportarGuardas = () => <PersonalRolImportPage config={guardasConfig} />;