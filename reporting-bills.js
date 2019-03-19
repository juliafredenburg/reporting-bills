// Imports
const getJSON = require('get-json');
const moment = require('moment');
const bluebird = require('bluebird');
const rp = require('request-promise');

// Constants
const matterIndexesUrl = 'https://webapi.legistar.com/v1/nyc/MatterIndexes/?$filter=MatterIndexName+eq+%27Report Required%27&$orderby=MatterIndexLastModifiedUtc desc&token=Uvxb0j9syjm3aI8h46DhQvnX5skN4aSUL0x_Ee3ty9M.ew0KICAiVmVyc2lvbiI6IDEsDQogICJOYW1lIjogIk5ZQyByZWFkIHRva2VuIDIwMTcxMDI2IiwNCiAgIkRhdGUiOiAiMjAxNy0xMC0yNlQxNjoyNjo1Mi42ODM0MDYtMDU6MDAiLA0KICAiV3JpdGUiOiBmYWxzZQ0KfQ';

let logError = function (error) {
  console.log(error);
};

function getMatterURL(matterIndex) {
  let matterUrl = `https://webapi.legistar.com/v1/nyc/Matters/${matterIndex.MatterIndexMatterId}/?token=Uvxb0j9syjm3aI8h46DhQvnX5skN4aSUL0x_Ee3ty9M.ew0KICAiVmVyc2lvbiI6IDEsDQogICJOYW1lIjogIk5ZQyByZWFkIHRva2VuIDIwMTcxMDI2IiwNCiAgIkRhdGUiOiAiMjAxNy0xMC0yNlQxNjoyNjo1Mi42ODM0MDYtMDU6MDAiLA0KICAiV3JpdGUiOiBmYWxzZQ0KfQ`;
  return matterUrl;
};

function getFilteredMatterURLs(matterIndexes) {
  let matterUrls = [];
  let filteredMatterIndexes = matterIndexes.filter(matterIndex => moment(matterIndex.MatterIndexLastModifiedUtc).isAfter(moment().subtract(1, 'months')));
  filteredMatterIndexes.forEach((matterIndex) => {
    matterUrls.push(getMatterURL(matterIndex));
  });
  return matterUrls;
};

function fetchAllJSONs(urls) {
  const funcs = urls.map(url => () => getJSON(url).catch(logError));

  let requestsPromise = bluebird.mapSeries(funcs, function (eachStep) {
    return eachStep();
  });

  return requestsPromise;
};

function postAll(objects) {
  const funcs = objects.map(object => () => rp(object).catch(logError));

  let requestsPromise = bluebird.mapSeries(funcs, function (eachStep) {
    return eachStep();
  });

  return requestsPromise;
};

function pushBillsToTrello(matterIndexes) {
  console.log('attachmentUrls', attachmentUrls.length);
  let objects = [];
  let matterUrls = getFilteredMatterURLs(matterIndexes);
  fetchAllJSONs(matterUrls).then(function (bills) {

    bills.forEach(function (bill) {
      if (typeof bill !== 'undefined') {
        let intUrl = `https://laws.council.nyc.gov/legislation/${bill.MatterFile.replace(/\s+/g, '-').toLowerCase()}/`;
        // [ ] TODO: test if creating a duplicate
        if (!attachmentUrls.includes(intUrl)) { // bill is not already on Trello

          var options = {
              method: 'POST',
              uri: 'https://api.trello.com/1/cards',
              body: {
                  name: bill.MatterName,
                  desc: `(${bill.MatterBodyName}) ${bill.MatterFile}: ${bill.MatterEXText5}`,
                  urlSource: intUrl,
                  idList: '5c90764ee92fe2019cc7e371',
                  keepFromSource: 'all',
                  key: '9e5b740d17b32716183d099441538b25',
                  token: 'ee3a44f2d1a75235f80a5d51e03f52d489ae01d2e25f6d24f2a5f821c7fd4603',
                },
              json: true, // Automatically stringifies the body to JSON

            };
          objects.push(options);

        }
      }
    });

    postAll(objects).then(function (trelloResults) {
      console.log('trelloResults', trelloResults.length);
    });

    console.log('cards added to trello', objects.length);

    return bills;
  }).catch(logError);

};



// getJSON
// pushBillsToTrello
// getFilteredMatterURLs
// fetchAllJSONs
// postEachBilltoTrello
// getBillInfo
//forEach(billinfo) post bill info to trello

// get bill name, summary, date, committee - what they are called (bills.Matter)
// use those names and insert them into the Trello API url to create new cards with those values

// prevent duplicates - get all card url attachments, make array, and check if the url is already in the array
// https://api.trello.com/1/boards/xWwamKEx/cards?attachments=true&attachment_fields=url&key=9e5b740d17b32716183d099441538b25&token=ee3a44f2d1a75235f80a5d51e03f52d489ae01d2e25f6d24f2a5f821c7fd4603

let attachTrello = {
    uri: 'https://api.trello.com/1/boards/99kqdejD/cards',
    method: 'GET',
    qs: {
        filter: 'all',
        attachments: 'true',
        fields: 'attachments',
        attachment_fields: 'url',
        key: '9e5b740d17b32716183d099441538b25',
        token: 'ee3a44f2d1a75235f80a5d51e03f52d489ae01d2e25f6d24f2a5f821c7fd4603',
      },
    headers: {
        'User-Agent': 'Request-Promise',
      },
    json: true, // Automatically parses the JSON string in the response
  };
let attachmentUrls = [];
rp(attachTrello)
    .then(function (cards) {
        cards.forEach(function (card) {
          card.attachments.forEach(function (attachment) {
            //  console.log('cardAttachment.url', cardAttachment.url);
            attachmentUrls.push(attachment.url);
          });
        });
        // Everything following attachmentUrls goes here
        // Get MatterIndexes
        getJSON(matterIndexesUrl)
          .then(pushBillsToTrello)
          .catch(logError);


        // End of Everything following attachmentUrls goes here
      })
    .catch(function (err) {
        // API call failed...
      });




// automate running of script daily
