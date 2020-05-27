const fs = require('fs');
const {google} = require('googleapis');
const creds = 'credentials.json';
const token = 'token.json';

fs.readFile(creds,(err,data) => {
    if (err) return console.log('There was an error reading credentials.json. ',err);
    authorise(JSON.parse(data),listfiles);
});
function authorise(auth,callback){
    const {client_id,client_secret,redirect_uris} = auth.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id,client_secret,redirect_uris[0]);
    
    fs.readFile(token,(err,data)=>{
        if (err) return console.log('Please contact adminstrator for token.', err);
        oAuth2Client.setCredentials(JSON.parse(data));
        callback(oAuth2Client);
    });
}
function listfiles(auth){
    const file_ids_array = [];
    const file_names = [];
    const drive = google.drive({
        version:'v3',
        auth
    });
    drive.files.list({
        pageSize: 10,
        fields: 'nextPageToken, files(id,name)'
    },(err,res) => {
        if (err) return console.log('The API returned an error.',err);
        const files = res.data.files;
        if (files.length != 0){
            files.map((file)=>{
                fs.appendFileSync('filenames.txt',`${file.name}` +'\t\t\t\t\t\t\t\t' + `${file.id}`);
                console.log(`${file.name}`+'\t\t\t\t\t\t\t\t'+`${file.id}`);
                file_ids_array.push(`${file.id}`);
                file_names.push(`${file.name}`);
            });
        } else {
            console.log('Error.. No files found');
        }
    download(file_ids_array,file_names,auth);
    });
}

function download(file_ids_array,file_names,auth){
    console.log('\n');
    console.log('[+]Downloading!!!!!');
    var i = 0;
    const drive = google.drive({
        version:'v3',
        auth
    });
    file_ids_array.forEach(fileId => {
        console.log(fileId);
        if (fileId != null){
            var dest = fs.createWriteStream(`${file_names[i]}`);
            drive.files.get({
                fileId: fileId,
                alt:'media',
            },{
                responseType: 'stream'
            },
            function(err,res){
                res.data
                .on('end',()=>{
                    console.log('[+]Download Success for file '+`${fileId}`);
                })
                .on('error',(err)=> {
                    console.log('[-]Download Failed for file' + `${fileId}`);
                })
                .pipe(dest);
            });
           }   i=i+1;
        });
    }
