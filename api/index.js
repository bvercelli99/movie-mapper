import * as cheerio from 'cheerio';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';


const OMDB_KEY = process.env.OMDB_API_KEY;
console.log(OMDB_KEY);

const app = express();

app.use(cors());

app.get('/api/search', async function (req, res) {
  try {

    if (req.query.title && req.query.title.length > 0) {
      let movies = await fetch(`https://www.omdbapi.com/?s=${req.query.title}&type=movie&apikey=${OMDB_KEY}`)
        .then(response => response.json())
        .then(data => data)
        .catch(error => console.log(error));

      res.send(movies);
    }
  }
  catch (error) {
    console.log(error)
    res.status(500).send(error);
  }

});

app.get('/api/movie/:id', async function (req, res) {
  try {
    let initialLocations = await scrapeInitialLocations(req.params.id); //first 5 locations

    if (initialLocations.length >= 5) {
      const extraLocations = await scrapeExtraLocations(req.params.id); //any extra locations
      initialLocations = [...initialLocations, ...extraLocations];
    }

    res.send(initialLocations);
  }
  catch (error) {
    console.log(error)
    res.status(500).send(error);
  }

});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on ${process.env.PORT}`);
});

async function scrapeInitialLocations(movieId) {
  let response;
  let html;

  try {
    response = await fetch(`https://www.imdb.com/title/${movieId}/locations`)
    html = await response.text();
  } catch (err) {
    console.error(`Error getting locations for movie: ${movieId}\n${err}`);
    return null;
  }

  if (response.status !== 200) {
    console.error(`${response.status} status code when scraping location for movie: ${movieId}`);
    return null;
  }

  const $ = cheerio.load(html);
  // get all the location links on the page
  const $locationElements = $('div[data-testid="sub-section-flmg_locations"] > div[data-testid="item-id"]');

  return $locationElements.map((i, el) => {
    // remove whitespace or newlines at beginning or end of the location text and description
    return {
      location: $(el).find('div > div:first-child > a').text().trim().replace(/\n/g, ''),
      desc: $(el).find('div > div:first-child > p').text().trim().replace(/\n|^\(|\)$/g, '')
    }
  }).get();
}

async function scrapeExtraLocations(movieId) {
  let response;

  try {
    response = await fetch(`https://caching.graphql.imdb.com/?operationName=TitleFilmingLocationsPaginated&variables=%7B%22after%22%3A%22bGMwMTE1Mjcz%22%2C%22const%22%3A%22${movieId}%22%2C%22first%22%3A50%2C%22locale%22%3A%22en-US%22%2C%22originalTitleText%22%3Afalse%7D&extensions=%7B%22persistedQuery%22%3A%7B%22sha256Hash%22%3A%229f2ac963d99baf72b7a108de141901f4caa8c03af2e1a08dfade64db843eff7b%22%2C%22version%22%3A1%7D%7D`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      }
    )
      .then(response => response.json())
      .then(data => data)
      .catch(error => console.log(error));

  } catch (err) {
    console.error(`Error getting locations for movie: ${movieId}\n${err}`);
    return null;
  }

  if (response.data?.title?.filmingLocations?.edges.length === 0) {
    console.error(`No locations found for movie: ${movieId}`);
    return null;
  }
  else {
    const locs = response.data.title.filmingLocations.edges;

    return locs.map(loc => {
      return {
        location: loc.node.location,
        desc: null != loc.node.displayableProperty.qualifiersInMarkdownList?.markdown ? loc.node.displayableProperty.qualifiersInMarkdownList.markdown : loc.node.location
      }
    })

  }
}