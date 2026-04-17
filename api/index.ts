import express, { Request, Response } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// 1.- Activamos las variables de entorno de nuestro archivo secreto
dotenv.config();

// 2.- Creamos la aplicacion express
const app = express();
app.use(express.json()); // permite que nuestra api entienda el json
app.use(cors()); // Permite que cualquier cliente pueda hacer peticiones a nuestra API, si quieres limitarlo a un dominio especifico, puedes configurar cors({ origin: "http://tudominio.com" })

// Conexion a MongoDB

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("Falta la variable de entorno, espabila!!");
}

const mongoUriValidated: string = mongoUri;

let isMongoConnected = false;
let currentDatabase = ""; // Valor por defecto, se actualizara al conectar

const connectToMongo = async () => {
  if (isMongoConnected) return;

  // Si existe DB_NAME, forzamos ese nombre de base en la conexion
  const dbNameFromEnv = process.env.DB_NAME;
  const connectionOptions = dbNameFromEnv
    ? { dbName: dbNameFromEnv }
    : undefined;

  await mongoose.connect(mongoUriValidated, connectionOptions);
  currentDatabase = mongoose.connection.name;
};

// 4.- Creamos el molde (Esquema para nuestras frases)

const HeroSchema = new mongoose.Schema(
  {
    image: String,
    title: String,
    paragraph: String,
    buttonText: String,
    buttonLink: String
  },
  {
    collection: "HeroInfo",
  },
);

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    role: String,
  },
  {
    collection: "User",
  },
);

const ProjectSchema = new mongoose.Schema(
  {
    _id: String,
    title: String,
    description: String,
    image: String,
    tags: [String],
    link: String,
    github: String
  },
  {
    collection: "Project",
  },
);


const Hero = mongoose.models.Heroes || mongoose.model("Hero", HeroSchema);
const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Project = mongoose.models.Project || mongoose.model("Project", ProjectSchema);

const getMongoDebugInfo = () => {
  return {
    database: currentDatabase || mongoose.connection.name,
    collection: Hero.collection.name,
    userCollection: User.collection.name,
    projectCollection: Project.collection.name,
    readyState: mongoose.connection.readyState,
  };
};
// 5.- Crearemos todas las rutas, get, post, todo esto vamos a configurarlo en vercel.

// Para debug
app.get("/api/hero/debug", async (req: Request, res: Response) => {
  try {
    await connectToMongo();
    res.json(getMongoDebugInfo());
  } catch (error) {
    console.error("Error al inspeccionar MongoDB:", error);
    res.status(500).json({
      error: "No se pudo inspeccionar la conexion",
      detail: error instanceof Error ? error.message : "Error Desconocido",
    });
  }
});

// GET DE LAS FRASES
app.get("/api/hero", async (req: Request, res: Response) => {
  try {
    await connectToMongo();
    const heroes = await Hero.find();
    res.json(heroes);
  } catch (error) {
    console.error("Error al leer heroes", error);
    res.status(500).json({
      error: "No se pudieron obtener los heroes",
      detail: error instanceof Error ? error.message : "Error Desconocido",
    });
  }
});

// POST DE LAS FRASES
app.post("/api/hero", async (req: Request, res: Response) => {
  try {
    const { image, title, paragraph, buttonText, buttonLink } = req.body;
    if (!image || !title || !paragraph || !buttonText || !buttonLink) {
      res.status(400).json({ error: "Debes enviar todos los campos, espabila!!" });
    }

    await connectToMongo();
    const nuevaHero = new Hero({ image, title, paragraph, buttonText, buttonLink }); //Toma los datos que envia el usuario
    await nuevaHero.save(); // Lo guarda en la base de datos
    res.status(201).json(nuevaHero); //Responder la frase recien creada
  } catch (error) {
    console.error("Error al crear la heroInfo:", error);
    res.status(500).json({
      error: "No se pudieron obtener las heroInfos",
      detail: error instanceof Error ? error.message : "Error Desconocido",
    });
  }
});

// PUT DE LAS FRASES
app.put("/api/hero/:id", async (req: Request, res: Response) => {
  try {
    const { image, title, paragraph, buttonText, buttonLink } = req.body;
    if (!image || !title || !paragraph || !buttonText || !buttonLink) {
      res.status(400).json({ error: "Debes enviar todos los campos, espabila!!" });
      return;
    }

    await connectToMongo();
    const fraseActualizada = await Hero.findByIdAndUpdate(
      req.params.id,
      { image, title, paragraph, buttonText, buttonLink },
      { returnDocument: "after" },
    );

    if (!fraseActualizada) {
      res.status(404).json({ error: "Hero no encontrada" });
      return;
    }

    res.json(fraseActualizada);
  } catch (error) {
    console.error("Error al actualizar la hero:", error);
    res.status(500).json({
      error: "No se pudo actualizar la hero",
      detail: error instanceof Error ? error.message : "Error Desconocido",
    });
  }
});

