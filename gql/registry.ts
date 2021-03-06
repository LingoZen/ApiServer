import {graphiqlHapi, graphqlHapi} from "graphql-server-hapi";
import {formatError} from "apollo-errors";
import {List} from "immutable";
import {inject, injectable} from "inversify";

import {GqlRootSchema} from "./root-schema";
import {iocTypes} from "../ioc-types";

@injectable()
export class GqlRegistry {
    private endPoints: List<any>;

    constructor(@inject(iocTypes.GqlRootSchema) private rootSchema: GqlRootSchema) {
        this.endPoints = List();

        this.addNormalEndpoint();
        if (process.env.NODE_ENV === 'development') {
            this.addDebugEndpoint();
        }
    }

    public getEndpoints() {
        return this.endPoints.toArray();
    }

    private addNormalEndpoint() {
        this.endPoints = this.endPoints.push({
            register: graphqlHapi,
            options: {
                path: '/api/gql',
                graphqlOptions: {
                    formatError: formatError,
                    schema: this.rootSchema.schema,
                },
                route: {
                    cors: true
                }
            }
        });
    }

    private addDebugEndpoint() {
        this.endPoints = this.endPoints.push({
            register: graphiqlHapi,
            options: {
                path: '/api/giql',
                graphiqlOptions: {
                    endpointURL: '/api/gql',
                },
            }
        });
    }
}
