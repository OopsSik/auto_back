import {error401} from "../controller/errorsCodeText.js";
import jwt from "jsonwebtoken";

export const checkRefreshToken = (req, res, next) => {
    if(req.method === 'OPTIONS') next()
    try{
        const refreshTokenCookie = req.cookies.refreshToken;
        if(!refreshTokenCookie){
            return res.status(401).send(error401)
        }
        const {token: refreshToken} = JSON.parse(refreshTokenCookie)
        const jwtVerify = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY)
        if(!jwtVerify){
            return res.status(401).send(error401)
        }
        req.username = jwtVerify.username
        req.role = jwtVerify.role
        next()
    }catch(e){
        console.log(e)
        return res.status(401).send(error401)
    }

}

export const checkAccessToken = (req, res, next) => {
    if(req.method === 'OPTIONS') next()
    try{
        const token = req.headers.authorization.split(' ')[1]
        if(!token) return res.status(401).send(error401)
        const jwtVerify = jwt.verify(token, process.env.JWT_SECRET_KEY)
        req.username = jwtVerify.username
        req.role = jwtVerify.role
        next()
    }catch(e){
        console.log(e)
        return res.status(401).send(error401)
    }
}

export const checkRoleUser = (idsArray) => {
    return (req, res, next) => {
        if(!req.role){
            return res.status(401).send(error401)
        }
        const includeRole = idsArray.includes((req.role))
        if(!includeRole){
            return res.status(401).send('У вас не достаточно прав')
        }
        next()
    }
}