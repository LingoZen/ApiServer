import hapi from 'hapi';

import {esConnection} from './es';
import {config} from './config';
import {gqlRegistry} from './gql-registry';

const server = new hapi.Server();

// Configure the api server
server.connection({
    host: config.server.host,
    port: config.server.portNumber
});

//register apollo with server
server.register(gqlRegistry, (err) => {
    if (err) {
        return console.error(err);
    }

    //make sure es cluster is up
    return esConnection.ping({
        requestTimeout: Infinity
    }, (err) => {
        if (err) {
            return console.error(err);
        }

        //start the server
        return server.start(() => {
            console.info(`Started server at ${JSON.stringify(server.info.uri)}`);
            console.info(`Environment: ${process.env.NODE_ENV}`);
        });
    });
});
