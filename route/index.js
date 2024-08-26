import {Router} from "express";
import {checkAccessToken, checkRefreshToken, checkRoleUser} from "../middleware/index.js";
import {userController} from "../controller/userController.js";
import {countryController} from "../controller/countryController.js";
import {credentialController} from "../controller/credentialController.js";
import {roleController} from "../controller/roleController.js";
import {generalController} from "../controller/generalController.js";
import multer from "multer";

const storage = multer.memoryStorage()
const upload = multer({ storage })


export const router = new Router()

/* Users */
router.get('/user/getAll', checkRefreshToken, checkAccessToken, checkRoleUser([2]), userController.getAll)
router.get('/user/getAllMoney', checkRefreshToken, checkAccessToken, checkRoleUser([2]), userController.getAllMoney)
router.get('/user/getDataUser', checkRefreshToken, checkAccessToken, userController.getDataUser)
router.put('/user/changeMoney', checkRefreshToken, checkAccessToken, userController.changeMoney)
router.put('/user/updateMoney', checkRefreshToken, checkAccessToken, checkRoleUser([2]), userController.updateMoney)
router.post('/user/registration', checkRefreshToken, checkAccessToken, checkRoleUser([2]), userController.registration)
router.post('/user/login', userController.login)
router.get('/user/refreshAccessToken', checkRefreshToken, userController.refreshAccessToken)
router.delete('/user/delete', checkRefreshToken, checkAccessToken, checkRoleUser([2]), userController.deleteUser)
router.post('/user/logout', userController.logout)

/* Credentials */
router.get('/credential/getAll', checkRefreshToken, checkAccessToken, checkRoleUser([2]), credentialController.getAll)
router.get('/credential/getAllByUser', checkRefreshToken, checkAccessToken, credentialController.getAllByUser)
router.delete('/credential/delete', checkRefreshToken, checkAccessToken, checkRoleUser([2]), credentialController.deleteCredential)
router.post('/credential/getByCountry', checkRefreshToken, checkAccessToken, credentialController.getByCountry)
router.post('/credential/upload', checkRefreshToken, checkAccessToken, checkRoleUser([2]), upload.single('file'), credentialController.uploadCredential)
router.post('/credential/update', checkRefreshToken, checkAccessToken, credentialController.updateCredential)

/* Country */
router.get('/country/getAll', checkRefreshToken, checkAccessToken, checkRoleUser([2]), countryController.getAll)
router.get('/country/getAllWithout', checkRefreshToken, checkAccessToken, countryController.getAllWithoutPagination)
router.post('/country/create', checkRefreshToken, checkAccessToken, checkRoleUser([2]), countryController.createCountry)
router.delete('/country/delete', checkRefreshToken, checkAccessToken, checkRoleUser([2]), countryController.deleteCountry)

/* Role */
router.get('/role/getAll', checkRefreshToken, checkAccessToken, checkRoleUser([2]), roleController.getAll)

/* General */
router.get('/money/getMoney', checkRefreshToken, checkAccessToken, generalController.getMoney)
router.post('/money/updateMoney', checkRefreshToken, checkAccessToken, checkRoleUser([2]), generalController.updateMoney)
router.get('/money/general', checkRefreshToken, checkAccessToken, checkRoleUser([2]), generalController.getGeneralStat)
router.get('/money/getStatsUsers', checkRefreshToken, checkAccessToken, checkRoleUser([2]), generalController.getStatsUsers)
