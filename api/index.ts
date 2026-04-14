import express , {Request, Response} from "express";
import mongoose from "mongoose";
import dotenv from "dotenv"
import cors from "cors";

// 1.- Activamos las variables de entorno de nuestro archivo secreto
dotenv.config()

// 2.- Creamos la aplicacion express
const app = express();
app.use(cors());
app.use(express.json()) // permite que nuestra api entienda el json

// Conexion a MongoDB

const mongoUri = process.env.MONGODB_URI

if(!mongoUri) {
    throw new Error ("Falta la variable de entorno, espabila!!")
}

const mongoUriValidated: string = mongoUri;

let isMongoConnected = false;
let currentDatabase = ""; // Valor por defecto, se actualizara al conectar 

async function connectToMongo() {
    if(isMongoConnected) return;

    // Si existe DB_NAME, forzamos ese nombre de base en la conexion
    const dbNameFromEnv = process.env.DB_NAME;
    const connectionOptions = dbNameFromEnv ? {dbName: dbNameFromEnv} : undefined;

    await mongoose.connect(mongoUriValidated, connectionOptions)
    currentDatabase = mongoose.connection.name
} 

// 4.- Creamos el molde (Esquema para nuestras healing spaces))

const HeroInfoSchema = new mongoose.Schema(
    {
        image: String,
        title: String,
        paragraph: String,
        buttonText: String,
        buttonLink: String
    },
    {
        collection: "HeroInfo"
    }
);

const HeroInfo = mongoose.models.HeroInfo || mongoose.model("HeroInfo", HeroInfoSchema);
function getMongoDebugInfo(){
    return{
        database: currentDatabase || mongoose.connection.name,
        collection: HeroInfo.collection.name,
        readyState: mongoose.connection.readyState,
    }
}

// 5.- Crearemos todas las rutas, get, post, todo esto vamos a configurarlo en vercel.
app.get("/api/Hero-Info", async (req: Request, res: Response) => {
    try {
        await connectToMongo();
        const heroInfos = await HeroInfo.find();
        res.json(heroInfos);
    } catch (error) {
        console.error("Error al obtener las frases:", error);
        res.status(500).json({ 
        error: "Error al obtener las frases",
        detail:  error instanceof Error ? error.message : "Error desconocido",
    });
    }
});

app.post("/api/Hero-Info", async (req: Request, res: Response) => {
    try {
        await connectToMongo();
        const { image, title, paragraph, buttonText, buttonLink } = req.body;
       if (!image || !title || !paragraph || !buttonText || !buttonLink) {
            return res.status(400).json({ error: "Faltan campos obligatorios" });
        }
        await connectToMongo();
        const nuevoHeroInfo = new HeroInfo({ image, title, paragraph, buttonText, buttonLink });
        await nuevoHeroInfo.save();
        res.status(201).json(nuevoHeroInfo); // raha creada y dir nueva frase creada 

    } catch (error) {
        console.error("Error al crear la frase:", error);
        res.status(500).json({
            error: "Error al crear la frase",
            detail: error instanceof Error ? error.message : "Error desconocido",
        });
    }
});

export default app;