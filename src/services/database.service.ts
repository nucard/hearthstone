import * as algoliasearch from 'algoliasearch';
import * as firebase from 'firebase-admin';
import * as _ from 'lodash';
import { DocumentReference, DocumentSnapshot } from '@google-cloud/firestore';
import { NcCard, NcExternalInfoProvider, NcFaction } from '@nucard/models';
import { Config } from '../config';

export class DatabaseService {
    private static INSTANCE: DatabaseService = new DatabaseService();

    public static async create(config: Config): Promise<DatabaseService> {
        // this seems dangerous because of changing a singleton's property
        this.INSTANCE._config = config;
        await this.INSTANCE.cacheCards();
        return this.INSTANCE;
    }

    private _config: Config = new Config();
    private _cardCache: NcCard[] = [];

    private constructor() { }

    private getFirebaseClient() {
        if (firebase.apps.length === 0) {
            firebase.initializeApp({
                credential: firebase.credential.cert({
                    projectId: this._config.firebaseProjectId,
                    privateKey: this._config.firebasePrivateKey,
                    clientEmail: this._config.firebaseClientEmail,
                })
            });
        }

        return firebase.firestore();
    }

    private async cacheCards(): Promise<void> {
        // only do this once in-mem
        if (this._cardCache.length !== 0) { return; }

        const cardsSnapshot = await this
            .getFirebaseClient()
            .collection('cards')
            .get();

        cardsSnapshot.forEach(doc => {
            if (doc.exists) {
                this._cardCache.push(doc.data() as NcCard);
            }
        });
    }

    public async getCard(cardId: string): Promise<NcCard | null> {
        return this._cardCache.find(c => c.id === cardId) || null;
    }

    public getExternalInfoProviders(card: NcCard): Promise<NcExternalInfoProvider[]> {
        const hearthheadName = card.name.replace(/\s/g, '-').toLowerCase();
        const icyVeinsName = card.name.replace(/[^a-zA-Z\d]/g, '-').toLowerCase();
        const icyVeinsFaction = (card.factionId || 'neutral').toLowerCase();

        return Promise.resolve([
            {
                name: 'Hearthhead',
                icon: 'https://imgur.com/axxMNuA.png',
                url: `https://www.hearthhead.com/cards/${hearthheadName}`,
            },
            {
                name: 'Icy Veins',
                icon: 'https://i.imgur.com/Q634fnZ.png',
                url: `https://icy-veins.com/hearthstone/cards/${icyVeinsFaction}/${icyVeinsName}`,
            },
        ]);
    }

    public getFactions(): Promise<NcFaction[]> {
        return Promise.resolve([
            {
                id: 'DRUID',
                name: 'Druid',
            },
            {
                id: 'HUNTER',
                name: 'Hunter',
            },
            {
                id: 'MAGE',
                name: 'Mage',
            },
            {
                id: 'PALADIN',
                name: 'Paladin',
            },
            {
                id: 'PRIEST',
                name: 'Priest',
            },
            {
                id: 'ROGUE',
                name: 'Rogue',
            },
            {
                id: 'SHAMAN',
                name: 'Shaman',
            },
            {
                id: 'WARLOCK',
                name: 'Warlock',
            },
            {
                id: 'WARRIOR',
                name: 'Warrior',
            },
        ]);
    }

    public async getRandomCard(): Promise<NcCard | null> {
        return this._cardCache[_.random(this._cardCache.length - 1)];
    }

    public async search(query: string): Promise<NcCard[]> {
        return new Promise<NcCard[]>((resolve, reject) => {
            const results = [];
            const algoliaClient = algoliasearch(this._config.algoliaAppId, this._config.algoliaApiKey);
            const index = algoliaClient.initIndex('cards');

            index.search({ query, hitsPerPage: 10 }, async (err: any, content: any) => {
                if (err) {
                    throw err;
                }

                // algolia gives us matching cards with content.hits - we need to merge the ids returned from algolia
                // with data from our firebase database
                const firebaseClient = this.getFirebaseClient();
                const docRefs: DocumentReference[] = [];

                for (const result of content.hits) {
                    docRefs.push(firebaseClient.doc(`cards/${result.objectID}`));
                }

                const docs = await this.getFirebaseClient().getAll(...docRefs);
                const cards: NcCard[] = docs.map((d: DocumentSnapshot) => d.data() as NcCard);
                resolve(cards);
            });
        });
    }
}
