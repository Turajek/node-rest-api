
const db = require('../../models');
const User = db.User;
const Sequelize = require('sequelize');
const Op = Sequelize.Op
const bcrypt = require('bcryptjs')

const { validationResult } = require('express-validator/check');
const getOrder = (sort) => {
    switch (sort) {
        case '1':
            return [['createdAt', 'DESC']];
        case '2':
            return [['createdAt', 'ASC']];
        default:
            return [['id', 'ASC']];
    }
}
exports.addUser = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Validation failed, entered data is incorrect',
            errors: errors.array()
        })
    }
    const email = req.body.email;
    const password = req.body.password;
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const role_id = req.body.role_id;
    bcrypt.hash(password, 12).then(hashPass => {
        User.create({
            email, first_name, last_name, role_id, password: hashPass
        }).then(user => {
            res.status(201).json({ message: "User created successfully" })
        }).catch(err => {
            next(new Error(err));

        })
    }).catch(err => {
        next(new Error(err));
    })
}

exports.editUser = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Validation failed, entered data is incorrect',
            errors: errors.array()
        })
    }
    User.update(req.body, { where: { id: req.params.userId } }).then(user => {
        res.status(201).json({ message: 'User was edited successfully', user });
    }).catch(err => {
        next(new Error(err));
    });
};

exports.deleteUser = (req, res, next) => {
    User.destroy({ where: { id: req.params.userId } }).then(() => {
        res.status(200).json({ message: 'User was deleted successfully' });
    }).catch(err => {
        next(new Error(err));
    });
}
exports.getUsers = (req, res, next) => {
    const order = getOrder(req.query.order);
    const limit = Number(req.query.limit) || 5;
    const page = req.query.page || 1;
    const offset = limit * (page - 1);
    const where = req.query.role_id ? { role_id: req.query.role_id } : {};
    if (req.query.filter) {
        where.first_name = {
            [Op.substring]: req.query.filter
        };
    }
    User.findAndCountAll({
        order, limit, offset, where
    }).then(result => {
        let users = result.rows;
        for (var i = 0; i < users.length; i++) {
            users[i].password = undefined;
        }
        const page_all = Math.ceil(result.count / limit)
        res.status(200).json({ users, page_all });
    }).catch(err => {
        next(new Error(err));
    });
};
