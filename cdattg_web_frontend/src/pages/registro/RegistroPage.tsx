/**
 * @module pages/registro/RegistroPage
 * @description Página pública para crear usuario y contraseña.
 * @author Cristian Deysdayr Jiménez
 */
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import LogoSena from '../../../logo-sena-verde-complementario-svg-2022.svg';
import { useTheme } from '../../context/ThemeContext';
import { RegistroFormulario } from './RegistroFormulario';

/**
 * Crear cuenta en asistente de cinco pasos.
 */
export function RegistroPage() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-10 dark:from-gray-900 dark:to-gray-800">
      <button type="button" onClick={toggleTheme} className="absolute right-4 top-4 rounded-lg bg-white p-2 shadow dark:bg-gray-700" aria-label="Cambiar tema">
        {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5 text-yellow-300" />}
      </button>
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="text-center">
          <img src={LogoSena} alt="SENA" className="mx-auto h-16 w-16 rounded-2xl shadow-lg" />
          <h1 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white">Crear cuenta</h1>
        </div>
        <RegistroFormulario />
      </div>
    </div>
  );
}
