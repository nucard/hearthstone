export class Config {
    public algoliaAppId = process.env.ALGOLIA_APPID || 'Algolia AppId not configured';
    public algoliaApiKey = process.env.ALGOLIA_APIKEY || 'Algolia API key not configured';
    public firebaseProjectId = process.env.FIREBASE_PROJECTID || '';
    public firebasePrivateKey = (process.env.FIREBASE_PRIVATEKEY || '').replace(/\\n/g, '\n');
    public firebaseClientEmail = process.env.FIREBASE_CLIENTEMAIL || '';

    public port = process.env.PORT || 27633;
}