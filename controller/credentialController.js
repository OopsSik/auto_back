import {Country, Credential, User} from "../model/index.js";
import {error400, error401} from "./errorsCodeText.js";
import {sequelize} from "../database.js";
import {configDotenv} from "dotenv";
import * as XLSX from "xlsx";

configDotenv()

export const credentialController = {
    getAll: async (req, res)=>{
        try{
            const {paged = 1} = req.query
            const offset = paged * process.env.COUNT_PER_PAGE - process.env.COUNT_PER_PAGE
            const credentials = await Credential.findAll({
                include: Country,
                offset: offset,
                limit: process.env.COUNT_PER_PAGE,
                order: [
                    ['updatedAt', 'DESC']
                ]
            })
            const totalCredentials = await Credential.count()
            const totalPage = Math.ceil(totalCredentials/process.env.COUNT_PER_PAGE)
            return res.status(200).json({data: credentials, currentPage: paged, totalPage: totalPage})
        }catch(e){
            console.log(e)
            return res.status(400).send(error400)
        }
    },
    getAllByUser: async (req, res)=>{
        try{
            const {paged = 1} = req.query
            const offset = paged * process.env.COUNT_PER_PAGE - process.env.COUNT_PER_PAGE
            if(!req.username){
                return res.status(401).send(error401)
            }
            const user = await User.findOne({
                where: {
                    username: req.username,
                }
            })
            if(!user){
                return res.status(400).send(error400)
            }
            const credentials = await Credential.findAll({
                order: [
                    ['updatedAt', 'DESC']
                ],
                where: {
                    userId: user.id,

                },
                include: Country,
                offset: offset,
                limit: process.env.COUNT_PER_PAGE
            })
            const totalCredential = await Credential.count({
                where: {
                    userId: user.id
                }
            })
            const totalPage = Math.ceil(totalCredential/process.env.COUNT_PER_PAGE)
            return res.status(200).json({data: credentials, currentPage: paged, totalPage: totalPage})
        }catch(e){
            console.log(e)
            return res.status(400).send(error400)
        }
    },
    deleteCredential: async (req, res)=>{
        try{
            if(!req.body.id){
                return res.status(400).send(error400)
            }
            const candidate = await Credential.findOne({
                where: {
                    id: req.body.id
                }
            })
            if(!candidate){
                return res.status(400).send('Данный доступ уже удален из базы данных')
            }
            const transaction = await sequelize.transaction()
            try{
                const credentialDestroy = await Credential.destroy({
                    where: {
                        id: req.body.id
                    },
                    transaction
                })
                if(credentialDestroy === 1){
                    await transaction.commit()
                    return res.status(200).json('Доступ успешно удален из базы данных')
                }else{
                    await transaction.rollback()
                    return res.status(400).send(error400)
                }
            }catch(e){
                console.log(e)
                await transaction.rollback()
                console.log(e)
            }
        }catch(e){
            console.log(e)
            return res.status(400).send(error400)
        }
    },
    getByCountry: async (req, res) => {
        try{
            if(!req.body.ids){
                return res.status(400).send(error400)
            }
            let responseArray = [];
            for(const id of req.body.ids){
                const credentials = await Credential.findAll({
                    limit: 20,
                    where: {
                        countryId: id,
                        status: true
                    }
                })
                const country = await Country.findOne({
                    where: {
                        id: id
                    }
                })
                if(!credentials && country) {
                    responseArray.push({country: country, credentials: null})
                }else{
                    responseArray.push({country: country, credentials: credentials})
                }
            }
            if(responseArray.length === 0){
                return res.status(200).json({result: null})
            }else{
                return res.status(200).json({result: responseArray})
            }
        }catch(e){
            console.log(e)
            return res.status(400).send(error400)
        }
    },
    uploadCredential: async (req, res) => {
        console.log(req.file)
        if(!req.file){
            return res.status(400).send({text: 'Файл не был загружен'})
        }
        const transaction = await sequelize.transaction()
        try{
            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);
            for(const row of data){
                const {slug, url} = row;
                try{
                    const country = await Country.findOne({
                        where: {
                            slug: slug
                        },
                        transaction
                    })
                    if(!country){
                        return res.status(400).send({text: 'В документе указан slug страны, которой не существует в БД'})
                    }
                    const cred = await Credential.create(
                        {
                            url: url,
                            countryId: country.id
                        },
                        transaction
                    )
                }catch(e){
                    console.log(e)
                    await transaction.rollback()
                }
            }
            await transaction.commit()
            return res.status(200).json({text: 'Записи успешно добавлены в БД'})
        }catch(e){
            console.log(e)
            return res.status(400).send(error400)
        }
    },
    updateCredential: async (req, res) => {
        if(!req.body.idCred || !req.body.idUser) return res.status(400).send(error400)
        const transaction = await sequelize.transaction()
        try{
            const credential = await Credential.findOne({
                where: {
                    id: req.body.idCred
                },
                transaction
            })
            if(!credential){
                await transaction.rollback()
                return res.status(400).send({status: 400, text: 'Доступа не найдено'})
            }
            if(!credential.status){
                await transaction.rollback()
                return res.status(400).send({status: 400, text: 'Доступ уже передан'})
            }
            const user = await User.findOne({
                where: {
                    id: req.body.idUser
                },
                transaction
            })
            if(!user){
                await transaction.rollback()
                return res.status(400).send({status: 400, text: 'Пользователя не найдено'})
            }
            credential.userId = req.body.idUser
            credential.status = false
            await credential.save()
            await transaction.commit()
            return res.status(200).send({status: 200, text: 'Доступ передан'})
        }catch(e){
            console.log(e)
            return res.status(400).send(error400)
        }
    }
}