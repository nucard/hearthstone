import * as algoliasearch from 'algoliasearch';
import * as firebase from 'firebase-admin';
import * as _ from 'lodash';
import { DocumentReference, DocumentSnapshot } from '@google-cloud/firestore';
import { NcCard, NcExternalInfoProvider, NcFaction } from '@nucard/models';
import { Config } from '../config';

export class DatabaseService {
    constructor(private config: Config) { }

    private getFirebaseClient() {
        if (firebase.apps.length === 0) {
            firebase.initializeApp({
                credential: firebase.credential.cert({
                    projectId: this.config.firebaseProjectId,
                    privateKey: this.config.firebasePrivateKey,
                    clientEmail: this.config.firebaseClientEmail,
                })
            });
        }

        return firebase.firestore();
    }

    public async getCard(cardId: string): Promise<NcCard | null> {
        const cardDoc = await this
            .getFirebaseClient()
            .collection('cards')
            .doc(cardId)
            .get();

        if (cardDoc.exists) {
            return cardDoc.data() as NcCard;
        }

        return null;
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
        const cardsSnapshot = await this
            .getFirebaseClient()
            .collection('cards')
            .get();

        const cards: NcCard[] = [];
        cardsSnapshot.forEach(doc => {
            if (doc.exists) {
                cards.push(doc.data() as NcCard);
            }
        });

        if (cards.length) {
            return cards[_.random(cards.length - 1)];
        }

        return null;
    }

    public async search(query: string): Promise<NcCard[]> {
        return new Promise<NcCard[]>((resolve, reject) => {
            const results = [];
            const algoliaClient = algoliasearch(this.config.algoliaAppId, this.config.algoliaApiKey);
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