// DELETE DE LAS FRASES
app.delete("/api/hero/:id", async (req: Request, res: Response) => {
  try {
    await connectToMongo();
    const fraseEliminada = await Hero.findByIdAndDelete(req.params.id);

    if (!fraseEliminada) {
      res.status(404).json({ error: "Hero no encontrada" });
      return;
    }

    res.json({
      message: "Hero eliminada correctamente",
      frase: fraseEliminada,
    });
  } catch (error) {
    console.error("Error al eliminar la hero:", error);
    res.status(500).json({
      error: "No se pudo eliminar la hero",
      detail: error instanceof Error ? error.message : "Error Desconocido",
    });
  }
});

// GET DE LOS USERS
app.get("/api/users", async (req: Request, res: Response) => {
  try {
    await connectToMongo();
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error("Error al leer users", error);
    res.status(500).json({
      error: "No se pudieron obtener los users",
      detail: error instanceof Error ? error.message : "Error Desconocido",
    });
  }
});

// POST DE LOS USERS
app.post("/api/users", async (req: Request, res: Response) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email || !role) {
      res.status(400).json({ error: "Debes enviar todos los campos, espabila!!" });
      return;
    }

    await connectToMongo();
    const nuevoUser = new User({ name, email, role });
    await nuevoUser.save();
    res.status(201).json(nuevoUser);
  } catch (error) {
    console.error("Error al crear el user:", error);
    res.status(500).json({
      error: "No se pudo crear el user",
      detail: error instanceof Error ? error.message : "Error Desconocido",
    });
  }
});

// PUT DE LOS USERS
app.put("/api/users/:id", async (req: Request, res: Response) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email || !role) {
      res.status(400).json({ error: "Debes enviar todos los campos, espabila!!" });
      return;
    }

    await connectToMongo();
    const userActualizado = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role },
      { returnDocument: "after" },
    );

    if (!userActualizado) {
      res.status(404).json({ error: "User no encontrado" });
      return;
    }

    res.json(userActualizado);
  } catch (error) {
    console.error("Error al actualizar el user:", error);
    res.status(500).json({
      error: "No se pudo actualizar el user",
      detail: error instanceof Error ? error.message : "Error Desconocido",
    });
  }
});

// DELETE DE LOS USERS
app.delete("/api/users/:id", async (req: Request, res: Response) => {
  try {
    await connectToMongo();
    const userEliminado = await User.findByIdAndDelete(req.params.id);

    if (!userEliminado) {
      res.status(404).json({ error: "User no encontrado" });
      return;
    }

    res.json({
      message: "User eliminado correctamente",
      user: userEliminado,
    });
  } catch (error) {
    console.error("Error al eliminar el user:", error);
    res.status(500).json({
      error: "No se pudo eliminar el user",
      detail: error instanceof Error ? error.message : "Error Desconocido",
    });
  }
});

// GET DE LOS PROJECTS
app.get("/api/projects", async (req: Request, res: Response) => {
  try {
    await connectToMongo();
    const projects = await Project.find();
    res.json(projects);
  } catch (error) {
    console.error("Error al leer projects", error);
    res.status(500).json({
      error: "No se pudieron obtener los projects",
      detail: error instanceof Error ? error.message : "Error Desconocido",
    });
  }
});

// POST DE LOS PROJECTS
app.post("/api/projects", async (req: Request, res: Response) => {
  try {
    const { _id, title, description, image, tags, link, github } = req.body;
    if (!_id || !title || !description || !image || !tags || !link || !github) {
      res.status(400).json({ error: "Debes enviar todos los campos, espabila!!" });
      return;
    }

    await connectToMongo();
    const nuevoProject = new Project({ _id, title, description, image, tags, link, github });
    await nuevoProject.save();
    res.status(201).json(nuevoProject);
  } catch (error) {
    console.error("Error al crear el project:", error);
    res.status(500).json({
      error: "No se pudo crear el project",
      detail: error instanceof Error ? error.message : "Error Desconocido",
    });
  }
});

// PUT DE LOS PROJECTS
app.put("/api/projects/:id", async (req: Request, res: Response) => {
  try {
    const { title, description, image, tags, link, github } = req.body;
    if (!title || !description || !image || !tags || !link || !github) {
      res.status(400).json({ error: "Debes enviar todos los campos, espabila!!" });
      return;
    }

    await connectToMongo();
    const projectActualizado = await Project.findByIdAndUpdate(
      req.params.id,
      { title, description, image, tags, link, github },
      { returnDocument: "after" },
    );

    if (!projectActualizado) {
      res.status(404).json({ error: "Project no encontrado" });
      return;
    }

    res.json(projectActualizado);
  } catch (error) {
    console.error("Error al actualizar el project:", error);
    res.status(500).json({
      error: "No se pudo actualizar el project",
      detail: error instanceof Error ? error.message : "Error Desconocido",
    });
  }
});

// DELETE DE LOS PROJECTS
app.delete("/api/projects/:id", async (req: Request, res: Response) => {
  try {
    await connectToMongo();
    const projectEliminado = await Project.findByIdAndDelete(req.params.id);

    if (!projectEliminado) {
      res.status(404).json({ error: "Project no encontrado" });
      return;
    }

    res.json({
      message: "Project eliminado correctamente",
      project: projectEliminado,
    });
  } catch (error) {
    console.error("Error al eliminar el project:", error);
    res.status(500).json({
      error: "No se pudo eliminar el project",
      detail: error instanceof Error ? error.message : "Error Desconocido",
    });
  }
});

export default app;
