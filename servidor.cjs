const express = require('express');
const axios = require('axios'); // Librería para hacer peticiones HTTP externas
const cors = require('cors');

const app = express();
app.use(cors()); // Permite la comunicación entre el HTML y este servidor

// URL de tu ENDPOINT de N8N (Se mantiene la que proporcionaste)
const EXTERNAL_API_URL = 'https://square-regular-honeybee.ngrok-free.app/webhook/formulario_rrhh_lpa'; 

/**
 * Función auxiliar para convertir un objeto de parámetros en una cadena de consulta (query string).
 * Ejemplo: { a: 'valor1', b: 'valor2' } -> "a=valor1&b=valor2"
 */
const buildQueryString = (params) => {
    // Obtenemos solo los parámetros que tienen un valor definido, no nulo y no vacío
    // Esto es crucial para que el SP sepa que un parámetro no fue enviado (lo recibirá como '')
    const queryParts = Object.keys(params)
        .filter(key => params[key] !== undefined && params[key] !== null)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
    
    return queryParts.join('&');
};

// 2. LA RUTA QUE USARÁ TU HTML (Actúa como Proxy)
app.get('/buscar', async (req, res) => {
    // AHORA: Recolectamos TODOS los parámetros que vienen del frontend
    const frontendParams = req.query; 

    if (!frontendParams.legajo) {
        // El legajo sigue siendo obligatorio, ya que es la clave de búsqueda principal
        return res.status(400).json({ error: "Falta el parámetro 'legajo'." });
    }

    try {
        // Construimos la query string completa con todos los parámetros
        const queryString = buildQueryString(frontendParams);
        const fullExternalUrl = `${EXTERNAL_API_URL}?${queryString}`;
        
        console.log(`Llamando a API externa con filtros: ${fullExternalUrl}`);

        // Hacemos la petición a la API externa (N8N)
        const response = await axios.get(fullExternalUrl);
        
        // Enviamos la respuesta (los documentos) de la API externa directamente al frontend
        res.json(response.data);

    } catch (error) {
        console.error("Error al conectar con la API externa:", error.message);
        
        // Manejo de errores para que el frontend pueda mostrar un mensaje útil
        const statusCode = error.response ? error.response.status : 503;
        const errorMessage = error.response ? (error.response.data || error.message) : 'Servicio externo no disponible o caído.';

        res.status(statusCode).json({ error: "Fallo en la conexión a la API externa.", details: errorMessage });
    }
});

// Arrancar el servidor en el puerto 3000
app.listen(3000, () => {
    console.log('🚀 Proxy API escuchando en http://localhost:3000');
    console.log(`📡 Redirigiendo peticiones base a: ${EXTERNAL_API_URL}`);
});