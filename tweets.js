

// Get User Tweet timeline by user ID
// https://developer.twitter.com/en/docs/twitter-api/tweets/timelines/quick-start

const needle = require('needle');
const replaceAll = require('string.prototype.replaceall');
const termMap = require('./termMap')

// this is the ID for @TwitterDev



// The code below sets the bearer token from your environment variables
// To set environment variables on macOS or Linux, run the export command below from the terminal:
// export BEARER_TOKEN='YOUR-TOKEN'
const bearerToken = 'AAAAAAAAAAAAAAAAAAAAAMp2PgEAAAAAyvezDd7rmhYk%2BQ4PCg3Lb6uy498%3D66YUKBJG5IlCSQKwWUIGETT7irQRZA8kAgu0UfIExIooAO06hG';
const endpointURL = "https://api.twitter.com/2/users/by?usernames="
var url;
async function getRequest(username) {

    // These are the parameters for the API request
    // specify User names to fetch, and any additional fields that are required
    // by default, only the User ID, name and user name are returned
    const params = {
        usernames: username
    }

    // this is the HTTP header that adds bearer token authentication
    const res = await needle('get', endpointURL, params, {
        headers: {
            "User-Agent": "v2UserLookupJS",
            "authorization": `Bearer ${bearerToken}`
        }
    })

    if (res.body) {
        return res.body;
    } else {
        throw new Error('Unsuccessful request')
    }
}


const getUserTweets = async (username) => {
    //const ids = require('./getIds');
    const response = await getRequest(username);
    userId = response['data'][0]['id'];
    console.log(userId);
    url = await `https://api.twitter.com/2/users/${userId}/tweets`;
    let userTweets = [];

    // we request the author_id expansion so that we can print out the user name later
    let params = {
        "max_results": 100,
        "tweet.fields": "created_at",
        "expansions": "author_id"
    }

    const options = {
        headers: {
            "User-Agent": "v2UserTweetsJS",
            "authorization": `Bearer ${bearerToken}`
        }
    }

    let hasNextPage = true;
    let nextToken = null;
    let userName;
    console.log("Retrieving Tweets...");

    while (hasNextPage) {
        let resp = await getPage(params, options, nextToken);
        if (resp && resp.meta && resp.meta.result_count && resp.meta.result_count > 0) {
            userName = resp.includes.users[0].username;
            if (resp.data) {
                userTweets.push.apply(userTweets, resp.data);
            }
            if (resp.meta.next_token) {
                nextToken = resp.meta.next_token;
            } else {
                hasNextPage = false;
            }
        } else {
            hasNextPage = false;
        }
    }

//    console.dir(userTweets, {
//        depth: null
//    });
//    console.log(`Got ${userTweets.length} Tweets from ${userName} (user ID ${userId})!`);
    return userTweets;

}

const getPage = async (params, options, nextToken) => {
    if (nextToken) {
        params.pagination_token = nextToken;
    }

    try {
        const resp = await needle('get', url, params, options);

        if (resp.statusCode != 200) {
            console.log(`${resp.statusCode} ${resp.statusMessage}:\n${resp.body}`);
            return;
        }
        return resp.body;
    } catch (err) {
        throw new Error(`Request failed: ${err}`);
    }
}

const getTweets = async (username) => {
    var userTweets = await getUserTweets(username);
    
    var tweetStr = "";
    for(let i=0;i<userTweets.length;i++){
        tweetStr += userTweets[i]['text'];
    }
    
    var acts = "Arts and Culture, Astronomy, Auto and ATV, Biking, Boating, Camping, Canyoneering, Caving, Climbing, Compass and GPS, Dog Sledding, Fishing, Flying, Food, Golfing, Guided Tours, Hands-On, Hiking, Horse Trekking, Hunting and Gathering, Ice Skating, Junior Ranger Program, Living History, Museum Exhibits, Paddling, Park Film, Playground, Scuba Diving, Shopping, Skiing, Snorkeling, Snow Play, Snowmobiling, Snowshoeing, Surfing, Swimming, Team Sports, Tubing, Water Skiing, Wildlife Watching";
    
    var top = "African American Heritage, American Revolution, Ancient Seas, Animals, Archeology, Architecture and Building, Arctic, Arts, Asian American Heritage, Aviation, Banking, Birthplace, Burial, Canyons, Caves, Climate Change, Coasts, Colonization, Commerce, Dams, Dunes, Engineering, Enslavement, Estuaries, Explorers, Farming, Fire, Foothills, Forests, Forts, Fossils, Geology, Geothermal, Glaciers, Grasslands, Great Depression, Groundwater, Hispanic American Heritage, Immigration, Impact Craters, Incarceration, Industry, Laborer, Lakes, Landscape Design, Latino American Heritage, LGBTQ American Heritage, Maritime, Medicine, Migrations, Military, Monuments, Mountains, Music, Native American Heritage, Natural Sounds, Night Sky, Oceans, Pacific Islander Heritage, Presidents, Reconstruction, Religion, River, Rock, Scenic Views, Schools, Science, Social Movements, The Tropics, Thickets and Shrublands, Tragic Events, Trails, Transportation, Unique Species, Urban America, Volcanoeos, Wars, Waterfalls, Watersheds, Westward Expansion, Wetlands, Wilderness, Women's History";
    
    
    tweetStr= replaceAll(tweetStr,'\n','')
    tweetStr= replaceAll(tweetStr,'.',"");
    tweetStr= replaceAll(tweetStr,',',"");
    tweetStr = tweetStr.toLowerCase();
    var tweetList = tweetStr.split(' ');
    var tweetSet = new Set(tweetList);

    acts = acts.toLowerCase();
    acts = replaceAll(acts,',',"");
    acts= replaceAll(acts,'and ',"");
    acts= replaceAll(acts,'the ',"");
    var actsList = acts.split(" ");
    

    top = top.toLowerCase();
    top = replaceAll(top,',',"");
    top= replaceAll(top,'and ',"");
    top= replaceAll(top,'the ',"");
    var topList = top.split(" ");
    
    const actSet = new Set(actsList);
    const topSet = new Set(topList);
    const intersectionActs = new Set(
      [...actSet].filter(x => tweetSet.has(x)));
    const intersectionTop = new Set(
      [...topSet].filter(x => tweetSet.has(x)));
    const unionTerms = new Set([...intersectionActs, ...intersectionTop]);
    const unionList = Array.from(unionTerms);
    
    var finalList = new Array();
    unionList.forEach(function(element) {
        if (termMap.termMap[element] != null) {
            finalList.push(termMap.termMap[element]);
        }
    });
    return finalList;
    
}
module.exports.getTweets = getTweets;


