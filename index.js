import express from "express";
import {configDotenv} from "dotenv";
import {sequelize} from "./database.js";
import * as models from './model/index.js'
import cors from "cors";
import cookieParser from "cookie-parser";
import {router} from "./route/index.js";
import cron from "node-cron";
import {userController} from "./controller/userController.js";
import multer from "multer";

configDotenv()
const PORT = process.env.port || '5000'
const app = express()


app.use(cookieParser())
app.use(cors({
    origin: 'http://185.65.245.234/',
    credentials: true
}))
app.use(express.json())
app.use('/api', router)

cron.schedule('0 0 * * *', userController.cronUpdated)

const start = async () => {
    try{
        await sequelize.authenticate()
        await sequelize.sync()
        app.listen(PORT, () => console.log(`Server started on port ${PORT}`))
    }catch(e){
        console.log(e)
    }
}

start()