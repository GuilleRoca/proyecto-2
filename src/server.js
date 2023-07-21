const express = require('express');
const { connectToCollection, desconnect, generateCodigo } = require('../connection_db.js');

const server = express();

// Middlewares
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Obtener todos los muebles (filtros opcionales): Ruta GET http://127.0.0.1:3005/muebles
server.get('/muebles', async (req, res) => {
    const { categoria , precio_igual_mayor_que , precio_igual_menor_que } = req.query;
    let muebles = [];    

    try {
        const collection = await connectToCollection('muebles');
        if (categoria) muebles = await collection.find({ categoria }).sort({ codigo: 1 }).toArray();
        else if (precio_igual_mayor_que) muebles = await collection.find({ precio: { $gte: Number(precio_igual_mayor_que) } }).sort({ precio: 1 }).toArray();
        else if (precio_igual_menor_que) muebles = await collection.find({ precio: { $lte: Number(precio_igual_menor_que) } }).sort({ precio: -1 }).toArray();
        else muebles = await collection.find().toArray();

        res.status(200).send(JSON.stringify({payload: muebles}, null, '\t'));
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Se ha generado un error en el servidor');
    } finally {
        await desconnect();
    }
});

// Obtener un mueble específico por código: Ruta GET http://127.0.0.1:3005/muebles/:codigo
server.get('/muebles/:codigo', async (req, res) => {
    const { codigo } = req.params;

    try {
        const collection = await connectToCollection('muebles');
        const mueble = await collection.findOne({ codigo: { $eq: Number(codigo) } });

        if (!mueble) return res.status(400).send('El código no corresponde a un mueble registrado');

        res.status(200).send(JSON.stringify({payload: mueble}, null, '\t'));
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Se ha generado un error en el servidor');
    } finally {
        await desconnect();
    }
});

// Crear un nuevo mueble: Ruta POST http://127.0.0.1:3005/muebles
server.post('/muebles', async (req, res) => {
    const { nombre , precio , categoria } = req.body;

    if (!nombre || !precio || !categoria ) {
        return res.status(400).send('Faltan datos relevantes');
    }

    try {
        const collection = await connectToCollection('muebles');
        const mueble = { codigo: await generateCodigo(collection), nombre, precio, categoria };

        await collection.insertOne(mueble);

        res.status(201).send(JSON.stringify('Registro creado',{payload: mueble}, null, '\t'));
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Se ha generado un error en el servidor');
    } finally {
        await desconnect();
    }
});

// Actualizar un mueble específico por código: Ruta PUT http://127.0.0.1:3005/muebles/codigo
server.put('/muebles/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { nombre , precio , categoria } = req.body;
    const mueble = { nombre , precio , categoria };


    if (!nombre || !precio || !categoria) {
        return res.status(400).send('Faltan datos relevantes');
    }

    try {
        const collection = await connectToCollection('muebles');
        const muebleActual = await collection.findOne({ codigo: { $eq: Number(codigo) } });

        if (!muebleActual) return res.status(400).send('El código no corresponde a un mueble registrado');

        await collection.updateOne({ codigo: Number(codigo) }, { $set: mueble});

        res.status(200).send(JSON.stringify('Registro actualizado',{payload: mueble}, null, '\t'));
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Hubo un error en el servidor');
    } finally {
        await desconnect();
    }
});

// Eliminar un muebles específico por código: Ruta DELETE http://127.0.0.1:3005/muebles/codigo
server.delete('/muebles/:codigo', async (req, res) => {
    const { codigo } = req.params;

    try {
        const collection = await connectToCollection('muebles');
        await collection.deleteOne({ codigo: { $eq: Number(codigo) } });

        res.status(200).send('Registro eliminado');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Se ha generado un error en el servidor');
    } finally {
        await desconnect();
    }
});



// Control de rutas inexistentes
server.use('*', (req, res) => {
    res.status(404).send(`<h1>Error 404</h1><h3>La URL indicada no existe en este servidor</h3>`);
});

// Método oyente de peteciones
server.listen(process.env.SERVER_PORT, process.env.SERVER_HOST, () => {
    console.log(`Ejecutandose en http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/muebles`);
});