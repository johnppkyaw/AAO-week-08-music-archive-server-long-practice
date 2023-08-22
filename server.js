const http = require('http');
const fs = require('fs');

/* ============================ SERVER DATA ============================ */
let artists = JSON.parse(fs.readFileSync('./seeds/artists.json'));
let albums = JSON.parse(fs.readFileSync('./seeds/albums.json'));
let songs = JSON.parse(fs.readFileSync('./seeds/songs.json'));

let nextArtistId = 2;
let nextAlbumId = 2;
let nextSongId = 2;

// returns an artistId for a new artist
function getNewArtistId() {
  const newArtistId = nextArtistId;
  nextArtistId++;
  return newArtistId;
}

// returns an albumId for a new album
function getNewAlbumId() {
  const newAlbumId = nextAlbumId;
  nextAlbumId++;
  return newAlbumId;
}

// returns an songId for a new song
function getNewSongId() {
  const newSongId = nextSongId;
  nextSongId++;
  return newSongId;
}

/* ======================= PROCESS SERVER REQUESTS ======================= */
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // assemble the request body
  let reqBody = "";
  req.on("data", (data) => {
    reqBody += data;
  });

  req.on("end", () => { // finished assembling the entire request body
    // Parsing the body of the request depending on the "Content-Type" header
    if (reqBody) {
      switch (req.headers['content-type']) {
        case "application/json":
          req.body = JSON.parse(reqBody);
          break;
        case "application/x-www-form-urlencoded":
          req.body = reqBody
            .split("&")
            .map((keyValuePair) => keyValuePair.split("="))
            .map(([key, value]) => [key, value.replace(/\+/g, " ")])
            .map(([key, value]) => [key, decodeURIComponent(value)])
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {});
          break;
        default:
          break;
      }
      console.log(req.body);
    }

    /* ========================== ROUTE HANDLERS ========================== */

    //Get all the artists
    // GET /artists
    if(req.method === "GET" && req.url === "/artists") {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(Object.values(artists)));
    }

    // Get a specific artist's details based on artistId
    // GET /artists/:artistId
    if (req.method === "GET" && req.url.startsWith("/artists") && req.url.split('/').length === 3) {
      const artistId = reqUrlParts[2];
      const artist = artists[artistId];

      //if artist is not found (artistID does not exist)
      if(!artist) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          "error": "Artist not found"
        }));
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json')
      return res.end(JSON.stringify(artist));
    }

    const reqUrlParts = req.url.split('/');
    // Add an artist
    // POST /artists
    if (req.method === "POST" && req.url === '/artists') {
      const { name } = req.body;
      const artistId = getNewArtistId();
      artists[artistId] = {
        artistId: artistId,
        name: name
      }

      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(artists[artistId]));
    }

    //Edit a specified artist by artistId
    //PUT (PATCH) /artists/:artistId
    if ((req.method === "PUT" || req.method === "PATCH") && req.url.startsWith('/artists') && reqUrlParts.length === 3) {
      const { name } = req.body;
      const artistId = reqUrlParts[2];
      if(artists[artistId] === undefined) {
        res.code = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({"Error": "Artist not found"}))
      }
      artists[artistId].name = name;

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(artists[artistId]));
    }

    //Delete a specified artist by artistId
    //Delete /artists/:artistId
    if (req.method === 'DELETE' && req.url.startsWith('/artists') && reqUrlParts.length === 3) {
      const artistId = reqUrlParts[2];
      if (artists[artistId] === undefined) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({"Error": "Artist not found"}))
      }
      delete artists[artistId];
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({
        "message": "successfully deleted"
      }));
    }

    //Get all albums of a specific artist based on artistId
    //GET /artists/:artistId/albums
    if (req.method === "GET" && reqUrlParts[1] === "artists" && reqUrlParts[3] === "albums") {
      const artistId = reqUrlParts[2];
      const specAlbums = Object.values(albums).filter(album => album.artistId == artistId)

      if(specAlbums.length === 0) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({"Error": "Artist not found"}))
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify(specAlbums))
    }

    //Get a specific album's details based on albumId
    //Get /albums/:albumId
    if (req.method === "GET" && reqUrlParts[1] === "albums" && reqUrlParts.length === 3) {
      const albumId = reqUrlParts[2];

      if(albums[albumId] === undefined) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({"Error": "album not found"}))
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify(albums[albumId]))
    }

    //Add an album to a specific artist based on artistId
    //POST /artists/:artistId/albums
    if (req.method === "POST" && reqUrlParts[1] === "artists" && reqUrlParts[3] === "albums") {
      const { name } = req.body;
      const artistId = Number(reqUrlParts[2]);
      const albumId = getNewAlbumId();
      albums[albumId] = {
        albumId: albumId,
        name: name,
        artistId: artistId
      }
      if (name === undefined) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({"Error": "Something wrong with the req body; name not found"}))
      }
      if (artists[artistId] === undefined) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({"Error": "artist not found"}))
      }

      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify(albums[albumId]));
    }

    //Edit a specified album by albumId
    //PUT (or PATCH) /albums/:albumId

    if((req.method === "PUT" || req.method === "PATCH") && reqUrlParts[1] === "albums" && reqUrlParts.length === 3) {
      const { name } = req.body;
      const albumId = reqUrlParts[2];

      if (name === undefined) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({"Error": "Something wrong with the req body; name not found"}))
      }

      if (albums[albumId] === undefined) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({"Error": "album not found"}))
      }

      albums[albumId].name = name;
      albums[albumId].updatedAt = Date();
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify(albums[albumId]))

    }

    //Delete a specified album by albumId
    //DELETE /albums/:albumId
    if (req.method === "DELETE" && reqUrlParts[1] === "albums" && reqUrlParts.length === 3) {
      const albumId = reqUrlParts[2];

      if (albums[albumId] === undefined) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          "Error": "Album not found"
        }))
      }

      delete albums[albumId];
      res.statusCode = 200;
      res.setHeader('Content-Type', "application/json");
      return res.end(JSON.stringify({
        "message": "Successfully deleted"
      }))
    }

    //Get all songs of a specific artist based on artistId
    //GET /artists/:artistId/songs
    if (req.method === "GET" && reqUrlParts[1] === "artists" && reqUrlParts[3] === "songs") {
      const artistId = reqUrlParts[2];
      const artistAlbumIds = Object.values(albums)
      .filter(album => album.artistId == artistId)
      .map(album => album.albumId)

      if (artistAlbumIds.length === 0) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({
          "Error": "No songs by this artist found"
        }))
      }

      const artistSongs = Object.values(songs).filter(song => artistAlbumIds.includes(song.albumId));

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify(artistSongs));
    }

    //Get all songs of a specific album based on albumId
    //GET /albums/:albumId/songs
    if (req.method === "GET" && reqUrlParts[1] === "albums" && reqUrlParts[3] === "songs") {
      const albumId = Number(reqUrlParts[2]);
      const albumSongs = Object.values(songs).filter(song => song.albumId === albumId)

      if (albumSongs.length === 0) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({
          "Error": "No songs by this album found"
        }))
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify(albumSongs));
    }
    //Get all songs of a specified trackNumber
    //GET /trackNumbers/:trackNumber/songs
    if (req.method === "GET" && reqUrlParts[1] === "trackNumbers" && reqUrlParts[3] === 'songs') {
      const trackNumber = Number(reqUrlParts[2]);
      const songsbyTrackNum = Object.values(songs).filter(song => song.trackNumber === trackNumber);

      if (songsbyTrackNum.length === 0) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({
          "Error": "No songs by this tracking number found"
        }))
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify(songsbyTrackNum));
    }

    //Get a specific song's details based on songId
    //GET /songs/:songId
    if(req.method === "GET" && reqUrlParts[1] === "songs" && reqUrlParts.length === 3) {
      const songId = Number(reqUrlParts[2]);
      const targetSong = songs[songId];

      if (targetSong === undefined) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({
          "Error": "No song by this song ID found"
        }))
      }

      const albumId = targetSong.albumId;
      const targetAlbum = albums[albumId];
      const artistId = targetAlbum.artistId;
      targetSong.album = albums[albumId];
      targetSong.artist = artists[artistId];

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify(targetSong));
    }

    //Add a song to a specific album based on albumId
    //POST /albums/:albumId/songs
    if (req.method === "POST" && reqUrlParts[1] === "albums" && reqUrlParts[3] === "songs") {
      const {name, lyrics, trackNumber} = req.body;
      const albumId = Number(reqUrlParts[2]);

      //if name, lyrics or trackNumber is missing
      if(!name || !lyrics || !trackNumber) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({"Error": "Something wrong with the req body; name not found"}))
      }

      //if the album is not found
      if(albums[albumId] === undefined) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({
          "Error": "No album by this album ID found"
        }))
      }

      const songId = getNewSongId();
      songs[songId] = {
        songId: songId,
        name: name,
        trackNumber: trackNumber,
        albumId: albumId,
        lyrics: lyrics
      }
      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify(songs[songId]))
    }

    //Edit a specified song by songId
    //PATCH (or PUT) /songs/:songId
    if ((req.method === "PATCH" || req.method === "PUT") && reqUrlParts[1] === "songs" && reqUrlParts.length === 3) {
      const songId = Number(reqUrlParts[2]);
      const { name, lyrics, trackNumber } = req.body;

      //if name, lyrics or trackNumber is missing
      if(!name || !lyrics || !trackNumber) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({"Error": "Something wrong with the req body; name not found"}))
      }

      //if the song does not exist
      if(songs[songId] === undefined) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({
          "Error": "No song by this song ID found"
        }))
      }

      songs[songId].name = name;
      songs[songId].lyrics = lyrics;
      songs[songId].trackNumber = trackNumber;
      songs[songId].updatedAt = Date();

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify(songs[songId]))
    }

    //Delete a specified song by songId
    //DELETE /songs/:songId
    if ((req.method === "DELETE") && reqUrlParts[1] === "songs" && reqUrlParts.length === 3) {
      const songId = Number(reqUrlParts[2]);

      //if the song does not exist
      if(songs[songId] === undefined) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({
          "Error": "No song by this song ID found"
        }))
      }

      delete songs[songId];
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({
        "message": "deleted successfully"
      }))
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.write("Endpoint not found");
    return res.end();
  });
});

const port = 5000;

server.listen(port, () => console.log('Server is listening on port', port));
