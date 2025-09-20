import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
 


dotenv.config();

const app = express();
app.use(cors());
const PORT = process.env.PORT;

app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

app.listen(PORT, () => {
    console.log("server is running");
})