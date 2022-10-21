const asana = require("asana");



//Struktor Asana client
    const personalAccessToken =
        "1/1203140742610165:33fe82ed9fba0faa894e2e1a2c11ee1a";
    var client = asana.Client.create().useAccessToken(personalAccessToken);

//Create a project in a workspace
    client.projects
        .createProjectForWorkspace(1203140742610175, {
        name: "Last-Test",
        color: "light-green",
    })
        .then((result) => {
        console.log(result);
    });
//google dirve in project
    let googleDrive = 
    {
        resource_subtype: "external",
        url: "https://drive.google.com/drive/my-drive",
        name: "Kunden Ordner",
        parent: 1203140703561345 + "",
    };

    client.dispatcher.debug(true);
        client.dispatcher
        .post("/attachments", googleDrive)
            .catch((e) => console.log(e));

//Connection to google drive

    const fs = require("fs").promises;
    const path = require("path");
    const process = require("process");
    const { authenticate } = require("@google-cloud/local-auth");
    const { google } = require("googleapis");

// Wenn Sie diese Bereiche ändern, löschen Sie token.json
    const SCOPES =
    [
    "https://www.googleapis.com/auth/drive.metadata.readonly",
    "https://www.googleapis.com/auth/drive",
    ];

    const TOKEN_PATH = path.join(process.cwd(), "token.json");
    const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

// Liest zuvor autorisierte Anmeldeinformationen aus der Sicherungsdatei.
    async function loadSavedCredentialsIfExist() 
    {
        try {
                const content = await fs.readFile(TOKEN_PATH);
                const credentials = JSON.parse(content);
                return google.auth.fromJSON(credentials);
            }   catch (err)
        {
            return null;
        }
    }
// Serialisiert Anmeldeinformationen in eine Datei, die mit Google AUth.fromJSON kompatibel ist.
    async function saveCredentials(client)
     {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify(
        {
            type: "authorized_user",
            client_id: key.client_id,
            client_secret: key.client_secret,
            refresh_token: client.credentials.refresh_token,
        });
    await fs.writeFile(TOKEN_PATH, payload);
    }

// Laden oder Anfordern oder Autorisierung zum Aufrufen von APIs
    async function authorize()
    {
        let client = await loadSavedCredentialsIfExist();
        if (client)
    {
        return client;
    }
    client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

// Listet die Namen und IDs von bis zu 10 Dateien auf

async function listFiles(authClient) {
  const drive = google.drive({ version: "v3", auth: authClient });
  const res = await drive.files.list({
    pageSize: 10,
    fields: "nextPageToken, files(id, name)",
  });
  const files = res.data.files;
  if (files.length === 0) {
    console.log("No files found.");
    return;
  }
  console.log("Files:");
  files.map((file) => {
    console.log(`${file.name} (${file.id})`);
  });
}
authorize().then(listFiles).catch(console.error);

// Ordner in Google Drive erstellen

async function createFolder(authClient) {
  const drive = google.drive({ version: "v3", auth: authClient });
  const fileMetadata = {
    name: "Invoices",
    mimeType: "application/vnd.google-apps.folder",
  };
  const file = await drive.files.create({
    resource: fileMetadata,
    fields: "id",
  });
  console.log("Folder Id:", file.data.id);
  return file.data.id;
}
authorize().then(createFolder).catch(console.error);