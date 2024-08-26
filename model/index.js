import {sequelize} from "../database.js";
import {DataTypes} from "sequelize";

const User = sequelize.define('user', {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, allowNull: false, primaryKey: true},
    username: {type: DataTypes.STRING, unique: true, allowNull: false},
    password: {type: DataTypes.STRING, allowNull: false},
    nickname: {type: DataTypes.STRING, unique: true, allowNull: false},
    money: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    roleId: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'roles', key: 'id'}}
})

const Credential = sequelize.define('credential', {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, allowNull: false, primaryKey: true},
    url: {type: DataTypes.STRING, allowNull: false},
    status: {type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false}
})

const Country = sequelize.define('country', {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, allowNull: false, primaryKey: true},
    slug: {type: DataTypes.STRING, unique: true, allowNull: false},
    name: {type: DataTypes.STRING, allowNull: false}
})

const Role = sequelize.define('role', {
    id: {type: DataTypes.INTEGER, unique: true, autoIncrement: true, allowNull: false, primaryKey: true},
    name: {type: DataTypes.STRING, unique: true, allowNull: false}
})

const General = sequelize.define('general', {
    moneys: {type: DataTypes.INTEGER}
})

User.hasMany(Credential)
Credential.belongsTo(User)

Country.hasMany(Credential)
Credential.belongsTo(Country)

Role.hasMany(User)
User.belongsTo(Role)

export {User, Credential, Country, Role, General}