import {error400} from "./errorsCodeText.js";
import {Country} from "../model/index.js";
import {sequelize} from "../database.js";

export const countryController = {
    getAll: async (req, res) => {
        try {
            const {paged = 1} = req.query
            const offset = paged * process.env.COUNT_PER_PAGE - process.env.COUNT_PER_PAGE
            const countries = await Country.findAll({
                offset: offset,
                limit: process.env.COUNT_PER_PAGE,
                order: [
                    ['updatedAt', 'DESC']
                ]
            })
            const totalCountries = await Country.count()
            const totalPage = Math.ceil(totalCountries / process.env.COUNT_PER_PAGE)
            return res.status(200).json({data: countries, currentPage: paged, totalPage: totalPage})
        } catch (e) {
            console.log(e)
            return res.status(400).send(error400)
        }
    },
    getAllWithoutPagination: async (req, res) => {
        const transaction = await sequelize.transaction()
        try {
            const countries = await Country.findAll(
                {
                    order: [
                        ['id', 'ASC']
                    ],
                    transaction
                }
            )
            await transaction.commit()
            return res.status(200).json(countries)
        } catch (e) {
            await transaction.rollback()
            console.log(e)
            return res.status(400).send(error400)
        }
    },
    createCountry: async (req, res) => {
        try {
            if (!req.body.slug && !req.body.name) {
                return res.status(400).send(400)
            }
            const transaction = await sequelize.transaction()
            try {
                const country = await Country.create(
                    {
                        slug: req.body.slug,
                        name: req.body.name
                    },
                    {transaction}
                )
                if (country) {
                    await transaction.commit()
                    return res.status(200).json(country)
                } else {
                    await transaction.rollback()
                    return res.status(400).send(error400)
                }
            } catch (e) {
                console.log(e)
                await transaction.rollback()
                return res.status(400).send(error400)
            }
        } catch (e) {
            console.log(e)
            return res.status(400).send(error400)
        }
    },
    deleteCountry: async (req, res) => {
        try {
            if (!req.body.id) {
                return res.status(400).send(error400)
            }
            const candidate = Country.findOne({
                where: {
                    id: req.body.id
                }
            })
            if (!candidate) {
                return res.status(400).send('Страна уже удалена из базы данных')
            }
            const transaction = await sequelize.transaction()
            try {
                const countryDestroy = await Country.destroy({
                    where: {
                        id: req.body.id
                    },
                    transaction
                })
                if (countryDestroy === 1) {
                    await transaction.commit()
                    return res.status(200).send('Страна удалена из базы данных')
                } else {
                    await transaction.rollback()
                    return res.status(400).send(error400)
                }
            } catch (e) {
                console.log(e)
                await transaction.rollback()
                return res.status(400).send(error400)
            }
        } catch (e) {
            console.log(e)
            return res.status(400).send(error400)
        }
    }
}