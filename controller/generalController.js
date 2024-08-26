import {Country, Credential, General, User} from "../model/index.js";
import {error400} from "./errorsCodeText.js";
import {sequelize} from "../database.js";
import {Op} from "sequelize";

export const generalController = {
    getMoney: async (req, res) => {
      try{
          const transaction = await sequelize.transaction()
          const settings = await General.findOne(
              {

              },
              {
              transaction
              }
          )
          if(!settings){
              await transaction.rollback()
              return res.status(400).send({text: 'hello'})
          }
          await transaction.commit()
          return res.status(200).json({moneys: settings.moneys})
      }catch(e){
          console.log(e)
          return res.status(400).send(error400)
      }
    },
    updateMoney: async (req, res) => {
        try{
            if(!req.body.money){
                return res.status(400).send(error400)
            }
            const money = await General.findOne()
            if (!money) {
                return res.status(400).send(error400)
            }
            money.moneys = parseInt(req.body.money)
            await money.save()
            return res.status(200).json(money)
        }catch(e){
            console.log(e)
            return res.status(400).send(error400)
        }
    },
    getGeneralStat: async (req, res) => {
        const transaction = await sequelize.transaction()
        try{
            const credentials = await Credential.count({transaction})
            const activeCredentials = await Credential.count({
                where: {
                    status: true
                },
                transaction
            })
            const countries = await Country.count({transaction})
            const users = await User.count({transaction})
            await transaction.commit()
            return res.status(200).json({credentials, activeCredentials, countries, users})
        }catch(e){
            console.log(e)
            return res.status(400).send(error400)
        }
    },
    getStatsUsers: async (req, res)=>{
        const transaction = await sequelize.transaction()
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)
        const week = new Date()
        week.setDate(today.getDay() - 7)
        week.setHours(0, 0, 0, 0)
        const month = new Date()
        month.setDate(today.getMonth() - 1)
        try{
            const users = await User.findAll({
                order: [
                    ['id', 'ASC']
                ],
                transaction
            })
            const usersReturn = []
            if(!users) return res.status(200).json({data: usersReturn})
            for(const user of users){
                const todayCount = await Credential.count({
                    where: {
                        userId: user.id,
                        updatedAt: {
                            [Op.gte]: today,
                            [Op.lte]: todayEnd
                        }
                    },
                    transaction
                })
                const weekCount = await Credential.count({
                    where: {
                        userId: user.id,
                        updatedAt: {
                            [Op.gt]: week,
                            [Op.lt]: todayEnd
                        }
                    },
                    transaction
                })
                const monthCount = await Credential.count({
                    where: {
                        userId: user.id,
                        updatedAt: {
                            [Op.gt]: month,
                            [Op.lt]: todayEnd
                        }
                    },
                    transaction
                })
                usersReturn.push({id: user.id, username: user.username, today: (todayCount) ? todayCount : 0, week: (weekCount) ? weekCount : 0, month: (monthCount) ? monthCount : 0})
            }
            await transaction.commit()
            return res.status(200).json(usersReturn)
        }catch(e){
            console.log(e)
            await transaction.rollback()
            return res.status(400).send(error400)
        }
    }
}