/**
 * Formatea una fecha respetando el día local o UTC para evitar el desfase de zona horaria (-1 día).
 * Cuando una fecha se almacena a medianoche (00:00:00 UTC), en zonas UTC-3 o UTC-4 como Chile
 * puede mostrarse visualmente como el día anterior a las 20:00 o 21:00 horas.
 */
export function formatLocalDate(
  dateInput: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return '-';

  // Si es string con formato YYYY-MM-DD...
  if (typeof dateInput === 'string') {
    const parts = dateInput.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day).toLocaleDateString('es-CL', options || {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  // Usar timeZone UTC para fechas que fueron grabadas como fecha pura
  return d.toLocaleDateString('es-CL', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options
  });
}
