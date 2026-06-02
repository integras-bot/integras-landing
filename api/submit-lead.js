module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { nombre, email, reason, medical, plan, origen } = req.body;

    if (!nombre || !email || !reason) {
        return res.status(400).json({ error: 'Campos obligatorios incompletos' });
    }

    const GHL_API_KEY = process.env.GHL_API_KEY;
    if (!GHL_API_KEY) {
        return res.status(500).json({ error: 'CRM no configurado en el servidor' });
    }

    const parts     = nombre.trim().split(' ');
    const firstName = parts[0] || '';
    const lastName  = parts.slice(1).join(' ') || '';

    const tags = ['integras-lead'];
    if (plan)   tags.push('plan-' + plan);
    if (origen) tags.push(origen === 'Modal' ? 'modal' : 'formulario-contacto');

    try {
        const contactRes = await fetch('https://rest.gohighlevel.com/v1/contacts/', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + GHL_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                firstName,
                lastName,
                name: nombre,
                source: 'Landing Page ÍNTEGRAS',
                tags
            })
        });

        if (!contactRes.ok) {
            const detail = await contactRes.text();
            return res.status(502).json({ error: 'Error al crear contacto en GHL', detail });
        }

        const data      = await contactRes.json();
        const contactId = data.contact?.id;

        if (contactId) {
            const noteLines = [
                plan    ? 'Plan seleccionado: ' + plan : null,
                'Motivo de contacto: ' + reason,
                medical ? 'Diagnóstico / Limitaciones: ' + medical : null,
                'Origen: ' + origen,
                'Fecha: ' + new Date().toLocaleString('es-ES')
            ].filter(Boolean);

            await fetch('https://rest.gohighlevel.com/v1/contacts/' + contactId + '/notes/', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + GHL_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ body: noteLines.join('\n') })
            });
        }

        return res.status(200).json({ success: true, contactId });

    } catch (err) {
        return res.status(500).json({ error: 'Error de red', detail: err.message });
    }
}
