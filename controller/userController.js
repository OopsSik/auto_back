import {General, Role, User} from "../model/index.js";
import {error400, error401} from "./errorsCodeText.js";
import {sequelize} from "../database.js";
import bcrypt, {hash} from "bcrypt";
import {configDotenv} from "dotenv";
import jwt from "jsonwebtoken";

configDotenv()

export const generateAccessToken = (username, role) => {
    return jwt.sign({username: username, role: role}, process.env.JWT_SECRET_KEY, {expiresIn: '30m'})
}

export const generateRefreshToken = (username, role) => {
    return jwt.sign({username: username, role: role}, process.env.JWT_SECRET_KEY, {expiresIn: '30d'})
}

export const userController = {
    getAll: async (req, res) => {
        try{
            const {paged = 1} = req.query
            console.log(paged)
            const offset = paged*process.env.COUNT_PER_PAGE - process.env.COUNT_PER_PAGE
            console.log(offset)
            const users = await User.findAll({
                offset: offset,
                limit: process.env.COUNT_PER_PAGE,
                include: Role,
                order:[['id', 'ASC']]
            })
            const totalUsers = await User.count()
            const totalPage = Math.ceil(totalUsers/process.env.COUNT_PER_PAGE)
            const usersResponse = []
            for(const user of users){
                usersResponse.push({
                    id: user.id,
                    date: user.updatedAt,
                    username: user.username,
                    nickname: user.nickname,
                    role: user.role.name
                })
            }
            return res.status(200).json({data: usersResponse, currentPage: paged, totalPage: totalPage})
        }catch(e){
            console.log(e)
            return res.status(400).send(error400)
        }
    },
    getAllMoney: async(req, res) => {
        try{
            const transaction = await sequelize.transaction()
            try{
                const users = await User.findAll(
                    {
                        order: [
                            ['id', 'ASC']
                        ],
                        transaction
                    }
                )
                if(!users){
                    return res.status(400).send(error400)
                }
                await transaction.commit()
                return res.status(200).json(users)
            }catch(e){
                console.log(e)
                await transaction.rollback()
                return res.status(400).send(error400)
            }
        }catch(e){
            console.log(e)
            return res.status(400).send(error400)
        }
    },
    getDataUser: async (req, res) => {
        try{
            if(!req.username){
                return res.status(401).send(error401)
            }
            const user = await User.findOne({
                where: {
                    username: req.username
                },
                include: Role
            })
            return res.status(200).json({id: user.id, username: user.username, nickname: user.nickname, money: user.money, role: user.role.name})
        }catch(e){
            console.log(e)
            return res.status(400).send(error400)
        }
    },
    changeMoney: async (req, res) => {
        try{
            if(!req.username){
                return res.status(400).send(error400)
            }
            const candidate = await User.findOne({
                where: {
                    username: req.username
                }
            })
            if(!candidate){
                return res.status(400).send(error400)
            }
            if(candidate.money === 0){
                return res.status(200).send('У вас закончились монеты. Дождитесь нового дня или обратитесь к администратору')
            }else{
                const transaction = await sequelize.transaction()
                const moneyNewValue = candidate.money - 1
                try{
                    const user = await User.update(
                        {
                            money: moneyNewValue
                        },
                        {
                            where: {
                                username: req.username
                            },
                            transaction
                        }
                    )
                    const userUpdated = await User.findOne(
                        {
                            where: {
                                username: req.username
                            },
                            transaction
                        }
                    )
                    await transaction.commit()
                    return res.status(200).json(userUpdated)
                }catch(e){
                    console.log(e)
                    await transaction.rollback()
                    return res.status(400).send(error400)
                }
            }
        }catch(e){
            console.log(e)
            return res.status(400).send(error400)
        }
    },
    deleteUser: async(req, res) => {
      try{
          if(!req.body.id){
              return res.status(400).send(400)
          }
          const candidate = await User.findOne({
              where: {
                  id: req.body.id
              }
          })
          if(!candidate){
              return res.status(200).send('Пользователь уже удален')
          }
          const transaction = await sequelize.transaction()
          try{
              const user = await User.destroy({
                  where: {
                      id: req.body.id,
                  },
                  transaction
              })
              await transaction.commit()
              return (user === 1) ? res.status(200).send('Пользователь удален') :  res.status(400).send(error400)
          }catch(e){
              console.log(e)
              await transaction.rollback()
              return res.status(400).send(error400)
          }
      }catch(e){
          console.log(e)
          return res.status(200).send(error400)
      }
    },
    updateMoney: async (req, res) => {
        try{
            if(!req.body.id || !req.body.money){
                return res.status(400).send(error400)
            }
            const transaction = await sequelize.transaction()
            try{
                const user = await User.update(
                    {
                        money: req.body.money
                    },
                    {
                        where: {
                            id: req.body.id
                        },
                        transaction
                    }
                )
                await transaction.commit()
                const userUpdated = await User.findOne({
                    where: {
                        id: req.body.id
                    }
                })
                return res.status(200).json(userUpdated)
            }catch(e){
                console.log(e)
                await transaction.rollback()
                return res.status(400).send(error400)
            }
        }catch(e){
            console.log(e)
            return res.status(400).send(error400)
        }
    },
    registration: async (req, res) => {
        try{
            if(!req.body.username || !req.body.password || !req.body.nickname || !req.body.role){
                return res.status(400).send(error400)
            }
            const candidateUsername = await User.findOne({
                where: {
                    username: req.body.username
                }
            })
            if(candidateUsername){
                return res.status(400).send({text: 'Пользователь с таким логином уже существует'})
            }
            const candidateNickname = await User.findOne({
                where: {
                    nickname: req.body.nickname
                }
            })
            if(candidateNickname){
                return res.status(400).send({text: 'Пользователь с таким ником уже существует'})
            }
            const role = await Role.findOne({
                where: {
                    id: req.body.role
                }
            })
            if(!role){
                return res.status(400).send(error400+3)
            }
            const passwordHash = await bcrypt.hash(req.body.password, 7)
            const transaction = await sequelize.transaction()
            try{
                const user = await User.create(
                    {
                        username: req.body.username,
                        password: passwordHash,
                        nickname: req.body.nickname,
                        roleId: role.id
                    },
                    {
                        transaction
                    }
                )
                await transaction.commit()
                return res.status(200).json(user)
            }catch(e){
                console.log(e)
                await transaction.rollback()
                return res.status(400).send(error400+2)
            }
        }catch(e){
            console.log(e)
            return res.status(400).send(error400)
        }
    },
    logout: async (req, res) => {
        try{
            const refreshTokenCookie = req.cookies.refreshToken
            if(refreshTokenCookie){
                res.cookie('refreshToken', '', {
                    httpOnly: true,
                    secure: true,
                    expires: new Date(0)
                });
            }
            return res.status(200).send({text: 'Logout'})
        }catch(e){
            console.log(e)
            return res.status(400).send(error400)
        }
    },
    login: async (req, res) => {
        try{
            if(!req.body.username || !req.body.password){
                return res.status(400).send(error400)
            }
            const candidate = await User.findOne(
                {
                    where: {
                        username: req.body.username
                    },
                    include: Role
                }
            )
            if(!candidate){
                return res.status(400).send({text: 'Неправильный логин или пароль', data: {username: req.body.username, password: req.body.password}})
            }
            const passwordCompare = await bcrypt.compare(req.body.password, candidate.password)
            if(!passwordCompare){
                return res.status(400).send({text: 'Неправильный логин или пароль', data: {username: req.body.username, password: req.body.password}})
            }
            const accessToken = generateAccessToken(candidate.username, candidate.role.id)
            const refreshToken = generateRefreshToken(candidate.username, candidate.role.id)
            res.cookie('refreshToken', JSON.stringify({token: refreshToken}), {
                httpOnly: true,
                secure: false,
                sameSite: 'Lax',
                maxAge: 30 * 24 * 60 * 60 * 1000
            })
            return res.status(200).json({status: 200, id: candidate.id, username: candidate.username, nickname: candidate.nickname, money: candidate.money, role: candidate.role.name, accessToken: accessToken})
        }catch(e){
            console.log(e)
            return res.status(400).send(error400)
        }
    },
    refreshAccessToken: async (req, res) => {
        if(!req.username || !req.role){
            return res.status(401).send(error401)
        }
        const accessToken = generateAccessToken(req.username, req.role)
        return res.status(200).json({accessToken: accessToken})
    },
    cronUpdated: async () => {
        const transaction = await sequelize.transaction()
        try{
            const users = await User.findAll({transaction})
            const moneySetting = await General.findOne({transaction})
            for(const user of users){
                const userFind = await User.update(
                    {
                        money: moneySetting.moneys
                    },
                    {
                        where: {
                            id: user.id
                        },
                        transaction
                    }
                )
            }
            await transaction.commit()
            console.log('Монеты всех пользователей обновлены')
        }catch(e){
            console.log(e)
            await transaction.rollback()
        }
    }
}

