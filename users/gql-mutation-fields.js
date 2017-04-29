import {GraphQLID, GraphQLNonNull, GraphQLString} from "graphql";

import {Type as User} from "./gql-type";
import {Service as UserService} from "./service";
import {GqlError} from "../gql-error";

export const mutationFields = {
    createUser: {
        type: User,
        args: {
            name: {
                type: GraphQLString
            },
            email: {
                type: new GraphQLNonNull(GraphQLString)
            },
            username: {
                type: new GraphQLNonNull(GraphQLString)
            },
            password: {
                type: new GraphQLNonNull(GraphQLString)
            }
        },
        resolve(_, args) {
            return UserService.create(args);
        }
    },
    updateUser: {
        type: User,
        args: {
            id: {
                type: new GraphQLNonNull(GraphQLID)
            },
            name: {
                type: GraphQLString
            },
            email: {
                type: GraphQLString
            },
            username: {
                type: GraphQLString
            },
            password: {
                type: GraphQLString
            }
        },
        resolve(_, args) {
            return UserService.update(args);
        }
    },
    destroyUser: {
        type: User,
        args: {
            id: {
                type: new GraphQLNonNull(GraphQLID)
            }
        },
        resolve(_, {id}) {
            return UserService.destroy(id);
        }
    },
    login: {
        type: User,
        args: {
            username: {
                type: new GraphQLNonNull(GraphQLString)
            },
            password: {
                type: new GraphQLNonNull(GraphQLString)
            }
        },
        async resolve (_, {username, password}) {
            try {
                await UserService.login(username, password)
            } catch (e) {
                console.error(e);

                switch (e.code) {
                    case 'INCORRECT_PASSWORD':
                    case 'USERNAME_NOT_FOUND':
                        throw new GqlError({data: {code: 'INCORRECT_USERNAME_OR_PASSWORD'}});
                    default:
                        throw new GqlError({data: {code: null}});
                }

            }
        }
    },
    register: {
        type: User,
        args: {
            email: {
                type: new GraphQLNonNull(GraphQLString)
            },
            password: {
                type: new GraphQLNonNull(GraphQLString)
            },
            name: {
                type: GraphQLString
            },
            username: {
                type: new GraphQLNonNull(GraphQLString)
            }
        },
        async resolve(_, args) {
            try {

                return UserService.register(args);
            } catch (e) {
                console.error(e);

                switch (e.code) {
                    case 'EMAIL_NOT_UNIQUE':
                    case 'USERNAME_NOT_UNIQUE':
                    case 'PASSWORD_NOT_SECURE':
                    case 'BAD_EMAIL_FORMAT':
                        throw new GqlError({data: {code: error.code}});
                    default:
                        throw new GqlError({data: {code: null}});
                }

            }
        }
    }
};

