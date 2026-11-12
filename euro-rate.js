// Vercel serverless function: tasa EUR/VES tomada de un proveedor independiente que recopila datos BCV.
module.exports = async function handler(req,res) {
  res.setHeader('Cache-Control','no-store, max-age=0');
  try {
    const response=await fetch('https://bcv.today/api/v1/rate.json',{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw new Error('Proveedor no disponible');
    const data=await response.json();
    const rate=Number(data.EUR);
    const effective=String(data.effective_date||'');
    const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Caracas',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    if(!Number.isFinite(rate)||rate<=0||effective!==today)throw new Error('Tasa no vigente');
    res.status(200).json({EUR:rate,effective_date:effective,source:'bcv.today (datos publicados por BCV)'});
  }catch(err){res.status(503).json({error:'No se pudo verificar la tasa BCV vigente'});}
};
