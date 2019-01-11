const axios = require("axios");
const camelCase = require("lodash.camelcase");

module.exports = function(context, req) {
  CMS_CLIENT_ENDPOINT = process.env["CMS_CLIENT_ENDPOINT"];
  CONTENTFUL_SPACE_VALUE = process.env["CONTENTFUL_SPACE_VALUE"];
  CONTENTFUL_ACCESS_TOKEN = process.env["CONTENTFUL_ACCESS_TOKEN"];
  CONTENTFUL_ENV = process.env["CONTENTFUL_ENV"];

  let newQueryParams = generateParams(req);
  let cms_endpoint = `${CMS_CLIENT_ENDPOINT}/spaces/${CONTENTFUL_SPACE_VALUE}/environments/${CONTENTFUL_ENV}/entries?access_token=${CONTENTFUL_ACCESS_TOKEN}&content_type=content_block&select=fields${newQueryParams}&limit=1000`;

  axios
    .get(cms_endpoint)
    .then(response => {
      try {
        context.res = {
          status: response.status,
          body: cleanBody(response, newQueryParams),
          headers: {
            "Content-Type": "application/json",
            "Custom-Header": "woots"
          }
        };
        context.done();
      } catch (error) {
        HandleError(error);
      }
    })
    .catch(error => HandleError(error));
};

function generateParams(req) {
  if (req.params.id) return generatePathParams(req);
  return generateQueryParams(req);
}

function generateQueryParams(req) {
  let newQueryParams = "";
  for (var propName in req.query) {
    if (["category", "type", "title", "id"].indexOf(propName.replace(/\W/g, '')) > -1) {
      newPropName = propName.includes("[]")
        ? propName.replace("[]", "[in]")
        : propName + "[in]";
      newQueryParams += `&fields.${newPropName}=${req.query[propName]}`;
    }
  }
  return newQueryParams;
}

function generatePathParams(req) {
    return `&fields.id[in]=${req.params.id}`;
}

function cleanBody(response, newQueryParams) {
  let body;
  if (response.data.items.length == 1 && !newQueryParams)
    body = { contentBlock: CleanFieldsObject(response.data.items[0]) };
  else {
    body = {
      contentblocks: response.data.items.map(item => CleanFieldsObject(item))
    };
  }
  return body;
}

function CleanFieldsObject(item) {
  let newFields = {};

  for (var camel in item.fields) {
    newFields[camelCase(camel)] = item.fields[camel];
  }

  return newFields;
}

function HandleError(error) {
  console.log(error);
  context.res = {
    status: 500
  };
  context.done();
}
