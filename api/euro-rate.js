// Vercel Function: consulta la tasa EUR/VES de un agregador independiente de datos BCV.
// El BCV no publica nuevas tasas todos los dias (fines de semana y feriados).
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  try {
    const response = await fetch('https://bcv.today/api/v1/rate.json', {
      headers: { 'Cache-Control': 'no-cache' },
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error('Proveedor no disponible: ' + response.status);
    const data = await response.json();
    const rate = Number(data.EUR);
    const effective = String(data.effective_date || data.date || '');
    const today = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Caracas', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
    if (!Number.isFinite(rate) || rate <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(effective)) {
      throw new Error('Datos de tasa invalidos');
    }
    const deltaDays = (Date.parse(today + 'T12:00:00Z') - Date.parse(effective + 'T12:00:00Z')) / 86400000;
    // Se admite la ultima tasa de un dia habil y una tasa anunciada para el dia siguiente.
    // Si lleva mas de 5 dias sin datos, se bloquea para revision.
    if (!Number.isFinite(deltaDays) || deltaDays < -1 || deltaDays > 5) {
      throw new Error('Fecha de tasa fuera de rango');
    }
    res.status(200).json({ EUR: rate, effective_date: effective, source: 'bcv.today', checked_at: new Date().toISOString() });
  } catch (err) {
    console.error('Error consultando EUR BCV:', err.message);
    res.status(503).json({ error: 'No fue posible verificar la tasa EUR/BCV. Intenta de nuevo.' });
  }
};
