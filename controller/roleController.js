import {error400} from "./errorsCodeText.js";
import {Role} from "../model/index.js";

export const roleController = {
    getAll: async (req, res) => {
        try{
            const roles = await Role.findAll()
            return res.status(200).json(roles)
        }catch(e){
            console.log(e)
            return res.status(400).send(error400)
        }
    }
}