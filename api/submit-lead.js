module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { nombre, email, reason, medical, plan, origen } = req.body;

    if (!nombre || !email || !reason) {
        return res.status(400).json({ error: 'Campos obligatorios incompletos' });
    }

    const GHL_API_KEY     = process.env.GHL_API_KEY;
    const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
        return res.status(500).json({ error: 'CRM no configurado en el servidor' });
    }

    const parts     = nombre.trim().split(' ');
    const firstName = parts[0] || '';
    const lastName  = parts.slice(1).join(' ') || '';

    const tags = ['integras-lead'];
    if (plan)   tags.push('plan-' + plan);
    if (origen) tags.push(origen === 'Modal' ? 'modal' : 'formulario-contacto');

    const ghlHeaders = {
        'Authorization': 'Bearer ' + GHL_API_KEY,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
    };

    try {
        const contactRes = await fetch('https://services.leadconnectorhq.com/contacts/', {
            method: 'POST',
            headers: ghlHeaders,
            body: JSON.stringify({
                locationId: GHL_LOCATION_ID,
                email,
                firstName,
                lastName,
                name: nombre,
                source: 'Landing Page ÍNTEGRAS',
                tags,
                customFields: [
                    { key: 'motivo_contacto',     field_value: reason        },
                    { key: 'plan_seleccionado',   field_value: plan || ''    },
                    { key: 'limitaciones_fisicas', field_value: medical || '' }
                ]
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

            await fetch('https://services.leadconnectorhq.com/contacts/' + contactId + '/notes', {
                method: 'POST',
                headers: ghlHeaders,
                body: JSON.stringify({
                    body: noteLines.join('\n'),
                    userId: ''
                })
            });
        }

        return res.status(200).json({ success: true, contactId });

    } catch (err) {
        return res.status(500).json({ error: 'Error de red', detail: err.message });
    }
};
