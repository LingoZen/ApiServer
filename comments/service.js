const {Comment} = require('./db-schema');

async function getComment(args) {
    return Comment.findOne({where: args});
}

async function getComments(args) {
    return Comment.findAll({where: args});
}

async function create(args) {
    return Comment.create(args);
}

async function update(args) {
    let id = args.id;
    delete args.id;

    await Comment.update(args, {where: {id: id}, limit: 1});
    return getComment({id: id});
}

async function destroy(id) {
    const comment = getComment({id: id});
    if (!comment) {
        throw new Error(`Comment with id ${id} not found`);
    }

    await Comment.destroy({where: {id: id}});
    return comment
}

module.exports.Service = {
    getComment: getComment,
    getComments: getComments,

    create: create,
    update: update,
    destroy: destroy
};
