import * as assert from "assert";
import {inject, injectable} from "inversify";

import {Service} from "./service";
import {LanguageService} from "./language";
import {SentenceDbSchema} from "../db/schemas/sentence";
import {AppError} from "../app-error";
import {AppConfig} from "../app-config";
import {EsConnector} from "../es/connector";
import {iocTypes} from "../ioc-types";

@injectable()
export class SentenceService extends Service {
    constructor(@inject(iocTypes.SentenceDbSchema) sentenceDbSchema: SentenceDbSchema,
                @inject(iocTypes.LanguageService) private languageService: LanguageService) {
        super(sentenceDbSchema);
    }

    /**
     * Searches sentences in elasticsearch for sentences that match matchText, in the index belonging to the language with languageId
     *
     * Side effects: none
     *
     * @param matchText
     * @param languageId
     * @returns {Promise<any>}
     */
    async search({matchText, languageId}) {
        assert(matchText);
        assert(languageId);

        const searchBody = {
            _source: false, //we dont want the sentences themselves, just the ids
            query: {
                match: {
                    text: matchText
                }
            }
        };

        let index = null;
        switch (languageId) {
            case 'eng':
                index = `${AppConfig.config.es.sentenceIndexPrefix}english`;
                break;
            case 'spa':
                index = `${AppConfig.config.es.sentenceIndexPrefix}spanish`;
                break;
            case 'fra':
                index = `${AppConfig.config.es.sentenceIndexPrefix}french`;
                break;
            default:
                throw new AppError(`Unknown language id ${languageId}`, {code: `NO_INDEX_EXISTS_FOR_LANGUAGE_ID`});
        }

        const results = await EsConnector.connection.search({
            index: index,
            body: searchBody
        });

        if (!results || !results.hits) {
            throw new AppError(`Did not get results back from elasticsearch`, {code: `NO_RESULTS`});
        }

        const sentenceResultIds = results.hits.hits.map((hit) => hit._id);
        return this.getOne({id: sentenceResultIds})
    }

    async destroy(id) {
        //remove from db
        const removedSentence = await super.destroy(id);

        //remove from es
        const language = await this.languageService.getOne({id: removedSentence.languageId});

        if (!language) {
            throw new AppError(`Could not find language with id ${removedSentence.languageId}`, {code: `LANGUAGE_NOT_FOUND`});
        }

        const index = `${AppConfig.config.es.sentenceIndexPrefix}${language.englishName}`;

        const indexExists = await EsConnector.connection.indices.exists({
            index: index
        });

        if (!indexExists) {
            throw new AppError(`Index ${index} does not exist`, {code: `INDEX_NOT_FOUND`});
        }

        return EsConnector.connection.delete({
            index: index,
            type: AppConfig.config.es.sentenceType,
            id: removedSentence.id
        });
    }

    /**
     * Create a sentence in db and es
     *
     * Side effects:
     * * Creates records in db and es
     *
     * @param args
     * @returns {Promise<any>}
     */
    async create(args) {
        const sentence = await super.create(args);

        return this.indexInElasticsearch(sentence);
    }

    /**
     * Updates a sentence in db and es
     *
     * Side effects:
     * * updates a sentence in db and es
     *
     * @param args
     * @returns {Promise<any>}
     */
    async update(args) {
        const sentence = await super.update(args);

        return this.indexInElasticsearch(sentence);
    }

    /**
     * Creates/Updates a record in es
     *
     * Side effects:
     * * creates/updates a record in es
     *
     * @param sentence
     * @returns {Promise<void>}
     */
    private async indexInElasticsearch(sentence) {
        assert(sentence);

        const language = await this.languageService.getOne({id: sentence.languageId});

        if (!language) {
            throw new AppError(`Could not find language with id ${sentence.languageId}`, {code: `LANGUAGE_NOT_FOUND`});
        }

        const index = `${AppConfig.config.es.sentenceIndexPrefix}${language.englishName}`;

        const indexExists = await EsConnector.connection.indices.exists({
            index: index
        });

        if (!indexExists) {
            throw new AppError(`Index ${index} does not exist`, {code: `INDEX_NOT_FOUND`});
        }

        return EsConnector.connection.index({
            index: index,
            type: AppConfig.config.es.sentenceType,
            id: sentence.id,
            body: {
                text: sentence.text
            }
        });
    }
}
